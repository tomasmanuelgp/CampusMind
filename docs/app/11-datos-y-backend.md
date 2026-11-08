# 11 · Datos, backend y territorio

## Para qué existe el backend

No es para que la app funcione — la app funciona sin él. Existe por tres razones:

1. **Continuidad.** Si el usuario cambia de teléfono, su historial sobrevive.
2. **Territorio.** Mediciones individuales dispersas no dicen nada; agregadas
   sobre un mapa muestran dónde está el problema y desde cuándo.
3. **Ciencia.** Un conjunto de datos georreferenciado y trazable de calidad
   hídrica rural es material para investigación y para modelos predictivos.

El tercero es el que justifica el rigor del esquema. **Datos sin trazabilidad no
sirven para entrenar nada.**

---

## Supabase

| Servicio | Uso |
|---|---|
| **Postgres + PostGIS** | Mediciones, fuentes, análisis espacial |
| **Auth** | Identidad. Anónima por defecto; opcional vincular teléfono |
| **Storage** | Videos de protocolos, ilustraciones, fotos de muestras |
| **Edge Functions** | Proxy de IA (doc 10), agregaciones, exportaciones |
| **Row Level Security** | Aislamiento: cada quien ve lo suyo; lo público es agregado |

---

## Esquema

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Fuentes de agua ────────────────────────────────────────────
CREATE TABLE fuentes (
  id            UUID PRIMARY KEY,          -- generado en el cliente
  usuario_id    UUID REFERENCES auth.users(id),
  nombre        TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN
                  ('rio','quebrada','pozo','aljibe','tanque','nacimiento','lluvia','acueducto')),
  ubicacion     GEOGRAPHY(POINT, 4326),    -- NULL sin consentimiento
  precision_m   REAL,
  municipio     TEXT,
  departamento  TEXT,
  compartir_publico BOOLEAN NOT NULL DEFAULT false,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fuentes_ubicacion ON fuentes USING GIST (ubicacion);

-- ─── Mediciones (inmutables) ────────────────────────────────────
CREATE TABLE mediciones (
  id                UUID PRIMARY KEY,
  fuente_id         UUID NOT NULL REFERENCES fuentes(id),
  usuario_id        UUID REFERENCES auth.users(id),
  medida_en         TIMESTAMPTZ NOT NULL,

  -- Lectura cruda
  ph                REAL,
  turbidez          REAL,
  tds               REAL,
  temperatura       REAL,
  ica_dispositivo   REAL,
  estado_dispositivo SMALLINT,

  -- Observación humana
  origen            TEXT NOT NULL,
  olor              TEXT NOT NULL,
  olor_tipo         TEXT,
  visual            TEXT NOT NULL,
  foto_path         TEXT,

  -- Veredicto (calculado en el cliente, verificable en el servidor)
  veredicto         SMALLINT NOT NULL CHECK (veredicto IN (0,1,2)),
  regla_disparada   TEXT NOT NULL,
  ica_calculado     REAL NOT NULL,
  aptitud           JSONB NOT NULL,
  protocolos        JSONB NOT NULL,

  -- ⚠️ Trazabilidad — sin esto el dataset no es utilizable
  version_motor     TEXT NOT NULL,
  version_firmware  TEXT,
  version_protocolo SMALLINT,
  equipo_serie      TEXT,
  calibrado_en      TIMESTAMPTZ,
  lectura_confiable BOOLEAN NOT NULL DEFAULT true,

  creada_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mediciones_fuente_fecha ON mediciones (fuente_id, medida_en DESC);
CREATE INDEX idx_mediciones_veredicto ON mediciones (veredicto, medida_en DESC);

-- ─── Equipos ────────────────────────────────────────────────────
CREATE TABLE equipos (
  serie             TEXT PRIMARY KEY,
  usuario_id        UUID REFERENCES auth.users(id),
  version_firmware  TEXT,
  calibrado_en      TIMESTAMPTZ,
  ph_slope          REAL,
  ph_offset         REAL,
  notas             TEXT
);

-- ─── Validación contra laboratorio ──────────────────────────────
-- Clave para medir cuánto se puede confiar en el equipo
CREATE TABLE validaciones_laboratorio (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicion_id     UUID NOT NULL REFERENCES mediciones(id),
  laboratorio     TEXT NOT NULL,
  analizada_en    TIMESTAMPTZ NOT NULL,
  ph_lab          REAL,
  turbidez_lab    REAL,
  tds_lab         REAL,
  coliformes_ufc  REAL,       -- lo que el equipo NO puede medir
  e_coli_ufc      REAL,
  observaciones   TEXT
);
```

### Por qué `validaciones_laboratorio` importa tanto

Es la tabla que permite responder la única pregunta que decide si el proyecto es
serio: **¿qué tan bien se corresponden las lecturas del equipo con un análisis
real?** Sin ella, todas las recomendaciones son afirmaciones no verificadas.

Y al registrar coliformes y *E. coli* —que el equipo no mide— se abre la
posibilidad de estudiar si existe correlación entre los parámetros medibles
(turbidez, origen estancada) y la contaminación microbiológica. Si la hay, sería
el hallazgo más valioso del proyecto: un modelo que estime riesgo microbiológico
a partir de sensores baratos.

---

## Row Level Security

```sql
ALTER TABLE mediciones ENABLE ROW LEVEL SECURITY;

-- Cada quien ve lo suyo
CREATE POLICY mediciones_propias ON mediciones
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY mediciones_insertar ON mediciones
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Nadie edita ni borra una medición: son inmutables
-- (sin políticas de UPDATE ni DELETE)
```

**Las mediciones son inmutables.** Esto simplifica la sincronización (sin
conflictos posibles) y es correcto conceptualmente: una medición es un hecho
ocurrido en un momento. Si estuvo mal, se anota, no se reescribe.

---

## Geolocalización: consentimiento y riesgo

La ubicación de una fuente contaminada **no es un dato neutro**. Puede:

- estigmatizar a una vereda o a una comunidad,
- afectar el precio de la tierra,
- exponer a quien reporta un vertimiento industrial,
- usarse en su contra en un conflicto por el agua.

### Política

| Regla | Implementación |
|---|---|
| **Opcional siempre** | La app funciona completa sin ubicación |
| **Consentimiento explícito** | Pantalla que explica para qué sirve y qué riesgos tiene, antes de pedir el permiso |
| **Revocable** | Se puede borrar la ubicación de una fuente en cualquier momento |
| **Precisión reducida en público** | Los datos abiertos se agregan a celdas de ~1 km, nunca en punto exacto |
| **Nunca a la IA** | Las coordenadas no viajan a la capa de IA (doc 10) |
| **Umbral de k-anonimato** | Una celda solo aparece en el mapa público con ≥ 5 mediciones de ≥ 2 usuarios |

```sql
-- Vista pública agregada: nunca expone puntos individuales
CREATE VIEW mapa_publico AS
SELECT
  ST_SnapToGrid(ubicacion::geometry, 0.01)::geography AS celda,  -- ~1 km
  COUNT(*)                          AS n_mediciones,
  COUNT(DISTINCT f.usuario_id)      AS n_usuarios,
  ROUND(AVG(m.ica_calculado)::numeric, 1) AS ica_promedio,
  MODE() WITHIN GROUP (ORDER BY m.veredicto) AS veredicto_tipico,
  MAX(m.medida_en)                  AS ultima_medicion
FROM mediciones m
JOIN fuentes f ON f.id = m.fuente_id
WHERE f.compartir_publico = true
  AND f.ubicacion IS NOT NULL
  AND m.lectura_confiable = true
GROUP BY celda
HAVING COUNT(*) >= 5 AND COUNT(DISTINCT f.usuario_id) >= 2;
```

---

## Análisis que habilita el esquema

### Inmediatos

| Análisis | Consulta |
|---|---|
| Tendencia por fuente | Serie temporal de `ica_calculado` |
| Estacionalidad | ICA agrupado por mes — efecto de las lluvias |
| Fuentes críticas | Fuentes con ≥ 3 mediciones en nivel 2 |
| Degradación | Fuentes cuyo ICA cayó > 20 puntos en 3 meses |
| Cobertura territorial | Municipios sin ninguna medición |
| Fiabilidad de equipos | Dispersión por `equipo_serie` — detecta equipos descalibrados |

### Alerta de degradación

Una fuente que empeora es más accionable que una fuente mala constante:

```sql
CREATE VIEW fuentes_en_degradacion AS
WITH stats AS (
  SELECT fuente_id,
         AVG(ica_calculado) FILTER (WHERE medida_en > now() - interval '30 days')  AS reciente,
         AVG(ica_calculado) FILTER (WHERE medida_en BETWEEN now() - interval '120 days'
                                                        AND now() - interval '30 days') AS previo,
         COUNT(*) AS n
  FROM mediciones
  WHERE lectura_confiable
  GROUP BY fuente_id
)
SELECT * FROM stats
WHERE n >= 4 AND previo IS NOT NULL AND reciente < previo - 15;
```

---

## Camino hacia machine learning

El objetivo declarado del proyecto incluye ML/DL. Esto solo funciona si los datos
se recogen bien desde el principio.

### Requisitos previos (no negociables)

| Requisito | Por qué |
|---|---|
| `equipo_serie` en cada medición | Sin él no se puede separar el error del equipo de la señal del agua |
| `calibrado_en` | Un equipo descalibrado enseña su propio error |
| `version_motor` | Las etiquetas cambian cuando cambian las reglas |
| `lectura_confiable` | Las lecturas sospechosas deben poder excluirse |
| Ubicación (aunque sea aproximada) | Casi todo el análisis interesante es espacial |
| **Validaciones de laboratorio** | Sin verdad de referencia no hay aprendizaje supervisado |

### Preguntas abordables, por orden de madurez

**Fase A — estadística descriptiva (con ~100 mediciones)**
Distribución de parámetros por tipo de fuente. Efecto de la temporada de lluvias
sobre la turbidez. Qué observaciones humanas coocurren con qué parámetros.

**Fase B — modelos supervisados (con ~1.000 mediciones + 50 validaciones de lab)**
El objetivo de mayor valor: **estimar riesgo microbiológico a partir de sensores
fisicoquímicos + contexto**. Variables candidatas: turbidez, origen, temperatura,
temporada, tipo de fuente, precipitación reciente. Etiqueta: coliformes del
laboratorio. Incluso una precisión moderada sería útil, porque hoy la alternativa
es no tener ninguna información.

**Fase C — modelos espaciotemporales (con ~10.000 mediciones)**
Interpolación espacial (kriging) para estimar calidad en puntos no medidos.
Predicción de degradación tras eventos de lluvia. Detección de anomalías que
sugieran vertimientos.

### Advertencia metodológica

**Un modelo entrenado con estos datos nunca debe reemplazar el motor de reglas
para decidir potabilidad.** Puede señalar riesgo, priorizar dónde hacer análisis
de laboratorio o alertar de anomalías. La decisión de seguridad sigue siendo
determinista y explicable. Un falso negativo de un modelo estadístico es agua
contaminada que alguien bebe.

---

## Exportación

| Formato | Para quién |
|---|---|
| **PDF por medición** | El usuario: comprobante para mostrar a un técnico o a la alcaldía |
| **CSV por fuente** | Técnicos y estudiantes |
| **GeoJSON agregado** | Instituciones y SIG |
| **Informe territorial** | Secretarías de Salud, CAR — mediante Edge Function |

El PDF individual importa más de lo que parece: le da a una familia un documento
con el que reclamar ante una autoridad. Ese es un uso político legítimo del
proyecto.

---

## Retención y derechos

| Dato | Retención | Derecho del usuario |
|---|---|---|
| Mediciones | Indefinida (valor científico) | Desvincular de su identidad |
| Ubicación | Hasta que la borre | Borrado inmediato |
| Conversaciones con IA | 90 días | Borrado inmediato |
| Fotos | Hasta que las borre | Borrado inmediato |
| Cuenta | — | Borrado completo; las mediciones quedan anonimizadas |

Al eliminar la cuenta, las mediciones **no se destruyen**: se anonimizan (se
desvincula `usuario_id`). Tiene sentido científico y debe comunicarse con
claridad en el aviso de privacidad, no enterrarse en letra pequeña.
