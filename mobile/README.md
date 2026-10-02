# Re-Fluye · App Android de campo

APK de pruebas actual: [Re-Fluye 0.3.1](https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.3.1).
Pendiente instalar y probar en un
Android físico. [Arreglo de Bluetooth y compilación](../refluye/prompts/iteraciones/F-002.md).

Aplicación nueva que conserva el transporte SPP, los parámetros de sensores,
la observación humana y la identidad del proyecto Re-Fluye de CCD/UNAB.
El repositorio original no contenía una aplicación móvil recuperable.

## Lo implementado

- Buscar/emparejar Re-Fluye, recordar el equipo y recuperar una conexión perdida.
- Monitorear cada trama sin estabilidad ni calibración; curvas de 60 lecturas,
  estado textual del firmware antiguo y diagnóstico de datos recibidos.
- Leer pH, turbidez, TDS y temperatura; orientar desde la primera trama íntegra
  reciente. La estabilidad posterior mejora la confianza, pero no bloquea el análisis.
- Mostrar ICA orientativo de 0 a 100 y cuatro mediciones visibles. El índice
  pondera pH, turbidez y TDS; temperatura queda como contexto sin peso validado.
- Congelar la lectura, guardar cada observación y completar la medición sin radio.
- Evaluar con motor determinista y ofrecer tratamiento visible en resultado,
  guía opcional con temporizador, audio, historial y compartir.
- Registrar evidencia técnica de calibración. Sin registro vigente: no confiable.
- Practicar en modo DEMO, con capturas identificadas como simuladas.
- Elegir un uso (consumo, baño, utensilios, ropa, ganado o cultivo) y registrar
  origen, olor y aspecto junto al nombre de la fuente en una sola pantalla.
- Ver límites y acciones breves para ese uso sin convertir los sensores en una
  autorización de baño, ganadería o riego.

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
El perfil local usa firma de desarrollo para pruebas internas. Antes de distribuir
fuera del equipo de pruebas hay que configurar firma de distribución y su custodia.
La configuración declara Android API 24 como mínimo y API 36 como objetivo;
esto no prueba compatibilidad en todos los modelos. El dispositivo necesita SPP.

## Verificación disponible

61 pruebas: golden y combinaciones del motor, parser, monitoreo, SQLite real con adaptador
de prueba y sesión con Bluetooth simulado. El motor exige 100 % de cobertura.
El recorrido web DEMO se revisó a 390 y 320 px en 0.2.0; la primera lectura y el
resultado directo para cocinar se comprobaron en navegador en 0.3.0. La recuperación del borrador
pertenece al flujo anterior y debe comprobarse de nuevo con esta interfaz.
Estas comprobaciones no sustituyen Android físico.

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

## Actualización 0.3.2 · Conclusión dinámica

La conclusión aparece desde el inicio de Medir y cambia con los sensores y respuestas, sin guardar. Junto a las observaciones se muestran los pasos del uso elegido. Sin datos/calibración/observaciones verificadas no se autoriza tratamiento; olor o aspecto de riesgo conserva el veto. Motor 0.3.0 sin cambios; 69 pruebas aprobadas. Iteración B-007. APK con versionCode 5.
