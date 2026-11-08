// SPDX-License-Identifier: AGPL-3.0-only
// Componentes base de la interfaz. Reglas: botones de 64 px o más, texto de 18 px,
// contraste alto y cada acción con texto (el icono nunca va solo).
import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import * as Speech from 'expo-speech';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Icono, type NombreIcono } from './iconos';
import { colores, espacio, radio, sombra, tipo } from './tema';

export { colores } from './tema';

export function Gota({ tamano = 42, clara = false }: { tamano?: number; clara?: boolean }) {
  const relleno = clara ? '#FFFFFF' : colores.azul;
  const brillo = clara ? colores.azul : '#FFFFFF';
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 48 48" aria-hidden={true}>
      <Path d="M24 3C19 12 9 22 9 31a15 15 0 0030 0C39 22 29 12 24 3Z" fill={relleno} />
      <Path d="M16 30c0 5 3 8 8 8" stroke={brillo} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="31" cy="28" r="2" fill="#92D6C3" />
    </Svg>
  );
}

export function Texto({
  children,
  suave = false,
  fuerte = false,
}: PropsWithChildren<{ suave?: boolean; fuerte?: boolean }>) {
  return <Text style={[s.texto, suave && s.suave, fuerte && s.fuerte]}>{children}</Text>;
}

export function Titulo({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={s.titulo}>
      {children}
    </Text>
  );
}

export function Etiqueta({ children, color = colores.azul }: PropsWithChildren<{ color?: string }>) {
  return <Text style={[s.etiqueta, { color }]}>{children}</Text>;
}

type TonoTarjeta = 'blanco' | 'verde' | 'ambar' | 'rojo' | 'lima' | 'cielo';
export function Tarjeta({ children, tono = 'blanco' }: PropsWithChildren<{ tono?: TonoTarjeta }>) {
  return (
    <View
      style={[
        s.tarjeta,
        tono === 'blanco' && sombra,
        { backgroundColor: tono === 'blanco' ? colores.tarjeta : colores[tono] },
      ]}
    >
      {children}
    </View>
  );
}

/** Encabezado numerado de cada paso de la medición. */
export function Paso({
  numero,
  titulo,
  listo,
  ayuda,
}: {
  numero: number;
  titulo: string;
  listo: boolean;
  ayuda?: string;
}) {
  return (
    <View style={s.paso}>
      <View style={[s.pasoNumero, listo && s.pasoListo]}>
        {listo ? (
          <Icono nombre="check" color="#FFFFFF" tamano={20} grosor={3} />
        ) : (
          <Text style={s.pasoNumeroTexto}>{numero}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={s.pasoTitulo}>
          {titulo}
        </Text>
        {ayuda ? <Text style={[s.texto, s.suave, tipo.pequeno]}>{ayuda}</Text> : null}
      </View>
    </View>
  );
}

export function Chip({
  texto,
  color = colores.azul,
  fondo = colores.cielo,
  icono,
}: {
  texto: string;
  color?: string;
  fondo?: string;
  icono?: NombreIcono;
}) {
  return (
    <View style={[s.chip, { backgroundColor: fondo }]}>
      {icono ? <Icono nombre={icono} tamano={16} color={color} grosor={2.4} /> : null}
      <Text style={[s.chipTexto, { color }]}>{texto}</Text>
    </View>
  );
}

type Variante = 'primario' | 'secundario' | 'peligro' | 'claro';
export function Boton({
  texto,
  onPress,
  secundario = false,
  variante,
  disabled = false,
  icono = '→',
  detalle,
}: {
  texto: string;
  onPress: () => void;
  secundario?: boolean;
  variante?: Variante;
  disabled?: boolean;
  /** Nombre de un icono SVG o un carácter. */
  icono?: NombreIcono | string;
  detalle?: string;
}) {
  const v: Variante = variante ?? (secundario ? 'secundario' : 'primario');
  const colorTexto = v === 'secundario' ? colores.azul : v === 'claro' ? colores.marino : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${texto}. ${detalle}` : texto}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.boton, s[v], disabled && s.deshabilitado, pressed && s.presionado]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.botonTexto, { color: disabled ? '#FFFFFF' : colorTexto }]}>{texto}</Text>
        {detalle ? (
          <Text style={[s.botonDetalle, { color: disabled ? '#FFFFFF' : colorTexto }]}>{detalle}</Text>
        ) : null}
      </View>
      {icono in iconosValidos ? (
        <Icono nombre={icono as NombreIcono} color={disabled ? '#FFFFFF' : colorTexto} tamano={26} />
      ) : (
        <Text style={[s.botonIcono, { color: disabled ? '#FFFFFF' : colorTexto }]} accessible={false}>
          {icono}
        </Text>
      )}
    </Pressable>
  );
}
const iconosValidos: Record<string, true> = Object.fromEntries(
  [
    'inicio',
    'gota',
    'historial',
    'libro',
    'bluetooth',
    'alerta',
    'alto',
    'repetir',
    'tratar',
    'compartir',
    'altavoz',
    'detener',
    'papelera',
    'ajustes',
    'escudo',
    'check',
    'flecha',
    'atras',
    'mas',
    'ojo',
    'olor',
    'ola',
    'descargar',
    'reloj',
    'info',
    'buscar',
  ].map(n => [n, true]),
);

export function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  return (
    <View style={{ gap: espacio.s }}>
      <Text style={[s.texto, s.fuerte]}>{etiqueta}</Text>
      <TextInput {...props} accessibilityLabel={etiqueta} placeholderTextColor="#5D6D7A" style={s.campo} />
    </View>
  );
}

export function Audio({ texto }: { texto: string }) {
  const [hablando, setHablando] = useState(false);
  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );
  return (
    <Boton
      secundario
      icono={hablando ? 'detener' : 'altavoz'}
      texto={hablando ? 'Detener lectura' : 'Escuchar'}
      onPress={() => {
        if (hablando) {
          void Speech.stop();
          setHablando(false);
          return;
        }
        setHablando(true);
        Speech.speak(texto, {
          language: 'es-CO',
          rate: 0.88,
          onDone: () => setHablando(false),
          onStopped: () => setHablando(false),
          onError: () => {
            setHablando(false);
            Alert.alert(
              'Audio no disponible',
              'Instala una voz en español en los ajustes de texto a voz del teléfono.',
            );
          },
        });
      }}
    />
  );
}

/** Fondo de agua con degradado para encabezados destacados. */
export function Hero({
  children,
  desde = colores.marino,
  hasta = colores.agua,
}: PropsWithChildren<{ desde?: string; hasta?: string }>) {
  return (
    <View style={[s.hero, { backgroundColor: hasta }]}>
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden={true}
      >
        <Defs>
          <LinearGradient id="fondoHero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={desde} />
            <Stop offset="1" stopColor={hasta} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#fondoHero)" />
        <Path
          d="M0 82 C 20 72, 35 92, 55 82 S 85 72, 100 80 L100 100 L0 100 Z"
          fill="#FFFFFF"
          opacity={0.08}
        />
        <Path
          d="M0 90 C 25 82, 40 98, 62 90 S 88 84, 100 90 L100 100 L0 100 Z"
          fill="#FFFFFF"
          opacity={0.08}
        />
      </Svg>
      {children}
    </View>
  );
}

export type Seccion = 'inicio' | 'medir' | 'historial' | 'aprender';
const SECCIONES: {
  id: Seccion;
  texto: string;
  icono: NombreIcono;
  ruta: '/' | '/conectar' | '/historial' | '/aprender';
}[] = [
  { id: 'inicio', texto: 'Inicio', icono: 'inicio', ruta: '/' },
  { id: 'medir', texto: 'Medir', icono: 'gota', ruta: '/conectar' },
  { id: 'historial', texto: 'Historial', icono: 'historial', ruta: '/historial' },
  { id: 'aprender', texto: 'Aprender', icono: 'libro', ruta: '/aprender' },
];

/** Barra inferior: las cuatro secciones principales, siempre a un toque. */
export function BarraNavegacion({ activa }: { activa: Seccion }) {
  return (
    <View style={s.nav} accessibilityRole="tablist">
      {SECCIONES.map(sec => {
        const elegida = sec.id === activa;
        return (
          <Pressable
            key={sec.id}
            accessibilityRole="tab"
            accessibilityLabel={sec.texto}
            accessibilityState={{ selected: elegida }}
            onPress={() => (elegida ? null : router.replace(sec.ruta))}
            style={({ pressed }) => [s.navItem, pressed && s.presionado]}
          >
            <View style={[s.navIcono, elegida && s.navIconoActivo]}>
              <Icono nombre={sec.icono} color={elegida ? '#FFFFFF' : colores.suave} tamano={24} />
            </View>
            <Text style={[s.navTexto, elegida && s.navTextoActivo]}>{sec.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pantalla({
  children,
  titulo,
  volver = true,
  demo = false,
  compacto = false,
  nav,
  pie,
  cabecera,
}: PropsWithChildren<{
  titulo?: string;
  volver?: boolean;
  demo?: boolean;
  compacto?: boolean;
  /** Sección activa de la barra inferior. Sin ella, no se muestra la barra. */
  nav?: Seccion;
  /** Contenido fijo encima de la barra inferior (por ejemplo, la acción principal). */
  pie?: ReactNode;
  /** Contenido a todo lo ancho antes del título (por ejemplo, un Hero). */
  cabecera?: ReactNode;
}>) {
  const ruta = usePathname();
  return (
    <SafeAreaView style={s.raiz} edges={['top', 'bottom']}>
      <ScrollView
        key={ruta}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.contenido, compacto && s.contenidoCompacto]}
      >
        <View style={s.marcaFila}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Gota tamano={30} />
            <Text style={s.marca}>RE-FLUYE</Text>
          </View>
          <Chip texto="SIN INTERNET" icono="check" color={colores.aqua} fondo="#E3F6F4" />
        </View>
        {demo ? (
          <View style={s.demo}>
            <Icono nombre="info" color="#8A5300" tamano={20} />
            <Text style={[s.etiqueta, { color: '#8A5300', flex: 1 }]}>DEMO · DATOS SIMULADOS</Text>
          </View>
        ) : null}
        {volver ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={s.volver}
          >
            <Icono nombre="atras" color={colores.azul} tamano={22} />
            <Text style={s.volverTexto}>Volver</Text>
          </Pressable>
        ) : null}
        {cabecera}
        {titulo ? <Titulo>{titulo}</Titulo> : null}
        {children}
        <Text style={s.pie}>
          RE-FLUYE · Tecnología abierta para el agua rural{demo ? ' · Práctica sin medición real' : ''}
        </Text>
      </ScrollView>
      {pie ? <View style={s.pieFijo}>{pie}</View> : null}
      {nav ? <BarraNavegacion activa={nav} /> : null}
    </SafeAreaView>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <Tarjeta>
      <ActivityIndicator color={colores.azul} size="large" />
      <Texto>{texto}</Texto>
    </Tarjeta>
  );
}

export const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  contenido: {
    padding: espacio.xl,
    gap: espacio.l + 4,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  contenidoCompacto: { padding: espacio.l, gap: espacio.m + 2, paddingBottom: 32 },
  marcaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  marca: { fontSize: 22, fontWeight: '900', color: colores.marino, letterSpacing: 1 },
  etiqueta: { ...tipo.etiqueta, color: colores.azul },
  titulo: { ...tipo.titulo, color: colores.tinta },
  texto: { ...tipo.cuerpo, color: colores.tinta },
  suave: { color: colores.suave },
  fuerte: { fontWeight: '800' },
  tarjeta: {
    padding: espacio.xl - 4,
    gap: espacio.m,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l,
    borderCurve: 'continuous',
  },
  boton: {
    minHeight: 68,
    borderRadius: radio.m,
    borderCurve: 'continuous',
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primario: { backgroundColor: colores.azul },
  secundario: { backgroundColor: colores.tarjeta, borderWidth: 2, borderColor: colores.azul },
  peligro: { backgroundColor: '#B3261E' },
  claro: { backgroundColor: '#FFFFFF' },
  botonTexto: { fontSize: 19, lineHeight: 25, fontWeight: '800' },
  botonDetalle: { fontSize: 15, lineHeight: 20, opacity: 0.92, marginTop: 2 },
  botonIcono: { fontSize: 25 },
  deshabilitado: { backgroundColor: colores.deshabilitado, borderColor: colores.deshabilitado },
  presionado: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  campo: {
    backgroundColor: colores.tarjeta,
    borderColor: colores.borde,
    borderWidth: 2,
    borderRadius: radio.m,
    minHeight: 64,
    padding: 16,
    fontSize: 18,
    color: colores.tinta,
  },
  volver: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    minWidth: 100,
  },
  volverTexto: { fontSize: 18, fontWeight: '700', color: colores.azul },
  pie: { fontSize: 14, color: colores.suave, textAlign: 'center', marginTop: 16 },
  sensor: { fontSize: 40, fontWeight: '900', color: colores.azul, ...tipo.numero },
  fila: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radio.total,
    alignSelf: 'flex-start',
  },
  chipTexto: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF1D6',
    borderRadius: radio.m,
    padding: 14,
  },
  hero: { borderRadius: radio.xl, overflow: 'hidden', padding: espacio.xl, gap: espacio.l, ...sombra },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pasoNumero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colores.cielo,
    borderWidth: 2,
    borderColor: colores.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoListo: { backgroundColor: '#1B7A3E', borderColor: '#1B7A3E' },
  pasoNumeroTexto: { fontSize: 18, fontWeight: '900', color: colores.azul },
  pasoTitulo: { ...tipo.seccion, color: colores.tinta },
  pieFijo: {
    paddingHorizontal: espacio.l,
    paddingTop: espacio.m,
    paddingBottom: espacio.m,
    backgroundColor: colores.tarjeta,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    gap: espacio.s,
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: colores.tarjeta,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 2, minHeight: 64, justifyContent: 'center' },
  navIcono: {
    width: 52,
    height: 34,
    borderRadius: radio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconoActivo: { backgroundColor: colores.azul },
  navTexto: { fontSize: 13, fontWeight: '700', color: colores.suave },
  navTextoActivo: { color: colores.azul, fontWeight: '900' },
});
