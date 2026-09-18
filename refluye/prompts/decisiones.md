# Decisiones que requirieron criterio humano

| Fecha | Decisión | Elección | Alternativas descartadas |
|---|---|---|---|
| 2026-09-14 | Plataforma de la app | React Native + Expo (development build) | PWA (no puede hablar Bluetooth Classic), Flutter |
| 2026-09-14 | Transporte | Bluetooth Classic SPP | BLE (obligaría a migrar el firmware y resolver truncamiento de MTU) |
| 2026-09-14 | Backend | Supabase | Firebase (geolocalización limitada), solo local |
| 2026-09-14 | Alcance | App + firmware | Solo app; app + firmware + rediseño de PCB |
| 2026-09-14 | Formato de la trama BT | Texto `CLAVE:valor` | JSON (se pierde entero si se trunca) |
| 2026-09-14 | `ESTADO:` | Numérico `0/1/2` | Textual (dependiente del idioma) |

## Pendientes de decisión humana

Confirmaciones del usuario durante la auditoría del 2026-09-14:

- Solicita empezar con DEMO y preparar conexión sencilla, reconocimiento y
  reconexión al equipo real. Después indica que ya se han realizado pruebas.
  No hay un teléfono conectado por USB en la sesión de desarrollo del 2026-09-15;
  no se toma ese comentario como evidencia de prueba de la APK nueva.
- No dispone de otra app, `.aia` o repositorio móvil. El original registra las
  pruebas y fases históricas. Construir la aplicación nueva conservando lógica,
  identidad y firmware reutilizable.
- «Cualquier celular» se toma como objetivo de amplia compatibilidad Android
  para la APK; no como compatibilidad iPhone confirmada ni soporte universal
  demostrado. Modelos y versiones concretos pendientes de verificar.

| Asunto | Por qué requiere decisión |
|---|---|
| Producción de los videos de protocolos | Presupuesto y rodaje |
| Acceso a laboratorio para validación | Convenio institucional y costo |
| Fabricación de la PCB corregida | Costo y tiempos |
| Política de datos abiertos | Implicaciones para las comunidades |
| Modelo de sostenibilidad del costo de IA | Quién paga las llamadas al modelo |
