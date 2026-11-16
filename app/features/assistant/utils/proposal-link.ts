import type { Proposal } from '../types/assistant';
import { isRecord } from '../../../utils/guards';
import { worksheetTarget } from './run-state';

export function proposalLink(projectId: string, proposal: Proposal) {
  const target = worksheetTarget(proposal.target);
  const result = isRecord(proposal.result) ? proposal.result : {};
  const project = `/projects/${encodeURIComponent(projectId)}`;
  if (typeof result.snapshotId === 'string') {
    return {
      label: 'Abrir importación del catálogo',
      to: {
        path: project,
        hash: '#importaciones',
        query: { catalogo: result.snapshotId },
      },
    };
  }
  if (typeof result.rulesetRevision === 'number') {
    return {
      label: 'Abrir revisión',
      to: { path: `${project}/rules/${result.rulesetRevision}` },
    };
  }
  if (typeof result.evaluationId === 'string') {
    return {
      label: 'Abrir evaluación',
      to: {
        path: `${project}/evaluations/${encodeURIComponent(result.evaluationId)}`,
      },
    };
  }
  const worksheetId =
    typeof result.worksheetId === 'string'
      ? result.worksheetId
      : target?.worksheetId;
  if (!worksheetId) return null;
  const base = `${project}/worksheets/${encodeURIComponent(worksheetId)}`;
  if (typeof result.changesetId === 'string') {
    return {
      label: 'Abrir borrador',
      to: { path: base, query: { draft: result.changesetId } },
    };
  }
  if (typeof result.savedViewId === 'string') {
    return {
      label: 'Abrir vista guardada',
      to: { path: base, query: { view: result.savedViewId } },
    };
  }
  return { label: 'Abrir hoja', to: { path: base } };
}
