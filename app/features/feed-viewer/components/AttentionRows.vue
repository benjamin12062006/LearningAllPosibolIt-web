<script setup lang="ts">
import type { AttentionGroupRef } from '../services/feed-viewer';

/** Productos de un grupo de «Requiere atención»; se piden al abrir el grupo. */
const props = defineProps<{
  projectId: string;
  evaluationId: string;
  group: AttentionGroupRef;
  groupKey: string;
}>();

const GROUP_PAGE_SIZE = 20;

const { $feedViewer } = useNuxtApp();
// Varios grupos pueden estar abiertos a la vez: la página es de cada uno, no de la URL.
const page = ref(1);

const { data, status, error, refresh } = useAsyncData(
  () => `attention-rows:${props.evaluationId}:${props.groupKey}:${page.value}`,
  () =>
    $feedViewer.attentionRows(
      props.projectId,
      props.evaluationId,
      props.group,
      {
        limit: GROUP_PAGE_SIZE,
        offset: (page.value - 1) * GROUP_PAGE_SIZE,
      },
    ),
  { server: false, deep: false },
);

const rows = computed(() => data.value?.rows ?? []);
const hasMore = computed(() => data.value?.page.hasMore ?? false);
</script>

<template>
  <div>
    <div v-if="status === 'pending' && rows.length === 0" class="space-y-2">
      <USkeleton v-for="row in 3" :key="row" class="h-8 w-full" />
    </div>
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />
    <template v-else>
      <ul class="rounded-md bg-muted/60 px-3">
        <li
          v-for="row in rows"
          :key="row.sourceRow"
          class="flex items-baseline gap-3 border-b border-default py-1.5 text-sm last:border-b-0"
        >
          <span class="w-16 shrink-0 text-xs text-muted tabular-nums">
            {{ $t('Fila') }} {{ row.sourceRow }}
          </span>
          <span class="shrink-0 font-mono text-xs select-text">
            {{ row.externalId }}
          </span>
          <span class="min-w-0 flex-1 truncate text-toned">
            {{ row.values?.title }}
          </span>
        </li>
      </ul>
      <div v-if="page > 1 || hasMore" class="mt-2 flex gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevron-left"
          :disabled="page === 1"
          @click="page -= 1"
        >
          {{ $t('Anteriores') }}
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-right"
          :disabled="!hasMore"
          @click="page += 1"
        >
          {{ $t('Siguientes') }}
        </UButton>
      </div>
    </template>
  </div>
</template>
