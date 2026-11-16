import {
  isFeed,
  isFeedVersionList,
  isFeedWithDelivery,
  isLastRefresh,
  type Feed,
  type FeedSchedule,
  type FeedSource,
  type FeedVersionList,
  type FeedWithDelivery,
  type LastRefresh,
} from '../types/feeds';
import { isRecord } from '../../../utils/guards';
import { invalidResponse, type ApiClient } from '../../../services/api-client';

/** Lo que el operador aprueba; motor, perfil y fecha los fija el servidor. */
export interface PolicyInput {
  rulesetRevision: number;
  maxInvalid: number;
  maxExcluded: number;
  maxDropPercent: number;
}

export function createFeedsService(api: ApiClient) {
  return {
    /** Un proyecto tiene como mucho un feed; `null` si todavía no lo creó. */
    async findForProject(projectId: string): Promise<Feed | null> {
      const response = await api.request(feedsPath(projectId));
      if (!isRecord(response) || !Array.isArray(response.items)) {
        throw invalidResponse();
      }
      const [first] = response.items;
      if (first === undefined) return null;
      if (!isFeed(first)) throw invalidResponse();
      return first;
    },

    async create(projectId: string): Promise<FeedWithDelivery> {
      const response = await api.request(feedsPath(projectId), {
        method: 'POST',
      });
      return readWithDelivery(response);
    },

    /** Token nuevo: la URL anterior deja de funcionar. */
    async rotateDeliveryToken(
      projectId: string,
      feedId: string,
    ): Promise<FeedWithDelivery> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/delivery-token`,
        { method: 'POST' },
      );
      return readWithDelivery(response);
    },

    /** La URL pública responde 404 hasta rotar otro token. */
    async disableDelivery(projectId: string, feedId: string): Promise<void> {
      await api.request(`${feedPath(projectId, feedId)}/delivery-token`, {
        method: 'DELETE',
      });
    },

    /** Falla con 409 si la generación ya no es la vigente. */
    async publish(
      projectId: string,
      feedId: string,
      request: { exportId: string; expectedGeneration: number },
    ): Promise<Feed> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/publications`,
        { method: 'POST', body: { ...request } },
      );
      return readFeed(response);
    },

    async versions(
      projectId: string,
      feedId: string,
      page: { limit: number; offset: number },
    ): Promise<FeedVersionList> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/versions`,
        { query: { ...page } },
      );
      if (!isFeedVersionList(response)) throw invalidResponse();
      return response;
    },

    async setSource(
      projectId: string,
      feedId: string,
      source: FeedSource,
    ): Promise<Feed> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/source`,
        { method: 'PUT', body: { ...source } },
      );
      return readFeed(response);
    },

    async approvePolicy(
      projectId: string,
      feedId: string,
      policy: PolicyInput,
    ): Promise<Feed> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/policy`,
        { method: 'PUT', body: { ...policy } },
      );
      return readFeed(response);
    },

    async setSchedule(
      projectId: string,
      feedId: string,
      schedule: FeedSchedule,
    ): Promise<Feed> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/schedule`,
        { method: 'PUT', body: { ...schedule } },
      );
      return readFeed(response);
    },

    /** 202: la actualización queda en cola y se consulta por su id. */
    async triggerRefresh(
      projectId: string,
      feedId: string,
    ): Promise<LastRefresh> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/refreshes`,
        { method: 'POST' },
      );
      return readRefresh(response);
    },

    async findRefresh(
      projectId: string,
      feedId: string,
      refreshId: string,
    ): Promise<LastRefresh> {
      const response = await api.request(
        `${feedPath(projectId, feedId)}/refreshes/${encodeURIComponent(refreshId)}`,
      );
      return readRefresh(response);
    },
  };
}

export type FeedsService = ReturnType<typeof createFeedsService>;

function readFeed(response: unknown): Feed {
  if (isRecord(response) && isFeed(response.feed)) return response.feed;
  throw invalidResponse();
}

function readWithDelivery(response: unknown): FeedWithDelivery {
  if (isFeedWithDelivery(response)) return response;
  throw invalidResponse();
}

/** La vista completa de la actualización trae más campos; se usan los del último intento. */
function readRefresh(response: unknown): LastRefresh {
  if (isRecord(response) && isLastRefresh(response.refresh)) {
    return response.refresh;
  }
  throw invalidResponse();
}

function feedsPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}/feeds`;
}

function feedPath(projectId: string, feedId: string) {
  return `${feedsPath(projectId)}/${encodeURIComponent(feedId)}`;
}
