<script setup lang="ts">
import { useFeedVersions } from '../composables/useFeedVersions';
import { useProjectFeed } from '../composables/useProjectFeed';
import type { TableColumn } from '@nuxt/ui';
import { ApiFailure } from '../../../services/api-client';
import { PUBLISHED_BY_LABELS, type FeedVersion } from '../types/feeds';

const { t, formatDateTime, language } = useAppLocale();

/**
 * Historial del feed. Una versión anterior que conserva su exportación se
 * puede volver a publicar (la API lo permite: es la vuelta atrás); como cambia
 * lo que descarga Merchant Center, se confirma.
 */
const props = defineProps<{ projectId: string; feedId: string }>();

const toast = useToast();
const { publish } = useProjectFeed(() => props.projectId);
const { versions, page, hasMore, status, error, refresh, setPage } =
  useFeedVersions(
    () => props.projectId,
    () => props.feedId,
  );

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');

const pendingVersion = ref<FeedVersion | null>(null);
const isPublishing = ref(false);
const isConfirmOpen = computed({
  get: () => pendingVersion.value !== null,
  set: (open) => {
    if (!open) pendingVersion.value = null;
  },
});

const isFirstLoad = computed(
  () => status.value === 'pending' && versions.value.length === 0,
);

const columns: TableColumn<FeedVersion>[] = [
  {
    accessorKey: 'publishedAt',
    header: 'Publicada',
    cell: ({ row }) => formatDateTime(row.original.publishedAt),
  },
  {
    accessorKey: 'rowCount',
    header: t('Productos'),
    cell: ({ row }) => row.original.rowCount.toLocaleString(language.value),
  },
  {
    accessorKey: 'publishedBy',
    header: t('Cómo'),
    cell: ({ row }) => t(PUBLISHED_BY_LABELS[row.original.publishedBy]),
  },
  {
    id: 'products',
    cell: ({ row }) => {
      // Sin archivo (la retención lo retiró) no hay productos que enseñar.
      if (!row.original.fileRetained) {
        return h('span', { class: 'text-xs text-dimmed' }, 'Archivo retirado');
      }
      return h(UButton, {
        label: t('Ver productos'),
        icon: 'i-lucide-package-search',
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        to: {
          path: `/projects/${props.projectId}/products`,
          query: { feed: props.feedId, version: row.original.id },
        },
      });
    },
  },
  {
    id: 'state',
    cell: ({ row }) => {
      if (row.original.current) {
        return h(
          UBadge,
          { color: 'success', variant: 'subtle' },
          () => 'Vigente',
        );
      }
      if (canRepublish(row.original)) {
        return h(UButton, {
          label: 'Volver a publicar',
          icon: 'i-lucide-undo-2',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => {
            pendingVersion.value = row.original;
          },
        });
      }
      return h('span', { class: 'text-xs text-dimmed' }, t('Sin exportación'));
    },
  },
];

/** Necesita la exportación de la que salió; si se borró su importación, ya no está. */
function canRepublish(version: FeedVersion) {
  return !version.current && version.exportId !== null;
}

async function confirmRepublish() {
  const exportId = pendingVersion.value?.exportId;
  if (!exportId) return;
  isPublishing.value = true;
  try {
    await publish(exportId);
    await refresh();
    toast.add({
      title: t('Versión publicada de nuevo'),
      color: 'success',
      icon: 'i-lucide-rss',
    });
  } catch (failure) {
    toast.add({
      title: t('No se publicó'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isPublishing.value = false;
    pendingVersion.value = null;
  }
}
</script>

<template>
  <section aria-labelledby="versiones">
    <h2 id="versiones" class="text-lg font-medium text-highlighted">
      {{ $t('Historial') }}
    </h2>

    <div v-if="isFirstLoad" class="mt-3 space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-3"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <p v-else-if="versions.length === 0" class="mt-2 text-sm text-muted">
      {{ $t('Sin versiones todavía.') }}
    </p>

    <template v-else>
      <UTable :data="versions" :columns="columns" class="mt-2" />
      <div v-if="page > 1 || hasMore" class="mt-3 flex justify-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          :disabled="page === 1"
          @click="setPage(page - 1)"
        >
          {{ $t('Más recientes') }}
        </UButton>
        <UButton
          trailing-icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          :disabled="!hasMore"
          @click="setPage(page + 1)"
        >
          {{ $t('Anteriores') }}
        </UButton>
      </div>
    </template>

    <UModal
      v-model:open="isConfirmOpen"
      :title="$t('¿Volver a publicar esta versión?')"
      :description="
        $t(
          'Merchant Center pasará a descargar los {0} productos de esa versión.',
          [pendingVersion?.rowCount.toLocaleString(language) ?? ''],
        )
      "
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isConfirmOpen = false"
          >
            {{ $t('Cancelar') }}
          </UButton>
          <UButton :loading="isPublishing" @click="confirmRepublish">
            {{ $t('Publicar') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
