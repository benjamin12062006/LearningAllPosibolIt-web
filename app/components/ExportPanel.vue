<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';
import { ApiFailure } from '../services/api-client';
import type { Evaluation, EvaluationCounts } from '../types/evaluations';

/**
 * Revisar y exportar (incremento 3 de docs-diagrams). El informe de arriba es
 * la revisión; aquí se confirma de forma explícita lo que queda fuera y se
 * obtiene `productos.tsv`. La API decide si se puede: sus 409 se muestran tal cual.
 */
const props = defineProps<{
  projectId: string;
  evaluation: Evaluation;
  /** Los de la evaluación terminada; aparte para no forzar el tipo. */
  counts: EvaluationCounts;
}>();

const emit = defineEmits<{ reload: [] }>();

const toast = useToast();
const { productExport, isExporting, failure, exportProducts, downloadTsv } =
  useEvaluationExport(
    () => props.projectId,
    () => props.evaluation.id,
  );

const hasReviewed = ref(false);
const isDownloading = ref(false);

const hasValidProducts = computed(() => props.counts.valid > 0);
const canExport = computed(
  () => hasReviewed.value && props.evaluation.resultChecksum !== null,
);

/** Una salida útil según el motivo con el que la API rechazó la exportación. */
const failureActions = computed<ButtonProps[]>(() => {
  const code = failure.value?.code;
  if (code === 'EXPORT_APPROVAL_MISMATCH') {
    return [
      { label: 'Volver a leer la evaluación', onClick: () => emit('reload') },
    ];
  }
  if (
    code === 'EXPORT_EVALUATION_SUPERSEDED' ||
    code === 'EXPORT_EVALUATION_OUTDATED'
  ) {
    return [
      {
        label: 'Ver evaluaciones',
        to: `/projects/${props.projectId}/evaluations`,
      },
    ];
  }
  return [];
});

async function confirmExport() {
  const checksum = props.evaluation.resultChecksum;
  if (!checksum) return;
  const created = await exportProducts({
    evaluationId: props.evaluation.id,
    resultChecksum: checksum,
    acceptedInvalidCount: props.counts.invalid,
    acceptedExcludedCount: props.counts.excluded,
  });
  if (created) {
    toast.add({
      title: 'productos.tsv listo',
      description: `${created.rowCount.toLocaleString('es')} productos exportados.`,
      color: 'success',
      icon: 'i-lucide-check',
    });
  }
}

async function download() {
  isDownloading.value = true;
  try {
    await downloadTsv();
  } catch (error) {
    toast.add({
      title: 'No se descargó productos.tsv',
      description:
        error instanceof ApiFailure ? error.message : 'Inténtalo de nuevo.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <section
    aria-labelledby="exportar"
    class="rounded-lg p-5 ring-1 ring-default"
  >
    <h2 id="exportar" class="text-lg font-medium text-highlighted">
      Exportar a Google
    </h2>

    <!-- Ya exportada: el archivo y lo que se aceptó dejar fuera. -->
    <div v-if="productExport" class="mt-3 space-y-3">
      <p class="text-sm text-toned">
        <UIcon
          name="i-lucide-file-check"
          class="me-1 inline size-4 text-success"
        />
        <code>productos.tsv</code> con
        {{ productExport.rowCount.toLocaleString('es') }} productos ·
        {{ formatBytes(productExport.byteSize) }} ·
        {{ formatDateTime(productExport.createdAt) }}
      </p>
      <p class="text-sm text-muted">
        Se aceptó dejar fuera
        {{ productExport.acceptedInvalidCount.toLocaleString('es') }} inválidos
        y
        {{ productExport.acceptedExcludedCount.toLocaleString('es') }}
        excluidos.
      </p>
      <UButton
        icon="i-lucide-download"
        :loading="isDownloading"
        @click="download"
      >
        Descargar productos.tsv
      </UButton>
    </div>

    <UAlert
      v-else-if="!hasValidProducts"
      class="mt-3"
      color="warning"
      variant="subtle"
      icon="i-lucide-package-x"
      title="No hay productos válidos que exportar"
      description="Corrige el catálogo o las reglas y vuelve a evaluar."
      :actions="[
        { label: 'Ver las reglas', to: `/projects/${projectId}/rules` },
      ]"
    />

    <div v-else class="mt-3 space-y-4">
      <ul class="space-y-1.5 text-sm">
        <li class="flex items-center gap-2">
          <UIcon name="i-lucide-circle-check" class="size-4 text-success" />
          Se exportan {{ counts.valid.toLocaleString('es') }} productos válidos.
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-lucide-circle-alert" class="size-4 text-error" />
          Quedan fuera {{ counts.invalid.toLocaleString('es') }} inválidos (sus
          problemas están en el informe y en errores.csv).
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-lucide-filter-x" class="size-4 text-muted" />
          Quedan fuera {{ counts.excluded.toLocaleString('es') }} excluidos por
          las reglas.
        </li>
      </ul>

      <UCheckbox
        v-model="hasReviewed"
        label="He revisado los productos que quedan fuera"
      />

      <UAlert
        v-if="failure"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="No se exportó"
        :description="failure.message"
        :actions="failureActions"
      />

      <UButton
        icon="i-lucide-file-output"
        :disabled="!canExport"
        :loading="isExporting"
        @click="confirmExport"
      >
        Exportar productos.tsv
      </UButton>
    </div>
  </section>
</template>
