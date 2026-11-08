# 03 · Protocolo Bluetooth — contrato normativo

> **Este documento es normativo.** Es la única fuente de verdad del formato de
> datos entre el dispositivo y la app. Firmware y aplicación deben ajustarse a
> él, no al revés. Cualquier cambio aquí es un cambio de versión del protocolo.

## Por qué existe este documento

### Compatibilidad de recepción en la app 0.3.1

El firmware nuevo mantiene `ESTADO:0/1/2`. Para recibir equipos anteriores, la
app tolera `ESTADO` textual y un ICA auxiliar ilegible: los registra como avisos,
sin invalidar los sensores. No traduce esas etiquetas a un permiso de uso. El
motor calcula su propio índice y decisión. Los errores de sensores y de `VER`
siguen bloqueando el análisis, pero no ocultan los demás valores en vivo.

Cada trama cerrada con `---` actualiza la pantalla inmediatamente, sin exigir
estabilidad ni calibración para visualizar. Se conservan hasta 60 tramas en
memoria para las curvas; se cortan en valores inválidos y huecos de cinco
segundos. Una lectura con más de cinco segundos o una desconexión deja de
presentarse como actual. La captura para análisis sigue siendo una sola trama
íntegra y reciente, nunca una mezcla de sensores de momentos distintos.

El panel «Ver datos recibidos por Bluetooth» muestra la última trama, hora,
cantidad retenida y avisos para diagnóstico. Este arreglo no requiere cambiar
el firmware del prototipo que envía `ESTADO` textual.

El repositorio original tiene **tres protocolos incompatibles** circulando al
mismo tiempo:

| Fuente | Transporte | Formato |
|---|---|---|
| `refluye_esp32_wokwi.ino` | BLE (GATT notify) | JSON `{"pH":6.8,...}` |
| `refluye21.ino` | Bluetooth Classic | Texto `pH:6.80\n`, `ESTADO:` numérico |
| `Parte2.docx` §6.1 y §7.2 | Bluetooth Classic | Texto `pH:6.80\n`, `ESTADO:` **textual** |
| `refluye_app_logica.txt` | Bluetooth Classic | Parsea **JSON** |

Ninguna combinación de tres piezas funciona junta. La causa raíz es que nunca
hubo un contrato escrito. Este documento lo cierra.

---

## Decisiones

**Transporte: Bluetooth Classic (SPP / RFCOMM).**
Es lo que el ESP32 ya emite con `BluetoothSerial`. Evita migrar a BLE y su
problema de truncamiento de MTU (un JSON de ~90 bytes se corta a 20 con el MTU
por defecto de 23). Consecuencia aceptada: **una app web no podrá conectarse
nunca** — los navegadores solo hablan BLE. Si algún día se quiere web, hay que
añadir BLE en paralelo, no reemplazar.

**Formato: líneas de texto `CLAVE:valor`, no JSON.**
Contra la intuición, es la decisión correcta aquí:
- Es tolerante a truncamiento: si se pierde una línea, las demás siguen siendo
  válidas. Un JSON partido se pierde entero.
- Es legible en cualquier terminal serie (`Serial Bluetooth Terminal`), lo que
  hace el diagnóstico en campo posible sin la app.
- No requiere librería de parsing en el firmware.

**`ESTADO:` es numérico.**
`0`/`1`/`2` en vez de texto. Motivos: independiente del idioma, no rompe si se
cambia una etiqueta, y no obliga a comparar cadenas con tildes. La app traduce
el número a texto localizado.

---

## Identidad del dispositivo

| Campo | Valor |
|---|---|
| Nombre Bluetooth | `ReFluye-V2` |
| PIN de emparejamiento | `1234` |
| Perfil | SPP (Serial Port Profile) |
| Cadencia de emisión | Una trama cada **1500 ms** |
| Dirección | **Unidireccional.** El dispositivo emite; no acepta comandos |

---

## Formato de la trama

Una trama es un bloque de **siete líneas**, terminadas en `\r\n`, cerrado por el
marcador `---`.

```
ESTADO:<0|1|2>
ICA:<float, 1 decimal>
pH:<float, 2 decimales>
TDS:<float, 0 decimales>
TURB:<float, 0 decimales>
TEMP:<float, 1 decimal>
---
```

Ejemplo real:

```
ESTADO:0
ICA:87.3
pH:7.41
TDS:145
TURB:12
TEMP:24.5
---
```

### Semántica de cada campo

| Clave | Unidad | Rango válido | Significado |
|---|---|---|---|
| `ESTADO` | — | `0`, `1`, `2` | Preclasificación del hardware: 0=excelente, 1=condicionada, 2=no apta. **Solo por sensores** |
| `ICA` | 0–100 | `0.0`–`100.0` | Índice de calidad calculado en el dispositivo |
| `pH` | — | `0.00`–`14.00` | Potencial de hidrógeno |
| `TDS` | ppm | `0`–`2000` | Sólidos totales disueltos |
| `TURB` | NTU | `0`–`200` | Turbidez |
| `TEMP` | °C | `-55.0`–`125.0` | Temperatura. **`-127.0` = sensor desconectado** |

### Regla fundamental sobre `ESTADO` e `ICA`

Ambos son **preclasificación del hardware, calculada solo con sensores**. La app
**no debe mostrarlos como veredicto**. El veredicto final lo calcula la app
cruzando estos valores con las tres observaciones humanas.

Sirven para dos cosas legítimas: mostrar el ICA como dato numérico secundario, y
detectar discrepancias (si el equipo dice 0 y la app concluye 2, es porque la
observación humana degradó el resultado — y eso es exactamente el
funcionamiento esperado).

---

## Reglas de parsing para la app

1. **Acumular en un buffer hasta encontrar `---`.** Solo entonces procesar. Una
   trama sin marcador de cierre está incompleta y se descarta.
2. **Separar cada línea por el primer `:`.** El resto es el valor. Si una línea
   no tiene `:`, ignorarla sin fallar.
3. **Tolerar líneas faltantes.** Si una trama trae cinco de seis claves, usar las
   que llegaron y marcar las ausentes como `null`. Nunca abortar la trama entera.
4. **Tolerar claves desconocidas.** Una versión futura del firmware puede añadir
   campos; la app debe ignorarlos silenciosamente, no romperse.
5. **Descartar el búfer si crece más de 4 KB sin cerrar.** Protege contra basura
   en la línea serie.
6. **Validar rangos y marcar, no corregir.** Un pH de 15 no se recorta a 14: se
   marca la lectura como sospechosa y se avisa al usuario.
7. **Tratar `TEMP:-127.0` como ausencia de sensor**, nunca como temperatura.

### Estado de la conexión

La app debe distinguir tres estados y mostrarlos distinto:

| Estado | Condición | Qué ve el usuario |
|---|---|---|
| Conectado y recibiendo | Trama completa hace < 5 s | Valores en vivo |
| Conectado sin datos | Socket abierto, sin trama hace > 5 s | "Esperando datos del equipo…" |
| Desconectado | Socket cerrado | "Equipo desconectado" + botón reconectar |

**Timeout de datos: 5 segundos** (más de tres cadencias perdidas). El dispositivo
emite cada 1.5 s, así que una sola trama perdida es normal y no debe alarmar.

---

## Captura inicial y estabilidad temporal

La app 0.3.0 puede orientar desde la primera trama completa, reciente y sin
errores de pH, turbidez y TDS. La etiqueta **lectura inicial** avisa que los
valores pueden cambiar y el resultado no autoriza consumo. Conviene mantener las
sondas sumergidas y repetir la lectura para observar su evolución.

**Criterio de estabilidad:** el pH no varía más de **±0.05** y el TDS no varía
más de **±5 %** durante **cuatro tramas consecutivas** (≈6 s), con intervalos
entre 750 y 5000 ms. Cuando se cumple, la captura queda marcada `estable`.
La estabilidad indica repetibilidad en ese intervalo, no exactitud ni inocuidad;
requiere calibración vigente y no detecta microorganismos.

Esta distinción permite una orientación temprana sin ocultar la incertidumbre de
medir demasiado rápido.

---

## Cambios obligatorios en el firmware

Para cumplir este contrato, sobre la versión sana de `Parte2.docx` §6.1:

1. Aplicar los tres cambios intencionales de V2.1 (quitar pulsadores, sacar la
   lógica híbrida, `ESTADO:` numérico).
2. Corregir las tres regresiones (`* pow`, borrar `code`/`Code`, reindentar).
3. Mover `requestTemperatures()` dentro del bloque temporizado (defecto F1).
4. Promediar 10 lecturas de ADC por sensor (F2).
5. Cambiar a `analogReadMilliVolts()` (F3).
6. Acotar los sub-índices del ICA a 0–100 (F4).
7. **Añadir una línea `VER:` al inicio de la trama** (ver abajo).

---

## Versionado del protocolo

La trama actual no dice qué versión habla. Eso hace imposible evolucionar sin
romper apps instaladas. Se añade una línea al inicio:

```
VER:1
ESTADO:0
...
---
```

**Contrato de compatibilidad:**

- Ausencia de `VER:` ⇒ la app asume `VER:0` (firmware antiguo) y funciona en modo
  compatible.
- Añadir campos nuevos **no** incrementa la versión mayor: los lectores antiguos
  los ignoran (regla 4 de parsing).
- Cambiar el significado o la unidad de un campo existente **sí** la incrementa.
- La app debe advertir, sin bloquear, si la versión del firmware es mayor que la
  que conoce: *"Este equipo usa una versión más nueva. Actualiza la aplicación."*

---

## Extensión futura (VER:2, no implementar todavía)

Documentada aquí para que el diseño actual no la imposibilite:

```
VER:2
SERIE:<id único del equipo>        ← trazabilidad por dispositivo
CALIB:<timestamp última calibración>  ← ¿está calibrado?
BAT:<porcentaje>                    ← nivel de batería
```

`SERIE` y `CALIB` son los dos campos que convertirían los datos en material
utilizable para machine learning: sin saber qué equipo midió y cuándo se calibró,
un dataset de calidad de agua no es entrenable con garantías. Ver
`app/11-datos-y-backend.md`.
