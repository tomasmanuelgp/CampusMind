import { describe, it, expect } from 'vitest';
import { ASPECTOS, CALIBRACION_DEMO, OLORES, ORIGENES, TIPOS_OLOR, USOS } from './catalogos';
import { nombresUso } from './orientacion';
import { calibracionVigente } from './motor';

describe('catálogo de opciones', () => {
  it('cada lista tiene ids únicos y textos no vacíos', () => {
    for (const lista of [ORIGENES, OLORES, TIPOS_OLOR, ASPECTOS, USOS]) {
      expect(new Set(lista.map(o => o.id)).size).toBe(lista.length);
      for (const o of lista) expect(o.texto.trim() && o.detalle.trim()).toBeTruthy();
    }
  });
  it('las tres observaciones ofrecen «No sé»: dudar siempre es una respuesta válida', () => {
    for (const lista of [ORIGENES, OLORES, ASPECTOS])
      expect(lista.at(-1)).toMatchObject({ id: 'no_se', texto: 'No sé' });
  });
  it('los nombres de uso de la orientación salen del catálogo', () => {
    expect(nombresUso).toEqual(Object.fromEntries(USOS.map(u => [u.id, u.texto])));
  });
  it('la calibración DEMO es vigente y se reconoce como simulación', () => {
    expect(calibracionVigente(CALIBRACION_DEMO, Date.now())).toBe(true);
    expect(CALIBRACION_DEMO.referencia).toBe('SIMULACIÓN');
  });
});
