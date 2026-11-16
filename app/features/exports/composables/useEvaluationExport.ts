import { ApiFailure } from '../../../services/api-client';
import type { ExportApproval } from '../types/exports';

/**
 * Exportación de una evaluación. La API no lista exportaciones: tras exportar,
 * su id queda en la URL (`?exportacion=…`, como el filtro del informe) y al
 * recargar se vuelve a leer. Exportar otra vez es seguro: devuelve la misma.
 */
export function useEvaluationExport(
  projectId: MaybeRefOrGetter<string>,
  evaluationId: MaybeRefOrGetter<string>,
) {
  const { $exports } = useNuxtApp();
  const route = useRoute();
  const router = useRouter();

  const exportId = computed(() => {
    const value = route.query.exportacion;
    return typeof value === 'string' && value !== '' ? value : null;
  });

  const { data, status, error } = useAsyncData(
    () => `export:${toValue(projectId)}:${exportId.value ?? 'ninguna'}`,
    () => {
      const id = exportId.value;
      return id ? $exports.find(toValue(projectId), id) : Promise.resolve(null);
    },
    { server: false },
  );

  // Un id de otra evaluación en la URL no se muestra como si fuera de esta.
  const productExport = computed(() => {
    const value = data.value;
    return value && value.evaluationId === toValue(evaluationId) ? value : null;
  });

  const isExporting = ref(false);
  const failure = ref<ApiFailure | null>(null);

  async function exportProducts(approval: ExportApproval) {
    isExporting.value = true;
    failure.value = null;
    try {
      const created = await $exports.create(toValue(projectId), approval);
      data.value = created;
      await router.replace({
        query: { ...route.query, exportacion: created.id },
      });
      return created;
    } catch (error) {
      failure.value =
        error instanceof ApiFailure
          ? error
          : new ApiFailure(0, 'No pudimos exportar los productos.');
      return null;
    } finally {
      isExporting.value = false;
    }
  }

  async function downloadTsv() {
    const current = productExport.value;
    if (!current) return;
    const file = await $exports.download(toValue(projectId), current.id);
    saveBlob(file, `productos-${current.id}.tsv`);
  }

  return {
    productExport,
    status,
    error,
    isExporting,
    failure,
    exportProducts,
    downloadTsv,
  };
}
