# Seguridad

RE-FLUYE orienta decisiones sobre el agua que bebe una familia. Un error de
seguridad aquí puede ser también un riesgo para la salud. Gracias por
reportarlo con cuidado.

## Cómo reportar una vulnerabilidad

**No abras un *issue* público.** Usa el reporte privado de GitHub:
pestaña **Security → Report a vulnerability** del repositorio. Si no está
disponible, escribe un mensaje privado a quien mantiene el repositorio
(cuenta de GitHub `tomasmanuelgp`).

Incluye, si puedes:

- qué componente afecta (app, firmware, protocolo, documentación);
- cómo reproducirlo, paso a paso;
- qué podría pasarle a una persona que usa la app.

Responderemos en un plazo de 7 días. Priorizamos cualquier fallo que pueda
hacer que la app muestre un resultado más favorable que el que corresponde.

## Qué consideramos de seguridad

- Cualquier camino por el que la app diga que un agua sirve para beber sin
  desinfección, o se salte un veto (reglas S1–S8 de
  [CONTRIBUTING.md](CONTRIBUTING.md)).
- Exposición de datos personales guardados en el teléfono.
- Claves, tokens o contraseñas publicados en el repositorio.
- Una APK que no esté firmada con el certificado oficial.

## Límites conocidos (no son vulnerabilidades nuevas)

| Límite | Por qué existe | Mitigación |
|---|---|---|
| El equipo no detecta bacterias, virus ni parásitos | pH, turbidez, sólidos disueltos y temperatura no los miden | Toda recomendación de consumo exige desinfección (S2) y cada resultado lo advierte (S6) |
| La calibración es **declarada** | La app guarda lo que escribe un técnico; no puede comprobar la sonda | La pantalla lo dice. Verificación real prevista con el campo `CALIB` del protocolo `VER:2` |
| El emparejamiento Bluetooth usa el PIN público `1234` | Facilita el uso en campo | El equipo no recibe comandos, solo envía lecturas. Un equipo falso cercano podría enviar lecturas inventadas, pero los vetos por observación humana siguen funcionando |
| La base de datos del teléfono no está cifrada | Funciona sin cuentas ni contraseñas | Copia de seguridad de Android desactivada; las mediciones no guardan nombres ni la dirección del equipo |
| Vulnerabilidades altas en `expo-router` 57 | Dependencias de Expo SDK 57 | Corrección prevista al migrar a Expo SDK 58 |

## APK oficial

Instala RE-FLUYE solo desde la página de
[publicaciones](https://github.com/tomasmanuelgp/Refluye/releases), nunca
desde una copia reenviada. Cada publicación incluye la suma SHA-256 del archivo.

Huella SHA-256 del certificado de publicación (RSA de 4096 bits, desde la
versión 1.0.0):

```
55:A4:9B:FA:73:8B:3B:26:93:39:7C:4D:D2:E8:1B:1F:03:46:7F:B7:0A:38:F0:E5:86:E5:66:3E:8C:9E:A3:D6
```

Para comprobar una APK descargada (necesita las herramientas de compilación de
Android, ver [mobile/README.md](mobile/README.md#firma-de-publicación)):

```sh
apksigner verify --print-certs refluye-1.0.1-oficial.apk
```

La línea `SHA-256 digest` debe coincidir con la huella de arriba (en minúsculas y sin los dos
puntos). Si no coincide, no instales la APK y repórtalo por el canal privado.
Las APK de prueba anteriores usan la firma de desarrollo y no deben
redistribuirse.

## Secretos

El repositorio no contiene claves. Una revisión con gitleaks de todo el
historial (2026-11-08) no encontró ninguna, y la integración continua la repite
en cada cambio. Si encuentras una, repórtala por el canal privado: rotarla es
más urgente que borrarla.
