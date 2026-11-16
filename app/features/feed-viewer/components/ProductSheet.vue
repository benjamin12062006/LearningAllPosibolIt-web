<script setup lang="ts">
import type { ProductDetail } from '../types/feed-viewer';
import { isLinkColumn, safeHttpUrl } from '../utils/product-columns';

const { t, formatDateTime } = useAppLocale();

/**
 * Contenido de la ficha: de dónde sale el producto y todas sus columnas, en el
 * orden del archivo. Los enlaces solo si son `http(s)`, y sin dar acceso a
 * esta ventana (`noopener noreferrer`).
 */
const props = defineProps<{ projectId: string; detail: ProductDetail }>();

const provenance = computed(() => {
  const { source } = props.detail;
  if (source.kind === 'export') {
    return {
      text: t('Exportación del {0}', [formatDateTime(source.export.createdAt)]),
      evaluationId: source.export.evaluationId,
    };
  }
  return {
    text: t('Versión publicada el {0}', [
      formatDateTime(source.version.publishedAt),
    ]),
    evaluationId: source.version.evaluationId,
  };
});

const fields = computed(() =>
  props.detail.columns.map((column) => {
    const value = props.detail.product.values[column] ?? '';
    return {
      column,
      value,
      href: isLinkColumn(column) ? safeHttpUrl(value) : null,
    };
  }),
);
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <FeedViewerProductImage
        :src="detail.product.values.image_link"
        :alt="detail.product.values.title ?? ''"
      />
      <div class="min-w-0 text-sm">
        <p class="text-toned">{{ provenance.text }}</p>
        <p class="text-muted">
          {{ $t('Línea') }} {{ detail.product.line }} {{ $t('del archivo') }}
        </p>
      </div>
    </div>

    <NuxtLink
      v-if="provenance.evaluationId"
      :to="`/projects/${projectId}/evaluations/${provenance.evaluationId}`"
      class="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-primary hover:underline"
    >
      <UIcon name="i-lucide-clipboard-check" class="size-4" />
      {{ $t('Ver la evaluación de origen') }}
    </NuxtLink>

    <dl class="divide-y divide-default border-y border-default">
      <div
        v-for="field in fields"
        :key="field.column"
        class="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2 text-sm"
      >
        <dt class="font-mono text-xs break-all text-muted">
          {{ field.column }}
        </dt>
        <dd class="break-words whitespace-pre-wrap select-text">
          <a
            v-if="field.href"
            :href="field.href"
            target="_blank"
            rel="noopener noreferrer"
            class="focus-ring rounded-sm text-primary hover:underline"
          >
            {{ field.value }}
          </a>
          <template v-else-if="field.value">{{ field.value }}</template>
          <span v-else class="text-dimmed">{{ $t('Vacío') }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
