import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Share, Text } from 'react-native';
import { Pantalla, Tarjeta, Texto, Boton, s } from '../ui/componentes';
import {
  listarCapturas,
  contarCapturas,
  borrarCaptura,
  borrarTodo,
  exportarCsv,
  type Registro,
} from '../aplicacion/almacen';
import { useSesion } from '../aplicacion/sesion';
import { DESCARGO, type Resultado } from '../dominio/motor';

const PAGINA = 20;

export default function Historial() {
  const [filas, setFilas] = useState<Registro[]>([]);
  const [total, setTotal] = useState(0);
  const [limite, setLimite] = useState(PAGINA);
  const [error, setError] = useState('');
  // Id de la medición a borrar, 'todo' para todas, o null.
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const cargar = useCallback((cuantas: number) => {
    try {
      setFilas(listarCapturas(cuantas));
      setTotal(contarCapturas());
      setError('');
    } catch {
      setError('No pudimos leer el historial. Reinicia la aplicación.');
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      cargar(limite);
    }, [cargar, limite]),
  );

  const borrar = (id: string) => {
    try {
      if (id === 'todo') borrarTodo();
      else borrarCaptura(id);
      setConfirmar(null);
      cargar(limite);
    } catch {
      setError('No se pudo borrar. Intenta de nuevo.');
    }
  };
  const exportar = () => {
    try {
      void Share.share({ title: 'Mediciones Re-Fluye (CSV)', message: exportarCsv() });
    } catch {
      setError('No se pudo preparar la exportación.');
    }
  };

  return (
    <Pantalla titulo="Mis mediciones">
      <Texto>Guardadas en tu teléfono, incluso sin señal.</Texto>
      <Tarjeta tono="ambar">
        <Texto>{DESCARGO}</Texto>
      </Tarjeta>
      {error ? (
        <Tarjeta tono="rojo">
          <Texto>{error}</Texto>
        </Tarjeta>
      ) : null}
      {!filas.length && !error ? (
        <Tarjeta>
          <Texto>Todavía no has guardado mediciones.</Texto>
          <Boton texto="Medir mi primera fuente" onPress={() => router.push('/conectar')} />
        </Tarjeta>
      ) : null}

      {filas.map(f => {
        const r = f.resultado ? (JSON.parse(f.resultado) as Resultado) : null;
        const id = f.captura.id;
        return (
          <Tarjeta key={id} tono={r?.nivel === 2 ? 'rojo' : 'blanco'}>
            <Text style={s.etiqueta}>
              {f.captura.demo ? 'DEMO · ' : ''}
              {new Date(f.captura.lectura.recibidaEn).toLocaleString('es-CO')}
            </Text>
            <Text style={[s.texto, { fontWeight: '800' }]}>{f.captura.fuente}</Text>
            <Texto>{r?.titulo ?? 'Observación pendiente'}</Texto>
            {r && !r.confiable ? <Texto>Lectura no confiable</Texto> : null}
            <Boton
              secundario
              texto={f.completa ? 'Abrir resultado' : 'Continuar observación'}
              onPress={() => {
                if (f.completa) router.push({ pathname: '/resultado', params: { id } });
                else {
                  useSesion.getState().reanudar(f.captura);
                  router.push('/observacion');
                }
              }}
            />
            {confirmar === id ? (
              <>
                <Texto>¿Borrar esta medición? No se puede recuperar.</Texto>
                <Boton texto="Sí, borrar esta medición" icono="✕" onPress={() => borrar(id)} />
                <Boton secundario texto="Cancelar" onPress={() => setConfirmar(null)} />
              </>
            ) : (
              <Boton secundario texto="Borrar" icono="✕" onPress={() => setConfirmar(id)} />
            )}
          </Tarjeta>
        );
      })}

      {filas.length < total ? (
        <Boton
          secundario
          texto={`Ver más (${total - filas.length} restantes)`}
          icono="↓"
          onPress={() => setLimite(limite + PAGINA)}
        />
      ) : null}

      {total > 0 ? (
        <Tarjeta>
          <Text style={s.etiqueta}>TUS DATOS</Text>
          <Texto>Puedes llevarte tus mediciones o borrarlas cuando quieras.</Texto>
          <Boton secundario texto="Exportar mediciones (CSV)" icono="⇪" onPress={exportar} />
          {confirmar === 'todo' ? (
            <>
              <Texto>
                ¿Borrar las {total} mediciones? No se pueden recuperar. El equipo y su calibración se
                conservan.
              </Texto>
              <Boton texto="Sí, borrar todo" icono="✕" onPress={() => borrar('todo')} />
              <Boton secundario texto="Cancelar" onPress={() => setConfirmar(null)} />
            </>
          ) : (
            <Boton
              secundario
              texto="Borrar todas las mediciones"
              icono="✕"
              onPress={() => setConfirmar('todo')}
            />
          )}
        </Tarjeta>
      ) : null}
      <Boton secundario texto="Qué datos guarda la app" icono="?" onPress={() => router.push('/datos')} />
    </Pantalla>
  );
}
