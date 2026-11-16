<script setup lang="ts">
/**
 * Muestra un enlace secreto la única vez que la API lo entrega (URL del feed,
 * invitación). Después solo se puede pedir otro: por eso no se cierra al hacer
 * clic fuera y ofrece copiarlo.
 */
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  url: string;
  title: string;
  /** Quién puede usar el enlace y qué hacer si se pierde. */
  warningTitle: string;
  warningDescription: string;
}>();

/** Al enfocar, todo seleccionado: así se copia a mano si el portapapeles falla. */
function selectAll(event: FocusEvent) {
  if (event.target instanceof HTMLInputElement) event.target.select();
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="$t('Guárdalo ahora: por seguridad no se volverá a mostrar.')"
    :dismissible="false"
  >
    <template #body>
      <div class="space-y-3">
        <UInput
          :model-value="url"
          readonly
          class="w-full font-mono"
          :aria-label="title"
          @focus="selectAll"
        />
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-key-round"
          :title="warningTitle"
          :description="warningDescription"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UiCopyButton :text="props.url" :label="$t('Copiar enlace')" />
        <UButton @click="open = false">{{ $t('Ya lo guardé') }}</UButton>
      </div>
    </template>
  </UModal>
</template>
