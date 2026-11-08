import { describe, it, expect } from 'vitest';
import { avanceMedicion, estadoParametro, semaforo } from './presentacion';
import { evaluar } from './motor';
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
const calibracion = { verificadaEn: 0, venceEn: 2000, responsable: 'T', referencia: 'R' };

describe('semáforo del resultado', () => {
  it('rojo para buscar otra fuente, ámbar para repetir o lectura inicial, verde solo con ruta de tratamiento', () => {
    expect(semaforo({ plan: 'alternativa' }, false)).toMatchObject({
      tono: 'rojo',
      titulo: 'Busca otra fuente',
    });
    expect(semaforo({ plan: 'repetir' }, false)).toMatchObject({ tono: 'ambar', icono: 'repetir' });
    expect(semaforo({ plan: 'hervido' }, true)).toMatchObject({ tono: 'ambar', icono: 'tratar' });
    expect(semaforo({ plan: 'hervido' }, false)).toMatchObject({
      tono: 'verde',
      titulo: 'Trátala antes de consumir',
    });
  });
  it('el verde siempre habla de tratar, nunca de beber directamente', () => {
    const verde = semaforo({ plan: 'hervido' }, false);
    expect(verde.titulo + verde.etiqueta).toMatch(/trat/i);
  });
  it('coincide con el motor: olor extraño siempre es rojo', () => {
    const r = evaluar(lectura, { origen: 'corriente', olor: 'raro', visual: 'limpia' }, calibracion);
    expect(semaforo(r, false).tono).toBe('rojo');
  });
});

describe('estado de cada parámetro con los umbrales del motor', () => {
  it('pH', () => {
    expect(estadoParametro('ph', 7.2).nivel).toBe('referencia');
    expect(estadoParametro('ph', 6.4).nivel).toBe('atencion');
    expect(estadoParametro('ph', 8.6).nivel).toBe('atencion');
    expect(estadoParametro('ph', 5.4).nivel).toBe('extremo');
    expect(estadoParametro('ph', 9.6).nivel).toBe('extremo');
  });
  it('turbidez', () => {
    expect(estadoParametro('turbidez', 3).nivel).toBe('referencia');
    expect(estadoParametro('turbidez', 25).nivel).toBe('atencion');
    expect(estadoParametro('turbidez', 100).nivel).toBe('extremo');
  });
  it('sólidos disueltos, incluido el rango validado del sensor', () => {
    expect(estadoParametro('tds', 145).nivel).toBe('referencia');
    expect(estadoParametro('tds', 600).texto).toBe('Alto');
    expect(estadoParametro('tds', 1200).texto).toBe('Fuera del rango del sensor');
    expect(estadoParametro('tds', 1500).nivel).toBe('extremo');
  });
  it('temperatura es contexto; sin dato se dice', () => {
    expect(estadoParametro('temperatura', 24).nivel).toBe('contexto');
    expect(estadoParametro('ph', null).nivel).toBe('sin-dato');
    expect(estadoParametro('tds', NaN).nivel).toBe('sin-dato');
  });
});

describe('avance de la medición', () => {
  it('lista lo que falta en orden y marca cada paso', () => {
    const vacio = avanceMedicion({ lectura: null, fuente: ' ', observacion: {} });
    expect(vacio.completo).toBe(false);
    expect(vacio.falta[0]).toBe('una lectura completa del equipo');
    expect(vacio.pasos.every(p => !p.listo)).toBe(true);
    const lleno = avanceMedicion({
      lectura,
      fuente: 'Quebrada',
      uso: 'beber',
      observacion: { origen: 'corriente', olor: 'normal', visual: 'limpia' },
    });
    expect(lleno).toMatchObject({ completo: true, falta: [] });
    expect(lleno.pasos.every(p => p.listo)).toBe(true);
  });
});
