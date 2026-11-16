<!-- La versión que descarga Merchant Center: filas, tamaño, cuándo y cómo se publicó. -->
<script setup lang="ts">
import { PUBLISHED_BY_LABELS, type PublishedVersion } from '../types/feeds';

const { formatDateTime, language } = useAppLocale();

defineProps<{
  version: PublishedVersion | null;
  projectId: string;
  feedId: string;
}>();
</script>

<template>
  <section aria-labelledby="publicada">
    <h2 id="publicada" class="text-lg font-medium text-highlighted">
      {{ $t('Versión publicada') }}
    </h2>
    <div v-if="version" class="focus-row mt-2">
      <UIcon name="i-lucide-file-check" class="size-5 shrink-0 text-success" />
      <p class="min-w-0 flex-1 text-sm">
        {{ version.rowCount.toLocaleString(language) }} {{ $t('productos ·') }}
        {{ formatBytes(version.byteSize) }} {{ $t('· publicada') }}
        {{ $t(PUBLISHED_BY_LABELS[version.publishedBy]) }} {{ $t('el') }}
        {{ formatDateTime(version.publishedAt) }}
      </p>
      <UButton
        :to="{
          path: `/projects/${projectId}/products`,
          query: { feed: feedId, version: version.id },
        }"
        size="sm"
        color="neutral"
        variant="soft"
        icon="i-lucide-package-search"
      >
        {{ $t('Ver productos') }}
      </UButton>
      <UButton
        v-if="version.evaluationId"
        :to="`/projects/${projectId}/evaluations/${version.evaluationId}`"
        size="sm"
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-right"
      >
        {{ $t('Evaluación') }}
      </UButton>
    </div>
    <p v-else class="mt-2 text-sm text-muted">
      {{
        $t(
          'Todavía no hay nada publicado. Exporta una evaluación y publícala desde su página.',
        )
      }}
    </p>
  </section>
</template>
