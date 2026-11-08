// SPDX-License-Identifier: AGPL-3.0-only
// Cómo se presenta lo que decide el motor: color del semáforo, estado de cada
// parámetro y avance de la medición. Usa los mismos umbrales del motor para que
// la pantalla y el veredicto nunca se contradigan. Nunca dice «potable».
import type { Resultado } from './motor';
import { TDS_VALIDADO_MAX, UMBRALES as U } from './motor';
import type { Lectura, Observacion, Uso } from './tipos';

export type Tono = 'verde' | 'ambar' | 'rojo';
export type IconoSemaforo = 'alto' | 'repetir' | 'tratar';

export interface Semaforo {
  tono: Tono;
  icono: IconoSemaforo;
  /** Etiqueta corta en mayúsculas. */
  etiqueta: string;
  /** Título grande del resultado. */
  titulo: string;
}

/** Traduce el plan del motor a un semáforo. Verde nunca significa «se puede beber sin tratar». */
export function semaforo(r: Pick<Resultado, 'plan'>, inicial: boolean): Semaforo {
  if (r.plan === 'alternativa')
    return {
      tono: 'rojo',
      icono: 'alto',
      etiqueta: 'NO TRATES ESTA AGUA EN CASA',
      titulo: 'Busca otra fuente',
    };
  if (r.plan === 'repetir')
    return {
      tono: 'ambar',
      icono: 'repetir',
      etiqueta: 'NO SE PUEDE DECIDIR AÚN',
      titulo: 'No la consumas todavía',
    };
  if (inicial)
    return {
      tono: 'ambar',
      icono: 'tratar',
      etiqueta: 'POSIBLE TRATAMIENTO · LECTURA INICIAL',
      titulo: 'Posible tratamiento; verifica',
    };
  return {
    tono: 'verde',
    icono: 'tratar',
    etiqueta: 'HAY UNA RUTA DE TRATAMIENTO',
    titulo: 'Trátala antes de consumir',
  };
}

export type Sensor = 'ph' | 'turbidez' | 'tds' | 'temperatura';
export type NivelParametro = 'referencia' | 'atencion' | 'extremo' | 'sin-dato' | 'contexto';

export interface EstadoParametro {
  nivel: NivelParametro;
  texto: string;
}

/** Estado de un parámetro frente a las referencias del proyecto (no frente a potabilidad). */
export function estadoParametro(sensor: Sensor, valor: number | null | undefined): EstadoParametro {
  if (valor == null || !Number.isFinite(valor)) return { nivel: 'sin-dato', texto: 'Sin dato' };
  if (sensor === 'temperatura') return { nivel: 'contexto', texto: 'Contexto' };
  if (sensor === 'ph') {
    if (valor < U.ph.extremoMin || valor > U.ph.extremoMax) return { nivel: 'extremo', texto: 'Extremo' };
    if (valor < U.ph.referenciaMin || valor > U.ph.referenciaMax)
      return { nivel: 'atencion', texto: 'Fuera de referencia' };
    return { nivel: 'referencia', texto: 'En referencia' };
  }
  if (sensor === 'turbidez') {
    if (valor >= U.turbidez.extremo) return { nivel: 'extremo', texto: 'Muy alta' };
    if (valor >= U.turbidez.atencion) return { nivel: 'atencion', texto: 'Alta' };
    return { nivel: 'referencia', texto: 'En referencia' };
  }
  if (valor >= U.tds.extremo) return { nivel: 'extremo', texto: 'Muy alto' };
  if (valor > TDS_VALIDADO_MAX) return { nivel: 'atencion', texto: 'Fuera del rango del sensor' };
  if (valor >= U.tds.atencion) return { nivel: 'atencion', texto: 'Alto' };
  return { nivel: 'referencia', texto: 'En referencia' };
}

/** Lo que falta para analizar, en el orden en que la persona lo completa. */
export interface Avance {
  pasos: { titulo: string; listo: boolean }[];
  falta: string[];
  completo: boolean;
}

export function avanceMedicion(datos: {
  lectura: Lectura | null;
  fuente: string;
  uso?: Uso;
  observacion: Partial<Observacion>;
}): Avance {
  const o = datos.observacion;
  const falta = [
    !datos.lectura ? 'una lectura completa del equipo' : null,
    !datos.fuente.trim() ? 'nombre de la fuente' : null,
    !datos.uso ? 'uso' : null,
    !o.origen ? 'origen' : null,
    !o.olor ? 'olor' : null,
    !o.visual ? 'aspecto' : null,
  ].filter((x): x is string => x !== null);
  const pasos = [
    { titulo: 'Lectura', listo: !!datos.lectura },
    { titulo: 'Tu agua', listo: !!datos.fuente.trim() && !!datos.uso },
    { titulo: 'Observa', listo: !!o.origen && !!o.olor && !!o.visual },
  ];
  return { pasos, falta, completo: falta.length === 0 };
}
