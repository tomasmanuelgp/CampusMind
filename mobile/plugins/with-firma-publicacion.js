// Firma de publicación de la APK.
//
// Las credenciales del keystore NUNCA van en el repositorio. Se leen de
// variables de entorno en el momento de compilar:
//   REFLUYE_KEYSTORE_FILE      ruta absoluta al archivo .jks/.keystore
//   REFLUYE_KEYSTORE_PASSWORD  contraseña del almacén
//   REFLUYE_KEY_ALIAS          alias de la clave
//   REFLUYE_KEY_PASSWORD       contraseña de la clave
// Sin ellas, la compilación release usa la firma de desarrollo y Gradle
// avisa que esa APK no debe publicarse (cualquiera tiene esa clave).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = '// refluye: firma de publicación';

const bloqueFirma = `
        ${MARCA}
        release {
            def archivo = System.getenv('REFLUYE_KEYSTORE_FILE')
            if (archivo) {
                storeFile file(archivo)
                storePassword System.getenv('REFLUYE_KEYSTORE_PASSWORD')
                keyAlias System.getenv('REFLUYE_KEY_ALIAS')
                keyPassword System.getenv('REFLUYE_KEY_PASSWORD')
            }
        }`;

const seleccion = `signingConfig System.getenv('REFLUYE_KEYSTORE_FILE') ? signingConfigs.release : signingConfigs.debug
            if (!System.getenv('REFLUYE_KEYSTORE_FILE')) {
                logger.warn('Re-Fluye: APK release con FIRMA DE DESARROLLO. No la publiques.')
            }`;

module.exports = config =>
  withAppBuildGradle(config, config => {
    let gradle = config.modResults.contents;
    if (gradle.includes(MARCA)) return config;
    const firmas = /signingConfigs\s*\{/;
    const release = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!firmas.test(gradle) || !release.test(gradle)) {
      throw new Error('with-firma-publicacion: build.gradle no tiene la forma esperada; revisa el plugin.');
    }
    gradle = gradle.replace(firmas, m => m + bloqueFirma);
    gradle = gradle.replace(release, `$1${seleccion}`);
    config.modResults.contents = gradle;
    return config;
  });
