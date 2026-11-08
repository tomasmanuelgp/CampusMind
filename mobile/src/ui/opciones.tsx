// SPDX-License-Identifier: AGPL-3.0-only
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Opcion as OpcionCatalogo } from '../dominio/catalogos';
import { s } from './componentes';
import { Icono } from './iconos';
import { colores, radio, tipo } from './tema';

/** Tarjeta de opción grande, con pictograma, texto y detalle. Se anuncia como seleccionada. */
export function Opcion({
  texto,
  detalle,
  icono,
  elegida,
  onPress,
  ancha = false,
}: {
  texto: string;
  detalle?: string;
  icono?: string;
  elegida: boolean;
  onPress: () => void;
  /** Ocupa toda la fila (para opciones con detalle). */
  ancha?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${texto}. ${detalle}` : texto}
      accessibilityState={{ selected: elegida }}
      onPress={onPress}
      style={({ pressed }) => [
        est.opcion,
        ancha && est.ancha,
        elegida && est.opcionElegida,
        pressed && s.presionado,
      ]}
    >
      {icono ? (
        <Text style={est.pictograma} accessible={false}>
          {icono}
        </Text>
      ) : null}
      <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
        <Text style={[est.opcionTexto, elegida && est.opcionTextoElegida]}>{texto}</Text>
        {detalle ? <Text style={[est.detalle, elegida && est.detalleElegido]}>{detalle}</Text> : null}
      </View>
      <View style={[est.marca, elegida && est.marcaElegida]}>
        {elegida ? <Icono nombre="check" color={colores.azul} tamano={18} grosor={3.2} /> : null}
      </View>
    </Pressable>
  );
}

/** Una pregunta con sus opciones del catálogo. */
export function GrupoOpciones<T extends string>({
  titulo,
  ayuda,
  opciones,
  valor,
  elegir,
  detalles = true,
}: {
  titulo?: string;
  ayuda?: string;
  opciones: readonly OpcionCatalogo<T>[];
  valor?: T;
  elegir: (v: T) => void;
  detalles?: boolean;
}) {
  return (
    <View style={est.grupo}>
      {titulo ? <Text style={est.pregunta}>{titulo}</Text> : null}
      {ayuda ? <Text style={est.ayuda}>{ayuda}</Text> : null}
      <View style={est.opciones} accessibilityRole="radiogroup">
        {opciones.map(o => (
          <Opcion
            key={o.id}
            texto={o.texto}
            detalle={detalles ? o.detalle : undefined}
            icono={o.icono}
            elegida={valor === o.id}
            ancha={detalles}
            onPress={() => elegir(o.id)}
          />
        ))}
      </View>
    </View>
  );
}

const est = StyleSheet.create({
  pregunta: { fontSize: 20, lineHeight: 27, fontWeight: '800', color: colores.tinta },
  ayuda: { ...tipo.pequeno, color: colores.suave },
  grupo: { gap: 10, paddingVertical: 6 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opcion: {
    minHeight: 72,
    minWidth: 140,
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: radio.m,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ancha: { flexBasis: '100%', minWidth: 0 },
  opcionElegida: { backgroundColor: colores.azul, borderColor: colores.azul },
  pictograma: { fontSize: 30, lineHeight: 36 },
  opcionTexto: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: colores.tinta },
  opcionTextoElegida: { color: '#FFFFFF' },
  detalle: { fontSize: 14, lineHeight: 19, color: colores.suave, marginTop: 2 },
  detalleElegido: { color: '#E8F3FA' },
  marca: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaElegida: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
});
