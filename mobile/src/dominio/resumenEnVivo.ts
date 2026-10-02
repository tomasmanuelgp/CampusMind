import {evaluar,DESCARGO} from './motor';
import {orientarUso,nombresUso} from './orientacion';
import type {Lectura,Observacion,Calibracion,Uso} from './tipos';

/** Vista preliminar: las respuestas ausentes nunca se suponen favorables. */
export function resumirEnVivo(lectura:Lectura|null,observacion:Partial<Observacion>,calibracion:Calibracion|null,uso?:Uso,estable=false){
  const datos:Lectura=lectura??{ph:null,tds:null,turbidez:null,temperatura:null,
    icaDispositivo:null,estadoDispositivo:null,versionProtocolo:1,recibidaEn:0,errores:['Sin lectura reciente']};
  const resultado=evaluar(datos,{
    origen:observacion.origen??'no_se',olor:observacion.olor??'no_se',
    visual:observacion.visual??'no_se',olorTipo:observacion.olor==='raro'?observacion.olorTipo:undefined,
  },calibracion,estable);
  const guia=uso?orientarUso(resultado,uso):null;
  const faltan=!observacion.origen||!observacion.olor||!observacion.visual;
  const alternativa=resultado.plan==='alternativa';
  const tratamiento=resultado.plan==='hervido';
  const detalle=alternativa
    ? 'Hay señales de riesgo. No intentes resolverlo solo hirviendo; busca otra fuente y pide una revisión.'
    : tratamiento
      ? 'Los datos permiten orientar un aclarado y una desinfección. Esto no autoriza beberla directamente.'
      : !lectura?'Necesitamos una lectura reciente. Puedes indicar lo que observas mientras conectas el equipo.'
      : faltan?'Responde cómo se ve, cómo huele y de dónde viene. La conclusión cambiará con cada respuesta.'
      : resultado.reglas.includes('R14')?'Hay respuestas «No sé». Confírmalas con ayuda antes de decidir un tratamiento.'
      : 'La lectura o la calibración no están verificadas. Revisa el equipo antes de decidir un tratamiento.';
  return {titulo:alternativa?'No consumir; busca otra fuente':tratamiento?'Posible tratamiento antes de consumir':'No consumir todavía',
    tono:alternativa?'rojo' as const:'ambar' as const,detalle,
    uso:uso?nombresUso[uso]:null,estadoUso:guia?.estado,pasos:guia?.pasos??[],
    confiable:resultado.confiable&&!resultado.reglas.includes('R14'),descargo:DESCARGO,plan:resultado.plan};
}
