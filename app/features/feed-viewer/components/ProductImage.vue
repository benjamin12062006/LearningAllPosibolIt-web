<script setup lang="ts">
import { safeHttpUrl } from '../utils/product-columns';

/**
 * Miniatura de un producto. La dirección viene del TSV, que es de terceros:
 * solo se carga si es `http(s)`, sin enviar de dónde venimos y solo cuando se
 * acerca a la vista. Si falla, queda un marcador en su sitio (sin saltos).
 */
const props = defineProps<{ src: string | undefined; alt: string }>();

const hasFailed = ref(false);
const url = computed(() => safeHttpUrl(props.src));

watch(url, () => {
  hasFailed.value = false;
});
</script>

<template>
  <span
    class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated"
  >
    <img
      v-if="url && !hasFailed"
      :src="url"
      :alt="alt"
      width="40"
      height="40"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      class="size-full object-cover"
      @error="hasFailed = true"
    />
    <UIcon
      v-else
      name="i-lucide-image-off"
      class="size-4 text-dimmed"
      aria-hidden="true"
    />
  </span>
</template>
