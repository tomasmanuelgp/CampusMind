# Cómo contribuir a RE-FLUYE

Gracias por querer mejorar RE-FLUYE. Este proyecto orienta a familias rurales
sobre el agua que usan, así que cada cambio debe ser **seguro antes que
ingenioso**. Esta guía explica cómo proponer cambios sin romper esa promesa.

¿Es tu primera vez con Git? Empieza por construir un equipo con la
[guía de hardware](docs/hardware.md) y probar la app en modo DEMO. Lo que
aprendas al construir —un paso confuso, una foto que falta— es la
contribución más valiosa.

## Reglas que ninguna contribución puede romper

Un cambio que viole cualquiera de estas reglas se rechaza, aunque todo lo demás
esté bien.

| # | Regla |
|---|---|
| S1 | Ninguna pantalla dice «potable», «apta» o «segura» a secas |
| S2 | Toda recomendación de consumo humano incluye desinfección, aun con ICA 100 |
| S3 | El veredicto lo calcula el motor determinista, nunca la IA |
| S4 | El veto por olor extraño no puede anularse por ninguna vía |
| S5 | Agua verdosa nunca se resuelve solo con «hervir» (toxinas termoestables) |
| S6 | Toda pantalla de resultado muestra que el equipo no detecta microbios |
| S7 | Calibración vencida o ausente ⇒ resultado marcado como no confiable |
| S8 | La geolocalización requiere consentimiento explícito y revocable |

Las reglas S1, S2, S4, S5, S6 y S7 tienen pruebas automáticas en
`mobile/src/dominio/invariantes.test.ts`. Si una de esas pruebas falla, **no
la cambies para que pase**: revisa tu cambio.

## Tipos de contribución

- **Reportar un error.** Abre un *issue* con la plantilla «Error». Di qué
  pasó, en qué teléfono, con qué versión de la app y del firmware.
- **Contar un hallazgo de campo.** Usa la plantilla «Hallazgo de campo». No
  escribas nombres de personas ni ubicaciones exactas de fuentes.
- **Mejorar la documentación.** Corrige la guía directamente en `docs/` y abre
  un *pull request*.
- **Cambiar código.** Lee la sección siguiente.

## Preparar el entorno

Necesitas Git y Node.js 22.

```sh
git clone https://github.com/tomasmanuelgp/CampusMind.git
cd CampusMind/mobile
npm ci
npm run web          # interfaz en el navegador con datos DEMO
```

Antes de abrir un *pull request*, ejecuta en `mobile/`:

```sh
npm run typecheck    # tipos de TypeScript
npm run lint         # ESLint
npm run format:check # formato (npm run format lo corrige)
npm run test:coverage
```

Y en la raíz del repositorio:

```sh
python3 scripts/verificar-enlaces.py
```

La integración continua ejecuta lo mismo, más la compilación del firmware y la
búsqueda de secretos. Un *pull request* en rojo no se fusiona.

## Dónde va cada cosa

| Carpeta | Qué contiene | Regla |
|---|---|---|
| `mobile/src/dominio/` | Motor de reglas, orientación por uso, catálogos | TypeScript puro: sin React, sin red, sin archivos. **100 % de cobertura obligatoria** |
| `mobile/src/aplicacion/` | Sesión de medición y acceso a datos para las pantallas | Une el dominio con la infraestructura |
| `mobile/src/infraestructura/` | Bluetooth (SPP) y SQLite | Todo lo que habla con el teléfono |
| `mobile/src/app/` | Pantallas (expo-router) | No calcula veredictos: los muestra |
| `mobile/src/ui/` | Componentes visuales | Botones de al menos 64 px, contraste alto |
| `firmware/` | Código del ESP32 | Cumple `docs/protocolo-bluetooth.md` |
| `docs/` | Documentación | En español, para estudiantes de colegio |

Más detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Cambios en el motor de reglas

El motor (`mobile/src/dominio/motor.ts`) decide qué se le dice a una familia
sobre su agua. Por eso:

1. Toda regla nueva o modificada entra con su caso en
   `mobile/src/dominio/__tests__/casos-golden.json`.
2. Explica en el *pull request* qué cambia para la persona que mide, con un
   ejemplo concreto.
3. Si la regla se vuelve **más permisiva** (por ejemplo, permite tratar un agua
   que antes mandaba a buscar otra fuente), necesita la revisión de una persona
   con formación en salud pública o calidad del agua.

Lee [docs/motor-de-reglas.md](docs/motor-de-reglas.md) antes de empezar.

## Cambios en el protocolo Bluetooth

[docs/protocolo-bluetooth.md](docs/protocolo-bluetooth.md) es normativo: el
firmware y la app se ajustan al documento, no al revés. Un cambio de protocolo
empieza por un *pull request* a ese documento.

## Estilo

- Todo en **español**: textos de pantalla, comentarios, documentación e
  identificadores (`veredicto`, `turbidez`, `esEstancada`).
- Textos de pantalla cortos y concretos, para leer con sol directo y manos
  mojadas.
- Mensajes de commit en español, en presente: `feat(app): mostrar ...`,
  `fix(firmware): ...`, `docs: ...`.

## Privacidad

Nunca subas al repositorio datos reales de personas: nombres, teléfonos,
fotos, coordenadas de fuentes o exportaciones CSV de mediciones. Tampoco
claves ni tokens: usa `.env` (ignorado por Git) y documenta la variable en
`.env.example`.

## Licencia de tus contribuciones

Al contribuir aceptas que tu aporte se publique bajo la licencia de la carpeta
que modificas: AGPL-3.0 en `mobile/`, CC BY-NC-SA 4.0 en `firmware/` y
`docs/`. Ver [LICENCIAS.md](LICENCIAS.md).

## Convivencia

Este proyecto sigue un [código de conducta](CODE_OF_CONDUCT.md). En el equipo
hay estudiantes menores de edad: el trato respetuoso no es opcional.
