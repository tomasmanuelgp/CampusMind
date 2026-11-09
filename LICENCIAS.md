# Licencias de RE-FLUYE

RE-FLUYE es abierto, pero no todo el repositorio tiene la misma licencia. La
razón: una parte la escribimos desde cero y otra parte deriva del proyecto
original de **Alfredo Antonio Díaz Claros**, del Centro de Competencias
Digitales (CCD) de la Universidad Autónoma de Bucaramanga (UNAB),
publicado en [adiacla/refluye](https://github.com/adiacla/refluye) bajo
**Creative Commons BY-NC-SA 4.0**.

Esa licencia exige que lo derivado conserve la misma licencia y la atribución
(«compartir igual»), así que no podemos cambiarla por nuestra cuenta.

## Qué licencia cubre cada carpeta

| Carpeta o archivo | Licencia | Archivo | Por qué |
|---|---|---|---|
| `mobile/` (aplicación) | **AGPL-3.0** | [`LICENSE`](LICENSE) | Código escrito desde cero para este repositorio |
| `scripts/`, `.github/` | **AGPL-3.0** | [`LICENSE`](LICENSE) | Herramientas propias del repositorio |
| `firmware/` | **CC BY-NC-SA 4.0** | [`firmware/LICENSE`](firmware/LICENSE) | Deriva del firmware V2.0 del proyecto original |
| `docs/` (guías, contexto, manuales, historial) | **CC BY-NC-SA 4.0** | [`docs/LICENSE`](docs/LICENSE) | Describe y adapta el diseño, el hardware y las guías del proyecto original |

Cada archivo de código lleva en su primera línea una etiqueta
`SPDX-License-Identifier` con su licencia.

### Qué significa en la práctica

- **AGPL-3.0 (la app):** puedes usar, estudiar, modificar y redistribuir la
  app, también con fines comerciales. Si la modificas y la ofreces a otras
  personas, incluso como servicio por internet, debes publicar tu código bajo
  la misma licencia.
- **CC BY-NC-SA 4.0 (firmware y documentación):** puedes copiar, adaptar y
  compartir, **sin fines comerciales**, dando crédito al autor original y a
  RE-FLUYE, y publicando tus cambios bajo la misma licencia.

### Sobre el índice ICA

La app calcula un índice orientativo con la misma ponderación que el firmware
original (pH 40 %, turbidez 30 %, sólidos disueltos 30 %). Una fórmula es un
método y no un texto protegido; aun así, damos crédito a su origen en
[`docs/motor-de-reglas.md`](docs/motor-de-reglas.md).

## Cómo dar crédito

Si usas el firmware o la documentación, incluye una nota como esta:

> Basado en RE-FLUYE (https://github.com/tomasmanuelgp/Refluye), obra
> derivada del proyecto Re-Fluye de Alfredo Antonio Díaz Claros, CCD –
> Universidad Autónoma de Bucaramanga. Licencia CC BY-NC-SA 4.0.

## Plan de licencia única

El equipo gestiona con el autor original la autorización para relicenciar la
obra derivada. Cuando esté formalizada por escrito y pueda publicarse, el firmware y la
documentación pasarán también a una licencia libre compatible (AGPL-3.0 para
el código; CC BY-SA 4.0 para los textos). Hasta entonces, rige la tabla
anterior.

## La marca RE-FLUYE

Las licencias de este repositorio cubren el código y los textos, **no la
marca**. El nombre y el logotipo de RE-FLUYE identifican al proyecto oficial.
Si publicas una versión modificada, usa otro nombre y aclara que deriva de
RE-FLUYE. Esto protege a las familias que usan la app: un veredicto sobre el
agua debe poder rastrearse hasta quien lo produjo.

## Dependencias de terceros

Las librerías que usa la app (Expo, React Native,
`react-native-bluetooth-classic` y otras) conservan sus propias licencias,
en su mayoría MIT, compatibles con AGPL-3.0. La lista exacta está en
`mobile/package-lock.json`.
