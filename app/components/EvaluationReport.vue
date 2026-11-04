<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { ApiFailure } from '../services/api-client';
import type { EvaluationCounts } from '../types/evaluations';

/**
 * Informe de una evaluación terminada: filtro por resultado, filas paginadas
 * que se despliegan y descarga de `errores.csv`.
 */
const props = defineProps<{
  projectId: string;
  evaluationId: string;
  counts: EvaluationCounts;
}>();

const { $evaluations } = useNuxtApp();
const toast = useToast();
const { filter, page, rows, status, error, refresh, setFilter, setPage } =
  useEvaluationReport(
    () => props.projectId,
    () => props.evaluationId,
  );

const isDownloading = ref(false);

const filterItems = computed<TabsItem[]>(() =>
  OUTCOME_FILTER_ORDER.map((value) => ({
    value,
    label: `${OUTCOME_FILTER_LABELS[value]} (${countForFilter(props.counts, value).toLocaleString('es')})`,
  })),
);

// UTabs y UPagination leen y escriben la URL a través del composable.
const selectedFilter = computed({
  get: () => filter.value,
  set: (value: string | number) => {
    if (isOutcomeFilter(value)) setFilter(value);
  },
});
const currentPage = computed({
  get: () => page.value,
  set: (value: number) => setPage(value),
});

const total = computed(() => countForFilter(props.counts, filter.value));
const isFirstLoad = computed(
  () => status.value === 'pending' && rows.value.length === 0,
);

async function downloadErrors() {
  isDownloading.value = true;
  try {
    const file = await $evaluations.errorsCsv(
      props.projectId,
      props.evaluationId,
    );
    saveBlob(file, `errores-${props.evaluationId}.csv`);
  } catch (failure) {
    toast.add({
      title: 'No se descargó errores.csv',
      description:
        failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="informe">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="informe" class="text-lg font-medium text-highlighted">
          Informe
        </h2>
        <p class="mt-1 text-sm text-muted">
          Cada fila del CSV con su resultado. Abre una fila para ver sus
          problemas y cómo corregirlos.
        </p>
      </div>
      <UButton
        v-if="counts.invalid > 0"
        icon="i-lucide-download"
        color="neutral"
        variant="soft"
        :loading="isDownloading"
        @click="downloadErrors"
      >
        Descargar errores.csv
      </UButton>
    </div>

    <UTabs
      v-model="selectedFilter"
      :items="filterItems"
      :content="false"
      variant="link"
      class="mt-4"
    />

    <div v-if="isFirstLoad" class="mt-4 space-y-3">
      <USkeleton v-for="row in 5" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-4"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <p v-else-if="total === 0" class="mt-4 text-sm text-dimmed">
      Ninguna fila con este resultado.
    </p>

    <template v-else>
      <EvaluationRowsTable :rows="rows" class="mt-2" />
      <UPagination
        v-if="total > REPORT_PAGE_SIZE"
        v-model:page="currentPage"
        :total="total"
        :items-per-page="REPORT_PAGE_SIZE"
        class="mt-4 flex justify-center"
      />
    </template>
  </section>
</template>
