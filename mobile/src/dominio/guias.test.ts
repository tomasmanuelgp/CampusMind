// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { evaluar, type Resultado } from './motor';
import { GUIAS, AVISO_GUIAS, guiasRecomendadas, obtenerGuia } from './guias';
import type { Calibracion, Lectura, Observacion } from './tipos';

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
const calibracion: Calibracion = {
  verificadaEn: 0,
  venceEn: 2000,
  responsable: 'Técnica',
  referencia: 'Registro',
};
const obs = (o: Partial<Observacion> = {}): Observacion => ({
  origen: 'corriente',
  olor: 'normal',
  visual: 'limpia',
  ...o,
});
const resultado = (o: Observacion, cal: Calibracion | null = calibracion): Resultado =>
  evaluar(lectura, o, cal);

describe('catálogo de guías', () => {
  it('cada guía tiene identidad única, pasos completos y fuentes con enlace', () => {
    expect(new Set(GUIAS.map(g => g.id)).size).toBe(GUIAS.length);
    for (const g of GUIAS) {
      expect(g.titulo.length).toBeGreaterThan(0);
      expect(g.resumen.length).toBeGreaterThan(0);
      expect(g.pasos.length).toBeGreaterThanOrEqual(3);
      for (const p of g.pasos) {
        expect(p.titulo.length).toBeGreaterThan(0);
        expect(p.texto.length).toBeGreaterThan(0);
      }
      expect(g.evita.length).toBeGreaterThan(0);
      expect(g.fuentes.length).toBeGreaterThan(0);
      for (const f of g.fuentes) expect(f.url).toMatch(/^https:\/\//);
    }
  });

  it('encuentra una guía por su id y devuelve undefined si no existe', () => {
    expect(obtenerGuia('guardar')?.titulo).toBe('Guarda el agua tratada');
    expect(obtenerGuia('no-existe')).toBeUndefined();
  });

  it('el aviso recuerda que la guía no cambia el resultado', () => {
    expect(AVISO_GUIAS).toMatch(/no cambian el resultado/);
    expect(AVISO_GUIAS).toMatch(/Busca otra fuente/);
  });

  it('S5: la guía de agua verde dice que hervir no sirve', () => {
    const texto = JSON.stringify(obtenerGuia('agua-verde'));
    expect(texto).toMatch(/Hervir no elimina/);
    expect(texto).toMatch(/Busca otra fuente/);
  });

  it('ninguna guía da dosis de cloro: esas cantidades exigen revisión técnica', () => {
    for (const g of GUIAS) {
      const texto = JSON.stringify(g);
      expect(texto).not.toMatch(/\d+\s*(gotas?|ml|mL|cucharad)/);
    }
  });
});

describe('guías recomendadas para un resultado', () => {
  it('con plan de tratamiento: guardar el agua y cuidados de salud', () => {
    const r = resultado(obs());
    expect(r.plan).toBe('hervido');
    expect(guiasRecomendadas(r, obs())).toEqual(['guardar', 'salud']);
  });

  it('agua turbia tratable: primero aclarar', () => {
    const o = obs({ visual: 'turbia' });
    const r = resultado(o);
    expect(r.plan).toBe('hervido');
    expect(guiasRecomendadas(r, o)).toEqual(['aclarar', 'guardar', 'salud']);
  });

  it('agua estancada tratable: cuidar la fuente y nunca más de tres guías', () => {
    const o = obs({ origen: 'estancada', visual: 'turbia' });
    const r = resultado(o);
    expect(r.plan).toBe('hervido');
    expect(guiasRecomendadas(r, o)).toEqual(['aclarar', 'guardar', 'fuente']);
  });

  it('agua verde: guía de algas y cuidar la fuente, sin tratamiento', () => {
    const o = obs({ visual: 'verdosa' });
    expect(guiasRecomendadas(resultado(o), o)).toEqual(['agua-verde', 'fuente', 'salud']);
  });

  it('sin calibración: cuidar el equipo', () => {
    const o = obs();
    const r = resultado(o, null);
    expect(r.plan).toBe('repetir');
    expect(guiasRecomendadas(r, o)).toEqual(['equipo', 'salud']);
  });
});
