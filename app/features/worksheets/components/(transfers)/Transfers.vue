<script setup lang="ts">
import type { ProjectScope } from '../../../projects/types/project-scope';
import type {
  CsvDelimiter,
  TransferFormat,
} from '../../types/worksheet-transfers';
import type { RowQuery, Worksheet } from '../../types/worksheets';
import { saveBlob } from '../../../../utils/download';

const { t } = useAppLocale();

const props = defineProps<{
  scope: ProjectScope;
  worksheet: Worksheet;
  revisionId: string;
  query: RowQuery;
  canExport: boolean;
  canPublish: boolean;
}>();
const emit = defineEmits<{ exported: [] }>();
const { $worksheetTransfers } = useNuxtApp();
const { isRunning, run } = useAction();
const toast = useToast();
const format = ref<TransferFormat>('csv');
const delimiter = ref<CsvDelimiter>('comma');
const idColumnId = ref('');
const exportId = ref('');
const exportFilename = ref('');
const availableColumns = computed(() =>
  props.worksheet.columns.filter(
    (column) => !props.query.columns || props.query.columns.includes(column.id),
  ),
);

async function createExport() {
  const selectedFormat = format.value;
  const record = await run(t('No se preparó la exportación'), () =>
    $worksheetTransfers.createExport(props.scope, props.worksheet.id, {
      ...props.query,
      revisionId: props.revisionId,
      format: selectedFormat,
      delimiter: selectedFormat === 'csv' ? delimiter.value : undefined,
      formulas: selectedFormat === 'csv' ? 'escape' : undefined,
    }),
  );
  if (!record) return;
  exportId.value = record.id;
  exportFilename.value = `${props.worksheet.name}-r${record.revisionSequence}.${record.format}`;
  emit('exported');
}

async function download() {
  const blob = await run(t('No se descargó el archivo'), () =>
    $worksheetTransfers.downloadExport(props.scope, exportId.value),
  );
  if (blob) saveBlob(blob, exportFilename.value);
}

async function sendToCatalog() {
  if (!idColumnId.value) return;
  const result = await run(t('No se llevó la hoja al catálogo'), () =>
    $worksheetTransfers.createCatalogSnapshot(props.scope, props.worksheet.id, {
      ...props.query,
      revisionId: props.revisionId,
      idColumnId: idColumnId.value,
    }),
  );
  if (result)
    toast.add({
      title: t('Importación de catálogo creada'),
      description: t('Abre el catálogo del proyecto para seguirla.'),
      color: 'success',
    });
}
</script>

<template>
  <div class="space-y-6">
    <section v-if="canExport" class="space-y-3">
      <h3 class="font-medium">{{ $t('Exportar la revisión') }}</h3>
      <p class="text-sm text-muted">
        {{ $t('Se usa la revisión oficial y la vista que tienes abierta.') }}
      </p>
      <UFormField :label="$t('Formato')">
        <USelect
          v-model="format"
          :items="[
            { value: 'csv', label: 'CSV' },
            { value: 'xlsx', label: 'Excel (XLSX)' },
          ]"
        />
      </UFormField>
      <UFormField v-if="format === 'csv'" :label="$t('Separador')">
        <USelect
          v-model="delimiter"
          :items="[
            { value: 'comma', label: 'Coma' },
            { value: 'semicolon', label: 'Punto y coma' },
          ]"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton :loading="isRunning" @click="createExport">{{
          $t('Preparar archivo')
        }}</UButton>
        <UButton
          v-if="exportId"
          icon="i-lucide-download"
          variant="soft"
          :loading="isRunning"
          @click="download"
          >{{ $t('Descargar archivo') }}</UButton
        >
      </div>
    </section>
    <section v-if="canPublish" class="space-y-3 border-t border-default pt-4">
      <h3 class="font-medium">{{ $t('Llevar al catálogo') }}</h3>
      <UFormField :label="$t('Identificador del producto')">
        <USelect
          v-model="idColumnId"
          :items="
            availableColumns.map((column) => ({
              label: column.name,
              value: column.id,
            }))
          "
          class="w-full"
        />
      </UFormField>
      <UButton
        :disabled="!idColumnId"
        :loading="isRunning"
        @click="sendToCatalog"
        >{{ $t('Crear importación de catálogo') }}</UButton
      >
      <UButton :to="`/projects/${scope.projectId}`" variant="ghost">{{
        $t('Abrir catálogo')
      }}</UButton>
    </section>
  </div>
</template>
