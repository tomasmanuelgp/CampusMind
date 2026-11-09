# Auditoría para publicación open source · RE-FLUYE

**Fecha:** 2026-11-08 · **Rama auditada:** `claude/wizardly-goodall-ofuz8p` (commit `3dad58c`, app 0.3.2)
**Alcance:** todo el repositorio (hoy `Refluye`) y su historial completo (9 commits).
**Fase:** 1 — solo lectura. No se modificó código.

---

## 0. Resumen ejecutivo

| Severidad | Cantidad | Lo más importante |
|---|---|---|
| **Crítico** | 1 | La licencia heredada (CC BY-NC-SA 4.0) **no permite** publicar como AGPL-3.0 sin permiso del autor original |
| **Alto** | 6 | Backend Supabase/IA **no existe** (no se puede auditar RLS ni la Edge Function); el firmware muestra «EXCELENTE» con LED verde; APK firmada con clave de desarrollo; 23 vulnerabilidades npm; calibración autodeclarada; cifras de pruebas contradictorias |
| **Medio** | 10 | Datos personales locales sin derechos ARCO, esquema SQLite como blob JSON, cobertura del dominio incompleta, `VER:0` tratado como confiable, librería Bluetooth solo en RC, faltan archivos de comunidad y CI |
| **Bajo** | 11 | Duplicaciones menores, estilo de código denso, documentación desactualizada |

**Lo que está bien (verificado):**

- **Sin secretos.** gitleaks 8.21.2 sobre el historial completo (`--all`, 9 commits, clon no superficial) y sobre el árbol de trabajo: **0 hallazgos**. Búsqueda manual de `service_role`, `anon key`, `SUPABASE_`, `ANTHROPIC`, `sk-ant`, `token`, `password`: solo aparecen en documentación de diseño. No hay `.env` versionado ni lo hubo (`git log --all --diff-filter=D` vacío). `.gitignore` excluye `.env*` y conserva `.env.example`.
- **Cero llamadas de red en la app.** No hay `fetch`, `XMLHttpRequest`, `axios` ni URLs en `mobile/src`. La ruta crítica es offline de verdad.
- **S1 cumplida en la app:** ninguna pantalla dice «potable», «apta» o «segura». La única aparición de «potable» es negativa («No indica si el agua es potable», `mobile/src/app/medir.tsx:78`).
- **S3, S4, S5, S6 cumplidas:** el motor determinista (`mobile/src/dominio/motor.ts`) decide; `R02` (olor raro) siempre es nivel 2 y nada lo anula; agua verdosa activa `R07`/`R06` ⇒ plan `alternativa`, nunca solo «hervir»; el descargo aparece en Medir, Resultado, Protocolo e Historial.
- **TypeScript estricto:** `tsc --noEmit` sin errores.
- **Android:** `allowBackup: false`; permisos de micrófono, fotos y almacenamiento bloqueados; `ACCESS_FINE_LOCATION` limitado a API ≤ 30 y `BLUETOOTH_SCAN` con `neverForLocation` (`mobile/plugins/with-permisos-campo.js:13-15`). La app no lee coordenadas.
- **Documentos binarios limpios:** los tres `.docx` tienen `creator=python-docx`, sin imágenes incrustadas; el PDF no contiene imágenes. No hay fotos de personas ni de menores en el repositorio.

---

## 1. Seguridad y secretos

### C1 · CRÍTICO — La licencia heredada impide relicenciar a AGPL-3.0

- `refluye/contexto/01-proyecto.md:126-130`: el proyecto original de Alfredo Antonio Díaz Claros (CCD-UNAB, [adiacla/refluye](https://github.com/adiacla/refluye)) se declara **CC BY-NC-SA 4.0**, y «el trabajo derivado debe [...] conservar la misma licencia».
- `refluye/manuales/03-manual-tecnico.md:148` y `README.md:96-101` reconocen que la licencia está sin resolver.
- `mobile/LICENSE` es la licencia **MIT de la plantilla de Expo** (`Copyright 650 Industries`). No describe este proyecto.
- No hay `LICENSE` en la raíz.

**Por qué es crítico:**

- **NC (no comercial)** es incompatible con AGPL-3.0, que permite el uso comercial.
- **SA (compartir igual)** obliga a usar la misma licencia en las obras derivadas.

Lo derivado del original (firmware V2.2, lógica del ICA, textos y contexto de `refluye/`) **no puede** publicarse bajo AGPL-3.0 sin **autorización escrita** del autor y, posiblemente, de la UNAB como titular institucional. El código de `mobile/` escrito desde cero podría licenciarse por separado, pero el ICA (`motor.ts:11-14`) reproduce la fórmula del firmware original.

**Acción:** obtener permiso escrito antes de cualquier publicación. Es una decisión irreversible: una vez publicado bajo AGPL no se puede retirar. **Ver la pregunta P1 al final.**

### A1 · ALTO — Supabase, RLS y Edge Function no existen en el repositorio

No hay carpeta `supabase/`, migraciones, políticas RLS, Edge Functions ni dependencia `@supabase/supabase-js` en `mobile/package.json`. Solo hay **diseño** en `refluye/app/11-datos-y-backend.md` (esquema en la línea 30, RLS en la 134) y `refluye/app/10-capa-ia.md` (función `asistente` en la línea 64).

Consecuencias:

- **No se pudo verificar** que la `service_role` key no esté en la app, ni revisar RLS, rate limit ni validación de entradas. Hoy no hay ninguna clave porque no hay backend.
- El brief («Supabase con una Edge Function para la capa de IA») describe un estado que **todavía no existe**. El README no debe presentarlo como implementado.

**Requisitos para cuando se implemente** (para el PLAN):

1. El cliente usa solo la clave `anon`/publishable, leída de `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, y documentada en `.env.example`.
2. RLS activado en **todas** las tablas, con políticas `auth.uid() = usuario_id` para `select/insert/update/delete`. Sin políticas `using (true)`. Las vistas agregadas se exponen como `security_invoker` o `security definer` revisadas.
3. Edge Function `asistente`:
   - exige JWT válido;
   - valida el cuerpo con un esquema (por ejemplo zod ≥ 4.6.6);
   - limita el tamaño del cuerpo;
   - aplica límite por usuario (tabla de cuotas o KV);
   - lee `ANTHROPIC_API_KEY` solo con `Deno.env`;
   - nunca devuelve errores del proveedor ni la clave;
   - recibe el `Resultado` ya calculado por el motor (S3) y no le permite cambiar `nivel` ni `plan`.
4. Prueba automática de RLS: un usuario B no puede leer, editar ni borrar filas de A.

### A2 · ALTO — El firmware muestra «EXCELENTE» y enciende el LED verde solo con sensores

`firmware/refluye_v2/refluye_v2.ino:153-159` y `:193`: si `ica >= 75`, la pantalla LCD muestra `EXCELENTE` y se enciende el LED verde; si no, `NO APTA` o `CONDICION`.

Esto contradice el espíritu de **S1/S2**. Una familia que mira el equipo, sin la app, recibe una señal verde de «excelente» sin desinfección ni observaciones (S4/S5). El firmware no conoce el olor ni el color del agua. El protocolo (`refluye/contexto/03-protocolo-bluetooth.md:120`) ya dice que el `ESTADO` del equipo «no debe mostrarse como veredicto».

**Acción:**

- Cambiar los textos del LCD a valores neutros (`ICA 82 · USE APP`, por ejemplo) y no usar el LED verde como señal de consumo.
- No cambia el protocolo; `ESTADO` puede seguir enviándose.

### A3 · ALTO — APK pública firmada con clave de desarrollo

`mobile/scripts/compilar-apk.ps1:45` ejecuta `assembleRelease` tras `expo prebuild` sin configurar ningún keystore de publicación. Expo firma entonces con la **clave debug**, que es pública. `README.md:24` lo confirma: «firma de desarrollo».

Riesgo: cualquiera puede firmar una APK con el mismo `package` (`co.refluye.campo`) y la misma firma, e instalarla **encima** de la legítima. Esa APK tendría acceso al historial SQLite y podría mostrar veredictos falsos.

**Acción:**

- Crear un keystore de publicación custodiado fuera del repositorio. `*.jks` y `*.keystore` ya están en el `.gitignore` de mobile; falta `*.keystore`.
- Documentar en `SECURITY.md` la huella SHA-256 oficial del certificado.
- Publicar desde CI con secretos.

### A4 · ALTO — `npm audit`: 23 vulnerabilidades (1 crítica, 9 altas, 12 moderadas, 1 baja)

Ejecutado en `mobile/` con Node 22.23.4 y npm 10.9.9.

| Paquete | Severidad | Llega por | ¿Va en la APK? | Arreglo |
|---|---|---|---|---|
| `shell-quote` 1.10.0 | Crítica | `react-native` → `react-devtools-core` | No (herramienta de desarrollo) | `npm audit fix` |
| `query-string` 7.1.3 / `decode-uri-component` | Alta (DoS al decodificar URI) | `expo-router` 57.0.21 | **Sí** (enlaces `refluye://`) | Requiere `expo-router` 58 (mayor) |
| `node-forge` ≤ 1.4.0 | Alta | `@expo/cli` | No | `npm audit fix` |
| `vite` 8.3.0-8.3.2, `@vitest/mocker` | Alta/moderada | `vitest` 5.0.0 | No | `vitest` 5.1.0 |
| `zod` < 4.6.6, `brace-expansion`, `source-map-js` | Alta | `@expo/cli`, metro | No | `npm audit fix` |
| `glob`, `minimatch`, `uuid`, `xcode`, `deepmerge` | Moderada/baja | `@expo/config*` | No | `npm audit fix` / Expo 57.0.32 |

**Plan:**

1. `npm audit fix` sin `--force`, que no rompe nada, y actualización a `expo` 57.0.32.
2. Evaluar la migración a Expo SDK 58 en un PR aparte para `expo-router`.
3. Volver a pasar las 69 pruebas tras cada paso.

**Dependencias con riesgo de abandono:** `react-native-bluetooth-classic` solo publica candidatas (`1.73.0-rc.17`, última del 2025-11-19, hace casi un año; `latest` es una RC). Es el único puente con el hardware (ver M4).

### A5 · ALTO — La calibración es autodeclarada y abre la puerta a «confiable»

`mobile/src/app/equipo.tsx:21-25`: cualquier persona puede escribir un responsable y una referencia de texto libre con fechas válidas. Con eso, `calibracionVigente()` (`motor.ts:15-18`) devuelve `true` y el resultado pasa a «confiable». S7 depende de que el dato sea honesto. No hay evidencia, firma ni vínculo con un `CALIB` del equipo (previsto para `VER:2`, `03-protocolo-bluetooth.md:218-231`).

**Acción:**

- Documentar la limitación en la pantalla y en `docs/motor-de-reglas.md`.
- A mediano plazo, exigir un registro de calibración emitido por el equipo (`CALIB` en `VER:2`) o firmado por un técnico autenticado (backend).

### B1 · BAJO — Bluetooth sin autenticación del equipo

- PIN público `1234` (`refluye_v2.ino:17`, `conectar.tsx:23`).
- La app acepta datos de cualquier dispositivo SPP. Un equipo falso cercano podría inyectar lecturas favorables.
- Riesgo bajo: requiere proximidad física, y los vetos por observación humana siguen funcionando.
- Documentarlo en `SECURITY.md`.

---

## 2. Datos y privacidad (Ley 1581 de 2012)

### 2.1 Inventario real de datos (versión 0.3.2)

Todo se guarda **solo en el teléfono**. No hay backend ni envío. La única salida es «Compartir resultado», que el usuario inicia (`resultado.tsx:50`).

| Dato | Dónde (código) | Almacenamiento | ¿Personal? | ¿Necesario? |
|---|---|---|---|---|
| Lectura: pH, turbidez (NTU), TDS (ppm), temperatura (°C), ICA y ESTADO del equipo, `versionProtocolo`, `recibidaEn` (ms epoch) | `dominio/tipos.ts:7-12` | SQLite `capturas.datos` (JSON) | No | Sí |
| `tramaOriginal` (texto crudo SPP) | `parser.ts:34` | Dentro de `capturas.datos` | No | Útil para auditoría |
| `fuente`: texto libre, hasta 80 caracteres (ej. «Quebrada de la finca») | `medir.tsx:92`, `sesion.ts:83` | `capturas.datos` | **Puede serlo** (p. ej. «pozo de don José Pérez») | Sí, pero conviene orientar el texto |
| `equipo`: **dirección MAC Bluetooth** | `sesion.ts:83`, `servicio.ts:19` | `capturas.datos`, `ajustes.equipo` | Identificador de dispositivo | Solo localmente; **no** debe subirse tal cual |
| `calibracion.responsable`: **nombre de una persona** | `equipo.tsx:25` | `ajustes.calibracion:<MAC>` **y copiado en cada captura** (`sesion.ts:82-84`) | **Sí** | La captura solo necesita «vigente sí/no» y la referencia |
| Observaciones (origen, olor, tipo de olor, aspecto) y uso | `tipos.ts:6` | `capturas.datos` | No | Sí |
| Resultado del motor (incluye `version`) | `motor.ts:51-62` | `capturas.resultado` | No | Sí |
| Progreso del protocolo | `protocolo.tsx:15` | `ajustes.progreso:<id>` | No | Sí |
| Ubicación | — | **No se recoge** | — | — |
| Datos de usuario o cuenta | — | **No existen** | — | — |

En la web (DEMO) los datos van a `localStorage` (`repositorio.web.ts`) y se bloquean las mediciones reales (`:8`).

### M1 · MEDIO — No hay ejercicio de derechos del titular ni aviso de privacidad

Faltan:

- un aviso o política de privacidad en la app;
- una forma de **borrar** una medición o todo el historial;
- una forma de **exportar** los datos;
- la posibilidad de corregir el nombre de la fuente.

`historial.tsx` solo lista (y hasta 100 registros, `repositorio.ts:38`). La Ley 1581 (art. 8) reconoce los derechos de conocer, actualizar, rectificar y suprimir. Aunque los datos sean locales, el responsable técnico es quien publica la app.

**Acción:**

- Añadir «Borrar esta medición», «Borrar todo» y «Exportar CSV».
- Añadir una pantalla breve «Tus datos» con lo que se guarda y dónde.
- No requiere consentimiento hoy, porque nada sale del teléfono. **Antes** de cualquier sincronización se necesitará consentimiento explícito, previo e informado (art. 9), separado del de ubicación (S8).

### M2 · MEDIO — Datos personales innecesarios en cada captura

- `calibracion.responsable` (nombre) se copia en cada `Captura`. **Minimizar:** guardar en la captura solo `{vigente, verificadaEn, venceEn, referencia}` y conservar el nombre únicamente en `ajustes`.
- La MAC del equipo se guarda en claro. **Minimizar:** usar internamente un identificador derivado, como un hash con sal por instalación, o el `SERIE` de `VER:2`. Nunca enviar la MAC a un servidor.
- `fuente`: añadir el aviso «No escribas nombres de personas» junto al campo.

### 2.2 Ubicación (para la fase con backend)

El diseño (`11-datos-y-backend.md:156-189`) ya contempla consentimiento opcional y revocable, y una agregación `ST_SnapToGrid(…, 0.01)` (unos 1,1 km). Recomendación más estricta:

- **No guardar la coordenada exacta en el servidor.** Guardar solo el código DANE de municipio y vereda, o una celda de 0,01° calculada **en el teléfono** antes de enviar.
- Mostrar en mapas públicos solo agregados con **k ≥ 5 mediciones** por celda, para no señalar a una familia ni a una finca.
- Tratar la ubicación de una fuente contaminada como dato sensible de la comunidad. El propio documento advierte del riesgo de estigmatización (`:158-160`).

### M3 · MEDIO — Esquema local poco documentado y difícil de migrar

`repositorio.ts:8-13`:

- Toda la captura se guarda como **un blob JSON** en `datos`, sin columnas tipadas.
- Las unidades no están explícitas.
- Hay un solo `PRAGMA user_version = 1` y ninguna migración.
- `fecha = recibidaEn` en milisegundos epoch: correcto en UTC, pero no documentado.

Inconsistencia de zona horaria en `equipo.tsx:22-23`: las fechas de calibración se validan con `toISOString()` (UTC) pero se convierten con `new Date(fecha+'T00:00:00')` (**hora local**, UTC−5 en Colombia).

### 2.3 Esquema de datos propuesto (para `docs/datos.md`)

Convención: `snake_case`, unidades en el nombre, fechas en **UTC ISO-8601** (o milisegundos epoch UTC donde ya se usa), versión de protocolo y de motor en cada fila.

```sql
-- SQLite local (user_version = 2) — misma forma que la tabla futura en Postgres
CREATE TABLE medicion (
  id                 TEXT PRIMARY KEY,          -- UUID v4
  creada_utc         TEXT NOT NULL,             -- '2026-11-08T21:55:00Z'
  recibida_utc       TEXT NOT NULL,             -- hora de la trama
  es_demo            INTEGER NOT NULL CHECK (es_demo IN (0,1)),
  estado             TEXT NOT NULL CHECK (estado IN ('borrador','finalizada')),
  -- Lectura del equipo
  ph                 REAL CHECK (ph BETWEEN 0 AND 14),            -- adimensional
  turbidez_ntu       REAL CHECK (turbidez_ntu BETWEEN 0 AND 200), -- NTU
  tds_ppm            REAL CHECK (tds_ppm BETWEEN 0 AND 2000),     -- ppm (mg/L)
  temperatura_c      REAL CHECK (temperatura_c BETWEEN -55 AND 125), -- °C; NULL si -127
  ica_equipo         REAL,                       -- 0–100, solo informativo
  version_protocolo  INTEGER NOT NULL,           -- VER: del equipo (0 = sin VER)
  estabilidad        TEXT CHECK (estabilidad IN ('estable','inicial')),
  trama_original     TEXT,
  -- Contexto
  fuente_nombre      TEXT NOT NULL,              -- sin nombres de personas
  equipo_ref         TEXT NOT NULL,              -- hash local, nunca la MAC en el servidor
  calibracion_vigente INTEGER NOT NULL,
  calibracion_ref    TEXT,
  uso                TEXT CHECK (uso IN ('beber','cocinar','banarse','utensilios','ropa','ganado','cultivo')),
  origen             TEXT CHECK (origen IN ('corriente','estancada','no_se')),
  olor               TEXT CHECK (olor IN ('normal','raro','no_se')),
  olor_tipo          TEXT,
  aspecto            TEXT CHECK (aspecto IN ('limpia','verdosa','aceitosa','turbia','no_se')),
  -- Resultado del motor (nunca de la IA)
  version_motor      TEXT,
  nivel              INTEGER CHECK (nivel IN (0,1,2)),
  regla_principal    TEXT,
  reglas             TEXT,                       -- JSON array ['R02','R14']
  plan               TEXT CHECK (plan IN ('alternativa','repetir','hervido')),
  ica_app            REAL,
  confiable          INTEGER
);
```

La migración desde `user_version = 1` debe leer el JSON existente y rellenar las columnas. Se prueba con el repositorio SQLite real que ya existe en `repositorio.test.ts`.

---

## 3. Calidad del código

### 3.1 Estado real de las pruebas (ejecutado el 2026-11-08)

```
npm ci && npx vitest run --coverage   (Vitest 5.0.0, Node 22.23.4)
Test Files  7 passed (7)
Tests       69 passed (69)
motor.ts → Statements 100 % (38/38) · Branches 100 % (80/80) · Functions 100 % (7/7) · Lines 100 % (33/33)
```

- **Casos golden:** 22 en `mobile/src/dominio/__tests__/casos-golden.json`, más una prueba combinatoria de vetos (`motor.test.ts`, «preserva vetos y restricciones en combinaciones de entradas»).
- **Pruebas por archivo:** motor 26, sesión 10, parser 12, resumenEnVivo 8, SQLite 5, orientación 4, monitoreo 4.
- **Cobertura del resto de `src/`** (medida aparte, sin umbral):

| Archivo | Ramas | Observación |
|---|---|---|
| `dominio/orientacion.ts` | **88 %** | Líneas 13-14 y 34 sin cubrir: ropa, ganado y cultivo. **Decide textos de uso** |
| `dominio/resumenEnVivo.ts` | 100 % | |
| `dominio/protocolos.ts` | 0 % (datos) | Ninguna prueba verifica que `hervido` incluya los límites de S5 |
| `aplicacion/sesion.ts` | 80 % | |
| `bluetooth/parser.ts`, `monitoreo.ts`, `estabilidad.ts` | 93–98 % | |
| `bluetooth/servicio.ts`, `db/repositorio.web.ts` | 0 % | E/S nativa |

### A6 · ALTO — Las cifras de pruebas de la documentación se contradicen

| Documento | Dice | Real |
|---|---|---|
| `CLAUDE.md` («Estado actual») | 43 pruebas, APK 0.1.0 | 69, APK 0.3.2 |
| `README.md:69` | 49 pruebas | 69 |
| `mobile/README.md:78` | 61 pruebas | 69 |
| `refluye/contexto/05-estado-actual-y-deuda.md` | 69 pruebas | ✔ |

Es justo el tipo de desincronización que `CLAUDE.md` advierte. **Acción:** una sola fuente, el CI, con un badge, y quitar las cifras manuales.

### M4 · MEDIO — La cobertura obligatoria solo protege `motor.ts`

`vitest.config.ts:4` limita el umbral del 100 % a `src/dominio/motor.ts`. Pero `orientacion.ts` y `resumenEnVivo.ts` producen los textos de consumo que el usuario lee. Si alguien cambia un texto de `orientacion.ts` para que diga algo que contradiga S2, ninguna prueba falla.

**Acción:**

- Extender el umbral a todo `src/dominio/**`.
- Añadir pruebas de invariantes de texto: ninguna cadena contiene «potable», «apta» ni «segura»; toda salida de consumo humano menciona la desinfección.

### M5 · MEDIO — `VER:0` (firmware sin línea `VER`) se trata como confiable

`motor.ts:22` (`l.versionProtocolo<=1`) y `estabilidad.ts:7` aceptan la versión 0. El protocolo (`03-protocolo-bluetooth.md:208`) solo dice «modo compatible». Un firmware antiguo **sin** las correcciones F1-F4 (ADC sin calibrar, ICA sin acotar) puede producir una lectura «confiable».

**Decisión pendiente:** ¿`VER:0` debe ser como máximo «no confiable»? Cambiarlo altera el motor y requiere un caso golden nuevo. No se toca sin tu aprobación.

### M6 · MEDIO — Flujo de observación heredado y duplicado

- `mobile/src/app/observacion.tsx` (3 preguntas paso a paso) duplica las opciones de `medir.tsx:14-18` **con otros textos**: «Agua quieta» frente a «Agua estancada», o «Tiene tierra» frente a «Tiene tierra o está turbia».
- Desde 0.3.0, `medir.tsx:62-68` captura, observa y finaliza de una vez. `observacion.tsx` solo se alcanza con un borrador huérfano (`index.tsx:15`, `historial.tsx:14`).
- `mobile/README.md:80-81` admite que ese camino «debe comprobarse de nuevo».

**Acción:** unificar los catálogos de opciones en `src/dominio/catalogos.ts` y decidir si `observacion.tsx` se elimina o se mantiene solo para recuperar borradores.

### M7 · MEDIO — Librería Bluetooth sin versión estable

`react-native-bluetooth-classic@^1.73.0-rc.17` (MIT). Con `^` sobre una RC, `npm install` podría resolver otra RC. El lockfile lo fija, pero conviene usar una versión exacta.

**Acción:** fijar `1.73.0-rc.17` exacta y aislarla tras `servicio.ts`, que ya lo hace bien. Documentar una alternativa: un fork o un módulo Expo propio.

### 3.2 Código muerto, duplicado y estilo

| ID | Sev. | Hallazgo | Ubicación |
|---|---|---|---|
| B2 | Bajo | `console.log`: **0**. `TODO`/`FIXME`: **0**. `@ts-ignore`: **0** | `mobile/src`, `firmware` |
| B3 | Bajo | `any` solo en el adaptador de prueba: 3 usos | `repositorio.test.ts:12,16,17` |
| B4 | Bajo | Calibración DEMO literal duplicada | `sesion.ts:81` y `medir.tsx:38` |
| B5 | Bajo | `interface Equipo` y `interface Registro` duplicadas entre la versión nativa y la web | `servicio.ts:3` / `servicio.web.ts:1`; `repositorio.ts:35` / `repositorio.web.ts:3` |
| B6 | Bajo | Código muy denso: líneas de más de 300 caracteres y JSX de una línea. Sin ESLint, Prettier ni `.editorconfig`. Difícil para un estudiante | `medir.tsx`, `resultado.tsx`, `equipo.tsx`, `componentes.tsx` |
| B7 | Bajo | Aviso de Vite: `vitest.config.ts` es ESM cargado como CJS | `mobile/vitest.config.ts:1` |
| B8 | Bajo | Versión fija en el script; se desincroniza con cada versión | `compilar-apk.ps1:49` (`0.3.2`) |
| B9 | Bajo | TDS sin compensación de temperatura (la fórmula DFRobot la espera) | `refluye_v2.ino:133-135` |
| B10 | Bajo | El historial muestra solo los 100 más recientes, sin paginación | `repositorio.ts:38` |

### 3.3 Separación de capas

La estructura es buena y coherente con `CLAUDE.md`:

```
mobile/src/
├── dominio/          TypeScript puro: motor, orientación, protocolos, tipos   ✔ sin React ni E/S
├── aplicacion/       sesion.ts (zustand) — orquesta Bluetooth, parser, SQLite y motor
├── infraestructura/
│   ├── bluetooth/    servicio (nativo/web), parser SPP, estabilidad, monitoreo
│   └── db/           repositorio SQLite (nativo) / localStorage (web)
├── app/              pantallas expo-router
└── ui/               componentes y tokens de color
```

Comprobado: `src/dominio/*` no importa React, `react-native` ni `infraestructura`.

Detalles a mejorar:

- `monitoreo.ts` y `estabilidad.ts` son lógica pura; encajan mejor en `dominio/`.
- `medir.tsx` importa directamente `infraestructura/db`, sin pasar por `aplicacion`.

### 3.4 Restricciones S1–S8: verificación

| # | Estado | Evidencia |
|---|---|---|
| S1 | ✔ App · ✘ **Firmware** | Sin «potable/apta/segura» en la UI; LCD «EXCELENTE»/«NO APTA» (A2) |
| S2 | ✔ | `R15` y `destinos.humano` exigen desinfección (`motor.ts:43,55`) |
| S3 | ✔ | Solo `evaluar()` produce `nivel`/`plan`; no hay IA |
| S4 | ✔ | `R02` nivel 2 incondicional (`motor.ts:29`); hay prueba combinatoria |
| S5 | ✔ | `verdosa` ⇒ `R07` ⇒ `alternativa` (`motor.ts:36,47`) |
| S6 | ✔ | `DESCARGO` en Medir, Resultado, Protocolo e Historial |
| S7 | ⚠ | Implementada, pero la calibración es autodeclarada (A5) y `VER:0` se acepta (M5) |
| S8 | n/a | No se recoge ubicación |

---

## 4. Preparación open source

### 4.1 Archivos faltantes (M8 · MEDIO)

| Archivo | Estado |
|---|---|
| `LICENSE` (raíz) | ✘ Falta; bloqueado por C1 |
| `mobile/LICENSE` | ✘ Incorrecto (MIT de Expo) |
| `README.md` | ⚠ Existe, pero centrado en la APK 0.3.1. La sección 0.3.2 está pegada al final. Sin capturas, sin diagrama, sin guía de hardware |
| `CONTRIBUTING.md` | ✘ |
| `CODE_OF_CONDUCT.md` | ✘ |
| `SECURITY.md` | ✘ |
| `.github/ISSUE_TEMPLATE/*`, `pull_request_template.md` | ✘ (no existe `.github/`) |
| `.env.example` | ✘ (necesario cuando exista Supabase) |
| CI (GitHub Actions: typecheck, pruebas, cobertura, `npm audit`, gitleaks) | ✘ (M9) |
| `docs/` (arquitectura, datos, protocolo, motor, hardware) | ⚠ Contenido disperso en `refluye/`; falta la versión para estudiantes |
| `CHANGELOG.md` | ✘ (el historial está en `bitacora.md` y `iteraciones/`) |

### M9 · MEDIO — Sin integración continua

Las pruebas y el 100 % de cobertura solo se comprueban a mano o en `compilar-apk.ps1` (Windows). Nada impide fusionar un cambio que rompa el motor.

### M10 · MEDIO — Binarios generados versionados junto a su fuente

`output/word/*.docx` y `output/pdf/*.pdf` se generan desde `refluye/manuales/*.md` con `generar-word.py` y `generar-guia-visual.py`. Versionar ambos reproduce el problema que `CLAUDE.md` describe: Word y repositorio desincronizados.

**Propuesta:** generarlos en CI y publicarlos como adjuntos del *release*.

### 4.2 Contenido que conviene revisar antes de hacer público

| Contenido | Riesgo | Recomendación |
|---|---|---|
| Nombre del autor original (Alfredo Antonio Díaz Claros) en README, firmware y manuales | Ninguno: atribución exigida por la licencia | Mantener |
| Correo `tomasmanuelgp@gmail.com` en los metadatos de los 9 commits | Queda público con el historial | Decidir si se acepta; reescribir el historial **no** se recomienda (ver P3) |
| `refluye/prompts/` (bitácora, 17 iteraciones, `loop-mejora.md`, `decisiones.md`, `pendientes.md`) | Registros internos de trabajo con agentes de IA. Incluyen detalles del equipo local (Windows, unidad `R:`, teléfono de pruebas Redmi 13, hashes de certificados de desarrollo) | No son secretos, pero son documentos internos. Decidir: publicarlos como «historial de diseño», moverlos a `docs/historial/` o dejarlos fuera (P2) |
| `refluye/historico/09-diseno-inicial-no-vigente.md` | Puede confundir | Marcarlo como archivo histórico |
| `CLAUDE.md`, `mobile/AGENTS.md`, `mobile/CLAUDE.md` | Instrucciones para agentes; `CLAUDE.md` está desactualizado | Actualizar o mover a `docs/` |
| Datos reales de personas, menores, fotos | **No encontrados** | — |
| Página `https://re-fluye.vercel.app/` | Revisada el 2026-11-08 | Ver la sección 7 (W1–W6) |

### 4.3 Nombre del repositorio

El repositorio tenía un nombre provisional, ajeno al proyecto, y los enlaces de descarga apuntaban a ese nombre (`README.md:7,104`). Renombrarlo a `re-fluye` cambia todas las URL. GitHub redirige las antiguas, pero no si luego se crea otro repositorio con el nombre anterior. **Resuelto el 2026-11-08: se renombró a `Refluye`.**

---

## 5. Documentación desactualizada (bajo)

| ID | Ubicación | Problema |
|---|---|---|
| B11 | `CLAUDE.md` «Estado actual» | 43 pruebas, APK 0.1.0 (real: 69 y 0.3.2) |
| — | `README.md:5-12,104-106` | Remite a 0.3.1 como versión principal y añade 0.3.2 al final |
| — | `mobile/README.md:76-78` | 61 pruebas |
| — | `refluye/contexto/05-estado-actual-y-deuda.md:137,210` | Propone `LICENSE` CC BY-NC-SA 4.0: choca con el objetivo AGPL (C1) |

---

## 7. Sitio web https://re-fluye.vercel.app/ (revisado el 2026-11-08)

Sitio estático Astro con 20 rutas: 8 páginas, la guía «Construye» de 10 pasos, 2 videos MP4 y `materiales.csv`. Se recorrió completo con Playwright.

- No tiene formularios ni cookies de rastreo.
- No tiene ningún enlace externo; el video de YouTube solo carga al tocarlo.
- Su código fuente **no está** en este repositorio.

**Coincide con el repositorio:** pines, divisores 10 k/20 k, PIN 1234, trama `VER:1`, reglas S1–S8 (página `/codigo`), descargo microbiológico en el encabezado y el pie de todas las páginas, y AGPL 3.0 para la aplicación. Ninguna página dice «potable», «apta» ni «segura» a secas.

### W1 · CRÍTICO — El sitio no atribuye al proyecto original

Ninguna de las 20 rutas menciona a Alfredo Antonio Díaz Claros, al CCD ni a la UNAB. Las páginas `/` e `/impacto` presentan el origen como propio («Nació en una vereda de Santander»).

La cláusula **BY** de CC BY-NC-SA 4.0 exige atribución en toda redistribución de la obra derivada: el firmware V2.2, las guías de circuito y de calibración, y la fórmula del ICA. El firmware que el sitio ofrece descargar (`/construye/firmware/`) lleva la atribución dentro del código (`refluye_v2.ino:4-5`), pero el sitio no.

**Acción:** añadir una sección «Origen y atribución» en `/impacto` y `/codigo`, y una línea en el pie de página, con enlace a [adiacla/refluye](https://github.com/adiacla/refluye).

### W2 · ALTO — Nombres de 11 estudiantes y de la docente publicados

La página `/equipo` lista nombre y apellido de los 11 integrantes del semillero InnovaMinds (Colegio Técnico Industrial José Elías Puyana, Floridablanca) y de la docente. Es muy probable que sean menores de edad.

El propio sitio (`/privacidad`) dice que publica nombres de menores «solo con autorización escrita de sus acudientes». Ley 1581, art. 7: los datos de niños, niñas y adolescentes requieren especial protección.

**Acción:**

- Confirmar que existen las 11 autorizaciones escritas.
- En el **repositorio** no se publicarán nombres de integrantes. Se usará «Semillero InnovaMinds» salvo autorización expresa (aplica en PR-15 y PR-16).

### W3 · MEDIO — El rango de TDS del motor supera el validado del sensor

`/construye/calibracion/` indica que el SEN0244 tiene rango de 0 a 1000 ppm, «por encima no hay lectura validada». Sin embargo, la app procesa las lecturas de 1000 a 2000 ppm como si fueran válidas:

- el parser acepta hasta 2000 ppm (`parser.ts:4`);
- el ICA usa ese mismo rango (`motor.ts:12`);
- la regla `R09` (veto) se activa con `tds >= 1500` (`motor.ts:34`);
- el firmware acota a 2000 (`refluye_v2.ino:136`).

Por el lado de la seguridad, el veto sigue funcionando y orienta hacia otra fuente. Pero el ICA y la regla `R12` usan valores no validados.

**Propuesta (requiere tu aprobación porque toca el motor):** marcar `tds > 1000` como «fuera del rango validado del sensor» ⇒ resultado no confiable (R05), con un caso golden nuevo.

### W4 · MEDIO — El nivel de madurez anunciado contradice el repositorio

`/impacto` declara **TRL 5**: «dispositivo y aplicación integrados y probados con usuarios en un entorno relevante, en La Mesa de Los Santos». El repositorio dice que la aceptación en un Android físico está **pendiente**:

- `CLAUDE.md`, «Estado actual»;
- `README.md:24-26`;
- `refluye/contexto/05-estado-actual-y-deuda.md:20-24`.

**Acción:** documentar la evidencia de esas pruebas en el repositorio (protocolo, fecha, versión de la APK, resultado, sin datos personales) o ajustar el TRL del sitio.

### W5 · BAJO — Marcadores `[PENDIENTE]` que este repositorio puede resolver

| Marcador en el sitio | Valor que aporta el repositorio |
|---|---|
| Enlace del repositorio (`/codigo`) | URL del repositorio renombrado (P5) |
| Enlace del firmware (`/construye/firmware/`) | `firmware/refluye_v2/refluye_v2.ino` |
| Enlace de la APK (`/construye/aplicacion/`) | Página de *releases* firmada (PR-04) |
| Licencia de firmware, diseño y guías | CC BY-NC-SA 4.0 (decisión P1) |
| Correo de contacto, responsable del tratamiento | **Lo debes definir tú** (debe ser una persona adulta o una entidad) |
| Precios de LCD, resistencias, LED, protoboard, cables, carcasa y buffers (`materiales.csv`) | **Faltan** también en el repositorio |

### W6 · BAJO — La marca registrada no está documentada en el repositorio

El sitio dice «La marca RE-FLUYE está protegida». AGPL-3.0 no concede derechos de marca, pero conviene decirlo explícitamente en `LICENCIAS.md` para que los forks usen otro nombre.

---

## 6. Decisiones que necesito de ti antes de la Fase 2

- **P1 · Licencia (bloqueante, irreversible).** ¿Tienes o puedes conseguir **autorización escrita** de Alfredo Antonio Díaz Claros y/o de la UNAB para publicar la obra derivada bajo AGPL-3.0? Si no, las alternativas son:
  - (a) publicar todo bajo CC BY-NC-SA 4.0, que no es adecuada para software;
  - (b) publicar bajo AGPL-3.0 solo el código escrito desde cero y mantener el firmware y los textos derivados bajo CC BY-NC-SA;
  - (c) esperar el permiso.
- **P2 · `refluye/prompts/`.** ¿Publicar, mover a `docs/historial/` o excluir?
- **P3 · Correo en el historial de git.** ¿Aceptas que quede público? La alternativa es reescribir el historial, que tú indicaste no hacer.
- **P4 · Página web.** Para revisarla, añade `re-fluye.vercel.app` a los hosts permitidos del entorno, o compárteme su contenido o repositorio.
- **P5 · Nombre del repositorio.** ¿Renombrar el repositorio a `re-fluye` antes de la documentación final? **Resuelto el 2026-11-08: se renombró a `Refluye`.**
- **P6 · `VER:0`.** ¿Un equipo sin línea `VER` debe considerarse siempre «no confiable»? Cambia el motor y añade un caso golden.

---

## Anexo · Comandos ejecutados

```bash
git rev-parse --is-shallow-repository        # false
gitleaks git . --log-opts="--all" --redact   # 9 commits, no leaks found
gitleaks dir . --redact                      # no leaks found
cd mobile && npm ci --ignore-scripts
npx tsc --noEmit                             # 0 errores
npx vitest run --coverage                    # 69/69, motor.ts 100 %
npx vitest run --coverage --coverage.include='src/**/*.ts'   # cobertura global 85,75 % ramas
npm audit                                    # 23 vulnerabilidades (1 crit, 9 high, 12 mod, 1 low)
npm view react-native-bluetooth-classic time # última publicación 2025-11-19 (RC)
```
