import { openDatabaseSync } from 'expo-sqlite';
import type { Captura } from '../../dominio/tipos';

let conexion: ReturnType<typeof openDatabaseSync> | null = null;
function db() {
  if (!conexion) {
    const nueva = openDatabaseSync('refluye.db');
    nueva.execSync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS capturas (
        id TEXT PRIMARY KEY, fecha INTEGER NOT NULL, completa INTEGER NOT NULL DEFAULT 0,
        demo INTEGER NOT NULL, datos TEXT NOT NULL, resultado TEXT
      ); PRAGMA user_version = 1;`);
    conexion = nueva;
  }
  return conexion;
}
export function guardarAjuste(clave: string, valor: string) {
  db().runSync('INSERT OR REPLACE INTO ajustes(clave, valor) VALUES (?, ?)', clave, valor);
}
export function leerAjuste(clave: string): string | null {
  return db().getFirstSync<{valor: string}>('SELECT valor FROM ajustes WHERE clave = ?', clave)?.valor ?? null;
}
export function guardarBorrador(captura: Captura) {
  db().runSync(`INSERT INTO capturas(id, fecha, demo, datos) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET datos=excluded.datos WHERE capturas.completa=0`,
  captura.id, captura.lectura.recibidaEn, Number(captura.demo), JSON.stringify(captura));
}
export function completarCaptura(captura: Captura, resultado: unknown) {
  db().withTransactionSync(() => {
    guardarBorrador(captura);
    db().runSync('UPDATE capturas SET completa=1, resultado=? WHERE id=? AND completa=0', JSON.stringify(resultado), captura.id);
  });
}
export interface Registro { captura: Captura; completa: boolean; resultado: string | null }
export function listarCapturas(): Registro[] {
  return db().getAllSync<{datos: string; completa: number; resultado: string | null}>(
    'SELECT datos, completa, resultado FROM capturas ORDER BY fecha DESC LIMIT 100'
  ).map(fila => ({captura: JSON.parse(fila.datos), completa: !!fila.completa, resultado: fila.resultado}));
}
export function obtenerCaptura(id: string): Registro | null {
  const fila = db().getFirstSync<{datos: string; completa: number; resultado: string | null}>(
    'SELECT datos, completa, resultado FROM capturas WHERE id=?', id);
  return fila ? {captura: JSON.parse(fila.datos), completa: !!fila.completa, resultado: fila.resultado} : null;
}
