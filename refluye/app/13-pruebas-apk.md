# 13 · Guion de aceptación de la APK

Fecha de preparación: 2026-09-15; actualizada para 0.3.1 el 2026-10-02.
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
| Actualizar 0.3.0 a 0.3.1 | Instala encima y conserva historial/calibración local | Pendiente |
| Firmware con ESTADO textual | pH, TDS, turbidez y temperatura se ven en cada trama; estado auxiliar no bloquea | Pendiente |
| Valores que varían constantemente | Curvas y números cambian en vivo; el análisis no espera estabilidad | Pendiente |
| Un sensor inválido o ausente | Los otros sensores siguen visibles; análisis indica lo que falta | Pendiente |
| Sin tramas durante cinco segundos | Vista en vivo vacía y aviso; no confunde datos viejos con actuales | Pendiente |
| Diagnóstico Bluetooth | Trama recibida, hora y avisos visibles; datos corresponden al equipo físico | Pendiente |
| Abrir sin internet | Inicio, DEMO, guía e historial disponibles | Pendiente |
| Actualizar 0.1.0/0.2.0 a 0.3.0 | Instala encima y conserva historial/calibración local | Pendiente |
| Flujo de medición 0.3.0 | Fuente, uso y tres observaciones en una pantalla; captura desde la primera trama completa | Pendiente |
| Lectura inicial variable | Muestra resultado provisional y posible ruta solo si hay calibración vigente; nunca autoriza consumo | Pendiente |
| ICA y cuatro valores | ICA de 0 a 100, pH, turbidez, TDS y temperatura legibles; aclara que el índice no certifica potabilidad | Pendiente |
| Cocinar | Muestra en resultado la indicación y los pasos de tratamiento, sin entrar a otra guía | Pendiente |
| Resultado por uso | Muestra primero uso elegido, límite y pasos claros; conserva descargo microbiológico | Pendiente |
| Denegar permiso Bluetooth | Mensaje accionable; no bucle de permisos | Pendiente |
| Bluetooth apagado | Solicitud de activación de Android | Pendiente |
| Buscar dos equipos del mismo nombre | Permite elegir por identificación parcial; no cambia automáticamente | Pendiente |
| Conectar por primera vez | Emparejamiento Android; datos reales disponibles desde la primera trama íntegra | Pendiente |
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

## Casos de aceptación 0.3.2 (pendientes en Android físico)
1. Abrir Medir sin responder: conclusión visible No consumir todavía.
2. Con lectura completa y calibración vigente, responder agua corriente, sin olor y clara, elegir Cocinar: posible tratamiento y pasos sin guardar ni nombre.
3. Marcar Huele raro: veto inmediato; retirar pasos de hervido aunque ICA alto.
4. Marcar verde o aceite: buscar otra fuente; corregir respuestas debe reevaluar.
5. Desconectar o dejar de recibir cinco segundos: retirar posibilidad de tratamiento; mantener vetos por observaciones.
6. Cambiar uso a baño/cultivos: orientación específica sin autorización de consumo.
