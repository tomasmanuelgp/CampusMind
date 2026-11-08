// SPDX-License-Identifier: AGPL-3.0-only
// Tokens de diseño de RE-FLUYE. Pensados para leerse con sol directo: contraste
// alto (texto ≥ 7:1 sobre fondo), tipografía grande y zonas táctiles ≥ 64 px.
import type { Tono } from '../dominio/presentacion';

export const colores = {
  // Marca
  azul: '#1A5276',
  marino: '#0E3550',
  agua: '#2E86C1',
  aqua: '#17A398',
  cielo: '#E8F3FA',
  // Neutros
  fondo: '#F2F6F9',
  tarjeta: '#FFFFFF',
  tinta: '#13212C',
  suave: '#45576A',
  borde: '#D2DEE7',
  deshabilitado: '#5D6D7A',
  // Tonos de apoyo para tarjetas
  verde: '#E6F5EC',
  ambar: '#FFF3DC',
  rojo: '#FDE9E7',
  lima: '#EEF7E4',
} as const;

/** Colores del semáforo: fondo suave, color fuerte y texto sobre color fuerte. */
export const semaforoColores: Record<Tono, { fondo: string; fuerte: string; texto: string }> = {
  verde: { fondo: '#E3F4E8', fuerte: '#1B7A3E', texto: '#FFFFFF' },
  ambar: { fondo: '#FFF1D6', fuerte: '#8A5300', texto: '#FFFFFF' },
  rojo: { fondo: '#FDE6E4', fuerte: '#B3261E', texto: '#FFFFFF' },
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radio = { s: 10, m: 14, l: 20, xl: 28, total: 999 } as const;

export const tipo = {
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '900' as const, letterSpacing: -0.8 },
  titulo: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  seccion: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
  cuerpo: { fontSize: 18, lineHeight: 27 },
  pequeno: { fontSize: 15, lineHeight: 21 },
  etiqueta: { fontSize: 14, lineHeight: 18, fontWeight: '800' as const, letterSpacing: 1 },
  numero: { fontVariant: ['tabular-nums' as const] },
};

export const sombra = {
  shadowColor: '#0E3550',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
