import type { Lectura } from '../../dominio/tipos';

/** Una sola trama íntegra y reciente basta para orientar, aunque aún varíe. */
export function lecturaRecienteValida(lecturas: Lectura[], ahora: number): Lectura | null {
  const ultima = lecturas.at(-1);
  if (!ultima || ahora < ultima.recibidaEn || ahora - ultima.recibidaEn >= 5000) return null;
  if (ultima.errores.length || ultima.versionProtocolo > 1) return null;
  if (ultima.ph === null || ultima.turbidez === null || ultima.tds === null) return null;
  return ultima;
}

export function esEstable(lecturas: Lectura[], ahora: number): boolean {
  const ventana = lecturas.slice(-4);
  if (ventana.length !== 4) return false;
  if (ahora - ventana[3].recibidaEn >= 5000 || ahora < ventana[3].recibidaEn) return false;
  if (ventana.some(l => l.ph === null || l.tds === null || l.turbidez === null || l.errores.length > 0)) return false;
  // Evita capturar una ráfaga almacenada o mediciones separadas por un corte.
  for (let i=1;i<4;i++) {
    const intervalo = ventana[i].recibidaEn-ventana[i-1].recibidaEn;
    if (intervalo < 750 || intervalo >= 5000) return false;
  }
  const ph = ventana.map(l => l.ph as number), tds = ventana.map(l => l.tds as number);
  const media = tds.reduce((a,b) => a+b,0)/4;
  return Math.max(...ph)-Math.min(...ph) <= 0.05+1e-9 &&
    (media === 0 ? tds.every(v => v === 0) : (Math.max(...tds)-Math.min(...tds))/media <= 0.05+1e-9);
}
