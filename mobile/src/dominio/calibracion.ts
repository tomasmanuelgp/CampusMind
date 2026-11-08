// SPDX-License-Identifier: AGPL-3.0-only
// Validación del registro de una calibración que un técnico ya hizo.
// La app no calibra ni comprueba la sonda: solo acepta un registro coherente.
import type { Calibracion } from './tipos';

export interface DatosRegistro {
  responsable: string;
  referencia: string;
  /** Fecha en que se realizó, AAAA-MM-DD. */
  realizada: string;
  /** Fecha de vencimiento indicada por el técnico, AAAA-MM-DD. */
  vence: string;
}

export type Validacion = { ok: true; calibracion: Calibracion } | { ok: false; error: string };

/** Acepta solo fechas de calendario reales (rechaza 2026-02-30). Devuelve la medianoche UTC. */
function fechaUtc(texto: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const ms = Date.parse(texto);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === texto ? ms : null;
}

export function validarRegistroCalibracion(d: DatosRegistro, ahora: number): Validacion {
  const responsable = d.responsable.trim(),
    referencia = d.referencia.trim();
  if (!responsable || !referencia)
    return { ok: false, error: 'Completa el responsable técnico y la referencia del registro.' };
  const verificadaEn = fechaUtc(d.realizada.trim()),
    venceEn = fechaUtc(d.vence.trim());
  if (verificadaEn === null || venceEn === null)
    return { ok: false, error: 'Escribe las fechas como AAAA-MM-DD, por ejemplo 2026-09-14.' };
  if (verificadaEn > ahora) return { ok: false, error: 'La calibración no puede tener una fecha futura.' };
  if (venceEn <= verificadaEn)
    return { ok: false, error: 'El vencimiento debe ser posterior a la fecha de calibración.' };
  if (venceEn <= ahora)
    return { ok: false, error: 'La vigencia ya terminó. Registra una calibración nueva.' };
  return { ok: true, calibracion: { verificadaEn, venceEn, responsable, referencia } };
}
