// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, AppState, StyleSheet, Text, View } from 'react-native';
import { Boton, Campo, Chip, Pantalla, Paso, Tarjeta, Texto, s } from '../ui/componentes';
import { GrupoOpciones } from '../ui/opciones';
import { DiagnosticoBluetooth, TarjetaSensores } from '../ui/sensores';
import { ConclusionCompacta, TarjetaConclusion } from '../ui/conclusion';
import { Icono } from '../ui/iconos';
import { colores, radio } from '../ui/tema';
import { useSesion } from '../aplicacion/sesion';
import { calibracionDeSesion } from '../aplicacion/almacen';
import { esEstable, lecturaRecienteValida } from '../dominio/estabilidad';
import { lecturaEnVivo } from '../dominio/monitoreo';
import { resumirEnVivo } from '../dominio/resumenEnVivo';
import { avanceMedicion } from '../dominio/presentacion';
import { ASPECTOS, OLORES, ORIGENES, TIPOS_OLOR, USOS } from '../dominio/catalogos';
import type { Observacion, Uso } from '../dominio/tipos';

/** Reloj de pantalla: avanza cada medio segundo y vacía las lecturas al salir de la app. */
function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 500);
    const sub = AppState.addEventListener('change', v => {
      if (v !== 'active') useSesion.setState({ lecturas: [] });
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  return ahora;
}

export default function Medir() {
  const { lecturas, estado, demo, nombreEquipo, equipo, error } = useSesion();
  const calibracion = useMemo(() => calibracionDeSesion(equipo, demo), [equipo, demo]);
  const ahora = useAhora();
  const [fuente, setFuente] = useState('');
  const [uso, setUso] = useState<Uso | undefined>();
  const [observacion, setObservacion] = useState<Partial<Observacion>>({});
  const [guardando, setGuardando] = useState(false);
  const [diagnostico, setDiagnostico] = useState(false);

  const lectura = estado === 'recibiendo' ? lecturaRecienteValida(lecturas, ahora) : null;
  const vivo = lecturaEnVivo(lecturas, estado, ahora);
  const estable = Boolean(lectura && esEstable(lecturas, ahora));
  const resumen = resumirEnVivo(vivo, observacion, calibracion, uso, estable);
  const avance = avanceMedicion({ lectura, fuente, uso, observacion });

  const observar = (datos: Partial<Observacion>) => setObservacion(o => ({ ...o, ...datos }));
  const elegirOlor = (olor: Observacion['olor']) =>
    setObservacion(o => (olor === 'raro' ? { ...o, olor } : { ...o, olor, olorTipo: undefined }));

  const analizar = () => {
    if (!uso || !avance.completo) return;
    try {
      setGuardando(true);
      const sesion = useSesion.getState();
      sesion.capturar(fuente, uso);
      sesion.observar(observacion);
      router.replace({ pathname: '/resultado', params: { id: sesion.finalizar() } });
    } catch (e) {
      setGuardando(false);
      Alert.alert(
        'No se guardó el análisis',
        e instanceof Error ? e.message : 'Reintenta. Tu lectura puede estar guardada como pendiente.',
      );
    }
  };

  const segundos = vivo ? Math.max(0, Math.floor((ahora - vivo.recibidaEn) / 1000)) : null;

  return (
    <Pantalla
      titulo="Mide y observa"
      demo={demo}
      compacto
      pie={
        <>
          <ConclusionCompacta resumen={resumen} />
          <Boton
            icono="flecha"
            texto="Ver qué puedo hacer con esta agua"
            detalle={avance.completo ? undefined : `Falta: ${avance.falta.join(', ')}`}
            disabled={!avance.completo || guardando}
            onPress={analizar}
          />
        </>
      }
    >
      <View
        style={est.progreso}
        accessibilityLabel={`Pasos completos: ${avance.pasos.filter(p => p.listo).length} de 3`}
      >
        {avance.pasos.map(p => (
          <View key={p.titulo} style={est.progresoItem}>
            <View style={[est.barra, p.listo && est.barraLista]} />
            <Text style={[est.progresoTexto, p.listo && { color: '#1B7A3E' }]}>{p.titulo}</Text>
          </View>
        ))}
      </View>

      <TarjetaConclusion resumen={resumen} demo={demo} />
      {error ? (
        <Tarjeta tono="ambar">
          <Texto>{error}</Texto>
        </Tarjeta>
      ) : null}

      <Paso
        numero={1}
        titulo="Lectura del equipo"
        listo={avance.pasos[0].listo}
        ayuda="Pon las sondas en el agua y espera unos segundos."
      />
      <View style={[est.vivo, { backgroundColor: vivo ? '#E3F4E8' : '#FFF1D6' }]}>
        <View style={[est.puntoVivo, { backgroundColor: vivo ? '#1B7A3E' : '#8A5300' }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.texto, s.fuerte]}>
            {vivo
              ? `Datos en vivo · hace ${segundos} s`
              : estado === 'desconectado'
                ? 'Equipo desconectado'
                : 'Esperando datos…'}
          </Text>
          <Text style={[s.texto, s.suave, { fontSize: 15 }]}>
            {lectura
              ? 'Ya puedes analizar; no necesitas esperar estabilidad.'
              : vivo
                ? 'Revisa los datos marcados abajo para poder analizar.'
                : 'Revisa la conexión y que el equipo esté enviando datos.'}
          </Text>
        </View>
        {estable ? <Chip texto="ESTABLE" color="#1B6B37" fondo="#FFFFFF" /> : null}
      </View>
      {vivo?.errores.map(e => (
        <View key={e} style={s.fila}>
          <Icono nombre="alerta" color="#7A4A00" tamano={20} />
          <Text style={[s.texto, { flex: 1 }]}>{e}</Text>
        </View>
      ))}
      <TarjetaSensores vivo={vivo} lecturas={lecturas} />
      <View style={est.filaBotones}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Boton
            secundario
            icono={diagnostico ? 'atras' : 'bluetooth'}
            texto={diagnostico ? 'Ocultar datos del equipo' : 'Ver datos recibidos'}
            onPress={() => setDiagnostico(!diagnostico)}
          />
        </View>
        {estado === 'desconectado' && !demo ? (
          <View style={{ flex: 1, minWidth: 220 }}>
            <Boton
              secundario
              icono="repetir"
              texto="Volver a conectar"
              onPress={() => router.replace('/conectar')}
            />
          </View>
        ) : null}
      </View>
      {diagnostico ? <DiagnosticoBluetooth lecturas={lecturas} estable={estable} /> : null}
      {!demo && !calibracion ? (
        <Chip
          texto="Sin calibración vigente: el resultado no será confiable"
          icono="alerta"
          color="#7A4A00"
          fondo="#FFF1D6"
        />
      ) : null}

      <Paso
        numero={2}
        titulo="Tu agua"
        listo={avance.pasos[1].listo}
        ayuda="Dónde la tomaste y para qué la quieres."
      />
      <Tarjeta>
        <Campo
          etiqueta="¿Dónde tomaste esta agua?"
          placeholder="Ej. Quebrada de la finca"
          value={fuente}
          maxLength={80}
          onChangeText={setFuente}
        />
        <Texto suave>Usa el nombre del lugar, no de personas.</Texto>
        <GrupoOpciones
          titulo="¿Para qué usarás el agua?"
          opciones={USOS}
          valor={uso}
          elegir={setUso}
          detalles={false}
        />
      </Tarjeta>

      <Paso
        numero={3}
        titulo="Observa el agua"
        listo={avance.pasos[2].listo}
        ayuda="Tu conocimiento del lugar cuenta. Si dudas, elige «No sé». Nunca pruebes el agua."
      />
      <Tarjeta>
        <GrupoOpciones
          titulo="¿El agua corre o está quieta?"
          ayuda="Piensa en la fuente, no en el recipiente."
          opciones={ORIGENES}
          valor={observacion.origen}
          elegir={origen => observar({ origen })}
        />
        <GrupoOpciones
          titulo="¿Notas un olor extraño?"
          ayuda="No acerques la cara si sospechas químicos."
          opciones={OLORES}
          valor={observacion.olor}
          elegir={elegirOlor}
        />
        {observacion.olor === 'raro' ? (
          <GrupoOpciones
            titulo="¿A qué se parece?"
            ayuda="Este detalle no cambia la advertencia por olor."
            opciones={TIPOS_OLOR}
            valor={observacion.olorTipo}
            elegir={olorTipo => observar({ olorTipo })}
          />
        ) : null}
        <GrupoOpciones
          titulo="¿Cómo se ve?"
          ayuda="Mira el agua y su superficie."
          opciones={ASPECTOS}
          valor={observacion.visual}
          elegir={visual => observar({ visual })}
        />
      </Tarjeta>

      <TarjetaConclusion resumen={resumen} demo={demo} detallada />
      <Boton
        secundario
        icono="detener"
        texto="Desconectar equipo"
        onPress={() => {
          void useSesion.getState().desconectar();
          router.replace('/');
        }}
      />
      <Texto suave>
        {nombreEquipo || 'Sin equipo conectado'} · La evaluación queda guardada en este teléfono.
      </Texto>
    </Pantalla>
  );
}

const est = StyleSheet.create({
  progreso: { flexDirection: 'row', gap: 8 },
  progresoItem: { flex: 1, gap: 6 },
  barra: { height: 8, borderRadius: radio.total, backgroundColor: colores.borde },
  barraLista: { backgroundColor: '#1B7A3E' },
  progresoTexto: { fontSize: 14, fontWeight: '800', color: colores.suave, textAlign: 'center' },
  vivo: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radio.l, padding: 14 },
  puntoVivo: { width: 14, height: 14, borderRadius: 7 },
  filaBotones: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
