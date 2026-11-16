import type { EvaluationCounts, RowOutcome } from '../types/evaluations';

/** Filas por página del informe; la API admite hasta 100. */
export const REPORT_PAGE_SIZE = 20;

/** Nombres en la URL (`?resultado=invalidas`) y el `outcome` que espera la API. */
const OUTCOME_FILTERS = {
  todas: null,
  validas: 'valid',
  invalidas: 'invalid',
  excluidas: 'excluded',
} as const satisfies Record<string, RowOutcome | null>;

export type OutcomeFilter = keyof typeof OUTCOME_FILTERS;

/** Orden de las pestañas del informe. */
export const OUTCOME_FILTER_ORDER: readonly OutcomeFilter[] = [
  'todas',
  'validas',
  'invalidas',
  'excluidas',
];

export const OUTCOME_FILTER_LABELS: Record<OutcomeFilter, string> = {
  todas: 'Todas',
  validas: 'Válidas',
  invalidas: 'Inválidas',
  excluidas: 'Excluidas',
};

/**
 * Informe paginado de una evaluación terminada. Filtro y página viven en la
 * URL, como en la clase 70: se leen de `route.query` (página no válida → 1) y
 * al cambiar se hace `router.push` conservando el resto de parámetros (clase 71).
 * Usar solo con una evaluación terminada bien: si no, la API responde 409.
 */
export function useEvaluationReport(
  projectId: MaybeRefOrGetter<string>,
  evaluationId: MaybeRefOrGetter<string>,
) {
  const { $evaluations } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();

  const filter = computed<OutcomeFilter>(() => {
    const value = route.query.resultado;
    return isOutcomeFilter(value) ? value : 'todas';
  });

  const page = computed(() => {
    const value = Number(route.query.pagina);
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  // La clave cambia con filtro y página: Nuxt vuelve a pedir al cambiar la URL.
  const { data, status, error, refresh } = useAsyncData(
    () =>
      `evaluation-rows:${toValue(evaluationId)}:${filter.value}:${page.value}`,
    () =>
      $evaluations.rows(toValue(projectId), toValue(evaluationId), {
        outcome: OUTCOME_FILTERS[filter.value],
        limit: REPORT_PAGE_SIZE,
        offset: (page.value - 1) * REPORT_PAGE_SIZE,
      }),
    { server: false },
  );

  const rows = computed(() => data.value?.rows ?? []);

  function setFilter(next: OutcomeFilter) {
    // Otro filtro empieza en la primera página.
    void router.push({
      query: { ...route.query, resultado: next, pagina: undefined },
    });
  }

  function setPage(next: number) {
    void router.push({ query: { ...route.query, pagina: String(next) } });
  }

  return { filter, page, rows, status, error, refresh, setFilter, setPage };
}

/** Cuántas filas tiene el filtro: lo dicen los conteos, la API no da el total. */
export function countForFilter(
  counts: EvaluationCounts,
  filter: OutcomeFilter,
) {
  if (filter === 'validas') return counts.valid;
  if (filter === 'invalidas') return counts.invalid;
  if (filter === 'excluidas') return counts.excluded;
  return counts.total;
}

export function isOutcomeFilter(value: unknown): value is OutcomeFilter {
  return typeof value === 'string' && Object.hasOwn(OUTCOME_FILTERS, value);
}
