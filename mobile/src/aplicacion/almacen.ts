// Fachada de datos para las pantallas. Las pantallas no hablan con SQLite ni
// leen JSON a mano: piden aquí datos ya tipados. Si un ajuste guardado está
// dañado, se devuelve null en lugar de romper la pantalla.
import type { Calibracion } from '../dominio/tipos';
import { CALIBRACION_DEMO } from '../dominio/catalogos';
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
