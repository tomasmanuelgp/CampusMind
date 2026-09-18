import {useState} from 'react';
import {router} from 'expo-router';
import {Alert,Text} from 'react-native';
import {Pantalla,Tarjeta,Texto,Boton,Audio,s} from '../ui/componentes';
import {useSesion} from '../aplicacion/sesion';
import type {Observacion,OlorTipo} from '../dominio/tipos';
const preguntas=[
  {clave:'origen',titulo:'¿De dónde viene?',ayuda:'Observa si el agua corre o está quieta.',opciones:[['corriente','≋','Agua corriente','Río, quebrada o nacimiento'],['estancada','▱','Agua estancada','Tanque, charco o agua quieta'],['no_se','?','No estoy seguro','Puedes pedir ayuda']]},
  {clave:'olor',titulo:'¿Notas un olor extraño?',ayuda:'Describe lo que ya percibes. No pruebes el agua ni acerques la cara si sospechas químicos.',opciones:[['normal','○','Sin olor extraño','No percibo un olor inusual'],['raro','!','Sí, huele raro','Un olor fuerte o diferente'],['no_se','?','No estoy seguro','No puedo identificarlo']]},
  {clave:'visual',titulo:'¿Cómo se ve el agua?',ayuda:'Mira la superficie y el agua en un recipiente.',opciones:[['limpia','◇','Se ve clara','Sin color o capa extraña'],['turbia','≋','Tiene tierra o está turbia','Veo partículas suspendidas'],['verdosa','◎','Tiene color verdoso','Algas o una capa verde'],['aceitosa','◉','Tiene una capa aceitosa','Brillos o manchas en la superficie'],['no_se','?','No estoy seguro','No puedo identificarlo']]},
] as const;
export default function ObservacionPantalla(){
  const captura=useSesion(s=>s.captura);const [paso,setPaso]=useState(0);
  if(!captura)return <Pantalla titulo="Primero toma una lectura"><Texto>Necesitamos una captura del equipo para continuar.</Texto><Boton texto="Medir agua" onPress={()=>router.replace('/conectar')}/></Pantalla>;
  const pregunta=preguntas[paso],seleccion=captura.observacion[pregunta.clave];
  const elegir=(valor:string)=>{try{useSesion.getState().observar({[pregunta.clave]:valor} as Partial<Observacion>);}catch{Alert.alert('No se guardó','Intenta otra vez antes de avanzar.');}};
  return <Pantalla key={paso} titulo={pregunta.titulo} demo={captura.demo}>
    <Text style={s.etiqueta}>OBSERVACIÓN {paso+1} DE 3 · {captura.fuente}</Text>
    <Texto>{pregunta.ayuda}</Texto><Audio texto={pregunta.titulo+'. '+pregunta.ayuda}/>
    {pregunta.opciones.map(([valor,icono,titulo,detalle])=><Tarjeta key={valor} tono={seleccion===valor?'verde':'blanco'}><Boton secundario texto={(seleccion===valor?'✓ ':'')+titulo} icono={icono} onPress={()=>elegir(valor)}/><Texto suave>{detalle}</Texto></Tarjeta>)}
    {paso===1&&seleccion==='raro'?<Tarjeta tono="ambar"><Texto>¿A qué se parece? El detalle no cambia la advertencia por olor extraño.</Texto>{([
      ['azufre','Huevo podrido / azufre'],['combustible','Combustible o solvente'],['podrido','Cloaca o descomposición'],['quimico','Químico o dulzón'],['cloro','Cloro fuerte'],['otro','Otro olor / no sé'],
    ] as [OlorTipo,string][]).map(([valor,texto])=><Boton secundario key={valor} texto={(captura.observacion.olorTipo===valor?'✓ ':'')+texto} onPress={()=>{try{useSesion.getState().observar({olorTipo:valor});}catch{Alert.alert('No se guardó','Intenta de nuevo.');}}}/>)}</Tarjeta>:null}
    <Boton texto={paso===2?'Ver mi resultado':'Siguiente pregunta'} disabled={!seleccion} onPress={()=>{if(paso<2){setPaso(paso+1);return;}try{const id=useSesion.getState().finalizar();router.replace({pathname:'/resultado',params:{id}});}catch(e){Alert.alert('No se guardó el resultado',e instanceof Error?e.message:'Intenta otra vez.');}}}/>
    {paso>0?<Boton secundario texto="Pregunta anterior" onPress={()=>setPaso(paso-1)}/>:null}
    <Texto suave>Tu lectura ya está guardada. Puedes continuar aunque el equipo se desconecte.</Texto>
  </Pantalla>;
}
