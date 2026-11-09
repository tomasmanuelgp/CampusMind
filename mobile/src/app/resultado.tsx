// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { Audio, Boton, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono, type NombreIcono } from '../ui/iconos';
import { AnilloIca, ParametrosResumen } from '../ui/sensores';
import { colores, radio, semaforoColores, tipo } from '../ui/tema';
import { obtenerCaptura } from '../aplicacion/almacen';
import { DESCARGO, type Resultado } from '../dominio/motor';
import { nombresUso, orientarUso } from '../dominio/orientacion';
import { semaforo } from '../dominio/presentacion';
import { guiasRecomendadas, obtenerGuia } from '../dominio/guias';
import { USOS } from '../dominio/catalogos';
import type { Uso } from '../dominio/tipos';

const ICONO_SEMAFORO: Record<'alto' | 'repetir' | 'tratar', NombreIcono> = {
  alto: 'alto',
  repetir: 'repetir',
  tratar: 'tratar',
};

export default function ResultadoPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [{ registro, error }] = useState(() => {
    try {
      return { registro: obtenerCaptura(id), error: '' };
    } catch {
      return { registro: null, error: 'No pudimos leer la medición guardada.' };
    }
  });
  const [detalles, setDetalles] = useState(false);
  if (!registro?.resultado)
    return (
      <Pantalla titulo="Resultado no disponible" nav="historial">
        <Texto>{error || 'Busca la medición en el historial o continúa su observación.'}</Texto>
        <Boton texto="Ir al historial" onPress={() => router.replace('/historial')} />
      </Pantalla>
    );

  const r = JSON.parse(registro.resultado) as Resultado;
  const c = registro.captura;
  const uso: Uso = c.uso ?? 'beber';
  const guia = orientarUso(r, uso);
  const inicial = c.estabilidad === 'inicial';
  const luz = semaforo(r, inicial);
  const color = semaforoColores[luz.tono];
  const resumen = `${c.demo ? 'DEMO — datos simulados. ' : ''}${c.fuente}. ${luz.titulo}. Para ${nombresUso[uso]}: ${guia.estado}. ${r.motivo} ${r.advertencias.join(' ')} ${guia.pasos.join(' ')} Consumo humano: ${r.destinos.humano}. Animales: ${r.destinos.animal}. Riego: ${r.destinos.riego}.`;
  const otros = USOS.filter(
    u => u.id !== uso && !(u.id === 'cocinar' && uso === 'beber') && !(u.id === 'beber' && uso === 'cocinar'),
  );
  const destinoDe = (u: Uso) =>
    u === 'beber' || u === 'cocinar'
      ? r.destinos.humano
      : u === 'ganado'
        ? r.destinos.animal
        : u === 'cultivo'
          ? r.destinos.riego
          : u === 'banarse'
            ? r.destinos.bano
            : u === 'utensilios'
              ? r.destinos.utensilios
              : r.destinos.ropa;

  return (
    <Pantalla demo={c.demo} compacto nav="historial">
      <View style={[est.hero, { backgroundColor: color.fuerte }]}>
        <View style={est.heroFila}>
          <View style={est.heroIcono}>
            <Icono nombre={ICONO_SEMAFORO[luz.icono]} color={color.fuerte} tamano={40} grosor={2.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={est.heroEtiqueta}>{luz.etiqueta}</Text>
            <Text accessibilityRole="header" style={est.heroTitulo}>
              {luz.titulo}
            </Text>
          </View>
        </View>
        <Text style={est.heroMeta}>
          {c.fuente} · {new Date(c.lectura.recibidaEn).toLocaleDateString('es-CO')}
        </Text>
        <View style={est.usoCaja}>
          <Text style={[est.usoEtiqueta, { color: color.fuerte }]}>
            TU USO · {nombresUso[uso].toUpperCase()}
          </Text>
          <Text style={[s.texto, s.fuerte]}>{guia.estado}</Text>
          {r.plan === 'hervido' && (uso === 'beber' || uso === 'cocinar') ? (
            <Text style={[s.texto, s.fuerte]}>
              Aclara si hay partículas y hierve 3 minutos desde el burbujeo continuo.
              {inicial ? ' Antes de consumir, verifica de nuevo esta lectura.' : ''}
            </Text>
          ) : null}
          {!r.confiable ? (
            <Text style={[s.texto, s.fuerte]}>
              {inicial
                ? 'Lectura inicial: puede cambiar. No autoriza el consumo.'
                : 'Lectura no confiable · calibración o datos sin verificar'}
            </Text>
          ) : null}
          <Text style={s.texto}>{r.motivo}</Text>
        </View>
        <View style={est.descargo}>
          <Icono nombre="info" color="#FFFFFF" tamano={22} />
          <Text style={est.descargoTexto}>{DESCARGO}</Text>
        </View>
      </View>

      <Tarjeta tono="cielo">
        <Text style={est.seccion}>Qué hacer ahora</Text>
        {guia.pasos.map((paso, i) => (
          <View key={paso} style={est.pasoFila}>
            <View style={[est.pasoNumero, { backgroundColor: colores.azul }]}>
              <Text style={est.pasoNumeroTexto}>{i + 1}</Text>
            </View>
            <Text style={[s.texto, { flex: 1 }]}>{paso}</Text>
          </View>
        ))}
        {r.plan !== 'hervido' || uso === 'beber' || uso === 'cocinar' || uso === 'utensilios' ? (
          <Boton
            icono={r.plan === 'hervido' ? 'tratar' : 'flecha'}
            texto={
              r.plan === 'hervido'
                ? 'Abrir temporizador y guía'
                : r.plan === 'repetir'
                  ? 'Cómo revisar el equipo'
                  : 'Ver apoyo paso a paso'
            }
            onPress={() => router.push({ pathname: '/protocolo', params: { id } })}
          />
        ) : null}
      </Tarjeta>

      <Tarjeta>
        <Text style={est.seccion}>Guías para cuidar el agua</Text>
        <Texto suave>Funcionan sin internet. No cambian este resultado.</Texto>
        {guiasRecomendadas(r, c.observacion).map(gid => {
          const g = obtenerGuia(gid)!;
          return (
            <Boton
              key={gid}
              secundario
              icono="libro"
              texto={g.titulo}
              onPress={() => router.push({ pathname: '/guia', params: { id: gid } })}
            />
          );
        })}
      </Tarjeta>

      <Tarjeta>
        <View style={est.icaFila}>
          <AnilloIca ica={r.ica} tamano={112} />
          <View style={{ flex: 1, minWidth: 160, gap: 4 }}>
            <Text style={est.seccion}>Lo que midió el equipo</Text>
            <Texto suave>
              {r.ica === null
                ? 'El índice no se pudo calcular con esta lectura.'
                : r.plan === 'alternativa'
                  ? 'Hay señales de riesgo que pesan más que el índice.'
                  : 'El índice es orientativo; no es un porcentaje de potabilidad.'}
            </Texto>
          </View>
        </View>
        <ParametrosResumen lectura={c.lectura} />
        <Texto suave>
          Una alerta de olor o aspecto prevalece aunque el número sea alto. La temperatura es contexto.
        </Texto>
      </Tarjeta>

      <Tarjeta>
        <Text style={est.seccion}>Otros usos</Text>
        {otros.map(u => (
          <View key={u.id} style={est.otroFila}>
            <Text style={est.pictograma} accessible={false}>
              {u.icono}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.texto, s.fuerte]}>
                {u.id === 'beber' || u.id === 'cocinar' ? 'Beber o cocinar' : u.texto}
              </Text>
              <Text style={[s.texto, s.suave, tipo.pequeno]}>{destinoDe(u.id)}</Text>
            </View>
          </View>
        ))}
      </Tarjeta>

      <Audio texto={resumen} />
      <Boton
        secundario
        icono="compartir"
        texto="Compartir resultado"
        onPress={() => {
          void Share.share({ message: resumen }).catch(() =>
            Alert.alert('No se pudo compartir', 'La medición sigue guardada en tu teléfono.'),
          );
        }}
      />
      <Boton
        secundario
        icono={detalles ? 'atras' : 'info'}
        texto={detalles ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
        onPress={() => setDetalles(!detalles)}
      />
      {detalles ? (
        <Tarjeta>
          <Texto>
            Origen: {c.observacion.origen} · Olor: {c.observacion.olor}
            {c.observacion.olorTipo ? ` (${c.observacion.olorTipo})` : ''} · Aspecto: {c.observacion.visual}
          </Texto>
          <Texto suave>
            Reglas {r.reglas.join(', ')} · Motor {r.version}
          </Texto>
          <Texto suave>
            {c.demo
              ? 'Calibración simulada (DEMO).'
              : c.calibracion
                ? `Calibración declarada, vigente hasta ${new Date(c.calibracion.venceEn).toLocaleDateString('es-CO')}. La app no comprueba la sonda.`
                : 'Sin calibración registrada.'}
          </Texto>
        </Tarjeta>
      ) : null}
      <Texto suave>Guardada en este teléfono{c.demo ? ' como práctica' : ''}. No necesitas internet.</Texto>
      <Boton icono="mas" texto="Nueva medición" onPress={() => router.replace('/conectar')} />
    </Pantalla>
  );
}

const est = StyleSheet.create({
  hero: { borderRadius: radio.xl, padding: 20, gap: 14 },
  heroFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcono: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEtiqueta: { ...tipo.etiqueta, color: '#FFFFFF', opacity: 0.95 },
  heroTitulo: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  heroMeta: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', opacity: 0.95 },
  usoCaja: { backgroundColor: '#FFFFFF', borderRadius: radio.l, padding: 16, gap: 8 },
  usoEtiqueta: { ...tipo.etiqueta },
  descargo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  descargoTexto: { flex: 1, fontSize: 17, lineHeight: 24, fontWeight: '700', color: '#FFFFFF' },
  seccion: { ...tipo.seccion, color: colores.tinta },
  pasoFila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pasoNumero: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pasoNumeroTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  icaFila: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  otroFila: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 4 },
  pictograma: { fontSize: 28, width: 40, textAlign: 'center' },
});
