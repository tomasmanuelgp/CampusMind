import {useState,useEffect} from 'react';
import {router} from 'expo-router';
import {Alert,Text,View,AppState} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Campo,s} from '../ui/componentes';
import {useSesion} from '../aplicacion/sesion';
import {esEstable} from '../infraestructura/bluetooth/estabilidad';
export default function Medir(){
  const {lecturas,estado,demo,nombreEquipo,error}=useSesion();
  const [ahora,setAhora]=useState(Date.now()),[fuente,setFuente]=useState('');
  useEffect(()=>{const t=setInterval(()=>setAhora(Date.now()),500);const sub=AppState.addEventListener('change',s=>{if(s!=='active')useSesion.setState({lecturas:[]});});return()=>{clearInterval(t);sub.remove();};},[]);
  const ultima=lecturas.at(-1),estable=estado==='recibiendo'&&esEstable(lecturas,ahora);
  const reciente=ultima && ahora-ultima.recibidaEn<5000;
  return <Pantalla titulo="Escucha a tu agua" demo={demo}>
    <Texto>{nombreEquipo||'Sin equipo conectado'} · Mantén las sondas quietas dentro del agua.</Texto>
    {error?<Tarjeta tono="ambar"><Texto>{error}</Texto></Tarjeta>:null}
    <View style={s.fila}>{[['pH',ultima?.ph,''],['Turbidez',ultima?.turbidez,'NTU'],['Sólidos',ultima?.tds,'ppm'],['Temperatura',ultima?.temperatura,'°C']].map(([nombre,valor,unidad])=><View style={{minWidth:128,flex:1}} key={String(nombre)}><Tarjeta><Texto>{nombre}</Texto><Text style={s.sensor}>{reciente&&valor!=null?String(valor):'—'}</Text><Texto suave>{unidad||'acidez'}</Texto></Tarjeta></View>)}</View>
    <Tarjeta tono={estable?'verde':'ambar'}><Text style={s.etiqueta}>{estable?'✓ LECTURA ESTABLE':estado==='desconectado'?'EQUIPO DESCONECTADO':reciente?'ESTABILIZANDO…':'ESPERANDO DATOS…'}</Text><Texto>{estable?'Ya puedes capturar esta medición.':'Esperamos cuatro lecturas consecutivas estables antes de capturar.'}</Texto>{ultima?.errores.map(e=><Texto key={e}>{e}</Texto>)}</Tarjeta>
    {!demo?<Texto suave>La estabilidad no confirma calibración. Si no hay un registro técnico vigente, el resultado se marcará no confiable.</Texto>:null}
    <Campo etiqueta="Nombre de esta fuente" placeholder="Ej. Quebrada de la finca" value={fuente} maxLength={80} onChangeText={setFuente}/>
    <Boton texto="Capturar y observar" disabled={!estable} onPress={()=>{try{useSesion.getState().capturar(fuente);router.push('/observacion');}catch(e){Alert.alert('No se guardó la captura',e instanceof Error?e.message:'Reintenta antes de continuar.');}}}/>
    <Boton secundario texto="Volver a conectar" onPress={()=>router.replace('/conectar')}/>
    <Boton secundario texto="Desconectar equipo" onPress={()=>{void useSesion.getState().desconectar();router.replace('/');}}/>
  </Pantalla>;
}
