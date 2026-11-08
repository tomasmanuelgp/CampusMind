# 04 · Dominio: calidad del agua

Este documento define qué significan los números, de dónde salen los umbrales y
—sobre todo— **qué no puede saber este equipo**. Es la base del motor de
recomendaciones.

---

## ⚠️ El límite más importante del proyecto

**Re-Fluye no detecta contaminación microbiológica.**

Los cuatro sensores —pH, turbidez, TDS, temperatura— son fisicoquímicos. Ninguno
detecta *E. coli*, coliformes fecales, *Giardia*, *Cryptosporidium*, rotavirus,
hepatitis A ni ningún otro patógeno.

Esto no es un detalle técnico: **los patógenos son la causa principal de la
enfermedad gastrointestinal que el proyecto dice combatir.** Un agua cristalina,
con pH 7.2, turbidez 2 NTU y TDS 180 ppm —perfecta en los cuatro sensores— puede
estar cargada de coliformes fecales y enfermar a quien la beba.

### Qué se deriva de esto para el diseño

1. **El sistema nunca debe declarar agua "apta para consumo humano" sin
   tratamiento.** El veredicto verde significa *"los parámetros fisicoquímicos
   son buenos"*, no *"es potable"*.

2. **Toda recomendación de consumo humano incluye desinfección**, sin excepción,
   incluso con ICA de 100. Hervir o clorar es barato, accesible y cubre
   exactamente el punto ciego del equipo.

3. **La turbidez es el mejor indicador indirecto disponible** y hay que usarlo
   como tal: la materia en suspensión protege a los microorganismos de la
   desinfección y suele correlacionar con contaminación fecal. Por eso el
   protocolo siempre es *filtrar primero, desinfectar después* — nunca al revés.

4. **El origen "estancada" es un factor de riesgo microbiológico**, no solo
   estético. Agua quieta a temperatura ambiente es un medio de cultivo.

5. **El lenguaje de la interfaz debe reflejarlo.** Se prohíben las etiquetas
   "APTA", "POTABLE" y "SEGURA" a secas. Ver el vocabulario más abajo.

> Esta es la corrección de fondo más importante respecto al sistema original,
> que sí declaraba *"Apta para consumo humano directo"* y *"puede distribuirse
> sin tratamiento previo"*. Ese mensaje es peligroso y no se replica.

---

## Qué mide cada parámetro

### pH
Acidez o alcalinidad, escala 0–14. No es tóxico por sí mismo en el rango
intermedio, pero importa por tres razones: fuera de 6.5–8.5 corroe tuberías y
disuelve metales; por debajo de 6 o por encima de 9 **reduce mucho la eficacia
del cloro**; y un pH extremo es señal de contaminación industrial o minera.

- Óptimo consumo: **6.5 – 8.5**
- Aceptable: 6.0 – 9.0
- Crítico: **< 5.5 o > 9.5** → no apta para ningún uso sin tratar

### Turbidez (NTU)
Partículas en suspensión. Es el parámetro más importante del equipo por lo dicho
arriba: **protege a los patógenos de la desinfección**. La OMS recomienda < 5 NTU
para que la cloración sea confiable, e idealmente < 1 NTU.

- Óptimo: **< 5 NTU**
- Aceptable animales: < 50 NTU
- Riego: < 100 NTU
- Rango del equipo: 0–200 NTU

### TDS (ppm)
Sales y minerales disueltos. Afecta sabor y, en riego, la salinidad del suelo. Un
TDS bajo no significa agua segura (el agua de lluvia contaminada tiene TDS bajo);
un TDS alto no siempre es peligroso (puede ser mineralización natural).

- Ideal: **< 300 ppm** · Máximo consumo: < 600 ppm
- Animales: < 1000 ppm · Riego: < 2000 ppm

### Temperatura (°C)
No define potabilidad. Importa porque compensa la lectura de TDS, porque el agua
tibia favorece el crecimiento microbiano, y porque afecta el sabor.

- Rango de referencia: 10 – 25 °C
- **`-127` = sensor desconectado**, no una temperatura

---

## Rangos por destino

Fuentes: OMS 2022, **Resolución 2115/2007 del MinSalud de Colombia**, EPA, IDEAM,
USDA para riego.

| Parámetro | Consumo humano | Consumo animal | Riego |
|---|---|---|---|
| pH | 6.5 – 8.5 | 6.0 – 9.0 | 4.5 – 9.5 |
| Turbidez | < 5 NTU | < 50 NTU | < 100 NTU |
| TDS | < 300 (máx 600) | < 1000 ppm | < 2000 ppm |
| Temperatura | 10 – 25 °C | sin límite estricto | sin límite estricto |

---

## El ICA (Índice de Calidad del Agua)

Índice 0–100 que resume tres parámetros en un número, inspirado en los modelos de
la NSF (Brown et al., 1970) y del IDEAM.

### Fórmula correcta

```
sPH = 100 − |pH − 7.4| × 30      acotado a [0, 100]
sTU = 100 − (Turbidez / 2)        acotado a [0, 100]   ← rango 0–200 NTU
sTD = 100 − (TDS / 20)            acotado a [0, 100]   ← rango 0–2000 ppm

ICA = sPH × 0.40 + sTU × 0.30 + sTD × 0.30      acotado a [0, 100]
```

### ⚠️ Corrección respecto a la documentación original

El README y la Guía Parte 1 del proyecto original publican una fórmula
**matemáticamente rota**:

```
sTU = 100 − Turbidez        → con Turbidez=200 da −100
sTD = 100 − (TDS / 10)      → con TDS=2000  da −100
```

Ambos sub-índices salen fuera de la escala 0–100 que el propio documento define.
La versión correcta (`/2` y `/20`) es la que está en el código del ESP32.
**Se usa la del código; la del README se descarta.**

Además, las tablas de verificación de `Parte1.docx` §6.5 no cuadran con su propia
fórmula: 3 de 5 escenarios dan valores distintos a los publicados (ej. dice
ICA≈9.6 donde la fórmula da 17.2). No usar esa tabla como referencia de pruebas.

### Interpretación

| ICA | Clase | Lectura |
|---|---|---|
| 75 – 100 | Excelente | Parámetros fisicoquímicos buenos. **Sigue requiriendo desinfección** |
| 50 – 74 | Condicionada | Tratamiento necesario antes de cualquier uso doméstico |
| 0 – 49 | No apta | No usar sin tratamiento completo; posiblemente ni así |

**El ICA nunca se muestra solo como veredicto.** Es un dato de apoyo. El veredicto
sale del motor de reglas, que incluye la observación humana.

---

## Las tres observaciones humanas

Cubren el punto ciego de los sensores. Su valor está en que un ser humano
percibe cosas que ningún sensor del equipo puede medir.

### Origen — `corriente` | `estancada`
Agua corriente (río, quebrada, nacimiento) se renueva y oxigena. Agua estancada
(charco, pozo sin uso, tanque, aljibe) es medio de cultivo: favorece coliformes,
algas y larvas de mosquito. **Factor de riesgo microbiológico.**

### Olor — `normal` | `raro`
**Regla de máxima prioridad del sistema.** Un olor extraño es evidencia directa
de algo que el equipo no puede medir:

| Olor percibido | Sugiere |
|---|---|
| Huevo podrido / azufre | Sulfuro de hidrógeno — descomposición anaerobia |
| Cloro fuerte | Sobrecloración |
| Combustible, solvente | Hidrocarburos — contaminación química grave |
| Podrido, cloaca | Contaminación fecal / materia orgánica |
| Dulzón, químico | Pesticidas o vertimiento industrial |

Cualquiera de ellos ⇒ **NO APTA**, sin importar los sensores.

### Visual — `limpia` | `verdosa` | `aceitosa`

- **Verdosa** → algas, posiblemente cianobacterias, que producen toxinas que
  **no se eliminan hirviendo**. Es importante: la respuesta habitual ("hierva el
  agua") es insuficiente aquí.
- **Aceitosa** (película iridiscente) → hidrocarburos o grasas. No se quitan
  hirviendo ni filtrando con tela. **NO APTA.**

---

## Vocabulario obligatorio de la interfaz

El lenguaje es una decisión de seguridad, no de estilo.

| ❌ Prohibido | ✅ Correcto | Por qué |
|---|---|---|
| "APTA" | "Buena calidad — desinfecta antes de beber" | "Apta" se lee como "potable" |
| "POTABLE" | "Apta tras tratamiento" | El equipo no puede certificar potabilidad |
| "Agua segura" | "Parámetros dentro de lo esperado" | Implica ausencia de patógenos |
| "Puede consumirse directamente" | — (nunca) | Afirmación de salud no sustentable |
| "NO APTA" | "No la uses — aquí está por qué" | Debe venir con la causa y la alternativa |

Regla general: **describir el hallazgo y la acción, nunca emitir un certificado.**

---

## Glosario

| Término | Definición |
|---|---|
| **ICA** | Índice de Calidad del Agua. Número 0–100 que resume varios parámetros |
| **NTU** | Unidad nefelométrica de turbidez. Potable: < 5 |
| **TDS** | Sólidos totales disueltos, en ppm |
| **ppm** | Partes por millón = mg/L |
| **Coliformes** | Bacterias indicadoras de contaminación fecal. **El equipo no las mide** |
| **Cianobacterias** | "Algas verdiazules". Producen toxinas termoestables |
| **Cloro residual libre** | Cloro que queda disponible tras la desinfección. Objetivo: 0.5–1 mg/L a los 30 min |
| **SODIS** | Desinfección solar: botella PET transparente al sol 6 h |
| **Res. 2115/2007** | Norma colombiana de calidad de agua para consumo humano |

---

## Referencias

- OMS (2022). *Guidelines for Drinking-water Quality*, 4.ª ed.
- MinSalud Colombia. Resolución 2115 de 2007.
- Brown, R.M. et al. (1970). "A Water Quality Index — Do We Dare?"
- IDEAM. *Índices de calidad del agua en corrientes superficiales de Colombia*.
- CDC. *Household Water Treatment Options in Emergencies*.
