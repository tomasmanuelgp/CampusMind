// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Alert, AppState } from 'react-native';
import { Pantalla, Tarjeta, Texto, Boton, Audio, s } from '../ui/componentes';
import { obtenerCaptura, leerProgreso, guardarProgreso } from '../aplicacion/almacen';
import { metodosPara, obtenerMetodo, protocolos, type MetodoId } from '../dominio/protocolos';
import { DESCARGO, type Resultado } from '../dominio/motor';
const AVISOS_TIEMPO: Record<MetodoId, { iniciar: string; durante: string; reiniciar: string }> = {
  hervir: {
    iniciar: 'Inicia cuando el agua hierva con burbujas grandes.',
    durante: 'Mantén el hervor durante toda la cuenta.',
    reiniciar: 'Reiniciar si se interrumpió el hervor',
  },
  cloro: {
    iniciar: 'Inicia cuando hayas revuelto el agua con el cloro.',
    durante: 'Deja el recipiente tapado durante toda la cuenta.',
    reiniciar: 'Reiniciar la espera',
  },
  sol: {
    iniciar: 'Inicia cuando las botellas estén al sol.',
    durante: 'Si se nubla, déjalas 2 días seguidos al sol.',
    reiniciar: 'Reiniciar si se taparon del sol',
  },
};

function formatoTiempo(segundos: number) {
  const h = Math.floor(segundos / 3600),
    m = Math.floor((segundos % 3600) / 60),
    s2 = String(segundos % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s2}` : `${m}:${s2}`;
}

export default function ProtocoloPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Lecturas síncronas del teléfono: se resuelven al montar, sin efectos.
  const [registro] = useState(() => {
    try {
      return obtenerCaptura(id);
    } catch {
      return null;
    }
  });
  const [paso, setPaso] = useState(() => leerProgreso(id)?.paso ?? 0),
    [fin, setFin] = useState(() => leerProgreso(id)?.fin ?? null),
    [metodo, setMetodo] = useState<MetodoId | undefined>(() => leerProgreso(id)?.metodo),
    [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 500);
    const sub = AppState.addEventListener('change', () => setAhora(Date.now()));
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  if (!registro?.resultado)
    return (
      <Pantalla titulo="Busca tu medición">
        <Boton texto="Historial" onPress={() => router.replace('/historial')} />
      </Pantalla>
    );
  const resultado = JSON.parse(registro.resultado) as Resultado,
    metodos = metodosPara(resultado.plan),
    plan = metodos.length ? obtenerMetodo(metodo) : protocolos[resultado.plan],
    actual = plan.pasos[paso];
  const guardar = (nuevoPaso: number, nuevoFin: number | null, nuevoMetodo = metodo) => {
    try {
      guardarProgreso(id, { paso: nuevoPaso, fin: nuevoFin, metodo: nuevoMetodo });
      setPaso(nuevoPaso);
      setFin(nuevoFin);
      setMetodo(nuevoMetodo);
    } catch {
      Alert.alert('No se guardó el avance', 'Intenta de nuevo.');
    }
  };
  if (!actual)
    return (
      <Pantalla titulo="Pasos completados" demo={registro.captura.demo}>
        <Texto>
          Completar el procedimiento no certifica el agua. Evita volver a contaminarla al guardarla.
        </Texto>
        <Texto>{DESCARGO}</Texto>
        <Boton
          texto="Volver al resultado"
          onPress={() => router.replace({ pathname: '/resultado', params: { id } })}
        />
        <Boton secundario texto="Revisar pasos otra vez" onPress={() => guardar(0, null)} />
      </Pantalla>
    );
  const clave: MetodoId = metodos.length ? obtenerMetodo(metodo).id : 'hervir';
  const restante = fin === null ? (actual.segundos ?? 0) : Math.max(0, Math.ceil((fin - ahora) / 1000));
  return (
    <Pantalla key={paso} titulo={actual.titulo} demo={registro.captura.demo}>
      {metodos.length && paso === 0 && fin === null ? (
        <Tarjeta tono="cielo">
          <Texto fuerte>¿Cómo vas a desinfectar?</Texto>
          {metodos.map(m => (
            <Boton
              key={m.id}
              secundario={m.id !== obtenerMetodo(metodo).id}
              icono={m.id === obtenerMetodo(metodo).id ? 'check' : 'flecha'}
              texto={m.boton}
              detalle={m.detalle}
              onPress={() => guardar(0, null, m.id)}
            />
          ))}
        </Tarjeta>
      ) : null}
      <Text style={s.etiqueta}>
        {plan.titulo} · PASO {paso + 1} DE {plan.pasos.length}
      </Text>
      <Tarjeta>
        <Texto>{actual.texto}</Texto>
      </Tarjeta>
      <Audio texto={actual.titulo + '. ' + actual.texto + '. ' + plan.limites} />
      {actual.segundos ? (
        <Tarjeta tono="verde">
          <Text style={s.sensor}>{formatoTiempo(restante)}</Text>
          <Texto>
            {fin === null
              ? AVISOS_TIEMPO[clave].iniciar
              : restante
                ? AVISOS_TIEMPO[clave].durante
                : 'Tiempo cumplido. Ya puedes continuar.'}
          </Texto>
          <Boton
            secundario
            texto={fin === null ? 'Iniciar temporizador' : AVISOS_TIEMPO[clave].reiniciar}
            onPress={() => guardar(paso, Date.now() + actual.segundos! * 1000)}
          />
        </Tarjeta>
      ) : null}
      <Boton
        texto={paso === plan.pasos.length - 1 ? 'Terminar los pasos' : 'Hecho · siguiente paso'}
        disabled={!!actual.segundos && (fin === null || restante > 0)}
        onPress={() => guardar(paso + 1, null)}
      />
      {paso > 0 ? <Boton secundario texto="Paso anterior" onPress={() => guardar(paso - 1, null)} /> : null}
      <Tarjeta tono="ambar">
        <Texto>{plan.limites}</Texto>
      </Tarjeta>
      <Texto suave>Materiales: {plan.materiales}</Texto>
      <Texto suave>{DESCARGO}</Texto>
    </Pantalla>
  );
}
