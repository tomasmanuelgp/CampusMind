# Prompt del ciclo de mejora — Re-Fluye

Este archivo contiene el prompt para ejecutar ciclos iterativos de mejora sobre
el proyecto Re-Fluye.

**Uso con Claude Code:**

```
/loop refluye/prompts/loop-mejora.md
```

O pegando el bloque de abajo directamente. Sin intervalo, el modelo se autorregula
y decide cuándo cerrar cada iteración.

---

## El prompt

```
Estás mejorando Re-Fluye: una aplicación móvil que ayuda a familias rurales de
Colombia a evaluar la calidad del agua que usan y a tratarla de forma segura,
conectándose por Bluetooth a un dispositivo con sensores de pH, turbidez, TDS y
temperatura.

## Antes de tocar nada

Lee, en este orden:
1. refluye/README.md
2. refluye/contexto/05-estado-actual-y-deuda.md
3. El documento específico del área en la que vas a trabajar

No propongas cambios sin haber leído el documento del área correspondiente. La
documentación contiene decisiones ya tomadas y restricciones de seguridad
verificadas; contradecirlas por desconocimiento desperdicia la iteración.

## Restricciones de seguridad — innegociables

Son ocho. Cualquier cambio que viole una de ellas se rechaza sin discusión,
por bueno que sea en otros aspectos.

S1. Ninguna pantalla dice "potable", "apta" o "segura" a secas.
S2. Toda recomendación de consumo humano incluye desinfección, aun con ICA 100.
S3. El veredicto lo calcula el motor determinista, nunca la IA.
S4. El veto por olor extraño no puede anularse por ninguna vía.
S5. Agua verdosa nunca se resuelve solo con "hervir" (toxinas termoestables).
S6. Toda pantalla de resultado muestra el descargo sobre microbiología.
S7. Si la calibración está vencida o ausente, el resultado se marca no confiable.
S8. La geolocalización requiere consentimiento explícito y revocable.

Razón de fondo: el equipo mide parámetros fisicoquímicos y NO detecta bacterias,
virus ni parásitos, que son la causa principal de enfermedad gastrointestinal en
el campo. Prometer más de lo que el equipo sabe es el peor error posible.

## Qué hacer en cada iteración

1. ELIGE UN ÁREA. Una sola. Las áreas, por orden de valor:

   A. Motor de reglas y protocolos de tratamiento  (doc 09) — el corazón
   B. UI/UX y accesibilidad                         (doc 08)
   C. Capa de IA y acompañamiento                   (doc 10)
   D. Arquitectura, offline-first, rendimiento      (doc 07)
   E. Datos, geolocalización, camino a ML           (doc 11)
   F. Firmware y protocolo Bluetooth                (docs 02, 03)

2. DIAGNOSTICA. Encuentra la carencia más importante del área, no la más fácil.
   Pregúntate: ¿qué es lo que más probablemente haga que una persona real no
   use esto, o lo use mal, o se haga daño?

3. PROPÓN UNA MEJORA CONCRETA. Una, bien resuelta. Incluye:
   - Qué problema resuelve y para quién
   - Qué cambia exactamente (archivos, pantallas, reglas, textos)
   - Qué riesgo introduce y cómo se controla
   - Cómo se verifica que funcionó
   - Contra qué restricción de seguridad podría chocar y por qué no choca

4. IMPLEMENTA. Escribe el código o el documento. Si tocas el motor de reglas o
   los protocolos, añade el caso a la tabla golden en el mismo cambio.

5. ACTUALIZA LA DOCUMENTACIÓN. Un cambio no documentado es deuda inmediata.
   Este proyecto ya murió una vez por desincronización entre documentos y código.

6. REGISTRA. Añade una línea a refluye/prompts/bitacora.md:
   fecha · área · qué cambió · por qué · cómo se verificó

## Cómo elegir qué mejorar

Prioriza en este orden:

1. Lo que evita daño a una persona
   (una recomendación que no funciona, un mensaje que da falsa seguridad)
2. Lo que hace que alguien abandone la app
   (no se entiende, no funciona sin señal, es lento, falla)
3. Lo que hace que la recomendación se ejecute mal
   (dosis confusas, pasos ambiguos, materiales que nadie tiene)
4. Lo que mejora el valor de los datos a largo plazo
   (trazabilidad, validación contra laboratorio)
5. Lo que hace el código más mantenible

Ignora, salvo que se pida explícitamente: refactorizaciones sin efecto visible,
dependencias nuevas que no resuelven un problema real, funcionalidades que no
estén en la visión de producto (doc 06).

## Preguntas útiles para diagnosticar

Sobre el motor y los protocolos:
- ¿Hay alguna combinación de entradas que produzca una recomendación que no
  funcione para ese tipo de contaminación?
- ¿Alguna dosis está expresada en unidades que nadie puede medir en una cocina?
- ¿Algún protocolo omite decir qué NO elimina?
- ¿Alguna regla depende de un sensor que puede estar descalibrado o ausente?

Sobre la interfaz:
- ¿Esta pantalla se lee bajo sol directo?
- ¿Se puede usar con una sola mano y mojada?
- ¿Alguien que lee con dificultad puede completar esto?
- ¿Qué pasa si el usuario no entiende la pregunta que le estamos haciendo?
- ¿La información más importante está antes del primer scroll?

Sobre la IA:
- ¿Puede esta respuesta contradecir el veredicto si el usuario insiste?
- ¿Qué pasa si el modelo no responde, responde lento o responde mal?
- ¿Estamos enviando datos que no hacen falta?

Sobre los datos:
- ¿Esta medición sería utilizable para entrenar un modelo dentro de dos años?
- ¿Qué falta para poder excluir las mediciones de equipos descalibrados?
- ¿Puede esta información perjudicar a la comunidad que la produjo?

## Formato de salida de cada iteración

### Área
[una de A–F]

### Diagnóstico
[el problema concreto, con evidencia: archivo, pantalla, regla o texto específico]

### Propuesta
[la mejora, en 3–6 frases]

### Riesgo y control
[qué puede salir mal y cómo se evita]

### Verificación
[cómo se sabe que funcionó: prueba, medición, caso golden]

### Restricciones de seguridad
[cuáles toca y por qué no las viola]

### Cambios
[archivos creados o modificados]

## Cuándo parar

Detén el ciclo cuando ocurra alguna de estas:
- Las mejoras propuestas ya son cosméticas o especulativas
- Lo siguiente que falta requiere una decisión humana (presupuesto, alcance,
  producción de videos, acceso a hardware o a un laboratorio)
- Se necesita validación en campo con usuarios reales antes de seguir
- Llevas tres iteraciones sin encontrar nada del nivel 1 o 2 de la lista de
  prioridades

Cuando pares, escribe un resumen de lo hecho y una lista de lo que queda
bloqueado esperando decisión humana.
```

---

## Variantes

### Iteración enfocada en un área

Añade al final del prompt:

```
Esta iteración trabaja únicamente en el área [X]. No propongas cambios en otras
áreas aunque los detectes; anótalos en refluye/prompts/pendientes.md y sigue.
```

### Iteración de auditoría (sin escribir código)

```
Esta iteración es de solo diagnóstico. No modifiques archivos. Revisa el área
[X] contra las ocho restricciones de seguridad y contra los criterios de
aceptación del doc 12, y entrega un informe de hallazgos ordenado por gravedad,
con archivo y línea cuando aplique.
```

### Iteración de redacción de protocolos

```
Esta iteración escribe protocolos de tratamiento nuevos siguiendo la estructura
del doc 09. Para cada uno: título, cuándo aplica, materiales que existan en una
tienda veredal, pasos numerados en segunda persona, dosis en unidades caseras
calculadas por volumen, tiempos, advertencias, y —obligatorio— la lista de qué
NO elimina. Redacta uno completo antes de empezar el siguiente.
```

---

## Archivos que mantiene el ciclo

| Archivo | Contenido |
|---|---|
| `refluye/prompts/bitacora.md` | Una línea por iteración: fecha, área, cambio, verificación |
| `refluye/prompts/pendientes.md` | Hallazgos detectados fuera del área de la iteración |
| `refluye/prompts/decisiones.md` | Decisiones que requirieron criterio humano |
