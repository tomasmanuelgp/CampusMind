# RE-FLUYE · Manual técnico del sistema

**Versión de referencia:** aplicación 1.1.0 (versionCode 9), motor de reglas 0.4.0, firmware V2.3, protocolo Bluetooth `VER:1`, esquema de datos v2.

**Fecha:** 9 de noviembre de 2026.

**Público:** personas que construyen, reparan, calibran, programan, prueban o publican RE-FLUYE: soporte técnico, docentes, semilleros, desarrolladores y responsables de calidad.

Este manual reúne en un solo documento todo lo necesario para entender, construir, mantener y desarrollar el sistema: hardware, firmware, protocolo, aplicación, datos, pruebas y publicación. Describe el estado verificable del repositorio [tomasmanuelgp/Refluye](https://github.com/tomasmanuelgp/Refluye) y su relación con el [proyecto original](https://github.com/adiacla/refluye). No es una certificación sanitaria, eléctrica, metrológica ni de resistencia al agua.

**Lo que este equipo no hace:** no detecta bacterias, virus ni parásitos, que son la causa principal de las enfermedades por agua en el campo. Tampoco detecta metales ni la mayoría de los químicos. Por eso ninguna pantalla dice que el agua es «potable» y toda recomendación para beber o cocinar incluye desinfección.

## Contenido

1. Qué es RE-FLUYE y cuáles son sus reglas de seguridad
2. Arquitectura del sistema
3. Estado verificado de cada pieza
4. Hardware: materiales y costos
5. Hardware: conexiones y ensamblaje
6. Hardware: sensores, conversión y límites
7. Hardware: la PCB del proyecto original
8. Calibración y verificación
9. Mantenimiento preventivo
10. Diagnóstico de fallas del equipo
11. Firmware: compilar y cargar
12. Firmware: cómo mide
13. Protocolo Bluetooth
14. Aplicación: tecnologías y estructura
15. Aplicación: pantallas y recorrido
16. Motor de reglas
17. Guías de cuidado y protocolos de tratamiento
18. Datos, privacidad y permisos
19. Entorno de desarrollo
20. Pruebas y calidad
21. Compilar, firmar y publicar la APK
22. Instalar y verificar la APK en un teléfono
23. Seguridad del repositorio
24. Aceptación de una unidad en campo
25. Limitaciones conocidas y trabajo pendiente
26. Hoja de vida del equipo
27. Glosario
28. Fuentes, atribución y licencias

## 1. Qué es RE-FLUYE y cuáles son sus reglas de seguridad

RE-FLUYE es un equipo de bajo costo basado en un ESP32 y una aplicación Android que funcionan juntos y sin internet. El equipo mide cuatro parámetros fisicoquímicos (pH, turbidez, sólidos disueltos y temperatura) y los envía por Bluetooth. La app combina esas lecturas con lo que observa la persona (de dónde viene el agua, cómo huele, cómo se ve y para qué la quiere usar) y entrega una orientación con pasos concretos.

Tres ideas guían todo el diseño:

- **El equipo no detecta patógenos.** Por eso ninguna pantalla dice «potable» y toda recomendación de consumo humano incluye desinfección.
- **Las reglas deciden; nada las ablanda.** El veredicto lo produce un motor determinista y auditable. Una futura capa de IA solo podría explicarlo, nunca contradecirlo.
- **La app funciona completa sin internet.** Conectar, medir, observar, ver el resultado y seguir los pasos no usa la red en ningún momento.

Las restricciones de seguridad S1 a S8 son innegociables. Un cambio que viole cualquiera se rechaza, y varias de ellas tienen pruebas automáticas que lo impiden.

| Regla | Qué exige | Cómo se comprueba |
|---|---|---|
| S1 | Ninguna pantalla dice «potable», «apta» o «segura» a secas | Prueba que recorre todos los textos de la app |
| S2 | Toda recomendación de consumo humano incluye desinfección, aun con ICA 100 | Prueba sobre 2880 combinaciones de datos |
| S3 | El veredicto lo calcula el motor determinista, nunca la IA | Arquitectura: la decisión vive solo en `src/dominio/motor.ts` |
| S4 | El veto por olor extraño no puede anularse por ninguna vía | Prueba de invariantes |
| S5 | El agua verdosa nunca se resuelve solo con «hervir» (toxinas que resisten el calor) | Prueba de invariantes |
| S6 | Toda pantalla de resultado muestra el descargo sobre microbiología | Prueba de invariantes |
| S7 | Calibración vencida o ausente: resultado marcado como no confiable | Prueba de invariantes |
| S8 | La geolocalización requiere consentimiento explícito y revocable | La app actual no recoge ubicación |

## 2. Arquitectura del sistema

```text
Fuente de agua
   │  sondas de pH, turbidez, sólidos disueltos (TDS) y temperatura
   ▼
ESP32 (firmware V2.3)
   │  promedia 10 muestras por canal, convierte a unidades, calcula un ICA auxiliar
   │  LCD y LED: estado del equipo, nunca calidad del agua
   ▼
Bluetooth Classic SPP · trama de texto CLAVE:valor cada 1,5 s
   ▼
App Android RE-FLUYE 1.1.0
   │  parser → monitoreo en vivo → captura de la lectura
   │  + fuente, uso, origen, olor y aspecto que aporta la persona
   │  + calibración declarada del equipo
   ▼
Motor de reglas 0.4.0 (determinista, sin red)
   ▼
Resultado por uso · pasos · protocolo con temporizador · guías de cuidado
   ▼
SQLite en el teléfono (historial, exportación CSV)
```

Reparto de responsabilidades:

| Parte | Hace | No hace |
|---|---|---|
| Equipo (ESP32) | Mide y transmite una trama cada 1,5 s; muestra en el LCD el ICA, el pH y la temperatura | No decide si el agua sirve; no recibe comandos; no guarda datos |
| App | Valida la trama, combina sensores y observación, decide con reglas fijas, guía el tratamiento y guarda el historial | No usa internet en la ruta de medición; no detecta microbios; no calibra la sonda |
| Persona que mide | Aporta lo que los sensores no ven: origen, olor, aspecto y uso | No necesita conocimientos técnicos; puede responder «No sé» |

El campo `ESTADO` y el `ICA` que envía el ESP32 son una **preclasificación por sensores**, no un veredicto. La app vuelve a calcular su propio índice y su decisión con la observación humana y la evidencia de calibración.

## 3. Estado verificado de cada pieza

| Pieza | Ubicación | Estado comprobado |
|---|---|---|
| Firmware V2.3 | `firmware/refluye_v2/refluye_v2.ino` | Compila en la integración continua (núcleo ESP32 2.0.17). Falta validarlo con cada unidad física |
| Protocolo Bluetooth | `docs/protocolo-bluetooth.md` | Contrato `VER:1` normativo; el parser de la app tiene pruebas |
| App Android | `mobile/` | 1.1.0 publicada con firma oficial; pruebas automáticas en cada cambio; 100 % de cobertura en `src/dominio/` |
| APK oficial | [Última publicación](https://github.com/tomasmanuelgp/Refluye/releases/latest) | Firmada con el certificado oficial, con suma SHA-256 publicada. Primera prueba en un Android físico con el equipo, por Bluetooth, informada el 2026-11-09 (v1.0.1); falta completar el guion de aceptación |
| PCB y carcasa originales | Repositorio `adiacla/refluye` | Diseño histórico auditado, con dos defectos conocidos (sección 7) |
| Validación de campo | — | No existe un estudio de laboratorio ni de campo que certifique el sistema |

## 4. Hardware: materiales y costos

Precios de tiendas colombianas de noviembre de 2026. La lista completa, con notas, está en [materiales.csv](../materiales.csv).

| Componente | Cantidad | Costo (COP) | Nota |
|---|---|---|---|
| ESP32 DevKit v1 de 38 pines | 1 | 27.000 – 39.500 | Debe ser un ESP32 original con Bluetooth Classic. No sirven ESP32-C3 ni ESP32-S3 |
| Kit de pH DFRobot SEN0161 | 1 | 178.500 – 238.000 | La pieza más costosa y la que más se desgasta |
| Sensor de turbidez DFRobot SEN0189 | 1 | 45.344 | Salida analógica |
| Sensor de sólidos disueltos DFRobot SEN0244 | 1 | 61.575 | Rango validado por el fabricante: 0 a 1000 ppm |
| Sonda de temperatura DS18B20 sellada | 1 | 9.900 | Versión sumergible con cable |
| **Total del núcleo electrónico** | | **322.319 – 394.319** | |
| Pantalla LCD I2C 16×2 | 1 | Por confirmar | Opcional: la app es la pantalla confiable |
| Resistencias de 10 kΩ y 20 kΩ | 3 y 3 | Por confirmar | Divisores de voltaje |
| Resistencia de 4,7 kΩ | 1 | Por confirmar | Pull-up del DS18B20 a 3,3 V |
| Resistencias de 220 Ω y LED verde, amarillo y rojo | 3 y 3 | Por confirmar | Indicadores de estado |
| Protoboards | 2 | Por confirmar | El ESP32 de 38 pines no cabe en una sola |
| Cables, carcasa | — | Por confirmar | |
| Soluciones buffer pH 4,0 y 7,0 | 1 juego | Por confirmar | Indispensables para calibrar |
| PCB del proyecto original (opcional) | 1 | 48.000 | Tiene los defectos P1 y P2 |

Como referencia, un análisis de laboratorio completo de una sola muestra cuesta $1.204.399 COP (Cornare, 2022). RE-FLUYE no lo reemplaza: permite vigilar el agua todos los días y saber cuándo hace falta el laboratorio.

## 5. Hardware: conexiones y ensamblaje

### 5.1 Por qué hay divisores de voltaje

Los sensores de pH, turbidez y sólidos funcionan a 5 V y su señal puede llegar a 5 V. Los pines del ESP32 aceptan como máximo 3,3 V: conectar la señal directo puede destruir el pin. Cada señal analógica pasa por un divisor de 10 kΩ (arriba) y 20 kΩ (abajo):

```text
señal del sensor ──[ 10 kΩ ]──┬──► pin del ESP32
                              │
                           [ 20 kΩ ]
                              │
                             GND

Vpin = Vsensor × 20 / (10 + 20) = Vsensor × 0,667
Con 5,0 V de entrada: 3,33 V en el pin (justo en el límite)
```

El firmware multiplica la lectura por 1,5 (`DIV_FACTOR`) para recuperar el voltaje original. Como 5,0 V producen 3,33 V, ligeramente por encima del nominal de 3,3 V, **mide con multímetro la salida de cada divisor antes de conectar el ESP32**. Si tu fuente de 5 V entrega más de 5,0 V, el margen desaparece: usa resistencias de 1 % y revisa el riel.

### 5.2 Tabla de pines

| GPIO | Conexión | Nota |
|---|---|---|
| 34 | Señal de pH, por divisor | Solo entrada |
| 35 | Señal de turbidez, por divisor | Solo entrada |
| 32 | Señal de sólidos disueltos, por divisor | |
| 4 | DATA del DS18B20 | Resistencia de 4,7 kΩ entre DATA y **3,3 V**, nunca 5 V |
| 21 | SDA del LCD | I2C |
| 22 | SCL del LCD | I2C |
| 26 | LED verde, con 220 Ω en serie | App conectada |
| 25 | LED amarillo, con 220 Ω en serie | Parpadea en cada medición |
| 33 | LED rojo, con 220 Ω en serie | Algún sensor en el límite o sin respuesta |

Los tres sensores analógicos **deben** ir a pines del bloque ADC1 (GPIO 32 a 39). El bloque ADC2 deja de funcionar cuando el Bluetooth está encendido.

### 5.3 Ensamblaje paso a paso

1. Trabaja sin ninguna alimentación conectada.
2. Une dos protoboards por el lado largo y pon el ESP32 en el medio, para tener huecos libres a ambos lados.
3. Arma los tres divisores de voltaje con resistencias de 10 kΩ y 20 kΩ.
4. Conecta la señal de pH al GPIO 34, la de turbidez al 35 y la de sólidos al 32, cada una a través de su divisor.
5. Conecta el DS18B20: DATA al GPIO 4 y la resistencia de 4,7 kΩ entre DATA y 3,3 V. Alimenta la sonda con 3,3 V.
6. Conecta el LCD: SDA al GPIO 21 y SCL al GPIO 22.
7. Conecta los LED a los GPIO 26, 25 y 33, cada uno con su resistencia de 220 Ω hacia el ánodo y el cátodo a GND.
8. Une todas las tierras (GND) en un punto común: ESP32, sensores y fuente de 5 V.
9. Energiza solo los sensores y mide con multímetro la salida de cada divisor. Ninguna debe superar 3,3 V.
10. Revisa que no haya cortos entre 5 V, 3,3 V y GND. Solo entonces conecta el ESP32 por USB.

### 5.4 Alimentación, carcasa y partes sumergibles

El repositorio no define todavía una fuente de alimentación, batería ni carcasa únicas. Antes de entregar una unidad, el responsable debe dejar escrito en la etiqueta del equipo: tensión y polaridad de la alimentación, si tiene interruptor, qué partes se pueden sumergir y el modelo exacto de cada sonda. No se debe afirmar un grado de protección (por ejemplo IP65) sin haber ensayado la unidad montada.

Solo se sumergen las puntas de las sondas que el fabricante identifica para contacto con agua. La placa del ESP32, los módulos de señal de pH, turbidez y TDS, los conectores BNC y los cables de unión deben permanecer secos. Nunca se energiza una placa mojada.

## 6. Hardware: sensores, conversión y límites

| Sensor | Principio | Conversión en el firmware V2.3 | Rango que acepta el protocolo | Límite real conocido |
|---|---|---|---|---|
| pH (SEN0161) | Electrodo de vidrio y módulo analógico | `pH = 3,5 × V + 0,0`, con V en voltios tras deshacer el divisor; acotado a 0–14 | 0 – 14 | Se descalibra con el uso; los valores 3,5 y 0,0 son genéricos y no corresponden a ninguna sonda concreta |
| Turbidez (SEN0189) | Óptico: luz que atraviesa la muestra | Interpolación lineal de 2500 mV → 200 NTU a 5000 mV → 0 NTU; acotada a 0–200 | 0 – 200 NTU | La curva es aproximada y no está calibrada contra patrones de formazina |
| Sólidos disueltos (SEN0244) | Conductividad eléctrica | `TDS = (133,42·V³ − 255,86·V² + 857,39·V) × 0,5`; acotado a 0–2000 | 0 – 2000 ppm | Validado por el fabricante solo hasta 1000 ppm; **sin compensación de temperatura**; no se usa en agua a 55 °C o más |
| Temperatura (DS18B20) | Sensor digital 1-Wire | Lectura directa en °C | −55 – 125 °C | `-127` significa que la sonda no respondió; solo el extremo encapsulado es sumergible |

El firmware lee cada canal analógico 10 veces con 2 ms de separación y promedia, usando `analogReadMilliVolts()`, que aplica la calibración de fábrica del ADC grabada en el ESP32. Esto corrige el error de ±100 a 200 mV que tenía la conversión lineal anterior.

**Por qué importa el límite de 1000 ppm:** por encima de ese valor el sensor SEN0244 no tiene una lectura validada. La app aplica la regla R17: cualquier lectura de sólidos mayor de 1000 ppm se marca como no confiable y lleva a buscar otra fuente y pedir un análisis de laboratorio.

**Temperatura y sólidos:** la conductividad cambia alrededor de 2 % por cada grado. Como el firmware no compensa la temperatura, una misma agua puede dar lecturas de TDS distintas en la mañana y al mediodía. Para comparar mediciones, anota la temperatura y mide a horas parecidas.

## 7. Hardware: la PCB del proyecto original

Existe una placa de una cara de 77,8 × 73,8 mm, cotizada en $48.000 COP. Su netlist tiene dos defectos verificados que **deben corregirse antes de energizarla**:

| Defecto | Efecto | Corrección |
|---|---|---|
| **P1:** el SCL del LCD (J6.4) está ruteado al pin Tx en vez del GPIO 22 | El LCD no funciona y además choca con el monitor serie | En protoboard, cablear SCL al GPIO 22. En la placa, corregir la pista |
| **P2:** falta la resistencia pull-up de 4,7 kΩ en GPIO 4 | El DS18B20 devuelve `-127` | Añadir la resistencia entre DATA y 3,3 V |

No cortes pistas ni sueldes sin inspeccionar antes esa revisión de la placa contra la tabla de pines de la sección 5.2. El análisis completo está en [contexto/02-hardware-y-firmware.md](../contexto/02-hardware-y-firmware.md).

## 8. Calibración y verificación

### 8.1 Calibrar el pH

La sonda de pH es la mayor fuente de error del sistema: cada electrodo es distinto y se desvía con el uso. El firmware trae `PH_SLOPE = 3.5` y `PH_OFFSET = 0.0`, valores genéricos que **no sirven para ninguna sonda concreta** sin ajuste.

Materiales: soluciones buffer de pH 7,0 y 4,0 dentro de su fecha de vencimiento, agua destilada, papel absorbente suave y el computador con Arduino IDE.

1. Enjuaga el electrodo con agua destilada y sécalo con toques suaves, sin frotar el bulbo.
2. Sumérgelo en el buffer de pH 7,0 y espera 1 a 2 minutos a que la lectura se estabilice.
3. Ajusta el potenciómetro de la placa azul del módulo hasta leer 7,0 en el monitor serie o en la app.
4. Enjuaga y sumerge el electrodo en el buffer de pH 4,0. Espera 1 a 2 minutos.
5. Si la lectura se desvía más de ±0,2, ajusta `PH_SLOPE` en el firmware, vuelve a cargarlo y repite desde el paso 2.
6. Repite hasta que ambos buffers queden dentro de ±0,2.
7. Registra la calibración en la app: **Mi equipo → Registrar calibración realizada**, con la fecha real, el vencimiento, el responsable y la referencia del registro técnico.

**Qué guarda la app:** la calibración queda como *declarada*. La app guarda lo que escribes y la usa para marcar las lecturas como confiables o no, pero no puede comprobar la sonda. Sin un registro vigente, toda lectura sale como **no confiable** (regla S7) y el resultado pide otra medición.

**Cada cuánto:** el fabricante recomienda recalibrar con más frecuencia cuando se miden muestras sucias. Mientras no exista un procedimiento metrológico trazable del proyecto, se sugiere calibrar antes de cada jornada de campo y fijar un vencimiento corto, por ejemplo de 30 días.

### 8.2 Verificar turbidez, sólidos y temperatura

El firmware no tiene un ajuste de calibración para estos sensores. Lo que sí se puede hacer es **verificar** que respondan de forma coherente:

| Prueba | Qué esperar | Si falla |
|---|---|---|
| Sonda de turbidez en agua del grifo clara | Turbidez baja, cerca de 0 NTU | Limpiar la ventana óptica; revisar el cable y el divisor |
| Sonda de sólidos en agua destilada | Cercano a 0 ppm | Enjuagar los electrodos; revisar el divisor |
| Sonda de sólidos en una solución patrón de valor conocido, por debajo de 1000 ppm | Dentro de ±10 % de la escala del sensor | Anotar la desviación en la hoja de vida; no usar para decidir hasta revisarlo |
| Sonda de temperatura junto a un termómetro de referencia | Diferencia menor de 1 °C | Revisar sello y cable; descartar si da `-127` |
| Sondas al aire | La app marca la lectura como no confiable o fuera de rango | Revisar conexiones |

Anota cada verificación en la hoja de vida del equipo (sección 26).

## 9. Mantenimiento preventivo

| Cuándo | Qué hacer |
|---|---|
| Antes de cada medición | Revisar que cables y conectores estén secos y enteros. Confirmar en la app que la calibración está vigente |
| Durante la medición | Sumergir solo las puntas. Mantener las sondas quietas. No golpear el bulbo de pH contra el recipiente. No medir agua caliente |
| Después de cada medición | Enjuagar las puntas con agua limpia (destilada si se tiene). No frotar el bulbo de pH. Limpiar la ventana de turbidez sin rayarla. Secar el exterior de los cables |
| Al guardar | Poner la tapa del electrodo de pH con la solución de almacenamiento del fabricante (para SEN0161, KCl 3N). **Nunca guardarlo seco.** Guardar todo en un lugar seco, a la sombra |
| Cada semana de uso | Revisar sellos de las sondas, el punto donde el cable entra a cada sonda y el alivio de tensión de los cables |
| Cada jornada de campo o al vencer | Calibrar el pH y verificar los demás sensores (sección 8) |
| Cuando el pH responde lento o no calibra | Limpiar el electrodo según el fabricante; si no recupera, reemplazarlo |

Estas mismas indicaciones están en la app, sin internet, en **Aprender → Cuida el equipo**.

## 10. Diagnóstico de fallas del equipo

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Temperatura `-127` en la trama, `--C` en el LCD | Falta la resistencia de 4,7 kΩ o la sonda no responde | Revisar el pull-up a 3,3 V y el cable. No es la temperatura del agua |
| LCD en blanco o con cuadros | SCL no llega al GPIO 22 (defecto P1) o falta ajustar el contraste | Revisar el cableado I2C. Se puede seguir: la app es la pantalla confiable |
| El teléfono no encuentra **ReFluye-V2** | El equipo no tiene alimentación o el firmware no cargó | Revisar el monitor serie a 115200 baudios. Activar Bluetooth y dar el permiso de «Dispositivos cercanos» |
| Pide PIN al emparejar | Normal en Bluetooth Classic | Usar **1234** |
| LED rojo encendido | Un sensor llegó al límite de su escala (pH 0 o 14, turbidez 200, sólidos 2000) o la temperatura no responde | Revisar la sonda indicada; la trama sigue llegando |
| El LCD dice `REVISAR` | Lo mismo que el LED rojo | Igual que el anterior |
| Lecturas que saltan mucho | Sondas en movimiento, burbujas, tierra suelta o alimentación ruidosa | Mantener las sondas quietas; revisar masas comunes |
| pH siempre cerca de un mismo valor | Electrodo seco, dañado o sin calibrar | Hidratar en solución de almacenamiento y calibrar |
| El ESP32 se calienta | Corto o riel mal conectado | Desconectar de inmediato y revisar |
| La app dice que los datos dejaron de ser actuales | Más de 5 segundos sin una trama | Acercar el teléfono; revisar la alimentación del equipo |

## 11. Firmware: compilar y cargar

### 11.1 Con Arduino IDE

1. Instala [Arduino IDE](https://www.arduino.cc/en/software) y agrega el paquete **ESP32 de Espressif, versión 2.0.17**, desde el gestor de placas.
2. En el gestor de librerías instala **LiquidCrystal I2C** (Frank de Brabander), **OneWire** (Paul Stoffregen) y **DallasTemperature** (Miles Burton). `BluetoothSerial` viene incluida en el paquete ESP32.
3. Abre `firmware/refluye_v2/refluye_v2.ino`, elige la placa **ESP32 Dev Module** y el puerto USB del equipo.
4. Pulsa **Verificar** y luego **Subir**.
5. Abre el monitor serie a **115200 baudios**: cada 1,5 segundos deben aparecer los valores de los cuatro sensores.
6. Comprueba el Bluetooth con una app de terminal serie, por ejemplo *Serial Bluetooth Terminal*. Busca **ReFluye-V2**, PIN **1234**. Debe llegar un bloque que termina en `---` cada 1,5 segundos.

### 11.2 Con la terminal

Es exactamente lo que hace la integración continua en cada cambio:

```sh
arduino-cli core install esp32:esp32@2.0.17 --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli lib install "LiquidCrystal I2C" OneWire DallasTemperature
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/refluye_v2
arduino-cli upload --fqbn esp32:esp32:esp32 -p COM3 firmware/refluye_v2
```

Cambia `COM3` por el puerto de tu equipo (en Linux, algo como `/dev/ttyUSB0`).

### 11.3 Procedencia del firmware

El firmware V2.3 se construyó a partir de la versión V2.0 sana que estaba dentro de la guía técnica en Word del proyecto original, porque el `.ino` publicado allí no compilaba. Sobre esa base se aplicaron los cambios de la V2.1 (sin pulsadores; el ESP32 solo preclasifica; `ESTADO` numérico), las correcciones F1 a F4 y la línea `VER:1` del protocolo. En la V2.3 la pantalla y los LED dejaron de mostrar veredictos como «EXCELENTE» o «NO APTA». Los detalles están en [firmware/README.md](../../firmware/README.md).

| Corrección | Qué resolvió |
|---|---|
| F1 | La lectura de temperatura ya no bloquea el ciclo unos 750 ms: se pide en un ciclo y se lee en el siguiente |
| F2 | Cada sensor analógico se promedia con 10 muestras |
| F3 | `analogReadMilliVolts()` aplica la calibración de fábrica del ADC |
| F4 | Cada subíndice del ICA queda acotado entre 0 y 100 |

## 12. Firmware: cómo mide

Cada 1,5 segundos (`INTERVALO_MS = 1500`) el ciclo principal hace, en orden:

1. Lee pH, turbidez y sólidos (10 muestras cada uno) y convierte a unidades con las fórmulas de la sección 6.
2. Toma la temperatura pedida en el ciclo anterior y pide la siguiente.
3. Calcula un ICA auxiliar: `0,4 × sub(pH) + 0,3 × sub(turbidez) + 0,3 × sub(TDS)`, donde `sub(pH) = 100 − |pH − 7,4| × 30`, `sub(turbidez) = 100 − NTU / 2` y `sub(TDS) = 100 − ppm / 20`, cada uno acotado entre 0 y 100.
4. Calcula `ESTADO`: 2 si ICA < 50 o pH < 5,0 o pH > 9,0; 1 si ICA < 75; 0 en otro caso. **La app nunca usa este valor como veredicto.**
5. Marca `sensorEnLimite` si pH llega a 0 o 14, turbidez a 200, TDS a 2000 o la temperatura no responde.
6. Escribe el LCD: línea 1 `ICA 82 VER APP` (o `REVISAR` si hay un sensor en el límite); línea 2, pH y temperatura.
7. Imprime los valores en el monitor serie.
8. Envía la trama Bluetooth.
9. Actualiza los LED: verde si hay un teléfono conectado, amarillo en un destello corto, rojo si hay un sensor en el límite.

Constantes que se pueden ajustar en el código:

| Constante | Valor | Para qué |
|---|---|---|
| `PIN_PH`, `PIN_TURB`, `PIN_TDS` | 34, 35, 32 | Pines analógicos (deben ser del ADC1) |
| `ONE_WIRE_BUS` | 4 | Pin del DS18B20 |
| `LED_VERDE`, `LED_AMARILLO`, `LED_ROJO` | 26, 25, 33 | Pines de los LED |
| `DIV_FACTOR` | 1,5 | Deshace el divisor 10 kΩ / 20 kΩ |
| `PH_SLOPE`, `PH_OFFSET` | 3,5 y 0,0 | Calibración del pH (ajustar por sonda) |
| `NUM_MUESTRAS` | 10 | Muestras promediadas por canal |
| `INTERVALO_MS` | 1500 | Tiempo entre tramas |
| `PROTOCOLO_VERSION` | 1 | Valor de la línea `VER` |

Cambiar el formato de la trama, sus claves o rangos **es un cambio de protocolo**: primero se modifica [protocolo-bluetooth.md](../protocolo-bluetooth.md), que es normativo, y después firmware y app se ajustan al documento.

## 13. Protocolo Bluetooth

| Aspecto | Valor |
|---|---|
| Transporte | Bluetooth Classic, perfil de puerto serie (SPP / RFCOMM) |
| Nombre del equipo | `ReFluye-V2` |
| PIN | `1234` |
| Dirección | Solo del equipo al teléfono; el equipo no recibe comandos |
| Ritmo | Una trama cada 1,5 s |
| Formato | Texto, una línea `CLAVE:valor` por dato, cierre con `---` |

Ejemplo de trama:

```text
VER:1
ESTADO:0
ICA:87.3
pH:7.41
TDS:145
TURB:12
TEMP:24.5
---
```

| Clave | Qué es | Unidad | Rango aceptado |
|---|---|---|---|
| `VER` | Versión del protocolo | — | Entero; hoy `1`. Si falta, se trata como versión 0 |
| `ESTADO` | Preclasificación del equipo, **no es un veredicto** | — | `0`, `1` o `2` |
| `ICA` | Índice del equipo, solo informativo | — | 0 – 100 |
| `pH` | Acidez | — | 0 – 14 |
| `TDS` | Sólidos disueltos | ppm | 0 – 2000 |
| `TURB` | Turbidez | NTU | 0 – 200 |
| `TEMP` | Temperatura | °C | −55 – 125; `-127` = sonda desconectada |

Reglas del parser de la app (`mobile/src/infraestructura/bluetooth/parser.ts`):

- Una trama solo cuenta cuando llega su `---`; las incompletas se descartan.
- Las claves desconocidas se ignoran, para que un firmware futuro pueda añadir datos.
- Un valor fuera de rango se marca como error de ese sensor, sin ocultar los demás.
- `TEMP:-127` se convierte en «temperatura no disponible».
- Una trama de más de 4 KB se descarta, para no agotar memoria con datos basura.
- Un `ESTADO` textual o un `ICA` ilegible de equipos antiguos genera un aviso, no un error.
- Una versión de protocolo mayor que 1 bloquea el análisis: la app no sabe interpretarla.

Frescura y estabilidad de la lectura:

| Concepto | Regla | Para qué sirve |
|---|---|---|
| Lectura reciente | La última trama tiene menos de 5 segundos, sin errores, con pH, turbidez y TDS | Basta para orientar desde la primera trama completa |
| Monitoreo | Se guardan en memoria hasta 60 lecturas para dibujar curvas | Ver si el valor se está moviendo |
| Lectura estable | 4 tramas seguidas, con intervalos de 750 a 5000 ms, variación de pH ≤ 0,05 y de TDS ≤ 5 % | Marca la medición como `estable`; si no, queda `inicial` |

La estabilidad indica que el valor dejó de moverse, **no que sea exacto**. Una lectura inicial permite una orientación preliminar, pero nunca es confiable ni autoriza el consumo.

## 14. Aplicación: tecnologías y estructura

| Tecnología | Versión | Uso |
|---|---|---|
| TypeScript | 6, modo estricto | Lenguaje |
| React | 19.2.3 | Interfaz |
| React Native | 0.86.3 | Aplicación nativa |
| Expo SDK | 57, *development build* | Compilación y módulos (no funciona en Expo Go: el Bluetooth Classic es nativo) |
| expo-router | 57 | Navegación por archivos |
| react-native-bluetooth-classic | 1.73.0-rc.17 | Puerto serie Bluetooth |
| expo-sqlite | 57 | Base de datos local |
| expo-speech | 57 | Lectura en voz alta con la voz del teléfono |
| zustand | 5 | Estado de la sesión de medición |
| react-native-svg | 15 | Iconos y anillo del ICA |
| react-native-web | 0.21 | Modo DEMO en el navegador |
| Vitest | 5 | Pruebas y cobertura |
| ESLint y Prettier | 9 y 3 | Estilo |

Las versiones exactas están fijadas en `mobile/package-lock.json`. Antes de actualizar dependencias, consulta la documentación de [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

El código está en `mobile/src/`, separado en capas. Cada capa solo usa las que están debajo:

| Carpeta | Contiene | Regla |
|---|---|---|
| `dominio/` | `motor.ts` (reglas), `orientacion.ts` (qué hacer según el uso), `protocolos.ts`, `guias.ts`, `cuidados.ts`, `resumenEnVivo.ts`, `catalogos.ts`, `estabilidad.ts`, `monitoreo.ts`, `calibracion.ts`, `privacidad.ts`, `presentacion.ts` | TypeScript puro: sin React, sin red, sin archivos. Funciones deterministas. 100 % de cobertura obligatoria |
| `aplicacion/` | `sesion.ts` (estado de la medición, reconexión, DEMO), `almacen.ts` (datos para las pantallas) | Une dominio e infraestructura |
| `infraestructura/bluetooth/` | `servicio.ts` (Android), `parser.ts` (protocolo), `servicio.web.ts` (DEMO) | Habla con el equipo |
| `infraestructura/db/` | `esquema.ts`, `repositorio.ts` (SQLite), `repositorio.web.ts` (DEMO en navegador) | Guarda en el teléfono |
| `app/` | Una pantalla por archivo | Muestra; no decide |
| `ui/` | `componentes.tsx`, `opciones.tsx`, `sensores.tsx`, `conclusion.tsx`, `iconos.tsx`, `tema.ts` | Botones de al menos 64 px, alto contraste para leer al sol, lectura en voz alta |

La carpeta `android/` la genera Expo y no se versiona. Los cambios permanentes de Android van en `mobile/app.config.ts` y en los plugins `mobile/plugins/with-permisos-campo.js` y `mobile/plugins/with-firma-publicacion.js`.

## 15. Aplicación: pantallas y recorrido

| Ruta | Pantalla | Qué hace |
|---|---|---|
| `/` | Inicio | Acceso a medir, conexión directa al equipo recordado y accesos a historial, aprender, equipo y datos |
| `/conectar` | Conectar | Buscar y emparejar equipos cercanos, o practicar con DEMO |
| `/medir` | Mide y observa | Sensores en vivo, curvas, fuente, uso, origen, olor y aspecto, con una conclusión que cambia en vivo |
| `/observacion` | Observación | Responder, pregunta por pregunta, las observaciones que falten en una medición guardada |
| `/resultado` | Resultado | Semáforo, decisión para el uso elegido, qué hacer ahora, guías sugeridas, ICA, otros usos, compartir y detalles técnicos |
| `/protocolo` | Protocolo | Pasos del plan con temporizador del hervor; guarda el avance |
| `/guia` | Guía de cuidado | Una guía paso a paso: marcar pasos hechos, registrar cuidados que se repiten, lectura en voz alta y fuentes |
| `/historial` | Mis mediciones | Lista, exportar CSV y borrar |
| `/datos` | Tus datos | Aviso de privacidad (Ley 1581 de 2012) |
| `/equipo` | Mi equipo | Equipo recordado y registro de la calibración |
| `/aprender` | Aprender | Cómo medir, guías de cuidado, significado de los colores y límites del equipo |

Recorrido de una medición:

1. La persona conecta el equipo o elige DEMO.
2. Pone las sondas en el agua. Desde la primera trama completa ve los valores y el ICA orientativo.
3. Escribe el nombre del lugar (no de personas), elige el uso y responde origen, olor y aspecto. Puede responder «No sé».
4. La conclusión en vivo cambia con cada respuesta, sin guardar nada todavía.
5. Al pulsar **Ver qué puedo hacer con esta agua**, la app congela la lectura, la guarda junto con la observación y ejecuta el motor.
6. El resultado se guarda y ya no se puede modificar. La persona ve qué hacer, puede abrir el protocolo con temporizador y las guías sugeridas.

El modo DEMO usa datos simulados, marca cada pantalla con **DEMO · DATOS SIMULADOS** y guarda cada práctica marcada como simulada para que nunca se confunda con una medición real. En el navegador solo existe DEMO, porque los navegadores no hablan Bluetooth Classic.

## 16. Motor de reglas

El motor está en `mobile/src/dominio/motor.ts` (versión 0.4.0). Recibe la lectura, la observación, la calibración y si la lectura es estable. Evalúa **todas** las reglas y elige como motivo principal la primera que se cumple, con los vetos antes que las advertencias. La explicación completa, con su razonamiento, está en [motor-de-reglas.md](../motor-de-reglas.md) y [app/09-motor-recomendaciones.md](../app/09-motor-recomendaciones.md).

### 16.1 Reglas

| Código | Nivel | Se activa si |
|---|---|---|
| R01 | 2 · veto | Olor a combustible |
| R02 | 2 · veto | Cualquier olor extraño (nada lo anula, S4) |
| R03 | 2 · veto | Capa aceitosa |
| R06 | 2 · veto | Agua verdosa y estancada (S5) |
| R04 | 2 · veto | pH menor que 5,5 o mayor que 9,5 |
| R08 | 2 · veto | Turbidez de 100 NTU o más |
| R09 | 2 · veto | Sólidos disueltos de 1500 ppm o más |
| R17 | 1 | Sólidos disueltos mayores de 1000 ppm (fuera del rango validado del sensor) |
| R05 | 1 | Lectura no confiable: sin calibración vigente, con errores, protocolo desconocido, sólidos fuera de rango validado o lectura inicial |
| R07 | 1 | Agua verdosa, aunque corra |
| R10 | 1 | pH fuera de 6,5 – 8,5 |
| R11 | 1 | Turbidez de 25 NTU o más |
| R12 | 1 | Sólidos disueltos de 600 ppm o más |
| R13 | 1 | Agua estancada |
| R14 | 1 | Alguna observación es «No sé» |
| R16 | 1 | Agua turbia a la vista |
| R15 | 0 | Ninguna de las anteriores: «Aclara y desinfecta antes de beber o cocinar» |

### 16.2 Planes

| Plan | Título que ve la persona | Cuándo |
|---|---|---|
| `alternativa` | Busca otra fuente | Hay un veto de nivel 2, o R07, R10, R11, R12 o R17 |
| `repetir` | Necesitamos otra medición | Sin veto, pero faltan calibración vigente o datos válidos, o hay respuestas «No sé» |
| `hervido` | Desinfecta antes de beber (o «Posible tratamiento; verifica primero» si la lectura es inicial) | Ninguno de los anteriores |

Además del plan, el motor devuelve un destino para cada uso (consumo humano, animales, riego, baño, utensilios y ropa), el ICA calculado por la app, si el resultado es confiable y las advertencias. La primera advertencia siempre es el descargo: «Este equipo no detecta bacterias, virus ni parásitos. No certifica potabilidad.» (S6).

### 16.3 ICA de la app

La app calcula su propio índice con la misma fórmula del firmware (sección 12), redondeado a una décima, cuando pH, turbidez y TDS son válidos. La temperatura se muestra como contexto pero no tiene peso, porque no hay una curva validada. **El ICA no es un porcentaje de potabilidad**: un olor extraño o la falta de calibración pesan más que cualquier cifra alta. Los umbrales del motor son decisiones del proyecto, no prueba de cumplimiento de una norma de agua potable.

### 16.4 Cómo cambiar una regla

1. Escribe el cambio y su justificación en [motor-de-reglas.md](../motor-de-reglas.md) y en el doc 09.
2. Modifica `motor.ts` y sube `VERSION_MOTOR`.
3. Agrega el caso en `mobile/src/dominio/__tests__/casos-golden.json` y las pruebas necesarias.
4. Comprueba que `npm run test:coverage` mantiene el 100 % de cobertura y que las pruebas de invariantes S1–S8 siguen pasando.
5. Anota el cambio en `CHANGELOG.md`. Cada medición guarda la versión del motor que la evaluó.

## 17. Guías de cuidado y protocolos de tratamiento

### 17.1 Protocolos del resultado

`mobile/src/dominio/protocolos.ts` define los pasos que se abren desde el resultado:

| Plan | Pasos | Límites que se muestran |
|---|---|---|
| `hervido` | Aclarar primero; llevar a ebullición; mantener el hervor 3 minutos con temporizador; enfriar y guardar | No elimina químicos, combustibles, metales, sales ni toxinas de algas |
| `repetir` | Revisar el equipo; preparar otra medición; completar la observación | Repetir no elimina contaminantes |
| `alternativa` | Separar el agua; conseguir otra fuente; solicitar revisión | Hervir, clorar o filtrar con tela no resuelve todos los contaminantes |

El hervor dura **3 minutos** desde el burbujeo fuerte en cualquier altitud. CDC recomienda 1 minuto, y 3 por encima de unos 2000 m; la app usa 3 siempre para no depender de conocer la altitud. El temporizador no deja avanzar antes de tiempo y se puede reiniciar si el hervor se interrumpe. [CDC](https://www.cdc.gov/water-emergency/about/index.html).

### 17.2 Guías de cuidado

`mobile/src/dominio/guias.ts` define seis guías que funcionan sin internet, en **Aprender** y como sugerencia en el resultado: guardar el agua tratada, aclarar el agua turbia, cuidar la fuente y el tanque, agua verde o con natas, cuidar el equipo, y diarrea (cuidados y cuándo buscar ayuda). Cada una tiene pasos, errores que evitar, lectura en voz alta y fuentes citadas.

En **Aprender** hay un buscador que encuentra guías por cualquier palabra, sin importar tildes ni mayúsculas. Dentro de cada guía, la persona marca los pasos que va terminando y el avance queda guardado en el teléfono. Las guías de la fuente y del agua guardada permiten registrar «Lavé el tanque hoy» (cada 180 días), «Limpié las canaletas hoy» (cada 90 días) y «Guardé agua tratada hoy» (se revisa al día siguiente). Con esas fechas, **Inicio** muestra la tarjeta **Tus cuidados**, con lo que está pendiente primero, y avisa si la calibración vence en 7 días o menos. Todo se calcula en `dominio/cuidados.ts`, sin red y sin leer el reloj dentro del dominio.

Las guías **no cambian el resultado**. La función `guiasRecomendadas` solo sugiere aclarar o guardar agua tratada cuando el motor eligió el plan `hervido`, y una prueba lo comprueba en todas las combinaciones. Ninguna guía da dosis de cloro: esas cantidades necesitan revisión técnica antes de entrar a la app.

## 18. Datos, privacidad y permisos

### 18.1 Qué se guarda

Todo se guarda en el teléfono, en la base SQLite `refluye.db`. El diccionario completo de columnas está en [datos.md](../datos.md).

| Tabla | Contenido |
|---|---|
| `medicion` | Una fila por medición: lectura (pH, turbidez, TDS, temperatura, ICA y estado del equipo, trama original), fuente, uso, observaciones, calibración (sin nombre de persona), resultado del motor y su versión |
| `ajustes` | Último equipo conectado (incluida su dirección Bluetooth, solo para reconectar), referencia aleatoria del equipo, calibración declarada con responsable, y el avance de cada protocolo |

Una medición finalizada no se puede modificar. Las mediciones no guardan la dirección Bluetooth del equipo ni el nombre de quien calibró: usan una referencia aleatoria `equipo-<uuid>`. La app no recoge la ubicación.

**Migración:** la versión 1 del esquema (apps 0.1.0 a 0.3.2) guardaba cada medición como un JSON en la tabla `capturas`. Al abrir una app 0.3.3 o posterior, la migración copia todo a la tabla `medicion`, quita el nombre del responsable y la dirección del equipo, y borra la tabla antigua, en una sola transacción: si algo falla, nada cambia.

### 18.2 Derechos de la persona

Desde **Mis mediciones** se puede exportar un CSV (UTF-8, RFC 4180, sin la columna `resultado_json`), borrar una medición o borrarlas todas. La pantalla **Tus datos** explica el tratamiento según la Ley 1581 de 2012. Los datos solo salen del teléfono si la persona pulsa **Compartir resultado** o **Exportar**.

`allowBackup` está desactivado en Android: borrar los datos de la app, desinstalarla o cambiar de teléfono **pierde el historial** si no se exportó antes.

### 18.3 Permisos Android

| Permiso | Para qué |
|---|---|
| `BLUETOOTH_SCAN` y `BLUETOOTH_CONNECT` (Android 12 o posterior) | Buscar y conectar el equipo («Dispositivos cercanos») |
| `BLUETOOTH`, `BLUETOOTH_ADMIN` y `ACCESS_FINE_LOCATION` (Android 11 o anterior) | Android exige ubicación para descubrir equipos Bluetooth. La app no lee ni guarda coordenadas |

La app bloquea expresamente micrófono, fotos, videos, almacenamiento y ventanas superpuestas. La configuración está en `mobile/app.config.ts` y `mobile/plugins/with-permisos-campo.js`. [Permisos Bluetooth en Android](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

## 19. Entorno de desarrollo

Requisitos: Git, Node.js 22 o posterior compatible con Expo 57, npm, y para compilar Android: JDK 17 y Android SDK.

```sh
git clone https://github.com/tomasmanuelgp/Refluye.git
cd Refluye/mobile
npm ci
npm run typecheck
npm run test:coverage
npm run web
```

`npm run web` abre el modo DEMO en el navegador. Para probar con el equipo real hace falta un teléfono Android con depuración USB:

```sh
npx expo prebuild --platform android --no-install
npm run android
```

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run lint` | Revisa el estilo con ESLint |
| `npm run format:check` | Comprueba el formato con Prettier (`npm run format` lo corrige) |
| `npm test` | Ejecuta las pruebas |
| `npm run test:coverage` | Ejecuta las pruebas y exige 100 % de cobertura en `src/dominio/` |
| `npm run web` | Modo DEMO en el navegador |
| `npm run android` | Compila e instala en un Android conectado |

Reglas de trabajo: los textos de interfaz, comentarios y documentación van en español, y los identificadores del código también, para que coincidan con el dominio (`veredicto`, `turbidez`, `esEstancada`). Nunca se pone una clave de API en el cliente. Todo cambio va con su documentación.

## 20. Pruebas y calidad

| Prueba | Qué cubre |
|---|---|
| Casos golden (`dominio/__tests__/casos-golden.json`) | Escenarios fijos del motor con su resultado esperado |
| Invariantes (`dominio/invariantes.test.ts`) | Recorre 2880 combinaciones de lecturas, observaciones, calibración y estabilidad para comprobar S1, S2, S4, S5, S6 y S7, y que las guías no abran un tratamiento que el motor no permite |
| Dominio | Motor, orientación, guías, conclusión en vivo, estabilidad, monitoreo, calibración, privacidad y presentación |
| Parser | Tramas completas, incompletas, fuera de rango, de equipos antiguos y demasiado largas |
| SQLite | Repositorio y migración v1 → v2 con un SQLite real de Node |
| Sesión | Flujo de medición con Bluetooth simulado |

Todo `src/dominio/` exige **100 %** de cobertura de ramas, líneas, funciones y sentencias. Estas pruebas detectan errores del código; **no validan el agua real** ni reemplazan las pruebas en un Android físico.

La integración continua (GitHub Actions) corre en cada PR:

| Flujo | Trabajo | Qué revisa |
|---|---|---|
| CI | Aplicación (mobile) | Tipos, ESLint, Prettier, pruebas con cobertura y vulnerabilidades críticas de dependencias |
| CI | Firmware ESP32 | Compila el firmware con el núcleo ESP32 2.0.17 |
| CI | Enlaces de la documentación | Que ningún enlace interno esté roto (`scripts/verificar-enlaces.py`) |
| Secretos | gitleaks | Que no se suban claves ni contraseñas |
| APK | compilar | Compila la APK y la deja como artefacto descargable |

## 21. Compilar, firmar y publicar la APK

### 21.1 En GitHub (recomendado)

Cada PR que toca la app compila la APK en GitHub Actions y la deja en **Actions → APK → Artifacts**. Al publicar una versión, el flujo `apk.yml` compila las arquitecturas armeabi-v7a y arm64-v8a, firma con el certificado oficial y adjunta a la publicación la APK, su `.sha256` y los manuales en Word y PDF.

### 21.2 Firma

| Situación | Firma | Nombre del archivo |
|---|---|---|
| Existen los secretos `REFLUYE_KEYSTORE_BASE64`, `REFLUYE_KEYSTORE_PASSWORD`, `REFLUYE_KEY_ALIAS` y `REFLUYE_KEY_PASSWORD` | Certificado oficial | `refluye-X.Y.Z-oficial.apk` |
| No existen | Clave de desarrollo (pública); la publicación se marca como pre-release | `refluye-X.Y.Z-pruebas-firma-desarrollo.apk` |

Huella SHA-256 del certificado oficial, vigente desde la versión 1.0.0:

```text
55:A4:9B:FA:73:8B:3B:26:93:39:7C:4D:D2:E8:1B:1F:03:46:7F:B7:0A:38:F0:E5:86:E5:66:3E:8C:9E:A3:D6
```

**Custodia de la firma:** el archivo `refluye-publicacion.keystore` y su contraseña deben guardarse fuera del repositorio, con copia de seguridad. Si se pierden, los teléfonos no podrán instalar actualizaciones encima de la versión anterior y habrá que desinstalar la app, perdiendo las mediciones. Nunca se suben al repositorio ni se envían por chat.

### 21.3 Compilar en un computador propio

Configura `JAVA_HOME` y `ANDROID_HOME`. En Windows, `mobile/scripts/compilar-apk.ps1` crea una unidad de ruta corta temporal (por defecto `R:`, se cambia con `-Unidad S`), verifica, compila y copia la APK con su SHA-256 a `mobile/artifacts`. Para firmar con el certificado oficial, define antes las variables `REFLUYE_KEYSTORE_FILE`, `REFLUYE_KEYSTORE_PASSWORD`, `REFLUYE_KEY_ALIAS` y `REFLUYE_KEY_PASSWORD`. En Windows hace falta Ninja 1.12 o posterior para evitar el error de rutas de más de 260 caracteres. Detalles en [mobile/README.md](../../mobile/README.md).

### 21.4 Publicar una versión nueva

1. Haz el cambio mediante un PR y espera a que todas las comprobaciones estén en verde. La rama `main` está protegida y no acepta cambios directos.
2. Sube la versión en `mobile/package.json` y en `mobile/app.config.ts`: `version` y `versionCode`. El `versionCode` siempre debe aumentar.
3. Anota los cambios en `CHANGELOG.md`.
4. Fusiona el PR y crea la publicación con su etiqueta, por ejemplo `v1.1.1`, sobre `main`.
5. Espera a que el flujo **APK** adjunte la APK, el `.sha256` y los manuales.

La guía completa, paso a paso, está en [publicar.md](../publicar.md).

## 22. Instalar y verificar la APK en un teléfono

1. En el teléfono, abre `https://github.com/tomasmanuelgp/Refluye/releases/latest`.
2. En **Assets**, descarga `refluye-X.Y.Z-oficial.apk`.
3. Ábrela y permite instalar desde esa fuente cuando Android lo pida. Si ya tenías la app, instala encima, sin desinstalar, para conservar las mediciones.
4. Abre RE-FLUYE y prueba **Practicar sin equipo · DEMO** antes de conectar un equipo real.

Para comprobar que una APK es la oficial, en un computador:

```sh
sha256sum refluye-1.1.0-oficial.apk
apksigner verify --print-certs refluye-1.1.0-oficial.apk
```

La primera línea debe coincidir con el archivo `.sha256` de la publicación. En la segunda, el valor `SHA-256 digest` debe coincidir con la huella de la sección 21.2, en minúsculas y sin los dos puntos. Si no coincide, no la instales y repórtalo por el canal privado de [SECURITY.md](../../SECURITY.md).

Requisitos del teléfono: Android 7.0 (API 24) o posterior, con Bluetooth Classic (SPP). La app está compilada para Android 16 (API 36). Para la lectura en voz alta sin internet, el teléfono debe tener instalada una voz en español.

## 23. Seguridad del repositorio

| Medida | Estado |
|---|---|
| Rama `main` protegida | Exige PR y que pasen Aplicación (mobile), Firmware ESP32, Enlaces de la documentación y gitleaks; bloquea force push y borrado |
| Búsqueda de secretos | gitleaks en cada cambio; una revisión de todo el historial no encontró claves |
| Reporte privado de vulnerabilidades | Activado; ver [SECURITY.md](../../SECURITY.md) |
| Secretos de firma | Solo en GitHub Actions; nunca en el repositorio |
| Dependencias | `npm audit` de nivel crítico en la integración continua |

Riesgos aceptados y documentados en [SECURITY.md](../../SECURITY.md): el PIN Bluetooth `1234` es público (el equipo solo envía lecturas y los vetos por observación humana siguen funcionando aunque un equipo falso envíe datos), y la base de datos del teléfono no está cifrada (no guarda nombres ni la dirección del equipo).

## 24. Aceptación de una unidad en campo

Antes de entregar un equipo a una familia o comunidad, el responsable técnico debe completar y firmar esta lista:

| # | Comprobación | Criterio |
|---|---|---|
| 1 | Identificar la unidad | Modelos exactos de ESP32 y sondas, alimentación y versión de firmware anotados en la etiqueta |
| 2 | Revisión eléctrica | Divisores ≤ 3,3 V; pull-up de 4,7 kΩ a 3,3 V; masas comunes; sin cortos; PCB sin P1 ni P2 |
| 3 | Firmware | V2.3 cargado; monitor serie y trama `---` cada 1,5 s; LCD sin veredictos |
| 4 | Calibración de pH | Buffers 7,0 y 4,0 dentro de ±0,2; registrada en la app con vencimiento |
| 5 | Verificación de sensores | Turbidez, sólidos y temperatura según la sección 8.2 |
| 6 | Partes sumergibles y carcasa | Sellos íntegros; módulos y conectores protegidos del agua |
| 7 | App en el teléfono de la familia | APK oficial verificada; permisos concedidos; DEMO probado |
| 8 | Conexión real | El teléfono encuentra **ReFluye-V2**, recibe datos en vivo y los marca como no actuales al apagar el equipo |
| 9 | Medición completa | Fuente, uso y observaciones; resultado con descargo; protocolo y guías abren sin internet |
| 10 | Accesibilidad | Lectura en voz alta funciona sin internet; textos legibles al sol |
| 11 | Capacitación | La familia sabe que el equipo no detecta microbios y que siempre debe desinfectar para beber |

El guion detallado de pruebas de la app está en [app/13-pruebas-apk.md](../app/13-pruebas-apk.md).

## 25. Limitaciones conocidas y trabajo pendiente

| Tema | Situación | Siguiente paso |
|---|---|---|
| Microbiología | El equipo no detecta bacterias, virus ni parásitos | Ninguno: es un límite del diseño. La app siempre pide desinfectar |
| Android físico | Primera instalación y medición real por Bluetooth informadas el 2026-11-09 con la v1.0.1 | Completar y registrar el guion de la sección 24 con modelo de teléfono, Android y firmware |
| Sólidos disueltos | El protocolo acepta hasta 2000 ppm, pero el sensor está validado hasta 1000 ppm y no compensa temperatura | Caracterizar con patrones; la app ya marca > 1000 ppm como no confiable (R17) |
| Turbidez | Conversión lineal aproximada, sin calibración con patrones | Caracterizar con patrones de formazina |
| Calibración | La app guarda la calibración declarada pero no puede comprobarla | Definir un procedimiento metrológico trazable; guiar la calibración desde la app |
| Alimentación y carcasa | No hay una especificación única ni ensayo de impermeabilidad | Definir por unidad; no prometer grado IP sin ensayo |
| PCB original | Defectos P1 y P2 | Corregir en una nueva revisión de la placa |
| Copia de seguridad | El historial se pierde al desinstalar si no se exportó | Agregar copia de seguridad completa |
| Validación sanitaria | No hay estudio de campo ni de laboratorio de las reglas y guías | Revisión con autoridades de salud y laboratorio |
| Cloración y SODIS | Excluidas a propósito porque el borrador tenía dosis erróneas | Reintroducir solo con fuentes oficiales, revisión de salud y casos golden |
| Backend e IA | Diseñados (docs 10 y 11), no implementados | Siempre opcionales; la ruta crítica seguirá sin internet |

## 26. Hoja de vida del equipo

Copia esta tabla para cada unidad y guárdala con el equipo.

| Campo | Valor |
|---|---|
| Identificación de la unidad | |
| Modelo de ESP32 | |
| Modelo y lote de la sonda de pH | |
| Modelo de la sonda de turbidez | |
| Modelo de la sonda de sólidos disueltos | |
| Modelo de la sonda de temperatura | |
| Alimentación (tensión, polaridad, batería) | |
| Versión de firmware | |
| Fecha de ensamblaje y responsable | |

Registro de calibraciones y mantenimiento:

| Fecha | Tipo (calibración, verificación, reparación) | Resultado | Vence | Responsable |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

## 27. Glosario

| Término | Significado |
|---|---|
| ADC | Conversor analógico-digital: convierte un voltaje en un número |
| Buffer de pH | Solución con un pH conocido y estable, usada para calibrar |
| DEMO | Modo de práctica con datos simulados |
| Divisor de voltaje | Dos resistencias que reducen un voltaje en una proporción fija |
| ICA | Índice de calidad orientativo de 0 a 100 calculado con pH, turbidez y sólidos. No es un porcentaje de potabilidad |
| Motor de reglas | Parte de la app que decide el resultado con reglas fijas y auditables |
| NTU | Unidad nefelométrica de turbidez |
| ppm | Partes por millón; para sólidos disueltos equivale a mg/L |
| Pull-up | Resistencia que mantiene una línea de datos en nivel alto |
| SPP | Perfil de puerto serie de Bluetooth Classic |
| TDS | Sólidos disueltos totales: sales y minerales disueltos en el agua |
| Trama | Bloque de datos que envía el equipo, terminado en `---` |
| Veto | Regla de nivel 2 que obliga a buscar otra fuente sin importar los demás valores |

## 28. Fuentes, atribución y licencias

Documentos del repositorio: [arquitectura](../arquitectura.md), [hardware](../hardware.md), [protocolo Bluetooth](../protocolo-bluetooth.md), [motor de reglas](../motor-de-reglas.md), [datos](../datos.md), [publicar](../publicar.md), [hardware y firmware: auditoría](../contexto/02-hardware-y-firmware.md), [dominio del agua](../contexto/04-dominio-agua.md), [estado actual y deuda](../contexto/05-estado-actual-y-deuda.md) y [bitácora](../historial/bitacora.md).

Fichas y guías externas: [DFRobot SEN0161 pH](https://wiki.dfrobot.com/sen0161/docs/19898), [DFRobot SEN0189 turbidez](https://wiki.dfrobot.com/sen0189), [DFRobot SEN0244 sólidos disueltos](https://wiki.dfrobot.com/sen0244), [Analog Devices DS18B20](https://www.analog.com/en/products/ds18b20.html), [CDC: agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html), [CDC: floraciones de algas](https://www.cdc.gov/harmful-algal-blooms/prevention/index.html), [OMS: enfermedades diarreicas](https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease), [Android: permisos Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions) y [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

**Atribución obligatoria:** RE-FLUYE es una obra derivada del proyecto Re-Fluye de **Alfredo Antonio Díaz Claros**, Centro de Competencias Digitales de la Universidad Autónoma de Bucaramanga (CCD-UNAB), publicado en [github.com/adiacla/refluye](https://github.com/adiacla/refluye) bajo CC BY-NC-SA 4.0.

**Licencias:** la app (`mobile/`), los scripts y los flujos de GitHub están bajo AGPL-3.0. El firmware (`firmware/`) y la documentación (`docs/`, incluido este manual) están bajo CC BY-NC-SA 4.0, porque derivan del proyecto original. Detalle en [LICENCIAS.md](../../LICENCIAS.md).
