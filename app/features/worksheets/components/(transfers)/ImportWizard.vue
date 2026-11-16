<script setup lang="ts">
import type { ProjectScope } from '../../../projects/types/project-scope';
import { FileUpload } from '@ark-ui/vue/file-upload';
import { Steps } from '@ark-ui/vue/steps';
import type { PreviewOptions } from '../../services/worksheet-transfers';
import type {
  ColumnMapping,
  CsvDelimiter,
  FileOptions,
  ImportMode,
  ImportPreview,
  MappingTemplate,
} from '../../types/worksheet-transfers';
import type { WorksheetColumn } from '../../types/worksheets';

const { t } = useAppLocale();


const props = defineProps<{
  scope: ProjectScope;
  worksheetId: string;
  columns: WorksheetColumn[];
}>();
const emit = defineEmits<{ imported: [id: string] }>();
const { $worksheetTransfers } = useNuxtApp();
const { run, isRunning } = useAction();
const file = shallowRef<File>();
const rejectedFile = ref(false);
const supportedFiles = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
};
const preview = shallowRef<ImportPreview>();
const step = ref(0);
const delimiter = ref<CsvDelimiter>('comma');
const sheet = ref('');
const headerRow = ref(1);
const NO_TEMPLATE = 'none';
const OMIT_COLUMN = 'omit';
const NEW_COLUMN = 'new';
const mappingId = ref(NO_TEMPLATE);
const mappingName = ref('');
const mapping = ref<Record<string, string>>({});
const mode = ref<ImportMode>('append');
const matchColumnId = ref('');
const decimalSeparator = ref<'.' | ','>('.');
const excludedRows = ref('');
const templatesQuery = { limit: 50, offset: 0 };
const { data: templates, refresh: refreshTemplates } = useAsyncData(
  () => `import-templates:${props.scope.projectId}:${props.worksheetId}`,
  () =>
    $worksheetTransfers.importMappings(
      props.scope,
      props.worksheetId,
      templatesQuery,
    ),
  { server: false },
);
const writableColumns = computed(() =>
  props.columns.filter((column) => column.type !== 'calculated'),
);
const isWorkbook = computed(
  () => file.value?.name.toLowerCase().endsWith('.xlsx') ?? false,
);
const storedMapping = computed(() =>
  templates.value?.items.find((item) => item.id === mappingId.value),
);
const columnsById = computed(
  () => new Map(writableColumns.value.map((column) => [column.id, column])),
);
const missing = computed(() => {
  const stored = storedMapping.value;
  if (!stored || !preview.value) return [];
  return stored.mapping.columns.flatMap((entry) => {
    const hasHeader = preview.value?.headers.includes(entry.header);
    const hasColumn =
      !('columnId' in entry) || columnsById.value.has(entry.columnId);
    return hasHeader && hasColumn ? [] : [entry.header];
  });
});
const canImport = computed(() => {
  if (!preview.value?.headers.length || missing.value.length > 0) return false;
  if (storedMapping.value) {
    const stored = storedMapping.value.mapping;
    return (
      stored.mode !== 'upsert' ||
      (!!stored.matchColumnId && columnsById.value.has(stored.matchColumnId))
    );
  }
  const entries = mappings();
  const destinations = Object.values(mapping.value).filter(
    (destination) =>
      destination && destination !== NEW_COLUMN && destination !== OMIT_COLUMN,
  );
  const hasUniqueDestinations =
    new Set(destinations).size === destinations.length;
  return (
    entries.length > 0 &&
    hasUniqueDestinations &&
    (mode.value !== 'upsert' || destinations.includes(matchColumnId.value))
  );
});
const exclusionNumbers = computed(() =>
  excludedRows.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number),
);
const hasValidExclusions = computed(() =>
  exclusionNumbers.value.every(
    (row) =>
      Number.isInteger(row) && row > 0 && row <= (preview.value?.rows ?? 0),
  ),
);

function selectFile(files: File[]) {
  rejectedFile.value = false;
  file.value = files[0];
  sheet.value = '';
  headerRow.value = 1;
  preview.value = undefined;
  step.value = 0;
}

function previewOptions(): PreviewOptions {
  const template =
    mappingId.value === NO_TEMPLATE ? undefined : mappingId.value;
  if (isWorkbook.value)
    return {
      sheet: sheet.value || undefined,
      headerRow: headerRow.value,
      mappingId: template,
    };
  return { delimiter: delimiter.value, mappingId: template };
}

async function readPreview() {
  const current = file.value;
  if (!current) return;
  const next = await run(t('No se pudo leer el archivo'), () =>
    $worksheetTransfers.previewImport(
      props.scope,
      props.worksheetId,
      current,
      previewOptions(),
    ),
  );
  if (!next || current !== file.value) return;
  preview.value = next;
  sheet.value = next.sheet ?? sheet.value;
  mapping.value = Object.fromEntries(
    next.suggestedColumns
      .filter((entry) => columnsById.value.has(entry.columnId))
      .map((entry) => [entry.header, entry.columnId]),
  );
  step.value = 1;
}

function mappings() {
  const entries: ColumnMapping[] = [];
  for (const header of preview.value?.headers ?? []) {
    const destination = mapping.value[header];
    if (!destination || destination === OMIT_COLUMN) continue;
    if (destination === NEW_COLUMN)
      entries.push({ header, newColumn: { name: header, type: 'text' } });
    else entries.push({ header, columnId: destination });
  }
  return entries;
}

function template(): MappingTemplate {
  return {
    mode: mode.value,
    matchColumnId: mode.value === 'upsert' ? matchColumnId.value : null,
    decimalSeparator: decimalSeparator.value,
    booleanLabels: { true: ['sí', 'true', '1'], false: ['no', 'false', '0'] },
    columns: mappings(),
  };
}

async function saveMapping() {
  const name = mappingName.value.trim();
  if (!name || !canImport.value || storedMapping.value) return;
  const saved = await run(t('No se guardó la plantilla'), () =>
    $worksheetTransfers.createImportMapping(
      props.scope,
      props.worksheetId,
      name,
      template(),
    ),
  );
  if (saved) {
    mappingName.value = '';
    await refreshTemplates();
  }
}

async function deleteMapping() {
  const stored = storedMapping.value;
  if (!stored) return;
  const deleted = await run(t('No se eliminó la plantilla'), async () => {
    await $worksheetTransfers.deleteImportMapping(props.scope, stored.id);
    return true;
  });
  if (deleted) {
    mappingId.value = NO_TEMPLATE;
    await refreshTemplates();
    await readPreview();
  }
}

async function importFile() {
  const current = file.value;
  if (!current || !canImport.value || !hasValidExclusions.value) return;
  const { mappingId: templateId, ...options } = previewOptions();
  const fileOptions: FileOptions = {
    ...options,
    excludeRows: [...new Set(exclusionNumbers.value)],
  };
  const body = templateId ? fileOptions : { ...fileOptions, ...template() };
  const result = await run(t('No se creó el borrador de importación'), () =>
    $worksheetTransfers.createImport(
      props.scope,
      props.worksheetId,
      current,
      body,
      templateId,
    ),
  );
  if (result) emit('imported', result.changeset.id);
}
</script>

<template>
  <Steps.Root :step="step" :count="3" class="space-y-4">
    <Steps.List class="grid grid-cols-3 gap-1">
      <Steps.Item
        v-for="(label, index) in ['Archivo', 'Vista previa', 'Mapeo']"
        :key="label"
        :index="index"
        class="border-b-2 border-default pb-2 text-xs data-[current]:border-primary data-[current]:font-semibold"
      >
        {{ label }}
      </Steps.Item>
    </Steps.List>
    <Steps.Content :index="0" class="space-y-3">
      <FileUpload.Root
        :accept="supportedFiles"
        :max-files="1"
        @file-accept="({ files }) => selectFile(files)"
        @file-reject="rejectedFile = true"
      >
        <FileUpload.HiddenInput />
        <FileUpload.Trigger as-child>
          <UButton type="button" icon="i-lucide-file-up" variant="soft">{{
            $t('Elegir CSV o XLSX')
          }}</UButton>
        </FileUpload.Trigger>
      </FileUpload.Root>
      <UAlert
        v-if="rejectedFile"
        color="warning"
        :title="$t('Elige un archivo CSV o XLSX.')"
      />
      <p v-if="file" class="break-all text-sm">{{ file.name }}</p>
      <UFormField v-if="file && !isWorkbook" :label="$t('Separador CSV')">
        <USelect
          v-model="delimiter"
          :items="[
            { label: 'Coma', value: 'comma' },
            { label: 'Punto y coma', value: 'semicolon' },
          ]"
        />
      </UFormField>
      <UFormField v-if="isWorkbook" :label="$t('Fila de cabecera')">
        <UInput v-model.number="headerRow" type="number" :min="1" />
      </UFormField>
      <UButton
        type="button"
        :disabled="!file"
        :loading="isRunning"
        @click="readPreview"
        >{{ $t('Ver muestra') }}</UButton
      >
    </Steps.Content>
    <Steps.Content :index="1" class="space-y-3">
      <UFormField
        v-if="preview?.sheets?.length"
        :label="$t('Hoja del archivo')"
      >
        <USelect
          :model-value="sheet"
          :items="preview.sheets"
          :disabled="isRunning"
          @update:model-value="
            (value) => {
              sheet = value;
              readPreview();
            }
          "
        />
      </UFormField>
      <UFormField :label="$t('Plantilla de mapeo')">
        <USelect
          :model-value="mappingId"
          :items="[
            { value: NO_TEMPLATE, label: 'Configurar mapeo' },
            ...(templates?.items.map((item) => ({
              value: item.id,
              label: item.name,
            })) ?? []),
          ]"
          :disabled="isRunning"
          @update:model-value="
            (value) => {
              mappingId = value;
              readPreview();
            }
          "
        />
      </UFormField>
      <p v-if="preview?.headers.length" class="text-sm">
        {{ preview.rows }} {{ $t('filas en el archivo') }}
      </p>
      <p v-else class="text-sm text-muted">
        {{ $t('Selecciona una hoja con cabeceras para continuar.') }}
      </p>
      <div v-if="preview?.headers.length" class="max-h-56 overflow-auto">
        <table class="w-full divide-y divide-default text-left text-xs">
          <thead>
            <tr>
              <th
                v-for="header in preview.headers"
                :key="header"
                class="px-2 py-1"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in preview.sample" :key="index">
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="px-2 py-1"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <UAlert
        v-if="missing.length"
        color="warning"
        :title="$t('La plantilla tiene cabeceras o columnas que faltan')"
        :description="missing.join(', ')"
      />
      <div class="flex flex-wrap gap-2">
        <UButton type="button" variant="ghost" @click="step = 0">{{
          $t('Volver')
        }}</UButton>
        <UButton
          type="button"
          :disabled="
            isRunning || !preview?.headers.length || missing.length > 0
          "
          @click="step = 2"
          >{{ $t('Revisar mapeo') }}</UButton
        >
        <UButton
          v-if="storedMapping"
          type="button"
          color="error"
          variant="ghost"
          :loading="isRunning"
          @click="deleteMapping"
          >{{ $t('Eliminar plantilla') }}</UButton
        >
      </div>
    </Steps.Content>
    <Steps.Content :index="2" class="space-y-3">
      <p v-if="storedMapping" class="text-sm">
        {{ $t('Plantilla') }} {{ storedMapping.name }} ·
        {{
          storedMapping.mapping.mode === 'append'
            ? $t('Añadir filas')
            : $t('Actualizar o añadir filas')
        }}
      </p>
      <template v-else>
        <UFormField
          v-for="header in preview?.headers ?? []"
          :key="header"
          :label="header"
        >
          <USelect
            v-model="mapping[header]"
            :items="[
              { value: OMIT_COLUMN, label: 'Omitir' },
              { value: NEW_COLUMN, label: 'Nueva columna de texto' },
              ...writableColumns.map((column) => ({
                value: column.id,
                label: column.name,
              })),
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('Modo')">
          <USelect
            v-model="mode"
            :items="[
              { value: 'append', label: 'Añadir filas' },
              { value: 'upsert', label: 'Actualizar o añadir filas' },
            ]"
          />
        </UFormField>
        <UFormField v-if="mode === 'upsert'" :label="$t('Columna clave')">
          <USelect
            v-model="matchColumnId"
            :items="
              writableColumns
                .filter((column) => Object.values(mapping).includes(column.id))
                .map((column) => ({ value: column.id, label: column.name }))
            "
          />
        </UFormField>
        <UFormField :label="$t('Separador decimal')">
          <USelect
            v-model="decimalSeparator"
            :items="[
              { value: '.', label: 'Punto' },
              { value: ',', label: 'Coma' },
            ]"
          />
        </UFormField>
        <UFormField :label="$t('Nombre para guardar el mapeo como plantilla')">
          <div class="flex flex-wrap gap-2">
            <UInput v-model="mappingName" maxlength="120" />
            <UButton
              type="button"
              variant="soft"
              :disabled="!mappingName.trim() || !canImport"
              :loading="isRunning"
              @click="saveMapping"
              >{{ $t('Guardar plantilla') }}</UButton
            >
          </div>
        </UFormField>
      </template>
      <UFormField
        :label="$t('Filas a excluir')"
        hint="Números separados por comas"
        :error="
          hasValidExclusions ? undefined : 'Usa números de fila del archivo.'
        "
      >
        <UInput v-model="excludedRows" placeholder="2, 8" />
      </UFormField>
      <p v-if="!canImport" class="text-sm text-warning">
        {{
          $t(
            'Asigna al menos una columna, evita repetir destinos y elige una clave si vas a actualizar filas.',
          )
        }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton type="button" variant="ghost" @click="step = 1">{{
          $t('Volver')
        }}</UButton>
        <UButton
          type="button"
          :disabled="!canImport || !hasValidExclusions"
          :loading="isRunning"
          @click="importFile"
          >{{ $t('Crear borrador') }}</UButton
        >
      </div>
    </Steps.Content>
  </Steps.Root>
</template>
