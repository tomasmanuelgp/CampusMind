export type Origen = 'corriente' | 'estancada' | 'no_se';
export type Olor = 'normal' | 'raro' | 'no_se';
export type OlorTipo = 'azufre' | 'combustible' | 'podrido' | 'quimico' | 'cloro' | 'otro';
export type Visual = 'limpia' | 'verdosa' | 'aceitosa' | 'turbia' | 'no_se';
export type Uso = 'beber' | 'cocinar' | 'banarse' | 'utensilios' | 'ropa' | 'ganado' | 'cultivo';
export interface Observacion { origen: Origen; olor: Olor; olorTipo?: OlorTipo; visual: Visual }
export interface Lectura {
  ph: number | null; turbidez: number | null; tds: number | null; temperatura: number | null;
  icaDispositivo: number | null; estadoDispositivo: number | null;
  versionProtocolo: number; recibidaEn: number; errores: string[];
  avisos?: string[]; tramaOriginal?: string;
}
export interface Calibracion { verificadaEn: number; venceEn: number; responsable: string; referencia: string }
export interface Captura {
  id: string; fuente: string; equipo: string; demo: boolean; uso?: Uso; lectura: Lectura;
  calibracion: Calibracion | null; observacion: Partial<Observacion>;
  estabilidad?: 'estable' | 'inicial';
}
