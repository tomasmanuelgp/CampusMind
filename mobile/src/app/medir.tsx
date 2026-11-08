import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, AppState, Text } from 'react-native';
import { Pantalla, Tarjeta, Texto, Boton, Campo, s } from '../ui/componentes';
import { GrupoOpciones } from '../ui/opciones';
import { DiagnosticoBluetooth, TarjetaSensores } from '../ui/sensores';
import { TarjetaConclusion, estilosSeccion } from '../ui/conclusion';
import { useSesion } from '../aplicacion/sesion';
import { calibracionDeSesion } from '../aplicacion/almacen';
import { esEstable, lecturaRecienteValida } from '../dominio/estabilidad';
import { lecturaEnVivo } from '../dominio/monitoreo';
import { resumirEnVivo } from '../dominio/resumenEnVivo';
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

  const falta = [
    !fuente.trim() ? 'nombre de la fuente' : null,
    !uso ? 'uso' : null,
    !observacion.origen ? 'origen' : null,
    !observacion.olor ? 'olor' : null,
    !observacion.visual ? 'aspecto' : null,
  ].filter(Boolean);
  const observar = (datos: Partial<Observacion>) => setObservacion(o => ({ ...o, ...datos }));
  const elegirOlor = (olor: Observacion['olor']) =>
    setObservacion(o => (olor === 'raro' ? { ...o, olor } : { ...o, olor, olorTipo: undefined }));

  const analizar = () => {
    if (!uso || falta.length) return;
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

  return (
    <Pantalla titulo="Mide y observa" demo={demo} compacto>
      <Texto>Tu lectura y lo que observas, en un solo lugar. Nunca pruebes el agua.</Texto>
      <TarjetaConclusion resumen={resumen} demo={demo} />
      {error ? (
        <Tarjeta tono="ambar">
          <Texto>{error}</Texto>
        </Tarjeta>
      ) : null}

      <Tarjeta tono={vivo ? 'verde' : 'ambar'}>
        <Text style={s.etiqueta}>
          {vivo ? '● DATOS EN VIVO' : estado === 'desconectado' ? 'EQUIPO DESCONECTADO' : 'ESPERANDO DATOS…'}
        </Text>
        <Texto>
          {vivo
            ? `Actualizado hace ${Math.max(0, Math.floor((ahora - vivo.recibidaEn) / 1000))} s. Los valores cambian con cada lectura del equipo.`
            : 'No hay una lectura reciente. Revisa la conexión y que el equipo esté enviando datos.'}
        </Texto>
        <Texto>
          {lectura
            ? 'Ya puedes analizar; no necesitas esperar estabilidad.'
            : vivo
              ? 'Puedes observar los valores disponibles. Para analizar, revisa los datos indicados abajo.'
              : 'Los números anteriores no se muestran como datos actuales.'}
        </Texto>
        {vivo?.errores.map(e => (
          <Texto key={e}>{e}</Texto>
        ))}
      </Tarjeta>

      <TarjetaSensores vivo={vivo} lecturas={lecturas} />
      <Boton
        secundario
        texto={diagnostico ? 'Ocultar datos del equipo' : 'Ver datos recibidos por Bluetooth'}
        onPress={() => setDiagnostico(!diagnostico)}
      />
      {diagnostico ? <DiagnosticoBluetooth lecturas={lecturas} estable={estable} /> : null}
      {!demo ? (
        <Texto suave>
          Sin registro de calibración vigente, el resultado no se considera confiable aunque las cifras se
          repitan.
        </Texto>
      ) : null}

      <Tarjeta tono="cielo">
        <Text style={estilosSeccion.titulo}>Nombra la fuente</Text>
        <Campo
          etiqueta="¿Dónde tomaste esta agua?"
          placeholder="Ej. Quebrada de la finca"
          value={fuente}
          maxLength={80}
          onChangeText={setFuente}
        />
        <Texto suave>Usa el nombre del lugar, no de personas.</Texto>
      </Tarjeta>

      <Tarjeta tono="lima">
        <Text style={estilosSeccion.titulo}>¿Para qué usarás el agua?</Text>
        <GrupoOpciones
          ayuda="Elige el uso que necesitas ahora."
          opciones={USOS}
          valor={uso}
          elegir={setUso}
        />
      </Tarjeta>

      <Tarjeta tono="ambar">
        <Text style={estilosSeccion.titulo}>¿Qué notas en el agua?</Text>
        <Texto suave>Tu conocimiento del lugar también cuenta. Si dudas, elige «No sé».</Texto>
        <GrupoOpciones
          titulo="¿El agua corre o está quieta?"
          ayuda="Piensa en la fuente, no en el recipiente."
          opciones={ORIGENES}
          valor={observacion.origen}
          elegir={origen => observar({ origen })}
        />
        <GrupoOpciones
          titulo="¿Notas un olor extraño?"
          ayuda="No acerques la cara si sospechas químicos. Nunca pruebes el agua."
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
      {falta.length ? <Texto suave>Para analizar, completa: {falta.join(', ')}.</Texto> : null}
      <Boton
        texto="Ver qué puedo hacer con esta agua"
        disabled={!lectura || falta.length > 0 || guardando}
        onPress={analizar}
      />
      <Boton secundario texto="Volver a conectar" onPress={() => router.replace('/conectar')} />
      <Boton
        secundario
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
