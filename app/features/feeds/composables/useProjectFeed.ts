import { publicFeedUrl } from '../utils/feed-url';
import { ApiFailure } from '../../../services/api-client';
import type { Feed } from '../types/feeds';

/**
 * El feed del proyecto (como mucho uno) y la URL pública para Merchant Center.
 * Las operaciones devuelven el feed actualizado y se guarda aquí sin volver a
 * pedirlo; `refresh` lo vuelve a leer, por ejemplo tras un conflicto.
 */
export function useProjectFeed(projectId: MaybeRefOrGetter<string>) {
  const { $feeds } = useNuxtApp();
  const apiBaseUrl = useRuntimeConfig().public.apiBaseUrl;

  const { data, status, error, refresh } = useAsyncData(
    () => `feed:${toValue(projectId)}`,
    () => $feeds.findForProject(toValue(projectId)),
    { server: false },
  );

  const feed = computed(() => data.value ?? null);

  function replaceFeed(updated: Feed) {
    data.value = updated;
  }

  /** `deliveryUrl` es relativa a la raíz de la API, fuera de `/api`. */
  function publicUrl(deliveryUrl: string) {
    return publicFeedUrl(deliveryUrl, apiBaseUrl);
  }

  /**
   * Publica una exportación con la generación que se ve ahora. Si otro publicó
   * entretanto, la API responde 409: se vuelve a leer el feed para que la
   * persona decida con el estado real, y el error sigue hacia quien llama.
   */
  async function publish(exportId: string): Promise<Feed> {
    const current = feed.value;
    if (!current) {
      throw new ApiFailure(404, 'El proyecto todavía no tiene feed.');
    }
    try {
      const updated = await $feeds.publish(toValue(projectId), current.id, {
        exportId,
        expectedGeneration: current.generation,
      });
      replaceFeed(updated);
      return updated;
    } catch (failure) {
      if (isGenerationConflict(failure)) await refresh();
      throw failure;
    }
  }

  return { feed, status, error, refresh, replaceFeed, publicUrl, publish };
}

function isGenerationConflict(failure: unknown) {
  return (
    failure instanceof ApiFailure && failure.code === 'FEED_GENERATION_CONFLICT'
  );
}
