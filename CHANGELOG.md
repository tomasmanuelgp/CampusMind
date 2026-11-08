# Registro de cambios

Todas las versiones de la app RE-FLUYE. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones con
[SemVer](https://semver.org/lang/es/).

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
