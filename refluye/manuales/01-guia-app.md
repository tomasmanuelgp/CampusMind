# Re-Fluye 0.2.0 · Guía de uso de la aplicación

**Para quién:** personas que miden una fuente de agua con Re-Fluye y quienes las acompañan.

**Edición:** 27 de septiembre de 2026 · APK de pruebas, Android 7.0 o posterior.
**Lectura esencial:** la aplicación orienta decisiones, pero el equipo **no detecta bacterias, virus ni parásitos y no certifica potabilidad**. Una pantalla favorable no autoriza beber agua sin desinfección. La conexión con un equipo físico todavía requiere pruebas de aceptación en campo.

## 1. Antes de salir a medir

Lleva el teléfono con batería, el equipo, sus sondas, un recipiente limpio para la muestra si hace falta y el registro técnico de calibración. Confirma con la persona responsable cuál es la alimentación correcta del prototipo concreto: el repositorio no documenta una batería, cargador ni protección contra agua únicos. No energices una placa mojada, con cables dañados o conectores sueltos. La caja electrónica y los módulos de señal deben permanecer secos; solo se sumerge la parte de la sonda que el fabricante identificó para contacto con agua.

No introduzcas la mano en agua con olor químico, combustible, espuma inusual o película de aceite. No pruebes el agua ni acerques la cara para olerla. En ese caso anota la observación desde un lugar seguro y busca otra fuente. Una lectura de pH, turbidez, TDS y temperatura no descarta sustancias químicas ni microorganismos. [CDC: agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html).

## 2. Instalar la APK

1. En el teléfono Android abre la [versión de pruebas 0.2.0](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.2.0). En **Assets**, descarga `refluye-campo-0.2.0-pruebas.apk`. El archivo ocupa aproximadamente 52 MB.
2. Abre **Archivos** o **Descargas** y toca la APK. Si Android lo pide, permite temporalmente **Instalar apps de esta fuente** para ese navegador o gestor de archivos. Los nombres de menú cambian según fabricante. Al terminar puedes revocar ese permiso en Ajustes.
3. Toca **Instalar** y luego **Abrir**. Si ya usabas Re-Fluye 0.1.0, intenta instalar 0.2.0 encima, sin desinstalar la anterior. Ambas APK comparten identificador y certificado, pero la conservación del historial aún debe comprobarse en un teléfono. Si Android rechaza la actualización, no desinstales antes de consultar al equipo técnico.
4. Opcionalmente comprueba la descarga con el archivo `.sha256` incluido en Assets. La huella SHA-256 esperada es `5e7bb29e40282b3234344928271abe975a70a2b467f69214306741aba567beb2`.

La APK no está en una tienda de aplicaciones y tiene **firma de desarrollo para pruebas internas**. Instala únicamente el archivo de la publicación indicada, no una copia reenviada sin origen. [Referencia Android sobre permisos Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

## 3. Conocer la app sin el equipo

En la pantalla inicial toca **Medir agua → Practicar sin equipo · DEMO**. La banda **DEMO · DATOS SIMULADOS** identifica esta práctica. Espera a que aparezca **Lectura estable**, completa las preguntas y revisa el resultado. Las mediciones DEMO se guardan como práctica y **no deben usarse para decidir sobre agua real**.

La versión web permite recorrer DEMO desde un computador con `npm run web`; el navegador no puede hablar con el Bluetooth Classic SPP de este dispositivo. Para una lectura real se necesita la APK Android y un teléfono que admita SPP.

## 4. Conectar un dispositivo real

1. Confirma que un técnico verificó la alimentación, el firmware y las sondas del equipo. Enciéndelo según la etiqueta o instrucciones entregadas con **ese** prototipo; este manual no supone un interruptor, batería o conector que quizá no existan.
2. Activa Bluetooth en el teléfono y acerca el equipo. En Re-Fluye toca **Medir agua → Buscar equipos cercanos**. Android 12 o posterior pedirá permiso de **Dispositivos cercanos**. Android 11 o anterior puede pedir permiso de ubicación para descubrir Bluetooth; la app no almacena coordenadas.
3. Selecciona **ReFluye-V2** y comprueba los últimos caracteres de su identificador si hay varios equipos con el mismo nombre. Si Android solicita PIN, el firmware de referencia documenta `1234`; confirma con la persona responsable si el prototipo usa otro.
4. Espera **recibiendo datos**. Si no conecta, revisa alimentación, distancia, permisos y emparejamiento; vuelve a buscar. La app recuerda el equipo y ofrece conectarlo en la siguiente sesión. Ante un corte de radio, intenta recuperar ese mismo equipo hasta tres veces; puedes tocar **Desconectar equipo** para cancelar.

La app no envía órdenes de medición ni calibra a distancia: el ESP32 emite datos por Bluetooth Classic SPP. La primera conexión y la reconexión deben comprobarse con el prototipo físico. [Contrato de comunicación](../contexto/03-protocolo-bluetooth.md).

## 5. Medir y observar en una sola pantalla

1. Prepara la muestra de forma que las puntas de medición entren en el agua sin mojar conectores, placas ni caja electrónica. Evita golpes y roces del bulbo de vidrio del pH. Usa un recipiente limpio entre fuentes para no arrastrar residuos. Si no conoces qué parte es sumergible, detente y consulta al responsable técnico.
2. Mantén las sondas quietas. La app espera cuatro tramas recientes y estables; el primer número no basta. Puedes tocar **Ver las 4 lecturas del equipo** para revisar pH, turbidez, sólidos disueltos y temperatura. Si falta un sensor o la conexión se pierde, no fuerces la captura.
3. En **Identifica la fuente**, escribe un nombre reconocible, por ejemplo «Quebrada de la finca». No introduzcas dirección precisa ni datos personales innecesarios.
4. En **¿Para qué la necesitas?**, elige **un** uso: beber, cocinar, bañarse, lavar utensilios, lavar ropa, ganado o cultivos. Esto ordena la explicación; **no cambia la evaluación** de los sensores y observaciones.
5. En **Lo que observas**, elige si el agua corre o está quieta, si notas olor extraño y cómo se ve. Si marcas **Huele raro**, puedes precisar el tipo; cualquier olor extraño mantiene la advertencia. Si no lo sabes, marca **No sé**. Nunca pruebes el agua para contestar.
6. Toca **Ver análisis y recomendaciones**. La app guarda la lectura, la observación y el resultado localmente, incluso sin internet.

## 6. Entender el resultado

Lee primero **TU USO**, la instrucción principal y la advertencia de fiabilidad. Luego lee **QUÉ HACER AHORA**. Abre **Ver cómo desinfectar / Ver cómo repetir / Ver qué hacer** si está disponible. La guía de hervor de la app cuenta **3 minutos desde que hay burbujas grandes y continuas**; si se interrumpe, reinicia el temporizador. Antes del hervor, aclara el agua con partículas; si sigue turbia, detente y busca otra fuente. El hervor no elimina combustibles, químicos, metales, sales ni toxinas de algas. [CDC: agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html).

| Lo que aparece | Qué hacer |
|---|---|
| **Busca otra fuente** | No intentes levantar el veto por olor, aceite, agua verdosa u otra señal de peligro con un hervor casero. Consulta a una autoridad o persona técnica. |
| **Necesitamos otra medición / Lectura no confiable** | No decidas el uso con esos datos. Solicita revisión de calibración, conexión y sondas; repite la medición. |
| **Desinfecta antes de beber** | Los parámetros medidos están dentro de las referencias del motor. Para beber o cocinar sigue el procedimiento de aclarado y desinfección; no es un certificado sanitario. |

Para **baño, ropa, ganado y cultivos**, la app presenta límites y recomienda orientación sanitaria o técnica específica; los cuatro sensores no autorizan esos usos automáticamente. Para **utensilios de comida**, sigue la indicación de aclarar y desinfectar cuando la evaluación lo permita. Ante sospecha de químicos, combustibles o aguas residuales, evita también el contacto y busca otra fuente. [CDC: higiene personal en emergencias](https://www.cdc.gov/water-emergency/safety/guidelines-for-personal-hygiene-during-an-emergency.html).

El botón **Escuchar** lee el resultado si el teléfono tiene voz en español. **Ver los números y observaciones** muestra los datos que respaldan la evaluación. **Compartir resultado** usa la hoja de compartir del teléfono: revisa destinatario y contenido antes de enviarlo. **Mis mediciones** conserva hasta 100 entradas visibles en la lista; el almacenamiento local puede contener anteriores, pero todavía no hay paginación ni sincronización. No borres los datos de la app ni la desinstales si necesitas conservar el historial: aún no existe una exportación integral o copia de seguridad de mediciones.

## 7. Calibración y cuidado después de medir

En **Mi equipo y calibración**, un técnico puede **registrar** responsable, referencia y vigencia de una calibración ya realizada. La app no calibra la sonda ni envía comandos al equipo. Sin registro vigente, marca la lectura **no confiable**. Una señal «Lectura estable» solo describe variación reciente, no exactitud.

Después de cada muestra, enjuaga cuidadosamente las partes sumergibles según las indicaciones del fabricante y evita contaminar otra muestra. Mantén secos el conector BNC, módulos, cables de unión y electrónica. No frotes el bulbo de vidrio del pH. Para almacenar ese electrodo, usa la solución y tapa indicadas por el fabricante del modelo instalado; la referencia DFRobot SEN0161 usa solución KCl 3N. La ficha del sensor TDS SEN0244 limita su sonda a agua **por debajo de 55 °C**. [DFRobot pH SEN0161](https://wiki.dfrobot.com/sen0161/docs/19898) · [DFRobot TDS SEN0244](https://wiki.dfrobot.com/sen0244/docs/20305).

## 8. Si algo no funciona

| Problema | Revisión inicial |
|---|---|
| No aparece ReFluye-V2 | Equipo encendido, Bluetooth y permisos activos, distancia corta. Confirma nombre/PIN del prototipo. |
| Aparece, pero no llegan lecturas | Espera unos segundos; si persiste, reconecta y solicita revisión del firmware/protocolo. |
| No se habilita analizar | Falta lectura estable, nombre, uso u observación. Revisa el mensaje bajo las preguntas. |
| Temperatura no disponible | Podría ser el sensor DS18B20 desconectado. No interpretes `-127 °C` como agua fría; avisa al técnico. |
| Calibración no verificada | No rellenes fechas estimadas. Solicita una calibración real y su registro. |
| Audio no se escucha | Revisa volumen y motor de voz en español del teléfono. Lee el texto mientras tanto. |
| Error al guardar o historial vacío | Reinicia la app y comunica modelo de teléfono, Android, versión de APK y pasos para repetir el fallo. No borres datos antes de reportarlo. |

La [guía visual del equipo](02-guia-visual-equipo.md) acompaña al prototipo y el [manual técnico](03-manual-tecnico.md) explica montaje, software y verificaciones. El [guion de aceptación](../app/13-pruebas-apk.md) sigue pendiente de ejecutar con un teléfono y equipo reales.
