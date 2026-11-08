// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Boton, Cargando, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono, type NombreIcono } from '../ui/iconos';
import { colores, radio, tipo } from '../ui/tema';
import { buscarEquipos, type Equipo } from '../infraestructura/bluetooth/servicio';
import { leerEquipoRecordado } from '../aplicacion/almacen';
import { useSesion } from '../aplicacion/sesion';

const PASOS: { icono: NombreIcono; texto: string }[] = [
  { icono: 'gota', texto: 'Enciende el equipo y ponlo cerca' },
  { icono: 'bluetooth', texto: 'Activa el Bluetooth del teléfono' },
  { icono: 'buscar', texto: 'Elige ReFluye-V2 en la lista' },
];

const esRefluye = (nombre: string) => /re.?fluye/i.test(nombre);

export default function Conectar() {
  const { auto } = useLocalSearchParams<{ auto?: string }>();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [recordado] = useState(leerEquipoRecordado);
  const estado = useSesion(v => v.estado);
  const errorConexion = useSesion(v => v.error);
  const ocupado = buscando || estado === 'conectando';

  const conectar = async (id: string, nombre: string) => {
    await useSesion.getState().conectar(id, nombre);
    if (useSesion.getState().estado !== 'desconectado') router.replace('/medir');
  };
  const buscar = async () => {
    setBuscando(true);
    setError('');
    try {
      const lista = await buscarEquipos();
      setEquipos(lista);
      if (!lista.length)
        setError('No encontramos equipos. Comprueba que RE-FLUYE esté encendido y vuelve a buscar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos buscar el equipo.');
    } finally {
      setBuscando(false);
    }
  };

  // Desde el inicio, «Medir con …» conecta directamente al equipo recordado.
  const intentado = useRef(false);
  useEffect(() => {
    if (auto !== '1' || !recordado || intentado.current) return;
    intentado.current = true;
    void useSesion
      .getState()
      .conectar(recordado.id, recordado.nombre)
      .then(() => {
        if (useSesion.getState().estado !== 'desconectado') router.replace('/medir');
      });
  }, [auto, recordado]);

  return (
    <Pantalla titulo="Conecta tu equipo" nav="medir">
      <View style={est.pasos}>
        {PASOS.map((p, i) => (
          <View key={p.texto} style={est.paso}>
            <View style={est.pasoIcono}>
              <Icono nombre={p.icono} color={colores.azul} tamano={26} />
            </View>
            <Text style={est.pasoNumero}>PASO {i + 1}</Text>
            <Text style={est.pasoTexto}>{p.texto}</Text>
          </View>
        ))}
      </View>

      {recordado ? (
        <Tarjeta tono="cielo">
          <Text style={s.etiqueta}>TU EQUIPO RECORDADO</Text>
          <Text style={est.nombre}>{recordado.nombre}</Text>
          <Boton
            icono="bluetooth"
            texto={estado === 'conectando' ? 'Conectando…' : 'Conectar a ' + recordado.nombre}
            disabled={ocupado}
            onPress={() => void conectar(recordado.id, recordado.nombre)}
          />
        </Tarjeta>
      ) : null}

      <Boton
        secundario={!!recordado}
        icono="buscar"
        texto={buscando ? 'Buscando equipos…' : 'Buscar equipos cercanos'}
        detalle="La primera vez, Android te pedirá permiso"
        disabled={ocupado}
        onPress={() => void buscar()}
      />

      {ocupado ? (
        <Cargando
          texto={buscando ? 'La búsqueda puede tardar unos segundos.' : 'Conectando con el equipo…'}
        />
      ) : null}

      {equipos.map(e => (
        <View key={e.id} style={[est.equipo, esRefluye(e.nombre) && est.equipoRefluye]}>
          <View style={est.equipoFila}>
            <View style={[est.equipoIcono, esRefluye(e.nombre) && { backgroundColor: colores.aqua }]}>
              <Icono nombre={esRefluye(e.nombre) ? 'gota' : 'bluetooth'} color="#FFFFFF" tamano={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={est.nombre}>{e.nombre}</Text>
              <Text style={[s.texto, s.suave, tipo.pequeno]}>
                {esRefluye(e.nombre) ? 'Equipo RE-FLUYE · ' : ''}
                {e.emparejado ? 'Ya emparejado' : 'Nuevo'} · termina en {e.id.slice(-5)}
              </Text>
            </View>
          </View>
          <Boton
            secundario
            texto={'Elegir ' + e.nombre}
            disabled={ocupado}
            onPress={() => void conectar(e.id, e.nombre)}
          />
        </View>
      ))}

      {error || errorConexion ? (
        <Tarjeta tono="ambar">
          <View style={s.fila}>
            <Icono nombre="alerta" color="#7A4A00" tamano={24} />
            <Text style={[s.texto, { flex: 1 }]}>{error || errorConexion}</Text>
          </View>
          <Boton
            secundario
            icono="ajustes"
            texto="Abrir ajustes de permisos"
            onPress={() => void Linking.openSettings()}
          />
        </Tarjeta>
      ) : null}

      <Texto suave>
        El permiso para buscar equipos no guarda tu ubicación. Si Android pide un PIN, usa 1234.
      </Texto>
      <Boton
        variante="secundario"
        icono="info"
        texto="Practicar sin equipo · DEMO"
        detalle="Datos simulados para aprender a usar la app"
        disabled={ocupado}
        onPress={async () => {
          await useSesion.getState().iniciarDemo();
          router.replace('/medir');
        }}
      />
    </Pantalla>
  );
}

const est = StyleSheet.create({
  pasos: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  paso: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.l,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  pasoIcono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.cielo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumero: { ...tipo.etiqueta, color: colores.azul },
  pasoTexto: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: colores.tinta },
  nombre: { fontSize: 21, fontWeight: '900', color: colores.tinta },
  equipo: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.l,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  equipoRefluye: { borderWidth: 2, borderColor: colores.aqua },
  equipoFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  equipoIcono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
