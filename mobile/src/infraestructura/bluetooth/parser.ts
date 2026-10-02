import type { Lectura } from '../../dominio/tipos';

const rangos: Record<string, [number, number]> = {
  pH: [0,14], TURB: [0,200], TDS: [0,2000], TEMP: [-55,125], ICA: [0,100], ESTADO: [0,2], VER: [0,999],
};
export function leerTrama(texto: string, recibidaEn: number): Lectura | null {
  const campos: Record<string, number | null> = {};
  const errores: string[] = [];
  const avisos: string[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const separador = linea.indexOf(':');
    if (separador < 0) continue;
    const clave = linea.slice(0,separador).trim();
    if (!Object.hasOwn(rangos,clave)) continue;
    const auxiliar = clave === 'ESTADO' || clave === 'ICA';
    const problemas = auxiliar ? avisos : errores;
    if (Object.hasOwn(campos,clave)) { campos[clave] = null; problemas.push(`Campo repetido: ${clave}`); continue; }
    const valor = linea.slice(separador+1).trim();
    const numero = /^-?\d+(\.\d+)?$/.test(valor) ? Number(valor) : NaN;
    campos[clave] = Number.isFinite(numero) ? numero : null;
    if (clave === 'TEMP' && numero === -127) { campos[clave] = null; continue; }
    const [min,max] = rangos[clave];
    if (!Number.isFinite(numero) || numero < min || numero > max ||
      (['ESTADO','VER'].includes(clave) && !Number.isInteger(numero))) {
      if (auxiliar) campos[clave] = null;
      problemas.push(clave === 'ESTADO' ? 'El estado del equipo usa un formato antiguo; se analizan los sensores.' : `Revisa el dato ${clave}`);
    }
  }
  if (!['pH','TDS','TURB'].some(clave => Object.hasOwn(campos,clave))) return null;
  for (const clave of ['pH','TDS','TURB']) if (campos[clave] == null) errores.push(`Falta ${clave}`);
  return { ph: campos.pH ?? null, tds: campos.TDS ?? null, turbidez: campos.TURB ?? null,
    temperatura: campos.TEMP ?? null, icaDispositivo: campos.ICA ?? null, estadoDispositivo: campos.ESTADO ?? null,
    versionProtocolo: Object.hasOwn(campos,'VER') ? campos.VER ?? 999 : 0,
    recibidaEn, errores, avisos, tramaOriginal: texto.trim() };
}

/** El marcador debe ocupar una línea. Tras desbordar, descartar hasta el siguiente cierre. */
export class ParserTramas {
  private linea = '';
  private trama = '';
  private descartando = false;
  reiniciar() { this.linea=''; this.trama=''; this.descartando=false; }
  recibir(fragmento: string, ahora: number): Lectura[] {
    const salida: Lectura[] = [];
    for (const caracter of fragmento) {
      if (caracter === '\n') {
        if (this.linea.trim() === '---') {
          if (!this.descartando) {
            const lectura = leerTrama(this.trama, ahora);
            if (lectura) salida.push(lectura);
          }
          this.trama=''; this.descartando=false;
        } else if (!this.descartando) this.trama += this.linea+'\n';
        this.linea='';
      } else {
        this.linea += caracter;
        if (this.linea.length + this.trama.length > 4096) {
          this.trama=''; this.linea=''; this.descartando=true;
        }
      }
    }
    return salida;
  }
}
