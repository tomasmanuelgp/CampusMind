// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';

// Base con el esquema v1 (0.1.0–0.3.2): toda la captura en un JSON.
const soporte = vi.hoisted(() => ({ sqlite: null as unknown as DatabaseSync }));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'ref-fija' }));
vi.mock('expo-sqlite', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const base = new DatabaseSync(':memory:');
  base.exec(`CREATE TABLE ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE capturas (id TEXT PRIMARY KEY, fecha INTEGER NOT NULL, completa INTEGER NOT NULL DEFAULT 0,
      demo INTEGER NOT NULL, datos TEXT NOT NULL, resultado TEXT); PRAGMA user_version = 1;`);
  const lectura = {
    ph: 7,
    tds: 100,
    turbidez: 2,
    temperatura: 24,
    icaDispositivo: 90,
    estadoDispositivo: 0,
    versionProtocolo: 1,
    recibidaEn: 1000,
    errores: [],
  };
  const insertar = base.prepare('INSERT INTO capturas VALUES (?,?,?,?,?,?)');
  insertar.run(
    'real',
    1000,
    1,
    0,
    JSON.stringify({
      id: 'real',
      fuente: 'Pozo',
      equipo: 'AA:BB:CC:DD:EE:FF',
      demo: false,
      uso: 'beber',
      lectura,
      calibracion: { verificadaEn: 0, venceEn: 5000, responsable: 'Ana Pérez', referencia: 'Acta 7' },
      observacion: { origen: 'corriente', olor: 'normal', visual: 'limpia' },
    }),
    JSON.stringify({
      version: '0.3.0',
      nivel: 0,
      reglaId: 'R15',
      reglas: ['R15'],
      plan: 'hervido',
      ica: 90,
      confiable: true,
    }),
  );
  insertar.run(
    'demo',
    2000,
    0,
    1,
    JSON.stringify({
      id: 'demo',
      fuente: 'Práctica',
      equipo: 'DEMO',
      demo: true,
      lectura: { ...lectura, recibidaEn: 2000 },
      calibracion: null,
      observacion: {},
    }),
    null,
  );
  soporte.sqlite = base;
  return {
    openDatabaseSync: () => ({
      execSync: (sql: string) => base.exec(sql),
      runSync: (sql: string, ...a: (string | number | null)[]) => base.prepare(sql).run(...a),
      getFirstSync: (sql: string, ...a: (string | number | null)[]) => base.prepare(sql).get(...a),
      getAllSync: (sql: string, ...a: (string | number | null)[]) => base.prepare(sql).all(...a),
      withTransactionSync: (fn: () => void) => {
        base.exec('BEGIN');
        try {
          fn();
          base.exec('COMMIT');
        } catch (e) {
          base.exec('ROLLBACK');
          throw e;
        }
      },
    }),
  };
});
import { listarCapturas, obtenerCaptura } from './repositorio';

describe('migración del esquema v1 al v2', () => {
  it('conserva las mediciones y quita la MAC y el nombre del responsable', () => {
    expect(listarCapturas().map(r => [r.captura.id, r.completa])).toEqual([
      ['demo', false],
      ['real', true],
    ]);
    const real = obtenerCaptura('real')!;
    expect(real.captura.equipo).toBe('equipo-ref-fija');
    expect(real.captura.calibracion).toEqual({
      verificadaEn: 0,
      venceEn: 5000,
      responsable: 'registrado en Mi equipo',
      referencia: 'Acta 7',
    });
    expect(JSON.parse(real.resultado!).plan).toBe('hervido');
    expect(obtenerCaptura('demo')!.captura.equipo).toBe('DEMO');
    const tablas = soporte.sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map(t => (t as { name: string }).name);
    expect(tablas).not.toContain('capturas');
    expect(
      (soporte.sqlite.prepare('PRAGMA user_version').get() as { user_version: number }).user_version,
    ).toBe(2);
    expect(JSON.stringify(soporte.sqlite.prepare('SELECT * FROM medicion').all())).not.toMatch(
      /Ana Pérez|AA:BB/,
    );
  });
});
