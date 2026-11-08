> HISTÓRICO NO VIGENTE. Contiene reglas y dosis descartadas. No implementar ni usar para tratar agua. La especificación actual está en ../app/09-motor-recomendaciones.md.

# 09 · Motor de recomendaciones

Este es el corazón del producto y el componente con mayor exigencia de
corrección. Es **determinista, auditable, sin E/S y cubierto al 100 %** por
pruebas.

---

## Diseño en dos etapas

El original mezclaba veredicto y recomendación en una cadena de `if`. Aquí se
separan, porque son dos problemas distintos:

```
ETAPA 1 — EVALUACIÓN            ETAPA 2 — PRESCRIPCIÓN
¿Qué tan mala es el agua?       ¿Qué hago con ella?

lectura + observación           veredicto + destino + volumen
        ↓                                ↓
  regla disparada                 lista de protocolos
  veredicto (0|1|2)               con dosis calculadas
  aptitud por destino
```

La etapa 1 responde *qué pasa*; la etapa 2 responde *qué hacer*. Separarlas
permite que un mismo veredicto genere protocolos distintos según el destino
(beber, animales, riego) y el volumen real de agua.

---

## Etapa 1 — Motor de reglas

### Principios

1. **Prioridad descendente.** La primera regla que se cumple decide y detiene la
   evaluación.
2. **Toda regla registra su identificador** en `regla_disparada`. Un veredicto sin
   trazabilidad no es auditable.
3. **Ante la duda, el caso conservador.** `no_se` se trata como la opción
   desfavorable.
4. **Aptitud por destino, no un único veredicto.** La misma agua puede servir para
   riego y no para beber.

### Tipos

```typescript
type Origen  = 'corriente' | 'estancada' | 'no_se';
type Olor    = 'normal' | 'raro' | 'no_se';
type OlorTipo = 'azufre' | 'combustible' | 'podrido' | 'quimico' | 'cloro' | 'otro';
type Visual  = 'limpia' | 'verdosa' | 'aceitosa' | 'turbia' | 'no_se';

type Destino = 'consumo_humano' | 'consumo_animal' | 'riego';
type Aptitud = 'apta_tras_tratamiento' | 'condicionada' | 'no_apta';

interface Entrada {
  ph: number | null;
  turbidez: number | null;
  tds: number | null;
  temperatura: number | null;
  origen: Origen;
  olor: Olor;
  olorTipo?: OlorTipo;
  visual: Visual;
  lecturaConfiable: boolean;
}

interface Veredicto {
  nivel: 0 | 1 | 2;              // 0 buena, 1 condicionada, 2 no apta
  reglaId: string;
  motivoPrincipal: string;
  ica: number;
  aptitud: Record<Destino, Aptitud>;
  protocolos: Record<Destino, ProtocoloId[]>;
  advertencias: string[];
}
```

### Catálogo de reglas

Nueve reglas heredadas del original más seis nuevas. En orden estricto de
prioridad.

| # | ID | Condición | Nivel | Notas |
|---|---|---|---|---|
| 1 | `R01_OLOR_COMBUSTIBLE` | `olorTipo = combustible` | 2 | **Nueva.** Hidrocarburos: ni riego alimentario |
| 2 | `R02_OLOR_RARO` | `olor = raro` | 2 | Veto absoluto (S4) |
| 3 | `R03_VISUAL_ACEITOSA` | `visual = aceitosa` | 2 | Solo riego no alimentario |
| 4 | `R04_PH_CRITICO` | `ph < 5.5 ∨ ph > 9.5` | 2 | Posible origen industrial o minero |
| 5 | `R05_LECTURA_NO_CONFIABLE` | `lecturaConfiable = false` | 1 | **Nueva.** No se afirma nada; se pide repetir |
| 6 | `R06_CIANOBACTERIAS` | `visual = verdosa ∧ origen = estancada` | 2 | **Sube de nivel** vs. original. Toxinas termoestables |
| 7 | `R07_VERDOSA` | `visual = verdosa` | 1 | Algas sin estancamiento |
| 8 | `R08_TURBIDEZ_MUY_ALTA` | `turbidez ≥ 100` | 2 | La desinfección no es confiable |
| 9 | `R09_TDS_MUY_ALTO` | `tds ≥ 1500` | 2 | **Nueva.** Salobre |
| 10 | `R10_PH_FUERA_RANGO` | `ph < 6.0 ∨ ph > 9.0` | 1 | Reduce eficacia del cloro |
| 11 | `R11_TURBIDEZ_ALTA` | `turbidez ≥ 25` | 1 | Requiere filtración previa |
| 12 | `R12_TDS_ALTO` | `tds ≥ 600` | 1 | Sabor; salinidad en riego |
| 13 | `R13_ESTANCADA` | `origen = estancada` | 1 | **Nueva.** Riesgo microbiológico por sí solo |
| 14 | `R14_DUDA` | Algún campo = `no_se` | 1 | **Nueva.** Conservador ante incertidumbre |
| 15 | `R15_BUENA` | Todo en rango, sin observación adversa | 0 | **Aun así exige desinfección (S2)** |

### Cambios respecto al sistema original

**R06 sube de condicionada a no apta.** El original clasificaba "verdosa +
estancada" como CONDICIONADA y recomendaba filtrar + clorar. Las cianotoxinas no
se eliminan hirviendo, no se eliminan con cloración doméstica y no se eliminan
con filtro de tela. Recomendar un tratamiento que no funciona es peor que no
recomendar nada.

**R13 es nueva.** El agua estancada era solo un modificador; ahora es causa
suficiente de condicionada. Es un medio de cultivo y el equipo no ve patógenos.

**R15 nunca produce "apta para beber".** Produce "buena calidad fisicoquímica" +
protocolo de desinfección obligatorio (S2).

**R05 y R14 son nuevas.** Reconocen explícitamente la incertidumbre en vez de
inventar un resultado.

### Aptitud por destino

Tras disparar la regla, se calcula la aptitud para cada uso:

```
consumo_humano:  el más estricto. Nivel 0 → apta_tras_tratamiento
                                   Nivel 1 → condicionada
                                   Nivel 2 → no_apta

consumo_animal:  tolera más turbidez y TDS. Un nivel 1 por TDS
                 suele ser apto para animales

riego:           el más permisivo, EXCEPTO con hidrocarburos
                 (R01/R03), donde se restringe a cultivos no
                 alimentarios, y con salinidad alta (R09), que
                 daña el suelo
```

---

## Etapa 2 — Protocolos de tratamiento

Aquí está el salto de valor más grande frente al sistema original. Donde antes
había un párrafo, ahora hay un procedimiento ejecutable.

### Estructura de un protocolo

```typescript
interface Protocolo {
  id: ProtocoloId;
  titulo: string;                 // "Desinfectar con blanqueador"
  cuandoAplica: string;
  tiempoTotalMin: number;
  dificultad: 'facil' | 'media';
  materiales: Material[];
  pasos: Paso[];
  advertencias: Advertencia[];
  noFuncionaSi: string[];         // honestidad sobre los límites
  videoId?: string;
  ilustraciones: string[];
}

interface Paso {
  orden: number;
  titulo: string;                 // "Filtrar con tela"
  instruccion: string;            // lenguaje simple, 2ª persona
  duracionMin?: number;
  requiereEspera: boolean;        // activa temporizador en la app
  dosis?: DosisCalculada;         // cantidad según volumen real
  ilustracion: string;
  advertencia?: string;
}
```

### Catálogo de protocolos

| ID | Nombre | Elimina | No elimina |
|---|---|---|---|
| `P01_SEDIMENTACION` | Dejar reposar | Sólidos pesados, parte de la turbidez | Patógenos, químicos, sales |
| `P02_FILTRO_TELA` | Filtrar con tela | Turbidez gruesa, insectos | Patógenos, químicos, sales |
| `P03_FILTRO_ARENA` | Filtro de arena y carbón | Turbidez fina, olores, algo de químicos | Patógenos (parcial), sales |
| `P04_HERVIDO` | Hervir | **Todos los patógenos** | Químicos, sales, cianotoxinas, metales |
| `P05_CLORACION` | Blanqueador doméstico | Bacterias y virus | Cryptosporidium, químicos, sales, cianotoxinas |
| `P06_SODIS` | Desinfección solar | Bacterias y virus (si turbidez < 30) | Químicos, sales, cianotoxinas |
| `P07_NEUTRALIZAR_PH` | Corregir acidez | — (prepara para desinfectar) | — |
| `P08_BUSCAR_ALTERNATIVA` | Buscar otra fuente | — | — |
| `P09_REPORTAR` | Reportar a la autoridad | — | — |

**El campo `noElimina` es tan importante como el resto.** Decirle a alguien que
hierva agua contaminada con cianotoxinas o con mercurio es peligroso.

### Cadenas de tratamiento

Los protocolos se combinan. El orden no es negociable: **siempre aclarar antes de
desinfectar**, porque la materia en suspensión protege a los microorganismos.

| Situación | Cadena |
|---|---|
| Buena calidad, para beber | `P05` *(o `P04`)* |
| Turbidez moderada (25–100) | `P01` → `P02` → `P04` |
| Turbidez alta (≥ 100) | `P01` → `P03` → `P04` |
| pH ácido + para beber | `P07` → `P02` → `P05` |
| Estancada, para animales | `P02` → `P05` |
| Cianobacterias (R06) | `P08` — ningún tratamiento doméstico sirve |
| Hidrocarburos (R01/R03) | `P08` + `P09` |

### Dosificación real

El original decía *"cloro 2 mg/L"*. Nadie en una cocina rural mide miligramos por
litro. La app pregunta cuánta agua va a tratar y calcula gotas.

```typescript
// Blanqueador doméstico al 5 % de hipoclorito de sodio
// Objetivo: 2 mg/L de cloro libre
// 1 gota ≈ 0.05 mL → ≈ 2.5 mg de cloro
// → 1 gota por litro para agua clara; se dobla si está turbia

function dosisCloro(litros: number, turbidez: number): DosisCalculada {
  const base = Math.ceil(litros * 1);
  const gotas = turbidez > 5 ? base * 2 : base;
  return {
    gotas,
    descripcion: `${gotas} gotas de blanqueador`,
    equivalencia: gotas >= 20
      ? `unos ${(gotas * 0.05).toFixed(0)} mL (${Math.round(gotas/20)} cucharaditas)`
      : undefined,
    esperaMin: 30,
    verificacion: 'Debe oler levemente a cloro a los 30 minutos. Si no huele, repite la dosis.',
  };
}
```

**Presentación en la app:** *"Para tus 20 litros: echa 20 gotas de blanqueador,
revuelve y espera 30 minutos."* Con temporizador integrado.

### Ejemplo completo — P04_HERVIDO

```yaml
id: P04_HERVIDO
titulo: "Hervir el agua"
cuandoAplica: "Cuando el agua ya está clara y la vas a beber o cocinar"
tiempoTotalMin: 20
dificultad: facil

materiales:
  - Olla con tapa
  - Fuego o estufa
  - Recipiente limpio con tapa para guardar

pasos:
  - orden: 1
    titulo: "Filtra primero si está turbia"
    instruccion: "Si el agua tiene tierra, pásala por un trapo limpio antes de
                  hervirla. Hervir agua sucia no la limpia."
    ilustracion: filtrar_tela.png

  - orden: 2
    titulo: "Pon el agua a hervir"
    instruccion: "Llena la olla y ponla al fuego con la tapa puesta."
    ilustracion: olla_fuego.png

  - orden: 3
    titulo: "Espera 1 minuto de burbujeo fuerte"
    instruccion: "Cuenta 1 minuto completo desde que hierve con burbujas
                  grandes. En zonas de páramo o montaña alta, espera 3 minutos."
    duracionMin: 1
    requiereEspera: true
    advertencia: "Más tiempo no la hace más segura, solo gasta leña."
    ilustracion: agua_hirviendo.png

  - orden: 4
    titulo: "Deja enfriar tapada"
    instruccion: "Déjala enfriar sin destapar. Guárdala en un recipiente limpio
                  y tapado."
    duracionMin: 15
    requiereEspera: true
    advertencia: "Si la pasas a un recipiente sucio, se vuelve a contaminar."
    ilustracion: guardar_tapado.png

noFuncionaSi:
  - "El agua tiene una capa aceitosa — hervir no quita el combustible"
  - "El agua está verdosa por algas — las toxinas no se destruyen con el calor"
  - "El agua es salobre — hervir concentra más la sal"
  - "Sospechas contaminación por minería o industria"

advertencias:
  - tipo: critica
    texto: "Hervir mata microbios pero NO quita químicos, metales ni sal."
```

### Tono de la redacción

| ❌ | ✅ |
|---|---|
| "Aplicar hipoclorito de sodio a 2 mg/L" | "Echa 20 gotas de blanqueador" |
| "Tiempo de contacto: 30 min" | "Espera media hora antes de tomarla" |
| "Sedimentación previa recomendada" | "Deja reposar el agua 2 horas para que la tierra se baje" |
| "Turbidez elevada" | "El agua tiene mucha tierra" |
| "Contaminación por hidrocarburos" | "Hay combustible o aceite en el agua" |

Reglas: segunda persona, verbos en imperativo, una idea por frase, sin
subordinadas, cantidades en unidades caseras.

---

## Modo de operación del motor

```typescript
export function evaluar(entrada: Entrada): Veredicto        // etapa 1
export function prescribir(
  veredicto: Veredicto,
  destino: Destino,
  litros: number,
): PlanTratamiento                                          // etapa 2
```

**Ambas son funciones puras.** Sin fechas, sin aleatoriedad, sin red, sin
almacenamiento. La misma entrada produce siempre la misma salida — requisito para
que las pruebas golden tengan sentido y para que un veredicto sea reproducible
meses después.

---

## Pruebas

### Tabla golden

Fichero versionado `dominio/__tests__/casos-golden.json`: cada caso con entrada,
`reglaId` esperado, nivel esperado y aptitud por destino. Modificar una regla
obliga a actualizar la tabla explícitamente — nunca en silencio.

### Casos obligatorios

| Caso | Entrada | Esperado |
|---|---|---|
| Veto por olor | ICA 100 + `olor=raro` | Nivel 2, `R02` |
| Combustible | `olorTipo=combustible` | Nivel 2, `R01`, sin riego alimentario |
| Cianobacterias | `visual=verdosa` + `origen=estancada` | Nivel 2, `R06`, protocolo `P08` |
| Verdosa sola | `visual=verdosa` + `origen=corriente` | Nivel 1, `R07` |
| Agua perfecta | pH 7.4, turb 0, TDS 0, todo limpio | Nivel 0, `R15`, **con desinfección** |
| pH crítico bajo | pH 5.0 | Nivel 2, `R04` |
| Estancada limpia | Todo en rango, `origen=estancada` | Nivel 1, `R13` |
| Duda | `olor=no_se` | Nivel 1, `R14` |
| Sensor caído | `temperatura=null` | No afecta al veredicto |
| Lectura inválida | pH 15 | Nivel 1, `R05` |

### Invariantes que se verifican por propiedad

1. `evaluar()` nunca devuelve `apta` para consumo humano sin al menos un
   protocolo de desinfección. *(S2)*
2. `olor = 'raro'` ⇒ nivel 2, **siempre**, con cualquier combinación de las demás
   entradas. *(S4)*
3. `visual = 'verdosa'` ⇒ `P04_HERVIDO` nunca es el único protocolo. *(S5)*
4. Toda salida incluye un `reglaId` no vacío.
5. El ICA calculado siempre está en [0, 100].
