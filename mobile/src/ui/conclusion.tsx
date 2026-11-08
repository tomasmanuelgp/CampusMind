// SPDX-License-Identifier: AGPL-3.0-only
import { StyleSheet, Text, View } from 'react-native';
import type { resumirEnVivo } from '../dominio/resumenEnVivo';
import { Texto } from './componentes';
import { Icono } from './iconos';
import { colores, radio, semaforoColores, tipo } from './tema';

type Resumen = ReturnType<typeof resumirEnVivo>;

/** Conclusión preliminar que cambia con cada respuesta y lectura (no se guarda). */
export function TarjetaConclusion({
  resumen,
  demo,
  detallada = false,
}: {
  resumen: Resumen;
  demo: boolean;
  detallada?: boolean;
}) {
  const c = semaforoColores[resumen.tono];
  return (
    <View style={[est.tarjeta, { backgroundColor: c.fondo, borderColor: c.fuerte }]}>
      <View style={est.fila}>
        <View style={[est.icono, { backgroundColor: c.fuerte }]}>
          <Icono
            nombre={resumen.tono === 'rojo' ? 'alto' : resumen.plan === 'hervido' ? 'tratar' : 'reloj'}
            color={c.texto}
            tamano={26}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[est.etiqueta, { color: c.fuerte }]}>
            {demo ? 'PRÁCTICA · CONCLUSIÓN SIMULADA' : '¿PUEDO CONSUMIR ESTA AGUA?'}
          </Text>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={est.titulo}>
            {resumen.titulo}
          </Text>
        </View>
      </View>
      <Texto>{resumen.detalle}</Texto>
      {!resumen.confiable ? (
        <Texto suave>
          Evaluación preliminar no confiable: lectura inicial, datos u observaciones pendientes, o calibración
          sin verificar.
        </Texto>
      ) : null}
      {resumen.uso ? (
        <Texto>
          <Text style={{ fontWeight: '800' }}>{resumen.uso}: </Text>
          {resumen.estadoUso}
        </Texto>
      ) : null}
      {detallada
        ? resumen.pasos.map((paso, i) => (
            <View key={paso} style={est.pasoFila}>
              <View style={[est.pasoNumero, { backgroundColor: c.fuerte }]}>
                <Text style={est.pasoNumeroTexto}>{i + 1}</Text>
              </View>
              <Text style={[est.pasoTexto]}>{paso}</Text>
            </View>
          ))
        : null}
      <Texto suave>{resumen.descargo}</Texto>
    </View>
  );
}

/** Versión de una línea para la barra fija inferior de Medir. */
export function ConclusionCompacta({ resumen }: { resumen: Resumen }) {
  const c = semaforoColores[resumen.tono];
  return (
    <View style={est.compacta} accessibilityLiveRegion="polite">
      <View style={[est.punto, { backgroundColor: c.fuerte }]} />
      <Text style={est.compactaTexto} numberOfLines={1}>
        {resumen.titulo}
      </Text>
    </View>
  );
}

export const estilosSeccion = StyleSheet.create({
  titulo: { ...tipo.seccion, color: colores.tinta },
});

const est = StyleSheet.create({
  tarjeta: { borderWidth: 2, borderRadius: radio.l, padding: 18, gap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icono: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { ...tipo.etiqueta },
  titulo: { fontSize: 23, lineHeight: 29, fontWeight: '900', color: colores.tinta },
  pasoFila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pasoNumero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pasoNumeroTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  pasoTexto: { ...tipo.cuerpo, color: colores.tinta, flex: 1 },
  compacta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  punto: { width: 14, height: 14, borderRadius: 7 },
  compactaTexto: { fontSize: 17, fontWeight: '800', color: colores.tinta, flex: 1 },
});
