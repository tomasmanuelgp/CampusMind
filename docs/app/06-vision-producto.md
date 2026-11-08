# 06 · Visión de producto

## Qué es la app

La aplicación Re-Fluye es **el intérprete** entre un equipo de medición y una
persona que necesita decidir qué hacer con su agua hoy.

El dispositivo produce cuatro números. Esos números, solos, no sirven de nada a
quien los recibe. La app hace tres cosas con ellos:

1. Los cruza con lo que la persona ve y huele.
2. Produce un veredicto que se entiende sin formación técnica.
3. **Entrega un procedimiento ejecutable** con lo que hay en una casa rural.

El tercer punto es el producto. Los dos primeros son el camino.

---

## Los cinco principios

### 1. Nunca dejar a alguien sin respuesta
La app funciona **completa sin internet**. El motor de reglas, los protocolos de
tratamiento, el historial y los videos viven en el teléfono. El modo conectado
añade acompañamiento, no funcionalidad esencial.

### 2. La acción antes que el dato
Un pH de 5.8 no le dice nada a nadie. "Tu agua está ácida: eso hace que el cloro
no funcione bien. Antes de desinfectar, hay que corregirlo así…" sí. Los números
existen y son accesibles, pero **la pantalla principal muestra qué hacer**.

### 3. Honestidad sobre los límites
El equipo no detecta bacterias. La app lo dice, de frente, cada vez que importa.
Prometer más de lo que el equipo puede saber es el peor error posible: si alguien
se enferma con agua que la app declaró "apta", el proyecto muere y hace daño.

### 4. La seguridad no se negocia
El veredicto lo decide un motor determinista y auditable. **La IA nunca puede
ablandar, contradecir ni reinterpretar un veredicto de seguridad.** Puede
explicarlo mejor, adaptarlo al contexto y responder dudas. No puede cambiarlo.

### 5. Diseñada para el peor escenario de uso
Sol directo, manos mojadas, guantes, sin señal, batería al 15 %, con prisa,
posiblemente con alfabetización baja. Si funciona ahí, funciona en todas partes.

---

## Los dos modos

Ambos conviven en la misma aplicación. El usuario no elige entre dos apps: la app
detecta qué tiene disponible y se adapta.

### Modo Campo (offline) — el oficial

| | |
|---|---|
| **Conectividad** | Ninguna. Solo Bluetooth hacia el equipo |
| **Motor** | Reglas deterministas embebidas |
| **Recomendaciones** | Protocolos precargados, paso a paso, con ilustraciones |
| **Videos** | Descargados previamente en el teléfono |
| **Historial** | Local (SQLite), en cola para sincronizar después |
| **Garantía** | **Siempre disponible.** Es el modo por defecto |

Este es el modo que define el producto. Todo lo demás es adicional.

### Modo Acompañado (conectado) — el diferencial

| | |
|---|---|
| **Conectividad** | Internet (datos móviles o WiFi) |
| **Motor** | El mismo motor determinista **+** capa de IA encima |
| **Recomendaciones** | Explicación adaptada al caso, al contexto y a los recursos reales de la persona |
| **Conversación** | El usuario puede preguntar y recibir respuesta |
| **Seguimiento** | Plan de acción, recordatorios, comparación con mediciones anteriores |
| **Datos** | Sincronización con el backend, mapa territorial |

**La relación entre los dos modos es aditiva, nunca sustitutiva.** El modo
conectado toma el veredicto que ya produjo el motor offline y lo explica mejor.
Nunca lo recalcula.

```
        ┌──────────────────────────────────┐
        │  Motor determinista (siempre)    │
        │  → veredicto + protocolo base    │
        └────────────┬─────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
   ¿hay internet?            ¿no hay?
         │                        │
         ▼                        ▼
  Capa IA: explica,         Se muestra el
  adapta, conversa,         protocolo base
  acompaña                  tal cual
         │                        │
         └───────────┬────────────┘
                     ▼
         El veredicto es EL MISMO
```

---

## Las seis capacidades

| # | Capacidad | Modo | Estado |
|---|---|---|---|
| C1 | Conexión Bluetooth y lectura en vivo | Ambos | Replicar del original |
| C2 | Captura de las tres observaciones humanas | Ambos | **Rediseñar** (doc 08) |
| C3 | Veredicto + protocolo de tratamiento | Ambos | **Ampliar mucho** (doc 09) |
| C4 | Historial local y tendencia por fuente | Ambos | Nuevo |
| C5 | Acompañamiento conversacional con IA | Conectado | Nuevo (doc 10) |
| C6 | Sincronización, geolocalización y mapa | Conectado | Nuevo (doc 11) |

### C1 — Bluetooth
Emparejar, conectar, recibir, reconectar. Debe replicarse **exactamente** porque
es lo único que ya funciona en el sistema original. Ver el contrato en el doc 03.

### C2 — Observación humana
Es donde más se gana con poco. El original ofrecía botones de texto plano. El
rediseño usa preguntas concretas con apoyo visual, opción de "no sé" y captura de
foto opcional. Ver doc 08.

### C3 — Recomendaciones
**El corazón del producto.** El original daba un párrafo. El nuevo entrega un
procedimiento numerado, con materiales, tiempos, cantidades calculadas para el
volumen real de agua, y advertencias específicas. Ver doc 09.

### C4 — Historial y tendencia
Nuevo. Una medición aislada dice poco; la misma fuente medida cinco veces dice
mucho. Fuentes con nombre, línea de tiempo, alerta ante degradación.

### C5 — Acompañamiento con IA
Nuevo. Un agente que explica el resultado en lenguaje natural, responde preguntas
y guía la ejecución del protocolo. Ver doc 10.

### C6 — Datos y territorio
Nuevo. Geolocalización con consentimiento, sincronización diferida, mapa
agregado, base para machine learning. Ver doc 11.

---

## Qué NO hace la app

Declararlo explícitamente evita que crezca mal.

- **No certifica potabilidad.** No reemplaza un análisis de laboratorio.
- **No detecta bacterias, virus ni parásitos.**
- **No diagnostica enfermedades** ni da consejo médico. Si alguien reporta
  síntomas, la única respuesta correcta es derivar a un centro de salud.
- **No sustituye a la autoridad ambiental.** Puede ayudar a reportar; no reemplaza
  el trámite.
- **No vende ni recomienda marcas** de filtros o productos.
- **No funciona sin el dispositivo**, salvo en el modo demo explícitamente
  marcado como tal.

---

## Reglas de seguridad de producto

Innegociables. Cualquier cambio que las viole se rechaza en revisión.

| # | Regla |
|---|---|
| **S1** | Ninguna pantalla dice "potable", "apta" o "segura" a secas |
| **S2** | Toda recomendación de consumo humano incluye desinfección, aun con ICA 100 |
| **S3** | El veredicto lo calcula el motor determinista, nunca la IA |
| **S4** | El veto por olor extraño no puede anularse por ninguna vía |
| **S5** | Agua verdosa nunca se resuelve solo con "hervir" (toxinas termoestables) |
| **S6** | Toda pantalla de resultado muestra el descargo sobre microbiología |
| **S7** | Si la calibración está vencida o ausente, el resultado se marca como no confiable |
| **S8** | La geolocalización requiere consentimiento explícito y revocable |

---

## Criterios de éxito medibles

| Indicador | Meta |
|---|---|
| Medición completa (conectar → veredicto) | < 90 segundos |
| Comprensión del protocolo sin ayuda externa | > 80 % de usuarios de prueba |
| Funcionamiento sin internet | 100 % de las capacidades esenciales |
| Usuarios que ejecutan el tratamiento recomendado | > 60 % |
| Tiempo hasta el primer veredicto en un teléfono gama baja | < 3 s tras capturar |
| Tamaño del APK con videos base | < 80 MB |
