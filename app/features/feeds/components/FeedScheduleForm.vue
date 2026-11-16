<script setup lang="ts">
import { feedScheduleSchema, timeZoneOptions } from '../utils/feed-forms';
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiFailure } from '../../../services/api-client';
import type { Feed, FeedSchedule } from '../types/feeds';

const { t } = useAppLocale();

/**
 * Hora local de la actualización diaria. Los tres campos se envían siempre:
 * desactivarla conserva la hora para volver a activarla.
 */
const props = defineProps<{ projectId: string; feed: Feed }>();
const emit = defineEmits<{ saved: [feed: Feed] }>();

const { $feeds } = useNuxtApp();
const toast = useToast();

const zones = timeZoneOptions();
const state = reactive<FeedSchedule>({
  enabled: props.feed.schedule?.enabled ?? true,
  refreshTime: props.feed.schedule?.refreshTime ?? '06:00',
  timeZone: props.feed.schedule?.timeZone ?? zones[0] ?? 'UTC',
});

async function onSubmit(event: FormSubmitEvent<FeedSchedule>) {
  try {
    const saved = await $feeds.setSchedule(
      props.projectId,
      props.feed.id,
      event.data,
    );
    emit('saved', saved);
    toast.add({
      title: 'Horario guardado',
      color: 'success',
      icon: 'i-lucide-check',
    });
  } catch (failure) {
    toast.add({
      title: t('No se guardó el horario'),
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
  <UForm
    :schema="feedScheduleSchema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField name="enabled">
      <USwitch v-model="state.enabled" :label="$t('Actualizar cada día')" />
    </UFormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="$t('Hora local')" name="refreshTime">
        <UInput v-model="state.refreshTime" type="time" class="w-full" />
      </UFormField>
      <UFormField :label="$t('Zona horaria')" name="timeZone">
        <USelectMenu v-model="state.timeZone" :items="zones" class="w-full" />
      </UFormField>
    </div>
    <UButton type="submit" icon="i-lucide-clock" color="neutral" variant="soft">
      {{ $t('Guardar horario') }}
    </UButton>
  </UForm>
</template>
