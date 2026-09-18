# Pendientes detectados

## Estado de implementación · 2026-09-15

- APK interna disponible en mobile/artifacts; compilación, firma y permisos
  verificados en D-004. Ejecutar doc 13 en Android físico antes de cerrar aceptación.

- A02–A03: resueltos en motor 0.1.0 y golden; doc 09 actualizado. Falta validación de campo.
- A01: cloración excluida de la app; dosis antiguas archivadas como no vigentes.
- A04–A05: tres planes conservadores implementados; no autorizan animales/riego.
- A06: registro técnico local con fechas, responsable y referencia; no verifica sensores físicamente.
- D01–D02: borrador transaccional, TDS cero, snapshots y reinicio probados; 43 pruebas totales.
- B: flujo DEMO web revisado a 320/390 px. Android físico, TalkBack y escalado pendientes.
- C y E: etapas posteriores aún no implementadas; no son dependencias del flujo offline.
- Radio: reconexión limitada implementada y probada con servicio simulado; falta equipo físico.
- Emparejamiento: el timeout de conexión depende actualmente de Android; validar equipo ausente
  y rechazo de PIN antes de decidir si necesita cancelación nativa adicional.
- Historial inicial limitado a las 100 capturas más recientes en la lista; datos anteriores
  permanecen en SQLite. Paginación y virtualización pendientes antes de uso prolongado.
- Firma de distribución, licencia global y validación sanitaria pendientes antes de publicación.

La tabla inferior conserva los hallazgos de la auditoría original; no todos siguen
bloqueando la aplicación nueva. Véanse las iteraciones en la bitácora.

Hallazgos anotados durante iteraciones enfocadas en otra área.

| Fecha | Área | Hallazgo | Gravedad |
|---|---|---|---|
| 2026-09-14 | Firmware | `refluye21.ino` no compila (3 errores). El arreglo está en `Parte2.docx` §6.1 | Bloqueante |
| 2026-09-14 | PCB | SCL del LCD conectado al pin `Tx` en vez de GPIO22 | Bloqueante |
| 2026-09-14 | PCB | Falta pull-up de 4.7 kΩ del DS18B20 → temperatura −127 | Bloqueante |
| 2026-09-14 | PCB | Las 10 resistencias sin valor asignado en el esquemático | Alta |
| 2026-09-14 | Repo original | Imagen con teléfono y cuenta Nequi de un proveedor en repositorio público | Alta (privacidad) |
| 2026-09-14 | Documentación | Fórmula del ICA del README y Parte 1 sale de la escala 0–100 | Media |
| 2026-09-14 | Documentación | Tabla de verificación `Parte1.docx` §6.5: 3 de 5 escenarios mal calculados | Media |
| 2026-09-14 | A | A01: corregir unidades gotas/mL/cucharaditas, concentración y criterios de dosificación del doc 09 con revisión sanitaria y golden | Bloqueante para tratamiento real |
| 2026-09-14 | A | A02–A03: pH 15 dispara R04 antes de R05; R05 oculta R06; R07 puede ocultar riesgos extremos; visual turbia carece de regla específica | Bloqueante para motor |
| 2026-09-14 | A | A04–A05: cerrar matriz por destino y cadenas, contraindicaciones y re-medición; no inferir aptitud del nivel | Bloqueante para recomendaciones |
| 2026-09-14 | A/F | A06: política verificable de calibración, ausente en trama actual; no usar fiabilidad verdadera por defecto | Alta |
| 2026-09-14 | D | D01–D02: persistir borrador antes de resultado, resolver estabilidad con TDS cero, datos inválidos y reinicio de sesión | Alta |
| 2026-09-14 | F | F01: validar V2.2 con core y hardware reales, PIN, sensores exactos, saturación y compensación TDS | Alta |
| 2026-09-14 | C | C01: validar antes de mostrar/leer streaming; verificar propietario/contexto en proxy y configuración del modelo | Alta |
| 2026-09-14 | E | E01–E03: completar RLS y propiedad de fuente, contratos local/remoto y revocación persistente de ubicación | Alta |
| 2026-09-14 | Documentación | Ejemplo ICA 87.3 contradice fórmula: pH 7.41/TURB 12/TDS 145 producen 95.905 | Media |
| 2026-09-14 | B | Ejecutar casos B-001 en UI Android real; contraste aritmético validado, renderizado y TalkBack pendientes | Alta |

Evidencia y propuesta detallada: `../../../analisis/01-auditoria-y-plan-android.md`
en el workspace de revisión. El firmware corregido V2.2 ya existe localmente y en
CampusMind; el pendiente de compilación del original no implica volver a portarlo.
