<!-- Secciones de un proyecto: cada una es una ruta propia, enlazable. -->
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const props = defineProps<{ projectId: string }>();

const items = computed<NavigationMenuItem[]>(() => {
  const base = `/projects/${props.projectId}`;
  return [
    {
      label: 'Catálogo',
      icon: 'i-lucide-file-spreadsheet',
      to: base,
      exact: true,
    },
    { label: 'Reglas', icon: 'i-lucide-list-checks', to: `${base}/rules` },
  ];
});
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    class="-mx-2.5 border-b border-default"
    :ui="{ link: 'py-2' }"
  />
</template>
