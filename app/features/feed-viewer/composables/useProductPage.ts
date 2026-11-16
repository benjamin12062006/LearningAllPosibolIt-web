import type { ProductSourceRef } from '../types/feed-viewer';
import { offsetForPage } from '../../../utils/page-in-url';
import { productSourceKey } from '../utils/product-source';

/** Productos por página; la API admite hasta 100. */
export const PRODUCTS_PAGE_SIZE = 50;

/**
 * Una página de productos del archivo elegido. La página y la búsqueda viven
 * en la URL (`usePageInUrl`); al cambiar una u otra, Nuxt cancela la petición
 * anterior con su `signal` (plan del visor, VW6).
 */
export function useProductPage(
  projectId: MaybeRefOrGetter<string>,
  source: MaybeRefOrGetter<ProductSourceRef | null>,
) {
  const { $feedViewer } = useNuxtApp();
  const { page, search, setSearch, pageHref } = usePageInUrl();

  const sourceKey = computed(() => {
    const current = toValue(source);
    return current ? productSourceKey(current) : 'sin-origen';
  });

  // `deep: false`: la página se sustituye entera, no hace falta observar cada celda.
  const { data, status, error, refresh } = useAsyncData(
    () => `products:${sourceKey.value}:${page.value}:${search.value}`,
    (_nuxtApp, { signal }) => {
      const current = toValue(source);
      if (!current) return Promise.resolve(null);
      return $feedViewer.products(toValue(projectId), current, {
        limit: PRODUCTS_PAGE_SIZE,
        offset: offsetForPage(page.value, PRODUCTS_PAGE_SIZE),
        search: search.value,
        signal,
      });
    },
    { server: false, deep: false },
  );

  const products = computed(() => data.value?.products ?? []);
  const columns = computed(() => data.value?.columns ?? []);
  const rowCount = computed(() => data.value?.rowCount ?? 0);
  const hasMore = computed(() => data.value?.page.hasMore ?? false);
  const isSearching = computed(() => search.value !== '');

  return {
    products,
    columns,
    rowCount,
    hasMore,
    isSearching,
    page,
    search,
    setSearch,
    pageHref,
    status,
    error,
    refresh,
  };
}
