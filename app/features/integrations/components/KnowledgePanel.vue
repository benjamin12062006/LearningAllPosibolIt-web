<script setup lang="ts">
const { t } = useAppLocale();

const props = defineProps<{ projectId: string; canReindex: boolean }>();
const { $integrations } = useNuxtApp();
const { run, isRunning } = useAction();
const toast = useToast();
const { data, error, status, refresh } = useAsyncData(
  () => `knowledge:${props.projectId}`,
  () => $integrations.knowledge(props.projectId),
  { server: false },
);
const groups = computed(() => {
  const summary = new Map<string, { total: number; pending: number }>();
  for (const source of data.value?.sources ?? []) {
    const count = summary.get(source.sourceType) ?? { total: 0, pending: 0 };
    count.total += 1;
    if (source.pending) count.pending += 1;
    summary.set(source.sourceType, count);
  }
  return [...summary.entries()];
});
const labels: Record<string, string> = {
  project: t('Proyecto'),
  worksheet: t('Hojas'),
  ruleset: t('Reglas'),
  evaluation: t('Evaluaciones'),
  catalog: t('Catálogo'),
  feed: 'Feed',
};

async function reindex() {
  const queued = await run(t('No se pudo reindexar'), async () => {
    await $integrations.reindex(props.projectId);
    return true;
  });
  if (!queued) return;
  toast.add({ title: 'Reindexado en cola', color: 'success' });
  await refresh();
}
</script>

<template>
  <section
    :aria-label="$t('Conocimiento del asistente')"
    class="mt-8 space-y-3 border-t border-default pt-6"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">
        {{ $t('Conocimiento del asistente') }}
      </h2>
      <UButton
        v-if="data?.enabled && canReindex"
        size="sm"
        variant="soft"
        icon="i-lucide-refresh-cw"
        :loading="isRunning"
        @click="reindex"
        >{{ $t('Reindexar') }}</UButton
      >
    </div>
    <USkeleton v-if="status === 'pending'" class="h-14" />
    <UAlert
      v-else-if="error"
      color="error"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />
    <p v-else-if="!data?.enabled" class="text-sm text-muted">
      {{ $t('El índice está desactivado en este entorno.') }}
    </p>
    <p v-else-if="!groups.length" class="text-sm text-muted">
      {{ $t('Todavía no hay fuentes de conocimiento.') }}
    </p>
    <dl v-else class="divide-y divide-default text-sm">
      <div
        v-for="[type, group] in groups"
        :key="type"
        class="flex justify-between gap-2 py-2"
      >
        <dt>{{ labels[type] ?? type }}</dt>
        <dd class="text-muted">
          {{ group.total }} {{ $t('fuentes ·') }} {{ group.pending }}
          {{ $t('pendientes') }}
        </dd>
      </div>
    </dl>
  </section>
</template>
