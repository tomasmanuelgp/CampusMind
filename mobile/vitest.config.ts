import { defineConfig } from 'vitest/config';

// Todo el dominio (motor, orientación, conclusión en vivo, protocolos) exige
// 100 % de cobertura: es lo que decide y redacta lo que lee la familia.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/dominio/**/*.ts'],
      exclude: ['src/dominio/**/*.test.ts'],
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
