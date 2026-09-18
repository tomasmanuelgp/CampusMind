import {useState,useEffect} from 'react';
import {router} from 'expo-router';
import {Linking,Text} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Cargando,s} from '../ui/componentes';
import {buscarEquipos,type Equipo} from '../infraestructura/bluetooth/servicio';
import {leerAjuste} from '../infraestructura/db/repositorio';
import {useSesion} from '../aplicacion/sesion';
export default function Conectar(){
  const [equipos,setEquipos]=useState<Equipo[]>([]),[buscando,setBuscando]=useState(false),[error,setError]=useState('');
  const [recordado,setRecordado]=useState<{id:string;nombre:string}|null>(null);
  const estado=useSesion(v=>v.estado),errorConexion=useSesion(v=>v.error);
  useEffect(()=>{try{const valor=leerAjuste('equipo');if(valor)setRecordado(JSON.parse(valor));}catch{setError('No pudimos recuperar el equipo recordado. Puedes buscarlo otra vez.');}},[]);
  const conectar=async(id:string,nombre:string)=>{await useSesion.getState().conectar(id,nombre);if(useSesion.getState().estado!=='desconectado')router.push('/medir');};
  const ocupado=buscando||estado==='conectando';
  return <Pantalla titulo="Conecta tu equipo">
    <Texto>Enciende Re-Fluye y mantenlo cerca. La primera vez, Android te pedirá permiso para encontrarlo.</Texto>
    <Tarjeta><Text style={s.etiqueta}>1 · ENCIENDE   2 · CONECTA   3 · MIDE</Text><Texto>Selecciona tu equipo una vez. Lo recordaremos para las siguientes mediciones.</Texto></Tarjeta>
    {recordado?<Boton texto={'Conectar a '+recordado.nombre} disabled={ocupado} onPress={()=>void conectar(recordado.id,recordado.nombre)}/>:null}
    <Boton texto={buscando?'Buscando equipos…':'Buscar equipos cercanos'} disabled={ocupado} onPress={async()=>{setBuscando(true);setError('');try{const lista=await buscarEquipos();setEquipos(lista);if(!lista.length)setError('No encontramos equipos. Comprueba que Re-Fluye esté encendido y vuelve a buscar.');}catch(e){setError(e instanceof Error?e.message:'No pudimos buscar el equipo.');}finally{setBuscando(false);}}}/>
    {ocupado?<Cargando texto={buscando?'La búsqueda puede tardar unos segundos.':'Conectando con el equipo…'}/>:null}
    {equipos.map(e=><Tarjeta key={e.id}><Texto>{e.nombre}</Texto><Texto suave>{e.emparejado?'Ya emparejado':'Nuevo equipo'} · termina en {e.id.slice(-5)}</Texto><Boton secundario texto={'Elegir '+e.nombre} disabled={ocupado} onPress={()=>void conectar(e.id,e.nombre)}/></Tarjeta>)}
    {error||errorConexion?<Tarjeta tono="ambar"><Texto>{error||errorConexion}</Texto><Boton secundario texto="Abrir ajustes de permisos" onPress={()=>void Linking.openSettings()}/></Tarjeta>:null}
    <Texto suave>El permiso para buscar equipos no guarda tu ubicación. Si Android solicita un PIN, consulta el del equipo (la documentación original indica 1234).</Texto>
    <Boton secundario texto="Practicar sin equipo · DEMO" disabled={ocupado} onPress={async()=>{await useSesion.getState().iniciarDemo();router.push('/medir');}}/>
  </Pantalla>;
}
