# CLAUDE.md — Re-Fluye

Contexto permanente para agentes que trabajen en este repositorio.

## Qué es esto

Re-Fluye: dispositivo IoT de bajo costo + aplicación móvil que ayuda a familias
rurales de Colombia a evaluar la calidad del agua y tratarla de forma segura.
Proyecto del Centro de Competencias Digitales de la UNAB.

La documentación completa está en `refluye/`. **Empieza siempre por
`refluye/README.md`.**

## Las tres cosas que no puedes ignorar

1. **El equipo no detecta patógenos.** pH, turbidez, TDS y temperatura no dicen
   nada sobre bacterias, virus ni parásitos — que son la causa principal de
   enfermedad gastrointestinal en el campo. Por eso ninguna pantalla puede decir
   "potable" y toda recomendación de consumo humano incluye desinfección.

2. **La IA explica; el motor decide.** El veredicto de seguridad lo produce un
   motor determinista y auditable. La capa de IA lo hace comprensible. Nunca
   puede contradecirlo, ablandarlo ni reinterpretarlo.

3. **La app funciona completa sin internet.** La ruta crítica —conectar, medir,
   observar, veredicto, protocolo— no toca la red en ningún punto.

## Restricciones de seguridad (S1–S8)

Innegociables. Un cambio que viole cualquiera se rechaza.

| # | Regla |
|---|---|
| S1 | Ninguna pantalla dice "potable", "apta" o "segura" a secas |
| S2 | Toda recomendación de consumo humano incluye desinfección, aun con ICA 100 |
| S3 | El veredicto lo calcula el motor determinista, nunca la IA |
| S4 | El veto por olor extraño no puede anularse por ninguna vía |
| S5 | Agua verdosa nunca se resuelve solo con "hervir" (toxinas termoestables) |
| S6 | Toda pantalla de resultado muestra el descargo sobre microbiología |
| S7 | Calibración vencida o ausente ⇒ resultado marcado como no confiable |
| S8 | La geolocalización requiere consentimiento explícito y revocable |

## Stack

React Native + Expo (development build, **no Expo Go** — el módulo de Bluetooth
Classic es nativo) · TypeScript estricto · SQLite local · Supabase
(Postgres + PostGIS, Auth, Storage, Edge Functions) · Claude (`claude-opus-5`)
vía Edge Function como proxy.

## Reglas de trabajo

- **La capa `src/dominio/` es TypeScript puro.** Sin React, sin E/S, sin red.
  Funciones deterministas. Es lo que permite probar el motor de seguridad.
- **El motor de reglas exige 100 % de cobertura de ramas.** Toda regla nueva o
  modificada entra con su caso en `dominio/__tests__/casos-golden.json`.
- **Un cambio en el protocolo Bluetooth es un cambio en
  `refluye/contexto/03-protocolo-bluetooth.md`**, que es normativo. Firmware y
  app se ajustan al documento, no al revés.
- **Nunca pongas la clave de la API de Claude en el cliente.** Todo pasa por la
  Edge Function.
- **Documenta lo que cambies.** Este proyecto ya falló una vez por
  desincronización entre documentación y código: las versiones sanas del firmware
  quedaron atrapadas dentro de archivos de Word mientras el repositorio publicaba
  copias rotas.

## Idioma

La documentación, los comentarios del código y todos los textos de interfaz están
en **español**. Los identificadores del código, en español también, para que
coincidan con el dominio (`veredicto`, `turbidez`, `esEstancada`).

## Estado actual

Aplicación inicial implementada en `mobile/`: Bluetooth Classic, modo DEMO,
motor determinista, SQLite, observaciones, resultados y guías. 43 pruebas pasan;
el motor tiene 100 % de cobertura. APK 0.1.0 compilada con firma de desarrollo;
aceptación en Android físico pendiente. Backend e IA aún no implementados.
Leer `README.md`, `mobile/README.md` y `refluye/contexto/05-estado-actual-y-deuda.md`.

## Ciclo de mejora

`refluye/prompts/loop-mejora.md` contiene el prompt para iterar mejoras.
Registra cada iteración en `refluye/prompts/bitacora.md`.
