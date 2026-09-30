import {create} from 'zustand';
import {randomUUID} from 'expo-crypto';
import type {Captura,Lectura,Observacion,Calibracion,Uso} from '../dominio/tipos';
import {ParserTramas} from '../infraestructura/bluetooth/parser';
import {esEstable,lecturaRecienteValida} from '../infraestructura/bluetooth/estabilidad';
import {conectarEquipo} from '../infraestructura/bluetooth/servicio';
import {guardarAjuste,leerAjuste,guardarBorrador,completarCaptura} from '../infraestructura/db/repositorio';
import {evaluar} from '../dominio/motor';

type Estado='desconectado'|'conectando'|'recibiendo'|'esperando';
interface Sesion {
  estado:Estado; equipo:string; nombreEquipo:string; demo:boolean; lecturas:Lectura[]; error:string|null;
  captura:Captura|null; conectar:(id:string,nombre:string,reintento?:number)=>Promise<void>; iniciarDemo:()=>Promise<void>;
  desconectar:()=>Promise<void>; capturar:(fuente:string,uso?:Uso)=>Captura;
  observar:(datos:Partial<Observacion>)=>void; finalizar:()=>string;
  reanudar:(captura:Captura)=>void;
}
let cerrar:(()=>Promise<void>)|null=null;
let generacion=0;
let reconexion:ReturnType<typeof setTimeout>|null=null;
const parser=new ParserTramas();
export const useSesion=create<Sesion>((set,get)=>({
  estado:'desconectado',equipo:'',nombreEquipo:'',demo:false,lecturas:[],error:null,captura:null,
  desconectar:async()=>{
    if(reconexion!==null){clearTimeout(reconexion);reconexion=null;}
    generacion++; const anterior=cerrar; cerrar=null; parser.reiniciar();
    set({estado:'desconectado',lecturas:[]});
    if(anterior) { try { await anterior(); } catch { set({error:'El equipo ya está desconectado.'}); } }
  },
  conectar:async(id,nombre,reintento=0)=>{
    if(get().estado==='conectando') return;
    await get().desconectar(); const intento=++generacion;
    set({estado:'conectando',equipo:id,nombreEquipo:nombre,demo:false,error:null});
    let recuperando=false;
    const recuperar=()=>{
      if(intento!==generacion||recuperando)return;
      recuperando=true;
      parser.reiniciar();
      set({estado:'desconectado',lecturas:[],error:reintento<3?'Se perdió la conexión. Intentaremos recuperar el mismo equipo.':'No recuperamos el equipo. Acércalo y pulsa Volver a conectar.'});
      if(reintento<3)reconexion=setTimeout(()=>{
        reconexion=null;
        if(intento===generacion)void get().conectar(id,nombre,reintento+1);
      },[1000,3000,7000][reintento]);
    };
    try {
      const cierre=await conectarEquipo(id,datos=>{
        if(intento!==generacion) return;
        const recibidas=parser.recibir(datos,Date.now());
        if(recibidas.length) {
          set(s=>({estado:'recibiendo',lecturas:[...s.lecturas,...recibidas].slice(-4)}));
          try { guardarAjuste('equipo',JSON.stringify({id,nombre})); } catch { set({error:'No pudimos recordar el equipo en este teléfono.'}); }
        }
      },recuperar);
      if(intento!==generacion) {await cierre();return;}
      cerrar=cierre; if(get().estado==='conectando') set({estado:'esperando'});
    } catch(error) { if(intento===generacion) {
      if(reintento>0)recuperar();
      else set({estado:'desconectado',error:error instanceof Error?error.message:'No pudimos conectar. Revisa el equipo y los permisos.'});
    } }
  },
  iniciarDemo:async()=>{
    await get().desconectar(); const intento=++generacion;
    set({demo:true,equipo:'DEMO',nombreEquipo:'Equipo de práctica',estado:'esperando',error:null});
    const emitir=()=>{
      if(intento!==generacion) return;
      const lecturas=parser.recibir('VER:1\nESTADO:0\nICA:96\npH:7.4\nTDS:145\nTURB:2\nTEMP:24\n---\n',Date.now());
      set(s=>({estado:'recibiendo',lecturas:[...s.lecturas,...lecturas].slice(-4)}));
    };
    emitir(); const temporizador=setInterval(emitir,1500);
    cerrar=async()=>clearInterval(temporizador);
  },
  capturar:(fuente,uso)=>{
    const s=get();
    const ahora=Date.now();
    const lectura=lecturaRecienteValida(s.lecturas,ahora);
    if(!lectura || s.estado!=='recibiendo') throw new Error('Espera una lectura completa y reciente antes de analizar.');
    const estabilidad=esEstable(s.lecturas,ahora)?'estable':'inicial';
    let calibracion:Calibracion|null=null;
    if(s.demo) calibracion={verificadaEn:0,venceEn:8640000000000000,responsable:'DEMO',referencia:'SIMULACIÓN'};
    else { const dato=leerAjuste('calibracion:'+s.equipo); if(dato) calibracion=JSON.parse(dato); }
    const captura:Captura={id:randomUUID(),fuente:fuente.trim()||'Fuente sin nombre',equipo:s.equipo,demo:s.demo,uso,estabilidad,
      lectura:JSON.parse(JSON.stringify(lectura)),calibracion,observacion:{}};
    guardarBorrador(captura); set({captura}); return captura;
  },
  observar:datos=>{
    const actual=get().captura; if(!actual) throw new Error('Primero captura una medición.');
    const captura={...actual,observacion:{...actual.observacion,...datos}};
    if(datos.olor && datos.olor!=='raro') delete captura.observacion.olorTipo;
    guardarBorrador(captura); set({captura});
  },
  finalizar:()=>{
    const c=get().captura;
    if(!c?.observacion.origen||!c.observacion.olor||!c.observacion.visual) throw new Error('Completa las tres observaciones.');
    const resultado=evaluar(c.lectura,c.observacion as Observacion,c.calibracion,c.estabilidad!=='inicial');
    completarCaptura(c,resultado); set({captura:null}); return c.id;
  },
  reanudar:captura=>set({captura}),
}));
