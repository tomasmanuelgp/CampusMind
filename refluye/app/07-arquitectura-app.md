# 07 · Arquitectura de la aplicación

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Runtime | **React Native + Expo** (development build) | Es lo que declara el firmware. Permite módulos nativos |
| Lenguaje | **TypeScript** estricto | El dominio tiene invariantes de seguridad; el tipado las protege |
| Bluetooth | `react-native-bluetooth-classic` | Único camino a SPP. **Obliga a development build, no Expo Go** |
| Navegación | `expo-router` | Rutas por archivos, deep linking |
| Estado | **Zustand** + **TanStack Query** | Zustand para sesión/BT; Query para datos remotos y su caché |
| BD local | **SQLite** (`expo-sqlite`) | Historial, cola de sincronización, protocolos |
| Backend | **Supabase** | Postgres + PostGIS, Auth, Storage, Edge Functions |
| IA | **Claude** vía Edge Function (proxy) | Nunca la clave en el cliente. Ver doc 10 |
| i18n | `i18next` | Español por defecto; estructura lista para más idiomas |
| Estilos | StyleSheet + tokens propios | Sin dependencia pesada; control total del contraste |

> **Nota sobre Expo Go:** el módulo de Bluetooth Classic es nativo, así que la app
> **no corre en Expo Go**. Hay que generar un development build (`expo prebuild` +
> `eas build --profile development`). Esto debe saberse desde el primer día.

---

## Principio rector: offline-first real

No "funciona sin conexión a medias". **La ruta crítica completa —conectar, medir,
observar, obtener veredicto y protocolo— no toca la red en ningún punto.**

De ahí se derivan tres reglas de arquitectura:

1. **Toda escritura va primero a SQLite**, y solo después, si hay red, a Supabase.
   Nunca al revés.
2. **Ninguna pantalla de la ruta crítica espera una respuesta de red.** Si un
   componente necesita red para renderizar, está mal ubicado.
3. **El motor de reglas y los protocolos son código y datos embebidos**, no
   contenido remoto.

---

## Capas

```
┌──────────────────────────────────────────────────────┐
│  PRESENTACIÓN — pantallas y componentes              │
│  expo-router · design system (doc 08)               │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│  APLICACIÓN — casos de uso, orquestación             │
│  useMedicion · useConexion · useHistorial           │
└───────┬───────────────┬──────────────┬───────────────┘
        │               │              │
┌───────▼──────┐ ┌──────▼───────┐ ┌────▼──────────────┐
│  DOMINIO     │ │ INFRAESTRUC. │ │  IA (opcional)    │
│              │ │              │ │                   │
│ motor reglas │ │ BluetoothSvc │ │ AsistenteService  │
│ cálculo ICA  │ │ SqliteRepo   │ │ → Edge Function   │
│ protocolos   │ │ SupabaseRepo │ │ → Claude          │
│ validación   │ │ SyncQueue    │ │                   │
│              │ │ GeoService   │ │ NUNCA decide      │
│ SIN E/S      │ │              │ │ el veredicto      │
└──────────────┘ └──────────────┘ └───────────────────┘
```

**La capa de dominio no importa nada.** Sin React, sin SQLite, sin red. Es
TypeScript puro, determinista y testeable en milisegundos. Esa restricción es lo
que permite tener el motor de seguridad bajo pruebas exhaustivas.

---

## Estructura de carpetas

```
src/
├── app/                      # expo-router
│   ├── index.tsx             # inicio
│   ├── conectar.tsx
│   ├── medir.tsx
│   ├── observacion/[paso].tsx
│   ├── resultado/[id].tsx
│   ├── protocolo/[id].tsx
│   ├── asistente/[id].tsx    # solo modo conectado
│   ├── historial/
│   ├── fuentes/
│   └── calibracion/
│
├── dominio/                  # ⚠️ TypeScript puro, sin E/S
│   ├── tipos.ts
│   ├── ica.ts
│   ├── motor-reglas.ts       # el corazón
│   ├── protocolos/
│   │   ├── catalogo.ts
│   │   ├── hervido.ts
│   │   ├── cloracion.ts
│   │   ├── filtracion.ts
│   │   ├── sedimentacion.ts
│   │   └── sodis.ts
│   ├── dosificacion.ts       # cantidades según volumen
│   └── validacion.ts         # lecturas sospechosas
│
├── infraestructura/
│   ├── bluetooth/
│   │   ├── BluetoothService.ts
│   │   ├── parser.ts         # implementa doc 03
│   │   └── estabilidad.ts
│   ├── db/
│   │   ├── schema.sql
│   │   ├── migraciones/
│   │   └── repositorios/
│   ├── sync/
│   │   ├── ColaSincronizacion.ts
│   │   └── politicaReintentos.ts
│   ├── supabase/
│   ├── geo/
│   └── media/                # videos offline
│
├── aplicacion/               # hooks de caso de uso
│   ├── useConexion.ts
│   ├── useMedicion.ts
│   ├── useVeredicto.ts
│   ├── useAsistente.ts
│   └── useSincronizacion.ts
│
├── ui/
│   ├── tokens/               # color, tipografía, espaciado
│   ├── componentes/
│   └── iconos/
│
├── i18n/
└── config/
```

---

## Máquina de estados de la medición

El flujo completo es una máquina de estados explícita. Sin esto, los casos borde
(desconexión a mitad, lectura inestable, app en segundo plano) generan estados
imposibles.

```
   IDLE
    │ seleccionar equipo
    ▼
  CONECTANDO ──────error──────► ERROR_CONEXION ──┐
    │ socket abierto                             │
    ▼                                            │ reintentar
  ESPERANDO_DATOS ───5s sin trama───► SIN_DATOS ─┤
    │ primera trama válida                       │
    ▼                                            │
  ESTABILIZANDO ◄──── lectura fuera de umbral ───┤
    │ 4 tramas estables (doc 03)                 │
    ▼                                            │
  LISTO_PARA_CAPTURAR                            │
    │ usuario pulsa "Capturar"                   │
    ▼                                            │
  CAPTURADO  (snapshot inmutable)                │
    │                                            │
    ▼                                            │
  OBSERVANDO  (3 preguntas)                      │
    │                                            │
    ▼                                            │
  EVALUANDO  (motor determinista, síncrono)      │
    │                                            │
    ▼                                            │
  RESULTADO ──► PROTOCOLO ──► [ASISTENTE si hay red]
    │
    ▼
  GUARDADO (SQLite) ──► EN_COLA ──► SINCRONIZADO
```

**Invariante clave:** al entrar en `CAPTURADO` se congela un snapshot inmutable de
la lectura. Si el equipo se desconecta después, la medición sigue siendo válida y
completable. El usuario nunca pierde una observación ya hecha por un problema de
conexión.

---

## Modelo de datos local

```sql
-- Fuentes de agua con nombre, para seguimiento en el tiempo
CREATE TABLE fuentes (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,           -- "Quebrada de la finca"
  tipo          TEXT NOT NULL,           -- rio|quebrada|pozo|aljibe|tanque|nacimiento|lluvia
  lat           REAL,                    -- NULL si no hay consentimiento
  lon           REAL,
  precision_m   REAL,
  creada_en     INTEGER NOT NULL,
  sincronizada  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE mediciones (
  id                TEXT PRIMARY KEY,    -- UUID generado en el cliente
  fuente_id         TEXT REFERENCES fuentes(id),
  medida_en         INTEGER NOT NULL,

  -- Lectura cruda del equipo (doc 03)
  ph                REAL,
  turbidez          REAL,
  tds               REAL,
  temperatura       REAL,                -- NULL si llegó -127
  ica_dispositivo   REAL,
  estado_dispositivo INTEGER,

  -- Observación humana
  origen            TEXT NOT NULL,       -- corriente|estancada|no_se
  olor              TEXT NOT NULL,       -- normal|raro|no_se
  olor_detalle      TEXT,                -- azufre|combustible|podrido|quimico|otro
  visual            TEXT NOT NULL,       -- limpia|verdosa|aceitosa|turbia|no_se
  foto_uri          TEXT,

  -- Veredicto del motor (siempre local)
  veredicto         INTEGER NOT NULL,    -- 0|1|2
  regla_disparada   TEXT NOT NULL,       -- id de la regla que decidió
  ica_calculado     REAL NOT NULL,
  destinos_json     TEXT NOT NULL,       -- aptitud por destino
  protocolos_json   TEXT NOT NULL,       -- ids de protocolos recomendados

  -- Trazabilidad (imprescindible para ML)
  version_motor     TEXT NOT NULL,
  version_firmware  TEXT,
  equipo_serie      TEXT,
  calibrado_en      INTEGER,
  lectura_confiable INTEGER NOT NULL DEFAULT 1,

  sincronizada      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cola_sync (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entidad     TEXT NOT NULL,
  entidad_id  TEXT NOT NULL,
  operacion   TEXT NOT NULL,
  intentos    INTEGER NOT NULL DEFAULT 0,
  ultimo_error TEXT,
  creada_en   INTEGER NOT NULL
);

CREATE TABLE conversaciones (   -- modo conectado
  id           TEXT PRIMARY KEY,
  medicion_id  TEXT NOT NULL REFERENCES mediciones(id),
  mensajes_json TEXT NOT NULL,
  creada_en    INTEGER NOT NULL
);
```

### Por qué los campos de trazabilidad no son opcionales

`version_motor`, `version_firmware`, `equipo_serie`, `calibrado_en` y
`lectura_confiable` parecen burocracia. No lo son: **sin ellos el dataset no
sirve para entrenar nada.** Un modelo entrenado sobre mediciones de equipos
descalibrados aprende el error del equipo, no la calidad del agua. Y sin
`version_motor` es imposible saber qué regla produjo un veredicto histórico
cuando las reglas cambien.

---

## Sincronización

**Política:** cola persistente, reintento con retroceso exponencial, sin bloquear
nunca la interfaz.

| Aspecto | Decisión |
|---|---|
| Disparo | Al recuperar red, al abrir la app, y manualmente |
| Orden | FIFO por `creada_en`; las fuentes antes que sus mediciones |
| Reintentos | 1 min, 5 min, 30 min, 2 h, 12 h. Tras 5 fallos, marcar y avisar |
| Conflictos | Las mediciones son inmutables → sin conflicto. Las fuentes: gana la última escritura |
| Identidad | UUID generado en el cliente ⇒ la sincronización es idempotente |
| Visibilidad | Indicador discreto de "N mediciones sin subir", nunca un modal |

**Regla dura:** una medición sin sincronizar es una medición completa y válida. La
sincronización es un detalle de infraestructura que **no puede degradar la
experiencia** ni mostrarse como error.

---

## Rendimiento

Objetivo: teléfono Android gama baja (2 GB RAM, Android 9).

| Métrica | Objetivo |
|---|---|
| Arranque en frío | < 2.5 s |
| Veredicto tras capturar | < 300 ms (todo local y síncrono) |
| Parseo de trama | < 5 ms |
| APK con videos base | < 80 MB |
| Consumo con BT activo 10 min | < 4 % de batería |

Decisiones derivadas: sin animaciones pesadas en la ruta crítica; videos en H.264
a 480p; imágenes en WebP; lista de historial virtualizada; el motor de reglas es
síncrono y sin dependencias.

---

## Pruebas

| Nivel | Qué cubre | Herramienta |
|---|---|---|
| Unitarias del dominio | **Las 9+ reglas, exhaustivamente.** ICA, dosificación | Jest |
| Golden tests | Tabla de casos entrada→veredicto esperado, versionada | Jest |
| Parser | Tramas completas, parciales, corruptas, con claves extra | Jest |
| Integración | SQLite, cola de sincronización | Jest + mock |
| E2E | Flujo completo con Bluetooth simulado | Maestro |
| Manual | Con hardware real | Guion en doc 12 |

**El motor de reglas exige cobertura del 100 % de ramas.** Es el componente donde
un error se traduce en daño a una persona. Toda regla nueva entra con su caso de
prueba en la tabla golden.
