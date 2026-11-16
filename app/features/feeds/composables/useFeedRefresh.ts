import { isActiveRefresh, type LastRefresh } from '../types/feeds';

/**
 * Cada cuánto se consulta una actualización y hasta cuándo: descarga,
 * importación y evaluación juntas pueden tardar como una evaluación.
 */
const REFRESH_POLLING = { intervalMs: 2_000, timeoutMs: 600_000 } as const;

/**
 * «Actualizar ahora»: pone en cola una actualización del feed y la sigue hasta
 * que termina. Devuelve el último estado visto; `null` si se salió antes.
 */
export function useFeedRefresh(
  projectId: MaybeRefOrGetter<string>,
  feedId: MaybeRefOrGetter<string>,
) {
  const { $feeds } = useNuxtApp();
  const running = ref<LastRefresh | null>(null);

  let stopped = false;
  onScopeDispose(() => {
    stopped = true;
  });

  async function refreshNow(): Promise<LastRefresh | null> {
    const queued = await $feeds.triggerRefresh(
      toValue(projectId),
      toValue(feedId),
    );
    running.value = queued;
    try {
      return await waitUntilFinished(queued.id);
    } finally {
      running.value = null;
    }
  }

  async function waitUntilFinished(refreshId: string) {
    const deadline = Date.now() + REFRESH_POLLING.timeoutMs;
    while (!stopped && Date.now() < deadline) {
      const current = running.value;
      if (current && !isActiveRefresh(current)) return current;
      await wait(REFRESH_POLLING.intervalMs);
      running.value = await $feeds.findRefresh(
        toValue(projectId),
        toValue(feedId),
        refreshId,
      );
    }
    return stopped ? null : running.value;
  }

  return { running, refreshNow };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
