<!-- La versión que descarga Merchant Center: filas, tamaño, cuándo y cómo se publicó. -->
<script setup lang="ts">
import { PUBLISHED_BY_LABELS, type PublishedVersion } from '../types/feeds';

defineProps<{ version: PublishedVersion | null; projectId: string }>();
</script>

<template>
  <section aria-labelledby="publicada">
    <h2 id="publicada" class="text-lg font-medium text-highlighted">
      Versión publicada
    </h2>
    <div v-if="version" class="focus-row mt-2">
      <UIcon name="i-lucide-file-check" class="size-5 shrink-0 text-success" />
      <p class="min-w-0 flex-1 text-sm">
        {{ version.rowCount.toLocaleString('es') }} productos ·
        {{ formatBytes(version.byteSize) }} · publicada
        {{ PUBLISHED_BY_LABELS[version.publishedBy] }} el
        {{ formatDateTime(version.publishedAt) }}
      </p>
      <UButton
        v-if="version.evaluationId"
        :to="`/projects/${projectId}/evaluations/${version.evaluationId}`"
        size="sm"
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-right"
      >
        Evaluación
      </UButton>
    </div>
    <p v-else class="mt-2 text-sm text-muted">
      Todavía no hay nada publicado. Exporta una evaluación y publícala desde su
      página.
    </p>
  </section>
</template>
