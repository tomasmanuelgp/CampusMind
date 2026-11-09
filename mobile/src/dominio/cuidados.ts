// SPDX-License-Identifier: AGPL-3.0-only
// Apoyos sin internet para seguir las guías de cuidado: buscar una guía,
// marcar los pasos hechos y recordar los cuidados que se repiten. Es
// TypeScript puro: recibe fechas en milisegundos y nunca lee el reloj.
import { GUIAS, type Guia, type GuiaId } from './guias';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Quita tildes y mayúsculas para que «diarrea», «Diarréa» y «DIARREA» coincidan. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Busca guías por palabras. Cada palabra debe aparecer en el título, el
 * resumen, los pasos o lo que hay que evitar. Sin texto, devuelve todas.
 */
export function buscarGuias(consulta: string, guias: readonly Guia[] = GUIAS): Guia[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [...guias];
  return guias.filter(g => {
    const texto = normalizar(
      [g.titulo, g.resumen, ...g.pasos.flatMap(p => [p.titulo, p.texto]), ...g.evita].join(' '),
    );
    return palabras.every(p => texto.includes(p));
  });
}

/** Marca o desmarca un paso hecho. Devuelve una lista nueva, ordenada y sin repetidos. */
export function alternarPaso(hechos: readonly number[], paso: number): number[] {
  const conjunto = new Set(hechos);
  if (conjunto.has(paso)) conjunto.delete(paso);
  else conjunto.add(paso);
  return [...conjunto].sort((a, b) => a - b);
}

export interface ProgresoGuia {
  hechos: number;
  total: number;
  completa: boolean;
}

/** Cuántos pasos de la guía están hechos. Ignora índices que ya no existen. */
export function progresoGuia(guia: Pick<Guia, 'pasos'>, hechos: readonly number[]): ProgresoGuia {
  const total = guia.pasos.length;
  const validos = new Set(hechos.filter(i => Number.isInteger(i) && i >= 0 && i < total)).size;
  return { hechos: validos, total, completa: validos === total };
}

/** Cuidados que se repiten y que la persona puede registrar desde una guía. */
export type CuidadoId = 'tanque' | 'canaletas' | 'agua-guardada';

export interface Cuidado {
  id: CuidadoId;
  /** Texto del botón para registrar que se hizo hoy. */
  registrar: string;
  /** Guía donde se explica cómo hacerlo. */
  guia: GuiaId;
  /** Cada cuántos días toca repetirlo. */
  cadaDias: number;
  pendiente: string;
  alDia: string;
}

export const CUIDADOS: readonly Cuidado[] = [
  {
    id: 'tanque',
    registrar: 'Lavé el tanque hoy',
    guia: 'fuente',
    cadaDias: 180,
    pendiente: 'Toca lavar el tanque: al menos cada 6 meses.',
    alDia: 'Tanque lavado.',
  },
  {
    id: 'canaletas',
    registrar: 'Limpié las canaletas hoy',
    guia: 'fuente',
    cadaDias: 90,
    pendiente: 'Toca limpiar las canaletas del agua lluvia: cada 3 o 4 meses.',
    alDia: 'Canaletas limpias.',
  },
  {
    id: 'agua-guardada',
    registrar: 'Guardé agua tratada hoy',
    guia: 'guardar',
    cadaDias: 1,
    pendiente: 'Revisa el agua tratada que guardaste: si se destapó o se ensució, vuelve a tratarla.',
    alDia: 'Agua tratada guardada hoy.',
  },
];

export interface Recordatorio {
  id: CuidadoId | 'calibracion';
  texto: string;
  pendiente: boolean;
  /** Días que faltan; negativo si ya pasó la fecha. */
  dias: number;
  guia: GuiaId;
}

/**
 * Arma los recordatorios a partir de las fechas registradas. Solo incluye los
 * cuidados que la persona ya registró alguna vez, y la calibración si hay un
 * equipo recordado. Los pendientes van primero.
 */
export function recordatorios(
  registros: Partial<Record<CuidadoId, number>>,
  calibracion: { equipo: boolean; venceEn: number | null },
  ahora: number,
): Recordatorio[] {
  const lista: Recordatorio[] = [];
  for (const c of CUIDADOS) {
    const hecho = registros[c.id];
    if (hecho === undefined || !Number.isFinite(hecho)) continue;
    const dias = Math.floor((hecho + c.cadaDias * DIA_MS - ahora) / DIA_MS);
    const pendiente = dias < 0;
    lista.push({ id: c.id, texto: pendiente ? c.pendiente : c.alDia, pendiente, dias, guia: c.guia });
  }
  if (calibracion.equipo) {
    const vence = calibracion.venceEn;
    const dias = vence === null ? -1 : Math.floor((vence - ahora) / DIA_MS);
    const pendiente = vence === null || vence <= ahora;
    lista.push({
      id: 'calibracion',
      texto: pendiente
        ? 'Sin calibración vigente: tus mediciones saldrán como no confiables. Pide la calibración.'
        : dias === 0
          ? 'La calibración vence hoy.'
          : dias <= 7
            ? `La calibración vence en ${dias} ${dias === 1 ? 'día' : 'días'}.`
            : 'Calibración vigente.',
      pendiente: pendiente || dias <= 7,
      dias,
      guia: 'equipo',
    });
  }
  return lista.sort((a, b) => Number(b.pendiente) - Number(a.pendiente) || a.dias - b.dias);
}
