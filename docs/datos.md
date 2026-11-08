# Datos: qué se guarda, dónde y cómo

Esta guía describe todos los datos que maneja RE-FLUYE y el diccionario de la
base de datos del teléfono. La fuente de verdad del esquema es
[`mobile/src/infraestructura/db/esquema.ts`](../mobile/src/infraestructura/db/esquema.ts):
si cambias una columna allí, cambia también este documento.

## Principios

1. **Todo se queda en el teléfono.** La app no envía mediciones a internet.
   Solo salen si la persona pulsa «Compartir resultado» o «Exportar».
2. **Lo mínimo necesario.** No se guarda ubicación, nombre ni teléfono de quien
   mide. Cada medición no guarda la dirección Bluetooth del equipo ni el nombre
   de quien calibró.
3. **La persona manda sobre sus datos.** Puede verlos, exportarlos y borrarlos
   desde «Mis mediciones» (Ley 1581 de 2012, artículo 8).

## Inventario

| Dato | Ejemplo | ¿Dato personal? | Dónde se guarda |
|---|---|---|---|
| Lecturas de los sensores | pH 7,41 · 12 NTU · 145 ppm · 24,5 °C | No | Tabla `medicion` |
| Trama original del equipo | `VER:1` … `---` | No | Tabla `medicion` |
| Nombre de la fuente | «Quebrada de la finca» | Puede serlo si se escribe un nombre de persona. La app pide usar el nombre del lugar | Tabla `medicion` |
| Uso y observaciones | Beber · agua que corre · sin olor · clara | No | Tabla `medicion` |
| Resultado del motor | Nivel 0 · R15 · hervido | No | Tabla `medicion` |
| Referencia del equipo | `equipo-3f2a…` | No: identificador aleatorio local, no la MAC | Tabla `medicion` |
| Dirección Bluetooth (MAC) del equipo | `AA:BB:CC:…` | Identificador de dispositivo | Solo en `ajustes`, para reconectar |
| Nombre de quien calibró | «Técnica de la CAR» | **Sí** | Solo en `ajustes` («Mi equipo»), nunca en las mediciones |
| Ubicación | — | — | **No se recoge** |

En la versión web (solo DEMO) los datos simulados se guardan en el
`localStorage` del navegador.

## Diccionario de la tabla `medicion`

Convenciones: nombres en `snake_case`, **la unidad al final del nombre**, fechas
en **UTC** (`*_utc` en texto ISO-8601, `*_ms` en milisegundos desde 1970).

### Identidad y tiempo

| Columna | Tipo | Unidad / valores | Descripción |
|---|---|---|---|
| `id` | TEXT | UUID v4 | Identificador de la medición |
| `creada_utc` | TEXT | ISO-8601 UTC | Cuándo se guardó por primera vez |
| `recibida_utc` | TEXT | ISO-8601 UTC | Cuándo llegó la trama del equipo |
| `recibida_ms` | INTEGER | ms desde 1970 (UTC) | Lo mismo, para ordenar |
| `es_demo` | INTEGER | 0 / 1 | 1 si son datos simulados |
| `estado` | TEXT | `borrador` · `finalizada` | Una medición finalizada ya no se puede modificar |

### Lectura del equipo

| Columna | Tipo | Unidad / rango | Descripción |
|---|---|---|---|
| `ph` | REAL | 0 – 14 (adimensional) | Acidez o alcalinidad |
| `turbidez_ntu` | REAL | NTU, 0 – 200 | Partículas en suspensión |
| `tds_ppm` | REAL | ppm (mg/L), 0 – 2000 | Sólidos disueltos. Validado por el fabricante solo hasta 1000: por encima, el resultado es no confiable (regla R17) |
| `temperatura_c` | REAL | °C, −55 – 125 | `NULL` si la sonda no respondió (−127 en la trama) |
| `ica_equipo` | REAL | 0 – 100 | ICA calculado por el firmware. Solo informativo |
| `estado_equipo` | INTEGER | 0 · 1 · 2 | Preclasificación del firmware. **No es un veredicto** |
| `version_protocolo` | INTEGER | 0 = sin `VER`, 1 = actual | Versión del [protocolo Bluetooth](protocolo-bluetooth.md) |
| `errores_json` | TEXT | JSON, lista de textos | Problemas que impiden analizar |
| `avisos_json` | TEXT | JSON, lista de textos | Avisos que no impiden analizar |
| `trama_original` | TEXT | texto | Trama tal como llegó, para diagnóstico |
| `estabilidad` | TEXT | `estable` · `inicial` | Si las últimas 4 lecturas variaron poco |

### Contexto que aporta la persona

| Columna | Tipo | Valores | Descripción |
|---|---|---|---|
| `fuente_nombre` | TEXT | hasta 80 caracteres | Nombre del lugar de la fuente |
| `equipo_ref` | TEXT | `equipo-<uuid>` · `DEMO` | Referencia local del equipo |
| `uso` | TEXT | `beber` · `cocinar` · `banarse` · `utensilios` · `ropa` · `ganado` · `cultivo` | Para qué se quiere el agua |
| `origen` | TEXT | `corriente` · `estancada` · `no_se` | ¿El agua corre o está quieta? |
| `olor` | TEXT | `normal` · `raro` · `no_se` | ¿Huele raro? |
| `olor_tipo` | TEXT | `azufre` · `combustible` · `podrido` · `quimico` · `cloro` · `otro` | Solo si `olor = raro` |
| `aspecto` | TEXT | `limpia` · `turbia` · `verdosa` · `aceitosa` · `no_se` | ¿Cómo se ve? |
| `calibracion_verificada_ms` | INTEGER | ms UTC | Fecha de la calibración declarada |
| `calibracion_vence_ms` | INTEGER | ms UTC | Vencimiento de la calibración |
| `calibracion_ref` | TEXT | texto | Referencia del registro técnico (sin nombre de persona) |

### Resultado del motor

| Columna | Tipo | Valores | Descripción |
|---|---|---|---|
| `version_motor` | TEXT | p. ej. `0.4.0` | Versión del [motor de reglas](motor-de-reglas.md) que decidió |
| `nivel` | INTEGER | 0 · 1 · 2 | 2 = veto, 1 = advertencia, 0 = sin alertas |
| `regla_principal` | TEXT | `R01` … `R17` | Motivo principal |
| `reglas_json` | TEXT | JSON, lista | Todas las reglas que se cumplieron |
| `plan` | TEXT | `alternativa` · `repetir` · `hervido` | Qué se recomendó |
| `ica_app` | REAL | 0 – 100 | ICA calculado por la app |
| `confiable` | INTEGER | 0 / 1 | Si datos, calibración y estabilidad estaban verificados |
| `resultado_json` | TEXT | JSON | El resultado completo tal como se mostró. No se exporta |

### Tabla `ajustes`

Pares `clave` → `valor` (texto o JSON):

| Clave | Contenido |
|---|---|
| `equipo` | Último equipo conectado: `{id: MAC, nombre}` |
| `equipo-ref:<MAC>` | Referencia aleatoria del equipo usada en las mediciones |
| `calibracion:<MAC>` | Calibración declarada: fechas, responsable y referencia |
| `progreso:<id>` | Paso del protocolo de tratamiento y fin del temporizador |

## Versiones del esquema y migración

| `user_version` | App | Forma |
|---|---|---|
| 1 | 0.1.0 – 0.3.2 | Tabla `capturas`: toda la medición en un JSON |
| 2 | desde 0.3.3 | Tabla `medicion` con una columna por dato (este documento) |

Al abrir la app, la migración 1 → 2 copia cada medición a columnas, quita el
nombre del responsable y la MAC, y borra la tabla antigua, **todo en una sola
transacción**: si algo falla, nada cambia. Está probada con una base v1 real en
[`migracion.test.ts`](../mobile/src/infraestructura/db/migracion.test.ts).

## Exportación CSV

«Mis mediciones → Exportar mediciones (CSV)» comparte un archivo de texto con
todas las columnas de `medicion` excepto `resultado_json`, separado por comas,
en UTF-8 y con el formato RFC 4180. Sirve para abrirlo en una hoja de cálculo o
para entregárselo a un técnico.

## Cuando exista un servidor

El diseño del backend opcional ([app/11-datos-y-backend.md](app/11-datos-y-backend.md))
deberá cumplir, como mínimo:

- **Consentimiento** explícito, previo e informado antes de enviar cualquier
  medición, separado del consentimiento de ubicación (S8), y revocable.
- **Ubicación redondeada en el teléfono** antes de enviarse (por vereda o una
  celda de unos 1,1 km), nunca la coordenada exacta. En mapas públicos, solo
  agregados de al menos 5 mediciones por celda.
- **RLS** en todas las tablas: nadie puede leer, editar ni borrar datos de otra
  persona. En la app solo va la clave pública (`anon`); nunca la `service_role`.
- **Nada de MAC ni nombres** en el servidor: solo `equipo_ref`.
