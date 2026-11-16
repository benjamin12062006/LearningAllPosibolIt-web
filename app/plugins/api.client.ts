import type { SessionService } from '../features/access/types/access';
import type { AppLanguage } from '../composables/useAppLocale';
import { createIntegrationsService } from '../features/integrations/services/integrations';
import { createAssistantService } from '../features/assistant/services/assistant';
import { createApiClient } from '../services/api-client';
import { createChangesetsService } from '../features/worksheets/services/changesets';
import { createEvaluationsService } from '../features/evaluations/services/evaluations';
import { createExportsService } from '../features/exports/services/exports';
import { createFeedViewerService } from '../features/feed-viewer/services/feed-viewer';
import { createFeedsService } from '../features/feeds/services/feeds';
import { createOrganizationsService } from '../features/organizations/services/organizations';
import { createImportsService } from '../features/catalog/services/imports';
import { createProjectsService } from '../features/projects/services/projects';
import { createRulesetsService } from '../features/rulesets/services/rulesets';
import { createWorksheetTransfersService } from '../features/worksheets/services/worksheet-transfers';
import { createWorksheetsService } from '../features/worksheets/services/worksheets';

/** Servicios de datos; usan la sesión Descope que prepara el plugin de acceso. */
export default defineNuxtPlugin({
  name: 'api',
  dependsOn: ['access'],
  setup(nuxtApp): ReturnType<typeof provideApi> {
    const { apiBaseUrl } = useRuntimeConfig().public;
    const { language } = useAppLocale();
    return provideApi(apiBaseUrl, nuxtApp.$session, () => language.value);
  },
});

function provideApi(
  apiBaseUrl: string,
  session: SessionService | undefined,
  language: () => AppLanguage,
) {
  const api = createApiClient(apiBaseUrl, session, language);
  return {
    provide: {
      projects: createProjectsService(api),
      imports: createImportsService(api),
      rulesets: createRulesetsService(api),
      evaluations: createEvaluationsService(api),
      exports: createExportsService(api),
      feeds: createFeedsService(api),
      feedViewer: createFeedViewerService(api),
      organizations: createOrganizationsService(api),
      worksheets: createWorksheetsService(api),
      changesets: createChangesetsService(api),
      integrations: createIntegrationsService(api),
      assistant: createAssistantService(api, apiBaseUrl, session),
      worksheetTransfers: createWorksheetTransfersService(api),
    },
  };
}
