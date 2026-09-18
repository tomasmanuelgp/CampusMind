import {useCallback,useState} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {Text} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,s} from '../ui/componentes';
import {listarCapturas,type Registro} from '../infraestructura/db/repositorio';
import {useSesion} from '../aplicacion/sesion';
import {DESCARGO,type Resultado} from '../dominio/motor';
export default function Historial(){
  const [filas,setFilas]=useState<Registro[]>([]),[error,setError]=useState('');
  useFocusEffect(useCallback(()=>{try{setFilas(listarCapturas());setError('');}catch{setError('No pudimos leer el historial. Reinicia la aplicación.');}},[]));
  return <Pantalla titulo="Mis mediciones"><Texto>Guardadas en tu teléfono, incluso sin señal.</Texto><Tarjeta tono="ambar"><Texto>{DESCARGO}</Texto></Tarjeta>
    {error?<Tarjeta tono="rojo"><Texto>{error}</Texto></Tarjeta>:null}
    {!filas.length&&!error?<Tarjeta><Texto>Todavía no has guardado mediciones.</Texto><Boton texto="Medir mi primera fuente" onPress={()=>router.push('/conectar')}/></Tarjeta>:null}
    {filas.map(f=>{const r=f.resultado?JSON.parse(f.resultado) as Resultado:null;return <Tarjeta key={f.captura.id} tono={r?.nivel===2?'rojo':'blanco'}><Text style={s.etiqueta}>{f.captura.demo?'DEMO · ':''}{new Date(f.captura.lectura.recibidaEn).toLocaleString('es-CO')}</Text><Text style={[s.texto,{fontWeight:'800'}]}>{f.captura.fuente}</Text><Texto>{r?.titulo??'Observación pendiente'}</Texto>{r&&!r.confiable?<Texto>Lectura no confiable</Texto>:null}<Boton secundario texto={f.completa?'Abrir resultado':'Continuar observación'} onPress={()=>{if(f.completa)router.push({pathname:'/resultado',params:{id:f.captura.id}});else{useSesion.getState().reanudar(f.captura);router.push('/observacion');}}}/></Tarjeta>;})}
  </Pantalla>;
}
