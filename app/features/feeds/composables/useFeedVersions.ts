/** Versiones por página; la API admite hasta 100. */
const VERSIONS_PAGE_SIZE = 20;

/**
 * Historial del feed, de la más reciente a la más antigua. La página vive en
 * la URL (`?pagina=`), como en el informe de la evaluación. La API no da el
 * total, solo si hay más: se navega con «anteriores» y «siguientes».
 */
export function useFeedVersions(
  projectId: MaybeRefOrGetter<string>,
  feedId: MaybeRefOrGetter<string>,
) {
  const { $feeds } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();

  const page = computed(() => {
    const value = Number(route.query.pagina);
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  const { data, status, error, refresh } = useAsyncData(
    () => `feed-versions:${toValue(feedId)}:${page.value}`,
    () =>
      $feeds.versions(toValue(projectId), toValue(feedId), {
        limit: VERSIONS_PAGE_SIZE,
        offset: (page.value - 1) * VERSIONS_PAGE_SIZE,
      }),
    { server: false },
  );

  const versions = computed(() => data.value?.versions ?? []);
  const hasMore = computed(() => data.value?.page.hasMore ?? false);

  function setPage(next: number) {
    void router.push({ query: { ...route.query, pagina: String(next) } });
  }

  return { versions, page, hasMore, status, error, refresh, setPage };
}
