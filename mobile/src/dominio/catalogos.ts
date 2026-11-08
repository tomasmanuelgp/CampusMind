// Catálogo único de opciones que ve la persona. Medir y Observación usan estas
// mismas listas para que una respuesta se llame igual en toda la app.
import type { Calibracion, OlorTipo, Origen, Olor, Uso, Visual } from './tipos';

export interface Opcion<T extends string> {
  id: T;
  /** Texto corto del botón. */
  texto: string;
  /** Explicación breve para quien duda. */
  detalle: string;
  /** Símbolo decorativo (no se lee con lector de pantalla). */
  icono: string;
}

export const ORIGENES: readonly Opcion<Origen>[] = [
  { id: 'corriente', texto: 'Agua que corre', detalle: 'Río, quebrada o nacimiento', icono: '≋' },
  { id: 'estancada', texto: 'Agua quieta', detalle: 'Tanque, charco, pozo o agua estancada', icono: '▱' },
  { id: 'no_se', texto: 'No sé', detalle: 'Puedes pedir ayuda', icono: '?' },
];

export const OLORES: readonly Opcion<Olor>[] = [
  { id: 'normal', texto: 'Sin olor raro', detalle: 'No percibo un olor inusual', icono: '○' },
  { id: 'raro', texto: 'Huele raro', detalle: 'Un olor fuerte o diferente', icono: '!' },
  { id: 'no_se', texto: 'No sé', detalle: 'No puedo identificarlo', icono: '?' },
];

export const TIPOS_OLOR: readonly Opcion<OlorTipo>[] = [
  { id: 'azufre', texto: 'Huevo podrido', detalle: 'Azufre', icono: '·' },
  { id: 'combustible', texto: 'Combustible', detalle: 'Gasolina, ACPM o solvente', icono: '·' },
  { id: 'podrido', texto: 'Cloaca', detalle: 'Aguas residuales o descomposición', icono: '·' },
  { id: 'quimico', texto: 'Químico', detalle: 'Químico o dulzón', icono: '·' },
  { id: 'cloro', texto: 'Cloro fuerte', detalle: 'Como blanqueador', icono: '·' },
  { id: 'otro', texto: 'Otro / no sé', detalle: 'Otro olor', icono: '·' },
];

export const ASPECTOS: readonly Opcion<Visual>[] = [
  { id: 'limpia', texto: 'Se ve clara', detalle: 'Sin color ni capa extraña', icono: '◇' },
  { id: 'turbia', texto: 'Tiene tierra', detalle: 'Turbia, con partículas suspendidas', icono: '≋' },
  { id: 'verdosa', texto: 'Se ve verde', detalle: 'Algas o una capa verde', icono: '◎' },
  { id: 'aceitosa', texto: 'Tiene aceite', detalle: 'Brillos o manchas en la superficie', icono: '◉' },
  { id: 'no_se', texto: 'No sé', detalle: 'No puedo identificarlo', icono: '?' },
];

export const USOS: readonly Opcion<Uso>[] = [
  { id: 'beber', texto: 'Beber', detalle: 'Tomar el agua', icono: '🚰' },
  { id: 'cocinar', texto: 'Cocinar', detalle: 'Preparar alimentos', icono: '🍲' },
  { id: 'banarse', texto: 'Bañarse', detalle: 'Aseo personal', icono: '🚿' },
  { id: 'utensilios', texto: 'Lavar utensilios', detalle: 'Ollas, platos y cubiertos', icono: '🧼' },
  { id: 'ropa', texto: 'Lavar ropa', detalle: 'Prendas y telas', icono: '👕' },
  { id: 'ganado', texto: 'Ganado', detalle: 'Bebedero de animales', icono: '🐄' },
  { id: 'cultivo', texto: 'Cultivos', detalle: 'Riego', icono: '🌱' },
];

/** Calibración simulada del modo DEMO: siempre vigente, nunca de un equipo real. */
export const CALIBRACION_DEMO: Calibracion = {
  verificadaEn: 0,
  venceEn: 8640000000000000,
  responsable: 'DEMO',
  referencia: 'SIMULACIÓN',
};
