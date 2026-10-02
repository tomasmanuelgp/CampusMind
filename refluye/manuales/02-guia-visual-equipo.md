# Re-Fluye · Guía visual para acompañar el producto

**Formato de entrega:** hoja A4, dos caras, en [PDF listo para imprimir](../../output/pdf/refluye-guia-visual-equipo-a4.pdf). Imprime al 100 %, a doble cara y sin ajustar a página. Esta fuente de texto permite revisar el contenido sin abrir el PDF.

**Edición de prototipo · 2 de octubre de 2026.** Antes de incluirla en una caja comercial, el responsable debe completar la etiqueta física del equipo con alimentación, interruptor, referencia de sondas, identidad Bluetooth y contacto de soporte. Esos detalles aún no están confirmados para todos los prototipos. El firmware y la app tienen pruebas de software; la unidad física y la resistencia al agua deben verificarse por separado.

## Cara 1 · Abre, conecta, mide

### Lo primero que debes saber

**Re-Fluye mide pH, turbidez, sólidos disueltos (TDS) y temperatura.** Tus observaciones sobre origen, olor y aspecto completan la evaluación. **No detecta bacterias, virus, parásitos, metales ni todos los químicos. No certifica potabilidad.** No pruebes el agua.

### 1 · Revisa

- ¿La caja electrónica y los conectores están secos y sin daño? Si no, **no enciendas**.
- ¿La persona técnica indicó la alimentación y confirmó calibración vigente? Si no, pide revisión; no improvises una fuente de energía.
- Identifica qué extremos de las sondas pueden tocar el agua. Mantén secos los módulos y la electrónica.

### 2 · Enciende y conecta

- Enciende el equipo con la alimentación **etiquetada en tu unidad**.
- Si aún no tienes la app, descarga la APK 0.3.1 desde el enlace/QR de esta hoja.
- Abre Re-Fluye en Android: **Medir agua → Buscar equipos cercanos**.
- Acepta el permiso Bluetooth de Android. Elige **ReFluye-V2** y verifica su identificador; el firmware de referencia documenta PIN `1234`, si Android lo pide.
- Sin equipo, toca **Practicar sin equipo · DEMO**; los resultados simulados no describen tu fuente.

### 3 · Coloca las sondas

- Introduce únicamente sus extremos de medición en una muestra tomada de forma segura. No mojes la caja, conectores ni placas.
- Evita chocar el bulbo de vidrio del pH contra el recipiente. No uses agua caliente con la sonda TDS de referencia.
- Mantén las sondas quietas. Los números y curvas se actualizan con cada trama, sin esperar estabilidad. Con la primera lectura completa ya puedes abrir una orientación; si varía, el resultado será **preliminar** y no autoriza consumo. Una lectura repetida tampoco prueba calibración.

### 4 · Cuenta lo que ves

En la misma pantalla escribe el **nombre de la fuente**, escoge **para qué necesitas el agua** y marca **origen, olor y aspecto**. Si no estás seguro, marca **No sé**. Si observas olor químico, aceite o agua verde, aléjate y busca otra fuente; no inhales de cerca.

### 5 · Decide con el resultado completo

Toca **Ver qué puedo hacer con esta agua**. Lee primero la decisión, **TU USO** y **QUÉ HACER AHORA**. El ICA de 0 a 100 es orientativo, no un porcentaje de potabilidad. Para beber o cocinar, una lectura favorable todavía exige desinfección. La app puede indicar buscar otra fuente o repetir. Nunca uses el color o el número del LCD/LED como autorización: son una preclasificación solo por sensores.

## Cara 2 · Cuida el equipo y resuelve dudas

### Cada parte tiene un cuidado distinto

| Parte | Cuidado después de cada medición | No hacer |
|---|---|---|
| **Electrodo de pH** | Enjuagar el extremo con agua desionizada/destilada; guardar con la solución y tapa del modelo instalado. Solicitar calibración con buffers de referencia. | Golpear o frotar el bulbo; dejar secar; mojar conector BNC o módulo. |
| **Sonda de turbidez** | Enjuagar y retirar suciedad de la ventana óptica sin rayarla; comprobar que el cable está íntegro. | Sumergir el adaptador electrónico o raspar la ventana. |
| **Sonda TDS** | Enjuagar el extremo y evitar residuos entre sus electrodos; verificar el rango del modelo. | Usarla en agua a 55 °C o más si es SEN0244; mojar el módulo. |
| **Sonda de temperatura** | Enjuagar solo el extremo sellado; revisar el punto donde entra el cable a la cubierta. | Suponer que un DS18B20 sin encapsulado es sumergible; tirar del cable. |
| **Caja, ESP32, PCB, LCD y LEDs** | Apagar, secar exterior y guardar protegidos de salpicaduras y golpes. | Sumergir, lavar bajo chorro, energizar mojados o modificar conexiones. |

Las indicaciones específicas de pH y TDS corresponden a las referencias DFRobot SEN0161 y SEN0244 mencionadas en el proyecto; confirma el modelo real de cada sonda antes de aplicar un procedimiento. [DFRobot pH](https://wiki.dfrobot.com/sen0161/docs/19898) · [DFRobot turbidez](https://wiki.dfrobot.com/sen0189) · [DFRobot TDS](https://wiki.dfrobot.com/sen0244) · [Analog Devices DS18B20](https://www.analog.com/en/products/ds18b20.html).

### Si ves una señal de alarma

- **Olor raro, película aceitosa, agua verde o sospecha de combustible:** deja de usar esa fuente; hervir o filtrar con tela no elimina todos esos peligros. Busca agua de otra procedencia y consulta a la autoridad local. [CDC](https://www.cdc.gov/water-emergency/about/index.html).
- **Lectura no confiable:** pide revisión técnica de calibración y repite. No rellenes una fecha de calibración por aproximación.
- **Sin Bluetooth o sin datos:** acerca el teléfono, revisa permisos y energía, reconecta. Si el problema continúa, muestra este manual al responsable técnico.
- **Temperatura ausente:** el código `-127` indica que el DS18B20 no respondió. No es la temperatura del agua.
- **LCD apagado o LEDs contradictorios:** usa solo la app para registrar el resultado y reporta la unidad; algunas versiones de la PCB original tienen fallas de conexión documentadas.

**Después de medir:** enjuaga las partes sumergibles, apaga el equipo, guarda el pH según su fabricante y tapa las muestras tratadas. Conserva el resultado en **Mis mediciones**. El equipo no reemplaza un análisis de laboratorio ni una recomendación sanitaria local.

**Descarga de la app:** [CampusMind · Re-Fluye 0.3.0](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.3.0). El QR de la cara 1 lleva a esta misma publicación; comprueba el dominio `github.com` antes de descargar.

### Datos de esta unidad · completar antes de entregarla

| Equipo / serie | ______________________________ |
|---|---|
| Alimentación e interruptor | ______________________________ |
| Modelo de sondas | ______________________________ |
| Fecha y responsable de calibración | ______________________________ |
| Vigente hasta | ______________________________ |
| Contacto de soporte | ______________________________ |

**Versión de app:** 0.3.0 · **Documento:** guía de prototipo 0.2 · **Origen:** CCD / UNAB, proyecto Re-Fluye. Para el procedimiento completo de la app: `refluye/manuales/01-guia-app.md`. Para mantenimiento y montaje: `refluye/manuales/03-manual-tecnico.md`.
