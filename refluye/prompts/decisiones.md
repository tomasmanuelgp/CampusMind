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

| Asunto | Por qué requiere decisión |
|---|---|
| Producción de los videos de protocolos | Presupuesto y rodaje |
| Acceso a laboratorio para validación | Convenio institucional y costo |
| Fabricación de la PCB corregida | Costo y tiempos |
| Política de datos abiertos | Implicaciones para las comunidades |
| Modelo de sostenibilidad del costo de IA | Quién paga las llamadas al modelo |
