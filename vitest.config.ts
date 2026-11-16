import { defineVitestProject } from '@nuxt/test-utils/config';
import { defineConfig } from 'vitest/config';

// Dos proyectos (plan del visor, VW12; documentación de Nuxt, «Testing»):
// - `unit`: funciones, predicados y servicios en Node, con `$fetch` simulado.
// - `nuxt`: composables y componentes dentro de la app (router, plugins y
//   auto-importaciones) con `mountSuspended` y `happy-dom`.
export default defineConfig({
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: { domEnvironment: 'happy-dom' },
          },
        },
      }),
    ],
  },
});
