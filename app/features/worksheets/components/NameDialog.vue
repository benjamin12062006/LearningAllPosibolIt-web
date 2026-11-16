<script setup lang="ts">
import { WORKSHEET_LIMITS } from '../types/worksheets';

/** Pedir un nombre: crear, renombrar o duplicar un libro o una hoja. */
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    initialName?: string;
    submitLabel: string;
    isSaving: boolean;
  }>(),
  { initialName: '', description: undefined },
);

const emit = defineEmits<{ submit: [name: string] }>();
const open = defineModel<boolean>('open', { required: true });

const name = ref(props.initialName);
const trimmedName = computed(() => name.value.trim());

watch(open, (isOpen) => {
  if (isOpen) name.value = props.initialName;
});

function submit() {
  if (trimmedName.value !== '') emit('submit', trimmedName.value);
}
</script>

<template>
  <UiDialog v-model:open="open" :title="title" :description="description">
    <form id="name-dialog" @submit.prevent="submit">
      <UFormField :label="$t('Nombre')" required>
        <UInput
          v-model="name"
          autofocus
          :maxlength="WORKSHEET_LIMITS.nameLength"
          class="w-full"
          :ui="{ base: 'pointer-coarse:text-base' }"
        />
      </UFormField>
    </form>
    <template #footer>
      <UButton color="neutral" variant="ghost" @click="open = false">
        {{ $t('Cancelar') }}
      </UButton>
      <UButton
        type="submit"
        form="name-dialog"
        :loading="isSaving"
        :disabled="trimmedName === ''"
      >
        {{ submitLabel }}
      </UButton>
    </template>
  </UiDialog>
</template>
