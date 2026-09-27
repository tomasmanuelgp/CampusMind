# 13 · Guion de aceptación de la APK

Fecha de preparación: 2026-09-15; actualizada para 0.2.0 el 2026-09-26.
Estado: pendiente en teléfono físico.
Registrar modelo, Android, versión APK, firmware, responsable y resultado de cada
caso. No marcar aprobado por haber compilado o por haberlo probado en navegador.

## Preparación

Instalar la APK interna, abrir Re-Fluye y probar primero DEMO. Para lectura real,
encender el dispositivo con Bluetooth Classic SPP. La versión de protocolo 0/1
es compatible; una versión posterior requiere revisar el contrato. Mantener las
sondas según las instrucciones del equipo. No usar resultados DEMO para decidir
el uso de agua real.

## Casos

| Caso | Resultado esperado | Estado |
|---|---|---|
| Abrir sin internet | Inicio, DEMO, guía e historial disponibles | Pendiente |
| Actualizar 0.1.0 a 0.2.0 | Instala encima y conserva historial/calibración local | Pendiente |
| Flujo de medición 0.2.0 | Fuente, uso y tres observaciones en una pantalla; sin recortes ni salida accidental | Pendiente |
| Resultado por uso | Muestra primero uso elegido, límite y pasos claros; conserva descargo microbiológico | Pendiente |
| Denegar permiso Bluetooth | Mensaje accionable; no bucle de permisos | Pendiente |
| Bluetooth apagado | Solicitud de activación de Android | Pendiente |
| Buscar dos equipos del mismo nombre | Permite elegir por identificación parcial; no cambia automáticamente | Pendiente |
| Conectar por primera vez | Emparejamiento Android; datos reales antes de «estable» | Pendiente |
| Volver a abrir | Ofrece conectar al equipo recordado | Pendiente |
| Desconectar la radio durante medición | Valores antiguos desaparecen; no permite capturar; hasta tres reintentos | Pendiente |
| Pulsar Desconectar | Termina la recuperación automática | Pendiente |
| Capturar y apagar el equipo | Permite completar las tres preguntas y guardar | Pendiente |
| Cerrar app durante observaciones | Inicio ofrece recuperar borrador; comprobar si respuestas nuevas se conservan | Pendiente |
| Sin calibración vigente | Resultado no confiable, sin autorización de uso | Pendiente |
| Olor raro con parámetros favorables | Busca otra fuente; no ofrece hervido para levantar veto | Pendiente |
| Verdosa con o sin estancamiento | No recomienda resolverlo hirviendo | Pendiente |
| Lectura favorable verificada | Requiere desinfección y muestra descargo microbiológico | Pendiente |
| Temporizador | No avanza antes de 180 s; permite reiniciar por interrupción | Pendiente |
| Cerrar y recuperar guía | Vuelve al paso persistido | Pendiente |
| TalkBack y texto al 130 % | Orden comprensible; sin recortes; botones accesibles | Pendiente |
| Voz española instalada, modo avión | Audio de resultado y pasos se escucha; si falta voz, informa | Pendiente |
| Compartir | Texto incluye DEMO cuando aplica, restricciones, fiabilidad y descargo | Pendiente |
| Calibración técnica | Guarda responsable, referencia y fechas; rechaza fechas incoherentes | Pendiente |

## Criterio para cerrar el ciclo

Registrar evidencia de estos casos y corregir cualquier bloqueo antes de una
distribución fuera del equipo de pruebas. Validación de recomendaciones con el
responsable sanitario y contraste de sensores con laboratorio siguen siendo
trabajos distintos de la verificación de funcionamiento de la app.
