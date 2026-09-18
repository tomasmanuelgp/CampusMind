# Re-Fluye · CampusMind

Aplicación Android de campo para leer el dispositivo Re-Fluye por Bluetooth Classic,
combinar sus sensores con observaciones humanas y conservar mediciones sin internet.

## Descargar la app Android

[Re-Fluye 0.1.0 — APK de pruebas](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.1.0).
En **Assets**, descargar `refluye-campo-0.1.0-pruebas.apk` (52 MB).
La publicación incluye SHA-256 y metadatos de verificación.

Es una versión interna con firma de desarrollo. Compilación y firma verificadas;
instalación, Bluetooth real, TalkBack y comportamiento en campo pendientes de
aceptación. No certifica potabilidad ni detecta microorganismos.

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

43 pruebas aprobadas y 100 % de cobertura del motor. El código conserva el
transporte SPP, la observación humana y la identidad del proyecto original.
Incluye reconexión limitada, persistencia SQLite, historial, guía y modo DEMO.
No incluye todavía backend, IA, geolocalización ni dosificación de cloro.

- [Instrucciones de desarrollo y compilación Android](mobile/README.md)
- [Documentación del proyecto](refluye/README.md)
- [Guion de aceptación en teléfono](refluye/app/13-pruebas-apk.md)
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
