// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { validarRegistroCalibracion } from './calibracion';
import { calibracionVigente } from './motor';

const ahora = Date.parse('2026-11-08T15:00:00Z');
const base = {
  responsable: ' Técnica ',
  referencia: ' Acta 7 ',
  realizada: '2026-11-01',
  vence: '2027-05-01',
};

describe('registro de calibración', () => {
  it('acepta un registro coherente, en UTC y sin espacios sobrantes', () => {
    const v = validarRegistroCalibracion(base, ahora);
    expect(v).toEqual({
      ok: true,
      calibracion: {
        verificadaEn: Date.parse('2026-11-01T00:00:00Z'),
        venceEn: Date.parse('2027-05-01T00:00:00Z'),
        responsable: 'Técnica',
        referencia: 'Acta 7',
      },
    });
    if (v.ok) expect(calibracionVigente(v.calibracion, ahora)).toBe(true);
  });
  it('exige responsable y referencia', () => {
    expect(validarRegistroCalibracion({ ...base, responsable: '  ' }, ahora).ok).toBe(false);
    expect(validarRegistroCalibracion({ ...base, referencia: '' }, ahora).ok).toBe(false);
  });
  it('rechaza fechas mal escritas o que no existen', () => {
    for (const realizada of ['2026-2-1', '01/11/2026', '2026-02-30', ''])
      expect(validarRegistroCalibracion({ ...base, realizada }, ahora)).toMatchObject({ ok: false });
  });
  it('rechaza calibraciones futuras, vencidas o con vigencia invertida', () => {
    expect(validarRegistroCalibracion({ ...base, realizada: '2026-12-01' }, ahora).ok).toBe(false);
    expect(validarRegistroCalibracion({ ...base, vence: '2026-11-05' }, ahora).ok).toBe(false);
    expect(
      validarRegistroCalibracion({ ...base, realizada: '2026-11-01', vence: '2026-11-01' }, ahora).ok,
    ).toBe(false);
  });
});
