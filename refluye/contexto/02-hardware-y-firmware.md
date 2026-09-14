# 02 · Hardware y firmware

Todo lo de este documento está verificado contra el repositorio original: código
compilado, netlist del PCB extraída y geometría de los STL medida.

## El dispositivo

**Microcontrolador:** ESP32 DevKit v1 (38 pines). Dual-core 240 MHz, ADC de 12
bits (0–4095), lógica de **3.3 V**, Bluetooth Classic y BLE integrados.

**Sensores:**

| Parámetro | Sensor | Salida | Alimentación |
|---|---|---|---|
| pH | DFRobot pH Meter V1.1 (electrodo de vidrio) | Analógica hasta 5 V | 5 V |
| Turbidez | DFRobot SEN0189 | Analógica hasta 4.5 V | 5 V |
| TDS | DFRobot Gravity TDS Meter V1.0 | Analógica | 5 V |
| Temperatura | DS18B20 sumergible IP67 | Digital 1-Wire | 3.3–5 V |

**Salidas:** LCD 16x2 I2C, tres LEDs indicadores (verde/amarillo/rojo).

## El divisor de voltaje: por qué existe

Los sensores DFRobot se alimentan a 5 V y su señal puede llegar a 5 V. Los pines
del ESP32 toleran **máximo 3.3 V**. Conectarlos directo destruye el pin.

Por eso cada línea analógica pasa por un divisor resistivo R1=10 kΩ (del sensor
al GPIO) y R2=20 kΩ (del GPIO a GND):

```
Vout = Vin × R2/(R1+R2) = Vin × 0.667
5.0 V × 0.667 = 3.33 V

En el firmware se recupera el valor real:
Vsensor = Vadc / 0.667 = Vadc × 1.5      → DIV_FACTOR = 1.5
```

**Regla crítica del ESP32:** el bloque ADC2 no funciona cuando el Bluetooth o el
WiFi están activos. Todos los sensores analógicos deben ir a pines de **ADC1**
(GPIO 32–39). El proyecto usa GPIO 34, 35 y 32, que es correcto.

## Asignación de pines

| GPIO | Función | Notas |
|---|---|---|
| 34 | pH (ADC1) | Solo entrada. Vía divisor |
| 35 | Turbidez (ADC1) | Solo entrada. Vía divisor |
| 32 | TDS (ADC1) | Vía divisor |
| 4 | DS18B20 (1-Wire) | Requiere pull-up 4.7 kΩ a 3.3 V |
| 21 / 22 | I2C del LCD (SDA / SCL) | Ver defecto de PCB abajo |
| 26 / 25 / 33 | LED verde / amarillo / rojo | Resistencia 220 Ω en serie |

## Las seis versiones del firmware

El repositorio original contiene seis variantes del firmware. **Dos de ellas solo
existen dentro de los documentos Word y no están como archivos.** Esto importa
porque la versión sana del firmware V2 es una de esas.

| Ver. | Dónde vive | Plataforma | Estado |
|---|---|---|---|
| A | Dentro de `Parte1.docx` §4.3 | Uno (Tinkercad) | Sano |
| B | Dentro de `Parte1.docx` §5.6 | Uno + DHT11 | Sano |
| C | `refluye_tinkercad.ino` | Uno | Compila |
| D | `refluye_esp32_wokwi.ino` | ESP32 + **BLE** + JSON | Compila, con defectos |
| **E** | Dentro de **`Parte2.docx` §6.1** | ESP32 + BT Classic | **Sano — referencia** |
| F | `refluye21/refluye21.ino` | ESP32 + BT Classic | **No compila** |

### La regresión V2.0 → V2.1

`refluye21.ino` (F) es una edición posterior de la versión E del documento. El
diff, verificado línea por línea, se separa en dos grupos.

**Cambios intencionales — la evolución correcta del diseño:**

1. Se eliminaron los tres pulsadores físicos (GPIO 13/14/27). Las observaciones
   humanas pasan a capturarse en la app.
2. La lógica híbrida sale del firmware: el ESP32 ya no evalúa `hueleRaro` ni
   `visualTurbia`, solo clasifica por sensores.
3. `ESTADO:` pasó de enviar texto (`EXCELENTE`) a enviar número (`0`).

Esta es la migración de *dispositivo autónomo* a *sensor remoto*, y es la
arquitectura correcta cuando hay una app. **La conservamos.**

**Regresiones accidentales — lo que se rompió en el traslado:**

| Línea | V2.0 (documento) | V2.1 (repo) |
|---|---|---|
| 90 | `133.42 * pow(v,3) - 255.86 * pow(v,2)` | `133.42pow(v,3) - 255.86pow(v,2)` |
| 114–115 | *(no existen)* | `code` / `Code` — basura de copy-paste |
| todo | Indentación de 2 espacios | Indentación perdida por completo |

Verificado con compilador (stubs de las librerías Arduino):

```
V2.0 (documento) → 0 errores
V2.1 (repo)      → 3 errores:
  error: unable to find numeric literal operator 'operator""pow'   (×2)
  error: 'code' was not declared in this scope
```

**Conclusión operativa:** el arreglo no hay que escribirlo, hay que portarlo
desde `Parte2.docx` §6.1 y volver a aplicarle encima los tres cambios
intencionales.

## Defectos conocidos del firmware

Más allá de los errores de compilación, hay problemas que sí requieren decisión:

| # | Problema | Efecto | Corrección |
|---|---|---|---|
| F1 | `requestTemperatures()` fuera del bloque temporizado | Bloquea ~750 ms en cada iteración del loop | Moverlo dentro del `if (millis() - tUpdate > 1500)` |
| F2 | Una sola `analogRead()` por sensor, sin promediar | Lecturas ruidosas; el pH es especialmente sensible | Promediar N=10 muestras y descartar extremos |
| F3 | `raw * 3.3/4095` ignora la no linealidad del ADC | Error típico ±100–200 mV ≈ casi una unidad de pH | Usar `analogReadMilliVolts()` (calibración de fábrica del eFuse) |
| F4 | Sub-índices del ICA sin acotar individualmente | `sPH` puede valer −122 y arrastrar el índice | `constrain(s, 0, 100)` en cada sub-índice |
| F5 | Calibración de pH hardcodeada (`PH_SLOPE = 3.5`) | Cada electrodo es distinto; sin calibrar el valor es decorativo | Persistir en NVS/Preferences y calibrar desde la app |
| F6 | `ESTADO:` numérico vs textual sin definir | La app no sabe qué parsear | Fijarlo en el protocolo (doc 03) |

## La PCB

Diseñada en KiCad 8. **77.8 × 73.8 mm**, 1.6 mm, declarada de 2 capas pero con
las 238 pistas en `B.Cu`: es de **una sola cara**. Sin vías, sin plano de masa,
ancho uniforme de 0.6 mm. Ya fue cotizada para fabricación ($48.000 COP).

**Lo que está bien:** los tres divisores de voltaje están correctamente
implementados, y el mapeo de los LEDs coincide exactamente con el firmware.

### Defectos verificados en la netlist

| # | Defecto | Consecuencia |
|---|---|---|
| **P1** | **`J6.4` (SCL del LCD) va al pin `Tx`, no a GPIO22** | El LCD I2C no funciona. Además choca con `Serial.begin(115200)`, que usa ese pin |
| **P2** | **Sin pull-up de 4.7 kΩ en GPIO4** | El bus 1-Wire queda flotante → el DS18B20 devuelve **−127 °C** |
| P3 | No hay riel de 3.3 V distribuido | No hay de dónde tomar el pull-up de P2 a 3.3 V. El DS18B20 se alimenta a 5 V |
| P4 | Las 10 resistencias tienen `Value = "R"` | No se puede generar BOM ni ensamblar sin adivinar valores |
| P5 | Sin plano de masa | Ruido en la señal de pH, que es de alta impedancia y milivoltios |
| P6 | `J8` conecta GPIO16/17 | Ningún firmware los usa |

**Ironía documentada:** la tabla de diagnóstico de `Parte2.docx` §8.1 lista
*"Temperatura = −127 °C → pull-up ausente"* como primer síntoma. La placa
diseñada por el mismo autor no incluye ese pull-up.

### Implicaciones para la app

La app debe asumir un dispositivo imperfecto:

- **La temperatura puede llegar como `-127`.** Es el código de "sensor
  desconectado" de la librería Dallas. La app debe detectarlo y mostrar
  "temperatura no disponible", nunca −127 °C.
- **El LCD del equipo puede estar en blanco.** La app es la única interfaz
  confiable. No se puede pedir al usuario "compare con lo que dice la pantalla".
- **El pH puede estar descalibrado.** La app debe poder advertirlo y ofrecer el
  flujo de calibración.

## La carcasa

Dos archivos STL: cuerpo de **90 × 210 × 25 mm** y tapa de 90 × 210 × 9.5 mm.
Están duplicados en el repositorio (`Tapa-Cuerpo.stl` y `Tapa-Cuerpo (1).stl` son
idénticos byte a byte).

**No están documentados en ningún lado.** El BOM del plan presupuesta una caja
IP65 *comprada* de 12×8×5 cm, que no corresponde con estas dimensiones. Es un
componente huérfano: existe el diseño, no existe la documentación.

## Resumen para quien va a programar la app

- El transporte es **Bluetooth Classic SPP**, nombre `ReFluye-V2`, PIN `1234`.
- Emite una trama cada **1.5 s** mientras esté encendido. No acepta comandos.
- Los valores pueden venir fuera de rango o con el sensor desconectado.
- El equipo puede no tener pantalla funcional.
- La calibración del pH es la mayor fuente de error del sistema completo.
