<script setup lang="ts">
import type { SchemaOperation } from '../../types/changesets';
import type { WorksheetColumn } from '../../types/worksheets';
import { columnsDependingOn } from '../../utils/draft-overlay';
import {
  columnDraftProblem,
  emptyColumnDraft,
  optionLabels,
} from '../../utils/new-columns';

const props = defineProps<{
  columns: WorksheetColumn[];
  mappedColumns: Set<string>;
}>();
const emit = defineEmits<{ change: [operation: SchemaOperation] }>();
const columnId = ref('');
const draft = ref(emptyColumnDraft());
const action = ref<'add' | 'rename' | 'type' | 'delete'>('add');
const column = computed(() =>
  props.columns.find((item) => item.id === columnId.value),
);
const dependents = computed(() =>
  column.value ? columnsDependingOn(props.columns, column.value.id) : [],
);
const canWrite = computed(() => {
  if (action.value === 'add') return !columnDraftProblem(draft.value);
  if (!column.value) return false;
  if (action.value === 'delete') return dependents.value.length === 0;
  if (action.value === 'rename')
    return (
      !!draft.value.name.trim() && draft.value.name.trim() !== column.value.name
    );
  return (
    column.value.type !== 'calculated' &&
    dependents.value.length === 0 &&
    !columnDraftProblem(draft.value)
  );
});

watch([action, column], () => {
  draft.value = emptyColumnDraft();
  if (action.value !== 'add' && column.value)
    draft.value.name = column.value.name;
  if (
    action.value === 'type' &&
    column.value &&
    column.value.type !== 'calculated'
  ) {
    draft.value.type = column.value.type;
    draft.value.optionsText =
      column.value.options?.map((option) => option.label).join(', ') ?? '';
  }
});

function change() {
  if (!canWrite.value) return;
  const { name, optionsText, type: columnType } = draft.value;
  const options =
    columnType === 'selection'
      ? optionLabels(optionsText).map((label) => ({
          id:
            column.value?.options?.find((option) => option.label === label)
              ?.id ?? crypto.randomUUID(),
          label,
        }))
      : undefined;
  const id = column.value?.id;
  if (action.value === 'add') {
    emit('change', {
      type: 'add_column',
      columnId: crypto.randomUUID(),
      name: name.trim(),
      columnType,
      options,
    });
  } else if (id && action.value === 'rename') {
    emit('change', { type: 'rename_column', columnId: id, name: name.trim() });
  } else if (id && action.value === 'delete') {
    emit('change', { type: 'delete_column', columnId: id });
  } else if (id) {
    emit('change', {
      type: 'change_column_type',
      columnId: id,
      columnType,
      options,
    });
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="change">
    <UFormField :label="$t('Operación')">
      <USelect
        v-model="action"
        :items="[
          { value: 'add', label: 'Añadir' },
          { value: 'rename', label: 'Renombrar' },
          { value: 'type', label: 'Cambiar tipo' },
          { value: 'delete', label: 'Eliminar' },
        ]"
      />
    </UFormField>
    <UFormField v-if="action !== 'add'" :label="$t('Columna')">
      <USelect
        v-model="columnId"
        :items="columns.map((item) => ({ value: item.id, label: item.name }))"
      />
    </UFormField>
    <UFormField
      v-if="action === 'rename' && column"
      :label="$t('Nombre nuevo')"
    >
      <UInput v-model="draft.name" maxlength="120" />
    </UFormField>
    <WorksheetsColumnDraftFields
      v-if="action === 'add' || (action === 'type' && column)"
      v-model="draft"
      :index="0"
      :can-be-required="false"
    />
    <UAlert
      v-if="action !== 'add' && dependents.length"
      color="warning"
      :title="$t('Fórmulas dependientes')"
      :description="dependents.map((item) => item.name).join(', ')"
    />
    <UAlert
      v-if="
        column &&
        mappedColumns.has(column.id) &&
        (action === 'delete' || action === 'type')
      "
      color="warning"
      :title="$t('Esta columna se usa en plantillas de importación.')"
    />
    <UButton type="submit" :disabled="!canWrite">{{
      $t('Añadir al borrador')
    }}</UButton>
  </form>
</template>
