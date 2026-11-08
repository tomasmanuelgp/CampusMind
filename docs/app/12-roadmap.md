# 12 · Roadmap y plan de ejecución

## Realismo sobre "desarrollarlo en un día"

El objetivo declarado es tener esto en un día. Con la documentación ya escrita y
las decisiones cerradas, **es alcanzable un vertical slice funcional**: la ruta
crítica completa, funcionando de punta a punta.

Lo que **sí** cabe en un día:

- Motor de reglas completo, con pruebas
- Catálogo de protocolos con 4–5 protocolos redactados
- Parser del protocolo Bluetooth, con pruebas
- Las 6 pantallas de la ruta crítica
- Persistencia local en SQLite
- Firmware corregido y compilando

Lo que **no** cabe y hay que aceptar:

- Videos producidos (se sustituyen por ilustraciones)
- Backend desplegado con todo el esquema
- Capa de IA pulida (se puede dejar el proxy básico)
- Pruebas con hardware real
- Mapa territorial
- Calibración guiada

La estrategia correcta es **profundidad sobre la ruta crítica, no amplitud**. Una
app que hace el flujo completo bien vale más que seis pantallas a medias.

---

## Fase 0 — Preparación (antes de escribir código)

| # | Tarea | Resultado |
|---|---|---|
| 0.1 | Portar el firmware sano desde `Parte2.docx` §6.1 | Base limpia |
| 0.2 | Aplicar los cambios intencionales de V2.1 | Sin pulsadores, `ESTADO:` numérico |
| 0.3 | Corregir F1–F4 (temporización, promediado, `analogReadMilliVolts`, clamp) | Firmware fiable |
| 0.4 | Añadir `VER:1` a la trama | Protocolo versionado |
| 0.5 | Verificar que compila | 0 errores |
| 0.6 | Inicializar el proyecto Expo con development build | App que arranca |

**Criterio de salida:** el firmware compila y emite la trama del doc 03.

---

## Fase 1 — El núcleo (la mitad del día)

Todo en TypeScript puro, sin interfaz. Es lo que más valor tiene por hora
invertida y lo que más caro sale arreglar después.

| # | Tarea | Archivo |
|---|---|---|
| 1.1 | Tipos del dominio | `dominio/tipos.ts` |
| 1.2 | Cálculo del ICA con sub-índices acotados | `dominio/ica.ts` |
| 1.3 | **Motor de reglas — las 15 reglas** | `dominio/motor-reglas.ts` |
| 1.4 | Tabla golden con los 10 casos obligatorios | `__tests__/casos-golden.json` |
| 1.5 | Catálogo de protocolos (P01, P02, P04, P05, P08) | `dominio/protocolos/` |
| 1.6 | Cálculo de dosificación | `dominio/dosificacion.ts` |
| 1.7 | Parser del protocolo BT + pruebas | `infraestructura/bluetooth/parser.ts` |
| 1.8 | Detector de estabilidad | `infraestructura/bluetooth/estabilidad.ts` |

**Criterio de salida:** `npm test` en verde, con las 5 invariantes del doc 09
verificadas. **No se pasa a la fase 2 con pruebas en rojo.**

---

## Fase 2 — La ruta crítica (la otra mitad)

| # | Pantalla | Depende de |
|---|---|---|
| 2.1 | Tokens de diseño y componentes base | doc 08 |
| 2.2 | Inicio | 2.1 |
| 2.3 | Conectar (lista de equipos, emparejar) | `BluetoothService` |
| 2.4 | Medición en vivo con indicador de estabilidad | 1.7, 1.8 |
| 2.5 | Observación — 3 pantallas + detalle de olor | 2.1 |
| 2.6 | Resultado con aptitud por destino | 1.3 |
| 2.7 | Protocolo paso a paso con temporizador | 1.5, 1.6 |
| 2.8 | Persistencia en SQLite | doc 07 |

**Criterio de salida:** una persona puede conectar, medir, observar, ver el
veredicto, seguir el protocolo y encontrar la medición en el historial — **sin
internet**.

---

## Fase 3 — Acompañamiento (segundo día)

| # | Tarea |
|---|---|
| 3.1 | Proyecto Supabase + esquema + RLS |
| 3.2 | Edge Function proxy de IA con el system prompt |
| 3.3 | Validador de frases prohibidas |
| 3.4 | Pantalla de asistente con streaming |
| 3.5 | Cola de sincronización |
| 3.6 | TTS en resultado y protocolos |

---

## Fase 4 — Territorio y continuidad

| # | Tarea |
|---|---|
| 4.1 | Fuentes con nombre y consentimiento de ubicación |
| 4.2 | Historial con tendencia por fuente |
| 4.3 | Mapa agregado con k-anonimato |
| 4.4 | Exportación a PDF |
| 4.5 | Alerta de degradación |

---

## Fase 5 — Calidad y campo

| # | Tarea |
|---|---|
| 5.1 | **Flujo de calibración guiada** (el riesgo ALTA/ALTO del plan) |
| 5.2 | Producción de videos de los protocolos |
| 5.3 | Modo demo sin hardware |
| 5.4 | Pruebas con usuarios reales en campo |
| 5.5 | Validación contra laboratorio |
| 5.6 | Accesibilidad auditada |

---

## Criterios de aceptación del MVP

Funcionales:

- [ ] Conecta con `ReFluye-V2` y recibe tramas
- [ ] Detecta y muestra el estado de estabilidad
- [ ] Captura una lectura congelada e inmutable
- [ ] Captura las tres observaciones, con opción "no sé"
- [ ] Produce veredicto en < 300 ms
- [ ] Muestra aptitud diferenciada por destino
- [ ] Entrega un protocolo paso a paso con dosis calculadas para el volumen
- [ ] Guarda en historial y lo muestra
- [ ] **Funciona completo en modo avión**

De seguridad (bloqueantes):

- [ ] Ninguna pantalla dice "potable", "apta" o "segura" a secas (S1)
- [ ] Todo destino de consumo humano incluye desinfección (S2)
- [ ] `olor = raro` siempre produce nivel 2 (S4)
- [ ] Agua verdosa nunca lleva solo a hervir (S5)
- [ ] El descargo de microbiología está en toda pantalla de resultado (S6)
- [ ] Cobertura del 100 % de ramas en el motor de reglas

De calidad:

- [ ] Arranque en frío < 2.5 s en gama baja
- [ ] Áreas táctiles ≥ 64 dp
- [ ] Contraste ≥ 7:1 en texto crítico
- [ ] Sin caídas en 30 min de uso continuo con BT activo

---

## Guion de prueba con hardware real

Cuando haya equipo físico disponible:

| # | Prueba | Esperado |
|---|---|---|
| 1 | Encender el equipo, buscar desde la app | Aparece `ReFluye-V2` |
| 2 | Emparejar con PIN `1234` | Conecta |
| 3 | Observar el monitor serie | Trama cada 1.5 s |
| 4 | Sonda en agua de grifo | pH 6.5–8, turbidez baja |
| 5 | Sonda al aire | Lectura marcada como no confiable |
| 6 | Desconectar el DS18B20 | `TEMP:-127` → app muestra "no disponible" |
| 7 | Agua con sal | TDS sube; veredicto desciende |
| 8 | Agua con tierra | Turbidez sube; aparece protocolo de filtración |
| 9 | Marcar "huele raro" con agua limpia | **Nivel 2 igual** (S4) |
| 10 | Alejarse 15 m | Se desconecta; la app lo indica y ofrece reconectar |
| 11 | Desconectar durante la observación | La medición se puede completar igual |
| 12 | Modo avión durante todo el flujo | Funciona completo |

---

## Riesgos del desarrollo

| Riesgo | Prob. | Mitigación |
|---|---|---|
| El módulo de BT Classic da problemas en Expo | MEDIA | Probar el development build en la fase 0, antes que nada |
| No hay hardware disponible para probar | ALTA | Simulador de trama BT desde el primer día |
| Los textos de los protocolos toman más tiempo del previsto | ALTA | Redactar 4 completos antes que 9 a medias |
| Sobrediseñar la capa de IA | MEDIA | Fase 3, nunca antes. El MVP es offline |
| La PCB con defectos impide probar de verdad | ALTA | Probar sobre protoboard con el pull-up añadido a mano |

---

## Orden recomendado si solo hay un día

```
1. Development build con BT Classic funcionando      ← si esto falla, todo cambia
2. Motor de reglas + pruebas                         ← el activo más valioso
3. Parser + simulador de tramas
4. Pantallas: medición → observación → resultado
5. Protocolo paso a paso
6. SQLite
7. Firmware corregido
```

El orden no es arbitrario: el punto 1 es el único con riesgo técnico
desconocido, y el punto 2 es el que conserva su valor aunque todo lo demás haya
que rehacerlo.
