<script setup lang="ts">
import { COLUMN_TYPE_LABELS, WORKSHEET_LIMITS } from '../types/worksheets';
import { ADDABLE_COLUMN_TYPES, type ColumnDraft } from '../utils/new-columns';

const { t } = useAppLocale();

/** Los campos de una columna nueva: nombre, tipo, opciones y si es obligatoria. */
withDefaults(defineProps<{ index: number; canBeRequired?: boolean }>(), {
  canBeRequired: true,
});

const draft = defineModel<ColumnDraft>({ required: true });

const typeItems = ADDABLE_COLUMN_TYPES.map((type) => ({
  value: type,
  label: t(COLUMN_TYPE_LABELS[type]),
}));

function update(change: Partial<ColumnDraft>) {
  draft.value = { ...draft.value, ...change };
}
</script>

<template>
  <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
    <UInput
      :model-value="draft.name"
      :aria-label="$t('Nombre de la columna {0}', [index + 1])"
      :placeholder="$t('Nombre de la columna')"
      :maxlength="WORKSHEET_LIMITS.nameLength"
      :ui="{ base: 'pointer-coarse:text-base' }"
      @update:model-value="(name) => update({ name: String(name) })"
    />
    <USelect
      :model-value="draft.type"
      :items="typeItems"
      :aria-label="$t('Tipo de la columna {0}', [index + 1])"
      @update:model-value="(type) => update({ type })"
    />
    <UInput
      v-if="draft.type === 'selection'"
      :model-value="draft.optionsText"
      class="sm:col-span-2"
      :aria-label="$t('Opciones de la columna {0}', [index + 1])"
      :placeholder="$t('Opciones separadas por comas: Rojo, Azul, Verde')"
      :ui="{ base: 'pointer-coarse:text-base' }"
      @update:model-value="
        (optionsText) => update({ optionsText: String(optionsText) })
      "
    />
    <UCheckbox
      v-if="canBeRequired"
      :model-value="draft.required"
      class="sm:col-span-2"
      :label="
        $t('Obligatoria: una fila sin este valor se marca como incompleta')
      "
      @update:model-value="
        (required) => update({ required: required === true })
      "
    />
  </div>
</template>
