# 08 · UI / UX

## El contexto de uso manda

Antes de cualquier decisión estética, el escenario real:

> Una persona está de pie junto a una quebrada, a mediodía. El sol pega directo
> sobre la pantalla. Tiene una mano mojada y en la otra sostiene el equipo. No
> hay señal. El teléfono es de gama baja y tiene 20 % de batería. Quiere saber si
> puede darle esa agua a sus hijos.

Todo lo que sigue se deriva de ese párrafo.

| Condición real | Consecuencia de diseño |
|---|---|
| Sol directo | Contraste mínimo 7:1. Nada de gris claro sobre blanco |
| Manos mojadas / con barro | Áreas táctiles ≥ 64 dp. Sin gestos finos ni swipes obligatorios |
| Alfabetización variable | Ícono + texto + color siempre juntos. Nunca solo texto |
| Sin conexión | Cero estados que dependan de la red en la ruta crítica |
| Batería baja | Sin animaciones decorativas ni polling innecesario |
| Prisa / ansiedad | La respuesta a "¿puedo beberla?" en la primera pantalla, sin scroll |
| Gama baja | Renderizado simple, listas virtualizadas |

---

## Sistema de diseño

### Color

El color **nunca es el único portador de significado** (daltonismo + sol). Cada
estado lleva color + ícono + texto + forma.

```
SEMÁFORO
  Verde    #1E8449   Buena calidad — requiere desinfección
  Ámbar    #D35400   Condicionada — requiere tratamiento
  Rojo     #C62828   No apta — no usar

FONDOS DE ESTADO (alto contraste con el texto)
  Verde claro  #E9F7EF
  Ámbar claro  #FEF5E7
  Rojo claro   #FDEDEC

MARCA
  Azul profundo #1A5276   Primario
  Azul medio    #2E86C1   Secundario

NEUTROS
  Texto         #1C2833
  Texto suave   #566573   (mínimo; nunca para información crítica)
  Borde         #D5DBDB
  Fondo         #FFFFFF
```

Se conserva la paleta del proyecto original (estaba bien elegida) y se añaden
fondos de estado con contraste verificado.

### Tipografía

Escala grande. En campo, el texto pequeño no se lee.

| Uso | Tamaño | Peso |
|---|---|---|
| Veredicto | 34 sp | 700 |
| Título de pantalla | 26 sp | 700 |
| Paso de protocolo | 20 sp | 600 |
| Cuerpo | 18 sp | 400 |
| Valor de sensor | 30 sp | 700 |
| Etiqueta | 15 sp | 500 |
| Mínimo absoluto | 15 sp | — |

Debe respetar el tamaño de fuente del sistema hasta 130 % sin romper el diseño.

### Espaciado y toque

- Escala de 4: `4 · 8 · 12 · 16 · 24 · 32 · 48`
- **Área táctil mínima: 64 × 64 dp** (Material recomienda 48; aquí se sube por
  las manos mojadas)
- Separación mínima entre destinos táctiles: 12 dp
- Botón primario: ancho completo, 64 dp de alto

---

## Accesibilidad

No es un extra: es el requisito central para esta población.

| Requisito | Implementación |
|---|---|
| Contraste | ≥ 7:1 en texto crítico (AAA), ≥ 4.5:1 en el resto |
| Lectura en voz alta | **Botón de audio en cada pantalla de resultado y en cada paso del protocolo**, con TTS local (`expo-speech`) |
| Independencia del color | Ícono + texto siempre acompañan al color |
| Lectores de pantalla | Etiquetas `accessibilityLabel` en todo elemento interactivo |
| Escalado de fuente | Soporte hasta 130 % |
| Sin dependencia de gestos | Todo accesible con toques simples |
| Lenguaje | Español claro, frases cortas, sin tecnicismos sin explicar |

**El botón de audio es la característica de accesibilidad más importante.** Una
persona con alfabetización baja puede ejecutar un protocolo si se lo leen, aunque
no pueda leerlo. Debe estar visible, no escondido en un menú.

---

## Mapa de pantallas

```
Inicio
 ├─ Medir ahora ──► Conectar ──► Medición en vivo ──► Observación (3 pasos)
 │                                                          │
 │                                                          ▼
 │                                                     Resultado
 │                                                          │
 │                                        ┌─────────────────┼──────────────┐
 │                                        ▼                 ▼              ▼
 │                                   Protocolo         Asistente IA     Guardar
 │                                   paso a paso       (si hay red)     /compartir
 │
 ├─ Mis fuentes ──► Detalle de fuente ──► Tendencia
 ├─ Historial ────► Detalle de medición
 ├─ Aprender ─────► Videos y guías offline
 └─ Equipo ───────► Estado · Calibración · Diagnóstico
```

---

## Pantallas clave

### Inicio

Una sola acción dominante. Todo lo demás es secundario.

```
┌────────────────────────────┐
│  Re-Fluye                  │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │    💧  MEDIR AGUA    │  │  ← 96 dp de alto
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  ● Equipo listo            │  ← estado, no acción
│                            │
│  Última medición           │
│  ┌──────────────────────┐  │
│  │ 🟠 Quebrada El Alto  │  │
│  │ Hace 2 días          │  │
│  └──────────────────────┘  │
│                            │
│  ⬆ 3 mediciones sin subir │  ← discreto, nunca modal
│                            │
│ [Fuentes][Historial][Aprender]│
└────────────────────────────┘
```

### Medición en vivo

El usuario debe entender **por qué espera**. Un spinner sin explicación genera
capturas prematuras.

```
┌────────────────────────────┐
│ ← Midiendo                 │
│                            │
│  ┌──────────┐ ┌──────────┐ │
│  │ pH       │ │ Turbidez │ │
│  │  7.2     │ │  12 NTU  │ │
│  │ ●●●●○    │ │ ●●●●○    │ │  ← estabilidad visible
│  └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ │
│  │ TDS      │ │ Temp     │ │
│  │ 240 ppm  │ │  22 °C   │ │
│  └──────────┘ └──────────┘ │
│                            │
│  ⏳ Estabilizando…         │
│  Mantén la sonda quieta    │
│  dentro del agua           │
│                            │
│  ┌──────────────────────┐  │
│  │  CAPTURAR  (inactivo)│  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

Al estabilizarse: el texto pasa a "✅ Lectura estable" y el botón se activa con
un cambio de color evidente.

### Observación humana — el rediseño más importante

El original mostraba las tres preguntas juntas, con botones de texto. El rediseño
las separa en **tres pantallas de una pregunta cada una**, con apoyo visual.

**Por qué una por pantalla:** reduce la carga cognitiva, permite ilustraciones
grandes y evita que se respondan al azar por acumulación.

```
PASO 2 de 3
┌────────────────────────────┐
│ ← ¿A qué huele el agua?    │
│   ●●○                      │
│                            │
│  Acerca el recipiente y    │
│  huele con cuidado.        │
│                            │
│  ┌──────────────────────┐  │
│  │  👃  NORMAL          │  │
│  │  Sin olor o a tierra │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │  ⚠️  HUELE RARO      │  │
│  │  Cualquier olor      │  │
│  │  fuerte o extraño    │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │  ❓  NO ESTOY SEGURO │  │
│  └──────────────────────┘  │
│                            │
│  🔊 Escuchar               │
└────────────────────────────┘
```

**Si elige "Huele raro"**, una segunda pantalla precisa el tipo — porque el tipo
de olor cambia la recomendación:

```
┌────────────────────────────┐
│ ← ¿A qué se parece?        │
│                            │
│  🥚 Huevo podrido / azufre │
│  ⛽ Combustible o solvente │
│  🗑️ Podrido, como cloaca   │
│  🧪 Químico o dulzón       │
│  💧 Cloro fuerte           │
│  ❓ Otro olor raro         │
└────────────────────────────┘
```

**Tres mejoras sobre el original:**

1. **Opción "No estoy seguro".** Obligar a elegir entre dos opciones cuando no se
   sabe produce datos falsos. Ante la duda, el motor asume el caso conservador.
2. **Detalle del olor.** Azufre y combustible implican acciones distintas.
3. **Foto opcional** en la pregunta visual, útil para revisión posterior y para
   la capa de IA.

### Resultado — la pantalla más importante

Responde en el primer pantallazo, sin scroll: **¿puedo usarla y para qué?**

```
┌────────────────────────────┐
│                            │
│         ⚠️                 │
│    REQUIERE TRATAMIENTO    │  ← 34 sp
│                            │
│  Tu agua se puede usar,    │
│  pero antes hay que        │
│  tratarla.                 │
│                            │
│  ┌──────────────────────┐  │
│  │ 🚰 Beber   ⚠️ Tratar │  │
│  │ 🐄 Animales ✅ Sí    │  │
│  │ 🌱 Riego    ✅ Sí    │  │
│  └──────────────────────┘  │
│                            │
│  Motivo principal:         │
│  Turbidez alta (42 NTU)    │
│                            │
│  ┌──────────────────────┐  │
│  │  VER QUÉ HACER  →    │  │  ← acción dominante
│  └──────────────────────┘  │
│                            │
│  🔊 Escuchar   💬 Preguntar│
│                            │
│  ▸ Ver los números         │  ← colapsado
│                            │
│  ℹ️ Este equipo no detecta │
│    bacterias. Desinfecta   │
│    siempre antes de beber. │  ← S6, siempre visible
└────────────────────────────┘
```

**Decisiones:**
- **Aptitud por destino, no un veredicto único.** "No apta" es demasiado grueso:
  la misma agua puede servir para riego y no para beber.
- Los números se ocultan tras un desplegable. Existen; no dominan.
- El descargo sobre bacterias es permanente, no un modal que se descarta.
- "Preguntar" solo aparece si hay red.

### Protocolo paso a paso

Una tarjeta por paso, avance explícito, sin scroll infinito.

```
┌────────────────────────────┐
│ ← Tratar el agua   Paso 2/4│
│  ●●○○                      │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   [ilustración]      │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  Filtrar con tela          │  ← 20 sp
│                            │
│  Pasa el agua por un       │
│  trapo limpio doblado      │
│  4 veces.                  │
│                            │
│  Necesitas:                │
│  • Trapo de algodón limpio │
│  • Dos recipientes         │
│                            │
│  ⏱️ 10 minutos             │
│                            │
│  ⚠️ No uses el mismo trapo │
│     sin lavarlo antes      │
│                            │
│  🔊 Escuchar  ▶️ Ver video │
│                            │
│  ┌──────────────────────┐  │
│  │   HECHO — SIGUIENTE  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

**Detalle crítico:** las cantidades se calculan para el volumen real. La app
pregunta cuánta agua va a tratar y dice *"echa 8 gotas de blanqueador"*, no
*"2 mg/L"*. Ver doc 09.

### Asistente (solo con red)

Chat sencillo, con preguntas sugeridas para no dejar al usuario ante un campo
vacío.

```
┌────────────────────────────┐
│ ← Preguntar                │
│                            │
│ 🤖 Tu agua tiene turbidez  │
│    alta. Eso significa que │
│    tiene tierra en         │
│    suspensión…             │
│                            │
│  ┌──────────────────────┐  │
│  │ ¿Puedo usar el agua  │  │
│  │ para cocinar?        │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ No tengo blanqueador,│  │
│  │ ¿qué hago?           │  │
│  └──────────────────────┘  │
│                            │
│ [Escribe tu pregunta  ][🎤]│
└────────────────────────────┘
```

Entrada por voz disponible: escribir en un teclado con las manos mojadas es
hostil.

---

## Micro-decisiones que importan

| Situación | Decisión |
|---|---|
| Equipo se desconecta durante la observación | **No se pierde nada.** La lectura ya está congelada; se sigue normal |
| Usuario no responde una pregunta | No se puede avanzar, pero existe "No estoy seguro" |
| Lectura fuera de rango | Banner: "Lectura poco confiable — revisa el sensor". Se permite continuar, se marca en el registro |
| Calibración vencida | Franja ámbar permanente + sugerencia de calibrar |
| Sin videos descargados | Se muestran las ilustraciones; el video se ofrece para descargar luego |
| Primera vez | Tutorial de 3 pantallas, saltable, reabrible desde "Aprender" |
| Sin equipo | Modo demo, con marca de agua "DEMO" siempre visible |

---

## Errores: cómo se comunican

Nunca un código. Siempre: qué pasó, por qué, qué hacer.

| ❌ | ✅ |
|---|---|
| "Error de conexión BT" | "No encontramos el equipo. Revisa que esté encendido y a menos de 10 metros. [Buscar otra vez]" |
| "Timeout" | "El equipo dejó de enviar datos. Puede ser la distancia o la batería. [Reintentar]" |
| "Sensor error −127" | "El sensor de temperatura no responde. Puedes seguir: la temperatura no cambia el resultado" |
| "Sync failed" | *(no se muestra — se reintenta en silencio)* |

---

## Lo que se conserva del diseño original

La estructura de 5 pantallas de `refluye_app_logica.txt` era razonable y se
respeta en lo esencial:

| Original | Nuevo | Cambio |
|---|---|---|
| Screen1 Bienvenida | Inicio | Una sola acción dominante |
| Screen2 Conexión BT | Conectar | + reconexión automática y equipo recordado |
| Screen3 Sensores | Medición en vivo | + indicador de estabilidad |
| Screen4 Observación | 3 pantallas | Separadas, con "no sé" y detalle de olor |
| Screen5 Resultado | Resultado + Protocolo | Separadas: el protocolo necesita su propio espacio |

Se conserva: el semáforo, la paleta, guardar en historial y compartir por
WhatsApp. Se descarta: el lenguaje de "APTA / potable" (ver doc 04).
