<!-- Conteo grande con su nombre, con el aspecto de las tarjetas resumen del lateral. -->
<script setup lang="ts">
const { language } = useAppLocale();

defineProps<{
  label: string;
  count: number;
  icon: string;
  iconClass: string;
}>();
</script>

<template>
  <div class="rounded-lg bg-elevated/50 p-3 ring-1 ring-default">
    <div class="flex items-start justify-between">
      <UIcon :name="icon" class="size-4" :class="iconClass" />
      <span class="text-2xl font-light text-highlighted tabular-nums">{{
        count.toLocaleString(language)
      }}</span>
    </div>
    <p class="mt-2 text-sm text-muted">{{ label }}</p>
  </div>
</template>
