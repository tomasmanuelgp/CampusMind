# 05 · Estado actual y deuda técnica

## Actualización de la aplicación · 2026-09-30

La auditoría histórica inferior describe el repositorio original. El desarrollo
activo está ahora en `../../mobile`, dentro de CampusMind. Existe una primera
aplicación de campo con Bluetooth Classic, modo DEMO, motor local, observaciones,
SQLite, guía y registro de calibración. La versión 0.3.0 pasa 54 pruebas y
TypeScript; el recorrido web DEMO se revisó. La medición, nombre, uso y
observaciones se completan en una pantalla. El resultado muestra enseguida una
orientación por uso y los pasos pertinentes; una primera trama completa permite
un resultado provisional sin esperar estabilidad imposible. El ICA de 0 a 100
resume pH, turbidez y TDS; la temperatura se muestra aparte, pues no hay una
fórmula validada para incorporarla. No es un porcentaje de potabilidad. La APK
0.2.0 anterior fue compilada y verificada (D-005); la comprobación de 0.3.0 se
registra en D-007. La actualización del historial necesita prueba en Android.
La prueba física está pendiente y se registra por separado. Los bloqueos históricos de PCB no demuestran que
el equipo físico actual del usuario tenga esos mismos defectos.

Pendientes reales: comprobar APK con dispositivo, TalkBack/voz, escalado y uso en
campo; validar sensores y recomendaciones con responsables técnicos; implementar
etapas posteriores de backend/IA solo tras cerrar la base. No hay sincronización
ni coordenadas. El doc 09 vigente sustituye los tratamientos del diseño inicial.

Auditoría del repositorio original `github.com/adiacla/refluye`, verificada
mediante clonación, compilación con stubs, extracción de la netlist del PCB,
medición de los STL y lectura completa de los tres documentos Word.

**Estado del repositorio:** HEAD `183ecf1`, 21-ago-2026. Una rama, sin tags, sin
issues, sin pull requests. Cuatro commits, tres de ellos llamados "Primer commit".

---

## Los cuatro bloqueos

Un estudiante que clone el repositorio hoy no puede llegar a un dispositivo
funcionando. Se encuentra cuatro paredes consecutivas:

| # | Bloqueo | Detalle |
|---|---|---|
| **B1** | El firmware V2 no compila | 3 errores en `refluye21.ino` |
| **B2** | El LCD no funcionaría | La PCB lleva SCL al pin `Tx` en vez de GPIO22 |
| **B3** | La temperatura daría −127 | Falta el pull-up de 4.7 kΩ del DS18B20 |
| **B4** | No hay app | `ReFluyeApp/` es un submódulo roto que apunta a un repo externo |

**Ninguno es un problema de diseño.** B1 tiene el arreglo escrito dentro de
`Parte2.docx`. B2 es mover una pista. B3 es una resistencia. B4 es el trabajo
real de este proyecto.

---

## Matriz de contradicciones

Cada columna es internamente coherente; entre sí, no.

| Aspecto | README | Plan | Parte 1 | Parte 2 | Código repo | PCB |
|---|---|---|---|---|---|---|
| Transporte BT | Classic | **BLE** | — | **Classic** | wokwi=BLE, 21=Classic | — |
| Formato datos | JSON | **JSON** | — | **texto** | wokwi=JSON, 21=texto | — |
| Nombre equipo | `ReFluye-V2` | `RE-FLUYE-01` | — | `ReFluye-V2` | ambos | — |
| `ESTADO:` | — | — | — | texto | número | — |
| Pulsadores | GPIO 13/14/27 | — | D5/D3/D4 | GPIO 13/14/27 | **ninguno** | **ninguno** |
| Pin ORIGEN V1 | D5 | D2 | D5 | — | **D2** | — |
| Fórmula sTU | `100−Turb` ❌ | — | `100−Turb` ❌ | `100−Turb/2` ✅ | `/2` ✅ | — |
| Fórmula sTD | `100−TDS/10` ❌ | — | `100−TDS/10` ❌ | `100−TDS/20` ✅ | `/20` ✅ | — |
| Pantalla | LCD | OLED opc. | LCD | LCD | wokwi=OLED, 21=LCD | LCD |
| SCL | GPIO22 | GPIO22 | — | GPIO22 | `Wire.begin(21,22)` | **Tx** ❌ |
| Framework app | App Inventor | App Inventor | — | App Inventor | **React Native** | — |
| Archivo a abrir | `re_fluye_esp32.ino` **(no existe)** | ok | — | — | — | — |

**Causa raíz:** la fuente de verdad son los `.docx`, no el código. Las versiones
sanas del firmware viven dentro de documentos de Word; los `.ino` del repositorio
son copias degradadas. El flujo fue *escribir el manual → pegar el código en el
manual → exportar al repo*, y en el último paso se perdió calidad sin que nada lo
detectara, porque no hay compilación automática.

---

## Defectos verificados

### Firmware

| ID | Archivo | Defecto | Verificación |
|---|---|---|---|
| D1 | `refluye21.ino:90` | `133.42pow(...)` — falta `*` (×2) | `error: unable to find numeric literal operator 'operator""pow'` |
| D2 | `refluye21.ino:114-115` | Palabras sueltas `code` / `Code` | `error: 'code' was not declared in this scope` |
| D3 | `refluye21.ino` | Indentación perdida en todo el archivo | Inspección |
| D4 | `refluye21.ino` | `requestTemperatures()` fuera del bloque temporizado | Bloquea ~750 ms por iteración |
| D5 | `refluye21.ino` | Sin promediado de ADC | Una sola `analogRead()` por sensor |
| D6 | `refluye_esp32_wokwi.ino:242` | `analogRead * (5.0/4095)` | La referencia del ADC es 3.3 V, no 5 V |
| D7 | `refluye_esp32_wokwi.ino` | No aplica `DIV_FACTOR` | Incoherente con `refluye21.ino` |
| D8 | `refluye_esp32_wokwi.ino` | JSON de ~90 B por BLE notify | Se trunca a 20 B con MTU por defecto |
| D9 | ambos ESP32 | `raw*3.3/4095` ignora no linealidad del ADC | Error ±100–200 mV ≈ ~1 unidad de pH |
| D10 | todos | Sub-índices del ICA sin acotar | `sPH(pH=0) = −122` |

### PCB

| ID | Defecto | Consecuencia |
|---|---|---|
| D11 | `J6.4` (SCL) → pin `Tx`; GPIO22 sin conectar | LCD inoperante + conflicto con el puerto serie |
| D12 | Sin pull-up 4.7 kΩ en GPIO4 | DS18B20 devuelve −127 °C |
| D13 | Sin riel de 3.3 V distribuido | No hay dónde conectar el pull-up de D12 |
| D14 | 10 resistencias con `Value = "R"` | Imposible generar BOM o ensamblar |
| D15 | Sin plano de masa; 238 pistas en una cara | Ruido en la señal de pH |
| D16 | `J8` → GPIO16/17 | Sin uso en ningún firmware |

### Documentación

| ID | Defecto |
|---|---|
| D17 | Fórmula del ICA del README y Parte 1 sale de la escala 0–100 |
| D18 | Tabla de verificación `Parte1.docx` §6.5: 3 de 5 escenarios mal calculados |
| D19 | El README manda abrir `re_fluye_esp32.ino`, que no existe |
| D20 | Pinouts contradictorios entre README, Plan y código |
| D21 | La carcasa STL no está documentada en ningún documento |
| D22 | No hay `LICENSE` pese a declarar CC BY-NC-SA 4.0 |

### Higiene del repositorio

| ID | Defecto |
|---|---|
| D23 | `ReFluyeApp/` gitlink roto (modo 160000, sin `.gitmodules`) |
| D24 | Sin `.gitignore` → 17 backups `.zip` de KiCad versionados (1.6 MB) |
| D25 | `UNAB_agua.rar` (2.1 MB) duplica exactamente la carpeta `UNAB_agua/` |
| D26 | `Tapa-Cuerpo (1).stl` idéntico byte a byte a `Tapa-Cuerpo.stl` |
| D27 | Archivo de bloqueo `~UNAB_agua.kicad_sch.lck` versionado |
| D28 | Documentos en `.docx`: no se pueden diffear ni revisar |
| D29 | Nombres de archivo con espacios y paréntesis |
| D30 | Tres commits llamados "Primer commit" |

Entre `.rar`, backups y STL duplicado hay **~4 MB evitables de los ~10 MB** del
repositorio.

### Privacidad

| ID | Asunto |
|---|---|
| **D31** | `WhatsApp Image....jpeg` es una captura de la cotización de la PCB e incluye el **número de teléfono y cuenta Nequi de un proveedor externo**, publicado en un repositorio público sin propósito técnico |

---

## Lo que sí funciona y hay que conservar

No todo es deuda. Estos elementos están bien resueltos y se heredan:

- **La lógica híbrida como concepto.** El "sensor humano" es un aporte genuino,
  no decoración.
- **El olor como veto absoluto.** Decisión de seguridad correcta.
- **Los divisores de voltaje**, correctamente implementados en los tres canales
  de la PCB.
- **El mapeo de LEDs** PCB ↔ firmware, exacto.
- **La elección de ADC1** para los sensores con Bluetooth activo.
- **Los rangos normativos**, anclados a fuentes reales y citadas.
- **`refluye_app_logica.txt`**: 9 reglas con textos de recomendación completos,
  5 pantallas, paleta de colores. Es la especificación funcional más completa que
  existe y es directamente portable.
- **La documentación didáctica de `Parte2.docx`**: divisor de voltaje, regla
  ADC1/ADC2, procedimiento de calibración y tabla de diagnóstico de 10 síntomas.
- **La planificación**: fases, BOM con precios locales en COP, matriz de riesgos,
  presupuesto ($343.000–$570.000 COP).

---

## Riesgos heredados del plan original

De la matriz de riesgos de `ReFluye_Plan_Proyecto.docx`, los que siguen vigentes
y afectan al diseño de la app:

| Riesgo | Prob. | Impacto | Cómo lo aborda la nueva app |
|---|---|---|---|
| **Calibración imprecisa de pH** | **ALTA** | **ALTO** | Flujo de calibración guiado en la app + estado de calibración visible + advertencia si está vencida |
| Sensores erróneos en agua turbia | ALTA | MEDIO | Criterio de estabilización antes de capturar (doc 03) |
| Rechazo por parte de campesinos | MEDIA | ALTO | Diseño de UI/UX específico para el contexto (doc 08) |
| Interferencia Bluetooth | MEDIA | MEDIO | Reconexión automática + estados de conexión explícitos |
| Batería insuficiente | MEDIA | MEDIO | Fuera del alcance de la app; documentado |
| Daño por humedad | BAJA | ALTO | Fuera del alcance de la app |

El primero es el más relevante: **es el riesgo mejor identificado del proyecto
original y el que menos se atendió.** La app es el lugar natural para resolverlo.

---

## Plan de saneamiento sugerido para el repo original

Independiente del desarrollo de la app, si se quiere dejar el repositorio en
estado replicable:

1. Portar el firmware sano desde `Parte2.docx` §6.1 y aplicar los cambios de V2.1
2. Añadir `LICENSE` (CC BY-NC-SA 4.0) y `.gitignore`
3. Eliminar `.rar`, los 17 zips de backup, el `.lck` y el STL duplicado
4. Resolver o eliminar el gitlink `ReFluyeApp/`
5. Quitar o recortar la imagen con datos del proveedor (D31)
6. Corregir la fórmula del ICA en README y Parte 1
7. Corregir la tabla de verificación §6.5
8. Reorganizar en `firmware/`, `hardware/`, `docs/`, `app/`
9. Convertir los `.docx` a Markdown
10. Corregir la net del SCL y añadir el pull-up en KiCad
