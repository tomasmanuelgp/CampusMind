# Re-Fluye · Manual técnico del sistema

**Versión de referencia:** aplicación 0.2.0, motor 0.2.0, firmware de referencia V2.2, protocolo Bluetooth `VER:1`.

**Fecha:** 27 de septiembre de 2026.
**Público:** responsables de hardware, firmware, software, calibración y aceptación en campo.

Este manual describe el estado verificable del repositorio [CampusMind](https://github.com/tomasmanuelgp/CampusMind) y su relación con el [proyecto original](https://github.com/adiacla/refluye). No constituye certificación sanitaria, eléctrica, metrológica ni de resistencia al agua. La APK se compiló y verificó; no se ha cerrado la aceptación en un teléfono unido a un equipo físico. La placa, alimentación, carcasa y modelos exactos de las sondas deben identificarse por unidad antes de entregar la guía impresa.

## 1. Qué se desarrolló y de dónde sale

El proyecto original de Alfredo Antonio Díaz Claros, CCD de la Universidad Autónoma de Bucaramanga (UNAB), aportó la idea de unir cuatro parámetros fisicoquímicos con observaciones humanas, variantes de firmware, diseño de PCB, carcasa STL y guías técnicas. Su enlace `ReFluyeApp` estaba roto; no se recuperó código móvil. CampusMind añadió una app nueva, un firmware de referencia corregido, un contrato Bluetooth escrito, pruebas y documentación. La [auditoría de versiones, netlist y guías](../contexto/05-estado-actual-y-deuda.md) explica las diferencias; no deben mezclarse ejemplos BLE/JSON del simulador con el protocolo de producción Bluetooth Classic/texto.

| Pieza | Ubicación | Estado comprobado |
|---|---|---|
| Firmware ESP32 V2.2 | `firmware/refluye_v2/refluye_v2.ino` | Compilación de referencia; no validación con toda la unidad física. |
| Protocolo | `refluye/contexto/03-protocolo-bluetooth.md` | Contrato `VER:1`, SPP, texto por líneas; parser probado. |
| App | `mobile/src` | TypeScript, 49 pruebas y APK Android 0.2.0 compilada. |
| APK interna | [Publicación 0.2.0](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.2.0) | Firma, paquete, permisos, ABI y SHA-256 verificados; instalación real pendiente. |
| PCB y carcasa originales | Repositorio `adiacla/refluye` | Diseño histórico auditado; no se verificó el ensamblaje exacto de cada equipo actual. |
| Laboratorio y estudio de campo | — | No hay un estudio de validación clínica/sanitaria ni una serie metrológica que certifique el sistema. |

La app actual usa Bluetooth y SQLite locales. **No** implementa Supabase, PostGIS, IA conversacional, sincronización, geolocalización, dosificación de cloro ni vídeos. Esos elementos aparecen como visión futura en documentos 07, 10 y 11, no como servicios que deban instalarse para ejecutar 0.2.0.

## 2. Arquitectura y flujo de datos

```text
Fuente de agua -> sondas pH / turbidez / TDS / temperatura
              -> ESP32 (ADC1 + 1-Wire)
              -> trama de texto Bluetooth Classic SPP cada ~1,5 s
              -> parser + control de estabilidad Android
              -> captura local + observación de origen / olor / aspecto
              -> motor determinista 0.2.0
              -> resultado por uso + protocolo local + SQLite
```

`ESTADO` e `ICA` del ESP32 son **preclasificación por sensores**, no veredicto. La app vuelve a evaluar las magnitudes con la observación humana y la evidencia de calibración. El uso elegido ordena la orientación, pero no cambia el cálculo de las reglas. El dominio no consulta red, reloj ni base de datos durante `evaluar`; así se prueba por separado.

Capas reales: `src/app` contiene rutas Expo Router y componentes; `src/aplicacion/sesion.ts` orquesta Bluetooth, congelación y persistencia; `src/dominio` define datos, motor, orientación y protocolos; `src/infraestructura/bluetooth` implementa SPP, parsing y estabilidad; `src/infraestructura/db` guarda ajustes y capturas. La web sustituye radio y SQLite nativo por servicios de práctica: **solo DEMO**.

## 3. Componentes físicos y cuidado

La configuración documentada contiene ESP32 DevKit v1 de 38 pines, sensor de pH DFRobot V1.1 con electrodo de vidrio, turbidez analógica SEN0189, TDS Gravity V1.0/SEN0244, temperatura DS18B20 en sonda sellada, LCD I2C 16×2 y tres LEDs. Comprueba las etiquetas de cada pieza: el nombre comercial no prueba que todas las unidades tengan el mismo módulo, encapsulado o calibración.

| Componente | Función y conexión de referencia | Mantenimiento y comprobación |
|---|---|---|
| ESP32 + PCB | Adquiere ADC1 y 1-Wire; emite SPP. GPIO34 pH, 35 turbidez, 32 TDS; GPIO4 temperatura. | Mantener seco, sin tensiones ni conexiones improvisadas. Medir rieles y verificar cortos antes de energizar. |
| pH + BNC | Electrodo de vidrio y módulo analógico. | Enjuagar entre muestras con agua desionizada; mantener BNC/módulo secos; evitar golpes al bulbo; almacenar en solución recomendada para el modelo. SEN0161 cita KCl 3N y recalibración más frecuente con muestras sucias. [DFRobot SEN0161](https://wiki.dfrobot.com/sen0161/docs/19898). |
| Turbidez SEN0189 | Lectura óptica; salida analógica de hasta 4,5 V y alimentación de 5 V. | Limpiar suavemente ventana óptica, evitar rayas y comprobar cable. Mantener seco el adaptador de señal. [DFRobot SEN0189](https://wiki.dfrobot.com/sen0189). |
| TDS SEN0244 | Conductividad convertida a estimación de sólidos disueltos. | Enjuagar electrodos, evitar depósitos; no medir a 55 °C o más. El **rango declarado por fabricante es 0–1000 ppm**, precisión ±10 % de escala completa a 25 °C; la sonda no trae termómetro. [DFRobot SEN0244](https://wiki.dfrobot.com/sen0244) y [cuidado térmico](https://wiki.dfrobot.com/sen0244/docs/20305). |
| DS18B20 sellado | Temperatura por 1-Wire en GPIO4. | Enjuagar solo el extremo encapsulado y revisar sello/cable. El chip suelto no es sumergible; la impermeabilidad depende de la sonda de terceros. `-127 °C` indica falta de respuesta. [Analog Devices](https://www.analog.com/en/products/ds18b20.html), [nota de inmersión](https://ez.analog.com/dsp/otherdsp/a/documents/do19739/can-the-ds18b20-be-submerged-in-water). |
| LCD / LEDs | Salida de preclasificación por sensores. | No asumir que el LCD funciona en la PCB original; comprobar cableado I2C. No leer verde o «EXCELENTE» como potabilidad. |
| Caja, alimentación, cables | Configuración final no única en el repositorio. | Etiquetar tensión, polaridad, interruptor y partes sumergibles. Revisar sellos, alivio de tensión y ausencia de humedad antes de entregar. No afirmar IP65 sin ensayo de la unidad montada. |

**Riesgos de diseño que requieren revisión eléctrica antes de energizar una placa histórica:** SCL del LCD aparece ruteado a `Tx` en lugar de GPIO22; falta la resistencia pull-up de 4,7 kΩ del DS18B20 entre DATA y **3,3 V**. El divisor 10 kΩ/20 kΩ documentado lleva 5,0 V de entrada a aproximadamente **3,33 V**, ligeramente por encima del nominal de 3,3 V del ESP32: verificar tensión real y márgenes del pin, no asumir que ese cálculo basta como protección. No sugerimos cortar pistas ni soldar sin inspección de esa revisión de PCB. [Auditoría de hardware](../contexto/02-hardware-y-firmware.md).

**Desajuste de rango TDS:** el parser y el firmware aceptan/constriñen hasta 2000 ppm, pero la ficha SEN0244 citada declara 1000 ppm. Por encima del rango del sensor instalado, ningún umbral del motor puede considerarse validado. Hay que confirmar el modelo real, caracterizarlo con patrones y, si corresponde, modificar firmware, parser, motor, golden y manuales en un mismo ciclo.

## 4. Preparar y cargar el firmware

1. Confirma físicamente modelo ESP32, alimentación, masa común, pines, divisor de tensión, pull-up 1-Wire, ruta I2C y que ningún conector de sonda está mojado. Si la PCB no coincide con el esquema documentado, detente y registra la revisión.
2. Instala Arduino IDE y el paquete **ESP32** del gestor de placas de Espressif. En el gestor de librerías instala `LiquidCrystal_I2C`, `OneWire` y `DallasTemperature`. `BluetoothSerial` viene con el paquete ESP32. Revisa versiones en el entorno donde se realizará la prueba; el repositorio no fija versiones exactas del core Arduino ni de estas bibliotecas.
3. Abre `firmware/refluye_v2/refluye_v2.ino`. Selecciona **ESP32 Dev Module** y el puerto USB del equipo. Verifica/compila antes de cargar. Desconecta cualquier montaje inseguro antes de conectar USB; sigue el procedimiento eléctrico del laboratorio para tu placa.
4. Carga el firmware y abre el monitor serie a **115200 baudios**. Deben verse valores de sensores. Una pantalla LCD en blanco o `TEMP:-127` requiere revisión de hardware; no significa que el agua mida cero.
5. Comprueba con un terminal Bluetooth SPP una trama completa terminada en `---` cada ~1,5 segundos; valida también que la APK 0.2.0 la recibe. Registra versión de core, librerías, placa, voltajes y resultados.

El firmware usa `analogReadMilliVolts()`, diez muestras por canal y la fórmula ICA acotada. `PH_SLOPE=3.5` y `PH_OFFSET=0.0` son valores genéricos: no son calibración de una sonda concreta. La guía de firmware indica buffers pH 7,0 y 4,0 y revisión de pendiente; la fecha registrada en la app **no realiza** esa calibración. Un responsable debe aplicar un procedimiento metrológico trazable y documentar los límites de aceptación. [Firmware README](../../firmware/README.md).

## 5. Protocolo Bluetooth y validación de lecturas

Bluetooth Classic SPP/RFCOMM, nombre de referencia `ReFluye-V2`, PIN documentado `1234`, emisión unidireccional. Formato de ejemplo:

```text
VER:1
ESTADO:0
ICA:95.9
pH:7.41
TDS:145
TURB:12
TEMP:24.5
---
```

`VER` ausente se trata como protocolo 0. El parser descarta tramas sin cierre, ignora campos desconocidos, marca ausencias/invalidez y descarta buffers mayores de 4 KB. `TEMP:-127` se transforma en temperatura no disponible. El `ESTADO` del dispositivo no determina el resultado final. La captura exige cuatro tramas consecutivas recientes: rango pH ≤ 0,05 y dispersión TDS ≤ 5 %, sin errores esenciales; pasan al menos 750 ms entre tramas y la última tiene menos de cinco segundos. Esto controla estabilidad temporal, **no exactitud**.

## 6. Motor de resultados y tratamiento

El motor `mobile/src/dominio/motor.ts` evalúa todas las reglas y prioriza vetos: olor a combustible o extraño, película aceitosa, agua verdosa estancada, pH extremo, turbidez o TDS extremos. Sin datos fiables/calibración vigente, el plan es repetir, salvo que un veto ya exija otra fuente. Los únicos planes implementados son **alternativa**, **repetir** y **hervido**. No hay dosis de cloro. La orientación por beber, cocinar, baño, utensilios, ropa, ganado o cultivo es determinista y conservadora; animales/riego requieren evaluación específica.

La guía de hervor actual aclara partículas primero, mantiene ebullición **3 minutos** desde burbujeo fuerte y después enfría/guarda en recipiente limpio. Es una decisión conservadora que cubre la referencia CDC de 3 minutos por encima de 6500 pies; puede consumir más combustible a menor altura. El hervor no elimina químicos, combustible, metales, sales ni toxinas de algas. [CDC: preparación de agua](https://www.cdc.gov/water-emergency/about/index.html). Ninguna lectura de este equipo detecta microbios. La revisión sanitaria del conjunto de reglas con autoridades y laboratorio sigue pendiente.

La fórmula ICA local, cuando pH/turbidez/TDS tienen datos válidos, es `0,4 × max(0,100−|pH−7,4|×30) + 0,3 × (100−TURB/2) + 0,3 × (100−TDS/20)`, redondeada a una décima. Los umbrales son **decisiones internas del proyecto**, no prueba de cumplimiento de una norma de agua potable. La fórmula antigua de los documentos originales tenía divisores erróneos; no se usa. [Contrato del motor](../app/09-motor-recomendaciones.md).

## 7. Aplicación: lenguajes, bibliotecas y datos

La app usa **TypeScript 6**, **React 19.2.3**, **React Native 0.86.3** y **Expo SDK 57**. `expo-router` maneja rutas; `zustand`, sesión y reconexión; `react-native-bluetooth-classic`, SPP nativo; `expo-sqlite`, base local; `expo-speech`, lectura en voz; `react-native-svg`, iconografía; `react-native-web`, DEMO en navegador; `vitest` y `@vitest/coverage-v8`, pruebas. Las versiones concretas están fijadas en `mobile/package-lock.json`; consulta ese archivo antes de actualizar. [Expo 57](https://docs.expo.dev/versions/v57.0.0/).

`refluye.db` tiene tablas `ajustes` y `capturas`; cada captura guarda JSON de fuente, uso, lectura, observaciones y evidencia de calibración, y el resultado guarda versión de motor. El cierre es transaccional; la app no reescribe resultados completos. El historial lista las 100 capturas más recientes. La app actual no sincroniza ni solicita coordenadas; compartir un resultado sí abre las opciones del teléfono y requiere decisión del usuario. `allowBackup:false` en Android significa que **no debe prometerse recuperación del historial** tras borrar datos, desinstalar o cambiar de teléfono.

La APK `co.refluye.campo` 0.2.0 declara Android mínimo API 24, objetivo API 36 y ABI arm64-v8a, armeabi-v7a, x86 y x86_64. Android ≥12 solicita Bluetooth Scan/Connect; Android ≤11 solicita ubicación precisa para descubrir equipos, sin persistir coordenadas. Los permisos finales se verificaron; no se incluyeron micrófono ni acceso a archivos multimedia. [Permisos Android](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

## 8. Instalar el proyecto en otro computador

Requisitos: Git, Node.js **22.13 o posterior compatible con Expo 57**, npm, JDK 17 y Android SDK para compilar Android. En Windows también se requiere una ruta suficientemente corta para Gradle/Ninja; el script del repositorio crea una unidad temporal. Evita sincronizar dependencias o SDK mediante Git. [Compatibilidad Expo 57](https://docs.expo.dev/versions/v57.0.0/).

```powershell
git clone https://github.com/tomasmanuelgp/CampusMind.git
Set-Location CampusMind/mobile
npm ci
npm run typecheck
npm run test:coverage
npm run web
```

La vista web permite **únicamente DEMO**. El módulo SPP es nativo: **Expo Go y el navegador no sirven para medir con el ESP32**. Para construir/ejecutar localmente en un Android con depuración y SDK configurados:

```powershell
Set-Location CampusMind/mobile
npx expo prebuild --platform android --no-install
npm run android
```

Para una APK de pruebas en este workspace, configura `JAVA_HOME` y `ANDROID_HOME` y ejecuta `./scripts/compilar-apk.ps1`. El script ejecuta TypeScript/pruebas, prebuild y Gradle; genera `mobile/artifacts/refluye-campo-0.2.0-pruebas.apk` y `.sha256`. Si la unidad `R:` ya está ocupada, pasa `-Unidad S` u otra letra libre. Requiere Ninja moderno y memoria suficiente; en la compilación verificada se empleó Ninja 1.13.2 y ruta corta temporal. El directorio `android/` lo genera Expo, así que los cambios permanentes de permisos/configuración están en `mobile/app.config.ts` y `mobile/plugins/with-permisos-campo.js`. [Detalle de compilación](../prompts/iteraciones/D-005.md).

Para **instalar la APK sin desarrollar**, abre la publicación 0.2.0 en el teléfono, descarga el archivo APK desde Assets, permite instalar desde esa fuente cuando Android lo pida, abre Re-Fluye y prueba DEMO antes de Bluetooth. La firma de la 0.1.0 y 0.2.0 coincide y el código de versión sube de 1 a 2, pero la migración real de SQLite aún no se ha comprobado. No desinstales la versión vieja si necesitas conservar datos. [Guía de la app](01-guia-app.md).

## 9. Pruebas, estudios y criterios de liberación

`npm run test:coverage` ejecuta 49 pruebas, incluidos 21 escenarios golden, parser, estabilidad/sesión y SQLite con adaptador de prueba. El motor alcanza 100 % de cobertura de ramas, líneas, funciones y sentencias; esto detecta regresiones de código, **no valida el agua real**. `npm run typecheck` verifica TypeScript. La APK 0.2.0 pasó compilación release, lint vital, `apksigner`, inspección de paquete y checksum SHA-256 `5e7bb29e40282b3234344928271abe975a70a2b467f69214306741aba567beb2`. La verificación visual web se hizo a 320 y 390 px. [Evidencia D-005](../prompts/iteraciones/D-005.md).

Para dar por aceptada una unidad física faltan, al menos: identificar BOM exacta y alimentación; comprobar tensiones, temperatura, carcasa y partes sumergibles; corregir o descartar defectos de PCB histórica; calibrar con patrones trazables y caracterizar rangos/repetibilidad contra laboratorio; probar Android 7–16 con varios teléfonos SPP; verificar actualización 0.1.0→0.2.0, pérdida de conexión, batería, permisos, TalkBack, voz sin internet, lectura bajo sol y usuarios reales. El [guion de aceptación](../app/13-pruebas-apk.md) registra cada caso. Ningún documento disponible demuestra sensibilidad/especificidad para contaminantes o validez sanitaria de recomendaciones para ganado, cultivos y baño.

### Hallazgos prioritarios para el siguiente ciclo

1. **TDS por encima de 1000 ppm:** confirmar sensor, rango y respuesta; alinear firmware y motor con el límite probado.
2. **Alimentación, impermeabilidad y PCB:** cerrar especificación por unidad; no imprimir voltaje ni grado IP genérico.
3. **Registro de calibración:** la app almacena evidencia declarada, pero no verifica físicamente la sonda. Definir trazabilidad y vencimiento por procedimiento real.
4. **LCD y LEDs:** cambiar etiquetas de preclasificación para que «EXCELENTE»/verde no sugieran autorización de consumo.
5. **Conservación de datos:** comprobar migración y crear exportación/copia de seguridad antes de un despliegue amplio.

## 10. Fuentes y trazabilidad documental

- Repositorio actual: [CampusMind](https://github.com/tomasmanuelgp/CampusMind), carpetas `firmware/`, `mobile/` y `refluye/`. Repositorio original: [adiacla/refluye](https://github.com/adiacla/refluye).
- Contratos internos: [hardware y firmware](../contexto/02-hardware-y-firmware.md), [Bluetooth](../contexto/03-protocolo-bluetooth.md), [dominio del agua](../contexto/04-dominio-agua.md), [motor implementado](../app/09-motor-recomendaciones.md), [bitácora](../prompts/bitacora.md).
- Fichas primarias: [DFRobot SEN0161 pH](https://wiki.dfrobot.com/sen0161/docs/19898), [SEN0189 turbidez](https://wiki.dfrobot.com/sen0189), [SEN0244 TDS](https://wiki.dfrobot.com/sen0244), [Analog Devices DS18B20](https://www.analog.com/en/products/ds18b20.html).
- Guías técnicas externas: [CDC, agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html), [Android, permisos Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

**Atribución:** Alfredo Antonio Díaz Claros, CCD / UNAB, autor del proyecto original. CampusMind desarrolla esta implementación. El repositorio original declara CC BY-NC-SA 4.0 sin archivo de licencia formal; antes de redistribuir materiales de terceros hay que resolver esa documentación de licencia y revisar las licencias de cada componente.
