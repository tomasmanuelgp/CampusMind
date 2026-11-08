// Esquema local de datos (SQLite, user_version = 2).
// Fuente de verdad del diccionario publicado en docs/datos.md: si cambias una
// columna aquí, cambia también ese documento y añade una migración.
//
// Convenciones:
// - Nombres en snake_case con la unidad al final (turbidez_ntu, tds_ppm…).
// - Fechas en UTC: *_utc en texto ISO-8601 y *_ms en milisegundos desde 1970
//   (la hora de los teléfonos se guarda siempre en UTC; se muestra en hora local).
// - Ninguna columna guarda la dirección MAC del equipo ni el nombre de quien
//   calibró: solo una referencia local del equipo y la vigencia de la calibración.
import type {Captura,Lectura,Observacion} from '../../dominio/tipos';
import {RESPONSABLE_REGISTRADO} from '../../dominio/privacidad';

export const VERSION_ESQUEMA = 2;

export const SQL_ESQUEMA = `
CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS medicion (
  id                        TEXT PRIMARY KEY,
  creada_utc                TEXT NOT NULL,
  recibida_utc              TEXT NOT NULL,
  recibida_ms               INTEGER NOT NULL,
  es_demo                   INTEGER NOT NULL CHECK (es_demo IN (0,1)),
  estado                    TEXT NOT NULL CHECK (estado IN ('borrador','finalizada')),
  ph                        REAL,
  turbidez_ntu              REAL,
  tds_ppm                   REAL,
  temperatura_c             REAL,
  ica_equipo                REAL,
  estado_equipo             INTEGER,
  version_protocolo         INTEGER NOT NULL,
  errores_json              TEXT NOT NULL,
  avisos_json               TEXT,
  trama_original            TEXT,
  estabilidad               TEXT CHECK (estabilidad IN ('estable','inicial')),
  fuente_nombre             TEXT NOT NULL,
  equipo_ref                TEXT NOT NULL,
  uso                       TEXT,
  origen                    TEXT,
  olor                      TEXT,
  olor_tipo                 TEXT,
  aspecto                   TEXT,
  calibracion_verificada_ms INTEGER,
  calibracion_vence_ms      INTEGER,
  calibracion_ref           TEXT,
  version_motor             TEXT,
  nivel                     INTEGER CHECK (nivel IN (0,1,2)),
  regla_principal           TEXT,
  reglas_json               TEXT,
  plan                      TEXT,
  ica_app                   REAL,
  confiable                 INTEGER,
  resultado_json            TEXT
);
CREATE INDEX IF NOT EXISTS idx_medicion_recibida ON medicion (recibida_ms DESC);`;

/** Columnas en el orden en que se insertan y se exportan. */
export const COLUMNAS = [
  'id','creada_utc','recibida_utc','recibida_ms','es_demo','estado',
  'ph','turbidez_ntu','tds_ppm','temperatura_c','ica_equipo','estado_equipo','version_protocolo',
  'errores_json','avisos_json','trama_original','estabilidad',
  'fuente_nombre','equipo_ref','uso','origen','olor','olor_tipo','aspecto',
  'calibracion_verificada_ms','calibracion_vence_ms','calibracion_ref',
  'version_motor','nivel','regla_principal','reglas_json','plan','ica_app','confiable','resultado_json',
] as const;
export type Columna = typeof COLUMNAS[number];
export type Fila = Record<Columna, string|number|null>;

/** Lo que guarda el repositorio por cada medición. `resultado` es el JSON del motor tal como se mostró. */
export interface Registro { captura: Captura; completa: boolean; resultado: string | null }

const iso = (ms:number) => new Date(ms).toISOString();
const numero = (v:unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
const texto = (v:unknown) => typeof v === 'string' ? v : null;

/** Convierte una captura (y su resultado, si ya se finalizó) en una fila tipada. */
export function capturaAFila(c:Captura, resultado:unknown, creadaEn:number): Fila {
  const r = (resultado ?? {}) as Record<string,unknown>;
  const reglas = Array.isArray(r.reglas) ? r.reglas : null;
  return {
    id:c.id, creada_utc:iso(creadaEn), recibida_utc:iso(c.lectura.recibidaEn), recibida_ms:c.lectura.recibidaEn,
    es_demo:c.demo?1:0, estado:resultado==null?'borrador':'finalizada',
    ph:c.lectura.ph, turbidez_ntu:c.lectura.turbidez, tds_ppm:c.lectura.tds, temperatura_c:c.lectura.temperatura,
    ica_equipo:c.lectura.icaDispositivo, estado_equipo:c.lectura.estadoDispositivo, version_protocolo:c.lectura.versionProtocolo,
    errores_json:JSON.stringify(c.lectura.errores), avisos_json:c.lectura.avisos?JSON.stringify(c.lectura.avisos):null,
    trama_original:c.lectura.tramaOriginal??null, estabilidad:c.estabilidad??null,
    fuente_nombre:c.fuente, equipo_ref:c.equipo, uso:c.uso??null,
    origen:c.observacion.origen??null, olor:c.observacion.olor??null, olor_tipo:c.observacion.olorTipo??null, aspecto:c.observacion.visual??null,
    calibracion_verificada_ms:c.calibracion?.verificadaEn??null, calibracion_vence_ms:c.calibracion?.venceEn??null,
    calibracion_ref:c.calibracion?.referencia??null,
    version_motor:texto(r.version), nivel:numero(r.nivel), regla_principal:texto(r.reglaId),
    reglas_json:reglas?JSON.stringify(reglas):null, plan:texto(r.plan), ica_app:numero(r.ica),
    confiable:typeof r.confiable==='boolean'?Number(r.confiable):null,
    resultado_json:resultado==null?null:JSON.stringify(resultado),
  };
}

/** Reconstruye la captura que usa la app a partir de una fila. */
export function filaARegistro(f:Fila): Registro {
  const lectura:Lectura = {
    ph:f.ph as number|null, turbidez:f.turbidez_ntu as number|null, tds:f.tds_ppm as number|null,
    temperatura:f.temperatura_c as number|null, icaDispositivo:f.ica_equipo as number|null,
    estadoDispositivo:f.estado_equipo as number|null, versionProtocolo:f.version_protocolo as number,
    recibidaEn:f.recibida_ms as number, errores:JSON.parse(f.errores_json as string),
  };
  if (f.avisos_json!=null) lectura.avisos=JSON.parse(f.avisos_json as string);
  if (f.trama_original!=null) lectura.tramaOriginal=f.trama_original as string;
  const observacion:Partial<Observacion> = {};
  if (f.origen!=null) observacion.origen=f.origen as Observacion['origen'];
  if (f.olor!=null) observacion.olor=f.olor as Observacion['olor'];
  if (f.olor_tipo!=null) observacion.olorTipo=f.olor_tipo as Observacion['olorTipo'];
  if (f.aspecto!=null) observacion.visual=f.aspecto as Observacion['visual'];
  const captura:Captura = {
    id:f.id as string, fuente:f.fuente_nombre as string, equipo:f.equipo_ref as string, demo:f.es_demo===1,
    lectura, observacion,
    calibracion:f.calibracion_verificada_ms==null?null:{verificadaEn:f.calibracion_verificada_ms as number,
      venceEn:f.calibracion_vence_ms as number, referencia:(f.calibracion_ref as string|null)??'', responsable:RESPONSABLE_REGISTRADO},
  };
  if (f.uso!=null) captura.uso=f.uso as Captura['uso'];
  if (f.estabilidad!=null) captura.estabilidad=f.estabilidad as Captura['estabilidad'];
  return {captura, completa:f.estado==='finalizada', resultado:f.resultado_json as string|null};
}

/** Exporta registros a CSV (RFC 4180, separador coma, UTF-8). Omite el JSON interno del resultado. */
export function registrosACsv(filas:Fila[]): string {
  const columnas = COLUMNAS.filter(c=>c!=='resultado_json');
  const celda = (v:string|number|null) => {
    if (v==null) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  return [columnas.join(','), ...filas.map(f=>columnas.map(c=>celda(f[c])).join(','))].join('\r\n') + '\r\n';
}
