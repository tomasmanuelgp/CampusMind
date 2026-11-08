// SPDX-License-Identifier: AGPL-3.0-only
import type { Captura } from '../../dominio/tipos';
import { capturaAFila, registrosACsv, type Registro } from './esquema';

// La vista web sirve para revisar la interfaz con datos DEMO; las mediciones
// reales se guardan en SQLite en la APK Android.
export type { Registro } from './esquema';

const CLAVE = 'refluye-demo';
const registros = (): Registro[] => JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
const guardar = (lista: Registro[]) => localStorage.setItem(CLAVE, JSON.stringify(lista));

export function referenciaEquipo(mac: string) {
  return mac === 'DEMO' ? 'DEMO' : 'equipo-web';
}
export function guardarAjuste(clave: string, valor: string) {
  localStorage.setItem('refluye-' + clave, valor);
}
export function leerAjuste(clave: string) {
  return localStorage.getItem('refluye-' + clave);
}
export function guardarBorrador(captura: Captura) {
  if (!captura.demo) throw new Error('Las mediciones reales requieren Android.');
  const anteriores = registros();
  if (anteriores.find(r => r.captura.id === captura.id)?.completa) return;
  guardar([
    { captura, completa: false, resultado: null },
    ...anteriores.filter(r => r.captura.id !== captura.id),
  ]);
}
export function completarCaptura(captura: Captura, resultado: unknown) {
  guardarBorrador(captura);
  guardar(
    registros().map(r =>
      r.captura.id === captura.id && !r.completa
        ? { captura, completa: true, resultado: JSON.stringify(resultado) }
        : r,
    ),
  );
}
export function listarCapturas(limite = 100, desde = 0) {
  return registros().slice(desde, desde + limite);
}
export function contarCapturas() {
  return registros().length;
}
export function obtenerCaptura(id: string) {
  return registros().find(r => r.captura.id === id) ?? null;
}
export function borrarCaptura(id: string) {
  guardar(registros().filter(r => r.captura.id !== id));
}
export function borrarTodo() {
  guardar([]);
}
export function exportarCsv() {
  return registrosACsv(
    registros().map(r =>
      capturaAFila(r.captura, r.resultado ? JSON.parse(r.resultado) : null, r.captura.lectura.recibidaEn),
    ),
  );
}
