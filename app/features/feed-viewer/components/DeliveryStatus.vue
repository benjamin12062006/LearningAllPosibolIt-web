<script setup lang="ts">
import { DELIVERY_BLOCK_LABELS } from '../types/feed-viewer';

/**
 * Si la URL pública entrega el TSV y, si no, por qué (V2). La ruta pública
 * responde el mismo 404 a todo: con sesión sí se puede explicar.
 */
const props = defineProps<{ projectId: string; feedId: string }>();

const { $feedViewer } = useNuxtApp();

const {
  data: delivery,
  status,
  error,
  refresh,
} = useAsyncData(
  () => `feed-delivery:${props.feedId}`,
  () => $feedViewer.delivery(props.projectId, props.feedId),
  { server: false },
);

defineExpose({ refresh });
</script>

<template>
  <div aria-live="polite">
    <USkeleton v-if="status === 'pending' && !delivery" class="h-10 w-full" />
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />
    <UAlert
      v-else-if="delivery?.delivering"
      color="success"
      variant="subtle"
      icon="i-lucide-circle-check"
      :title="$t('La URL pública está entregando el catálogo')"
    />
    <UAlert
      v-else-if="delivery?.reason"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="$t('La URL pública no entrega ahora')"
      :description="$t(DELIVERY_BLOCK_LABELS[delivery.reason])"
    />
  </div>
</template>
