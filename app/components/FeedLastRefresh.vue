<script setup lang="ts">
import {
  isActiveRefresh,
  type LastRefresh,
  type RefreshOutcome,
  type RefreshStage,
} from '../types/feeds';

/**
 * El último intento de actualización: la «alerta» del feed (D12 de la API).
 * Si no publicó, el motivo llega en español en `error`.
 */
const props = defineProps<{ refresh: LastRefresh }>();

const STAGE_LABELS: Record<RefreshStage, string> = {
  fetch: 'descargando el CSV',
  import: 'importando',
  evaluate: 'evaluando',
  publish: 'publicando',
};

const OUTCOME_TEXTS: Record<
  RefreshOutcome,
  { title: string; color: 'success' | 'neutral' | 'warning' }
> = {
  published: { title: 'Publicó una versión nueva', color: 'success' },
  unchanged: {
    title: 'Sin cambios: el catálogo era el publicado',
    color: 'neutral',
  },
  needs_review: {
    title: 'No publicó: no cumple la política',
    color: 'warning',
  },
  conflict: {
    title: 'No publicó: alguien publicó a mano entretanto',
    color: 'warning',
  },
};

const when = computed(() => {
  const origin = props.refresh.scheduledFor
    ? `Programada del ${props.refresh.scheduledFor}`
    : 'Lanzada a mano';
  return `${origin} · ${formatDateTime(props.refresh.createdAt)}`;
});

type AlertView = {
  title: string;
  color: 'info' | 'error' | 'success' | 'neutral' | 'warning';
  icon: string;
  description?: string;
};

const view = computed<AlertView>(() => {
  const { status, stage, outcome, error } = props.refresh;
  if (isActiveRefresh(props.refresh)) {
    const waiting =
      status === 'retry_wait'
        ? 'esperando para reintentar'
        : STAGE_LABELS[stage];
    return {
      title: `En curso: ${waiting}`,
      color: 'info',
      icon: 'i-lucide-loader-circle',
      description: error?.message.es,
    };
  }
  if (status === 'failed') {
    return {
      title: 'Falló; la versión publicada no cambió',
      color: 'error',
      icon: 'i-lucide-circle-x',
      description: error?.message.es,
    };
  }
  const text = outcome ? OUTCOME_TEXTS[outcome] : OUTCOME_TEXTS.unchanged;
  return {
    title: text.title,
    color: text.color,
    icon: text.color === 'success' ? 'i-lucide-circle-check' : 'i-lucide-info',
    description: error?.message.es,
  };
});
</script>

<template>
  <UAlert
    :color="view.color"
    variant="subtle"
    :icon="view.icon"
    :title="view.title"
    :description="
      view.description ? `${view.description} ${when}.` : `${when}.`
    "
  />
</template>
