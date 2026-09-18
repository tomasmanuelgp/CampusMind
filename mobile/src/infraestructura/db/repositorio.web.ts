import type { Captura } from '../../dominio/tipos';
// La vista web sirve para revisar UI; las mediciones reales se guardan en SQLite Android.
export interface Registro { captura: Captura; completa: boolean; resultado: string | null }
const registros = (): Registro[] => JSON.parse(localStorage.getItem('refluye-demo') ?? '[]');
export function guardarAjuste(clave: string, valor: string) { localStorage.setItem('refluye-'+clave, valor); }
export function leerAjuste(clave: string) { return localStorage.getItem('refluye-'+clave); }
export function guardarBorrador(captura: Captura) {
  if (!captura.demo) throw new Error('Las mediciones reales requieren Android.');
  const anteriores = registros();
  if (anteriores.find(r => r.captura.id === captura.id)?.completa) return;
  localStorage.setItem('refluye-demo', JSON.stringify([{captura, completa: false, resultado: null},
    ...anteriores.filter(r => r.captura.id !== captura.id)]));
}
export function completarCaptura(captura: Captura, resultado: unknown) {
  guardarBorrador(captura);
  localStorage.setItem('refluye-demo', JSON.stringify(registros().map(r =>
    r.captura.id === captura.id && !r.completa ? {captura, completa: true, resultado: JSON.stringify(resultado)} : r)));
}
export function listarCapturas() { return registros().slice(0,100); }
export function obtenerCaptura(id: string) { return registros().find(r => r.captura.id === id) ?? null; }
