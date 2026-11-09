// SPDX-License-Identifier: AGPL-3.0-only
// Recupera una medición pendiente (borrador) pregunta por pregunta.
// Desde 0.3.0 la medición normal se completa en «Medir»; esta pantalla solo se
// abre desde el inicio o el historial cuando quedó una observación sin terminar.
import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Pantalla, Tarjeta, Texto, Boton, Audio, s } from '../ui/componentes';
import { useSesion } from '../aplicacion/sesion';
import { ASPECTOS, OLORES, ORIGENES, TIPOS_OLOR, type Opcion } from '../dominio/catalogos';
import type { Observacion } from '../dominio/tipos';

const preguntas: {
  clave: 'origen' | 'olor' | 'visual';
  titulo: string;
  ayuda: string;
  opciones: readonly Opcion<string>[];
}[] = [
  {
    clave: 'origen',
    titulo: '¿De dónde viene el agua?',
    ayuda: 'Piensa en la fuente, no en el recipiente.',
    opciones: ORIGENES,
  },
  {
    clave: 'olor',
    titulo: '¿Notas un olor extraño?',
    ayuda: 'Describe lo que ya percibes. No pruebes el agua ni acerques la cara si sospechas químicos.',
    opciones: OLORES,
  },
  {
    clave: 'visual',
    titulo: '¿Cómo se ve el agua?',
    ayuda: 'Mira la superficie y el agua en un recipiente.',
    opciones: ASPECTOS,
  },
];

function guardar(datos: Partial<Observacion>) {
  try {
    useSesion.getState().observar(datos);
  } catch {
    Alert.alert('No se guardó', 'Intenta otra vez antes de avanzar.');
  }
}

export default function ObservacionPantalla() {
  const captura = useSesion(v => v.captura);
  const [paso, setPaso] = useState(0);
  if (!captura)
    return (
      <Pantalla titulo="Primero toma una lectura">
        <Texto>Necesitamos una captura del equipo para continuar.</Texto>
        <Boton texto="Medir agua" onPress={() => router.replace('/conectar')} />
      </Pantalla>
    );
  const pregunta = preguntas[paso];
  const seleccion = captura.observacion[pregunta.clave];

  const avanzar = () => {
    if (paso < preguntas.length - 1) return setPaso(paso + 1);
    try {
      router.replace({ pathname: '/resultado', params: { id: useSesion.getState().finalizar() } });
    } catch (e) {
      Alert.alert('No se guardó el resultado', e instanceof Error ? e.message : 'Intenta otra vez.');
    }
  };

  return (
    <Pantalla key={paso} titulo={pregunta.titulo} demo={captura.demo}>
      <Text style={s.etiqueta}>
        OBSERVACIÓN {paso + 1} DE {preguntas.length} · {captura.fuente}
      </Text>
      <Texto>{pregunta.ayuda}</Texto>
      <Audio texto={pregunta.titulo + '. ' + pregunta.ayuda} />
      {pregunta.opciones.map(o => (
        <Tarjeta key={o.id} tono={seleccion === o.id ? 'verde' : 'blanco'}>
          <Boton
            secundario
            texto={(seleccion === o.id ? '✓ ' : '') + o.texto}
            icono={o.icono}
            onPress={() => guardar({ [pregunta.clave]: o.id })}
          />
          <Texto suave>{o.detalle}</Texto>
        </Tarjeta>
      ))}
      {pregunta.clave === 'olor' && seleccion === 'raro' ? (
        <Tarjeta tono="ambar">
          <Texto>¿A qué se parece? El detalle no cambia la advertencia por olor extraño.</Texto>
          {TIPOS_OLOR.map(o => (
            <Boton
              secundario
              key={o.id}
              texto={(captura.observacion.olorTipo === o.id ? '✓ ' : '') + o.texto}
              onPress={() => guardar({ olorTipo: o.id })}
            />
          ))}
        </Tarjeta>
      ) : null}
      <Boton
        texto={paso === preguntas.length - 1 ? 'Ver mi resultado' : 'Siguiente pregunta'}
        disabled={!seleccion}
        onPress={avanzar}
      />
      {paso > 0 ? <Boton secundario texto="Pregunta anterior" onPress={() => setPaso(paso - 1)} /> : null}
      <Texto suave>Tu lectura ya está guardada. Puedes continuar aunque el equipo se desconecte.</Texto>
    </Pantalla>
  );
}
