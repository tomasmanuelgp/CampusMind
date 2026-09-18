# Re-Fluye · App Android de campo

Primera APK de pruebas: [Re-Fluye 0.1.0](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.1.0)
(51.99 MB). Firma y empaquetado verificados; pendiente instalar y probar en un
Android físico. [Evidencia de compilación](../refluye/prompts/iteraciones/D-004.md).

Aplicación nueva que conserva el transporte SPP, los parámetros de sensores,
la observación humana y la identidad del proyecto Re-Fluye de CCD/UNAB.
El repositorio original no contenía una aplicación móvil recuperable.

## Lo implementado

- Buscar/emparejar Re-Fluye, recordar el equipo y recuperar una conexión perdida.
- Leer pH, turbidez, TDS y temperatura; esperar cuatro tramas estables y recientes.
- Congelar la lectura, guardar cada observación y completar la medición sin radio.
- Evaluar con motor determinista y ofrecer guía, audio, historial y compartir.
- Registrar evidencia técnica de calibración. Sin registro vigente: no confiable.
- Practicar en modo DEMO, con capturas identificadas como simuladas.

No se incluyen IA, backend, geolocalización, videos ni dosificación de cloro.
La app no certifica potabilidad ni detecta bacterias, virus o parásitos.

## Desarrollo

Requisitos: Node.js 22 o superior compatible con Expo 57, npm, JDK 17 y Android SDK.
Desde esta carpeta:

```powershell
npm ci
npm run typecheck
npm run test:coverage
npx expo prebuild --platform android --no-install
npm run android
```

Bluetooth Classic necesita código nativo: Expo Go no sirve para conectarse al
equipo. La vista `npm run web` permite revisar el flujo DEMO; no mide por Bluetooth.

## Compilar una APK local

Configurar JAVA_HOME y ANDROID_HOME. En este workspace puede ejecutarse
`./scripts/compilar-apk.ps1`: crea una unidad corta temporal, verifica, compila y
copia la APK con su SHA-256 a `artifacts`. Necesita una letra libre (R por defecto,
cambiable mediante `-Unidad S`) y restaura el entorno al terminar.

En Windows, Ninja debe ser al menos 1.12 para
evitar el error de rutas mayores de 260 caracteres; en este workspace se usó
Ninja 1.13.2 oficial dentro de `.herramientas/sdk/cmake/3.22.1/bin`, más una ruta
corta creada con `subst`. Actualizar Ninja solamente no resolvió todas las rutas
con la configuración de este Windows. No se modificó su registro.
[Guía del proveedor](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/).

```powershell
npx expo prebuild --platform android --no-install
Set-Location android
./gradlew.bat :app:assembleRelease --no-daemon --max-workers=4 '-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1024m'
```

Salida: `android/app/build/outputs/apk/release/app-release.apk`.
El plugin local comprime las bibliotecas nativas (`expo.useLegacyPackaging=true`)
para reducir la descarga; Android las extrae durante la instalación.
El perfil local usa firma de desarrollo para pruebas internas. Antes de publicar
hay que configurar firma de distribución y su custodia. No se publicó nada.
La configuración declara Android API 24 como mínimo y API 36 como objetivo;
esto no prueba compatibilidad en todos los modelos. El dispositivo necesita SPP.

## Verificación disponible

43 pruebas: golden y combinaciones del motor, parser, SQLite real con adaptador
de prueba y sesión con Bluetooth simulado. El motor exige 100 % de cobertura.
El recorrido web DEMO se revisó a 390 y 320 px, incluido veto por olor y recuperación
del paso después de recargar. Estas comprobaciones no sustituyen Android físico.

Guion pendiente: [Pruebas de campo](../refluye/app/13-pruebas-apk.md).
Iteraciones y evidencia: [bitácora](../refluye/prompts/bitacora.md).

## Estructura

`src/dominio`: reglas, catálogo y golden. `src/infraestructura`: parser/SPP y SQLite.
`src/aplicacion`: sesión. `src/app`: rutas. `src/ui`: componentes y tokens.
Android es generado por Expo; cambios permanentes van en app.config.ts y plugins.
`package-lock.json` fija las dependencias. No versionar SDK, builds ni secretos.

## Atribución

Proyecto original: Alfredo Antonio Díaz Claros, CCD, Universidad Autónoma de
Bucaramanga, [adiacla/refluye](https://github.com/adiacla/refluye).
Contexto y continuidad: [CampusMind](https://github.com/tomasmanuelgp/CampusMind).
El archivo LICENSE de esta carpeta procede de la plantilla Expo; no cambia la
licencia declarada de los materiales heredados. La formalización de la licencia
global permanece pendiente antes de distribuir públicamente.
