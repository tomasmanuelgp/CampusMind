// SPDX-License-Identifier: AGPL-3.0-only
// Fachada de datos para las pantallas. Las pantallas no hablan con SQLite ni
// leen JSON a mano: piden aquí datos ya tipados. Si un ajuste guardado está
// dañado, se devuelve null en lugar de romper la pantalla.
import type { Calibracion } from '../dominio/tipos';
import { CALIBRACION_DEMO } from '../dominio/catalogos';
import { CUIDADOS, type CuidadoId } from '../dominio/cuidados';
import type { MetodoId } from '../dominio/protocolos';
import { guardarAjuste, leerAjuste } from '../infraestructura/db/repositorio';

export {
  listarCapturas,
  contarCapturas,
  obtenerCaptura,
  borrarCaptura,
  borrarTodo,
  exportarCsv,
  type Registro,
} from '../infraestructura/db/repositorio';

export interface EquipoRecordado {
  id: string;
  nombre: string;
}
export interface Progreso {
  paso: number;
  fin: number | null;
  /** Forma de desinfectar elegida en el plan de tratamiento. */
  metodo?: MetodoId;
}

function leerJson<T>(clave: string): T | null {
  try {
    const valor = leerAjuste(clave);
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

export const leerEquipoRecordado = () => leerJson<EquipoRecordado>('equipo');
export const recordarEquipo = (equipo: EquipoRecordado) => guardarAjuste('equipo', JSON.stringify(equipo));

/** Calibración declarada para un equipo (con el nombre del responsable: solo vive aquí). */
export const leerCalibracion = (equipo: string) => leerJson<Calibracion>('calibracion:' + equipo);
export const guardarCalibracion = (equipo: string, c: Calibracion) =>
  guardarAjuste('calibracion:' + equipo, JSON.stringify(c));

/** La calibración que aplica a la sesión actual: simulada en DEMO, la registrada en un equipo real. */
export const calibracionDeSesion = (equipo: string, demo: boolean): Calibracion | null =>
  demo ? CALIBRACION_DEMO : equipo ? leerCalibracion(equipo) : null;

export const leerProgreso = (id: string) => leerJson<Progreso>('progreso:' + id);
export const guardarProgreso = (id: string, p: Progreso) =>
  guardarAjuste('progreso:' + id, JSON.stringify(p));

/** Pasos marcados como hechos en una guía de cuidado. */
export const leerPasosGuia = (guia: string): number[] => {
  const valor = leerJson<unknown>('guia:' + guia);
  return Array.isArray(valor) ? valor.filter((n): n is number => typeof n === 'number') : [];
};
export const guardarPasosGuia = (guia: string, hechos: number[]) =>
  guardarAjuste('guia:' + guia, JSON.stringify(hechos));

/** Fecha (ms) en que se hizo por última vez cada cuidado que se repite. */
export const leerRegistrosCuidado = (): Partial<Record<CuidadoId, number>> => {
  const registros: Partial<Record<CuidadoId, number>> = {};
  for (const c of CUIDADOS) {
    const valor = leerJson<unknown>('cuidado:' + c.id);
    if (typeof valor === 'number' && Number.isFinite(valor)) registros[c.id] = valor;
  }
  return registros;
};
export const registrarCuidado = (id: CuidadoId, fecha: number) =>
  guardarAjuste('cuidado:' + id, JSON.stringify(fecha));
