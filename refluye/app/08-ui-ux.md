# 08 · UI / UX

## Ajuste implementado · 2026-09-30

La medición ya muestra el ICA orientativo y los cuatro valores sin abrir otro
panel. Una sola trama íntegra y reciente habilita el análisis, aunque aún varíe.
El resultado distingue lectura inicial de lectura repetida, prioriza **qué hacer
ahora** y presenta para beber o cocinar los pasos de aclarado y hervor sin abrir
la guía detallada. El índice no autoriza consumo; olor, aspecto, calibración y
variación pueden cambiar la orientación. [B-006](../prompts/iteraciones/B-006.md).

Los bocetos de medición con botón inactivo hasta estabilidad, más abajo, son
históricos y ya no describen la pantalla 0.3.0.

## Estado implementado · 2026-09-26

`../../mobile/src/app` contiene inicio, conexión, medición con tres preguntas,
resultado, guía, historial, registro técnico de calibración y aprendizaje textual.
La versión inicial conserva identidad, botones grandes y audio con la voz del
teléfono. DEMO está separado de las capturas reales. Las preguntas y los pasos
vuelven al inicio al avanzar; el historial incluye el descargo microbiológico.
Las preguntas se reúnen en la pantalla de medición; el flujo anterior de tres
pantallas queda para recuperar borradores anteriores. La persona nombra la fuente,
elige un uso y marca origen, olor y aspecto antes de analizar: [B-004](../prompts/iteraciones/B-004.md).
Recorrido web DEMO revisado a 390 y 320 px: [B-002](../prompts/iteraciones/B-002.md).
La condición para beber o cocinar y el descargo microbiológico ahora se leen antes
del primer desplazamiento en resultado, incluso a 320 px: [B-003](../prompts/iteraciones/B-003.md).
Faltan pruebas Android de TalkBack, escalado 130 %, voz instalada y uso en campo.
Los bocetos siguientes son la visión completa: no hay todavía videos, fotos,
asistente, fuentes geográficas ni cloración en la aplicación inicial.

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

Se conserva la identidad del proyecto original. Los colores del semáforo se
usan en iconos y acentos; el texto crítico usa `#1C2833` sobre los fondos claros.
No usar verde, ámbar o rojo como color del texto crítico en esos fondos.

Contraste calculado el 2026-09-14: texto oscuro sobre verde claro **13.58:1**,
sobre ámbar claro **13.87:1** y sobre rojo claro **13.21:1**. Texto blanco sobre
azul principal: **8.36:1**. Los colores de estado sobre sus propios fondos dan
4.27:1, 3.86:1 y 4.95:1 respectivamente: no cumplen el objetivo crítico 7:1.
Comprobación reproducible: `../../../analisis/verificar_hallazgos.mjs` en el
workspace de la auditoría. Aún falta verificar el renderizado Android.

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
 ├─ Medir ahora ──► Conectar ──► Medición + fuente + uso + observación
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

En la versión 0.3.0 el botón se activa desde la primera trama íntegra reciente.
La estabilidad mejora la confianza, pero no bloquea la orientación inicial.

### Observación humana — versión integrada

La versión actual presenta las tres preguntas en una misma pantalla, junto a la
lectura recibida, el nombre de la fuente y el uso elegido. Se evita navegar tres
veces para llegar al resultado. Cada grupo tiene título, ayuda y opciones grandes.
El detalle del olor solo aparece si la persona marca «Huele raro». No se pide
probar ni acercar la cara al agua. Las respuestas «No sé» siguen disponibles.
Las pantallas separadas del boceto inferior describen la versión previa, que se
conserva para reanudar borradores ya guardados.

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
│  Revisa el uso y sus       │
│  condiciones antes de      │
│  tratar esta agua.         │
│                            │
│  ┌──────────────────────┐  │
│  │ 🚰 Beber   ⚠️ Tratar │  │
│  │ 🐄 Animales: ver plan│  │
│  │ 🌱 Riego: ver límites│  │
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
│  ℹ️ No detecta bacterias,  │
│    virus ni parásitos.     │
│    No certifica potabilidad│  ← S6, siempre visible
└────────────────────────────┘
```

**Decisiones:**
- Este esquema ilustra la jerarquía, no aprueba tratamientos. Las condiciones
  por uso y la acción principal proceden del motor. «Ver plan» solo aparece si
  hay un plan aprobado; en caso contrario se muestra la restricción concreta.
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

## Contrato de resultado y fiabilidad — iteración B-001

El resultado comunica dos cosas distintas: los peligros que identifica el motor
y la fiabilidad de la medición. Un aviso de calibración no puede quedar debajo
de una conclusión favorable ni sustituir una prohibición por olor o aspecto.
La presentación nunca calcula otro veredicto ni habilita un tratamiento.

| Estado recibido del dominio | Contenido obligatorio | Acción principal |
|---|---|---|
| Veto y lectura confiable | Restricción, motivo, usos bloqueados y descargo | Alternativa indicada por el motor |
| Veto y lectura no confiable | Restricción intacta y aviso de fiabilidad | Alternativa; revisar equipo como acción secundaria |
| Sin veto y calibración ausente/vencida | «Lectura no confiable» y «No podemos confirmar los usos con esta medición» | Revisar equipo / repetir |
| Sin veto y lectura válida | Conclusión del motor con condiciones por uso | Abrir únicamente el plan aprobado |
| No existe salida válida del motor | «No pudimos evaluar esta medición» | Reintentar conservando captura y observaciones |
| DEMO | «DEMO — datos simulados» en todas las pantallas | Practicar sin registrar medición real |

Hasta resolver la matriz del doc 09, no presentar autorizaciones de uso ni
dosis como decisiones definitivas. Este contrato no modifica el orden de reglas;
las inconsistencias del dominio quedan registradas en pendientes.md.

En resultados, historial detallado, audio y exportación se conserva el descargo:
«Este equipo no detecta bacterias, virus ni parásitos. No certifica potabilidad».
Cuando el motor permita una ruta de consumo humano, su plan incluye desinfección.
Cuando la prohíba, no se ofrece «desinfectar» como forma de levantar el veto.

En pantalla pequeña, dar prioridad a restricción/acción, fiabilidad y descargo.
Los detalles numéricos y destinos secundarios pueden desplazarse. El tamaño de
fuente no se reduce para forzar el wireframe: comprobar 320 dp de ancho y 130 %
de texto, sin recortes ni controles solapados. El bloque de advertencias no debe
desaparecer al expandir detalles ni requerir cerrar un modal para leerlo.

### Reconocimiento del equipo

Primera vez: explicar permisos, listar equipos, seleccionar y dejar que Android
gestione el emparejamiento. Guardar el identificador elegido y ofrecer cambiarlo.
En siguientes sesiones, reconectar al equipo recordado. «Equipo listo» requiere
datos compatibles recientes; socket abierto sin tramas significa «Esperando
datos». No pedir al usuario direcciones MAC ni códigos de protocolo.

Si hay varios equipos homónimos, exigir selección; nunca cambiar de equipo sin
avisar. Mostrar instrucciones para Bluetooth apagado, permiso denegado y equipo
ausente. No interpretar el permiso de Bluetooth como consentimiento de GPS.
El PIN documentado debe verificarse con el firmware/core instalado antes de
presentarlo como requisito universal.

### Casos de aceptación de esta especificación

1. Calibración ausente y sensores favorables: se ve incertidumbre, nunca «Sí».
2. Olor raro y calibración ausente: el veto no desaparece detrás del aviso.
3. Resultado sin plan: ningún botón inicia un tratamiento improvisado.
4. Historial y audio conservan tanto el veto como la fiabilidad de la captura.
5. Texto crítico oscuro supera 7:1 en los tres fondos de estado.
6. Tamaño de texto 130 % y pantalla estrecha: se lee la información prioritaria.
7. Equipo recordado ausente: se ofrece reintentar o elegir, sin fabricar datos.

Estado: contrato documental revisado; casos de interfaz pendientes de implementar
y ejecutar en Android. La aritmética de contraste sí fue comprobada.

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
