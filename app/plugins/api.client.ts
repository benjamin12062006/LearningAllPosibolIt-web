import { createApiClient } from '../services/api-client';
import { createImportsService } from '../services/imports';
import { createProjectsService } from '../services/projects';

/** Servicios de datos; usan la sesión Descope que prepara el plugin de acceso. */
export default defineNuxtPlugin({
  name: 'api',
  dependsOn: ['access'],
  setup() {
    const { $session } = useNuxtApp();
    const api = createApiClient(useRuntimeConfig().public.apiBaseUrl, $session);
    return {
      provide: {
        projects: createProjectsService(api),
        imports: createImportsService(api),
      },
    };
  },
});
