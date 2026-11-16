<script setup lang="ts">
import { useFeedComparison } from '../composables/useFeedComparison';
import { useProjectFeed } from '../../feeds/composables/useProjectFeed';
import type { TabItem } from '../../../components/ui/Tabs.vue';
import { CHANGE_KIND_LABELS, type ChangeKind } from '../types/feed-viewer';

const { language, t } = useAppLocale();

const route = useRoute();
const projectId = computed(() => String(route.params.id));
const exportId = computed(() => {
  const value = route.query.exportacion;
  return typeof value === 'string' && value !== '' ? value : null;
});

const { feed, status: feedStatus } = useProjectFeed(projectId);
const feedId = computed(() => feed.value?.id ?? null);

const {
  comparison,
  filter,
  page,
  pageHref,
  status,
  error,
  refresh,
  setFilter,
} = useFeedComparison(projectId, feedId, exportId);

const CHANGE_ICONS: Record<ChangeKind, { icon: string; class: string }> = {
  added: { icon: 'i-lucide-plus', class: 'text-success' },
  removed: { icon: 'i-lucide-minus', class: 'text-error' },
  modified: { icon: 'i-lucide-pencil', class: 'text-info' },
};

const isLoading = computed(
  () =>
    feedStatus.value === 'pending' ||
    (status.value === 'pending' && comparison.value === null),
);
const hasNoFeed = computed(
  () => feedStatus.value !== 'pending' && feed.value === null,
);

const tabs = computed<TabItem<ChangeFilter>[]>(() => {
  const counts = comparison.value?.counts;
  const total = counts ? counts.added + counts.removed + counts.modified : 0;
  return [
    { value: 'todos', label: 'Todos', badge: total },
    {
      value: 'added',
      label: t(CHANGE_KIND_LABELS.added),
      badge: counts?.added,
    },
    {
      value: 'removed',
      label: t(CHANGE_KIND_LABELS.removed),
      badge: counts?.removed,
    },
    {
      value: 'modified',
      label: t(CHANGE_KIND_LABELS.modified),
      badge: counts?.modified,
    },
  ];
});

const selectedTab = computed({
  get: () => filter.value,
  set: (next: ChangeFilter) => void setFilter(next),
});

/** Solo se sabe si hay más: la API no da el total de la página filtrada. */
const hasMore = computed(() => comparison.value?.page.hasMore ?? false);

const productsQuery = computed(() => ({ exportacion: exportId.value }));
</script>

<template>
  <WorkspacePage
    id="comparar"
    :title="$t('Comparar con lo publicado')"
    compact-cover
  >
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{ $t('Qué cambiaría en el canal si se publicara esta exportación.') }}
      </p>
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <UEmpty
      v-if="!exportId"
      icon="i-lucide-git-compare-arrows"
      :title="$t('Elige una exportación para comparar')"
      :description="
        $t('Abre la comparación desde la página de una evaluación exportada.')
      "
      :actions="[
        {
          label: 'Ir a evaluaciones',
          to: `/projects/${projectId}/evaluations`,
        },
      ]"
    />

    <div v-else-if="isLoading" class="space-y-3">
      <USkeleton v-for="row in 5" :key="row" class="h-10 w-full" />
    </div>

    <UEmpty
      v-else-if="hasNoFeed"
      icon="i-lucide-rss"
      :title="$t('Este proyecto todavía no tiene feed')"
      :description="$t('Sin nada publicado no hay con qué comparar.')"
      :actions="[{ label: 'Ir al feed', to: `/projects/${projectId}/feed` }]"
    />

    <FeedViewerFailure
      v-else-if="error"
      :project-id="projectId"
      :failure="error"
      @retry="refresh()"
    />

    <template v-else-if="comparison">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountTile
          :label="$t('Añadidos')"
          :count="comparison.counts.added"
          icon="i-lucide-plus"
          icon-class="text-success"
        />
        <CountTile
          :label="$t('Retirados')"
          :count="comparison.counts.removed"
          icon="i-lucide-minus"
          icon-class="text-error"
        />
        <CountTile
          :label="$t('Modificados')"
          :count="comparison.counts.modified"
          icon="i-lucide-pencil"
          icon-class="text-info"
        />
        <CountTile
          :label="$t('Sin cambios')"
          :count="comparison.counts.unchanged"
          icon="i-lucide-equal"
          icon-class="text-muted"
        />
      </div>

      <section
        v-if="comparison.changedFields.length > 0"
        aria-labelledby="campos"
        class="mt-8"
      >
        <h2 id="campos" class="text-lg font-medium text-highlighted">
          {{ $t('Campos que cambian') }}
        </h2>
        <ul class="mt-2 flex flex-wrap gap-2">
          <li
            v-for="field in comparison.changedFields"
            :key="field.field"
            class="rounded-md bg-muted px-2.5 py-1 text-sm"
          >
            <span class="font-mono text-xs">{{ field.field }}</span>
            <span class="ms-1.5 text-muted tabular-nums">
              {{ field.productCount.toLocaleString(language) }}
              {{ $t('productos') }}
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="cambios" class="mt-8">
        <h2 id="cambios" class="sr-only">{{ $t('Cambios por producto') }}</h2>
        <UiTabs
          v-model="selectedTab"
          :items="tabs"
          :label="$t('Tipo de cambio')"
        >
          <template v-for="tab in tabs" :key="tab.value" #[tab.value]>
            <p
              v-if="comparison.changes.length === 0"
              class="text-sm text-muted"
            >
              {{ $t('Ningún producto en este grupo.') }}
            </p>
            <ul v-else class="divide-y divide-default">
              <li
                v-for="change in comparison.changes"
                :key="`${change.change}:${change.id}`"
                class="py-3"
              >
                <p class="flex items-center gap-2 text-sm">
                  <UIcon
                    :name="CHANGE_ICONS[change.change].icon"
                    class="size-4 shrink-0"
                    :class="CHANGE_ICONS[change.change].class"
                  />
                  <span class="font-mono text-xs select-text">
                    {{ change.id }}
                  </span>
                  <span class="text-muted">
                    {{ $t(CHANGE_KIND_LABELS[change.change].slice(0, -1)) }}
                  </span>
                  <!-- Un retirado ya no está en la exportación: no tiene ficha ahí. -->
                  <UButton
                    v-if="change.change !== 'removed'"
                    :to="{
                      path: `/projects/${projectId}/products`,
                      query: { ...productsQuery, producto: change.id },
                    }"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    class="ms-auto"
                  >
                    {{ $t('Ver ficha') }}
                  </UButton>
                </p>
                <div v-if="change.fields.length > 0" class="mt-1 ps-6">
                  <FeedViewerValueChange
                    v-for="field in change.fields"
                    :key="field.field"
                    :label="field.field"
                    :before="field.before"
                    :after="field.after"
                  />
                </div>
              </li>
            </ul>

            <div
              v-if="page > 1 || hasMore"
              class="mt-4 flex justify-center gap-2"
            >
              <UButton
                :to="page > 1 ? pageHref(page - 1) : undefined"
                :disabled="page === 1"
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
              >
                {{ $t('Anteriores') }}
              </UButton>
              <UButton
                :to="hasMore ? pageHref(page + 1) : undefined"
                :disabled="!hasMore"
                trailing-icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
              >
                {{ $t('Siguientes') }}
              </UButton>
            </div>
          </template>
        </UiTabs>
      </section>
    </template>
  </WorkspacePage>
</template>
