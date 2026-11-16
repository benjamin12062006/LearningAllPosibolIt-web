import type { EvaluationRowsPage } from '../../evaluations/types/evaluations';
import { isEvaluationRowsPage } from '../../evaluations/types/evaluations';
import {
  isAttention,
  isDeliveryStatus,
  isFeedComparison,
  isProductDetail,
  isProductPage,
  isRulesPreview,
  type Attention,
  type ChangeKind,
  type DeliveryStatus,
  type FeedComparison,
  type ProductDetail,
  type ProductPage,
  type ProductSourceRef,
  type RulesPreview,
} from '../types/feed-viewer';
import type { RulesetInput } from '../../rulesets/types/rulesets';
import { isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

export interface PageQuery {
  limit: number;
  offset: number;
}

export interface ProductsQuery extends PageQuery {
  /** Busca en `id` o en `title`; vacío es «todos». */
  search: string;
  /** Cancela la petición cuando otra búsqueda la sustituye. */
  signal?: AbortSignal;
}

/** Las filas de un grupo de «Requiere atención»: un problema o una regla. */
export type AttentionGroupRef =
  | { kind: 'problem'; attribute: string; code: string }
  | { kind: 'exclusion'; rulePosition: number };

export interface ComparisonQuery extends PageQuery {
  exportId: string;
  /** Sin tipo, los tres. */
  change: ChangeKind | null;
}

export interface PreviewRequest extends RulesetInput {
  snapshotId: string;
  /** Sin ella, se compara con la última revisión guardada. */
  baseRevision?: number;
}

/**
 * Visor y diagnóstico del feed (V1–V5 de la API). Todo es lectura salvo la
 * vista previa de reglas, que es un `POST` que no guarda nada.
 */
export function createFeedViewerService(api: ApiClient) {
  return {
    /** Una página de productos del TSV de una exportación o de una versión. */
    async products(
      projectId: string,
      source: ProductSourceRef,
      { limit, offset, search, signal }: ProductsQuery,
    ): Promise<ProductPage> {
      const response = await api.request(
        `${sourcePath(projectId, source)}/products`,
        { query: { limit, offset, ...(search ? { search } : {}) }, signal },
      );
      if (!isProductPage(response)) throw invalidResponse();
      return response;
    },

    /** El `id` va en la consulta, no en la ruta: un SKU puede llevar barras. */
    async product(
      projectId: string,
      source: ProductSourceRef,
      productId: string,
    ): Promise<ProductDetail> {
      const response = await api.request(
        `${sourcePath(projectId, source)}/product`,
        { query: { id: productId } },
      );
      if (!isProductDetail(response)) throw invalidResponse();
      return response;
    },

    /** Si la URL pública entrega y, si no, por qué. Nunca trae el token. */
    async delivery(projectId: string, feedId: string): Promise<DeliveryStatus> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/delivery`,
      );
      if (isRecord(response) && isDeliveryStatus(response.delivery)) {
        return response.delivery;
      }
      throw invalidResponse();
    },

    /** 409 `EVALUATION_RESULTS_UNAVAILABLE` si la evaluación no terminó bien. */
    async attention(
      projectId: string,
      evaluationId: string,
    ): Promise<Attention> {
      const response = await api.request(
        `${evaluationPath(projectId, evaluationId)}/attention`,
      );
      if (isRecord(response) && isAttention(response.attention)) {
        return response.attention;
      }
      throw invalidResponse();
    },

    /** Los productos de un grupo: el informe de filas con su filtro. */
    async attentionRows(
      projectId: string,
      evaluationId: string,
      group: AttentionGroupRef,
      { limit, offset }: PageQuery,
    ): Promise<EvaluationRowsPage> {
      const response = await api.request(
        `${evaluationPath(projectId, evaluationId)}/rows`,
        { query: { limit, offset, ...groupFilter(group) } },
      );
      if (!isEvaluationRowsPage(response)) throw invalidResponse();
      return response;
    },

    /** 409 `FEED_NOT_PUBLISHED` si no hay versión vigente con la que comparar. */
    async comparison(
      projectId: string,
      feedId: string,
      { exportId, change, limit, offset }: ComparisonQuery,
    ): Promise<FeedComparison> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/comparison`,
        { query: { exportId, limit, offset, ...(change ? { change } : {}) } },
      );
      if (isRecord(response) && isFeedComparison(response.comparison)) {
        return response.comparison;
      }
      throw invalidResponse();
    },

    /** Prueba unas reglas sin guardarlas. Pide Editor: un Viewer recibe 403. */
    async previewRules(
      projectId: string,
      request: PreviewRequest,
      { limit, offset }: PageQuery,
    ): Promise<RulesPreview> {
      const response = await api.request(
        `/projects/${encodeURIComponent(projectId)}/evaluations/preview`,
        { method: 'POST', body: { ...request }, query: { limit, offset } },
      );
      if (isRecord(response) && isRulesPreview(response.preview)) {
        return response.preview;
      }
      throw invalidResponse();
    },
  };
}

export type FeedViewerService = ReturnType<typeof createFeedViewerService>;

function sourcePath(projectId: string, source: ProductSourceRef) {
  const project = `/projects/${encodeURIComponent(projectId)}`;
  if (source.kind === 'export') {
    return `${project}/exports/${encodeURIComponent(source.exportId)}`;
  }
  return `${feedPath(projectId, source.feedId)}/versions/${encodeURIComponent(source.versionId)}`;
}

function feedPath(projectId: string, feedId: string) {
  return `/projects/${encodeURIComponent(projectId)}/feeds/${encodeURIComponent(feedId)}`;
}

function evaluationPath(projectId: string, evaluationId: string) {
  return `/projects/${encodeURIComponent(projectId)}/evaluations/${encodeURIComponent(evaluationId)}`;
}

/** `attribute` y `code` van juntos (uno solo da 400); `rule` es la posición desde 1. */
function groupFilter(
  group: AttentionGroupRef,
): Record<string, string | number> {
  if (group.kind === 'problem') {
    return { attribute: group.attribute, code: group.code };
  }
  return { rule: group.rulePosition };
}
