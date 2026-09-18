import type { PlanId } from './motor';
export interface Paso { titulo:string; texto:string; segundos?:number }
export interface Protocolo { titulo:string; materiales:string; limites:string; pasos:Paso[] }
export const protocolos:Record<PlanId,Protocolo>={
  alternativa:{titulo:'Busca otra fuente',materiales:'Un recipiente limpio y con tapa.',
    limites:'Hervir, clorar o filtrar con tela no resuelve todos los contaminantes. No uses este plan para autorizar el agua actual.',
    pasos:[{titulo:'Separa esta agua',texto:'No la uses para beber ni preparar alimentos. Conserva el resultado para mostrárselo a un técnico.'},
      {titulo:'Consigue otra fuente',texto:'Busca agua de un abastecimiento controlado o agua envasada. Consulta con el acueducto o la autoridad de salud local.'},
      {titulo:'Solicita una revisión',texto:'Muestra tus observaciones y mediciones. Si sospechas un vertimiento, informa a la autoridad ambiental sin acercarte al lugar.'}]},
  repetir:{titulo:'Revisa y vuelve a medir',materiales:'Equipo y apoyo de la persona responsable de la calibración.',
    limites:'Repetir una lectura no elimina contaminantes. No uses una medición sin verificar para decidir consumo.',
    pasos:[{titulo:'Revisa el equipo',texto:'Comprueba los sensores y la calibración con el responsable técnico. Una lectura estable no demuestra calibración.'},
      {titulo:'Prepara otra medición',texto:'Sigue las instrucciones de limpieza del equipo. Coloca las sondas y espera la señal de lectura estable.'},
      {titulo:'Completa la observación',texto:'Si no puedes identificar el origen, olor o aspecto, pide ayuda y conserva la opción «No estoy seguro».'}]},
  hervido:{titulo:'Aclara y desinfecta',materiales:'Tela limpia, olla, estufa o fuego, recipiente limpio con tapa.',
    limites:'Este procedimiento no elimina químicos, combustibles, metales, sales ni toxinas de algas. Si notas aceite, color verdoso u olor extraño, detente y busca otra fuente.',
    pasos:[{titulo:'Aclara primero',texto:'Si ves partículas, deja que se asienten y pasa la parte clara por una tela limpia. Si sigue turbia, detente: busca otra fuente y solicita ayuda.'},
      {titulo:'Lleva a ebullición',texto:'Pon el agua clara al fuego. Espera hasta ver burbujas grandes y continuas. Mantén a los niños lejos del fuego.'},
      {titulo:'Mantén el hervor',texto:'Desde el burbujeo fuerte, cuenta 3 minutos. Este tiempo cubre también las zonas de montaña alta.',segundos:180},
      {titulo:'Deja enfriar y guarda',texto:'Deja enfriar de forma natural, protegida de suciedad. Guarda en un recipiente limpio, desinfectado y bien tapado. No agregues agua sin tratar.'}]},
};
