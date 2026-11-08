// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, Chip, Gota, Hero, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono, type NombreIcono } from '../ui/iconos';
import { colores, radio, semaforoColores, sombra, tipo } from '../ui/tema';
import {
  contarCapturas,
  leerCalibracion,
  leerEquipoRecordado,
  listarCapturas,
  type EquipoRecordado,
  type Registro,
} from '../aplicacion/almacen';
import { useSesion } from '../aplicacion/sesion';
import { calibracionVigente, DESCARGO, type Resultado } from '../dominio/motor';
import { semaforo } from '../dominio/presentacion';

interface Panel {
  ultimas: Registro[];
  total: number;
  equipo: EquipoRecordado | null;
  calibracionHasta: number | null;
  error: string;
}

function leerPanel(): Panel {
  try {
    const equipo = leerEquipoRecordado();
    const calibracion = equipo ? leerCalibracion(equipo.id) : null;
    return {
      ultimas: listarCapturas(5),
      total: contarCapturas(),
      equipo,
      calibracionHasta:
        calibracion && calibracionVigente(calibracion, Date.now()) ? calibracion.venceEn : null,
      error: '',
    };
  } catch {
    return {
      ultimas: [],
      total: 0,
      equipo: null,
      calibracionHasta: null,
      error: 'No pudimos abrir tus datos. Reinicia la aplicación antes de medir.',
    };
  }
}

function Acceso({
  icono,
  texto,
  detalle,
  ruta,
}: {
  icono: NombreIcono;
  texto: string;
  detalle: string;
  ruta: '/historial' | '/aprender' | '/equipo' | '/datos';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${texto}. ${detalle}`}
      onPress={() => router.push(ruta)}
      style={({ pressed }) => [est.acceso, pressed && s.presionado]}
    >
      <View style={est.accesoIcono}>
        <Icono nombre={icono} color={colores.azul} tamano={26} />
      </View>
      <Text style={est.accesoTexto}>{texto}</Text>
      <Text style={est.accesoDetalle}>{detalle}</Text>
    </Pressable>
  );
}

export default function Inicio() {
  const [panel, setPanel] = useState<Panel>(leerPanel);
  const estado = useSesion(v => v.estado);
  useFocusEffect(useCallback(() => setPanel(leerPanel()), []));
  const borrador = panel.ultimas.find(r => !r.completa);
  const ultima = panel.ultimas.find(r => r.completa && r.resultado);
  const conectado = estado === 'recibiendo' || estado === 'esperando';

  const resultadoUltima = ultima?.resultado ? (JSON.parse(ultima.resultado) as Resultado) : null;
  const luzUltima =
    resultadoUltima && ultima ? semaforo(resultadoUltima, ultima.captura.estabilidad === 'inicial') : null;

  return (
    <Pantalla volver={false} nav="inicio">
      <Hero>
        <View style={est.heroFila}>
          <Gota tamano={56} clara />
          <Text style={est.heroEtiqueta}>TECNOLOGÍA ABIERTA PARA EL AGUA RURAL</Text>
        </View>
        <Text accessibilityRole="header" style={est.heroTitulo}>
          Conoce tu agua.{'\n'}Decide qué hacer.
        </Text>
        <Text style={est.heroTexto}>
          Tu equipo mide, tú observas y la app te dice qué hacer, paso a paso.
        </Text>
        <Boton
          variante="claro"
          icono="gota"
          texto={panel.equipo ? `Medir con ${panel.equipo.nombre}` : 'Medir agua'}
          detalle={panel.equipo ? 'Conecta tu equipo recordado' : 'Conecta tu equipo por Bluetooth'}
          disabled={!!panel.error}
          onPress={() =>
            router.push(panel.equipo ? { pathname: '/conectar', params: { auto: '1' } } : '/conectar')
          }
        />
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await useSesion.getState().iniciarDemo();
            router.push('/medir');
          }}
          style={({ pressed }) => [est.demo, pressed && s.presionado]}
        >
          <Text style={est.demoTexto}>Practicar sin equipo · DEMO</Text>
          <Icono nombre="flecha" color="#FFFFFF" tamano={22} />
        </Pressable>
      </Hero>

      {panel.error ? (
        <Tarjeta tono="rojo">
          <Texto>{panel.error}</Texto>
        </Tarjeta>
      ) : null}

      {borrador ? (
        <Tarjeta tono="ambar">
          <Text style={s.etiqueta}>MEDICIÓN PENDIENTE{borrador.captura.demo ? ' · DEMO' : ''}</Text>
          <Texto fuerte>{borrador.captura.fuente}</Texto>
          <Boton
            secundario
            texto="Continuar observación"
            onPress={() => {
              useSesion.getState().reanudar(borrador.captura);
              router.push('/observacion');
            }}
          />
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <View style={est.equipoFila}>
          <View style={[est.equipoIcono, conectado && { backgroundColor: '#1B7A3E' }]}>
            <Icono nombre="bluetooth" color="#FFFFFF" tamano={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.etiqueta}>TU EQUIPO</Text>
            <Text style={est.equipoNombre}>{panel.equipo?.nombre ?? 'Sin equipo todavía'}</Text>
            <Text style={[s.texto, s.suave, tipo.pequeno]}>
              {conectado
                ? 'Conectado ahora'
                : panel.equipo
                  ? 'Recordado: se conecta con un toque'
                  : 'Búscalo la primera vez que midas'}
            </Text>
          </View>
        </View>
        {panel.equipo ? (
          panel.calibracionHasta ? (
            <Chip
              texto={`Calibración declarada hasta ${new Date(panel.calibracionHasta).toLocaleDateString('es-CO')}`}
              icono="check"
              color="#1B6B37"
              fondo="#E3F4E8"
            />
          ) : (
            <Chip
              texto="Sin calibración vigente: resultados no confiables"
              icono="alerta"
              color="#7A4A00"
              fondo="#FFF1D6"
            />
          )
        ) : null}
      </Tarjeta>

      {ultima && luzUltima && resultadoUltima ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Última medición: ${ultima.captura.fuente}. ${luzUltima.titulo}. Abrir resultado`}
          onPress={() => router.push({ pathname: '/resultado', params: { id: ultima.captura.id } })}
          style={({ pressed }) => [
            est.ultima,
            { borderLeftColor: semaforoColores[luzUltima.tono].fuerte },
            pressed && s.presionado,
          ]}
        >
          <Text style={s.etiqueta}>ÚLTIMA MEDICIÓN{ultima.captura.demo ? ' · DEMO' : ''}</Text>
          <Text style={est.ultimaFuente}>{ultima.captura.fuente}</Text>
          <View style={s.fila}>
            <View style={[est.punto, { backgroundColor: semaforoColores[luzUltima.tono].fuerte }]} />
            <Text style={[s.texto, s.fuerte, { flex: 1 }]}>{luzUltima.titulo}</Text>
          </View>
          <Text style={[s.texto, s.suave, tipo.pequeno]}>
            {new Date(ultima.captura.lectura.recibidaEn).toLocaleString('es-CO')} · {panel.total} mediciones
            guardadas
          </Text>
        </Pressable>
      ) : null}

      <View style={est.accesos}>
        <Acceso
          icono="historial"
          texto="Mis mediciones"
          detalle="Historial, exportar y borrar"
          ruta="/historial"
        />
        <Acceso icono="libro" texto="Aprender" detalle="Cómo medir y cuidar el equipo" ruta="/aprender" />
        <Acceso icono="ajustes" texto="Mi equipo" detalle="Conexión y calibración" ruta="/equipo" />
        <Acceso icono="escudo" texto="Tus datos" detalle="Qué guardamos y dónde" ruta="/datos" />
      </View>

      <View style={est.aviso}>
        <Icono nombre="info" color={colores.azul} tamano={24} />
        <Text style={[s.texto, { flex: 1 }]}>
          Medimos pH, turbidez, sólidos disueltos y temperatura. {DESCARGO}
        </Text>
      </View>
    </Pantalla>
  );
}

const est = StyleSheet.create({
  heroFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroEtiqueta: { ...tipo.etiqueta, color: '#CFE6F5', flex: 1, textAlign: 'right' },
  heroTitulo: { ...tipo.hero, color: '#FFFFFF' },
  heroTexto: { ...tipo.cuerpo, color: '#E3F0F8' },
  demo: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  demoTexto: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textDecorationLine: 'underline' },
  equipoFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  equipoIcono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colores.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoNombre: { fontSize: 20, fontWeight: '800', color: colores.tinta },
  ultima: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.l,
    borderLeftWidth: 8,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra,
  },
  ultimaFuente: { fontSize: 21, fontWeight: '900', color: colores.tinta },
  punto: { width: 14, height: 14, borderRadius: 7 },
  accesos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  acceso: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 128,
    backgroundColor: colores.tarjeta,
    borderRadius: radio.l,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra,
  },
  accesoIcono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.cielo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accesoTexto: { fontSize: 18, fontWeight: '800', color: colores.tinta },
  accesoDetalle: { fontSize: 14, lineHeight: 19, color: colores.suave },
  aviso: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colores.cielo,
    borderRadius: radio.l,
    padding: 16,
  },
});
