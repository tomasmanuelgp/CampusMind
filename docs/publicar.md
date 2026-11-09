# Cómo publicar RE-FLUYE

Guía para dejar el repositorio público, ordenado y con la app lista para
descargar. La hace **una persona con permisos de administrador** del
repositorio, desde el navegador. Solo el paso 3 necesita un computador con Java.

Tiempo total: unos 45 minutos, más unos 25 minutos que tarda GitHub en
compilar la APK.

| Paso | Qué | Obligatorio |
|---|---|---|
| 1 | Revisar que el PR esté en verde | Sí |
| 2 | Cambiar la rama principal a `main` | Recomendado |
| 3 | Crear la firma oficial de la APK | Recomendado |
| 4 | Fusionar el PR | Sí |
| 5 | Renombrar el repositorio y completar el «About» | Sí |
| 6 | Proteger la rama `main` | Recomendado |
| 7 | Publicar la versión 1.0.0 | Sí |
| 8 | Comprobar la descarga en un teléfono | Sí |
| 9 | Conectar la página web | Sí |
| 10 | Hacer público el repositorio | Si aún es privado |

---

## 1. Revisar que el PR esté en verde

1. Abre el PR **«RE-FLUYE 1.0…»** en la pestaña **Pull requests**.
2. Baja hasta el recuadro de comprobaciones. Deben estar en verde (✓):
   - **CI / Aplicación (mobile)**
   - **CI / Firmware ESP32**
   - **CI / Enlaces de la documentación**
   - **Secretos / gitleaks**
   - **APK / compilar**: tarda unos 25 minutos.
3. Opcional: prueba la APK antes de publicar. En **Actions → APK → la última
   ejecución → Artifacts**, descarga el `.zip`, descomprímelo en el computador y
   pasa la `.apk` al teléfono.

Si algo está en rojo, no sigas: avisa en el PR.

## 2. Cambiar la rama principal a `main`

Hoy la rama principal se llama `claude/refluye-repo-review-8uue12`. Para un
proyecto público conviene que se llame `main`.

1. **Settings → General → Default branch**.
2. Toca el lápiz ✏️ junto al nombre de la rama, escribe `main` y confirma con
   **Rename branch**.

GitHub mueve el PR abierto a la rama nueva y redirige los enlaces antiguos.

## 3. Crear la firma oficial de la APK (recomendado)

Sin esto, la APK se publica como **versión de pruebas**, firmada con una clave
de desarrollo que es pública. Con la firma oficial, nadie puede publicar una
APK falsa que se instale encima de la tuya.

> ⚠️ **Guarda el archivo de la firma y sus contraseñas en un lugar seguro, con
> copia de seguridad**, por ejemplo en un gestor de contraseñas y en una memoria
> USB guardada aparte. Si se pierden, **los teléfonos no podrán actualizar la
> app** y habrá que desinstalarla, perdiendo las mediciones. Nunca los subas al
> repositorio ni los envíes por chat.

### 3.1 Crear el archivo de firma (una sola vez)

Necesitas Java (JDK 17), que trae el programa `keytool`. En PowerShell
(Windows) o en una terminal:

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore refluye-publicacion.keystore -alias refluye -keyalg RSA -keysize 4096 -validity 10000
```

Te pedirá una contraseña (anótala) y algunos datos. En nombre puedes poner
`RE-FLUYE`; en organización, `Semillero InnovaMinds`.

### 3.2 Convertirlo a texto (base64)

En **PowerShell**, esto lo copia al portapapeles:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("refluye-publicacion.keystore")) | Set-Clipboard
```

En **Linux o macOS**:

```sh
base64 -w0 refluye-publicacion.keystore
```

### 3.3 Guardar los secretos en GitHub

**Settings → Secrets and variables → Actions → New repository secret**. Crea
estos cuatro:

| Nombre | Valor |
|---|---|
| `REFLUYE_KEYSTORE_BASE64` | El texto base64 del paso anterior (pégalo completo) |
| `REFLUYE_KEYSTORE_PASSWORD` | La contraseña del paso 3.1 |
| `REFLUYE_KEY_ALIAS` | `refluye` |
| `REFLUYE_KEY_PASSWORD` | La misma contraseña del paso 3.1 |

### 3.4 Anotar la huella del certificado

```sh
keytool -list -v -keystore refluye-publicacion.keystore -alias refluye
```

Copia la línea `SHA256:` y reemplaza **pendiente** en la sección «APK oficial»
de [SECURITY.md](../SECURITY.md). Así cualquiera puede comprobar que su APK es
la oficial.

## 4. Fusionar el PR

1. En el PR, pulsa **Merge pull request → Create a merge commit**. No uses
   *Squash*: se perderían los commits separados por tema.
2. Confirma con **Confirm merge**.
3. Después puedes borrar la rama del PR con **Delete branch**.

## 5. Renombrar el repositorio y completar el «About»

### Opción A: con el script (si tienes la CLI de GitHub)

```sh
gh auth login
bash scripts/configurar-repositorio.sh
```

### Opción B: a mano en la web

1. **Settings → General → Repository name**: escribe `Refluye` y pulsa
   **Rename**. GitHub redirige los enlaces del nombre anterior. **Hecho el 2026-11-08.**
2. En la página principal del repositorio, toca el engranaje ⚙️ junto a
   **About** y completa:
   - **Description:**
     `💧 RE-FLUYE: equipo de bajo costo (ESP32) y app Android sin internet que orienta a familias rurales de Colombia sobre el agua que usan y qué hacer con ella. Código abierto.`
   - **Website:** `https://re-fluye.vercel.app/`
   - **Topics:** `agua` `calidad-del-agua` `water-quality` `iot` `esp32`
     `arduino` `bluetooth` `react-native` `expo` `offline-first` `colombia`
     `open-hardware` `citizen-science` `agpl`
   - Marca **Releases** para que se vea la última versión.
3. **Settings → Code security → Private vulnerability reporting → Enable**. Lo
   usa [SECURITY.md](../SECURITY.md).
4. Opcional: **Settings → General → Features → Discussions** para preguntas de
   la comunidad.
5. Opcional: **Settings → General → Social preview**, sube una imagen de
   1280 × 640 px con el logo. Es la que se ve al compartir el enlace.

## 6. Proteger la rama `main` (recomendado)

Así nadie puede romper el motor de reglas ni el firmware por accidente.

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. Nombre: `main protegida`. **Enforcement status:** Active.
3. **Target branches → Add target → Include default branch**.
4. Marca:
   - **Require a pull request before merging**
   - **Require status checks to pass**, y agrega `Aplicación (mobile)`,
     `Firmware ESP32`, `Enlaces de la documentación` y `gitleaks`
   - **Block force pushes**
5. **Create**.

## 7. Publicar la versión 1.0.0

1. En la página principal: **Releases → Draft a new release**, o **Create a
   new release**.
2. **Choose a tag:** escribe `v1.0.0` y elige **Create new tag: v1.0.0 on
   publish**. **Target:** `main`.
3. **Release title:** `RE-FLUYE 1.0.0`.
4. En la descripción puedes pulsar **Generate release notes** o pegar la
   sección 1.0.0 de [CHANGELOG.md](../CHANGELOG.md).
5. Si **no** hiciste el paso 3, marca **Set as a pre-release**.
6. Pulsa **Publish release**.

Al publicar, GitHub ejecuta solo el flujo **APK**: compila la app (unos 25
minutos) y **adjunta a la publicación**:

- `refluye-1.0.0-oficial.apk` (o `refluye-1.0.0-pruebas-firma-desarrollo.apk` sin el paso 3)
- el archivo `.sha256` para comprobar la descarga
- la guía de la app, la guía visual del equipo y el manual técnico (Word y PDF)

Puedes seguir el avance en **Actions → APK**.

## 8. Comprobar la descarga en un teléfono

1. En el teléfono Android, abre
   `https://github.com/tomasmanuelgp/Refluye/releases/latest`.
2. En **Assets**, descarga la `.apk`, ábrela e instálala. Si tenías una versión
   anterior, instala encima.
3. Prueba **Practicar sin equipo · DEMO** y, si tienes el equipo, una medición
   real. Usa el [guion de pruebas](app/13-pruebas-apk.md).
4. Si algo falla, abre un *issue* con la plantilla **Error**.

## 9. Conectar la página web

En el código de https://re-fluye.vercel.app/, reemplaza los `[PENDIENTE]`:

| Dónde | Poner |
|---|---|
| `/codigo` → Repositorio | `https://github.com/tomasmanuelgp/Refluye` |
| `/construye/aplicacion/` → Descarga | `https://github.com/tomasmanuelgp/Refluye/releases/latest` |
| `/construye/firmware/` → Código | `https://github.com/tomasmanuelgp/Refluye/blob/main/firmware/refluye_v2/refluye_v2.ino` |
| Licencias de firmware, diseño y guías | `CC BY-NC-SA 4.0` (ver [LICENCIAS.md](../LICENCIAS.md)) |
| Pie de página y `/impacto` | Atribución obligatoria por la licencia (texto abajo) |

Texto de atribución para la web:

> RE-FLUYE es una obra derivada del proyecto Re-Fluye de **Alfredo Antonio
> Díaz Claros**, Centro de Competencias Digitales de la Universidad Autónoma de
> Bucaramanga (UNAB), publicado en github.com/adiacla/refluye bajo CC BY-NC-SA 4.0.

Revisa también en la web:

- Que existan las **autorizaciones escritas** de los acudientes para publicar los
  nombres de los integrantes menores de edad.
- Que el nivel **TRL 5** tenga evidencia documentada, o bájalo a TRL 4.
- La sección `/construye/firmware/`: desde el firmware V2.3, la pantalla ya no
  dice «EXCELENTE» y los LED significan otra cosa (ver
  [firmware/README.md](../firmware/README.md)).
- El correo de contacto y la persona responsable del tratamiento de datos.

## 10. Hacer público el repositorio (si aún es privado)

Antes, confirma que los pasos 4, 5 y 9 están hechos.

**Settings → General → Danger Zone → Change repository visibility → Make
public**.

---

## Publicar versiones futuras

1. Cambia el código mediante un PR y espera a que esté en verde.
2. Sube la versión en `mobile/package.json` y en `mobile/app.config.ts`
   (`version` y `versionCode`, que siempre debe aumentar).
3. Anota los cambios en [CHANGELOG.md](../CHANGELOG.md).
4. Fusiona y repite el paso 7 con la etiqueta nueva, por ejemplo `v1.0.1`.
