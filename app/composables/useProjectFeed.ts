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

  return { feed, status, error, refresh, replaceFeed, publicUrl };
}
