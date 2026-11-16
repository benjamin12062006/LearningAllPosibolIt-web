import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // Prettier owns HTML formatting, including self-closing void elements.
      'vue/html-self-closing': 'off',
    },
  },
  {
    // Se conserva esta copia byte a byte con la versión de Nest.
    files: ['app/features/worksheets/calc-engine/formula.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-nocheck': 'allow-with-description' },
      ],
    },
  },
);
