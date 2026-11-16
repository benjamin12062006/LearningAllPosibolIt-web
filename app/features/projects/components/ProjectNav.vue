<!-- Secciones de un proyecto, en el orden del recorrido: cada una es una ruta. -->
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const { t } = useAppLocale();

const props = defineProps<{ projectId: string }>();

const items = computed<NavigationMenuItem[]>(() => {
  const base = `/projects/${props.projectId}`;
  return [
    { label: t('Hojas'), icon: 'i-lucide-table-2', to: `${base}/workbooks` },
    {
      label: t('Catálogo'),
      icon: 'i-lucide-file-spreadsheet',
      to: base,
      exact: true,
    },
    { label: t('Reglas'), icon: 'i-lucide-list-checks', to: `${base}/rules` },
    {
      label: t('Evaluaciones'),
      icon: 'i-lucide-clipboard-check',
      to: `${base}/evaluations`,
    },
    { label: 'Feed', icon: 'i-lucide-rss', to: `${base}/feed` },
    {
      label: t('Productos'),
      icon: 'i-lucide-package-search',
      to: `${base}/products`,
    },
    {
      label: t('Integraciones'),
      icon: 'i-lucide-plug',
      to: `${base}/integrations`,
    },
  ];
});
</script>

<template>
  <!-- En el móvil no caben las siete: la lista se desplaza en horizontal. -->
  <nav
    :aria-label="$t('Secciones del proyecto')"
    class="-mx-2.5 overflow-x-auto"
  >
    <UNavigationMenu
      :items="items"
      highlight
      class="min-w-max border-b border-default"
      :ui="{ link: 'py-2' }"
    />
  </nav>
</template>
