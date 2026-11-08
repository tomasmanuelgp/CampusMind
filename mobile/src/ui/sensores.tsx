import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import type { Lectura } from '../dominio/tipos';
import { calcularIca } from '../dominio/motor';
import { segmentosSensor, type Sensor } from '../dominio/monitoreo';
import { Tarjeta, Texto, colores, s } from './componentes';

const SENSORES: readonly [string, Sensor, string][] = [
  ['pH', 'ph', 'acidez'],
  ['Turbidez', 'turbidez', 'NTU'],
  ['Sólidos', 'tds', 'ppm'],
  ['Temperatura', 'temperatura', '°C'],
];

/** ICA orientativo, valor actual de cada sensor y su curva reciente. */
export function TarjetaSensores({ vivo, lecturas }: { vivo: Lectura | null; lecturas: Lectura[] }) {
  const ica = vivo ? calcularIca(vivo) : null;
  return (
    <Tarjeta tono="cielo">
      <View style={est.filaIca}>
        <View style={{ flex: 1 }}>
          <Text style={s.etiqueta}>ICA ORIENTATIVO</Text>
          <Texto>De 0 a 100. No indica si el agua es potable.</Texto>
        </View>
        <Text style={est.ica}>{ica === null ? '—' : Math.round(ica)}</Text>
      </View>
      <View style={est.sensores}>
        {SENSORES.map(([nombre, sensor, unidad]) => {
          const valor = vivo?.[sensor];
          const segmentos = vivo ? segmentosSensor(lecturas, sensor) : [];
          return (
            <View style={est.sensor} key={sensor}>
              <Text style={est.sensorNombre}>{nombre}</Text>
              <Text style={est.sensorValor}>{valor != null ? String(valor) : '—'}</Text>
              <Text style={est.sensorUnidad}>{unidad}</Text>
              <Svg height={50} width="100%" viewBox="0 0 100 50" aria-hidden={true}>
                {segmentos.map((puntos, i) =>
                  puntos.length === 1 ? (
                    <Circle key={i} cx={puntos[0][0]} cy={puntos[0][1]} r={2} fill={colores.azul} />
                  ) : (
                    <Polyline
                      key={i}
                      points={puntos.map(p => p.join(',')).join(' ')}
                      fill="none"
                      stroke={colores.azul}
                      strokeWidth={2}
                    />
                  ),
                )}
              </Svg>
            </View>
          );
        })}
      </View>
      <Texto suave>
        Comportamiento reciente: hasta 60 lecturas. Cada curva usa su propia escala; muestra cambios, no
        potabilidad.
      </Texto>
    </Tarjeta>
  );
}

/** Trama cruda recibida por Bluetooth, para diagnosticar el equipo. */
export function DiagnosticoBluetooth({ lecturas, estable }: { lecturas: Lectura[]; estable: boolean }) {
  const ultima = lecturas.at(-1);
  return (
    <Tarjeta>
      <Texto>
        Última trama: {ultima ? new Date(ultima.recibidaEn).toLocaleTimeString('es-CO') : 'No recibida'} ·{' '}
        {lecturas.length} lecturas en memoria
      </Texto>
      <Texto>
        {estable
          ? 'Variación pequeña entre las últimas lecturas.'
          : 'Los valores pueden variar; eso no impide verlos.'}
      </Texto>
      {ultima?.avisos?.map(a => (
        <Texto key={a}>{a}</Texto>
      ))}
      <Text selectable style={est.trama}>
        {ultima?.tramaOriginal || 'Todavía no se recibió una trama de sensores cerrada con ---.'}
      </Text>
    </Tarjeta>
  );
}

const est = StyleSheet.create({
  filaIca: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ica: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    color: colores.azul,
    fontVariant: ['tabular-nums'],
  },
  trama: { fontFamily: 'monospace', fontSize: 14, lineHeight: 21, color: colores.tinta },
  sensores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensor: {
    width: '48%',
    minWidth: 128,
    flexGrow: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    padding: 14,
  },
  sensorNombre: { fontSize: 16, fontWeight: '700', color: colores.tinta },
  sensorValor: { fontSize: 29, fontWeight: '800', color: colores.azul, fontVariant: ['tabular-nums'] },
  sensorUnidad: { fontSize: 15, color: colores.tinta },
});
