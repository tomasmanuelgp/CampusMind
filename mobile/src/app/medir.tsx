import {useEffect,useState} from 'react';
import {router} from 'expo-router';
import {Alert,AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Campo,s,colores} from '../ui/componentes';
import {useSesion} from '../aplicacion/sesion';
import {esEstable} from '../infraestructura/bluetooth/estabilidad';
import type {Observacion,OlorTipo,Uso} from '../dominio/tipos';

const origenes=[['corriente','Agua que corre'],['estancada','Agua quieta'],['no_se','No sé']] as const;
const olores=[['normal','Sin olor raro'],['raro','Huele raro'],['no_se','No sé']] as const;
const aspectos=[['limpia','Se ve clara'],['turbia','Tiene tierra'],['verdosa','Se ve verde'],['aceitosa','Tiene aceite'],['no_se','No sé']] as const;
const tiposOlor=[['azufre','Huevo podrido'],['combustible','Combustible'],['podrido','Cloaca'],['quimico','Químico'],['cloro','Cloro fuerte'],['otro','Otro / no sé']] as const;
const usos=[['beber','Beber'],['cocinar','Cocinar'],['banarse','Bañarse'],['utensilios','Lavar utensilios'],['ropa','Lavar ropa'],['ganado','Ganado'],['cultivo','Cultivos']] as const;

function Opcion({texto,elegida,onPress}:{texto:string;elegida:boolean;onPress:()=>void}){
  return <Pressable accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{selected:elegida}} onPress={onPress}
    style={({pressed})=>[est.opcion,elegida&&est.opcionElegida,pressed&&s.presionado]}>
    <Text style={[est.opcionTexto,elegida&&est.opcionTextoElegida]}>{elegida?'✓  ':''}{texto}</Text>
  </Pressable>;
}
function Grupo<T extends string>({titulo,ayuda,opciones,valor,elegir}:{titulo:string;ayuda:string;opciones:readonly (readonly [T,string])[];valor?:T;elegir:(v:T)=>void}){
  return <View style={est.grupo}><Text style={est.pregunta}>{titulo}</Text><Texto suave>{ayuda}</Texto>
    <View style={est.opciones}>{opciones.map(([id,texto])=><Opcion key={id} texto={texto} elegida={valor===id} onPress={()=>elegir(id)}/>)}</View>
  </View>;
}

export default function Medir(){
  const {lecturas,estado,demo,nombreEquipo,error}=useSesion();
  const [ahora,setAhora]=useState(Date.now()),[fuente,setFuente]=useState('');
  const [uso,setUso]=useState<Uso|undefined>(),[observacion,setObservacion]=useState<Partial<Observacion>>({});
  const [guardando,setGuardando]=useState(false),[verSensores,setVerSensores]=useState(false);
  useEffect(()=>{const t=setInterval(()=>setAhora(Date.now()),500);const sub=AppState.addEventListener('change',v=>{if(v!=='active')useSesion.setState({lecturas:[]});});return()=>{clearInterval(t);sub.remove();};},[]);
  const ultima=lecturas.at(-1),estable=estado==='recibiendo'&&esEstable(lecturas,ahora);
  const reciente=ultima && ahora-ultima.recibidaEn<5000;
  const completa=Boolean(fuente.trim()&&uso&&observacion.origen&&observacion.olor&&observacion.visual);
  const falta=[!fuente.trim()?'nombre de la fuente':null,!uso?'uso':null,!observacion.origen?'origen':null,!observacion.olor?'olor':null,!observacion.visual?'aspecto':null].filter(Boolean).join(', ');
  const elegirOlor=(valor:Observacion['olor'])=>setObservacion(v=>valor==='raro'?{...v,olor:valor}:{...v,olor:valor,olorTipo:undefined});
  const analizar=()=>{try{
    if(!uso||!observacion.origen||!observacion.olor||!observacion.visual||!fuente.trim())return;
    setGuardando(true);
    useSesion.getState().capturar(fuente,uso);
    useSesion.getState().observar(observacion);
    const id=useSesion.getState().finalizar();
    router.replace({pathname:'/resultado',params:{id}});
  }catch(e){setGuardando(false);Alert.alert('No se guardó el análisis',e instanceof Error?e.message:'Reintenta. Tu lectura puede estar guardada como pendiente.');}};
  return <Pantalla titulo="Mide y observa" demo={demo} compacto>
    <Texto>Una lectura y lo que notas del agua, todo aquí. No necesitas probarla.</Texto>
    {error?<Tarjeta tono="ambar"><Texto>{error}</Texto></Tarjeta>:null}
    <Tarjeta tono={estable?'verde':'ambar'}><Text style={s.etiqueta}>{estable?'✓ LECTURA ESTABLE':estado==='desconectado'?'EQUIPO DESCONECTADO':reciente?'ESTABILIZANDO…':'ESPERANDO DATOS…'}</Text><Texto>{estable?'Ya puedes analizar esta medición.':'Mantén las sondas quietas. Esperamos cuatro lecturas estables.'}</Texto>{ultima?.errores.map(e=><Texto key={e}>{e}</Texto>)}</Tarjeta>
    <Boton secundario texto={verSensores?'Ocultar lecturas':'Ver las 4 lecturas del equipo'} onPress={()=>setVerSensores(!verSensores)}/>
    {verSensores?<View style={est.sensores}>{[['pH',ultima?.ph,''],['Turbidez',ultima?.turbidez,'NTU'],['Sólidos',ultima?.tds,'ppm'],['Temperatura',ultima?.temperatura,'°C']].map(([nombre,valor,unidad])=><View style={est.sensor} key={String(nombre)}><Text style={est.sensorNombre}>{nombre}</Text><Text style={est.sensorValor}>{reciente&&valor!=null?String(valor):'—'}</Text><Text style={est.sensorUnidad}>{unidad||'acidez'}</Text></View>)}</View>:null}
    {!demo?<Texto suave>Una lectura estable no confirma calibración. Sin registro vigente, el resultado se marcará no confiable.</Texto>:null}
    <Tarjeta tono="cielo"><Text style={est.seccion}>1 · Identifica la fuente</Text><Campo etiqueta="¿Dónde tomaste esta agua?" placeholder="Ej. Quebrada de la finca" value={fuente} maxLength={80} onChangeText={setFuente}/></Tarjeta>
    <Tarjeta tono="lima"><Text style={est.seccion}>2 · ¿Para qué la necesitas?</Text><Texto suave>Elige un uso. Verás qué podemos decir sobre él.</Texto>
      <View style={est.opciones}>{usos.map(([id,texto])=><Opcion key={id} texto={texto} elegida={uso===id} onPress={()=>setUso(id)}/>)}</View></Tarjeta>
    <Tarjeta tono="ambar"><Text style={est.seccion}>3 · Lo que observas</Text><Texto suave>Tu conocimiento del lugar también cuenta. Si dudas, elige «No sé».</Texto>
      <Grupo titulo="¿El agua corre o está quieta?" ayuda="Piensa en la fuente, no en el recipiente." opciones={origenes} valor={observacion.origen} elegir={v=>setObservacion(o=>({...o,origen:v}))}/>
      <Grupo titulo="¿Notas un olor extraño?" ayuda="No acerques la cara si sospechas químicos. Nunca pruebes el agua." opciones={olores} valor={observacion.olor} elegir={elegirOlor}/>
      {observacion.olor==='raro'?<Grupo titulo="¿A qué se parece?" ayuda="Este detalle no cambia la advertencia por olor." opciones={tiposOlor} valor={observacion.olorTipo} elegir={(v:OlorTipo)=>setObservacion(o=>({...o,olorTipo:v}))}/>:null}
      <Grupo titulo="¿Cómo se ve?" ayuda="Mira el agua y su superficie." opciones={aspectos} valor={observacion.visual} elegir={v=>setObservacion(o=>({...o,visual:v}))}/>
    </Tarjeta>
    {!completa?<Texto suave>Para analizar, completa: {falta}.</Texto>:null}
    <Boton texto="Ver análisis y recomendaciones" disabled={!estable||!completa||guardando} onPress={analizar}/>
    <Boton secundario texto="Volver a conectar" onPress={()=>router.replace('/conectar')}/>
    <Boton secundario texto="Desconectar equipo" onPress={()=>{void useSesion.getState().desconectar();router.replace('/');}}/>
    <Texto suave>{nombreEquipo||'Sin equipo conectado'} · La evaluación queda guardada en este teléfono.</Texto>
  </Pantalla>;
}
const est=StyleSheet.create({
  sensores:{flexDirection:'row',flexWrap:'wrap',gap:10},sensor:{width:'48%',minWidth:128,flexGrow:1,backgroundColor:'white',borderWidth:1,borderColor:colores.borde,borderRadius:14,padding:14},
  sensorNombre:{fontSize:16,fontWeight:'700',color:colores.tinta},sensorValor:{fontSize:29,fontWeight:'800',color:colores.azul,fontVariant:['tabular-nums']},sensorUnidad:{fontSize:15,color:colores.tinta},
  seccion:{fontSize:22,lineHeight:29,fontWeight:'800',color:colores.tinta},pregunta:{fontSize:19,lineHeight:27,fontWeight:'700',color:colores.tinta},grupo:{gap:10,paddingVertical:8},
  opciones:{flexDirection:'row',flexWrap:'wrap',gap:10},opcion:{minHeight:64,minWidth:100,flexGrow:1,flexBasis:'44%',justifyContent:'center',backgroundColor:'white',borderWidth:2,borderColor:colores.borde,borderRadius:12,paddingHorizontal:13,paddingVertical:10},
  opcionElegida:{backgroundColor:colores.azul,borderColor:colores.azul},opcionTexto:{fontSize:17,lineHeight:23,fontWeight:'700',color:colores.tinta},opcionTextoElegida:{color:'white'},
});
