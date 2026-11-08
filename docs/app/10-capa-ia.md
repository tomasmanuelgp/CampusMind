# 10 · Capa de IA — modo conectado

## El principio que gobierna todo este documento

> **La IA explica. El motor decide.**

El veredicto de seguridad lo produce el motor determinista del doc 09, siempre,
con o sin internet. La capa de IA recibe ese veredicto **ya calculado** y lo hace
comprensible, adaptado y conversable.

La IA **no puede**:
- cambiar el nivel del veredicto,
- declarar potable un agua que el motor marcó como no apta,
- omitir un paso de desinfección,
- inventar un protocolo que no esté en el catálogo,
- dar consejo médico.

Esta no es una preferencia de diseño: es una restricción de seguridad. Un modelo
de lenguaje persuadido por un usuario insistente ("pero es que no tengo cloro,
¿de verdad no puedo tomarla?") no puede ser el último control entre una persona y
agua contaminada.

---

## Arquitectura

```
App (React Native)
   │  POST /asistente
   │  { medicionId, veredicto, protocolos, mensaje, historial }
   ▼
Supabase Edge Function  ── el proxy ──────────────────┐
   │  · valida sesión                                 │
   │  · aplica límite de uso por usuario              │
   │  · inyecta el contexto del veredicto             │
   │  · añade el system prompt con las restricciones  │
   │  · guarda la clave de API (nunca sale de aquí)   │
   ▼                                                  │
Claude API  (claude-opus-5)                           │
   │  streaming SSE                                   │
   ▼                                                  │
App ◄── texto en streaming ────────────────────────────┘
```

**La clave de API nunca está en el cliente.** Una app móvil es un binario que
cualquiera puede descompilar; una clave embebida es una clave filtrada. Todo pasa
por la Edge Function.

---

## Configuración del modelo

| Parámetro | Valor | Motivo |
|---|---|---|
| Modelo | `claude-opus-5` | Calidad de razonamiento en un dominio con implicaciones de salud |
| `max_tokens` | `16000` | Suficiente para explicaciones largas |
| `thinking` | `{ type: "adaptive" }` | Razonamiento adaptativo en casos complejos |
| `output_config.effort` | `"medium"` | Las respuestas son explicativas, no de investigación |
| Streaming | **Sí** | La respuesta empieza a verse de inmediato; evita timeouts |
| `fallbacks` | `"default"` con beta `server-side-fallback-2026-07-01` | Continuidad si el modelo declina una petición |
| Caching | `cache_control: ephemeral` en el system prompt | El prompt es largo y estable; abarata mucho |

```typescript
// supabase/functions/asistente/index.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();   // lee ANTHROPIC_API_KEY del entorno de la función

const stream = client.messages.stream({
  model: "claude-opus-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  output_config: { effort: "medium" },
  system: [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  ],
  messages: [
    { role: "user", content: contextoDeLaMedicion },
    ...historial,
    { role: "user", content: mensajeDelUsuario },
  ],
});
```

**Sobre el caching:** el system prompt (restricciones + catálogo de protocolos +
normativa) supera los 4000 tokens y es idéntico en todas las peticiones. Marcarlo
como cacheable reduce el costo de forma sustancial. La regla es poner lo estable
primero y lo variable después del último punto de corte — por eso el contexto de
la medición va en `messages`, no en `system`.

---

## Los tres roles de la IA

### Rol 1 — Explicar el resultado

Toma el veredicto ya calculado y lo traduce al contexto de la persona.

```
Entrada: veredicto nivel 1, R11_TURBIDEZ_ALTA, turbidez 42 NTU,
         origen quebrada, destino consumo humano, 20 litros

Salida esperada:
"Tu agua tiene bastante tierra en suspensión —42 unidades, cuando lo
recomendado para beber es menos de 5. Eso pasa mucho después de las
lluvias.

El problema no es la tierra en sí: es que los microbios se esconden
entre esas partículas y el cloro no los alcanza. Por eso hay que
limpiarla antes de desinfectarla.

Para tus 20 litros: déjala reposar 2 horas, pásala por un trapo
limpio, y ahí sí hiérvela 1 minuto."
```

### Rol 2 — Responder preguntas

El usuario pregunta; la IA responde **dentro de los límites del veredicto**.

| Pregunta | Respuesta correcta |
|---|---|
| "¿Puedo usarla para cocinar?" | Sí, con el mismo tratamiento que para beber — al cocinar el agua se consume igual |
| "No tengo blanqueador, ¿qué hago?" | Ofrecer `P04_HERVIDO` o `P06_SODIS` como alternativas del catálogo |
| "¿Y si solo la cuelo?" | No alcanza, y explicar por qué: colar quita tierra, no microbios |
| "Pero me la he tomado siempre y no me ha pasado nada" | Reconocer la experiencia sin ceder: el riesgo es acumulativo y afecta más a niños |
| "Me duele el estómago desde ayer" | **Derivar a un centro de salud.** Sin diagnóstico |

### Rol 3 — Acompañar la ejecución

Guía paso a paso cuando la persona está ejecutando el protocolo, responde dudas
puntuales ("¿qué tan grandes deben ser las burbujas?") y confirma el avance.

---

## System prompt

```
Eres el asistente de Re-Fluye, una aplicación que ayuda a familias rurales de
Colombia a entender la calidad del agua que usan y a tratarla de forma segura.

## Tu papel

Un motor de reglas YA evaluó el agua y produjo un veredicto. Tu trabajo es
explicar ese veredicto y acompañar a la persona a ejecutarlo. No es evaluar
el agua tú.

## Restricciones absolutas

1. NUNCA contradices, ablandas ni reinterpretas el veredicto que recibes. Si
   dice "no apta", el agua no es apta, sin importar lo que argumente la persona.
2. NUNCA dices que un agua es "potable" o "segura". El equipo mide pH, turbidez,
   sólidos disueltos y temperatura. NO detecta bacterias, virus ni parásitos.
3. NUNCA omites la desinfección cuando el destino es consumo humano, aunque
   todos los parámetros estén perfectos.
4. NUNCA inventas tratamientos. Solo usas los protocolos del catálogo que
   recibes en el contexto.
5. NUNCA das consejo médico. Si alguien menciona síntomas —diarrea, vómito,
   fiebre, dolor abdominal— tu única respuesta es recomendar que acuda a un
   centro de salud o llame a la línea de salud local.
6. Si el agua está verdosa y estancada, NUNCA recomiendas hervir como solución:
   las toxinas de las cianobacterias resisten el calor.
7. Si detectas contaminación por hidrocarburos, NUNCA sugieres ningún
   tratamiento doméstico. Solo buscar otra fuente y reportar.

## Cómo hablas

- Español colombiano, cercano y respetuoso. Tuteas.
- Frases cortas. Una idea por frase.
- Cantidades en medidas caseras: gotas, cucharadas, litros, baldes. Nunca mg/L.
- Explicas el "por qué" cuando ayuda a que la persona haga bien las cosas, no
  para demostrar conocimiento.
- Reconoces lo que la persona sabe. Su experiencia con esa fuente es información
  válida, aunque no cambie el veredicto.
- Nunca eres condescendiente ni alarmista. Ni "esto es muy peligroso, corra", ni
  "tranquilo, no pasa nada".
- Máximo 150 palabras por respuesta, salvo que pidan un paso a paso completo.

## Si te piden algo fuera de tu alcance

Lo dices con naturalidad y ofreces lo que sí puedes hacer. No te disculpas de
más ni das rodeos.
```

---

## Contexto que recibe en cada petición

```json
{
  "medicion": {
    "fecha": "2026-09-14T10:30:00Z",
    "fuente": { "nombre": "Quebrada El Alto", "tipo": "quebrada" },
    "lectura": { "ph": 6.8, "turbidez": 42, "tds": 310, "temperatura": 19.5 },
    "observacion": { "origen": "corriente", "olor": "normal", "visual": "turbia" },
    "ica": 61.4
  },
  "veredicto": {
    "nivel": 1,
    "reglaId": "R11_TURBIDEZ_ALTA",
    "motivoPrincipal": "Turbidez alta (42 NTU)",
    "aptitud": {
      "consumo_humano": "condicionada",
      "consumo_animal": "apta_tras_tratamiento",
      "riego": "apta_tras_tratamiento"
    }
  },
  "protocolos": [ /* objetos completos del catálogo */ ],
  "volumenLitros": 20,
  "historialFuente": [
    { "fecha": "2026-08-01", "ica": 78.2, "nivel": 0 },
    { "fecha": "2026-07-15", "ica": 81.0, "nivel": 0 }
  ]
}
```

El `historialFuente` permite observaciones valiosas: *"Esta fuente estaba mejor
hace un mes. La turbidez subió bastante — puede ser por las lluvias o porque algo
cambió aguas arriba."*

---

## Herramientas (fase 2)

Para el MVP basta con una conversación. Cuando se añadan herramientas, estas son
las candidatas, usando el tool runner del SDK:

```typescript
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";

const consultarHistorial = betaZodTool({
  name: "consultar_historial_fuente",
  description: "Consulta las mediciones anteriores de una fuente de agua",
  inputSchema: z.object({
    fuenteId: z.string(),
    desde: z.string().optional(),
  }),
  run: async ({ fuenteId, desde }) => { /* consulta Supabase */ },
});
```

| Herramienta | Para qué |
|---|---|
| `consultar_historial_fuente` | Comparar con mediciones previas |
| `consultar_protocolo` | Traer el detalle completo de un protocolo |
| `calcular_dosis` | Recalcular cantidades para otro volumen |
| `buscar_fuentes_cercanas` | Sugerir alternativas si la fuente no sirve |
| `registrar_reporte` | Iniciar un reporte a la autoridad ambiental |

**Importante:** `calcular_dosis` delega en la función pura del dominio. La IA
nunca calcula dosis por su cuenta — pide el cálculo y reporta el resultado.

---

## Barreras de seguridad en el código

El system prompt no es suficiente. Se valida también en el proxy.

```typescript
const FRASES_PROHIBIDAS = [
  /\bes potable\b/i,
  /\bagua segura\b/i,
  /\bpuedes? tomarla? (directamente|sin tratar)\b/i,
  /\bno necesitas? (hervir|desinfectar|clorar)\b/i,
];

function validarRespuesta(texto: string, veredicto: Veredicto) {
  for (const patron of FRASES_PROHIBIDAS) {
    if (patron.test(texto)) {
      registrarIncidente({ patron: patron.source, veredicto, texto });
      return RESPUESTA_DE_RESPALDO;   // el protocolo del motor, tal cual
    }
  }
  return texto;
}
```

**Si la validación falla, se muestra el protocolo determinista sin adornos.** El
usuario nunca queda sin respuesta, y nunca recibe una respuesta insegura.

---

## Degradación ante fallos

| Situación | Comportamiento |
|---|---|
| Sin internet | La sección de asistente no aparece. El resto funciona igual |
| API caída / timeout | "No pudimos conectar con el asistente. Aquí está tu plan:" + protocolo |
| Cuota del usuario agotada | Mensaje claro + protocolo completo |
| Respuesta bloqueada por validación | Protocolo determinista, incidente registrado |
| Respuesta lenta | Streaming: el usuario ve texto desde el primer token |

**Regla:** el modo conectado nunca deja a la persona peor que el modo offline.

---

## Costos y límites

Estimación con el system prompt cacheado:

| Concepto | Valor |
|---|---|
| System prompt | ~4.500 tokens (cacheado) |
| Contexto de medición | ~800 tokens |
| Respuesta media | ~250 tokens |
| Costo aproximado por conversación (5 turnos) | unos pocos centavos de USD |

**Controles:**
- Límite por usuario y día (configurable; arranque sugerido: 20 conversaciones)
- Historial acotado a los últimos 10 mensajes
- El límite se aplica en la Edge Function, nunca en el cliente

---

## Privacidad

| Dato | ¿Va a la IA? |
|---|---|
| Lectura de sensores | Sí |
| Observación humana | Sí |
| Veredicto y protocolos | Sí |
| Nombre de la fuente | Sí (lo escribe el usuario) |
| **Coordenadas GPS** | **No.** No aportan a la explicación |
| **Identidad del usuario** | **No.** El proxy envía un identificador anónimo |
| Fotos | No en el MVP |

Las conversaciones se guardan localmente. Su sincronización al backend es
**opcional y desactivada por defecto**.
