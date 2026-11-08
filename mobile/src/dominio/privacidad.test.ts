import { describe, it, expect } from 'vitest';
import { calibracionParaCaptura, RESPONSABLE_REGISTRADO } from './privacidad';
import { calibracionVigente } from './motor';

describe('minimización de la calibración guardada con cada medición', () => {
  const c = { verificadaEn: 0, venceEn: 2000, responsable: 'Ana Pérez', referencia: 'Acta 7' };
  it('quita el nombre sin cambiar si la calibración es vigente', () => {
    const minima = calibracionParaCaptura(c)!;
    expect(minima.responsable).toBe(RESPONSABLE_REGISTRADO);
    expect(calibracionVigente(minima, 1000)).toBe(calibracionVigente(c, 1000));
  });
  it('un registro sin responsable sigue sin ser vigente; sin registro, nada', () => {
    const sinNombre = calibracionParaCaptura({ ...c, responsable: '  ' })!;
    expect(calibracionVigente(sinNombre, 1000)).toBe(false);
    expect(calibracionParaCaptura(null)).toBeNull();
  });
});
