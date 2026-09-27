import {useEffect,useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text,Share,Alert} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Audio,s} from '../ui/componentes';
import {obtenerCaptura,type Registro} from '../infraestructura/db/repositorio';
import type {Resultado} from '../dominio/motor';
import {DESCARGO} from '../dominio/motor';
import {nombresUso,orientarUso} from '../dominio/orientacion';
export default function ResultadoPantalla(){
  const {id}=useLocalSearchParams<{id:string}>();const [registro,setRegistro]=useState<Registro|null>(null),[error,setError]=useState(''),[detalles,setDetalles]=useState(false);
  useEffect(()=>{try{setRegistro(obtenerCaptura(id));}catch{setError('No pudimos leer la medición guardada.');}},[id]);
  if(!registro?.resultado)return <Pantalla titulo="Resultado no disponible"><Texto>{error||'Busca la medición en el historial o continúa su observación.'}</Texto><Boton texto="Ir al historial" onPress={()=>router.replace('/historial')}/></Pantalla>;
  const r=JSON.parse(registro.resultado) as Resultado,c=registro.captura;
  const uso=c.uso??'beber',guia=orientarUso(r,uso),titulo=c.uso&&uso!=='beber'&&uso!=='cocinar'?'Revisa este uso':r.titulo;
  const resumen=`${c.demo?'DEMO — datos simulados. ':''}${c.fuente}. ${r.titulo}. Para ${nombresUso[uso]}: ${guia.estado}. ${r.motivo}. ${r.advertencias.join(' ')} ${guia.pasos.join(' ')} Consumo humano: ${r.destinos.humano}. Animales: ${r.destinos.animal}. Riego: ${r.destinos.riego}.`;
  return <Pantalla titulo={titulo} demo={c.demo} compacto>
    <Text style={s.etiqueta}>{c.fuente} · {new Date(c.lectura.recibidaEn).toLocaleDateString('es-CO')}</Text>
    <Tarjeta tono={r.nivel===2?'rojo':r.confiable?'verde':'ambar'}>
      <Text style={[s.etiqueta,{color:'#1C2833'}]}>TU USO · {nombresUso[uso].toUpperCase()}</Text>
      <Text style={[s.texto,{fontWeight:'800'}]}>{guia.estado}</Text>
      {uso!=='beber'&&uso!=='cocinar'?<Texto>🚰 Beber o cocinar: {r.destinos.humano}</Texto>:null}
      {!r.confiable?<Text style={[s.texto,{fontWeight:'800'}]}>Lectura no confiable · calibración o datos sin verificar</Text>:null}
      <Texto>{DESCARGO}</Texto>
      <Texto>{r.motivo}</Texto>
    </Tarjeta>
    {(r.plan!=='hervido'||uso==='beber'||uso==='cocinar'||uso==='utensilios')?<Boton texto={r.plan==='hervido'?'Ver cómo desinfectar':r.plan==='repetir'?'Ver cómo repetir':'Ver qué hacer'} onPress={()=>router.push({pathname:'/protocolo',params:{id}})}/>:null}
    <Tarjeta tono="cielo"><Text style={[s.etiqueta,{color:'#1C2833'}]}>QUÉ HACER AHORA</Text>{guia.pasos.map((paso,i)=><Texto key={paso}>{i+1}. {paso}</Texto>)}</Tarjeta>
    <Audio texto={resumen}/>
    <Tarjeta><Text style={[s.etiqueta,{color:'#1C2833'}]}>OTROS USOS</Text>
      {uso!=='utensilios'?<Texto>🧼 Utensilios: {r.destinos.utensilios??'Necesita revisión'}</Texto>:null}
      {uso!=='ropa'?<Texto>👕 Ropa: {r.destinos.ropa??'Necesita revisión'}</Texto>:null}
      {uso!=='banarse'?<Texto>🚿 Baño: {r.destinos.bano??'Necesita revisión'}</Texto>:null}
      {uso!=='ganado'?<Texto>🐄 Ganado: {r.destinos.animal}</Texto>:null}
      {uso!=='cultivo'?<Texto>🌱 Cultivos: {r.destinos.riego}</Texto>:null}
    </Tarjeta>
    <Boton secundario texto={detalles?'Ocultar los números':'Ver los números y observaciones'} onPress={()=>setDetalles(!detalles)}/>
    {detalles?<Tarjeta><Texto>pH: {c.lectura.ph??'No disponible'}</Texto><Texto>Turbidez: {c.lectura.turbidez??'No disponible'} NTU</Texto><Texto>Sólidos: {c.lectura.tds??'No disponible'} ppm</Texto><Texto>Temperatura: {c.lectura.temperatura??'No disponible'} °C</Texto><Texto>Índice auxiliar: {r.ica??'No calculable'}</Texto><Texto>Origen: {c.observacion.origen} · Olor: {c.observacion.olor} · Aspecto: {c.observacion.visual}</Texto><Texto suave>Reglas {r.reglas.join(', ')} · Motor {r.version}</Texto></Tarjeta>:null}
    <Texto suave>✓ Guardada en este teléfono{c.demo?' como práctica':''}. No necesitas internet.</Texto>
    <Boton secundario texto="Compartir resultado" onPress={()=>{void Share.share({message:resumen}).catch(()=>Alert.alert('No se pudo compartir','La medición sigue guardada en tu teléfono.'));}}/>
    <Boton texto="Nueva medición" onPress={()=>router.replace('/conectar')}/>
  </Pantalla>;
}
