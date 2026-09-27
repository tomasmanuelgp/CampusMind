# Bitácora de iteraciones

Una línea por iteración del ciclo de mejora.

| Fecha | Área | Qué cambió | Por qué | Verificación |
|---|---|---|---|---|
| 2026-09-26 | D — APK (D-005) | APK 0.2.0 con flujo integrado y orientación por uso | Probar en Android la iteración A-003/B-004 | Build, lint vital, firma, hash, paquete, ABI y permisos aprobados; certificado igual a 0.1.0; teléfono pendiente |
| 2026-09-26 | B — UI (B-004) | Medición, fuente, uso y observación en una pantalla; jerarquía de color y pasos por uso | Reducir navegación y aclarar la acción antes del resultado | Recorrido DEMO de baño; TypeScript y 49 pruebas. Detalle: iteraciones/B-004.md |
| 2026-09-26 | A — Usos (A-003) | Destinos conservadores para baño, utensilios y ropa; orientación determinista por uso | Evitar permisos falsos a partir de sensores limitados | 21 golden, 100 % ramas motor, veto por combustible y calibración probados. Detalle: iteraciones/A-003.md |
| 2026-09-26 | B — UI (B-003) | Resultado prioriza consumo humano y descargo; espaciado compacto solo en esa pantalla | Evitar que la condición para beber quede oculta bajo el primer desplazamiento | Recorrido DEMO y revisión visual a 390×844 y 320×740; TypeScript y 43 pruebas aprobados. Detalle: iteraciones/B-003.md |
| 2026-09-18 | D — Distribución | README raíz con clonación, instalación y enlace a APK; exclusión de configuración local | Recuperar el proyecto desde otros computadores | 43 pruebas y TypeScript aprobados; hash de la APK coincide con D-004; publicación de pruebas refluye-v0.1.0 |
| 2026-09-15 | D — APK (D-004) | Compilación Windows por ruta corta; APK universal comprimida de 51.99 MB | Entregar app instalable bajo el objetivo de tamaño | Build y firma v2 aprobados; 4 ABI; hash/permisos verificados; prueba física pendiente |
| 2026-09-15 | D — Sesión (D-003) | Recuperación del mismo equipo hasta tres intentos y cancelación explícita | Evitar perder el flujo al interrumpirse Bluetooth | 43 pruebas; snapshots, eventos viejos, cancelación y límites; TypeScript aprobado |
| 2026-09-15 | A — Contrato (A-002) | Doc 09 alineado con motor 0.1.0; diseño anterior archivado | Evitar reintroducir dosis erróneas o reglas que ocultan vetos | Comparación con código, 18 golden y referencias CDC; sin cambio de reglas |
| 2026-09-15 | B — UI (B-002) | Reinicio del scroll al avanzar, descargo en historial y SVG accesible | Evitar omitir instrucciones y advertencias | Recorrido web DEMO 390/320 px, veto por olor y recuperación del paso; TypeScript aprobado |
| 2026-09-15 | D — Persistencia (D-002) | Conexión SQLite única, recuperación, rollback e inmutabilidad | Evitar perder observaciones o modificar resultados al reintentar | 35 pruebas; motor 100 % ramas; TypeScript aprobado. Detalle: iteraciones/D-002.md |
| 2026-09-14 | — | Creación de la base de documentación (13 documentos) | El proyecto no tenía contexto escrito; las versiones del firmware y la documentación estaban desincronizadas | Auditoría del repo original verificada con compilador, netlist y lectura completa de los .docx |
| 2026-09-14 | B — UI/UX (B-001) | Contrato de resultado no confiable, restricciones por uso, reconocimiento de equipo y pares de color accesibles en doc 08; auditoría y plan local en analisis | Evitar conclusiones favorables por defecto y preservar S1–S8 al portar el flujo original | Comparación de 20 archivos; extracción de 3 Word; contraste y contraejemplos aritméticos reproducibles; pruebas Android pendientes |
