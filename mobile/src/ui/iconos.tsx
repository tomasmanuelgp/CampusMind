// SPDX-License-Identifier: AGPL-3.0-only
// Iconos propios en SVG (trazo de 2 px, cuadrícula de 24). Sin dependencias
// nativas nuevas: funcionan igual en Android y en la vista web DEMO.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const trazos = {
  inicio: ['M3 10.5 12 3l9 7.5', 'M5 9v12h5v-6h4v6h5V9'],
  gota: ['M12 2.8c-3 4.4-7 8.3-7 12.2a7 7 0 0 0 14 0c0-3.9-4-7.8-7-12.2Z'],
  historial: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v4h4', 'M12 7.5V12l3 2'],
  libro: [
    'M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5Z',
    'M4 19.5A1.5 1.5 0 0 0 5.5 21H20',
    'M8 7h8',
  ],
  bluetooth: ['M7 7l10 10-5 4V3l5 4L7 17'],
  alerta: ['M12 3 2 20.5h20Z', 'M12 9.5v5', 'M12 17.5v.01'],
  alto: ['M8.2 2h7.6L22 8.2v7.6L15.8 22H8.2L2 15.8V8.2Z', 'M9 9l6 6', 'M15 9l-6 6'],
  repetir: [
    'M4 12a8 8 0 0 1 13.7-5.6L20 8.5',
    'M20 4v4.5h-4.5',
    'M20 12a8 8 0 0 1-13.7 5.6L4 15.5',
    'M4 20v-4.5h4.5',
  ],
  tratar: ['M12 3c.8 3 5 5.4 5 10a5 5 0 0 1-10 0c0-2.2 1-3.7 2.2-4.8.2 2 1.1 3.1 2.3 3.3-.3-3 .4-5.7.5-8.5Z'],
  compartir: ['M12 15V3', 'M7.5 7.5 12 3l4.5 4.5', 'M5 12v8h14v-8'],
  altavoz: ['M4 9.5v5h4l5 4.5v-14l-5 4.5Z', 'M16.5 8.5a5 5 0 0 1 0 7', 'M19 6a8.5 8.5 0 0 1 0 12'],
  detener: ['M7 7h10v10H7Z'],
  papelera: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 14h10l1-14', 'M10 11v6', 'M14 11v6'],
  ajustes: ['M4 6h9', 'M17 6h3', 'M4 12h3', 'M11 12h9', 'M4 18h11', 'M19 18h1'],
  escudo: ['M12 3l8 3v6c0 5-3.4 8.2-8 9.2C7.4 20.2 4 17 4 12V6Z', 'M9 12l2 2 4-4'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  flecha: ['M5 12h14', 'M13 6l6 6-6 6'],
  atras: ['M19 12H5', 'M11 6l-6 6 6 6'],
  mas: ['M12 5v14', 'M5 12h14'],
  ojo: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z'],
  olor: ['M3 8h10a3 3 0 1 0-3-3', 'M3 16h13a3 3 0 1 1-3 3', 'M3 12h17'],
  ola: ['M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  descargar: ['M12 3v12', 'M7.5 10.5 12 15l4.5-4.5', 'M5 20h14'],
  reloj: ['M12 7v5l3 2'],
  info: ['M12 11v6', 'M12 7.5v.01'],
  buscar: ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', 'M15.5 15.5 21 21'],
} as const;

export type NombreIcono = keyof typeof trazos;

/** Icono decorativo: el texto que lo acompaña es el que lee el lector de pantalla. */
export function Icono({
  nombre,
  tamano = 24,
  color = 'currentColor',
  grosor = 2,
}: {
  nombre: NombreIcono;
  tamano?: number;
  color?: string;
  grosor?: number;
}) {
  const conCirculo = nombre === 'ojo' || nombre === 'reloj' || nombre === 'info';
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
      {nombre === 'reloj' || nombre === 'info' ? (
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={grosor} />
      ) : null}
      {trazos[nombre].map(d => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {conCirculo && nombre === 'ojo' ? (
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={grosor} />
      ) : null}
      {nombre === 'detener' ? <Rect x={7} y={7} width={10} height={10} rx={1.5} fill={color} /> : null}
    </Svg>
  );
}
