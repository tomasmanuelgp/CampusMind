# Re-Fluye · CampusMind

Aplicación Android de campo para leer el dispositivo Re-Fluye por Bluetooth Classic,
combinar sus sensores con observaciones humanas y conservar mediciones sin internet.

## Descargar la app Android

[Re-Fluye 0.3.1 — APK de pruebas](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.3.1).
En **Assets**, descargar `refluye-campo-0.3.1-pruebas.apk`.
La publicación incluye el archivo SHA-256 para comprobar la descarga. Esta versión
incluye un ICA indicativo de 0 a 100, los cuatro valores medidos, orientación desde
la primera lectura completa y pasos para el uso elegido en el propio resultado.
La 0.3.1 corrige valores ocultos por `ESTADO` textual del firmware antiguo y
muestra cada trama en vivo con curvas de comportamiento y diagnóstico Bluetooth.
El ICA resume pH, turbidez y TDS; la temperatura se muestra como contexto y no
se convierte en una falsa garantía de potabilidad.

Es una versión interna con firma de desarrollo. Compilación y firma verificadas;
instalación, Bluetooth real, TalkBack y comportamiento en campo pendientes de
aceptación. No certifica potabilidad ni detecta microorganismos.

### Instalar y revisar en el celular

1. En el Android, abrir el enlace de la versión 0.3.1 y descargar la APK de
   **Assets**. Requiere Android 7.0 (API 24) o superior. Para medir con el equipo,
   el teléfono debe admitir Bluetooth Classic SPP.
2. Abrir la APK descargada desde **Archivos/Descargas**. Si Android bloquea la
   instalación, abrir el ajuste que muestra para **permitir instalar apps de
   esta fuente** (el navegador o gestor de archivos usado) y volver a la APK.
   El nombre exacto del menú cambia entre fabricantes.
3. Pulsar **Instalar** y luego **Abrir**. Si ya existe una versión anterior,
   intentar instalar encima para conservar sus datos. La migración aún necesita
   prueba en teléfono; no desinstalar la versión anterior si necesitas su historial.
4. Entrar a **Medir agua → Practicar sin equipo · DEMO**. Registrar nombre de la
   fuente, elegir un uso, contestar origen, olor y aspecto, y abrir el resultado.
   La etiqueta DEMO indica que la lectura es simulada.
5. Para una medición real, encender Re-Fluye, activar Bluetooth, emparejarlo si
   Android lo solicita, aceptar el permiso de **Dispositivos cercanos/Bluetooth**
   y elegir el dispositivo correcto. En Android 11 o anterior también puede
   requerirse ubicación para buscar equipos; la app no guarda coordenadas.
   Se puede registrar desde la primera trama completa. La lectura inicial se
   marca como provisional; la estabilidad temporal y la calibración vigente
   cambian la fiabilidad, y ninguna lectura certifica que el agua sea bebible.

El [guion de aceptación](refluye/app/13-pruebas-apk.md) indica qué revisar en el
teléfono. Una pantalla DEMO no verifica la conexión con el dispositivo físico.

## Abrir el proyecto en otro computador

Instalar Git y Node.js 22 compatible con Expo 57. En una terminal:

```sh
git clone https://github.com/tomasmanuelgp/CampusMind.git
cd CampusMind/mobile
npm ci
npm run web
```

Abrir la dirección que muestra la terminal. Seleccionar **Medir agua → Practicar
sin equipo · DEMO**. El navegador muestra la interfaz y datos simulados; Bluetooth
Classic requiere la APK Android. Para actualizar una copia existente sin cambios
locales: `git pull --ff-only`, luego `npm ci` dentro de `mobile`.

También se puede descargar el código desde **Code → Download ZIP**, descomprimir,
entrar en `mobile` y ejecutar `npm ci` y `npm run web`.

## Desarrollo y comprobación

```sh
cd mobile
npm run typecheck
npm run test:coverage
```

49 pruebas aprobadas y 100 % de cobertura del motor. El código conserva el
transporte SPP, la observación humana y la identidad del proyecto original.
Incluye reconexión limitada, persistencia SQLite, historial, guía y modo DEMO.
No incluye todavía backend, IA, geolocalización ni dosificación de cloro.

- [Instrucciones de desarrollo y compilación Android](mobile/README.md)
- [Documentación del proyecto](refluye/README.md)
- [Guion de aceptación en teléfono](refluye/app/13-pruebas-apk.md)
- [Guía de la app](refluye/manuales/01-guia-app.md)
- [Guía visual A4 del equipo](output/pdf/refluye-guia-visual-equipo-a4.pdf)
- [Manual técnico del sistema](refluye/manuales/03-manual-tecnico.md)
- Manuales en Word: [app](output/word/refluye-guia-app.docx), [guía visual A4](output/word/refluye-guia-visual-equipo-a4.docx) y [técnico](output/word/refluye-manual-tecnico.docx)
- [Bitácora del ciclo de mejora](refluye/prompts/bitacora.md)

Las dependencias se recuperan con `npm ci`; el SDK Android, JDK, cachés, datos
locales y archivos de compilación no se incluyen en Git. Para compilar otra APK,
configurar JDK 17, Android SDK y seguir el README de mobile. Para instalar la
APK publicada no hace falta instalar herramientas de desarrollo en el teléfono.

## Origen y atribución

Proyecto original de Alfredo Antonio Díaz Claros, Centro de Competencias Digitales
de la Universidad Autónoma de Bucaramanga (UNAB):
[adiacla/refluye](https://github.com/adiacla/refluye).
Se conserva el contexto y firmware en `refluye`. El LICENSE de `mobile` pertenece
a la plantilla Expo y no relicencia los materiales heredados. Véase la deuda de
formalización de licencia en la documentación.

### Actualización Re-Fluye 0.3.2

[Descargar APK 0.3.2](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.3.2): conclusión visible desde el inicio y orientación que cambia con respuestas y sensores, sin guardar el análisis. Instalar sobre 0.3.1 sin desinstalar. Las guías de 0.3.1 se conservan; los cambios de esta pantalla están documentados en la iteración B-007.
