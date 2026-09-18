import {useEffect,useState,type PropsWithChildren} from 'react';
import {ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,View,type TextInputProps,TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import * as Speech from 'expo-speech';
import Svg,{Path,Circle} from 'react-native-svg';

export const colores={tinta:'#1C2833',azul:'#1A5276',fondo:'#F5F7F5',borde:'#CDD7D4',verde:'#E9F7EF',ambar:'#FEF5E7',rojo:'#FDEDEC'};
export function Gota({tamano=42}:{tamano?:number}) {return <Svg width={tamano} height={tamano} viewBox="0 0 48 48" aria-hidden={true}><Path d="M24 3C19 12 9 22 9 31a15 15 0 0030 0C39 22 29 12 24 3Z" fill={colores.azul}/><Path d="M16 30c0 5 3 8 8 8" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/><Circle cx="31" cy="28" r="2" fill="#92D6C3"/></Svg>}
export function Texto({children,suave=false}:PropsWithChildren<{suave?:boolean}>) {return <Text style={[s.texto,suave&&s.suave]}>{children}</Text>;}
export function Titulo({children}:PropsWithChildren) {return <Text accessibilityRole="header" style={s.titulo}>{children}</Text>;}
export function Tarjeta({children,tono='blanco'}:PropsWithChildren<{tono?:'blanco'|'verde'|'ambar'|'rojo'}>) {return <View style={[s.tarjeta,{backgroundColor:tono==='blanco'?'white':colores[tono]}]}>{children}</View>;}
export function Boton({texto,onPress,secundario=false,disabled=false,icono='→'}:{texto:string;onPress:()=>void;secundario?:boolean;disabled?:boolean;icono?:string}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed})=>[s.boton,secundario&&s.botonSecundario,disabled&&s.deshabilitado,pressed&&s.presionado]}>
    <Text style={[s.botonTexto,secundario&&s.textoSecundario]}>{texto}</Text><Text style={[s.botonIcono,secundario&&s.textoSecundario]} accessible={false}>{icono}</Text>
  </Pressable>;
}
export function Campo({etiqueta,...props}:TextInputProps&{etiqueta:string}) {return <View style={{gap:8}}><Texto>{etiqueta}</Texto><TextInput {...props} accessibilityLabel={etiqueta} placeholderTextColor="#566573" style={s.campo}/></View>;}
export function Audio({texto}:{texto:string}) {
  const [hablando,setHablando]=useState(false);
  useEffect(()=>()=>{void Speech.stop();},[]);
  return <Boton secundario icono={hablando?'■':'♫'} texto={hablando?'Detener lectura':'Escuchar'} onPress={()=>{
    if(hablando) {void Speech.stop();setHablando(false);return;}
    setHablando(true);Speech.speak(texto,{language:'es-CO',rate:.88,onDone:()=>setHablando(false),onStopped:()=>setHablando(false),onError:()=>{setHablando(false);Alert.alert('Audio no disponible','Instala una voz en español en los ajustes de texto a voz del teléfono.');}});
  }}/>;
}
export function Pantalla({children,titulo,volver=true,demo=false}:PropsWithChildren<{titulo:string;volver?:boolean;demo?:boolean}>) {
  return <SafeAreaView style={s.raiz} edges={['top','bottom']}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenido}>
    <View style={s.cabecera}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Gota tamano={28}/><Text style={s.marca}>Re-Fluye</Text></View><Text style={s.etiqueta}>MODO CAMPO</Text></View>
    {demo?<Tarjeta tono="ambar"><Text style={s.etiqueta}>DEMO · DATOS SIMULADOS</Text></Tarjeta>:null}
    {volver?<Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.canGoBack()?router.back():router.replace('/')} style={s.volver}><Text style={s.volverTexto}>← Volver</Text></Pressable>:null}
    <Titulo>{titulo}</Titulo>{children}
    <Text style={s.pie}>Re-Fluye · CCD / UNAB{demo?' · Práctica sin medición real':''}</Text>
  </ScrollView></SafeAreaView>;
}
export function Cargando({texto='Cargando…'}:{texto?:string}) {return <Tarjeta><ActivityIndicator color={colores.azul}/><Texto>{texto}</Texto></Tarjeta>;}
export const s=StyleSheet.create({
  raiz:{flex:1,backgroundColor:colores.fondo},contenido:{padding:24,gap:20,width:'100%',maxWidth:620,alignSelf:'center',paddingBottom:40},
  cabecera:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'},marca:{fontSize:22,fontWeight:'800',color:colores.azul},
  etiqueta:{fontSize:15,fontWeight:'700',letterSpacing:1,color:colores.azul},titulo:{fontSize:34,lineHeight:41,fontWeight:'800',letterSpacing:-1,color:colores.tinta},
  texto:{fontSize:18,lineHeight:27,color:colores.tinta},suave:{color:'#465862'},tarjeta:{padding:20,gap:12,borderWidth:1,borderColor:colores.borde,borderRadius:18,borderCurve:'continuous'},
  boton:{backgroundColor:colores.azul,minHeight:68,borderRadius:14,borderCurve:'continuous',padding:18,flexDirection:'row',gap:12,alignItems:'center',justifyContent:'space-between'},
  botonSecundario:{backgroundColor:'white',borderWidth:1,borderColor:colores.azul},botonTexto:{fontSize:19,lineHeight:27,fontWeight:'700',color:'white',flex:1},botonIcono:{color:'white',fontSize:25},textoSecundario:{color:colores.azul},
  deshabilitado:{backgroundColor:'#596A73'},presionado:{opacity:.8},campo:{backgroundColor:'white',borderColor:colores.borde,borderWidth:1,borderRadius:12,minHeight:64,padding:16,fontSize:18,color:colores.tinta},
  volver:{minHeight:64,justifyContent:'center',alignSelf:'flex-start',minWidth:100},volverTexto:{fontSize:18,fontWeight:'600',color:colores.azul},pie:{fontSize:15,color:'#465862',textAlign:'center',marginTop:20},
  sensor:{fontSize:32,fontWeight:'700',color:colores.azul,fontVariant:['tabular-nums']},fila:{flexDirection:'row',gap:12,flexWrap:'wrap'},
});
