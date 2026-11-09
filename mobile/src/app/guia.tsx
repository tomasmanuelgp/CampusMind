// SPDX-License-Identifier: AGPL-3.0-only
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio, Boton, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono } from '../ui/iconos';
import { colores, tipo } from '../ui/tema';
import { AVISO_GUIAS, obtenerGuia } from '../dominio/guias';
import { DESCARGO } from '../dominio/motor';

export default function GuiaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guia = obtenerGuia(id);
  if (!guia)
    return (
      <Pantalla titulo="Guía no disponible" nav="aprender">
        <Boton texto="Ver todas las guías" onPress={() => router.replace('/aprender')} />
      </Pantalla>
    );
  const lectura = [
    guia.titulo,
    guia.resumen,
    ...guia.pasos.map((p, i) => `Paso ${i + 1}. ${p.titulo}. ${p.texto}`),
    'Evita lo siguiente.',
    ...guia.evita,
    AVISO_GUIAS,
  ].join(' ');
  return (
    <Pantalla titulo={guia.titulo} nav="aprender">
      <View style={est.cabecera}>
        <Text style={est.pictograma} accessible={false}>
          {guia.icono}
        </Text>
        <Texto>{guia.resumen}</Texto>
      </View>
      <Audio texto={lectura} />

      <Tarjeta tono="cielo">
        <Text style={est.seccion}>Paso a paso</Text>
        {guia.pasos.map((p, i) => (
          <View key={p.titulo} style={est.pasoFila}>
            <View style={est.pasoNumero}>
              <Text style={est.pasoNumeroTexto}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.texto, s.fuerte]}>{p.titulo}</Text>
              <Texto>{p.texto}</Texto>
            </View>
          </View>
        ))}
      </Tarjeta>

      <Tarjeta tono="ambar">
        <View style={est.filaIcono}>
          <Icono nombre="alerta" color="#7A4A00" tamano={26} />
          <Text style={[est.seccion, { flex: 1 }]}>Evita</Text>
        </View>
        {guia.evita.map(e => (
          <Texto key={e}>• {e}</Texto>
        ))}
      </Tarjeta>

      <Texto>{AVISO_GUIAS}</Texto>
      <Texto suave>{DESCARGO}</Texto>
      <View style={{ gap: 4 }}>
        <Text style={s.etiqueta}>FUENTES</Text>
        {guia.fuentes.map(f => (
          <Texto key={f.url} suave>
            {f.nombre} · {f.url}
          </Texto>
        ))}
      </View>
      <Boton secundario icono="libro" texto="Ver todas las guías" onPress={() => router.push('/aprender')} />
    </Pantalla>
  );
}

const est = StyleSheet.create({
  cabecera: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  pictograma: { fontSize: 44 },
  seccion: { ...tipo.seccion, color: colores.tinta },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pasoFila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pasoNumero: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.azul,
  },
  pasoNumeroTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
});
