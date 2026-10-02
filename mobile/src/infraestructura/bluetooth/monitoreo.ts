import type {Lectura} from '../../dominio/tipos';

/** Mostrar sensores no requiere estabilidad, calibración ni validez de otros campos. */
export function lecturaEnVivo(lecturas:Lectura[],estado:string,ahora:number):Lectura|null {
  const ultima=lecturas.at(-1);
  return estado==='recibiendo' && ultima && ahora>=ultima.recibidaEn && ahora-ultima.recibidaEn<5000 ? ultima : null;
}
export type Sensor='ph'|'turbidez'|'tds'|'temperatura';
/** Los huecos de datos y valores inválidos cortan la curva; nunca se rellenan. */
export function segmentosSensor(lecturas:Lectura[],sensor:Sensor):number[][][] {
  const rangos:Record<Sensor,[number,number]>={ph:[0,14],turbidez:[0,200],tds:[0,2000],temperatura:[-55,125]};
  const puntos=lecturas.map((l,i)=>({i,t:l.recibidaEn,v:l[sensor]}));
  const validos=puntos.filter(p=>p.v!==null&&Number.isFinite(p.v)&&p.v>=rangos[sensor][0]&&p.v<=rangos[sensor][1]);
  if(!validos.length)return [];
  const minimo=Math.min(...validos.map(p=>p.v!)),maximo=Math.max(...validos.map(p=>p.v!));
  const segmentos:number[][][]=[];let actual:number[][]=[];let anterior:number|null=null;
  for(const p of puntos){
    if(p.v===null||!Number.isFinite(p.v)||p.v<rangos[sensor][0]||p.v>rangos[sensor][1]){
      if(actual.length)segmentos.push(actual);actual=[];anterior=null;continue;
    }
    if(anterior!==null&&(p.t-anterior>=5000||p.t<=anterior)){if(actual.length)segmentos.push(actual);actual=[];}
    actual.push([4+p.i*92/Math.max(1,puntos.length-1),maximo===minimo?25:46-(p.v-minimo)*42/(maximo-minimo)]);
    anterior=p.t;
  }
  if(actual.length)segmentos.push(actual);
  return segmentos;
}
