// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react';
import { router } from 'expo-router';
import { Pantalla, Tarjeta, Texto, Boton, Campo } from '../ui/componentes';
import { useSesion } from '../aplicacion/sesion';
import { guardarCalibracion, leerCalibracion, leerEquipoRecordado } from '../aplicacion/almacen';
import { validarRegistroCalibracion } from '../dominio/calibracion';

export default function EquipoPantalla() {
  const [equipo] = useState(leerEquipoRecordado);
  const [calibracion, setCalibracion] = useState(() => (equipo ? leerCalibracion(equipo.id) : null));
  const [editar, setEditar] = useState(false);
  const [registro, setRegistro] = useState({ responsable: '', referencia: '', realizada: '', vence: '' });
  const [mensaje, setMensaje] = useState('');
  const campo = (clave: keyof typeof registro) => (valor: string) =>
    setRegistro(r => ({ ...r, [clave]: valor }));

  const guardar = () => {
    if (!equipo) return;
    const v = validarRegistroCalibracion(registro, Date.now());
    if (!v.ok) return setMensaje(v.error);
    try {
      guardarCalibracion(equipo.id, v.calibracion);
      setCalibracion(v.calibracion);
      setEditar(false);
      setMensaje('');
    } catch {
      setMensaje('No se guardó. Reintenta el registro.');
    }
  };

  return (
    <Pantalla titulo="Mi equipo">
      <Tarjeta>
        <Texto>{equipo?.nombre ?? 'Todavía no has conectado un equipo'}</Texto>
        <Texto>
          {calibracion
            ? `Calibración declarada por ${calibracion.responsable}, vigente hasta ${new Date(calibracion.venceEn).toLocaleDateString('es-CO')}. La app guarda lo que se registra; no comprueba la sonda.`
            : 'Calibración sin verificar. Tus resultados se marcarán no confiables hasta registrar evidencia técnica vigente.'}
        </Texto>
      </Tarjeta>
      <Boton texto="Conectar o cambiar equipo" onPress={() => router.push('/conectar')} />
      <Boton secundario texto="Desconectar equipo" onPress={() => void useSesion.getState().desconectar()} />
      {equipo ? (
        <Boton
          secundario
          texto={editar ? 'Cerrar registro técnico' : 'Registrar calibración realizada'}
          onPress={() => setEditar(!editar)}
        />
      ) : null}
      {editar && equipo ? (
        <Tarjeta>
          <Texto>
            Solo registra una calibración que un técnico ya realizó. Esta pantalla no calibra las sondas ni
            envía comandos al equipo. La vigencia debe proceder del protocolo técnico.
          </Texto>
          <Campo
            etiqueta="Responsable técnico"
            value={registro.responsable}
            onChangeText={campo('responsable')}
          />
          <Campo
            etiqueta="Referencia del registro de calibración"
            value={registro.referencia}
            onChangeText={campo('referencia')}
          />
          <Campo
            etiqueta="Realizada (AAAA-MM-DD)"
            value={registro.realizada}
            onChangeText={campo('realizada')}
            placeholder="2026-09-14"
          />
          <Campo
            etiqueta="Vence (AAAA-MM-DD)"
            value={registro.vence}
            onChangeText={campo('vence')}
            placeholder="Fecha indicada por el técnico"
          />
          {mensaje ? (
            <Tarjeta tono="ambar">
              <Texto>{mensaje}</Texto>
            </Tarjeta>
          ) : null}
          <Boton texto="Guardar registro técnico" onPress={guardar} />
        </Tarjeta>
      ) : null}
      <Texto suave>
        La calibración registrada se aplica a nuevas capturas. No cambia mediciones anteriores.
      </Texto>
    </Pantalla>
  );
}
