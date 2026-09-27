# 09 · Motor de recomendaciones — versión implementada 0.2.0

Código: `../../mobile/src/dominio/motor.ts`. Instrucciones: `protocolos.ts`.
Casos esperados: `__tests__/casos-golden.json` en ese mismo directorio.
El [diseño inicial](../historico/09-diseno-inicial-no-vigente.md) se conserva como
historia; sus dosis, cadenas y autorizaciones por destino no están vigentes.

## Contrato y fiabilidad

`evaluar(lectura, observacion, calibracion)` es pura: no consulta red, reloj ni
almacenamiento. Devuelve versión, nivel interno, motivo, todos los IDs aplicables,
fiabilidad, ICA auxiliar, plan, destinos y advertencias. La IA no participa.
El nivel interno no se puede convertir en una autorización de consumo.

ICA exige pH finito 0–14, turbidez 0–200 NTU y TDS 0–2000 ppm. Un dato inválido
produce ICA nulo, nunca un dato recortado. Fórmula heredada con sPH acotado:

`round1(0.4 × max(0,100−abs(pH−7.4)×30) + 0.3 × (100−TURB/2) + 0.3 × (100−TDS/20))`.

Confiable exige ICA calculable, ausencia de errores de trama, versión ≤ 1 y un
registro de calibración con responsable, referencia y fechas finitas coherentes:
verificación ≤ captura < vencimiento. Estabilidad no demuestra calibración.
El registro manual local no constituye verificación automática del equipo físico.
Temperatura ausente no altera el resultado.

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
| 14 | R14 | Alguna observación «no sé» | 1 |
| 15 | R16 | Aspecto turbio | 1 |
| 16 | R15 | Ninguna regla anterior | 0 |

R10 usa 6.5–8.5, referencia del doc 04, más conservadora que el borrador 6–9.
R16 impide clasificar como favorable el aspecto turbio. Los umbrales heredados
son decisiones del proyecto; no certifican cumplimiento sanitario.

## Planes y destinos

1. Cualquier nivel 2, R07, R10, R11 o R12: `alternativa`.
2. En ausencia de lo anterior, lectura no confiable o R14: `repetir`.
3. En los demás casos: `hervido`, con aclarado y desinfección obligatoria.

Solo el tercer plan orienta tratamiento para consumo humano; nunca declara el
agua potable. Los demás dicen «No consumir con esta evaluación». Animales y
riego requieren evaluación específica; con alternativa se muestran no recomendados.
La [iteración A-003](../prompts/iteraciones/A-003.md) añade destinos para baño,
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

No hay cloración, corrección doméstica de pH, filtro de arena/carbón ni SODIS.
El borrador tenía equivalencias erróneas de gotas, mL y cucharaditas; reintroducir
esos tratamientos exige revisión técnica y nuevos casos golden.

## Restricciones y pruebas

S1–S3: textos condicionados, desinfección obligatoria y decisión local determinista.
S4–S5: olor extraño y agua verdosa nunca terminan en hervido. S6: cada resultado
incluye «Este equipo no detecta bacterias, virus ni parásitos. No certifica
potabilidad». S7: sin calibración vigente no hay fiabilidad. S8: sin coordenadas.

21 escenarios golden y 22680 combinaciones adicionales de parámetros y observaciones.
`npm run test:coverage` exige 100 % de ramas, líneas, sentencias y funciones del
motor. Cobertura demuestra ejecución del código, no validación sanitaria en campo.
