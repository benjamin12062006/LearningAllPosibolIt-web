<!-- Tarjeta pequeña del lateral con icono, contador y nombre («All», «Inbox»). -->
<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
  to: RouteLocationRaw;
  icon: string;
  label: string;
  count: number;
}>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="rounded-lg bg-accented/70 p-2.5 ring-1 ring-white/5 transition-colors hover:bg-accented"
  >
    <div class="flex items-start justify-between text-muted">
      <UIcon :name="icon" class="size-4" />
      <span class="text-sm tabular-nums">{{ count }}</span>
    </div>
    <p class="mt-2 truncate text-sm text-default">{{ label }}</p>
  </NuxtLink>
</template>
