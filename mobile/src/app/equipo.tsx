import {useEffect,useState} from 'react';
import {Alert} from 'react-native';
import {router} from 'expo-router';
import {Pantalla,Tarjeta,Texto,Boton,Campo} from '../ui/componentes';
import {leerAjuste,guardarAjuste} from '../infraestructura/db/repositorio';
import {useSesion} from '../aplicacion/sesion';
import type {Calibracion} from '../dominio/tipos';
export default function EquipoPantalla(){
  const [equipo,setEquipo]=useState<{id:string;nombre:string}|null>(null),[calibracion,setCalibracion]=useState<Calibracion|null>(null),[editar,setEditar]=useState(false);
  const [responsable,setResponsable]=useState(''),[referencia,setReferencia]=useState(''),[fecha,setFecha]=useState(''),[vence,setVence]=useState('');
  useEffect(()=>{try{const e=leerAjuste('equipo');if(e){const valor=JSON.parse(e);setEquipo(valor);const c=leerAjuste('calibracion:'+valor.id);if(c)setCalibracion(JSON.parse(c));}}catch{Alert.alert('Registro no disponible','Puedes buscar el equipo otra vez.');}},[]);
  return <Pantalla titulo="Mi equipo">
    <Tarjeta><Texto>{equipo?.nombre??'Todavía no has conectado un equipo'}</Texto><Texto>{calibracion?`Calibración registrada por ${calibracion.responsable}. Vigencia hasta ${new Date(calibracion.venceEn).toLocaleString('es-CO')}.`:'Calibración sin verificar. Tus resultados se marcarán no confiables hasta registrar evidencia técnica vigente.'}</Texto></Tarjeta>
    <Boton texto="Conectar o cambiar equipo" onPress={()=>router.push('/conectar')}/>
    <Boton secundario texto="Desconectar equipo" onPress={()=>void useSesion.getState().desconectar()}/>
    {equipo?<Boton secundario texto={editar?'Cerrar registro técnico':'Registrar calibración realizada'} onPress={()=>setEditar(!editar)}/>:null}
    {editar&&equipo?<Tarjeta><Texto>Solo registra una calibración que un técnico ya realizó. Esta pantalla no calibra las sondas ni envía comandos al equipo. La vigencia debe proceder del protocolo técnico.</Texto>
      <Campo etiqueta="Responsable técnico" value={responsable} onChangeText={setResponsable}/><Campo etiqueta="Referencia del registro de calibración" value={referencia} onChangeText={setReferencia}/>
      <Campo etiqueta="Realizada (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} placeholder="2026-09-14"/>
      <Campo etiqueta="Vence (AAAA-MM-DD)" value={vence} onChangeText={setVence} placeholder="Fecha indicada por el técnico"/>
      <Boton texto="Guardar registro técnico" onPress={()=>{
        const fechas=[fecha,vence];if(fechas.some(f=>!/^\d{4}-\d{2}-\d{2}$/.test(f)||!Number.isFinite(Date.parse(f))||new Date(f).toISOString().slice(0,10)!==f)||!responsable.trim()||!referencia.trim()){Alert.alert('Revisa el registro','Completa responsable, referencia y fechas válidas.');return;}
        const verificadaEn=new Date(fecha+'T00:00:00').getTime(),venceEn=new Date(vence+'T00:00:00').getTime();
        if(verificadaEn>Date.now()||venceEn<=Date.now()||venceEn<=verificadaEn){Alert.alert('Fechas no válidas','La calibración debe haberse realizado y tener una vigencia futura.');return;}
        try{const c={verificadaEn,venceEn,responsable:responsable.trim(),referencia:referencia.trim()};guardarAjuste('calibracion:'+equipo.id,JSON.stringify(c));setCalibracion(c);setEditar(false);}catch{Alert.alert('No se guardó','Reintenta el registro.');}
      }}/></Tarjeta>:null}
    <Texto suave>La calibración registrada se aplica a nuevas capturas. No cambia mediciones anteriores.</Texto>
  </Pantalla>;
}
