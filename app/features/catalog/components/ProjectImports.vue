<script setup lang="ts">
import {
  useImportSnapshot,
  useProjectImports,
} from '../composables/useProjectImports';
import type { TableColumn } from '@nuxt/ui';
import { ApiFailure } from '../../../services/api-client';
import {
  IMPORT_STATUS_LABELS,
  type CatalogImport,
  type ImportStatus,
  type ImportUpload,
} from '../types/imports';

const { t, formatDate, language } = useAppLocale();

const props = defineProps<{ projectId: string }>();

const STATUS_COLORS: Record<
  ImportStatus,
  'neutral' | 'info' | 'success' | 'error'
> = {
  pending: 'neutral',
  importing: 'info',
  ready: 'success',
  failed: 'error',
};

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');

const { imports, hasMore, status, error, refresh, runningJob, upload, remove } =
  useProjectImports(() => props.projectId);
const toast = useToast();
const route = useRoute();
const selectedId = computed(() =>
  typeof route.query.catalogo === 'string' ? route.query.catalogo : null,
);
const {
  snapshot: selectedCatalog,
  error: selectedError,
  status: selectedStatus,
  refresh: refreshCatalog,
} = useImportSnapshot(() => props.projectId, selectedId);

watch(
  [selectedId, () => selectedCatalog.value?.status],
  ([id, status], previous, onCleanup) => {
    const processing = status === 'pending' || status === 'importing';
    if (id && processing) {
      const deadline = Date.now() + 120_000;
      const timer = setInterval(() => {
        if (Date.now() >= deadline) clearInterval(timer);
        else void refreshCatalog({ dedupe: 'defer' });
      }, 2_000);
      onCleanup(() => clearInterval(timer));
    } else if (
      id &&
      id === previous?.[0] &&
      ['pending', 'importing'].includes(previous[1] ?? '')
    ) {
      void refresh();
    }
  },
);
function closeCatalog() {
  const query = { ...route.query };
  delete query.catalogo;
  return navigateTo({ path: route.path, query, hash: route.hash });
}

// Importación que espera confirmación para borrarse (el modal se abre con ella).
const pendingRemoval = ref<CatalogImport | null>(null);
const isRemoving = ref(false);
const isRemovalOpen = computed({
  get: () => pendingRemoval.value !== null,
  set: (open) => {
    if (!open) pendingRemoval.value = null;
  },
});

const isFirstLoad = computed(
  () => status.value === 'pending' && imports.value.length === 0,
);

// Como en el curso: cada columna dice qué dato lee y, si hace falta, cómo pintarlo.
const columns: TableColumn<CatalogImport>[] = [
  {
    accessorKey: 'originalName',
    header: 'Archivo',
    cell: ({ row }) =>
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate text-default' }, row.original.originalName),
        h(
          'p',
          { class: 'text-xs text-muted' },
          formatBytes(row.original.byteSize),
        ),
      ]),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) =>
      h('div', { class: 'space-y-1' }, [
        h(
          UBadge,
          { color: STATUS_COLORS[row.original.status], variant: 'subtle' },
          () => t(IMPORT_STATUS_LABELS[row.original.status]),
        ),
        row.original.error
          ? h(
              'p',
              { class: 'text-xs text-error' },
              row.original.error.message[language.value],
            )
          : null,
      ]),
  },
  {
    accessorKey: 'rowCount',
    header: 'Filas',
    cell: ({ row }) => rowsLabel(row.original),
  },
  {
    accessorKey: 'createdAt',
    header: t('Fecha'),
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(UButton, {
        icon: 'i-lucide-trash-2',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm',
        'aria-label': `Borrar ${row.original.originalName}`,
        onClick: () => {
          pendingRemoval.value = row.original;
        },
      }),
  },
];

async function uploadCatalog(file: ImportUpload) {
  try {
    const job = await upload(file);
    notifyFinished(job?.status, job?.error?.message[language.value]);
  } catch (failure) {
    notifyError(t('No se importó el catálogo'), failure);
  }
}

async function confirmRemoval() {
  const item = pendingRemoval.value;
  if (!item) return;
  isRemoving.value = true;
  try {
    await remove(item.id);
    toast.add({
      title: t('Importación borrada'),
      color: 'success',
      icon: 'i-lucide-trash-2',
    });
  } catch (failure) {
    notifyError(t('No se borró la importación'), failure);
  } finally {
    isRemoving.value = false;
    pendingRemoval.value = null;
  }
}

/** Sin estado final: la API sigue trabajando y la tabla lo mostrará al refrescar. */
function notifyFinished(jobStatus: string | undefined, apiMessage?: string) {
  if (jobStatus === 'succeeded') {
    toast.add({
      title: t('Catálogo importado'),
      color: 'success',
      icon: 'i-lucide-check',
    });
    return;
  }
  if (jobStatus === 'failed') {
    toast.add({
      title: t('La importación falló'),
      description: apiMessage,
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
    return;
  }
  toast.add({
    title: t('Sigue importándose'),
    description: 'Actualiza la lista en un momento.',
    icon: 'i-lucide-hourglass',
  });
}

function notifyError(title: string, failure: unknown) {
  const description =
    failure instanceof ApiFailure ? failure.message : t('Inténtalo de nuevo.');
  toast.add({
    title,
    description,
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}

function rowsLabel(item: CatalogImport) {
  if (item.rowCount !== null)
    return item.rowCount.toLocaleString(language.value);
  if (item.job)
    return `${item.job.processedRows.toLocaleString(language.value)}…`;
  return '—';
}
</script>

<template>
  <section aria-labelledby="importaciones">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2
        id="importaciones"
        data-assistant-route-anchor
        class="text-lg font-medium text-highlighted"
      >
        {{ $t('Importaciones') }}
      </h2>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="$t('Actualizar importaciones')"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <UCard
      v-if="selectedId"
      id="catalogo-activo"
      class="my-4 border border-ai"
      variant="subtle"
    >
      <template #header>
        <div class="flex items-start justify-between gap-2">
          <h3 data-assistant-route-anchor class="text-sm font-semibold">
            {{
              selectedCatalog?.originalName ?? $t('Importación del catálogo')
            }}
          </h3>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-x"
            :aria-label="$t('Cerrar detalle de catálogo')"
            @click="closeCatalog"
          />
        </div>
      </template>
      <USkeleton v-if="selectedStatus === 'pending'" class="h-10" />
      <UAlert
        v-else-if="selectedError"
        variant="subtle"
        color="error"
        :title="selectedError.message"
      />
      <div v-else-if="selectedCatalog" class="space-y-3">
        <UBadge variant="subtle" :color="STATUS_COLORS[selectedCatalog.status]">
          {{ $t(IMPORT_STATUS_LABELS[selectedCatalog.status]) }}
        </UBadge>
        <ul
          v-if="selectedCatalog.headers?.length"
          :aria-label="$t('Columnas del catálogo')"
          class="flex flex-wrap gap-1.5"
        >
          <li v-for="header in selectedCatalog.headers" :key="header">
            <UBadge variant="soft" color="neutral">{{ header }}</UBadge>
          </li>
        </ul>
      </div>
    </UCard>

    <ImportUploadForm :upload="uploadCatalog" />

    <UAlert
      v-if="runningJob"
      class="mt-4"
      color="info"
      variant="subtle"
      icon="i-lucide-loader-circle"
      :title="$t('Importando el catálogo…')"
      :description="
        $t('{0} filas procesadas.', [
          runningJob.processedRows.toLocaleString(language),
        ])
      "
      role="status"
    />

    <div v-if="isFirstLoad" class="mt-6 space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-6"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <UEmpty
      v-else-if="imports.length === 0"
      class="mt-6"
      icon="i-lucide-file-spreadsheet"
      :title="$t('Sin importaciones')"
      :description="$t('Sube el CSV de tu catálogo para empezar.')"
    />

    <template v-else>
      <UTable
        :data="imports"
        :columns="columns"
        class="mt-6"
        :meta="{
          class: {
            tr: (row) => (row.original.id === selectedId ? 'bg-ai-wash' : ''),
          },
        }"
      />
      <p v-if="hasMore" class="mt-3 text-sm text-muted">
        {{ $t('Se muestran las 20 importaciones más recientes.') }}
      </p>
    </template>

    <UModal
      v-model:open="isRemovalOpen"
      :title="$t('¿Borrar esta importación?')"
      :description="
        $t('«{0}» y su archivo se borrarán.', [
          pendingRemoval?.originalName ?? '',
        ])
      "
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRemovalOpen = false"
          >
            {{ $t('Cancelar') }}
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isRemoving"
            @click="confirmRemoval"
          >
            {{ $t('Borrar') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
