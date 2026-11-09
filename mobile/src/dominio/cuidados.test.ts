// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { CUIDADOS, alternarPaso, buscarGuias, normalizar, progresoGuia, recordatorios } from './cuidados';
import { GUIAS, obtenerGuia } from './guias';

const DIA = 24 * 60 * 60 * 1000;
const AHORA = 1_000 * DIA;

describe('buscar guías', () => {
  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(normalizar('  Diarréa  ')).toBe('diarrea');
  });

  it('sin texto devuelve todas las guías', () => {
    expect(buscarGuias('   ').length).toBe(GUIAS.length);
  });

  it('encuentra por título, pasos o lo que hay que evitar, sin importar tildes', () => {
    expect(buscarGuias('DIARREA').map(g => g.id)).toEqual(['salud']);
    expect(buscarGuias('canaletas').map(g => g.id)).toEqual(['fuente']);
    expect(buscarGuias('algas').map(g => g.id)).toContain('agua-verde');
    expect(buscarGuias('calibracion').map(g => g.id)).toContain('equipo');
  });

  it('todas las palabras deben aparecer', () => {
    expect(buscarGuias('tanque letrinas').map(g => g.id)).toEqual(['fuente']);
    expect(buscarGuias('tanque cohete')).toEqual([]);
  });
});

describe('pasos hechos', () => {
  it('marca, desmarca y ordena sin repetir', () => {
    expect(alternarPaso([], 2)).toEqual([2]);
    expect(alternarPaso([2, 0], 1)).toEqual([0, 1, 2]);
    expect(alternarPaso([0, 1, 2], 1)).toEqual([0, 2]);
  });

  it('cuenta solo pasos que existen', () => {
    const guia = obtenerGuia('aclarar')!;
    expect(progresoGuia(guia, [])).toEqual({ hechos: 0, total: 4, completa: false });
    expect(progresoGuia(guia, [0, 1, 1, 9, -1, 1.5])).toEqual({ hechos: 2, total: 4, completa: false });
    expect(progresoGuia(guia, [0, 1, 2, 3])).toEqual({ hechos: 4, total: 4, completa: true });
  });
});

describe('recordatorios de cuidado', () => {
  it('cada cuidado apunta a una guía que existe', () => {
    for (const c of CUIDADOS) expect(obtenerGuia(c.guia)).toBeDefined();
  });

  it('sin registros ni equipo no hay recordatorios', () => {
    expect(recordatorios({}, { equipo: false, venceEn: null }, AHORA)).toEqual([]);
  });

  it('ignora fechas inválidas', () => {
    expect(recordatorios({ tanque: Number.NaN }, { equipo: false, venceEn: null }, AHORA)).toEqual([]);
  });

  it('el tanque toca cada 180 días', () => {
    const [alDia] = recordatorios({ tanque: AHORA - 10 * DIA }, { equipo: false, venceEn: null }, AHORA);
    expect(alDia).toMatchObject({ id: 'tanque', pendiente: false, dias: 170, guia: 'fuente' });
    const [vencido] = recordatorios({ tanque: AHORA - 200 * DIA }, { equipo: false, venceEn: null }, AHORA);
    expect(vencido).toMatchObject({ id: 'tanque', pendiente: true, guia: 'fuente' });
    expect(vencido.texto).toMatch(/lavar el tanque/);
  });

  it('el agua guardada se revisa al día siguiente', () => {
    const [hoy] = recordatorios(
      { 'agua-guardada': AHORA - DIA / 2 },
      { equipo: false, venceEn: null },
      AHORA,
    );
    expect(hoy.pendiente).toBe(false);
    const [ayer] = recordatorios(
      { 'agua-guardada': AHORA - 2 * DIA },
      { equipo: false, venceEn: null },
      AHORA,
    );
    expect(ayer.pendiente).toBe(true);
    expect(ayer.texto).toMatch(/vuelve a tratarla/);
  });

  it('la calibración: ausente, vencida, por vencer, hoy y vigente', () => {
    const sin = recordatorios({}, { equipo: true, venceEn: null }, AHORA)[0];
    expect(sin).toMatchObject({ id: 'calibracion', pendiente: true, guia: 'equipo' });
    expect(sin.texto).toMatch(/no confiables/);
    expect(recordatorios({}, { equipo: true, venceEn: AHORA - DIA }, AHORA)[0].pendiente).toBe(true);
    expect(recordatorios({}, { equipo: true, venceEn: AHORA + DIA / 2 }, AHORA)[0].texto).toBe(
      'La calibración vence hoy.',
    );
    expect(recordatorios({}, { equipo: true, venceEn: AHORA + DIA }, AHORA)[0].texto).toBe(
      'La calibración vence en 1 día.',
    );
    const pronto = recordatorios({}, { equipo: true, venceEn: AHORA + 3 * DIA }, AHORA)[0];
    expect(pronto).toMatchObject({ pendiente: true, texto: 'La calibración vence en 3 días.' });
    const vigente = recordatorios({}, { equipo: true, venceEn: AHORA + 30 * DIA }, AHORA)[0];
    expect(vigente).toMatchObject({ pendiente: false, texto: 'Calibración vigente.' });
  });

  it('los pendientes van primero y luego los más próximos', () => {
    const lista = recordatorios(
      { tanque: AHORA - 10 * DIA, canaletas: AHORA - 100 * DIA, 'agua-guardada': AHORA - DIA / 2 },
      { equipo: true, venceEn: AHORA + 30 * DIA },
      AHORA,
    );
    expect(lista.map(r => r.id)).toEqual(['canaletas', 'agua-guardada', 'calibracion', 'tanque']);
  });
});
