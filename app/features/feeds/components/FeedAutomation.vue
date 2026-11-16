<script setup lang="ts">
import { useFeedRefresh } from '../composables/useFeedRefresh';
import { ApiFailure } from '../../../services/api-client';
import type { Feed } from '../types/feeds';

const { t } = useAppLocale();

/**
 * Actualización diaria del feed: el último intento (la alerta), «Actualizar
 * ahora» y los tres ajustes. Sin fuente y política la API no deja actualizar,
 * así que el botón lo explica en lugar de fallar.
 */
const props = defineProps<{ projectId: string; feed: Feed }>();
const emit = defineEmits<{ saved: [feed: Feed]; finished: [] }>();

const toast = useToast();
const { running, refreshNow } = useFeedRefresh(
  () => props.projectId,
  () => props.feed.id,
);

const isReadyToRefresh = computed(
  () => props.feed.source !== null && props.feed.policy !== null,
);

/** Mientras corre, se muestra el estado vivo; si no, el último que guardó la API. */
const shownRefresh = computed(() => running.value ?? props.feed.lastRefresh);

async function startRefresh() {
  try {
    await refreshNow();
    emit('finished');
  } catch (failure) {
    toast.add({
      title: t('No se pudo actualizar'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  }
}
</script>

<template>
  <section aria-labelledby="automatica" class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="automatica" class="text-lg font-medium text-highlighted">
          {{ $t('Actualización diaria') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{
            $t(
              'Descarga el CSV, lo evalúa con la revisión aprobada y publica solo si cumple la política. Si algo falla, la versión publicada no cambia.',
            )
          }}
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        :disabled="!isReadyToRefresh"
        :loading="running !== null"
        @click="startRefresh"
      >
        {{ $t('Actualizar ahora') }}
      </UButton>
    </div>

    <p v-if="!isReadyToRefresh" class="text-sm text-dimmed">
      {{ $t('Para actualizar, guarda la fuente y aprueba una política.') }}
    </p>

    <FeedLastRefresh v-if="shownRefresh" :refresh="shownRefresh" />

    <UAccordion
      type="multiple"
      :items="[
        { label: 'Fuente', icon: 'i-lucide-link', slot: 'source' },
        { label: 'Política', icon: 'i-lucide-shield-check', slot: 'policy' },
        { label: 'Horario', icon: 'i-lucide-clock', slot: 'schedule' },
      ]"
    >
      <template #source>
        <FeedSourceForm
          :project-id="projectId"
          :feed="feed"
          class="pb-4"
          @saved="emit('saved', $event)"
        />
      </template>
      <template #policy>
        <FeedPolicyForm
          :project-id="projectId"
          :feed="feed"
          class="pb-4"
          @saved="emit('saved', $event)"
        />
      </template>
      <template #schedule>
        <FeedScheduleForm
          :project-id="projectId"
          :feed="feed"
          class="pb-4"
          @saved="emit('saved', $event)"
        />
      </template>
    </UAccordion>
  </section>
</template>
