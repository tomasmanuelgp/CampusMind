import {useEffect,useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text,Alert,AppState} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Audio,s} from '../ui/componentes';
import {obtenerCaptura,leerAjuste,guardarAjuste,type Registro} from '../infraestructura/db/repositorio';
import {protocolos} from '../dominio/protocolos';
import {DESCARGO,type Resultado} from '../dominio/motor';
export default function ProtocoloPantalla(){
  const {id}=useLocalSearchParams<{id:string}>();
  const [registro,setRegistro]=useState<Registro|null>(null),[paso,setPaso]=useState(0),[fin,setFin]=useState<number|null>(null),[ahora,setAhora]=useState(Date.now());
  useEffect(()=>{try{setRegistro(obtenerCaptura(id));const dato=leerAjuste('progreso:'+id);if(dato){const p=JSON.parse(dato);setPaso(p.paso);setFin(p.fin);}}catch{Alert.alert('No pudimos recuperar el progreso','Revisa el procedimiento desde el principio.');}},[id]);
  useEffect(()=>{const t=setInterval(()=>setAhora(Date.now()),500);const sub=AppState.addEventListener('change',()=>setAhora(Date.now()));return()=>{clearInterval(t);sub.remove();};},[]);
  if(!registro?.resultado)return <Pantalla titulo="Busca tu medición"><Boton texto="Historial" onPress={()=>router.replace('/historial')}/></Pantalla>;
  const resultado=JSON.parse(registro.resultado) as Resultado,plan=protocolos[resultado.plan],actual=plan.pasos[paso];
  const guardar=(nuevoPaso:number,nuevoFin:number|null)=>{try{guardarAjuste('progreso:'+id,JSON.stringify({paso:nuevoPaso,fin:nuevoFin}));setPaso(nuevoPaso);setFin(nuevoFin);}catch{Alert.alert('No se guardó el avance','Intenta de nuevo.');}};
  if(!actual)return <Pantalla titulo="Pasos completados" demo={registro.captura.demo}><Texto>Completar el procedimiento no certifica el agua. Evita volver a contaminarla al guardarla.</Texto><Texto>{DESCARGO}</Texto><Boton texto="Volver al resultado" onPress={()=>router.replace({pathname:'/resultado',params:{id}})}/><Boton secundario texto="Revisar pasos otra vez" onPress={()=>guardar(0,null)}/></Pantalla>;
  const restante=fin===null?actual.segundos??0:Math.max(0,Math.ceil((fin-ahora)/1000));
  return <Pantalla key={paso} titulo={actual.titulo} demo={registro.captura.demo}>
    <Text style={s.etiqueta}>{plan.titulo} · PASO {paso+1} DE {plan.pasos.length}</Text>
    <Tarjeta><Texto>{actual.texto}</Texto></Tarjeta>
    <Audio texto={actual.titulo+'. '+actual.texto+'. '+plan.limites}/>
    {actual.segundos?<Tarjeta tono="verde"><Text style={s.sensor}>{Math.floor(restante/60)}:{String(restante%60).padStart(2,'0')}</Text><Texto>{fin===null?'Inicia cuando el agua hierva con burbujas grandes.':restante?'Mantén el hervor durante toda la cuenta.':'Tiempo cumplido. Ya puedes continuar.'}</Texto><Boton secundario texto={fin===null?'Iniciar temporizador':'Reiniciar si se interrumpió el hervor'} onPress={()=>guardar(paso,Date.now()+actual.segundos!*1000)}/></Tarjeta>:null}
    <Boton texto={paso===plan.pasos.length-1?'Terminar los pasos':'Hecho · siguiente paso'} disabled={!!actual.segundos&&(fin===null||restante>0)} onPress={()=>guardar(paso+1,null)}/>
    {paso>0?<Boton secundario texto="Paso anterior" onPress={()=>guardar(paso-1,null)}/>:null}
    <Tarjeta tono="ambar"><Texto>{plan.limites}</Texto></Tarjeta><Texto suave>Materiales: {plan.materiales}</Texto><Texto suave>{DESCARGO}</Texto>
  </Pantalla>;
}
