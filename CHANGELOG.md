# Registro de cambios

Todas las versiones de la app RE-FLUYE. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones con
[SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Nuevo
- **Pasos marcables en las guías:** cada paso se toca al terminarlo y el avance
  queda guardado en el teléfono.
- **Buscador de guías** en **Aprender**, sin importar tildes ni mayúsculas.
- **Recordatorios de cuidado:** desde las guías se registra el lavado del tanque
  (cada 6 meses), la limpieza de canaletas (cada 3 meses) y el agua tratada
  guardada; **Inicio** muestra **Tus cuidados** y avisa si la calibración vence
  en 7 días o menos.
- **Más orígenes del agua** (motor 0.5.0): pozo o aljibe (R18), agua lluvia
  (R19) y acueducto o tubería (R20). La pregunta pasa a ser «¿De dónde viene el
  agua?». Son avisos que piden desinfectar; no cambian el plan.
- **Desinfectar con cloro o al sol** cuando no se puede hervir, con las
  cantidades de CDC y temporizadores de 30 minutos y 6 horas. Solo se ofrecen
  cuando el motor eligió tratar; nunca con agua verde ni con olor extraño.
  **Pendiente de revisión por el área de salud antes de publicarse.**

## [1.0.1] — 2026-11-09

### Nuevo
- **Guías de cuidado sin internet** en **Aprender**: guardar el agua tratada,
  aclarar el agua turbia, cuidar la fuente y el tanque, agua verde o con natas,
  cuidar el equipo, y diarrea (cuidados y cuándo buscar ayuda). Cada guía tiene
  pasos, errores que evitar, lectura en voz alta y fuentes citadas (OMS, CDC,
  ACNUR, CRA, DFRobot).
- **El resultado sugiere hasta tres guías** según el plan del motor y lo
  observado. Nunca sugiere aclarar ni guardar agua tratada cuando el veredicto
  es «Busca otra fuente» o «Necesitamos otra medición» (prueba de invariantes).
- Las guías no incluyen dosis de cloro ni otras cantidades sin revisión técnica;
  una prueba lo comprueba.

### Documentación
- **Manual técnico reescrito para 1.0.0:** hardware (materiales, conexiones,
  ensamblaje, sensores, calibración, mantenimiento y diagnóstico), firmware,
  protocolo, app, motor, guías, datos, pruebas, firma y publicación, aceptación
  en campo, hoja de vida del equipo y glosario.
- Guía de la app y guía visual actualizadas a 1.0.0: APK oficial, exportación
  CSV, nuevas etiquetas de pantalla, LED del firmware V2.3 y QR a la última
  publicación.
- Se quitaron las menciones al nombre anterior del repositorio; todos los
  enlaces apuntan a `tomasmanuelgp/Refluye`.

### Corregido
- El monitor serie del firmware decía «V2.2»; ahora dice «V2.3».

## [1.0.0] — 2026-11-08

Primera versión publicada como proyecto abierto.

### Nuevo
- **Interfaz rediseñada:** panel de inicio, barra de navegación inferior,
  medición en tres pasos con progreso, sensores con estado de color, anillo del
  ICA orientativo, resultado con semáforo a todo color y guía visual.
- **Conexión directa** al equipo recordado desde el inicio.
- **Tus datos:** borrar una medición o todas, exportar CSV y aviso de
  privacidad (Ley 1581 de 2012).
- **Regla R17:** sólidos disueltos por encima de 1000 ppm (rango validado del
  sensor) hacen que el resultado no sea confiable y lleven a buscar otra fuente.
  Motor 0.4.0.

### Cambiado
- Esquema de datos v2 con una columna por dato, unidades y fechas UTC; las
  mediciones existentes se migran solas.
- Las mediciones ya no guardan la dirección del equipo ni el nombre de quien
  calibró.
- La calibración se muestra como *declarada*.
- Textos de opciones unificados («No sé», «Agua quieta»).
- Firmware V2.3: la pantalla y los LED del equipo ya no muestran un veredicto.

### Seguridad
- Firma de publicación por variables de entorno; CI con pruebas, compilación
  del firmware y búsqueda de secretos.
- Dependencias actualizadas (de 23 a 7 avisos de `npm audit`).

## [0.3.2] — 2026-10-02
- Conclusión visible desde el inicio de Medir y orientación que cambia con
  cada respuesta.

## [0.3.1] — 2026-10-02
- Corrección de sensores ocultos por `ESTADO` textual del firmware antiguo;
  curvas en vivo y diagnóstico Bluetooth.

## [0.3.0] — 2026-09-30
- ICA orientativo de 0 a 100 y análisis desde la primera lectura completa.

Versiones anteriores: [bitácora](docs/historial/bitacora.md).
