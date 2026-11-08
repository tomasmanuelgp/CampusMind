// SPDX-License-Identifier: AGPL-3.0-only
import { StyleSheet, Text } from 'react-native';
import type { resumirEnVivo } from '../dominio/resumenEnVivo';
import { Tarjeta, Texto, colores, s } from './componentes';

/** Conclusión preliminar que cambia con cada respuesta y lectura (no se guarda). */
export function TarjetaConclusion({
  resumen,
  demo,
  detallada = false,
}: {
  resumen: ReturnType<typeof resumirEnVivo>;
  demo: boolean;
  detallada?: boolean;
}) {
  return (
    <Tarjeta tono={resumen.tono}>
      <Text style={s.etiqueta}>{demo ? 'PRÁCTICA · CONCLUSIÓN SIMULADA' : '¿PUEDO CONSUMIR ESTA AGUA?'}</Text>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={est.titulo}>
        {resumen.titulo}
      </Text>
      <Texto>{resumen.detalle}</Texto>
      {!resumen.confiable ? (
        <Texto suave>
          Evaluación preliminar no confiable: lectura inicial, datos u observaciones pendientes, o calibración
          sin verificar.
        </Texto>
      ) : null}
      {resumen.uso ? (
        <Texto>
          <Text style={{ fontWeight: '800' }}>{resumen.uso}: </Text>
          {resumen.estadoUso}
        </Texto>
      ) : null}
      {detallada
        ? resumen.pasos.map((paso, i) => (
            <Texto key={paso}>
              {i + 1}. {paso}
            </Texto>
          ))
        : null}
      <Texto suave>{resumen.descargo}</Texto>
    </Tarjeta>
  );
}

export const estilosSeccion = StyleSheet.create({
  titulo: { fontSize: 22, lineHeight: 29, fontWeight: '800', color: colores.tinta },
});
const est = estilosSeccion;
