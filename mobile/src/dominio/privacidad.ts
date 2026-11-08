// Minimización de datos personales (Ley 1581 de 2012).
// Una medición solo necesita saber que la calibración está registrada y
// vigente; el nombre de quien calibró se queda en «Mi equipo».
import type {Calibracion} from './tipos';

/** Sustituye el nombre de la persona responsable en cada medición guardada. */
export const RESPONSABLE_REGISTRADO = 'registrado en Mi equipo';

/** Copia de la calibración apta para guardarse con la medición, sin el nombre del responsable. */
export function calibracionParaCaptura(c:Calibracion|null):Calibracion|null {
  if (!c) return null;
  // El motor exige que haya un responsable registrado; se conserva el hecho, no el nombre.
  return {...c, responsable: c.responsable.trim() ? RESPONSABLE_REGISTRADO : ''};
}
