// SPDX-License-Identifier: AGPL-3.0-only
// Biblioteca de cuidados que la app muestra sin internet. Es contenido, no
// decisión: ninguna guía cambia el veredicto del motor (S3). Cada guía cita
// sus fuentes y evita dosis o cantidades que no hayan pasado revisión técnica
// (ver docs/app/09-motor-recomendaciones.md, «Protocolos»).
import type { Resultado } from './motor';
import type { Observacion } from './tipos';

export type GuiaId = 'guardar' | 'aclarar' | 'fuente' | 'agua-verde' | 'equipo' | 'salud';

export interface PasoGuia {
  titulo: string;
  texto: string;
}

export interface FuenteGuia {
  nombre: string;
  url: string;
}

export interface Guia {
  id: GuiaId;
  titulo: string;
  /** Una frase que explica para qué sirve la guía. */
  resumen: string;
  /** Pictograma (emoji compatible con Android 7). No lo lee el lector de pantalla. */
  icono: string;
  pasos: PasoGuia[];
  /** Errores comunes que conviene evitar. */
  evita: string[];
  fuentes: FuenteGuia[];
}

/** Se muestra con cada guía: el contenido acompaña, no reemplaza el resultado. */
export const AVISO_GUIAS =
  'Estas guías no cambian el resultado de tu medición. Si el resultado dice «Busca otra fuente», no uses esa agua aunque sigas estos pasos.';

const CDC_EMERGENCIA: FuenteGuia = {
  nombre: 'CDC · Cómo tratar el agua en una emergencia',
  url: 'https://www.cdc.gov/water-emergency/about/index.html',
};

export const GUIAS: readonly Guia[] = [
  {
    id: 'guardar',
    titulo: 'Guarda el agua tratada',
    resumen: 'El agua ya tratada se vuelve a contaminar fácil si el recipiente o las manos están sucios.',
    icono: '🚰',
    pasos: [
      {
        titulo: 'Escoge el recipiente',
        texto:
          'Usa uno solo para agua de beber, de plástico, barro o metal, con tapa que cierre bien. Mejor si tiene boca angosta o llave.',
      },
      {
        titulo: 'Lávalo antes de llenarlo',
        texto:
          'Lávalo por dentro con agua y jabón y enjuágalo hasta que no quede jabón. Deja que se seque al aire o enjuágalo con agua ya tratada.',
      },
      {
        titulo: 'Llénalo y tápalo enseguida',
        texto:
          'Vierte el agua ya tratada y fría. Tápalo de una vez. Marca el recipiente con la palabra «agua de beber» y la fecha del tratamiento.',
      },
      {
        titulo: 'Saca el agua sin tocarla',
        texto:
          'Usa la llave o vierte el agua por la boca del recipiente. No metas las manos, vasos ni totumas dentro.',
      },
      {
        titulo: 'Ubícalo en un buen lugar',
        texto:
          'Déjalo en un sitio fresco, a la sombra y en alto, lejos de animales, gasolina, venenos y productos de fumigar.',
      },
    ],
    evita: [
      'No mezcles agua tratada con agua sin tratar.',
      'No reutilices envases que tuvieron cloro, venenos, combustible o químicos.',
      'Si el agua guardada se destapa o se ensucia, vuelve a tratarla antes de beberla.',
    ],
    fuentes: [
      {
        nombre: 'CDC · Almacenamiento del agua en casa',
        url: 'https://www.cdc.gov/global-water-sanitation-hygiene/about/about-safe-water-storage.html',
      },
    ],
  },
  {
    id: 'aclarar',
    titulo: 'Aclara el agua turbia',
    resumen: 'Quitar la tierra ayuda a que la desinfección funcione. Aclarar no desinfecta.',
    icono: '⏳',
    pasos: [
      {
        titulo: 'Deja que se asiente',
        texto:
          'Llena un recipiente limpio, tápalo y déjalo quieto varias horas, mejor de un día para otro, hasta que la tierra baje al fondo.',
      },
      {
        titulo: 'Pasa la parte clara',
        texto: 'Vierte despacio la parte de arriba a otro recipiente limpio, sin revolver el fondo.',
      },
      {
        titulo: 'Cuela con una tela',
        texto:
          'Pasa el agua por una tela de algodón limpia, doblada varias veces. Después lava la tela con jabón y sécala al sol.',
      },
      {
        titulo: 'Revisa cómo quedó',
        texto:
          'Si todavía se ve turbia, no la uses para beber: busca otra fuente. Si quedó clara, desinféctala antes de beber o cocinar.',
      },
    ],
    evita: [
      'No uses el agua del fondo del recipiente.',
      'No agregues productos al agua sin indicación de una persona técnica.',
      'Aclarar no quita microbios, químicos ni sales.',
    ],
    fuentes: [CDC_EMERGENCIA],
  },
  {
    id: 'fuente',
    titulo: 'Cuida la fuente y el tanque',
    resumen: 'Proteger el nacimiento, el pozo o el tanque evita que el agua se contamine desde el origen.',
    icono: '🏡',
    pasos: [
      {
        titulo: 'Tapa lo que guarda agua',
        texto:
          'Tanques, aljibes y pozos deben tener tapa firme. Pon malla en los respiraderos para que no entren hojas, insectos ni animales.',
      },
      {
        titulo: 'Aleja animales y basura',
        texto:
          'Cerca el nacimiento o la bocatoma para que el ganado no llegue al agua. No dejes basura ni estiércol cerca.',
      },
      {
        titulo: 'Letrinas lejos y más abajo',
        texto:
          'Las letrinas y pozos sépticos deben quedar a por lo menos 30 metros de la fuente y, si se puede, más abajo. En terreno de piedra o arena gruesa, más lejos.',
      },
      {
        titulo: 'Nada de químicos cerca',
        texto:
          'No laves bombas de fumigar, envases de venenos, motos ni ropa junto a la fuente. Nunca botes sobrantes de químicos al agua o al suelo cercano.',
      },
      {
        titulo: 'Lava el tanque',
        texto:
          'Al menos cada 6 meses: vacíalo, restriega paredes y fondo con cepillo, agua y jabón, y enjuaga hasta quitar todo el jabón. Si te indican desinfectarlo con cloro, usa la dosis exacta que te dé el acueducto o la secretaría de salud.',
      },
      {
        titulo: 'Si recoges agua lluvia',
        texto:
          'Deja ir las primeras lluvias, que lavan el techo, antes de recoger. Limpia las canaletas de hojas cada 3 o 4 meses. El agua lluvia también se trata antes de beber.',
      },
    ],
    evita: [
      'No calcules a ojo cantidades de cloro u otros productos.',
      'No te acerques a un vertimiento o derrame: avisa a la autoridad ambiental.',
    ],
    fuentes: [
      {
        nombre: 'ACNUR · Distancia entre letrinas y fuentes de agua',
        url: 'https://www.unhcr.org/sites/default/files/legacy-pdf/49d080df2.pdf',
      },
      {
        nombre: 'CRA · Limpieza de tanques al menos cada 6 meses (Colombia)',
        url: 'https://normas.cra.gov.co/gestor/docs/concepto_superservicios_0000344_2022.htm',
      },
      {
        nombre: 'NSW Health · Mantenimiento de tanques de agua lluvia',
        url: 'https://www.health.nsw.gov.au/environment/water/Pages/rainwater.aspx',
      },
    ],
  },
  {
    id: 'agua-verde',
    titulo: 'Agua verde o con natas',
    resumen: 'Algunas algas producen toxinas que enferman a personas y animales. Hervir no las quita.',
    icono: '🌿',
    pasos: [
      {
        titulo: 'No la uses para beber ni cocinar',
        texto: 'Busca otra fuente. Hervir no elimina las toxinas de las algas y puede concentrarlas.',
      },
      {
        titulo: 'Protege a los animales',
        texto:
          'No dejes que el ganado, los perros ni otros animales beban o se metan en esa agua. Pueden enfermar gravemente en pocas horas.',
      },
      {
        titulo: 'Evita el contacto',
        texto:
          'No te bañes ni dejes que los niños jueguen en ella. Si alguien la toca, lávale la piel con agua limpia. Si un animal se moja, lávalo y no dejes que se lama.',
      },
      {
        titulo: 'Avisa',
        texto:
          'Informa a la autoridad ambiental o a la secretaría de salud del municipio, sobre todo si ves animales enfermos o muertos cerca.',
      },
    ],
    evita: [
      'No intentes resolverlo hirviendo, colando ni dejando reposar el agua.',
      'No riegues con ella cultivos que se comen crudos.',
    ],
    fuentes: [
      {
        nombre: 'CDC · Prevenir enfermedades por floraciones de algas',
        url: 'https://www.cdc.gov/harmful-algal-blooms/prevention/index.html',
      },
    ],
  },
  {
    id: 'equipo',
    titulo: 'Cuida el equipo',
    resumen: 'Un equipo limpio y calibrado da lecturas en las que se puede confiar.',
    icono: '🔧',
    pasos: [
      {
        titulo: 'Antes de medir',
        texto:
          'Revisa que cables y conectores estén secos y enteros, y que la calibración esté vigente. No enciendas una placa mojada.',
      },
      {
        titulo: 'Mientras mides',
        texto:
          'Sumerge solo las puntas de las sondas. Mantenlas quietas y no golpees el bulbo de vidrio del pH contra el recipiente.',
      },
      {
        titulo: 'No midas agua caliente',
        texto:
          'Espera a que el agua hervida se enfríe. La sonda de sólidos disueltos de referencia no resiste agua a 55 °C o más.',
      },
      {
        titulo: 'Después de medir',
        texto:
          'Enjuaga las puntas con agua limpia. No frotes el bulbo del pH. Limpia la ventana de la sonda de turbidez sin rayarla.',
      },
      {
        titulo: 'Guárdalo bien',
        texto:
          'Pon la tapa del pH con la solución que indica el fabricante; nunca la guardes seca. Guarda todo en un lugar seco, lejos del sol.',
      },
      {
        titulo: 'Revisa la calibración',
        texto:
          'Cuando venza, pide a la persona responsable que calibre el equipo y registre la nueva fecha en «Mi equipo».',
      },
    ],
    evita: [
      'No mojes la caja, los módulos ni los conectores.',
      'No uses una lectura de un equipo con cables dañados para decidir el uso del agua.',
    ],
    fuentes: [
      { nombre: 'DFRobot · Sonda de pH SEN0161', url: 'https://wiki.dfrobot.com/sen0161/docs/19898' },
      {
        nombre: 'DFRobot · Sonda de sólidos disueltos SEN0244',
        url: 'https://wiki.dfrobot.com/sen0244/docs/20305',
      },
    ],
  },
  {
    id: 'salud',
    titulo: 'Diarrea: cuidados y cuándo buscar ayuda',
    resumen:
      'La diarrea por agua contaminada es peligrosa sobre todo en niños pequeños, por la deshidratación.',
    icono: '🏥',
    pasos: [
      {
        titulo: 'Da líquidos desde el comienzo',
        texto:
          'Usa sales de rehidratación oral (SRO) del puesto de salud o la droguería. Prepáralas como dice el sobre, con agua tratada.',
      },
      {
        titulo: 'Sigue alimentando',
        texto: 'No suspendas la comida. A los bebés, sigue dándoles pecho.',
      },
      {
        titulo: 'Medicamentos solo con indicación',
        texto:
          'El personal de salud puede indicar zinc para los niños. No des remedios ni antibióticos sin que te los formulen.',
      },
      {
        titulo: 'Ve de inmediato al puesto de salud si',
        texto:
          'Hay sangre en la popó; no puede beber o mama mal; está muy decaído o cuesta despertarlo; tiene los ojos hundidos y mucha sed; la piel vuelve lento al pellizcarla; o la diarrea dura 14 días o más.',
      },
      {
        titulo: 'Evita nuevos contagios',
        texto:
          'Lávate las manos con agua y jabón después de ir al baño o cambiar pañales y antes de preparar la comida.',
      },
    ],
    evita: [
      'No reemplaces las SRO por bebidas gaseosas o jugos azucarados.',
      'Esta guía no reemplaza la atención en salud.',
    ],
    fuentes: [
      {
        nombre: 'OMS · Enfermedades diarreicas',
        url: 'https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease',
      },
    ],
  },
];

export function obtenerGuia(id: string): Guia | undefined {
  return GUIAS.find(g => g.id === id);
}

/**
 * Elige hasta tres guías para acompañar un resultado. Solo sugiere aclarar o
 * guardar agua tratada cuando el motor eligió el plan de tratamiento: nunca
 * ofrece un camino de tratamiento que el veredicto no permite (S3, S5).
 */
export function guiasRecomendadas(r: Resultado, o: Partial<Observacion>): GuiaId[] {
  const ids: GuiaId[] = [];
  if (o.visual === 'verdosa') ids.push('agua-verde');
  if (r.plan === 'hervido') {
    if (o.visual === 'turbia') ids.push('aclarar');
    ids.push('guardar');
  }
  if (r.plan === 'repetir') ids.push('equipo');
  if (r.plan === 'alternativa' || o.origen === 'estancada' || o.origen === 'pozo' || o.origen === 'lluvia')
    ids.push('fuente');
  ids.push('salud');
  return ids.slice(0, 3);
}
