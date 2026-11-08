import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Opcion as OpcionCatalogo } from '../dominio/catalogos';
import { Texto, colores, s } from './componentes';

/** Botón de opción grande y táctil (mínimo 64 px de alto), anunciado como seleccionado. */
export function Opcion({
  texto,
  elegida,
  onPress,
}: {
  texto: string;
  elegida: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ selected: elegida }}
      onPress={onPress}
      style={({ pressed }) => [est.opcion, elegida && est.opcionElegida, pressed && s.presionado]}
    >
      <Text style={[est.opcionTexto, elegida && est.opcionTextoElegida]}>
        {elegida ? '✓  ' : ''}
        {texto}
      </Text>
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
}: {
  titulo?: string;
  ayuda?: string;
  opciones: readonly OpcionCatalogo<T>[];
  valor?: T;
  elegir: (v: T) => void;
}) {
  return (
    <View style={est.grupo}>
      {titulo ? <Text style={est.pregunta}>{titulo}</Text> : null}
      {ayuda ? <Texto suave>{ayuda}</Texto> : null}
      <View style={est.opciones}>
        {opciones.map(o => (
          <Opcion key={o.id} texto={o.texto} elegida={valor === o.id} onPress={() => elegir(o.id)} />
        ))}
      </View>
    </View>
  );
}

const est = StyleSheet.create({
  pregunta: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: colores.tinta },
  grupo: { gap: 10, paddingVertical: 8 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opcion: {
    minHeight: 64,
    minWidth: 100,
    flexGrow: 1,
    flexBasis: '44%',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  opcionElegida: { backgroundColor: colores.azul, borderColor: colores.azul },
  opcionTexto: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: colores.tinta },
  opcionTextoElegida: { color: 'white' },
});
