<script setup lang="ts">
import {
  isActiveRefresh,
  type LastRefresh,
  type RefreshOutcome,
  type RefreshStage,
} from '../types/feeds';

const { t, formatDateTime, language } = useAppLocale();

/**
 * El último intento de actualización: la «alerta» del feed (D12 de la API).
 * Si no publicó, el motivo llega en español en `error`.
 */
const props = defineProps<{ refresh: LastRefresh }>();

const STAGE_LABELS: Record<RefreshStage, string> = {
  fetch: t('descargando el CSV'),
  import: t('importando'),
  evaluate: t('evaluando'),
  publish: t('publicando'),
};

const OUTCOME_TEXTS: Record<
  RefreshOutcome,
  { title: string; color: 'success' | 'neutral' | 'warning' }
> = {
  published: { title: t('Publicó una versión nueva'), color: 'success' },
  unchanged: {
    title: t('Sin cambios: el catálogo era el publicado'),
    color: 'neutral',
  },
  needs_review: {
    title: t('No publicó: no cumple la política'),
    color: 'warning',
  },
  conflict: {
    title: t('No publicó: alguien publicó a mano entretanto'),
    color: 'warning',
  },
};

const when = computed(() => {
  const origin = props.refresh.scheduledFor
    ? t('Programada del {0}', [props.refresh.scheduledFor])
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
        ? t('esperando para reintentar')
        : t(STAGE_LABELS[stage]);
    return {
      title: `En curso: ${waiting}`,
      color: 'info',
      icon: 'i-lucide-loader-circle',
      description: error?.message[language.value],
    };
  }
  if (status === 'failed') {
    return {
      title: t('Falló; la versión publicada no cambió'),
      color: 'error',
      icon: 'i-lucide-circle-x',
      description: error?.message[language.value],
    };
  }
  const text = outcome ? OUTCOME_TEXTS[outcome] : OUTCOME_TEXTS.unchanged;
  return {
    title: text.title,
    color: text.color,
    icon: text.color === 'success' ? 'i-lucide-circle-check' : 'i-lucide-info',
    description: error?.message[language.value],
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
