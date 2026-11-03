<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { ApiFailure } from '../services/api-client';
import {
  IMPORT_STATUS_LABELS,
  type CatalogImport,
  type ImportStatus,
  type ImportUpload,
} from '../types/imports';

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
          () => IMPORT_STATUS_LABELS[row.original.status],
        ),
        row.original.error
          ? h(
              'p',
              { class: 'text-xs text-error' },
              row.original.error.message.es,
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
    header: 'Fecha',
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
    notifyFinished(job?.status, job?.error?.message.es);
  } catch (failure) {
    notifyError('No se importó el catálogo', failure);
  }
}

async function confirmRemoval() {
  const item = pendingRemoval.value;
  if (!item) return;
  isRemoving.value = true;
  try {
    await remove(item.id);
    toast.add({
      title: 'Importación borrada',
      color: 'success',
      icon: 'i-lucide-trash-2',
    });
  } catch (failure) {
    notifyError('No se borró la importación', failure);
  } finally {
    isRemoving.value = false;
    pendingRemoval.value = null;
  }
}

/** Sin estado final: la API sigue trabajando y la tabla lo mostrará al refrescar. */
function notifyFinished(jobStatus: string | undefined, apiMessage?: string) {
  if (jobStatus === 'succeeded') {
    toast.add({
      title: 'Catálogo importado',
      color: 'success',
      icon: 'i-lucide-check',
    });
    return;
  }
  if (jobStatus === 'failed') {
    toast.add({
      title: 'La importación falló',
      description: apiMessage,
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
    return;
  }
  toast.add({
    title: 'Sigue importándose',
    description: 'Actualiza la lista en un momento.',
    icon: 'i-lucide-hourglass',
  });
}

function notifyError(title: string, failure: unknown) {
  const description =
    failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.';
  toast.add({
    title,
    description,
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}

function rowsLabel(item: CatalogImport) {
  if (item.rowCount !== null) return item.rowCount.toLocaleString('es');
  if (item.job) return `${item.job.processedRows.toLocaleString('es')}…`;
  return '—';
}
</script>

<template>
  <section aria-labelledby="importaciones">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 id="importaciones" class="text-lg font-medium text-highlighted">
        Importaciones
      </h2>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Actualizar importaciones"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <ImportUploadForm :upload="uploadCatalog" />

    <UAlert
      v-if="runningJob"
      class="mt-4"
      color="info"
      variant="subtle"
      icon="i-lucide-loader-circle"
      title="Importando el catálogo…"
      :description="`${runningJob.processedRows.toLocaleString('es')} filas procesadas.`"
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
      title="Sin importaciones"
      description="Sube el CSV de tu catálogo para empezar."
    />

    <template v-else>
      <UTable :data="imports" :columns="columns" class="mt-6" />
      <p v-if="hasMore" class="mt-3 text-sm text-muted">
        Se muestran las 20 importaciones más recientes.
      </p>
    </template>

    <UModal
      v-model:open="isRemovalOpen"
      title="¿Borrar esta importación?"
      :description="`«${pendingRemoval?.originalName ?? ''}» y su archivo se borrarán.`"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRemovalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isRemoving"
            @click="confirmRemoval"
          >
            Borrar
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
