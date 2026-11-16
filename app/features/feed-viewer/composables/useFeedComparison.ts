import { isChangeKind, type ChangeKind } from '../types/feed-viewer';
import { offsetForPage } from '../../../utils/page-in-url';

export const COMPARISON_PAGE_SIZE = 20;

/** «Todos» en la URL es no mandar tipo a la API. */
export type ChangeFilter = ChangeKind | 'todos';

/**
 * Qué cambiaría en el canal si se publicara una exportación (V4). El tipo de
 * cambio (`?cambio=`) y la página viven en la URL; cambiar de tipo vuelve a la
 * primera página.
 */
export function useFeedComparison(
  projectId: MaybeRefOrGetter<string>,
  feedId: MaybeRefOrGetter<string | null>,
  exportId: MaybeRefOrGetter<string | null>,
) {
  const { $feedViewer } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();
  const { page, pageHref } = usePageInUrl();

  const filter = computed<ChangeFilter>(() => {
    const value = route.query.cambio;
    return isChangeKind(value) ? value : 'todos';
  });

  const { data, status, error, refresh } = useAsyncData(
    () =>
      `comparison:${toValue(feedId)}:${toValue(exportId)}:${filter.value}:${page.value}`,
    () => {
      const feed = toValue(feedId);
      const candidate = toValue(exportId);
      if (!feed || !candidate) return Promise.resolve(null);
      return $feedViewer.comparison(toValue(projectId), feed, {
        exportId: candidate,
        change: filter.value === 'todos' ? null : filter.value,
        limit: COMPARISON_PAGE_SIZE,
        offset: offsetForPage(page.value, COMPARISON_PAGE_SIZE),
      });
    },
    { server: false, deep: false },
  );

  function setFilter(next: ChangeFilter) {
    return router.push({
      query: {
        ...route.query,
        cambio: next === 'todos' ? undefined : next,
        pagina: undefined,
      },
    });
  }

  return {
    comparison: data,
    filter,
    page,
    pageHref,
    status,
    error,
    refresh,
    setFilter,
  };
}
