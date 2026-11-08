// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Boton, Pantalla, Tarjeta, Texto, s } from '../ui/componentes';
import { Icono } from '../ui/iconos';
import { colores, radio, semaforoColores, sombra, tipo } from '../ui/tema';
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
import { semaforo } from '../dominio/presentacion';
import { nombresUso } from '../dominio/orientacion';

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
      void Share.share({ title: 'Mediciones RE-FLUYE (CSV)', message: exportarCsv() });
    } catch {
      setError('No se pudo preparar la exportación.');
    }
  };

  return (
    <Pantalla titulo="Mis mediciones" volver={false} nav="historial">
      <Texto suave>
        {total === 1 ? '1 medición guardada' : `${total} mediciones guardadas`} en este teléfono, incluso sin
        señal.
      </Texto>
      {error ? (
        <Tarjeta tono="rojo">
          <Texto>{error}</Texto>
        </Tarjeta>
      ) : null}
      {!filas.length && !error ? (
        <Tarjeta tono="cielo">
          <Icono nombre="gota" color={colores.azul} tamano={40} />
          <Text style={est.vacioTitulo}>Todavía no hay mediciones</Text>
          <Texto>Cuando midas una fuente, aquí verás su resultado para comparar con el tiempo.</Texto>
          <Boton icono="gota" texto="Medir mi primera fuente" onPress={() => router.push('/conectar')} />
        </Tarjeta>
      ) : null}

      {filas.map(f => {
        const r = f.resultado ? (JSON.parse(f.resultado) as Resultado) : null;
        const luz = r ? semaforo(r, f.captura.estabilidad === 'inicial') : null;
        const colorBarra = luz ? semaforoColores[luz.tono].fuerte : colores.deshabilitado;
        const id = f.captura.id;
        return (
          <View key={id} style={[est.fila, { borderLeftColor: colorBarra }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${f.captura.fuente}. ${luz?.titulo ?? 'Observación pendiente'}. ${f.completa ? 'Abrir resultado' : 'Continuar observación'}`}
              onPress={() => {
                if (f.completa) router.push({ pathname: '/resultado', params: { id } });
                else {
                  useSesion.getState().reanudar(f.captura);
                  router.push('/observacion');
                }
              }}
              style={({ pressed }) => [{ gap: 4 }, pressed && s.presionado]}
            >
              <Text style={s.etiqueta}>
                {f.captura.demo ? 'DEMO · ' : ''}
                {new Date(f.captura.lectura.recibidaEn).toLocaleString('es-CO')}
              </Text>
              <View style={est.titular}>
                <Text style={est.fuente}>{f.captura.fuente}</Text>
                <Icono nombre="flecha" color={colores.azul} tamano={22} />
              </View>
              <View style={s.fila}>
                <View style={[est.punto, { backgroundColor: colorBarra }]} />
                <Text style={[s.texto, s.fuerte, { flex: 1 }]}>{luz?.titulo ?? 'Observación pendiente'}</Text>
              </View>
              <Text style={[s.texto, s.suave, tipo.pequeno]}>
                {f.captura.uso ? `Uso: ${nombresUso[f.captura.uso]}` : ''}
                {r && !r.confiable ? ' · Lectura no confiable' : ''}
              </Text>
            </Pressable>
            {confirmar === id ? (
              <View style={{ gap: 8 }}>
                <Texto>¿Borrar esta medición? No se puede recuperar.</Texto>
                <Boton
                  variante="peligro"
                  texto="Sí, borrar esta medición"
                  icono="papelera"
                  onPress={() => borrar(id)}
                />
                <Boton secundario texto="Cancelar" onPress={() => setConfirmar(null)} />
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Borrar la medición ${f.captura.fuente}`}
                onPress={() => setConfirmar(id)}
                style={est.borrar}
              >
                <Icono nombre="papelera" color={colores.suave} tamano={20} />
                <Text style={est.borrarTexto}>Borrar</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {filas.length < total ? (
        <Boton
          secundario
          texto={`Ver más (${total - filas.length} restantes)`}
          icono="descargar"
          onPress={() => setLimite(limite + PAGINA)}
        />
      ) : null}

      {total > 0 ? (
        <Tarjeta>
          <Text style={est.seccion}>Tus datos</Text>
          <Texto>Puedes llevarte tus mediciones o borrarlas cuando quieras.</Texto>
          <Boton secundario texto="Exportar mediciones (CSV)" icono="compartir" onPress={exportar} />
          {confirmar === 'todo' ? (
            <>
              <Texto>
                ¿Borrar las {total} mediciones? No se pueden recuperar. El equipo y su calibración se
                conservan.
              </Texto>
              <Boton
                variante="peligro"
                texto="Sí, borrar todo"
                icono="papelera"
                onPress={() => borrar('todo')}
              />
              <Boton secundario texto="Cancelar" onPress={() => setConfirmar(null)} />
            </>
          ) : (
            <Boton
              secundario
              texto="Borrar todas las mediciones"
              icono="papelera"
              onPress={() => setConfirmar('todo')}
            />
          )}
        </Tarjeta>
      ) : null}
      <Boton
        secundario
        texto="Qué datos guarda la app"
        icono="escudo"
        onPress={() => router.push('/datos')}
      />
      <Texto suave>{DESCARGO}</Texto>
    </Pantalla>
  );
}

const est = StyleSheet.create({
  vacioTitulo: { ...tipo.seccion, color: colores.tinta },
  fila: {
    backgroundColor: colores.tarjeta,
    borderRadius: radio.l,
    borderLeftWidth: 8,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
    gap: 10,
    ...sombra,
  },
  titular: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fuente: { fontSize: 20, fontWeight: '900', color: colores.tinta, flex: 1 },
  punto: { width: 12, height: 12, borderRadius: 6 },
  borrar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingRight: 12,
  },
  borrarTexto: { fontSize: 16, fontWeight: '700', color: colores.suave },
  seccion: { ...tipo.seccion, color: colores.tinta },
});
