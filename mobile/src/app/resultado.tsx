import {useEffect,useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text,Share,Alert,StyleSheet,View} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Audio,s,colores} from '../ui/componentes';
import {obtenerCaptura,type Registro} from '../infraestructura/db/repositorio';
import type {Resultado} from '../dominio/motor';
import {DESCARGO} from '../dominio/motor';
import {nombresUso,orientarUso} from '../dominio/orientacion';
export default function ResultadoPantalla(){
  const {id}=useLocalSearchParams<{id:string}>();const [registro,setRegistro]=useState<Registro|null>(null),[error,setError]=useState(''),[detalles,setDetalles]=useState(false);
  useEffect(()=>{try{setRegistro(obtenerCaptura(id));}catch{setError('No pudimos leer la medición guardada.');}},[id]);
  if(!registro?.resultado)return <Pantalla titulo="Resultado no disponible"><Texto>{error||'Busca la medición en el historial o continúa su observación.'}</Texto><Boton texto="Ir al historial" onPress={()=>router.replace('/historial')}/></Pantalla>;
  const r=JSON.parse(registro.resultado) as Resultado,c=registro.captura;
  const uso=c.uso??'beber',guia=orientarUso(r,uso);
  const inicial=c.estabilidad==='inicial';
  const titulo=r.plan==='alternativa'?'Busca otra fuente':r.plan==='repetir'?'No la consumas todavía':inicial?'Posible tratamiento; verifica':'Trátala antes de consumir';
  const decision=r.plan==='alternativa'?'NO TRATES ESTA AGUA EN CASA':r.plan==='repetir'?'NO SE PUEDE DECIDIR AÚN':inicial?'POSIBLE TRATAMIENTO · LECTURA INICIAL':'HAY UNA RUTA DE TRATAMIENTO';
  const resumen=`${c.demo?'DEMO — datos simulados. ':''}${c.fuente}. ${r.titulo}. Para ${nombresUso[uso]}: ${guia.estado}. ${r.motivo}. ${r.advertencias.join(' ')} ${guia.pasos.join(' ')} Consumo humano: ${r.destinos.humano}. Animales: ${r.destinos.animal}. Riego: ${r.destinos.riego}.`;
  return <Pantalla titulo={titulo} demo={c.demo} compacto>
    <Text style={s.etiqueta}>{c.fuente} · {new Date(c.lectura.recibidaEn).toLocaleDateString('es-CO')}</Text>
    <Tarjeta tono={r.nivel===2?'rojo':r.confiable?'verde':'ambar'}>
      <Text style={s.etiqueta}>{decision}</Text>
      <Text style={[s.etiqueta,{color:'#1C2833'}]}>TU USO · {nombresUso[uso].toUpperCase()}</Text>
      <Text style={[s.texto,{fontWeight:'800'}]}>{guia.estado}</Text>
      {r.plan==='hervido'&&(uso==='beber'||uso==='cocinar')?<Text style={[s.texto,{fontWeight:'800'}]}>Aclara si hay partículas y hierve 3 minutos desde el burbujeo continuo.{inicial?' Antes de consumir, verifica de nuevo esta lectura.':''}</Text>:null}
      {uso!=='beber'&&uso!=='cocinar'?<Texto>🚰 Beber o cocinar: {r.destinos.humano}</Texto>:null}
      {!r.confiable?<Text style={[s.texto,{fontWeight:'800'}]}>{c.estabilidad==='inicial'?'Lectura inicial: puede cambiar. No autoriza el consumo.':'Lectura no confiable · calibración o datos sin verificar'}</Text>:null}
      <Texto>{DESCARGO}</Texto>
      <Texto>{r.motivo}</Texto>
    </Tarjeta>
    <Tarjeta tono="cielo"><Text style={[s.etiqueta,{color:'#1C2833'}]}>QUÉ HACER AHORA</Text>{guia.pasos.map((paso,i)=><Texto key={paso}>{i+1}. {paso}</Texto>)}</Tarjeta>
    <Tarjeta tono="cielo"><View style={vista.fila}><View style={{flex:1}}><Text style={s.etiqueta}>ICA ORIENTATIVO</Text><Texto>Índice del proyecto, de 0 a 100</Texto></View><Text style={vista.numero}>{r.ica===null?'—':Math.round(r.ica)}</Text></View>
      <Texto>{r.ica===null?'No se pudo calcular con esta lectura.':r.plan==='alternativa'?'Hay señales de riesgo que prevalecen sobre el índice.':r.plan==='repetir'?'Este número aún necesita verificación.':'Los parámetros medidos están dentro de las referencias del proyecto.'}</Texto>
      <Texto suave>No es un porcentaje de potabilidad. Una alerta de olor o aspecto prevalece aunque el número sea alto.</Texto>
      <View style={vista.parametros}>{[['pH',c.lectura.ph,''],['Turbidez',c.lectura.turbidez,'NTU'],['Sólidos',c.lectura.tds,'ppm'],['Temperatura',c.lectura.temperatura,'°C']].map(([nombre,valor,unidad])=><View key={String(nombre)} style={vista.parametro}><Text style={vista.nombre}>{nombre}</Text><Text style={vista.valor}>{valor!=null?String(valor):'—'} {unidad}</Text></View>)}</View>
      <Texto suave>El índice pondera pH, turbidez y TDS. La temperatura se muestra como contexto; aún no existe un peso validado para ella.</Texto>
    </Tarjeta>
    {(r.plan!=='hervido'||uso==='beber'||uso==='cocinar'||uso==='utensilios')?<Boton secundario texto={r.plan==='hervido'?'Abrir temporizador y guía completa':r.plan==='repetir'?'Ver cómo revisar el equipo':'Ver apoyo paso a paso'} onPress={()=>router.push({pathname:'/protocolo',params:{id}})}/>:null}
    <Audio texto={resumen}/>
    <Tarjeta><Text style={[s.etiqueta,{color:'#1C2833'}]}>OTROS USOS</Text>
      {uso!=='utensilios'?<Texto>🧼 Utensilios: {r.destinos.utensilios??'Necesita revisión'}</Texto>:null}
      {uso!=='ropa'?<Texto>👕 Ropa: {r.destinos.ropa??'Necesita revisión'}</Texto>:null}
      {uso!=='banarse'?<Texto>🚿 Baño: {r.destinos.bano??'Necesita revisión'}</Texto>:null}
      {uso!=='ganado'?<Texto>🐄 Ganado: {r.destinos.animal}</Texto>:null}
      {uso!=='cultivo'?<Texto>🌱 Cultivos: {r.destinos.riego}</Texto>:null}
    </Tarjeta>
    <Boton secundario texto={detalles?'Ocultar detalles técnicos':'Ver detalles técnicos'} onPress={()=>setDetalles(!detalles)}/>
    {detalles?<Tarjeta><Texto>Origen: {c.observacion.origen} · Olor: {c.observacion.olor} · Aspecto: {c.observacion.visual}</Texto><Texto suave>Reglas {r.reglas.join(', ')} · Motor {r.version}</Texto></Tarjeta>:null}
    <Texto suave>✓ Guardada en este teléfono{c.demo?' como práctica':''}. No necesitas internet.</Texto>
    <Boton secundario texto="Compartir resultado" onPress={()=>{void Share.share({message:resumen}).catch(()=>Alert.alert('No se pudo compartir','La medición sigue guardada en tu teléfono.'));}}/>
    <Boton texto="Nueva medición" onPress={()=>router.replace('/conectar')}/>
  </Pantalla>;
}
const vista=StyleSheet.create({
  fila:{flexDirection:'row',alignItems:'center',gap:16},numero:{fontSize:46,lineHeight:52,fontWeight:'900',color:colores.azul,fontVariant:['tabular-nums']},
  parametros:{flexDirection:'row',flexWrap:'wrap',gap:8},parametro:{width:'48%',flexGrow:1,backgroundColor:'white',padding:12,borderRadius:10},
  nombre:{fontSize:14,color:colores.tinta,fontWeight:'700'},valor:{fontSize:20,color:colores.azul,fontWeight:'800',fontVariant:['tabular-nums']},
});
