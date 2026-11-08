# Plan de preparación open source · RE-FLUYE

**Fecha:** 2026-11-08 · **Base:** [`AUDITORIA.md`](AUDITORIA.md) · **Estado:** pendiente de aprobación

Orden: **seguridad → datos → limpieza y estructura → documentación**. Cada PR es
pequeño, independiente y deja las pruebas en verde. Ningún PR cambia el veredicto
del motor de reglas. Si alguno lo necesitara, entra con su caso golden y se marca
explícitamente.

---

## Decisiones tomadas (2026-11-08)

| # | Decisión | Consecuencia en el plan |
|---|---|---|
| P1 | **Licencia mixta.** AGPL-3.0 para el código escrito desde cero (`mobile/`). CC BY-NC-SA 4.0 se mantiene para lo derivado del proyecto original (firmware y textos de contexto heredados). Existe una autorización del autor que no se puede entregar todavía; cuando se formalice, se migra todo a AGPL. | PR-14 |
| P2 | Los registros de trabajo con IA (`refluye/prompts/`) **se publican**, como historial de diseño. | PR-13 los mueve a `docs/historial/` |
| P3 | El correo en el historial de git **puede quedar público**. No se reescribe el historial. | Ninguna |
| P4 | La página https://re-fluye.vercel.app/ se conecta con este repositorio. **Revisada el 2026-11-08** (ver `AUDITORIA.md §7`). | PR-16 resuelve sus marcadores; PR-17 corrige el sitio |
| P5 | Nuevo nombre del repositorio: **por confirmar** (la respuesta se transcribió como «Refugio»; se asume `re-fluye`). El cambio de nombre lo hace el propietario en GitHub → Settings. | PR-16 usa el nombre confirmado |
| P6 | Un equipo sin línea `VER` (`VER:0`) **sigue considerándose confiable**. El motor no cambia. | PR-05 documenta y fija este comportamiento con una prueba |

---

## Bloque 1 · Seguridad

### PR-01 · Integración continua y barrera de seguridad
- **Workflow** `.github/workflows/ci.yml`, que se ejecuta en cada push y PR con Node 22:
  - `npm ci`;
  - `npm run typecheck`;
  - `npm run test:coverage`;
  - `npm audit --omit=dev --audit-level=high`.
- **Workflow** `.github/workflows/secretos.yml`: gitleaks sobre el historial completo.
- **Hallazgos que cierra:** M9, y una fuente de verdad para A6.
- **Riesgo:** ninguno; no toca código.

### PR-02 · Actualizar dependencias sin cambios mayores
- `npm audit fix` (sin `--force`).
- Subir `expo` a 57.0.32, `vitest` y `@vitest/coverage-v8` a 5.1.0.
- Fijar `react-native-bluetooth-classic` en la versión exacta `1.73.0-rc.17`.
- **Hallazgos:** A4 (salvo `expo-router`/`query-string`, que requiere Expo 58; queda como tarea futura) y M7.
- **Verificación:** 69 pruebas, `tsc` y `npm audit` antes y después.

### PR-03 · Firmware: pantalla y LEDs sin veredicto (S1)
- **Cambio en el LCD:**
  - `EXCELENTE`, `CONDICION` y `NO APTA` se sustituyen por textos neutros (`ICA 82`, `VER APP`).
  - El LED verde deja de significar «se puede consumir». El LED amarillo queda como señal de «midiendo» y el rojo como «sensor fuera de rango».
- **Sin cambios en la trama Bluetooth:** `ESTADO` se sigue enviando, así que el protocolo `VER:1` no cambia.
- Versión V2.3. Se actualizan `firmware/README.md` y `refluye/contexto/02-hardware-y-firmware.md`.
- Compilación verificada con `arduino-cli` en CI, añadida al workflow de PR-01.
- **Hallazgo:** A2.

### PR-04 · Firma de publicación de la APK
- `mobile/plugins/` lee la ruta y las contraseñas del keystore desde variables de entorno (`REFLUYE_KEYSTORE_*`); nunca desde el repositorio.
- `compilar-apk.ps1` deja de tener la versión fija y la toma de `package.json`.
- Se añade `*.keystore` al `.gitignore`.
- **Tu parte:** crear el keystore de publicación y guardarlo fuera del repositorio. Yo no lo genero ni lo veo.
- **Hallazgos:** A3, B8.

### PR-05 · Pruebas de invariantes de seguridad (solo pruebas)
- Umbral de 100 % de cobertura extendido a todo `src/dominio/**`.
- Nuevas pruebas:
  - Ninguna cadena del dominio ni de las pantallas contiene «potable», «apta» o «segura» (S1).
  - Toda salida para beber o cocinar menciona aclarar y desinfectar (S2).
  - El olor raro siempre lleva al plan `alternativa` (S4).
  - El agua verdosa nunca lleva solo a `hervido` (S5).
  - `protocolos.hervido.limites` menciona toxinas y químicos.
  - `VER:0` se acepta como confiable (decisión P6).
- Se añaden los casos que faltan en `orientacion.ts`: ropa, ganado y cultivo.
- **Hallazgos:** M4, M5.

### PR-06 · Calibración: decir la verdad sobre lo que es
- La pantalla «Mi equipo» y el resultado indican «calibración **declarada** por …». Hoy la app no puede verificarla.
- Se documenta en `SECURITY.md` (PR-15) junto con el riesgo del PIN 1234 y de un equipo falso cercano.
- **Sin cambios en el motor.**
- **Hallazgos:** A5, B1.

---

## Bloque 2 · Datos y privacidad (Ley 1581)

### PR-07 · Minimizar datos personales
- Cada captura guarda solo `{vigente, verificadaEn, venceEn, referencia}` de la calibración. El nombre del responsable queda únicamente en los ajustes del equipo.
- `equipo_ref`: identificador local derivado (hash con sal por instalación). La dirección MAC solo se usa para reconectar.
- Aviso junto al nombre de la fuente: «No escribas nombres de personas».
- **Migración:** borra `responsable` de las capturas existentes. Se prueba con SQLite real.
- **Hallazgo:** M2.

### PR-08 · Esquema SQLite v2 con columnas tipadas
- Tabla `medicion` según `AUDITORIA.md §2.3`: unidades en los nombres (`turbidez_ntu`, `tds_ppm`, `temperatura_c`), fechas UTC, `version_protocolo` y `version_motor` en cada fila.
- Migración `user_version` 1 → 2 que lee el JSON antiguo.
- Las fechas de calibración pasan a UTC de forma consistente (`equipo.tsx:22-23`).
- **Hallazgo:** M3.

### PR-09 · Derechos del titular
- En «Mis mediciones»: borrar una medición, borrar todo (con confirmación) y exportar CSV con el diccionario de PR-16.
- Nueva pantalla «Tus datos»: qué se guarda, dónde y que nada sale del teléfono.
- Paginación del historial (hoy solo muestra 100 registros).
- **Hallazgos:** M1, B10.

---

## Bloque 3 · Limpieza y estructura

### PR-10 · Formato y estilo (mecánico)
- ESLint (configuración de Expo), Prettier y `.editorconfig`.
- Un único commit de formateo automático, sin cambios de lógica.
- Las líneas de más de 300 caracteres pasan a JSX legible.
- **Hallazgos:** B6, B7.

### PR-11 · Un solo catálogo de opciones y tipos compartidos
- Nuevo `src/dominio/catalogos.ts` con orígenes, olores, aspectos, usos y tipos de olor (textos unificados).
- Constante `CALIBRACION_DEMO` única.
- Tipos `Equipo` y `Registro` compartidos entre la versión nativa y la web.
- `observacion.tsx`: se mantiene solo para recuperar borradores y usa el mismo catálogo.
- **Hallazgos:** M6, B4, B5.

### PR-12 · Separación de capas
- `estabilidad.ts` y `monitoreo.ts` pasan a `src/dominio/` (son lógica pura).
- Las pantallas dejan de importar `infraestructura/db` directamente y pasan por `src/aplicacion/`.
- `medir.tsx` se divide en componentes: sensores, preguntas y conclusión.

### PR-13 · Reorganización del repositorio
```
/
├── mobile/              app (AGPL-3.0)
├── firmware/            ESP32 (CC BY-NC-SA 4.0)
├── docs/                documentación para estudiantes (PR-16)
│   ├── contexto/        ← refluye/contexto, app, manuales
│   └── historial/       ← refluye/prompts, refluye/historico
├── .github/
└── LICENSE, README.md, CONTRIBUTING.md, ...
```
- `output/` sale del repositorio: los `.docx` y `.pdf` se generan en CI y se adjuntan a cada *release* (M10).
- Se actualizan todos los enlaces internos, `CLAUDE.md` y su «Estado actual» (B11).
- **Riesgo:** enlaces rotos. Se añade una comprobación de enlaces al CI.

---

## Bloque 4 · Documentación y licencias

### PR-14 · Licencias (requisito antes de hacer público el repositorio)
- **`LICENSE` en la raíz:** AGPL-3.0, que aplica a `mobile/` y a todo lo que no se indique de otra forma.
- **`firmware/LICENSE` y `docs/contexto/LICENSE`:** CC BY-NC-SA 4.0, con atribución a Alfredo Antonio Díaz Claros y CCD-UNAB.
- **`LICENCIAS.md`:** explica qué licencia cubre cada carpeta y por qué, y el plan de migrar todo a AGPL cuando se formalice la autorización.
- Se elimina `mobile/LICENSE` (MIT de la plantilla Expo).
- Cabeceras SPDX en los archivos fuente.

### PR-15 · Archivos de comunidad
- `CONTRIBUTING.md`: cómo proponer cambios, reglas S1–S8 y casos golden obligatorios.
- `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1 en español.
- `SECURITY.md`: cómo reportar vulnerabilidades, huella del certificado oficial y límites conocidos.
- Plantillas de *issues*: error, mejora, hallazgo de campo. Plantilla de PR con lista de S1–S8.
- `.env.example`: variables futuras de Supabase (solo la clave `anon`), sin valores.

### PR-16 · README y documentación técnica para estudiantes
- **`README.md`:** qué es RE-FLUYE, el problema, cómo funciona, capturas reales del modo DEMO (Playwright), instalación paso a paso, cómo conectar el ESP32, licencias y enlace a la página web.
- **Documentos nuevos:**
  - `docs/arquitectura.md`, con un diagrama Mermaid.
  - `docs/datos.md`, con el esquema y el diccionario de datos.
  - `docs/protocolo-bluetooth.md`: es el documento normativo actual movido; se actualiza la referencia en `CLAUDE.md`.
  - `docs/motor-de-reglas.md`.
  - `docs/hardware.md`, con componentes y costos.
- **Costos:** `docs/hardware.md` y `docs/materiales.csv` usan los precios del sitio: núcleo electrónico de $322.319 a $394.319 COP (noviembre de 2026), más los $48.000 COP de la PCB. Los componentes que el sitio marca `[PENDIENTE]` quedan marcados igual en el repositorio.
- **Créditos:** «Semillero InnovaMinds, Colegio Técnico Industrial José Elías Puyana» sin nombres de integrantes (W2), más la atribución al proyecto original.
- **Marca:** la sección de marca en `LICENCIAS.md` (W6).

### PR-17 · Correcciones del sitio web (en el repositorio del sitio)
El código del sitio no está en este repositorio. Hay dos opciones:
- **(a)** Lo traes aquí como `web/` (Astro), con la misma licencia que la app o la que decidas para el diseño.
- **(b)** Lo corriges en su propio repositorio con esta lista.

Cambios:
1. Sección «Origen y atribución» y línea en el pie, con enlace a adiacla/refluye (**W1, crítico**).
2. Confirmar las autorizaciones escritas de los 11 integrantes o retirar sus nombres (**W2**).
3. Ajustar el TRL o enlazar la evidencia de las pruebas de campo (**W4**).
4. Rellenar los marcadores con los valores de `AUDITORIA.md §7 · W5`.
5. Tras PR-03: actualizar `/construye/firmware/`, que hoy explica «EXCELENTE» y el LED verde.

### Para tu aprobación (toca el motor)
- **W3:** una lectura de TDS mayor de 1000 ppm (fuera del rango validado del SEN0244) haría el resultado **no confiable**, con un caso golden nuevo. No lo incluyo en ningún PR sin tu visto bueno.

---

## Fuera de este plan (futuro)

- **Migración a Expo SDK 58**, que corrige la vulnerabilidad de `expo-router`/`query-string`. PR propio con prueba en un Android físico.
- **Backend Supabase y Edge Function de IA.** Requisitos ya definidos en `AUDITORIA.md §A1`: RLS en todas las tablas, solo la clave `anon` en el cliente, validación, límite de uso y la clave de IA solo en el servidor.
- **`VER:2`** con `SERIE` y `CALIB` firmados por el equipo, para que la calibración deje de ser declarada.
- **Tus mejoras adicionales:** se añadirán aquí como un bloque 5 cuando me las indiques.

---

## Cómo se entrega

Solo puedo publicar en la rama `claude/wizardly-goodall-ofuz8p`. Hay dos opciones:

- **(a)** Un commit por PR temático en esa rama, y un único PR final. Es la opción por defecto.
- **(b)** Que me autorices a crear una rama por tema (`refluye/pr-01-ci`, …), con un PR cada una.
