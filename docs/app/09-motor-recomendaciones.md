# 09 · Motor de recomendaciones — versión implementada 0.5.0

Código: `../../mobile/src/dominio/motor.ts`. Instrucciones: `protocolos.ts`.
Casos esperados: `__tests__/casos-golden.json` en ese mismo directorio.
El [diseño inicial](../historial/09-diseno-inicial-no-vigente.md) se conserva como
historia; sus dosis, cadenas y autorizaciones por destino no están vigentes.

## Contrato y fiabilidad

`evaluar(lectura, observacion, calibracion, lecturaEstable)` es pura: no consulta red, reloj ni
almacenamiento. Devuelve versión, nivel interno, motivo, todos los IDs aplicables,
fiabilidad, ICA auxiliar, plan, destinos y advertencias. La IA no participa.
El nivel interno no se puede convertir en una autorización de consumo.

ICA orientativo exige pH finito 0–14, turbidez 0–200 NTU y TDS 0–2000 ppm. Un dato inválido
produce ICA nulo, nunca un dato recortado. Fórmula heredada con sPH acotado:

`round1(0.4 × max(0,100−abs(pH−7.4)×30) + 0.3 × (100−TURB/2) + 0.3 × (100−TDS/20))`.

La app muestra las **cuatro mediciones** (pH, turbidez, TDS, temperatura) junto al
índice. La temperatura aporta contexto físico, pero no recibe un peso numérico:
el proyecto no tiene una curva validada para convertirla en seguridad de consumo.
El ICA de 0–100 no es un porcentaje de potabilidad; olor, aspecto y calibración
pueden prevalecer sobre un valor alto. Su fórmula y los rangos TDS requieren
validación metrológica con los sensores reales antes de uso sanitario.

Confiable exige ICA calculable, ausencia de errores de trama, versión ≤ 1, una
lectura repetida estable y un
registro de calibración con responsable, referencia y fechas finitas coherentes:
verificación ≤ captura < vencimiento. Estabilidad no demuestra calibración.
El registro manual local no constituye verificación automática del equipo físico.
Temperatura ausente no altera el resultado. La primera trama íntegra y reciente
(menos de cinco segundos) ya permite capturar y analizar. Si aún no se observa
estabilidad, se conserva como **lectura inicial** y se marca no confiable. Si los
datos y la calibración sí están verificados y no hay vetos, puede mostrarse una
**ruta posible** de aclarado y desinfección, pero el texto prohíbe consumir antes
de verificar otra lectura. Sin calibración vigente o con datos inválidos, el plan
es `repetir`, aunque el ICA parezca favorable.

## Reglas y prioridad

Se evalúan todas; los vetos de nivel 2 preceden a la incertidumbre. La primera
aplicable es el motivo principal; todos los IDs quedan guardados. Las reglas
numéricas solo se aplican a valores dentro de los rangos válidos del sensor.

| Orden | ID | Condición | Nivel |
|---|---|---|---|
| 1 | R01 | Detalle de olor combustible | 2 |
| 2 | R02 | Olor raro, cualquiera que sea su detalle | 2 |
| 3 | R03 | Aspecto aceitoso | 2 |
| 4 | R06 | Verdosa y estancada | 2 |
| 5 | R04 | pH < 5.5 o > 9.5 | 2 |
| 6 | R08 | Turbidez ≥ 100 | 2 |
| 7 | R09 | TDS ≥ 1500 | 2 |
| 8 | R05 | Lectura no confiable | 1 |
| 9 | R07 | Verdosa | 1 |
| 10 | R10 | pH < 6.5 o > 8.5 | 1 |
| 11 | R11 | Turbidez ≥ 25 | 1 |
| 12 | R12 | TDS ≥ 600 | 1 |
| 13 | R13 | Estancada | 1 |
| 14 | R18 | Pozo o aljibe | 1 |
| 15 | R19 | Agua lluvia | 1 |
| 16 | R20 | Acueducto o tubería | 1 |
| 17 | R14 | Alguna observación «no sé» | 1 |
| 18 | R16 | Aspecto turbio | 1 |
| 19 | R15 | Ninguna regla anterior | 0 |

R10 usa 6.5–8.5, referencia del doc 04, más conservadora que el borrador 6–9.
R16 impide clasificar como favorable el aspecto turbio. R18, R19 y R20 (motor 0.5.0) explican el riesgo propio de cada origen y piden desinfectar; no cambian el plan, así que un pozo, el agua lluvia o un acueducto con lectura favorable siguen en `hervido`, nunca en una autorización. Los umbrales heredados
son decisiones del proyecto; no certifican cumplimiento sanitario.

## Planes y destinos

1. Cualquier nivel 2, R07, R10, R11 o R12: `alternativa`.
2. En ausencia de lo anterior, datos/calibración no verificados o R14: `repetir`.
3. En los demás casos: `hervido`, con aclarado y desinfección obligatoria. Si la
   lectura todavía varía, se muestra como orientación inicial sin permiso de
   consumo.

Solo el tercer plan orienta tratamiento para consumo humano; nunca declara el
agua potable. Los demás dicen «No consumir con esta evaluación». Animales y
riego requieren evaluación específica; con alternativa se muestran no recomendados.
La [iteración A-003](../historial/iteraciones/A-003.md) añade destinos para baño,
utensilios de comida y ropa. Un resultado favorable no autoriza el baño: los
sensores no detectan microorganismos. Si se sospecha combustible u otro peligro
que activa `alternativa`, no se recomienda contacto ni limpieza con esta agua.
Sin calibración vigente, tampoco se recomienda lavar utensilios. El uso que
selecciona la persona no cambia el veredicto; solo prioriza una orientación
determinista compatible con él.

| Plan | Pasos | Límite |
|---|---|---|
| alternativa | Separar agua, conseguir abastecimiento controlado, solicitar revisión | No habilita el agua original |
| repetir | Revisar equipo/calibración, preparar medición, completar observación | Repetir no elimina contaminantes |
| hervido | Aclarar, llevar a ebullición, mantener hervor, enfriar y guardar | No elimina químicos, metales, sales ni toxinas de algas |

Si después de aclarar sigue turbia, el texto exige detenerse y buscar otra fuente.
El hervor tiene temporizador de 180 segundos desde burbujeo fuerte. No se puede
avanzar antes; se puede reiniciar si se interrumpe. El progreso se guarda por captura.

CDC recomienda un minuto y tres por encima de 6500 pies (~1981 m). La app usa tres
minutos como decisión conservadora sin depender de conocer la altitud, a costa
de más combustible en zonas bajas. [CDC](https://www.cdc.gov/water-emergency/about/index.html).
El agua verdosa no recibe hervido: las toxinas de algas no se eliminan hirviendo.
[CDC](https://www.cdc.gov/harmful-algal-blooms/prevention/index.html).

### Otras formas de desinfectar (desde motor 0.5.0)

Con el plan `hervido`, la pantalla del protocolo deja elegir cómo desinfectar
(`METODOS` y `metodosPara` en `protocolos.ts`). Con `alternativa` o `repetir` no
se ofrece ningún método: la prueba de invariantes lo comprueba en todas las
combinaciones, incluidas agua verde y olor extraño (S4, S5).

| Método | Cantidades y tiempos | Fuente |
|---|---|---|
| Hervir (por defecto) | 3 minutos desde el burbujeo fuerte | [CDC](https://www.cdc.gov/water-emergency/about/index.html) |
| Cloro | Blanqueador doméstico sin perfume ni detergente. Del 5 % al 9 %: 2 gotas por litro (40 por 20 L); del 1 %: 10 gotas por litro; el doble si está turbia, con color o muy fría; esperar 30 minutos. Otra concentración o sin etiqueta: no usar | [CDC](https://www.cdc.gov/water-emergency/about/index.html) |
| Sol (SODIS) | Botellas transparentes de 2 L o menos, agua clara (prueba del periódico), 6 horas de sol o 2 días si está nublado; no sirve con lluvia continua | [CDC](https://www.cdc.gov/water-emergency/about/index.html) · [Akvopedia](https://akvopedia.org/wiki/Sodis) |

Las cantidades se copian tal cual de CDC: la app no calcula ni redondea dosis, y
`protocolos.test.ts` fija cada cifra. El borrador antiguo tenía equivalencias
erróneas; esta versión las sustituye. **Antes de publicar estos métodos, una
persona del área de salud debe revisarlos** (ver el PR que los introduce).
Sigue sin haber corrección doméstica de pH ni filtros de arena o carbón.

## Guías de cuidado

`src/dominio/guias.ts` reúne seis guías que la app muestra sin internet en
**Aprender** y, como sugerencia, en el resultado: `guardar`, `aclarar`, `fuente`,
`agua-verde`, `equipo` y `salud`. Son contenido, no decisión: no cambian el
veredicto (S3) y cada pantalla repite el aviso `AVISO_GUIAS`.

`guiasRecomendadas(resultado, observación)` elige hasta tres guías:

| Condición | Guía |
|---|---|
| Aspecto verdoso | `agua-verde` (siempre primera) |
| Plan `hervido` y agua turbia | `aclarar` |
| Plan `hervido` | `guardar` |
| Plan `repetir` | `equipo` |
| Plan `alternativa` u origen estancado | `fuente` |
| Siempre, si cabe | `salud` |

Las guías `aclarar` y `guardar` solo aparecen con el plan `hervido`; la prueba de
invariantes lo comprueba en todas las combinaciones (S3, S5). Ninguna guía da
dosis de cloro, gotas ni cucharadas: esas cantidades viven solo en el protocolo
de desinfección y exigen la misma revisión
técnica que se pide para reintroducir cloración o SODIS. Para el tanque, la guía
remite a la dosis que indique el acueducto o la secretaría de salud.

Fuentes: [OMS · Enfermedades diarreicas](https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease) ·
[CDC · Almacenamiento del agua](https://www.cdc.gov/global-water-sanitation-hygiene/about/about-safe-water-storage.html) ·
[CDC · Floraciones de algas](https://www.cdc.gov/harmful-algal-blooms/prevention/index.html) ·
[ACNUR · Distancias de letrinas](https://www.unhcr.org/sites/default/files/legacy-pdf/49d080df2.pdf) ·
[CRA · Limpieza de tanques](https://normas.cra.gov.co/gestor/docs/concepto_superservicios_0000344_2022.htm) ·
[NSW Health · Agua lluvia](https://www.health.nsw.gov.au/environment/water/Pages/rainwater.aspx).

## Restricciones y pruebas

S1–S3: textos condicionados, desinfección obligatoria y decisión local determinista.
S4–S5: olor extraño y agua verdosa nunca terminan en hervido. S6: cada resultado
incluye «Este equipo no detecta bacterias, virus ni parásitos. No certifica
potabilidad». S7: sin calibración vigente no hay fiabilidad. S8: sin coordenadas.

22 escenarios golden y 22680 combinaciones adicionales de parámetros y observaciones.
`npm run test:coverage` exige 100 % de ramas, líneas, sentencias y funciones del
motor. Cobertura demuestra ejecución del código, no validación sanitaria en campo.
