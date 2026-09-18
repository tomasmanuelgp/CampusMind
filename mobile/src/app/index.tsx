import {useCallback,useState} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {Text,View} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Gota,s} from '../ui/componentes';
import {listarCapturas,type Registro} from '../infraestructura/db/repositorio';
import {useSesion} from '../aplicacion/sesion';
export default function Inicio(){
  const [registros,setRegistros]=useState<Registro[]>([]),[error,setError]=useState('');
  useFocusEffect(useCallback(()=>{try{setRegistros(listarCapturas());setError('');}catch{setError('No pudimos abrir el historial. Reinicia la aplicación antes de medir.');}},[]));
  const borrador=registros.find(r=>!r.completa);
  return <Pantalla titulo={'Conoce tu agua.\nDecide qué hacer.'} volver={false}>
    <Texto>Tu equipo y lo que observas, juntos para cuidar el agua de cada día.</Texto>
    <Tarjeta tono="verde"><View style={s.fila}><Gota tamano={58}/><View style={{flex:1,gap:4}}><Text style={s.etiqueta}>SIN INTERNET</Text><Texto>Conecta tu equipo y empieza una medición.</Texto></View></View><Boton texto="Medir agua" onPress={()=>router.push('/conectar')} icono="＋" disabled={!!error}/></Tarjeta>
    {error?<Tarjeta tono="rojo"><Texto>{error}</Texto></Tarjeta>:null}
    {borrador?<Tarjeta tono="ambar"><Text style={s.etiqueta}>MEDICIÓN PENDIENTE{borrador.captura.demo?' · DEMO':''}</Text><Texto>{borrador.captura.fuente}</Texto><Boton secundario texto="Continuar observación" onPress={()=>{useSesion.getState().reanudar(borrador.captura);router.push('/observacion');}}/></Tarjeta>:null}
    <Boton secundario texto="Mis mediciones" icono="≡" onPress={()=>router.push('/historial')}/>
    <Boton secundario texto="Mi equipo y calibración" icono="◎" onPress={()=>router.push('/equipo')}/>
    <Boton secundario texto="Aprender a medir" icono="?" onPress={()=>router.push('/aprender')}/>
    <Texto suave>Medimos pH, turbidez, sólidos disueltos y temperatura. El equipo no detecta microorganismos.</Texto>
  </Pantalla>;
}
