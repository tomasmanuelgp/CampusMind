## Qué cambia

<!-- En pocas líneas: qué hace este cambio y por qué. -->

## Qué ve la persona que mide

<!-- Si cambia algo en pantalla o en el resultado, describe un ejemplo concreto. Si no cambia nada, escribe «Nada». -->

## Reglas de seguridad

- [ ] Ninguna pantalla dice «potable», «apta» o «segura» a secas (S1)
- [ ] Beber y cocinar siguen exigiendo desinfección (S2)
- [ ] El veredicto lo sigue calculando el motor determinista (S3)
- [ ] El veto por olor extraño y la regla del agua verdosa siguen intactos (S4, S5)
- [ ] El descargo microbiológico sigue visible en los resultados (S6)
- [ ] Sin calibración vigente, el resultado sigue siendo no confiable (S7)
- [ ] No se recoge ubicación sin consentimiento explícito (S8)

## Comprobaciones

- [ ] `npm run typecheck`, `npm run lint` y `npm run test:coverage` pasan en `mobile/`
- [ ] Si cambié una regla del motor, agregué su caso en `casos-golden.json`
- [ ] Si cambié el protocolo Bluetooth, actualicé primero `docs/protocolo-bluetooth.md`
- [ ] Actualicé la documentación afectada
- [ ] No incluí datos personales, claves ni archivos generados
