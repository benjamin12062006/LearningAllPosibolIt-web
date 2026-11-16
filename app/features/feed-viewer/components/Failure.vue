<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';
import { describeViewerFailure } from '../utils/viewer-failure';

const { t } = useAppLocale();

/** Un fallo del visor explicado, con una salida que tenga sentido para ese caso. */
const props = defineProps<{ projectId: string; failure: unknown }>();
const emit = defineEmits<{ retry: [] }>();

const view = computed(() => describeViewerFailure(props.failure));

const actions = computed<ButtonProps[]>(() => {
  const base = `/projects/${props.projectId}`;
  if (view.value.action === 'retry') {
    return [{ label: t('Reintentar'), onClick: () => emit('retry') }];
  }
  if (view.value.action === 'feed') {
    return [{ label: t('Ir al feed'), to: `${base}/feed` }];
  }
  if (view.value.action === 'evaluations') {
    return [{ label: 'Ver evaluaciones', to: `${base}/evaluations` }];
  }
  return [];
});
</script>

<template>
  <UAlert
    :color="view.color"
    variant="subtle"
    :icon="view.icon"
    :title="view.title"
    :description="view.description"
    :actions="actions"
  />
</template>
