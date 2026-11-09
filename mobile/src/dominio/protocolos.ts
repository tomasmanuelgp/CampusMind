// SPDX-License-Identifier: AGPL-3.0-only
import type { PlanId } from './motor';
export interface Paso {
  titulo: string;
  texto: string;
  segundos?: number;
}
export interface Protocolo {
  titulo: string;
  materiales: string;
  limites: string;
  pasos: Paso[];
}
export const protocolos: Record<PlanId, Protocolo> = {
  alternativa: {
    titulo: 'Busca otra fuente',
    materiales: 'Un recipiente limpio y con tapa.',
    limites:
      'Hervir, clorar o filtrar con tela no resuelve todos los contaminantes. No uses este plan para autorizar el agua actual.',
    pasos: [
      {
        titulo: 'Separa esta agua',
        texto:
          'No la uses para beber ni preparar alimentos. Conserva el resultado para mostrárselo a un técnico.',
      },
      {
        titulo: 'Consigue otra fuente',
        texto:
          'Busca agua de un abastecimiento controlado o agua envasada. Consulta con el acueducto o la autoridad de salud local.',
      },
      {
        titulo: 'Solicita una revisión',
        texto:
          'Muestra tus observaciones y mediciones. Si sospechas un vertimiento, informa a la autoridad ambiental sin acercarte al lugar.',
      },
    ],
  },
  repetir: {
    titulo: 'Revisa y vuelve a medir',
    materiales: 'Equipo y apoyo de la persona responsable de la calibración.',
    limites:
      'Repetir una lectura no elimina contaminantes. No uses una medición sin verificar para decidir consumo.',
    pasos: [
      {
        titulo: 'Revisa el equipo',
        texto:
          'Comprueba los sensores y la calibración con el responsable técnico. Una lectura estable no demuestra calibración.',
      },
      {
        titulo: 'Prepara otra medición',
        texto:
          'Sigue las instrucciones de limpieza del equipo. Coloca las sondas y espera la señal de lectura estable.',
      },
      {
        titulo: 'Completa la observación',
        texto: 'Si no puedes identificar el origen, olor o aspecto, pide ayuda y conserva la opción «No sé».',
      },
    ],
  },
  hervido: {
    titulo: 'Aclara y desinfecta',
    materiales: 'Tela limpia, olla, estufa o fuego, recipiente limpio con tapa.',
    limites:
      'Este procedimiento no elimina químicos, combustibles, metales, sales ni toxinas de algas. Si notas aceite, color verdoso u olor extraño, detente y busca otra fuente.',
    pasos: [
      {
        titulo: 'Aclara primero',
        texto:
          'Si ves partículas, deja que se asienten y pasa la parte clara por una tela limpia. Si sigue turbia, detente: busca otra fuente y solicita ayuda.',
      },
      {
        titulo: 'Lleva a ebullición',
        texto:
          'Pon el agua clara al fuego. Espera hasta ver burbujas grandes y continuas. Mantén a los niños lejos del fuego.',
      },
      {
        titulo: 'Mantén el hervor',
        texto:
          'Desde el burbujeo fuerte, cuenta 3 minutos. Este tiempo cubre también las zonas de montaña alta.',
        segundos: 180,
      },
      {
        titulo: 'Deja enfriar y guarda',
        texto:
          'Deja enfriar de forma natural, protegida de suciedad. Guarda en un recipiente limpio, desinfectado y bien tapado. No agregues agua sin tratar.',
      },
    ],
  },
};

/**
 * Formas de desinfectar cuando el motor eligió el plan de tratamiento. Hervir es
 * la principal; cloro y sol son alternativas para quien no tiene leña o gas.
 * Las cantidades vienen de CDC y no se redondean ni se calculan en la app.
 */
export type MetodoId = 'hervir' | 'cloro' | 'sol';

export interface MetodoDesinfeccion extends Protocolo {
  id: MetodoId;
  /** Texto corto para elegir el método. */
  boton: string;
  detalle: string;
  fuentes: { nombre: string; url: string }[];
}

const CDC_EMERGENCIA = {
  nombre: 'CDC · Cómo tratar el agua en una emergencia',
  url: 'https://www.cdc.gov/water-emergency/about/index.html',
};

export const METODOS: readonly MetodoDesinfeccion[] = [
  {
    id: 'hervir',
    boton: 'Hervir',
    detalle: 'La forma más completa. Necesitas olla y fuego.',
    ...protocolos.hervido,
    fuentes: [CDC_EMERGENCIA],
  },
  {
    id: 'cloro',
    boton: 'Con cloro',
    detalle: 'Si no puedes hervir. Necesitas cloro de uso doméstico sin olor y un gotero.',
    titulo: 'Desinfecta con cloro',
    materiales:
      'Cloro (blanqueador) de uso doméstico sin perfume ni detergente, gotero limpio, recipiente limpio con tapa.',
    limites:
      'El cloro no elimina químicos, combustibles, metales, sales ni toxinas de algas. Algunos parásitos lo resisten: si puedes hervir, hervir es más completo. Si el agua sigue turbia, el cloro funciona mal.',
    pasos: [
      {
        titulo: 'Revisa la etiqueta',
        texto:
          'Usa solo cloro de uso doméstico sin perfume ni detergente. Busca la concentración (hipoclorito de sodio). Si la etiqueta trae instrucciones para agua de beber, síguelas. Aquí solo hay cantidades para cloro del 5 % al 9 % o del 1 %: con otra concentración, o si no la dice, no lo uses para beber; hierve el agua o usa el sol.',
      },
      {
        titulo: 'Aclara primero',
        texto:
          'Si ves partículas, deja que se asienten y pasa la parte clara por una tela limpia. El cloro funciona mal en agua turbia.',
      },
      {
        titulo: 'Agrega las gotas',
        texto:
          'Con cloro del 5 % al 9 %: 2 gotas por cada litro (40 gotas para 20 litros). Con cloro del 1 %: 10 gotas por litro. Si el agua sigue algo turbia, tiene color o está muy fría, usa el doble.',
      },
      {
        titulo: 'Revuelve y espera',
        texto: 'Revuelve bien, tapa el recipiente y espera al menos 30 minutos antes de beberla.',
        segundos: 1800,
      },
      {
        titulo: 'Guarda bien',
        texto: 'Guárdala en un recipiente limpio y tapado. No agregues agua sin tratar.',
      },
    ],
    fuentes: [CDC_EMERGENCIA],
  },
  {
    id: 'sol',
    boton: 'Al sol',
    detalle: 'Sin fuego ni químicos. Necesitas botellas transparentes y sol.',
    titulo: 'Desinfecta con el sol',
    materiales: 'Botellas de plástico transparente, limpias y sin rayones, de 2 litros o menos.',
    limites:
      'El sol no elimina químicos, combustibles, metales, sales ni toxinas de algas. No funciona con agua turbia ni en días de lluvia continua.',
    pasos: [
      {
        titulo: 'Comprueba que esté clara',
        texto:
          'Pon la botella llena sobre un periódico: si puedes leer las letras grandes a través del agua, sirve. Si no, aclárala primero o usa otro método.',
      },
      {
        titulo: 'Llena las botellas',
        texto:
          'Usa botellas de plástico transparente, limpias, sin rayones ni etiqueta, de 2 litros o menos. Llénalas y tápalas.',
      },
      {
        titulo: 'Acuéstalas al sol',
        texto:
          'Déjalas acostadas a pleno sol, mejor sobre una lámina o superficie oscura, durante 6 horas si está soleado. Si está nublado, déjalas 2 días seguidos. Con lluvia continua no funciona.',
        segundos: 21600,
      },
      {
        titulo: 'Bebe de la misma botella',
        texto:
          'Toma el agua directamente de la botella o pásala a un recipiente limpio y tapado. Bebe primero la más antigua.',
      },
    ],
    fuentes: [
      CDC_EMERGENCIA,
      { nombre: 'Akvopedia · Desinfección solar (SODIS)', url: 'https://akvopedia.org/wiki/Sodis' },
    ],
  },
];

/** Métodos que se ofrecen para un resultado: solo cuando el motor eligió tratar (S3, S5). */
export function metodosPara(plan: PlanId): readonly MetodoDesinfeccion[] {
  return plan === 'hervido' ? METODOS : [];
}

export function obtenerMetodo(id: string | undefined): MetodoDesinfeccion {
  return METODOS.find(m => m.id === id) ?? METODOS[0];
}
