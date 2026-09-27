import type { Calibracion, Lectura, Observacion } from './tipos';
export const VERSION_MOTOR = '0.2.0';
export const DESCARGO = 'Este equipo no detecta bacterias, virus ni parásitos. No certifica potabilidad.';
export type PlanId = 'alternativa' | 'repetir' | 'hervido';
export interface Resultado {
  version: string; nivel: 0|1|2; reglaId: string; reglas: string[]; titulo: string;
  motivo: string; confiable: boolean; ica: number|null; plan: PlanId;
  destinos: {humano: string; animal: string; riego: string; bano:string; utensilios:string; ropa:string}; advertencias: string[];
}
const enRango = (n:number|null,min:number,max:number): n is number => n !== null && Number.isFinite(n) && n>=min && n<=max;
export function calcularIca(l: Lectura): number|null {
  if (!enRango(l.ph,0,14) || !enRango(l.turbidez,0,200) || !enRango(l.tds,0,2000)) return null;
  return Math.round((Math.max(0,100-Math.abs(l.ph-7.4)*30)*.4 + (100-l.turbidez/2)*.3 + (100-l.tds/20)*.3)*10)/10;
}
export function calibracionVigente(c:Calibracion|null,fecha:number):boolean {
  return c !== null && Number.isFinite(c.verificadaEn) && Number.isFinite(c.venceEn) &&
    c.verificadaEn<=fecha && c.venceEn>fecha && c.responsable.trim().length>0 && c.referencia.trim().length>0;
}
/** Evalúa todos los peligros antes de seleccionar motivo. Fiabilidad nunca elimina vetos. */
export function evaluar(l:Lectura,o:Observacion,c:Calibracion|null):Resultado {
  const ica=calcularIca(l);
  const confiable=ica!==null && l.errores.length===0 && l.versionProtocolo<=1 && calibracionVigente(c,l.recibidaEn);
  const reglas: Array<{id:string;nivel:0|1|2;motivo:string}> = [];
  const agregar=(condicion:boolean,id:string,nivel:0|1|2,motivo:string)=>{
    if(condicion) reglas.push({id,nivel,motivo});
  };
  agregar(o.olorTipo==='combustible','R01',2,'Observaste olor a combustible. Busca otra fuente y consulta a la autoridad ambiental.');
  agregar(o.olor==='raro','R02',2,'Observaste un olor extraño. No uses esta agua; busca otra fuente.');
  agregar(o.visual==='aceitosa','R03',2,'Observaste una capa aceitosa. Hervir o filtrar con tela no elimina ese peligro.');
  agregar(o.visual==='verdosa' && o.origen==='estancada','R06',2,'El agua verdosa y estancada puede contener toxinas que no se eliminan hirviendo.');
  agregar(enRango(l.ph,0,14) && (l.ph<5.5 || l.ph>9.5),'R04',2,'El pH está en un extremo. Busca otra fuente y solicita una revisión técnica.');
  agregar(enRango(l.turbidez,0,200) && l.turbidez>=100,'R08',2,'La turbidez es muy alta. No inicies un tratamiento doméstico con esta lectura.');
  agregar(enRango(l.tds,0,2000) && l.tds>=1500,'R09',2,'Hay muchos sólidos disueltos. Hervir no elimina las sales.');
  agregar(!confiable,'R05',1,'La lectura o la calibración no están verificadas. Revisa el equipo y repite la medición.');
  agregar(o.visual==='verdosa','R07',1,'Observaste agua verdosa. Busca otra fuente; no intentes resolverlo solo hirviendo.');
  agregar(enRango(l.ph,0,14) && (l.ph<6.5 || l.ph>8.5),'R10',1,'El pH está fuera del rango de referencia para consumo humano. Consulta a un técnico.');
  agregar(enRango(l.turbidez,0,200) && l.turbidez>=25,'R11',1,'El agua contiene muchas partículas. Necesita revisión y tratamiento antes de volver a medir.');
  agregar(enRango(l.tds,0,2000) && l.tds>=600,'R12',1,'Los sólidos disueltos están elevados. Busca una fuente con menor contenido de sales.');
  agregar(o.origen==='estancada','R13',1,'El agua estancada puede contener microorganismos que este equipo no detecta.');
  agregar(o.origen==='no_se' || o.olor==='no_se' || o.visual==='no_se','R14',1,'Hay observaciones sin confirmar. Repite la observación con ayuda.');
  agregar(o.visual==='turbia','R16',1,'Observaste agua turbia. Es necesario aclararla antes de la desinfección.');
  agregar(reglas.length===0,'R15',0,'Los parámetros medidos están dentro de las referencias del proyecto. Desinfecta antes de beber.');
  // La lista se ordenó con todos los vetos antes de las condiciones de nivel 1.
  const principal=reglas[0];
  const ids=reglas.map(r=>r.id);
  const alternativa=principal.nivel===2 || ids.some(id=>['R07','R10','R11','R12'].includes(id));
  const plan:PlanId=alternativa?'alternativa':!confiable||ids.includes('R14')?'repetir':'hervido';
  return {
    version:VERSION_MOTOR,nivel:principal.nivel,reglaId:principal.id,reglas:ids,
    titulo:alternativa?'Busca otra fuente':plan==='repetir'?'Necesitamos otra medición':'Desinfecta antes de beber',
    motivo:principal.motivo,confiable,ica,plan,
    destinos:{humano:plan==='hervido'?'Requiere aclarado y desinfección': 'No consumir con esta evaluación',
      animal:alternativa?'No recomendado; consulta a un técnico':'Requiere evaluación según el animal',
      riego:alternativa?'No recomendado; consulta a un técnico':'Revisa el cultivo y el suelo con un técnico',
      bano:alternativa?'No te bañes con esta agua; busca otra fuente.':'No podemos confirmar si sirve para bañarse: el equipo no detecta microbios. Consulta orientación local.',
      utensilios:alternativa?'No la uses para lavar utensilios de comida.':plan==='hervido'?'Aclara y desinfecta el agua antes de lavar utensilios de comida.':'No decidas este uso con una lectura sin verificar; repite la medición.',
      ropa:alternativa?'Evita usarla para lavar ropa hasta una revisión técnica.':'No podemos confirmar este uso con los sensores; evita el contacto si sospechas contaminación.'},
    advertencias:[DESCARGO,...(confiable?[]:['Lectura no confiable: calibración o datos sin verificar.'])],
  };
}
