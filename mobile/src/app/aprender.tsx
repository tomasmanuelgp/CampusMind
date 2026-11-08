// SPDX-License-Identifier: AGPL-3.0-only
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Audio, Boton, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono, type NombreIcono } from '../ui/iconos';
import { colores, radio, semaforoColores, tipo } from '../ui/tema';
import { DESCARGO } from '../dominio/motor';

const GUIAS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: 'ajustes',
    titulo: 'Prepara el equipo',
    texto: 'Revisa las sondas y el registro de calibración. Enjuágalas con agua limpia antes de medir.',
  },
  {
    icono: 'bluetooth',
    titulo: 'Recibe una lectura',
    texto:
      'Conecta por Bluetooth y mantén las sondas quietas. Puedes analizar desde la primera lectura completa; si varía, el resultado será preliminar.',
  },
  {
    icono: 'ojo',
    titulo: 'Observa el agua',
    texto:
      'Di de dónde viene, cómo huele y cómo se ve. Nunca pruebes el agua. Si no puedes identificar algo, elige «No sé».',
  },
  {
    icono: 'tratar',
    titulo: 'Sigue las indicaciones',
    texto:
      'Lee el resultado completo, sus límites y la acción recomendada. Para beber o cocinar, siempre aclara y desinfecta.',
  },
];

const COLORES: { tono: 'verde' | 'ambar' | 'rojo'; icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    tono: 'verde',
    icono: 'tratar',
    titulo: 'Trátala antes de consumir',
    texto:
      'Lo que el equipo mide está en las referencias del proyecto. Aun así, aclara y desinfecta: no es un certificado.',
  },
  {
    tono: 'ambar',
    icono: 'repetir',
    titulo: 'Verifica o vuelve a medir',
    texto: 'Falta calibración, la lectura aún varía o hay respuestas «No sé». No decidas todavía.',
  },
  {
    tono: 'rojo',
    icono: 'alto',
    titulo: 'Busca otra fuente',
    texto:
      'Hay una señal de peligro, como un olor extraño o aceite. Hervir o filtrar con tela no lo resuelve.',
  },
];

export default function Aprender() {
  return (
    <Pantalla titulo="Medir, observar, cuidar" volver={false} nav="aprender">
      <Texto>Estas guías están siempre disponibles, sin internet.</Texto>

      <Text style={est.seccion}>Cómo medir</Text>
      {GUIAS.map((g, i) => (
        <Tarjeta key={g.titulo}>
          <View style={est.cabecera}>
            <View style={est.icono}>
              <Icono nombre={g.icono} color={colores.azul} tamano={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.etiqueta}>PASO {i + 1}</Text>
              <Text style={est.titulo}>{g.titulo}</Text>
            </View>
          </View>
          <Texto>{g.texto}</Texto>
          <Audio texto={`${g.titulo}. ${g.texto}`} />
        </Tarjeta>
      ))}

      <Text style={est.seccion}>Qué significa cada color</Text>
      {COLORES.map(c => (
        <View
          key={c.tono}
          style={[
            est.color,
            { backgroundColor: semaforoColores[c.tono].fondo, borderColor: semaforoColores[c.tono].fuerte },
          ]}
        >
          <View style={[est.colorIcono, { backgroundColor: semaforoColores[c.tono].fuerte }]}>
            <Icono nombre={c.icono} color="#FFFFFF" tamano={26} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={est.titulo}>{c.titulo}</Text>
            <Texto>{c.texto}</Texto>
          </View>
        </View>
      ))}

      <Tarjeta tono="ambar">
        <View style={est.cabecera}>
          <Icono nombre="alerta" color="#7A4A00" tamano={30} />
          <Text style={[est.titulo, { flex: 1 }]}>Lo que el equipo no puede ver</Text>
        </View>
        <Texto>{DESCARGO}</Texto>
        <Texto>
          Tampoco detecta metales ni la mayoría de los químicos. Solo un laboratorio autorizado certifica el
          agua; RE-FLUYE te acompaña los demás días.
        </Texto>
      </Tarjeta>

      <Boton
        icono="gota"
        texto="Practicar una medición"
        detalle="Con datos simulados (DEMO)"
        onPress={() => router.push('/conectar')}
      />
    </Pantalla>
  );
}

const est = StyleSheet.create({
  seccion: { ...tipo.seccion, color: colores.tinta, marginTop: 8 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colores.cielo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, lineHeight: 26, fontWeight: '900', color: colores.tinta },
  color: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: radio.l,
    borderWidth: 2,
    padding: 16,
    alignItems: 'flex-start',
  },
  colorIcono: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
