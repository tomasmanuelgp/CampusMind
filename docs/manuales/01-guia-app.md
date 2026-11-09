# RE-FLUYE 1.0.1 · Guía de uso de la aplicación

**Para quién:** personas que miden una fuente de agua con RE-FLUYE y quienes las acompañan.

**Edición:** 9 de noviembre de 2026 · APK oficial 1.0.1, Android 7.0 o posterior.
**Lectura esencial:** la aplicación orienta decisiones, pero el equipo **no detecta bacterias, virus ni parásitos y no certifica potabilidad**. Una pantalla favorable no autoriza beber agua sin desinfección. La conexión con un equipo físico todavía requiere pruebas de aceptación en campo.

## 1. Antes de salir a medir

Lleva el teléfono con batería, el equipo, sus sondas, un recipiente limpio para la muestra si hace falta y el registro técnico de calibración. Confirma con la persona responsable cuál es la alimentación correcta del prototipo concreto: el repositorio no documenta una batería, cargador ni protección contra agua únicos. No energices una placa mojada, con cables dañados o conectores sueltos. La caja electrónica y los módulos de señal deben permanecer secos; solo se sumerge la parte de la sonda que el fabricante identificó para contacto con agua.

No introduzcas la mano en agua con olor químico, combustible, espuma inusual o película de aceite. No pruebes el agua ni acerques la cara para olerla. En ese caso anota la observación desde un lugar seguro y busca otra fuente. Una lectura de pH, turbidez, TDS y temperatura no descarta sustancias químicas ni microorganismos. [CDC: agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html).

## 2. Instalar la APK

1. En el teléfono Android abre la [última publicación](https://github.com/tomasmanuelgp/Refluye/releases/latest). En **Assets**, descarga `refluye-1.0.1-oficial.apk` (o la versión más reciente que aparezca).
2. Abre **Archivos** o **Descargas** y toca la APK. Si Android lo pide, permite temporalmente **Instalar apps de esta fuente** para ese navegador o gestor de archivos. Los nombres de menú cambian según fabricante. Al terminar puedes revocar ese permiso en Ajustes.
3. Toca **Instalar** y luego **Abrir**. Si Android rechaza instalar encima de una versión de pruebas anterior (0.x), es porque aquellas usaban otra firma: exporta antes tus mediciones desde **Mis mediciones → Exportar mediciones (CSV)**, desinstala la versión vieja e instala la oficial. Desde la 1.0.0, las actualizaciones se instalan encima y conservan el historial.
4. Opcionalmente comprueba la descarga con el archivo `.sha256` incluido en Assets, y la firma con la huella del certificado publicada en [SECURITY.md](../../SECURITY.md). El [manual técnico](03-manual-tecnico.md) explica cómo hacerlo.

La APK no está en una tienda de aplicaciones. Está firmada con el **certificado oficial de RE-FLUYE**. Instala únicamente el archivo de la página de publicaciones, nunca una copia reenviada sin origen. [Referencia Android sobre permisos Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).

## 3. Conocer la app sin el equipo

En la pantalla inicial toca **Medir agua → Practicar sin equipo · DEMO**. La barra inferior lleva a **Inicio**, **Medir**, **Historial** y **Aprender**. La banda **DEMO · DATOS SIMULADOS** identifica esta práctica. La primera lectura completa ya permite analizar; si varía, se identifica como **inicial**. Completa las preguntas y revisa el resultado. Las mediciones DEMO se guardan como práctica y **no deben usarse para decidir sobre agua real**.

La versión web permite recorrer DEMO desde un computador con `npm run web`; el navegador no puede hablar con el Bluetooth Classic SPP de este dispositivo. Para una lectura real se necesita la APK Android y un teléfono que admita SPP.

## 4. Conectar un dispositivo real

1. Confirma que un técnico verificó la alimentación, el firmware y las sondas del equipo. Enciéndelo según la etiqueta o instrucciones entregadas con **ese** prototipo; este manual no supone un interruptor, batería o conector que quizá no existan.
2. Activa Bluetooth en el teléfono y acerca el equipo. En Re-Fluye toca **Medir agua → Buscar equipos cercanos**. Android 12 o posterior pedirá permiso de **Dispositivos cercanos**. Android 11 o anterior puede pedir permiso de ubicación para descubrir Bluetooth; la app no almacena coordenadas.
3. Selecciona **ReFluye-V2** y comprueba los últimos caracteres de su identificador si hay varios equipos con el mismo nombre. Si Android solicita PIN, el firmware de referencia documenta `1234`; confirma con la persona responsable si el prototipo usa otro.
4. Espera **recibiendo datos**. Si no conecta, revisa alimentación, distancia, permisos y emparejamiento; vuelve a buscar. La app recuerda el equipo y ofrece conectarlo en la siguiente sesión. Ante un corte de radio, intenta recuperar ese mismo equipo hasta tres veces; puedes tocar **Desconectar equipo** para cancelar.

La app no envía órdenes de medición ni calibra a distancia: el ESP32 emite datos por Bluetooth Classic SPP. La primera conexión y la reconexión deben comprobarse con el prototipo físico. [Contrato de comunicación](../protocolo-bluetooth.md).

## 5. Medir y observar en una sola pantalla

1. Prepara la muestra de forma que las puntas de medición entren en el agua sin mojar conectores, placas ni caja electrónica. Evita golpes y roces del bulbo de vidrio del pH. Usa un recipiente limpio entre fuentes para no arrastrar residuos. Si no conoces qué parte es sumergible, detente y consulta al responsable técnico.
2. Mantén las sondas quietas. Desde la primera trama completa y reciente aparece un **ICA orientativo de 0 a 100** y se ven pH, turbidez, sólidos disueltos y temperatura. El índice pondera los tres primeros parámetros; la temperatura se muestra como contexto porque no tiene un peso validado en la fórmula del proyecto. No es un porcentaje de potabilidad. Si la lectura varía, el resultado se marca **inicial**. Si faltan datos esenciales o se pierde la conexión, no fuerces la captura.
3. Mira **DATOS EN VIVO**: cada trama recibida actualiza los valores y las curvas de hasta 60 lecturas, sin esperar que se estabilicen. Cada curva tiene su propia escala. Si un sensor falta, los otros siguen visibles. Si transcurren cinco segundos sin datos, dejan de mostrarse como actuales. **Ver datos recibidos por Bluetooth** permite enseñar la última trama al técnico; un estado textual antiguo no bloquea los sensores.
4. En **Tu agua → ¿Dónde tomaste esta agua?**, escribe el nombre del lugar, por ejemplo «Quebrada de la finca». Usa el nombre del lugar, no de personas, y no escribas una dirección precisa.
5. En **¿Para qué usarás el agua?**, elige **un** uso: beber, cocinar, bañarse, lavar utensilios, lavar ropa, ganado o cultivos. Esto ordena la explicación; **no cambia la evaluación** de los sensores y observaciones.
6. En **Observa el agua**, responde **¿De dónde viene el agua?** (agua que corre, agua quieta, pozo o aljibe, agua lluvia, acueducto o tubería, o No sé), **¿Notas un olor extraño?** y **¿Cómo se ve?**. Si marcas **Huele raro**, puedes precisar a qué se parece; cualquier olor extraño mantiene la advertencia. Si no lo sabes, marca **No sé**. Nunca pruebes el agua para contestar. Mientras respondes, la conclusión de la parte de arriba cambia con cada respuesta.
7. Toca **Ver qué puedo hacer con esta agua**. No necesitas esperar a que cuatro lecturas coincidan. La app guarda la lectura, la observación y el resultado localmente, incluso sin internet. Si la lectura es inicial, puede mostrar una ruta posible de tratamiento solo cuando los datos y la calibración están verificados, pero **no autoriza consumir** antes de una nueva comprobación.

## 6. Entender el resultado

Lee primero la decisión, **TU USO** y **QUÉ HACER AHORA**. Para beber o cocinar, los pasos de aclarado, hervor de **3 minutos desde burbujas grandes y continuas**, enfriado y almacenamiento están en la misma pantalla; puedes abrir el temporizador y la guía completa si los necesitas. Si se interrumpe el hervor, reinicia el temporizador. Si no puedes hervir, al abrir la guía eliges **Con cloro** (cloro doméstico sin perfume, con las gotas exactas según su concentración y 30 minutos de espera) o **Al sol** (botellas transparentes con agua clara, 6 horas de sol o 2 días si está nublado). Antes del hervor, aclara el agua con partículas; si sigue turbia, detente y busca otra fuente. El hervor no elimina combustibles, químicos, metales, sales ni toxinas de algas. [CDC: agua en emergencias](https://www.cdc.gov/water-emergency/about/index.html).

| Lo que aparece | Qué hacer |
|---|---|
| **Busca otra fuente** | No intentes levantar el veto por olor, aceite, agua verdosa u otra señal de peligro con un hervor casero. Consulta a una autoridad o persona técnica. |
| **Necesitamos otra medición / Lectura no confiable** | No decidas el uso con esos datos. Solicita revisión de calibración, conexión y sondas; repite la medición. |
| **Desinfecta antes de beber** | Los parámetros medidos están dentro de las referencias del motor. Para beber o cocinar sigue el procedimiento de aclarado y desinfección; no es un certificado sanitario. |

Para **baño, ropa, ganado y cultivos**, la app presenta límites y recomienda orientación sanitaria o técnica específica; los cuatro sensores no autorizan esos usos automáticamente. Para **utensilios de comida**, sigue la indicación de aclarar y desinfectar cuando la evaluación lo permita. Ante sospecha de químicos, combustibles o aguas residuales, evita también el contacto y busca otra fuente. [CDC: higiene personal en emergencias](https://www.cdc.gov/water-emergency/safety/guidelines-for-personal-hygiene-during-an-emergency.html).

El botón **Escuchar** lee el resultado si el teléfono tiene voz en español. **Ver detalles técnicos** muestra los datos que respaldan la evaluación. **Compartir resultado** usa la hoja de compartir del teléfono: revisa destinatario y contenido antes de enviarlo. **Mis mediciones** muestra hasta 100 entradas en la lista. Desde ahí puedes **Exportar mediciones (CSV)** para guardarlas o entregárselas a un técnico, borrar una medición o borrarlas todas. La pantalla **Tus datos** explica qué guarda la app (Ley 1581 de 2012). Si borras los datos de la app o la desinstalas sin exportar antes, el historial se pierde: no hay copia de seguridad automática.

### Guías para cuidar el agua

Debajo de **Qué hacer ahora**, el resultado sugiere hasta tres guías según lo que encontró: por ejemplo, **Aclara el agua turbia** y **Guarda el agua tratada** cuando hay una ruta de tratamiento, o **Agua verde o con natas** y **Cuida la fuente y el tanque** cuando hay que buscar otra fuente. Todas están también en **Aprender → Cuidar el agua, paso a paso**, donde puedes buscarlas por palabras; funcionan sin internet y se pueden escuchar. Dentro de cada guía, toca cada paso cuando lo termines: el avance queda guardado. En las guías de la fuente y del agua guardada puedes registrar «Lavé el tanque hoy», «Limpié las canaletas hoy» o «Guardé agua tratada hoy»; **Inicio** te recordará en **Tus cuidados** cuándo toca de nuevo. Las guías no cambian el resultado: si dice **Busca otra fuente**, no uses esa agua aunque sigas los pasos.

## 7. Calibración y cuidado después de medir

En **Mi equipo**, un técnico puede **registrar** responsable, referencia y vigencia de una calibración ya realizada. La app no calibra la sonda ni envía comandos al equipo. Sin registro vigente, marca la lectura **no confiable**. Una lectura repetida solo describe variación reciente, no exactitud.

Después de cada muestra, enjuaga cuidadosamente las partes sumergibles según las indicaciones del fabricante y evita contaminar otra muestra. Mantén secos el conector BNC, módulos, cables de unión y electrónica. No frotes el bulbo de vidrio del pH. Para almacenar ese electrodo, usa la solución y tapa indicadas por el fabricante del modelo instalado; la referencia DFRobot SEN0161 usa solución KCl 3N. La ficha del sensor TDS SEN0244 limita su sonda a agua **por debajo de 55 °C**. Estas indicaciones también están en la app, sin internet, en **Aprender → Cuida el equipo**. [DFRobot pH SEN0161](https://wiki.dfrobot.com/sen0161/docs/19898) · [DFRobot TDS SEN0244](https://wiki.dfrobot.com/sen0244/docs/20305).

## 8. Si algo no funciona

| Problema | Revisión inicial |
|---|---|
| No aparece ReFluye-V2 | Equipo encendido, Bluetooth y permisos activos, distancia corta. Confirma nombre/PIN del prototipo. |
| Aparece, pero no llegan lecturas | Espera unos segundos; si persiste, reconecta y solicita revisión del firmware/protocolo. |
| Datos incompletos o error persistente | Abre «Ver datos recibidos por Bluetooth» y comunica la trama al soporte. Confirma que instalaste la última versión. |
| No se habilita analizar | Falta una trama completa y reciente, nombre, uso u observación. Revisa el mensaje bajo las preguntas. |
| Temperatura no disponible | Podría ser el sensor DS18B20 desconectado. No interpretes `-127 °C` como agua fría; avisa al técnico. |
| Calibración no verificada | No rellenes fechas estimadas. Solicita una calibración real y su registro. |
| Audio no se escucha | Revisa volumen y motor de voz en español del teléfono. Lee el texto mientras tanto. |
| Error al guardar o historial vacío | Reinicia la app y comunica modelo de teléfono, Android, versión de APK y pasos para repetir el fallo. No borres datos antes de reportarlo. |

La [guía visual del equipo](02-guia-visual-equipo.md) acompaña al prototipo y el [manual técnico](03-manual-tecnico.md) explica montaje, software y verificaciones. El [guion de aceptación](../app/13-pruebas-apk.md) sigue pendiente de ejecutar con un teléfono y equipo reales.
