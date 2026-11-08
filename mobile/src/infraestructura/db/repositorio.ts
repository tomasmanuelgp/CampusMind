// SPDX-License-Identifier: AGPL-3.0-only
import { openDatabaseSync } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { Captura } from '../../dominio/tipos';
import { calibracionParaCaptura } from '../../dominio/privacidad';
import {
  COLUMNAS,
  SQL_ESQUEMA,
  VERSION_ESQUEMA,
  capturaAFila,
  filaARegistro,
  registrosACsv,
  type Fila,
  type Registro,
} from './esquema';

export type { Registro } from './esquema';

let conexion: ReturnType<typeof openDatabaseSync> | null = null;

function db() {
  if (!conexion) {
    const nueva = openDatabaseSync('refluye.db');
    nueva.execSync('PRAGMA journal_mode = WAL;');
    migrar(nueva);
    conexion = nueva;
  }
  return conexion;
}

/**
 * v0 → v2: base nueva. v1 → v2: copia cada captura JSON a columnas tipadas,
 * quita el nombre del responsable de calibración y la MAC del equipo, y borra
 * la tabla antigua. Todo en una transacción: si algo falla, nada cambia.
 */
function migrar(base: ReturnType<typeof openDatabaseSync>) {
  const version = base.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (version >= VERSION_ESQUEMA) return;
  base.withTransactionSync(() => {
    base.execSync(SQL_ESQUEMA);
    const existeV1 = base.getFirstSync<{ n: number }>(
      "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='capturas'",
    )?.n;
    if (existeV1) {
      const filas = base.getAllSync<{ datos: string; completa: number; resultado: string | null }>(
        'SELECT datos, completa, resultado FROM capturas',
      );
      for (const fila of filas) {
        const anterior = JSON.parse(fila.datos) as Captura;
        const captura: Captura = {
          ...anterior,
          equipo: referenciaEquipo(anterior.equipo, base),
          calibracion: calibracionParaCaptura(anterior.calibracion),
        };
        const resultado = fila.completa && fila.resultado ? JSON.parse(fila.resultado) : null;
        insertar(base, capturaAFila(captura, resultado, captura.lectura.recibidaEn));
      }
      base.execSync('DROP TABLE capturas;');
    }
    base.execSync(`PRAGMA user_version = ${VERSION_ESQUEMA};`);
  });
}

const marcadores = COLUMNAS.map(() => '?').join(', ');
const actualizables = COLUMNAS.filter(c => c !== 'id' && c !== 'creada_utc')
  .map(c => `${c}=excluded.${c}`)
  .join(', ');

function insertar(base: ReturnType<typeof openDatabaseSync>, fila: Fila) {
  base.runSync(
    `INSERT INTO medicion (${COLUMNAS.join(', ')}) VALUES (${marcadores})
    ON CONFLICT(id) DO UPDATE SET ${actualizables} WHERE medicion.estado='borrador'`,
    ...COLUMNAS.map(c => fila[c]),
  );
}

/**
 * Referencia local y estable de un equipo, sin exponer su dirección MAC.
 * La MAC solo queda en los ajustes, porque hace falta para reconectar.
 */
export function referenciaEquipo(mac: string, base = db()): string {
  if (mac === 'DEMO') return 'DEMO';
  const clave = 'equipo-ref:' + mac;
  const existente = base.getFirstSync<{ valor: string }>(
    'SELECT valor FROM ajustes WHERE clave = ?',
    clave,
  )?.valor;
  if (existente) return existente;
  const nueva = 'equipo-' + randomUUID();
  base.runSync('INSERT INTO ajustes(clave, valor) VALUES (?, ?)', clave, nueva);
  return nueva;
}

export function guardarAjuste(clave: string, valor: string) {
  db().runSync('INSERT OR REPLACE INTO ajustes(clave, valor) VALUES (?, ?)', clave, valor);
}
export function leerAjuste(clave: string): string | null {
  return (
    db().getFirstSync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', clave)?.valor ?? null
  );
}
export function guardarBorrador(captura: Captura) {
  insertar(db(), capturaAFila(captura, null, Date.now()));
}
export function completarCaptura(captura: Captura, resultado: unknown) {
  db().withTransactionSync(() => {
    guardarBorrador(captura);
    const fila = capturaAFila(captura, resultado, Date.now());
    const columnas = [
      'estado',
      'version_motor',
      'nivel',
      'regla_principal',
      'reglas_json',
      'plan',
      'ica_app',
      'confiable',
      'resultado_json',
    ] as const;
    db().runSync(
      `UPDATE medicion SET ${columnas.map(c => c + '=?').join(', ')} WHERE id=? AND estado='borrador'`,
      ...columnas.map(c => fila[c]),
      captura.id,
    );
  });
}
export function listarCapturas(limite = 100, desde = 0): Registro[] {
  return db()
    .getAllSync<Fila>('SELECT * FROM medicion ORDER BY recibida_ms DESC LIMIT ? OFFSET ?', limite, desde)
    .map(filaARegistro);
}
export function contarCapturas(): number {
  return db().getFirstSync<{ n: number }>('SELECT count(*) AS n FROM medicion')?.n ?? 0;
}
export function obtenerCaptura(id: string): Registro | null {
  const fila = db().getFirstSync<Fila>('SELECT * FROM medicion WHERE id=?', id);
  return fila ? filaARegistro(fila) : null;
}
/** Derecho de supresión: borra una medición y su avance de protocolo. */
export function borrarCaptura(id: string) {
  db().withTransactionSync(() => {
    db().runSync('DELETE FROM medicion WHERE id=?', id);
    db().runSync('DELETE FROM ajustes WHERE clave=?', 'progreso:' + id);
  });
}
/** Derecho de supresión: borra todas las mediciones. Conserva el equipo y la calibración. */
export function borrarTodo() {
  db().withTransactionSync(() => {
    db().runSync('DELETE FROM medicion');
    db().runSync("DELETE FROM ajustes WHERE clave LIKE 'progreso:%'");
  });
}
/** Derecho de acceso: todas las mediciones en CSV, con el diccionario de docs/datos.md. */
export function exportarCsv(): string {
  return registrosACsv(db().getAllSync<Fila>('SELECT * FROM medicion ORDER BY recibida_ms DESC'));
}
