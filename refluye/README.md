# Re-Fluye — Base de conocimiento del proyecto

Documentación de contexto para el desarrollo de la nueva aplicación Re-Fluye y la
corrección del firmware asociado.

**Qué es Re-Fluye:** un dispositivo IoT de bajo costo que mide calidad de agua en
zonas rurales sin internet, y una aplicación móvil que interpreta esas mediciones
junto con la observación humana del usuario para entregar un veredicto y un
protocolo de tratamiento accionable.

**Origen:** proyecto del Centro de Competencias Digitales (CCD) de la Universidad
Autónoma de Bucaramanga (UNAB), Colombia. Autor original: Alfredo Antonio Díaz
Claros. Repositorio de partida: `github.com/adiacla/refluye`.

---

## Cómo leer esta documentación

Los documentos están numerados por orden de lectura recomendado. Los primeros
cinco describen **lo que existe**; los siguientes siete describen **lo que vamos
a construir**.

### Contexto — el estado del mundo

| # | Documento | Qué responde |
|---|---|---|
| 01 | [`contexto/01-proyecto.md`](contexto/01-proyecto.md) | Qué es Re-Fluye, para quién, qué problema resuelve, quiénes son los actores |
| 02 | [`contexto/02-hardware-y-firmware.md`](contexto/02-hardware-y-firmware.md) | El ESP32, los sensores, la PCB, el firmware y sus seis versiones |
| 03 | [`contexto/03-protocolo-bluetooth.md`](contexto/03-protocolo-bluetooth.md) | **El contrato entre app y dispositivo.** Documento normativo |
| 04 | [`contexto/04-dominio-agua.md`](contexto/04-dominio-agua.md) | ICA, normativa, rangos por destino, qué mide y qué NO mide el equipo |
| 05 | [`contexto/05-estado-actual-y-deuda.md`](contexto/05-estado-actual-y-deuda.md) | Auditoría: bloqueos, contradicciones, defectos verificados |

### Aplicación — lo que vamos a construir

| # | Documento | Qué responde |
|---|---|---|
| 06 | [`app/06-vision-producto.md`](app/06-vision-producto.md) | Principios de producto, los dos modos, qué NO hace la app |
| 07 | [`app/07-arquitectura-app.md`](app/07-arquitectura-app.md) | React Native/Expo, capas, offline-first, sincronización |
| 08 | [`app/08-ui-ux.md`](app/08-ui-ux.md) | Sistema de diseño, accesibilidad rural, flujos pantalla por pantalla |
| 09 | [`app/09-motor-recomendaciones.md`](app/09-motor-recomendaciones.md) | Reglas deterministas y protocolos de potabilización paso a paso |
| 10 | [`app/10-capa-ia.md`](app/10-capa-ia.md) | Modo conectado: agente Claude, proxy, límites duros |
| 11 | [`app/11-datos-y-backend.md`](app/11-datos-y-backend.md) | Supabase, esquema, geolocalización, camino a machine learning |
| 12 | [`app/12-roadmap.md`](app/12-roadmap.md) | Fases, criterios de aceptación, plan de un día |

### Herramientas

| Archivo | Uso |
|---|---|
| [`prompts/loop-mejora.md`](prompts/loop-mejora.md) | Prompt del ciclo iterativo de mejora |
| [`../CLAUDE.md`](../CLAUDE.md) | Contexto permanente para agentes que trabajen en el repo |

### Manuales de la versión 0.3.0

| Pieza | Destinatario | Formato |
|---|---|---|
| [Guía de la app](manuales/01-guia-app.md) | Persona que mide y facilitador | Lectura digital y [Word editable](../output/word/refluye-guia-app.docx) |
| [Guía visual del equipo](../output/pdf/refluye-guia-visual-equipo-a4.pdf) | Persona que recibe el prototipo | A4 a doble cara; [Word editable](../output/word/refluye-guia-visual-equipo-a4.docx) y [texto fuente](manuales/02-guia-visual-equipo.md) |
| [Manual técnico](manuales/03-manual-tecnico.md) | Soporte, desarrollo y calibración | Documento versionable y [Word editable](../output/word/refluye-manual-tecnico.docx) |

La guía impresa requiere completar los datos reales de alimentación, sondas,
calibración y soporte de cada unidad antes de entregarla. Ningún manual sustituye
la prueba física ni la validación sanitaria pendiente.

---

## Decisiones ya tomadas

Estas decisiones están cerradas. Cambiarlas obliga a revisar varios documentos.
La tabla recoge decisiones de arquitectura del plan; la app 0.3.0 implementa
solo el flujo local descrito en el [manual técnico](manuales/03-manual-tecnico.md).

| Decisión | Elección | Por qué |
|---|---|---|
| Plataforma de la app | **React Native + Expo** (development build) | Es lo que ya declara el firmware. Permite Bluetooth Classic SPP vía módulo nativo, así que el ESP32 no cambia de transporte |
| Transporte | **Bluetooth Classic (SPP)** | Es lo que el ESP32 ya emite con `BluetoothSerial`. Evita migrar a BLE y su problema de MTU |
| Backend | **Supabase** | Postgres + PostGIS para análisis espacial real, Auth, Storage para videos, Edge Functions como proxy de IA |
| Proveedor de IA | **Claude (Anthropic)** — `claude-opus-5` | Ver `app/10-capa-ia.md` |
| Alcance | **App + firmware** | El protocolo se define entre ambos; la PCB queda documentada como restricción |

---

## Las tres cosas que hay que entender antes de escribir código

1. **El dispositivo no detecta patógenos.** pH, turbidez, TDS y temperatura no
   dicen nada sobre E. coli, coliformes, virus o parásitos — que son la causa
   principal de enfermedad gastrointestinal en el campo. Esto cambia el diseño
   de todas las recomendaciones. Ver `contexto/04-dominio-agua.md`.

2. **La IA no decide el veredicto.** El motor determinista de reglas decide si el
   agua es apta o no. La IA explica, acompaña y responde preguntas, pero nunca
   puede contradecir ni ablandar un veredicto de seguridad. Ver `app/10-capa-ia.md`.

3. **La app funciona completa sin internet.** El modo conectado añade
   acompañamiento, no funcionalidad esencial. Si la IA no está disponible, el
   usuario obtiene igual su veredicto y su protocolo de tratamiento.
