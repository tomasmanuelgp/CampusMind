# 01 · El proyecto Re-Fluye

## El problema

En las zonas rurales de Colombia —y de buena parte de América Latina— la gente
bebe, cocina, da de beber a sus animales y riega sus cultivos con agua de la que
no sabe nada. Las razones son concretas:

- **No hay laboratorios accesibles.** Un análisis fisicoquímico completo exige
  desplazarse a una cabecera municipal, pagar entre $150.000 y $400.000 COP y
  esperar días por un resultado.
- **Los kits comerciales no sirven para esta población.** Son caros, se leen por
  comparación de color (poco confiable), y entregan números sin interpretación:
  te dicen "pH 5.8" pero no qué hacer con eso.
- **La contaminación hídrica es la principal causa de enfermedad
  gastrointestinal en el campo**, y afecta desproporcionadamente a niños.
- **El conocimiento que la gente ya tiene se desperdicia.** Un campesino sabe
  que el agua "huele raro", que el pozo tiene una nata verdosa, que después de
  la lluvia baja turbia. Ningún dispositivo del mercado incorpora esa
  información, que muchas veces es más informativa que un número.

## La propuesta

Re-Fluye combina dos fuentes de información que normalmente están separadas:

**Cuatro sensores electrónicos** — pH, turbidez, sólidos disueltos (TDS) y
temperatura — montados sobre un ESP32 que transmite por Bluetooth.

**Tres observaciones humanas** — de dónde viene el agua (corriente o estancada),
a qué huele (normal o raro), cómo se ve (limpia, verdosa o aceitosa) — que el
usuario captura en la app.

Ambas se cruzan en una **lógica híbrida** que produce un veredicto tipo semáforo
y, sobre todo, **un protocolo de tratamiento concreto según el uso que se le vaya
a dar al agua**: consumo humano, consumo animal o riego.

El aporte real del proyecto no es medir —eso lo hace cualquier sonda— sino
**traducir la medición en una acción que una persona sin formación técnica pueda
ejecutar hoy, con lo que tiene en su casa.**

## Por qué la observación humana no es decorativa

Los cuatro sensores tienen un punto ciego enorme. No detectan hidrocarburos, no
detectan algas, no detectan materia orgánica en descomposición, no detectan
patógenos. Un agua con una película de aceite y un agua limpia pueden dar
exactamente el mismo pH, la misma turbidez y el mismo TDS.

La nariz y los ojos de quien está parado frente a la fuente cubren justamente
ese punto ciego. Por eso la regla de mayor prioridad del sistema es que **un olor
extraño invalida cualquier lectura favorable de los sensores**: el olor es
evidencia de algo que el equipo no puede medir.

Esta es la decisión de diseño más importante del proyecto y hay que preservarla
íntegra en la nueva aplicación.

## Para quién es

**Usuario primario: la persona que vive del agua.**
Campesino, campesina, familia rural, líder de acueducto veredal. Puede tener
alfabetización baja o media. Usa el celular a diario (WhatsApp sobre todo) pero
no es "usuario técnico". Va a usar la app parado junto a un río, con sol directo
sobre la pantalla, posiblemente con las manos mojadas, sin señal y con la batería
a medias. **Si la app no funciona en esas condiciones, no funciona.**

**Usuario secundario: el técnico o promotor.**
Estudiante de la UNAB, técnico de la CAR, promotor de salud, extensionista
agropecuario. Calibra el equipo, capacita a la comunidad, revisa el histórico y
exporta informes. Necesita ver los datos crudos y la trazabilidad.

**Usuario terciario: la institución.**
Secretaría de Salud, corporación autónoma regional, universidad, ONG. No usa la
app de campo: consume los datos agregados. Le interesa dónde está el problema,
desde cuándo y con qué tendencia.

## Qué significa "éxito"

El proyecto no se mide en descargas. Se mide en si una persona que midió su agua
**hizo algo distinto** con ella después de medirla. Un veredicto que no cambia el
comportamiento es un veredicto inútil.

De ahí se derivan tres criterios prácticos:

1. **Comprensibilidad.** La recomendación debe poder ejecutarse sin comprar nada
   que no exista en una tienda veredal, y sin leer más de lo que la persona esté
   dispuesta a leer.
2. **Honestidad sobre los límites.** Si el equipo no puede saber algo, la app lo
   dice. La confianza se pierde una sola vez.
3. **Continuidad.** Una medición aislada dice poco. El valor aparece cuando la
   misma fuente se mide repetidamente y se ve la tendencia.

## Actores y su relación con el sistema

| Actor | Qué aporta | Qué obtiene |
|---|---|---|
| Usuario de campo | La observación cualitativa y la muestra | Veredicto + protocolo de tratamiento |
| Dispositivo Re-Fluye | Las cuatro medidas fisicoquímicas | — |
| App (modo offline) | Motor de reglas y protocolos | Veredicto sin necesidad de internet |
| App (modo conectado) | Acompañamiento conversacional | Explicación adaptada y respuesta a dudas |
| Backend | Persistencia, geolocalización, agregación | Mapa de calidad hídrica territorial |
| Institución | Validación de laboratorio, acción | Datos para priorizar intervenciones |

## Historia del repositorio original

Contexto útil para entender por qué el código está como está.

```
2025          Plan de Proyecto v1.0 — 8 fases, 15 semanas
mayo–jun 2026 Redacción de las guías técnicas (Word)
27–30 jul     Diseño de la PCB en KiCad — 4 días, 17 backups
21 ago 08:20  Cotización de fabricación de la PCB — $48.000 COP
21 ago 17:11  Primer commit
21 ago 17:52  Último commit (Update README.md)
```

Todo el repositorio se subió en 41 minutos de una sola tarde. Es un volcado de
archivos, no un repositorio curado, y eso explica la mayoría de sus problemas:
versiones del firmware que quedaron desincronizadas, documentación que describe
un sistema distinto al que está publicado, y la aplicación —la pieza central—
ausente.

La documentación conceptual, en cambio, es de buena calidad: rangos anclados a
normativa real, presupuesto con precios locales, matriz de riesgos y
procedimientos de diagnóstico. **Hay mucho que conservar; lo que falla es el
ensamblaje, no el diseño.**

## Licencia

El proyecto original se declara bajo **Creative Commons BY-NC-SA 4.0** (aunque el
repositorio no incluye el archivo `LICENSE`). El trabajo derivado debe mantener
atribución al autor original y a la UNAB, y conservar la misma licencia.
