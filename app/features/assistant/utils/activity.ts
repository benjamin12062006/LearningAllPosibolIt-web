import type { RouteLocationRaw } from 'vue-router';
import { productSourceQuery } from '../../feed-viewer/utils/product-source';
import { isRecord } from '../../../utils/guards';
import type { RunEvent } from '../types/assistant';

const operationLabels: Record<string, string> = {
  get_project_overview: 'Consultar el proyecto',
  get_catalog_snapshot: 'Leer el catálogo',
  list_worksheets: 'Listar hojas del libro',
  get_sheet_schema: 'Leer las columnas de la hoja',
  query_rows: 'Consultar filas de la hoja',
  select_rows: 'Seleccionar filas de la hoja',
  preview_transform: 'Previsualizar cambios en la hoja',
  get_evaluation_report: 'Consultar el informe de evaluación',
  get_ruleset: 'Consultar las reglas',
  preview_rules: 'Probar reglas con el catálogo',
  get_feed_status: 'Consultar el estado del feed',
  list_feed_products: 'Listar productos',
  create_ruleset: 'Preparar una revisión de reglas',
  request_evaluation: 'Preparar una evaluación',
  create_change_proposal: 'Preparar un borrador de hoja',
  propose_sheet_layout: 'Preparar una hoja nueva',
  suggest_view: 'Preparar una vista de la hoja',
  propose_catalog_from_sheet: 'Preparar una importación desde la hoja',
  search_knowledge: 'Buscar en el conocimiento del proyecto',
};

interface Activity {
  id: string;
  label: string;
  status: 'working' | 'succeeded' | 'failed';
  destination?: RouteLocationRaw;
}

export function runActivity(events: RunEvent[], projectId: string) {
  const items = new Map<string, Activity>();
  for (const event of events) {
    if (event.type !== 'tool.started' && event.type !== 'tool.completed')
      continue;
    const { callId, operation, status, target } = event.data;
    if (typeof callId !== 'string' || typeof operation !== 'string') continue;
    items.set(callId, {
      id: callId,
      label: operationLabels[operation] ?? 'Consultar datos del proyecto',
      status:
        event.type === 'tool.started'
          ? 'working'
          : status === 'succeeded'
            ? 'succeeded'
            : 'failed',
      destination:
        status === 'succeeded'
          ? operationDestination(projectId, operation, target)
          : undefined,
    });
  }
  return [...items.values()];
}

export function operationDestination(
  projectId: string,
  operation: string,
  value: unknown,
): RouteLocationRaw | undefined {
  const target = isRecord(value) ? value : {};
  const project = `/projects/${encodeURIComponent(projectId)}`;
  if (typeof target.worksheetId === 'string')
    return {
      path: `${project}/worksheets/${encodeURIComponent(target.worksheetId)}`,
    };

  switch (operation) {
    case 'get_catalog_snapshot':
      return {
        path: project,
        hash: '#importaciones',
        query: { catalogo: optionalId(target.snapshotId) },
      };
    case 'get_ruleset':
      if (typeof target.rulesetRevision === 'number')
        return { path: `${project}/rules/${target.rulesetRevision}` };
      return { path: `${project}/rules` };
    case 'create_ruleset':
    case 'preview_rules':
      return { path: `${project}/rules` };
    case 'get_evaluation_report':
      if (typeof target.evaluationId === 'string')
        return {
          path: `${project}/evaluations/${encodeURIComponent(target.evaluationId)}`,
        };
      return { path: `${project}/evaluations` };
    case 'request_evaluation':
      return { path: `${project}/evaluations` };
    case 'get_feed_status':
      return { path: `${project}/feed` };
    case 'list_feed_products':
      if (typeof target.exportId === 'string')
        return {
          path: `${project}/products`,
          query: productSourceQuery({
            kind: 'export',
            exportId: target.exportId,
          }),
        };
      if (
        typeof target.feedId === 'string' &&
        typeof target.versionId === 'string'
      )
        return {
          path: `${project}/products`,
          query: productSourceQuery({
            kind: 'feed_version',
            feedId: target.feedId,
            versionId: target.versionId,
          }),
        };
      return { path: `${project}/products` };
    case 'list_worksheets':
    case 'propose_sheet_layout':
      return {
        path: `${project}/workbooks`,
        hash:
          typeof target.workbookId === 'string'
            ? `#libro-${encodeURIComponent(target.workbookId)}`
            : '',
      };
  }
}

function optionalId(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
