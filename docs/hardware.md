# Hardware: componentes, costos y cómo conectar el ESP32

Esta guía es para quien quiere **construir su propio RE-FLUYE**: un estudiante,
un docente o un técnico. No necesitas experiencia previa, pero si es tu primera
vez con electrónica, hazlo acompañado.

> **Antes de empezar:** RE-FLUYE mide pH, turbidez, sólidos disueltos y
> temperatura. **No detecta bacterias, virus ni parásitos**, que son la causa
> principal de las enfermedades por agua. Nunca certifica que un agua se pueda
> beber.

## Qué hace cada pieza

```
 Sondas en el agua ──► ESP32 ──► Bluetooth ──► Teléfono Android (app RE-FLUYE)
   pH, turbidez,       mide y      cada 1,5 s     combina con lo que observas
   sólidos, temp.      transmite                  y te dice qué hacer
```

| Pieza | Para qué sirve |
|---|---|
| **ESP32 DevKit v1** | El cerebro. Lee los sensores y envía los datos por Bluetooth. No decide nada sobre el agua |
| **Kit de pH (SEN0161)** | Mide qué tan ácida o alcalina es el agua (0 a 14; 7 es neutro) |
| **Sensor de turbidez (SEN0189)** | Mide cuántas partículas flotan en el agua, en NTU |
| **Sensor de sólidos disueltos (SEN0244)** | Estima sales y minerales disueltos, en ppm |
| **Sonda DS18B20** | Mide la temperatura, en °C |
| **Divisores de voltaje** | Bajan la señal de 5 V de los sensores a 3,3 V para no quemar el ESP32 |
| **LCD y LED** | Muestran el estado del equipo. **No dicen si el agua sirve**: eso lo hace la app |

## Costos

Precios de tiendas colombianas, **noviembre de 2026**. Lista completa en
[materiales.csv](materiales.csv).

| Componente | Costo (COP) | Dónde comprar |
|---|---|---|
| ESP32 DevKit de 38 pines | 27.000 – 39.500 | Mercado Libre · Electronilab |
| Kit de pH DFRobot SEN0161 | 178.500 – 238.000 | Sigma Electrónica |
| Sensor de turbidez SEN0189 | 45.344 | Didácticas Electrónicas |
| Sensor de sólidos disueltos SEN0244 | 61.575 | Didácticas Electrónicas |
| Sonda de temperatura DS18B20 | 9.900 | Electronilab |
| **Total del núcleo electrónico** | **322.319 – 394.319** | |

Además necesitas, con precio aún por confirmar: pantalla LCD I2C 16×2,
resistencias (3 de 10 kΩ, 3 de 20 kΩ, 1 de 4,7 kΩ y 3 de 220 Ω), 3 LED, 2
protoboards, cables, una carcasa y soluciones buffer de pH 4,0 y 7,0 para
calibrar.

Para comparar: un análisis de laboratorio completo de **una sola muestra**
cuesta $1.204.399 (Cornare, 2022). RE-FLUYE no lo reemplaza: lo complementa
midiendo todos los días.

## Cómo conectar el ESP32

### 1. Por qué hay divisores de voltaje

Los sensores de pH, turbidez y sólidos funcionan a 5 V, y su señal puede
llegar a 5 V. Los pines del ESP32 aguantan **máximo 3,3 V**: conectarlos
directo destruye el pin. Cada señal pasa por un divisor:

```
señal del sensor ──[ 10 kΩ ]──┬──► pin del ESP32
                              │
                           [ 20 kΩ ]
                              │
                             GND

Vpin = Vsensor × 20 / (10 + 20) = Vsensor × 0,667     →  5,0 V × 0,667 = 3,33 V
```

El firmware multiplica por 1,5 para recuperar el valor real. Con 5,0 V de
entrada el divisor da 3,33 V, **justo en el límite**: mide con multímetro antes
de conectar el ESP32.

### 2. Tabla de pines

| GPIO | Conexión | Nota |
|---|---|---|
| 34 | Señal de pH (por divisor) | Solo entrada |
| 35 | Señal de turbidez (por divisor) | Solo entrada |
| 32 | Señal de sólidos disueltos (por divisor) | |
| 4 | DATA del DS18B20 | Resistencia de 4,7 kΩ entre DATA y **3,3 V** (nunca 5 V) |
| 21 | SDA del LCD | |
| 22 | SCL del LCD | |
| 26 | LED verde (220 Ω en serie) | App conectada |
| 25 | LED amarillo (220 Ω en serie) | Parpadea al medir |
| 33 | LED rojo (220 Ω en serie) | Un sensor está en el límite o no responde |

Los tres sensores analógicos **deben** ir a los pines 32–39 (bloque ADC1):
el bloque ADC2 deja de funcionar cuando el Bluetooth está encendido.

### 3. Pasos

1. Desconecta toda alimentación.
2. Une dos protoboards por el lado largo y pon el ESP32 en el medio. Una sola
   protoboard no deja huecos libres a ambos lados del ESP32 de 38 pines.
3. Arma los tres divisores de voltaje.
4. Conecta pH al GPIO 34, turbidez al 35 y sólidos al 32, cada uno por su divisor.
5. Conecta el DS18B20: DATA al GPIO 4 y la resistencia de 4,7 kΩ entre DATA y 3,3 V.
6. Conecta el LCD: SDA al 21 y SCL al 22.
7. Conecta los LED a los GPIO 26, 25 y 33, cada uno con su resistencia de 220 Ω.
8. Une todas las tierras (GND) en un punto común.
9. Energiza solo los sensores y mide con multímetro la salida de cada divisor.
   Ninguna debe superar 3,3 V.

### 4. Cargar el firmware

1. Instala [Arduino IDE](https://www.arduino.cc/en/software) y agrega el paquete
   **ESP32 de Espressif, versión 2.0.17** desde el gestor de placas.
2. En el gestor de librerías instala **LiquidCrystal I2C**, **OneWire** y
   **DallasTemperature**. `BluetoothSerial` viene con el paquete ESP32.
3. Abre [`firmware/refluye_v2/refluye_v2.ino`](../firmware/refluye_v2/refluye_v2.ino),
   elige la placa **ESP32 Dev Module** y el puerto USB.
4. Compila y carga. Abre el monitor serie a **115200 baudios**: deben aparecer
   los valores de los cuatro sensores.
5. Comprueba el Bluetooth con una app de terminal serie (por ejemplo *Serial
   Bluetooth Terminal*). Busca **ReFluye-V2**; si pide PIN, usa **1234**. Cada
   1,5 segundos debe llegar un bloque que termina en `---`
   ([formato completo](protocolo-bluetooth.md)).

Si prefieres la terminal, la integración continua compila así:

```sh
arduino-cli core install esp32:esp32@2.0.17 --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli lib install "LiquidCrystal I2C" OneWire DallasTemperature
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/refluye_v2
```

### 5. Calibrar el pH

El firmware trae valores genéricos (`PH_SLOPE = 3.5`, `PH_OFFSET = 0.0`) que no
sirven para tu sonda: **cada electrodo es distinto** y es la mayor fuente de
error del sistema.

1. Enjuaga el electrodo con agua destilada.
2. Sumérgelo en buffer pH 7,0 y espera 1–2 minutos. Ajusta el potenciómetro de
   la placa azul hasta leer 7,0.
3. Enjuaga y sumérgelo en buffer pH 4,0. Si la lectura se desvía más de ±0,2,
   ajusta `PH_SLOPE` en el firmware y vuelve a cargarlo.
4. Repite hasta que ambos buffers queden dentro de ±0,2.
5. Registra la calibración en la app: **Mi equipo → Registrar calibración
   realizada**, con fecha real. La app la muestra como *declarada*: guarda lo
   que escribes, pero no puede comprobar la sonda.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| Temperatura `-127` | Falta la resistencia de 4,7 kΩ o la sonda no responde. No es la temperatura del agua |
| LCD en blanco | SCL no llega al GPIO 22. Puedes seguir: la app es la pantalla confiable |
| No aparece *ReFluye-V2* en el teléfono | Revisa alimentación y que el firmware haya cargado |
| El ESP32 se calienta | Corto o riel mal conectado. Desconecta de inmediato |
| LED rojo encendido | Un sensor llegó al límite de su escala (pH 0 o 14, turbidez 200, sólidos 2000) o la temperatura no responde |

## Límites de los sensores

| Sensor | Límite |
|---|---|
| Sólidos disueltos SEN0244 | Rango validado del fabricante: **0 a 1000 ppm**. No lo uses en agua a 55 °C o más. No compensa temperatura |
| pH | Se descalibra con el uso. No dejes secar el electrodo ni frotes el bulbo |
| Turbidez | La ventana óptica debe estar limpia y sin rayas |
| DS18B20 | Solo el extremo encapsulado es sumergible |

## La PCB del proyecto original

Existe una placa de una cara (77,8 × 73,8 mm, cotizada en $48.000 COP) con dos
defectos que debes corregir antes de energizarla:

- **P1:** el SCL del LCD va al pin Tx en vez del GPIO 22 → el LCD no funciona.
- **P2:** falta la resistencia de 4,7 kΩ del DS18B20 → la temperatura llega como `-127`.

Revisa la placa contra la tabla de pines. Detalle técnico en
[contexto/02-hardware-y-firmware.md](contexto/02-hardware-y-firmware.md).
