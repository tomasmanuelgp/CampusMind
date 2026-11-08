// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { lecturaRecienteValida } from './estabilidad';
import type { Lectura } from './tipos';

const lectura: Lectura = {
  ph: 7.4,
  tds: 145,
  turbidez: 2,
  temperatura: 24,
  icaDispositivo: 96,
  estadoDispositivo: 0,
  versionProtocolo: 1,
  recibidaEn: 1000,
  errores: [],
};

describe('lectura reciente válida para analizar', () => {
  it('exige pH, turbidez y TDS presentes', () => {
    expect(lecturaRecienteValida([lectura], 1000)).toBe(lectura);
    for (const falta of ['ph', 'turbidez', 'tds'] as const)
      expect(lecturaRecienteValida([{ ...lectura, [falta]: null }], 1000)).toBeNull();
  });
  it('rechaza versiones de protocolo desconocidas, relojes hacia atrás y listas vacías', () => {
    expect(lecturaRecienteValida([{ ...lectura, versionProtocolo: 2 }], 1000)).toBeNull();
    expect(lecturaRecienteValida([lectura], 999)).toBeNull();
    expect(lecturaRecienteValida([], 1000)).toBeNull();
  });
});
