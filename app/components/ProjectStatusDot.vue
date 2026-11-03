<!-- Punto de color del proyecto; el estado también va en texto para lectores de pantalla. -->
<script setup lang="ts">
import type { Project } from '../types/projects';

const props = defineProps<{ project: Project }>();

const isReady = computed(() => props.project.configurationStatus === 'ready');
</script>

<template>
  <span
    class="size-2.5 shrink-0 rounded-full"
    :class="isReady ? 'bg-success' : 'bg-warning'"
  >
    <span class="sr-only">{{ isReady ? 'Listo' : 'Por configurar' }}</span>
  </span>
</template>
