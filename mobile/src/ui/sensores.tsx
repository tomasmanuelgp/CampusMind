// SPDX-License-Identifier: AGPL-3.0-only
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import type { Lectura } from '../dominio/tipos';
import { calcularIca } from '../dominio/motor';
import { segmentosSensor } from '../dominio/monitoreo';
import { estadoParametro, type NivelParametro, type Sensor } from '../dominio/presentacion';
import { Tarjeta, Texto } from './componentes';
import { colores, radio, tipo } from './tema';

const SENSORES: readonly { nombre: string; sensor: Sensor; unidad: string; ayuda: string }[] = [
  { nombre: 'pH', sensor: 'ph', unidad: 'de 0 a 14', ayuda: 'Acidez' },
  { nombre: 'Turbidez', sensor: 'turbidez', unidad: 'NTU', ayuda: 'Partículas' },
  { nombre: 'Sólidos', sensor: 'tds', unidad: 'ppm', ayuda: 'Sales disueltas' },
  { nombre: 'Temperatura', sensor: 'temperatura', unidad: '°C', ayuda: 'Contexto' },
];

export const COLOR_NIVEL: Record<NivelParametro, { fondo: string; texto: string }> = {
  referencia: { fondo: '#E3F4E8', texto: '#1B6B37' },
  atencion: { fondo: '#FFF1D6', texto: '#7A4A00' },
  extremo: { fondo: '#FDE6E4', texto: '#9E2119' },
  'sin-dato': { fondo: '#EEF2F5', texto: '#45576A' },
  contexto: { fondo: '#E8F3FA', texto: '#1A5276' },
};

/** Anillo del ICA orientativo (0–100). Su color no cambia con el valor: no es un veredicto. */
export function AnilloIca({ ica, tamano = 132 }: { ica: number | null; tamano?: number }) {
  const r = 52;
  const circunferencia = 2 * Math.PI * r;
  const fraccion = ica === null ? 0 : Math.max(0, Math.min(100, ica)) / 100;
  return (
    <View
      style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel={
        ica === null ? 'ICA orientativo sin dato' : `ICA orientativo ${Math.round(ica)} de 100`
      }
    >
      <Svg
        width={tamano}
        height={tamano}
        viewBox="0 0 120 120"
        style={StyleSheet.absoluteFill}
        aria-hidden={true}
      >
        <Circle cx={60} cy={60} r={r} stroke="#D6E6F2" strokeWidth={12} fill="none" />
        <Circle
          cx={60}
          cy={60}
          r={r}
          stroke={colores.agua}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * fraccion} ${circunferencia}`}
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <Text style={est.icaNumero}>{ica === null ? '—' : Math.round(ica)}</Text>
      <Text style={est.icaTexto}>ICA</Text>
    </View>
  );
}

/** Lista compacta de los cuatro parámetros con su estado (para el resultado). */
export function ParametrosResumen({ lectura }: { lectura: Lectura }) {
  return (
    <View style={est.sensores}>
      {SENSORES.map(({ nombre, sensor, unidad }) => {
        const valor = lectura[sensor];
        const estado = estadoParametro(sensor, valor);
        const color = COLOR_NIVEL[estado.nivel];
        return (
          <View
            key={sensor}
            style={est.sensor}
            accessible
            accessibilityLabel={`${nombre}: ${valor ?? 'sin dato'} ${unidad}. ${estado.texto}`}
          >
            <Text style={est.sensorNombre}>{nombre}</Text>
            <Text style={est.sensorValorChico}>
              {valor != null ? String(valor) : '—'} <Text style={est.sensorUnidad}>{unidad}</Text>
            </Text>
            <View style={[est.estado, { backgroundColor: color.fondo }]}>
              <Text style={[est.estadoTexto, { color: color.texto }]}>{estado.texto}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** ICA orientativo, valor actual de cada sensor, su estado y su curva reciente. */
export function TarjetaSensores({ vivo, lecturas }: { vivo: Lectura | null; lecturas: Lectura[] }) {
  const ica = vivo ? calcularIca(vivo) : null;
  return (
    <Tarjeta tono="cielo">
      <View style={est.filaIca}>
        <AnilloIca ica={ica} />
        <View style={{ flex: 1, gap: 6, minWidth: 160 }}>
          <Text style={est.titulo}>Índice orientativo</Text>
          <Texto suave>Resume pH, turbidez y sólidos. No indica si el agua es potable.</Texto>
        </View>
      </View>
      <View style={est.sensores}>
        {SENSORES.map(({ nombre, sensor, unidad, ayuda }) => {
          const valor = vivo?.[sensor];
          const estado = estadoParametro(sensor, vivo ? valor : null);
          const color = COLOR_NIVEL[estado.nivel];
          const segmentos = vivo ? segmentosSensor(lecturas, sensor) : [];
          return (
            <View
              style={est.sensor}
              key={sensor}
              accessible
              accessibilityLabel={`${nombre}: ${valor != null ? valor : 'sin dato'} ${unidad}. ${estado.texto}`}
            >
              <View style={est.sensorCabecera}>
                <Text style={est.sensorNombre}>{nombre}</Text>
                <Text style={est.sensorAyuda}>{ayuda}</Text>
              </View>
              <Text style={est.sensorValor}>{valor != null ? String(valor) : '—'}</Text>
              <Text style={est.sensorUnidad}>{unidad}</Text>
              <View style={[est.estado, { backgroundColor: color.fondo }]}>
                <Text style={[est.estadoTexto, { color: color.texto }]}>{estado.texto}</Text>
              </View>
              <Svg height={40} width="100%" viewBox="0 0 100 50" aria-hidden={true}>
                {segmentos.map((puntos, i) =>
                  puntos.length === 1 ? (
                    <Circle key={i} cx={puntos[0][0]} cy={puntos[0][1]} r={2.5} fill={colores.agua} />
                  ) : (
                    <Polyline
                      key={i}
                      points={puntos.map(p => p.join(',')).join(' ')}
                      fill="none"
                      stroke={colores.agua}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                    />
                  ),
                )}
              </Svg>
            </View>
          );
        })}
      </View>
      <Texto suave>
        Los colores comparan cada valor con las referencias del proyecto. Las curvas muestran hasta 60
        lecturas; muestran cambios, no potabilidad.
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
  filaIca: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  titulo: { ...tipo.seccion, color: colores.tinta },
  icaNumero: { fontSize: 40, lineHeight: 44, fontWeight: '900', color: colores.marino, ...tipo.numero },
  icaTexto: { ...tipo.etiqueta, color: colores.suave },
  trama: { fontFamily: 'monospace', fontSize: 14, lineHeight: 21, color: colores.tinta },
  sensores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensor: {
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 14,
    gap: 2,
  },
  sensorCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 },
  sensorNombre: { fontSize: 17, fontWeight: '800', color: colores.tinta },
  sensorAyuda: { fontSize: 13, color: colores.suave },
  sensorValor: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: colores.marino, ...tipo.numero },
  sensorValorChico: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    color: colores.marino,
    ...tipo.numero,
  },
  sensorUnidad: { fontSize: 15, color: colores.suave, fontWeight: '400' },
  estado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radio.total,
    marginTop: 6,
  },
  estadoTexto: { fontSize: 13, fontWeight: '800' },
});
