// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio, Boton, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono } from '../ui/iconos';
import { colores, radio, tipo } from '../ui/tema';
import { AVISO_GUIAS, obtenerGuia } from '../dominio/guias';
import { CUIDADOS, alternarPaso, progresoGuia, type CuidadoId } from '../dominio/cuidados';
import { DESCARGO } from '../dominio/motor';
import { guardarPasosGuia, leerPasosGuia, registrarCuidado } from '../aplicacion/almacen';

function leerSeguro<T>(leer: () => T, porDefecto: T): T {
  try {
    return leer();
  } catch {
    return porDefecto;
  }
}

export default function GuiaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guia = obtenerGuia(id);
  const [hechos, setHechos] = useState<number[]>(() => leerSeguro(() => leerPasosGuia(id), []));
  const [registrado, setRegistrado] = useState<CuidadoId | null>(null);
  if (!guia)
    return (
      <Pantalla titulo="Guía no disponible" nav="aprender">
        <Boton texto="Ver todas las guías" onPress={() => router.replace('/aprender')} />
      </Pantalla>
    );
  const progreso = progresoGuia(guia, hechos);
  const cuidados = CUIDADOS.filter(c => c.guia === guia.id);
  const guardar = (nuevos: number[]) => {
    try {
      guardarPasosGuia(guia.id, nuevos);
      setHechos(nuevos);
    } catch {
      Alert.alert('No se guardó el avance', 'Intenta de nuevo.');
    }
  };
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
        <View style={est.filaIcono}>
          <Text style={[est.seccion, { flex: 1 }]}>Paso a paso</Text>
          <Text style={s.etiqueta}>
            {progreso.hechos} DE {progreso.total} HECHOS
          </Text>
        </View>
        <Texto suave>Toca cada paso cuando lo termines. El avance queda guardado en este teléfono.</Texto>
        {guia.pasos.map((p, i) => {
          const hecho = hechos.includes(i);
          return (
            <Pressable
              key={p.titulo}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hecho }}
              accessibilityLabel={`Paso ${i + 1}. ${p.titulo}. ${p.texto}`}
              onPress={() => guardar(alternarPaso(hechos, i))}
              style={({ pressed }) => [est.paso, hecho && est.pasoHecho, pressed && s.presionado]}
            >
              <View style={[est.pasoNumero, hecho && est.pasoNumeroHecho]}>
                {hecho ? (
                  <Icono nombre="check" color="#FFFFFF" tamano={20} grosor={3} />
                ) : (
                  <Text style={est.pasoNumeroTexto}>{i + 1}</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.texto, s.fuerte]}>{p.titulo}</Text>
                <Texto>{p.texto}</Texto>
              </View>
            </Pressable>
          );
        })}
        {progreso.completa ? (
          <Texto>
            Terminaste todos los pasos. Esto no certifica el agua: sigue el resultado de tu medición.
          </Texto>
        ) : null}
        {hechos.length > 0 ? (
          <Boton secundario icono="repetir" texto="Empezar de nuevo" onPress={() => guardar([])} />
        ) : null}
      </Tarjeta>

      {cuidados.length > 0 ? (
        <Tarjeta>
          <Text style={est.seccion}>Recuérdame</Text>
          <Texto suave>
            Registra cuándo lo hiciste. En Inicio verás cuándo toca de nuevo, sin necesidad de internet.
          </Texto>
          {cuidados.map(c => (
            <Boton
              key={c.id}
              secundario
              icono={registrado === c.id ? 'check' : 'reloj'}
              texto={registrado === c.id ? 'Registrado hoy' : c.registrar}
              detalle={`Se repite cada ${c.cadaDias === 1 ? 'día' : `${c.cadaDias} días`}`}
              onPress={() => {
                try {
                  registrarCuidado(c.id, Date.now());
                  setRegistrado(c.id);
                } catch {
                  Alert.alert('No se guardó el registro', 'Intenta de nuevo.');
                }
              }}
            />
          ))}
        </Tarjeta>
      ) : null}

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
  paso: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: radio.m,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    minHeight: 64,
  },
  pasoHecho: { borderColor: '#1B7A3E', backgroundColor: '#E3F4E8' },
  pasoNumero: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.azul,
  },
  pasoNumeroHecho: { backgroundColor: '#1B7A3E' },
  pasoNumeroTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
});
