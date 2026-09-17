import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const pattern = (directories) => directories.flatMap((name) => [
  `**/${name}`, `**/${name}/**`,
])
const enginePackages = ['react', 'react/**', 'react-dom', 'react-dom/**',
  'three', 'three/**', '@react-three/**', '@dimforge/**', 'zustand', 'zustand/**']

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.tools/**', '.zig-cache/**'] },
  js.configs.recommended,
  { files: ['tests/**/*.mjs'], languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ['src/{core,domain,runtime,scenario,communication,fault,verification,forensic,registries}/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: [...enginePackages, ...pattern(['ui', 'graphics'])],
        message: 'Simulation layers must remain independent of presentation and engine packages.',
      }] }],
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: [...enginePackages, ...pattern(['ui', 'graphics', 'runtime', 'physics', 'data', 'scenario',
          'communication', 'fault', 'verification', 'forensic', 'registries'])],
        message: 'Core and domain contain engine-independent contracts and pure logic only.',
      }] }],
    },
  },
  {
    files: ['src/{runtime,scenario,communication,fault,verification,forensic}/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: [...enginePackages, ...pattern(['ui', 'graphics', 'physics', 'data'])],
        message: 'Inject contracts/data; do not import concrete engine adapters or raw datasets.',
      }] }],
    },
  },
  {
    files: ['src/graphics/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: ['@react-three/rapier', '@dimforge/**',
          ...pattern(['ui', 'runtime', 'physics', 'scenario', 'fault', 'verification', 'forensic', 'data'])],
        message: 'Graphics renders supplied presentation state; it must not own simulation rules.',
      }] }],
    },
  },
  {
    files: ['src/input/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: ['@dimforge/**', '@react-three/**', 'three', 'three/**', ...pattern(['physics', 'graphics'])],
        message: 'Input device adapters may update DriverInput only; they must not access physics or graphics.',
      }] }],
    },
  },
  {
    files: ['src/physics/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: [...pattern(['input'])],
        message: 'Physics accepts commands and must not depend on an input device.',
      }] }],
    },
  },
)
