// ESLint (configuración plana). Base de Expo + desactivar reglas de estilo
// que ya resuelve Prettier.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  { ignores: ['dist/*', 'coverage/*', 'android/*', 'ios/*', '.expo/*'] },
  // En pruebas, vi.mock se declara antes de importar el módulo simulado.
  { files: ['**/*.test.ts'], rules: { 'import/first': 'off' } },
]);
