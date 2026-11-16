import {
  readPage,
  readSearch,
  withPage,
  withSearch,
} from '../utils/page-in-url';

export interface PageInUrlKeys {
  pageKey?: string;
  searchKey?: string;
}

/**
 * Página y búsqueda de un listado, guardadas en la URL (`?pagina=2&buscar=…`):
 * se pueden enlazar, y «Atrás» del navegador vuelve a la anterior. Común a los
 * listados paginados contra Nest (lecciones 70, 71 y 228; ficha ui 04, E6).
 */
export function usePageInUrl({
  pageKey = 'pagina',
  searchKey = 'buscar',
}: PageInUrlKeys = {}) {
  const route = useRoute();
  const router = useRouter();

  const page = computed(() => readPage(route.query[pageKey]));
  const search = computed(() => readSearch(route.query[searchKey]));

  function setPage(next: number) {
    return router.push({ query: withPage(route.query, pageKey, next) });
  }

  function setSearch(text: string) {
    return router.push({
      query: withSearch(route.query, { searchKey, pageKey }, text),
    });
  }

  /** Dirección de una página, para que la paginación sea de enlaces reales. */
  function pageHref(target: number) {
    return router.resolve({ query: withPage(route.query, pageKey, target) })
      .href;
  }

  return { page, search, setPage, setSearch, pageHref };
}
