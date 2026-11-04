import { isActiveEvaluation } from '../types/evaluations';

/**
 * Cada cuánto se vuelve a pedir una evaluación en curso y hasta cuándo. Un
 * catálogo de 5.000 filas puede tardar más que una importación: 10 minutos.
 */
const EVALUATION_POLLING = { intervalMs: 2_000, timeoutMs: 600_000 } as const;

/**
 * Una evaluación. Mientras está en cola o evaluándose se vuelve a pedir sola;
 * se detiene al terminar, al agotar el tiempo o al salir de la página. La
 * muestra de la API no se usa: la primera página del informe da esas filas.
 */
export function useEvaluation(
  projectId: MaybeRefOrGetter<string>,
  evaluationId: MaybeRefOrGetter<string>,
) {
  const { $evaluations } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `evaluation:${toValue(projectId)}:${toValue(evaluationId)}`,
    () => $evaluations.find(toValue(projectId), toValue(evaluationId)),
    { server: false },
  );

  const evaluation = computed(() => data.value?.evaluation ?? null);
  const isActive = computed(
    () => evaluation.value !== null && isActiveEvaluation(evaluation.value),
  );
  const isWaitingTooLong = ref(false);

  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Cada respuesta nueva decide si hace falta otra consulta.
  watch(
    data,
    () => {
      clearTimeout(timer);
      if (!isActive.value) return;
      if (Date.now() - startedAt > EVALUATION_POLLING.timeoutMs) {
        isWaitingTooLong.value = true;
        return;
      }
      timer = setTimeout(() => void refresh(), EVALUATION_POLLING.intervalMs);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));

  return {
    evaluation,
    isActive,
    isWaitingTooLong,
    status,
    error,
    refresh,
  };
}
