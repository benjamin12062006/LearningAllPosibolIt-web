<script setup lang="ts">
/**
 * Muestra la URL del feed la única vez que la API la entrega (al crear el feed
 * o al rotar el token). Después solo se puede pedir otra.
 */
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{ url: string }>();

const toast = useToast();
const copied = ref(false);

// Cada URL nueva empieza sin copiar.
watch(
  () => props.url,
  () => {
    copied.value = false;
  },
);

/** Al enfocar, todo seleccionado: así se copia a mano si el portapapeles falla. */
function selectAll(event: FocusEvent) {
  if (event.target instanceof HTMLInputElement) event.target.select();
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
  } catch {
    toast.add({
      title: 'No se pudo copiar',
      description: 'Selecciona la URL y cópiala a mano.',
      color: 'warning',
      icon: 'i-lucide-clipboard-x',
    });
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="URL del feed para Merchant Center"
    description="Guárdala ahora: por seguridad no se volverá a mostrar."
    :dismissible="false"
  >
    <template #body>
      <div class="space-y-3">
        <UInput
          :model-value="url"
          readonly
          class="w-full font-mono"
          aria-label="URL del feed"
          @focus="selectAll"
        />
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-key-round"
          title="Quien tenga esta URL puede descargar el catálogo publicado."
          description="Si la pierdes o se filtra, pide una nueva: la anterior dejará de funcionar."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          color="neutral"
          variant="soft"
          @click="copyUrl"
        >
          {{ copied ? 'Copiada' : 'Copiar URL' }}
        </UButton>
        <UButton @click="open = false">Ya la guardé</UButton>
      </div>
    </template>
  </UModal>
</template>
