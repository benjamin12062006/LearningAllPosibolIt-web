<!-- Fila densa como cada tarea de Focus: círculo de estado, nombre y detalle. -->
<script setup lang="ts">
import { CHANNEL_PROFILE_LABELS, type Project } from '../types/projects';

const { t } = useAppLocale();

const props = defineProps<{ project: Project }>();

const isReady = computed(() => isConfigured(props.project));

const detail = computed(() => {
  const { country, currency, channelProfile } = props.project;
  if (!country || !currency || !channelProfile) {
    return t('Falta elegir país, moneda y canal');
  }
  return `${t(CHANNEL_PROFILE_LABELS[channelProfile])} · ${country} · ${currency}`;
});
</script>

<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="focus-row group -mx-2 rounded-md px-2 transition-colors hover:bg-elevated/40"
  >
    <UIcon
      :name="isReady ? 'i-lucide-circle-check' : 'i-lucide-circle'"
      class="size-5 shrink-0"
      :class="isReady ? 'text-primary' : 'text-dimmed'"
    />
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm text-default">{{
        project.name
      }}</span>
      <span class="block truncate text-xs text-muted">{{ detail }}</span>
    </span>
    <span class="sr-only">{{
      isReady ? $t('Listo') : $t('Por configurar')
    }}</span>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 text-dimmed opacity-0 transition-opacity group-hover:opacity-100"
    />
  </NuxtLink>
</template>
