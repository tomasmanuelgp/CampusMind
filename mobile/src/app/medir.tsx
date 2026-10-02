import {useEffect,useState} from 'react';
import {router} from 'expo-router';
import {Alert,AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Campo,s,colores} from '../ui/componentes';
import {useSesion} from '../aplicacion/sesion';
import {esEstable,lecturaRecienteValida} from '../infraestructura/bluetooth/estabilidad';
import {calcularIca} from '../dominio/motor';
import type {Observacion,OlorTipo,Uso,Calibracion} from '../dominio/tipos';
import {resumirEnVivo} from '../dominio/resumenEnVivo';
import {leerAjuste} from '../infraestructura/db/repositorio';
import Svg,{Polyline,Circle} from 'react-native-svg';
import {lecturaEnVivo,segmentosSensor} from '../infraestructura/bluetooth/monitoreo';

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
  const {lecturas,estado,demo,nombreEquipo,equipo,error}=useSesion();
  const [calibracion,setCalibracion]=useState<Calibracion|null>(null);
  useEffect(()=>{
    try{
      const dato=demo?null:leerAjuste('calibracion:'+equipo);
      setCalibracion(demo?{verificadaEn:0,venceEn:8640000000000000,responsable:'DEMO',referencia:'SIMULACIÓN'}:dato?JSON.parse(dato):null);
    }catch{setCalibracion(null);}
  },[equipo,demo]);
  const [ahora,setAhora]=useState(Date.now()),[fuente,setFuente]=useState('');
  const [uso,setUso]=useState<Uso|undefined>(),[observacion,setObservacion]=useState<Partial<Observacion>>({});
  const [guardando,setGuardando]=useState(false),[diagnostico,setDiagnostico]=useState(false);
  useEffect(()=>{const t=setInterval(()=>setAhora(Date.now()),500);const sub=AppState.addEventListener('change',v=>{if(v!=='active')useSesion.setState({lecturas:[]});});return()=>{clearInterval(t);sub.remove();};},[]);
  const ultima=lecturas.at(-1),lectura=estado==='recibiendo'?lecturaRecienteValida(lecturas,ahora):null;
  const vivo=lecturaEnVivo(lecturas,estado,ahora);
  const estable=Boolean(lectura&&esEstable(lecturas,ahora));
  const ica=vivo?calcularIca(vivo):null;
  const resumen=resumirEnVivo(vivo,observacion,calibracion,uso,estable);
  const conclusion=(detallada=false)=><Tarjeta tono={resumen.tono}>
    <Text style={s.etiqueta}>{demo?'PRÁCTICA · CONCLUSIÓN SIMULADA':'¿PUEDO CONSUMIR ESTA AGUA?'}</Text>
    <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={est.seccion}>{resumen.titulo}</Text>
    <Texto>{resumen.detalle}</Texto>
    {!resumen.confiable?<Texto suave>Evaluación preliminar no confiable: lectura inicial, datos u observaciones pendientes, o calibración sin verificar.</Texto>:null}
    {resumen.uso?<Texto><Text style={{fontWeight:'800'}}>{resumen.uso}: </Text>{resumen.estadoUso}</Texto>:null}
    {detallada?resumen.pasos.map((paso,i)=><Texto key={paso}>{i+1}. {paso}</Texto>):null}
    <Texto suave>{resumen.descargo}</Texto>
  </Tarjeta>;
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
    <Texto>Tu lectura y lo que observas, en un solo lugar. Nunca pruebes el agua.</Texto>
    {conclusion()}
    {error?<Tarjeta tono="ambar"><Texto>{error}</Texto></Tarjeta>:null}
    <Tarjeta tono={vivo?'verde':'ambar'}><Text style={s.etiqueta}>{vivo?'● DATOS EN VIVO':estado==='desconectado'?'EQUIPO DESCONECTADO':'ESPERANDO DATOS…'}</Text>
      <Texto>{vivo?`Actualizado hace ${Math.max(0,Math.floor((ahora-vivo.recibidaEn)/1000))} s. Los valores cambian con cada lectura del equipo.`:'No hay una lectura reciente. Revisa la conexión y que el equipo esté enviando datos.'}</Texto>
      <Texto>{lectura?'Ya puedes analizar; no necesitas esperar estabilidad.':vivo?'Puedes observar los valores disponibles. Para analizar, revisa los datos indicados abajo.':'Los números anteriores no se muestran como datos actuales.'}</Texto>
      {vivo?.errores.map(e=><Texto key={e}>{e}</Texto>)}</Tarjeta>
    <Tarjeta tono="cielo"><View style={est.filaIca}><View style={{flex:1}}><Text style={s.etiqueta}>ICA ORIENTATIVO</Text><Texto>De 0 a 100. No indica si el agua es potable.</Texto></View><Text style={est.ica}>{ica===null?'—':Math.round(ica)}</Text></View>
      <View style={est.sensores}>{([['pH','ph','acidez'],['Turbidez','turbidez','NTU'],['Sólidos','tds','ppm'],['Temperatura','temperatura','°C']] as const).map(([nombre,sensor,unidad])=>{
        const valor=vivo?.[sensor],segmentos=vivo?segmentosSensor(lecturas,sensor):[];
        return <View style={est.sensor} key={sensor}><Text style={est.sensorNombre}>{nombre}</Text><Text style={est.sensorValor}>{valor!=null?String(valor):'—'}</Text><Text style={est.sensorUnidad}>{unidad}</Text>
          <Svg height={50} width="100%" viewBox="0 0 100 50" aria-hidden={true}>{segmentos.map((puntos,i)=>puntos.length===1?<Circle key={i} cx={puntos[0][0]} cy={puntos[0][1]} r={2} fill={colores.azul}/>:<Polyline key={i} points={puntos.map(p=>p.join(',')).join(' ')} fill="none" stroke={colores.azul} strokeWidth={2}/>)}</Svg>
        </View>;
      })}</View>
      <Texto suave>Comportamiento reciente: hasta 60 lecturas. Cada curva usa su propia escala; muestra cambios, no potabilidad.</Texto>
    </Tarjeta>
    <Boton secundario texto={diagnostico?'Ocultar datos del equipo':'Ver datos recibidos por Bluetooth'} onPress={()=>setDiagnostico(!diagnostico)}/>
    {diagnostico?<Tarjeta><Texto>Última trama: {ultima?new Date(ultima.recibidaEn).toLocaleTimeString('es-CO'):'No recibida'} · {lecturas.length} lecturas en memoria</Texto>
      <Texto>{estable?'Variación pequeña entre las últimas lecturas.':'Los valores pueden variar; eso no impide verlos.'}</Texto>
      {ultima?.avisos?.map(a=><Texto key={a}>{a}</Texto>)}<Text selectable style={est.trama}>{ultima?.tramaOriginal||'Todavía no se recibió una trama de sensores cerrada con ---.'}</Text></Tarjeta>:null}
    {!demo?<Texto suave>Sin registro de calibración vigente, el resultado no se considera confiable aunque las cifras se repitan.</Texto>:null}
    <Tarjeta tono="cielo"><Text style={est.seccion}>Nombra la fuente</Text><Campo etiqueta="¿Dónde tomaste esta agua?" placeholder="Ej. Quebrada de la finca" value={fuente} maxLength={80} onChangeText={setFuente}/></Tarjeta>
    <Tarjeta tono="lima"><Text style={est.seccion}>¿Para qué usarás el agua?</Text><Texto suave>Elige el uso que necesitas ahora.</Texto>
      <View style={est.opciones}>{usos.map(([id,texto])=><Opcion key={id} texto={texto} elegida={uso===id} onPress={()=>setUso(id)}/>)}</View></Tarjeta>
    <Tarjeta tono="ambar"><Text style={est.seccion}>¿Qué notas en el agua?</Text><Texto suave>Tu conocimiento del lugar también cuenta. Si dudas, elige «No sé».</Texto>
      <Grupo titulo="¿El agua corre o está quieta?" ayuda="Piensa en la fuente, no en el recipiente." opciones={origenes} valor={observacion.origen} elegir={v=>setObservacion(o=>({...o,origen:v}))}/>
      <Grupo titulo="¿Notas un olor extraño?" ayuda="No acerques la cara si sospechas químicos. Nunca pruebes el agua." opciones={olores} valor={observacion.olor} elegir={elegirOlor}/>
      {observacion.olor==='raro'?<Grupo titulo="¿A qué se parece?" ayuda="Este detalle no cambia la advertencia por olor." opciones={tiposOlor} valor={observacion.olorTipo} elegir={(v:OlorTipo)=>setObservacion(o=>({...o,olorTipo:v}))}/>:null}
      <Grupo titulo="¿Cómo se ve?" ayuda="Mira el agua y su superficie." opciones={aspectos} valor={observacion.visual} elegir={v=>setObservacion(o=>({...o,visual:v}))}/>
    </Tarjeta>
    {conclusion(true)}
    {!completa?<Texto suave>Para analizar, completa: {falta}.</Texto>:null}
    <Boton texto="Ver qué puedo hacer con esta agua" disabled={!lectura||!completa||guardando} onPress={analizar}/>
    <Boton secundario texto="Volver a conectar" onPress={()=>router.replace('/conectar')}/>
    <Boton secundario texto="Desconectar equipo" onPress={()=>{void useSesion.getState().desconectar();router.replace('/');}}/>
    <Texto suave>{nombreEquipo||'Sin equipo conectado'} · La evaluación queda guardada en este teléfono.</Texto>
  </Pantalla>;
}
const est=StyleSheet.create({
  filaIca:{flexDirection:'row',alignItems:'center',gap:16},ica:{fontSize:46,lineHeight:52,fontWeight:'900',color:colores.azul,fontVariant:['tabular-nums']},
  trama:{fontFamily:'monospace',fontSize:14,lineHeight:21,color:colores.tinta},
  sensores:{flexDirection:'row',flexWrap:'wrap',gap:10},sensor:{width:'48%',minWidth:128,flexGrow:1,backgroundColor:'white',borderWidth:1,borderColor:colores.borde,borderRadius:14,padding:14},
  sensorNombre:{fontSize:16,fontWeight:'700',color:colores.tinta},sensorValor:{fontSize:29,fontWeight:'800',color:colores.azul,fontVariant:['tabular-nums']},sensorUnidad:{fontSize:15,color:colores.tinta},
  seccion:{fontSize:22,lineHeight:29,fontWeight:'800',color:colores.tinta},pregunta:{fontSize:19,lineHeight:27,fontWeight:'700',color:colores.tinta},grupo:{gap:10,paddingVertical:8},
  opciones:{flexDirection:'row',flexWrap:'wrap',gap:10},opcion:{minHeight:64,minWidth:100,flexGrow:1,flexBasis:'44%',justifyContent:'center',backgroundColor:'white',borderWidth:2,borderColor:colores.borde,borderRadius:12,paddingHorizontal:13,paddingVertical:10},
  opcionElegida:{backgroundColor:colores.azul,borderColor:colores.azul},opcionTexto:{fontSize:17,lineHeight:23,fontWeight:'700',color:colores.tinta},opcionTextoElegida:{color:'white'},
});
