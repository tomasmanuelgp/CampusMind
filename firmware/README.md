# Firmware Re-Fluye

## `refluye_v2/refluye_v2.ino` — V2.2

Firmware de referencia para el ESP32. Verificado: **compila sin errores**.

### Procedencia

Construido a partir de la versión **V2.0 sana** que vive dentro de
`Re-Fluye_V2_ESP32_Guia_Tecnica_parte2.docx` §6.1 del repositorio original —no
del `.ino` publicado, que es una copia degradada que no compila.

Sobre esa base se aplicaron:

**Los tres cambios intencionales de la V2.1** (la evolución correcta del diseño):
- Sin pulsadores físicos: las observaciones humanas las captura la app
- La lógica híbrida sale del firmware: el ESP32 solo preclasifica por sensores
- `ESTADO:` numérico en vez de textual

**Las correcciones F1–F4** (`refluye/contexto/02-hardware-y-firmware.md`):
- **F1** — `requestTemperatures()` con `setWaitForConversion(false)` y pedido
  adelantado: deja de bloquear ~750 ms por iteración
- **F2** — promediado de 10 muestras por sensor
- **F3** — `analogReadMilliVolts()` en vez de `raw*3300/4095`: aplica la
  calibración de fábrica del ADC, que no es lineal
- **F4** — cada sub-índice del ICA acotado a 0–100

**El protocolo versionado** (`refluye/contexto/03-protocolo-bluetooth.md`):
- Línea `VER:1` al inicio de cada trama

### Los tres errores que se corrigieron

El archivo `refluye21/refluye21.ino` del repositorio original no compila:

```
error: unable to find numeric literal operator 'operator""pow'   (línea 90, ×2)
error: 'code' was not declared in this scope                     (línea 110)
```

Causa: al editar la V2.0 para producir la V2.1, el código pasó por un editor que
comió la indentación, perdió dos operadores `*` (`133.42pow(...)`) y dejó
pegadas las palabras sueltas `code` y `Code`.

### Librerías

Instalar desde el Gestor de Librerías del Arduino IDE:

- `LiquidCrystal_I2C` (Frank de Brabander)
- `OneWire` (Paul Stoffregen)
- `DallasTemperature` (Miles Burton)
- `BluetoothSerial` — incluida en el paquete ESP32

Placa: **ESP32 Dev Module**. Monitor serie a **115200** baudios.

### Salida esperada

```
VER:1
ESTADO:0
ICA:87.3
pH:7.41
TDS:145
TURB:12
TEMP:24.5
---
```

Cada 1.5 s, por Bluetooth Classic. Dispositivo `ReFluye-V2`, PIN `1234`.
Verificable con la app *Serial Bluetooth Terminal* antes de tener la app.

---

## ⚠️ Defectos de la PCB que afectan al firmware

La placa fabricada tiene dos defectos verificados en su netlist que el firmware
no puede resolver por software:

| Defecto | Efecto | Solución |
|---|---|---|
| **P1** — `J6.4` (SCL del LCD) ruteado al pin `Tx` en vez de GPIO22 | El LCD I2C no funciona. Además choca con `Serial.begin(115200)` | En protoboard, cablear SCL a GPIO22. En la placa, corregir la pista |
| **P2** — Sin pull-up de 4.7 kΩ en GPIO4 | El DS18B20 devuelve `-127` | Añadir la resistencia entre DATA y **3.3 V** (nunca a 5 V) |

El firmware ya trata `-127` correctamente (muestra `--C` en el LCD y lo
transmite tal cual para que la app lo interprete como sensor ausente).

## Calibración

`PH_SLOPE = 3.5` y `PH_OFFSET = 0.0` son los valores genéricos de DFRobot. **Cada
electrodo es distinto.** Procedimiento en la guía técnica parte 2 §7.3:

1. Limpiar el electrodo con agua destilada
2. Sumergir en buffer pH 7.0, esperar 1–2 minutos
3. Ajustar el potenciómetro de la placa azul hasta leer 7.0
4. Enjuagar, sumergir en buffer pH 4.0
5. Si la desviación supera ±0.2, ajustar `PH_SLOPE`

Es el **riesgo mejor identificado y peor atendido del proyecto original**
(probabilidad ALTA, impacto ALTO en su propia matriz de riesgos). La app debe
guiarlo — ver `refluye/app/12-roadmap.md` fase 5.
