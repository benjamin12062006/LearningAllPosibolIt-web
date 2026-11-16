<script setup lang="ts">
import { feedSourceSchema } from '../utils/feed-forms';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { z } from 'zod';
import { ApiFailure } from '../../../services/api-client';
import type { Feed, FeedSource } from '../types/feeds';

const { t } = useAppLocale();

/** De dónde descarga el feed su CSV cada día y cómo leerlo, como una importación. */
const props = defineProps<{ projectId: string; feed: Feed }>();
const emit = defineEmits<{ saved: [feed: Feed] }>();

const { $feeds } = useNuxtApp();
const toast = useToast();

const DELIMITER_ITEMS = [
  { value: 'comma', label: 'Coma ( , )' },
  { value: 'semicolon', label: 'Punto y coma ( ; )' },
];

const state = reactive<z.input<typeof feedSourceSchema>>({
  url: props.feed.source?.url ?? '',
  idColumn: props.feed.source?.idColumn ?? 'id',
  delimiter: props.feed.source?.delimiter ?? 'comma',
});

async function onSubmit(event: FormSubmitEvent<FeedSource>) {
  try {
    const saved = await $feeds.setSource(
      props.projectId,
      props.feed.id,
      event.data,
    );
    emit('saved', saved);
    toast.add({
      title: 'Fuente guardada',
      color: 'success',
      icon: 'i-lucide-check',
    });
  } catch (failure) {
    toast.add({
      title: t('No se guardó la fuente'),
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
    :schema="feedSourceSchema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField
      :label="$t('URL del CSV')"
      name="url"
      :description="
        $t(
          'Pública y con https://. La API solo descarga de servidores públicos.',
        )
      "
    >
      <UInput
        v-model="state.url"
        type="url"
        placeholder="https://tienda.example/catalogo.csv"
        class="w-full"
      />
    </UFormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="$t('Columna del identificador')" name="idColumn">
        <UInput v-model="state.idColumn" class="w-full" />
      </UFormField>
      <UFormField :label="$t('Separador')" name="delimiter">
        <USelect
          v-model="state.delimiter"
          :items="DELIMITER_ITEMS"
          class="w-full"
        />
      </UFormField>
    </div>
    <UButton type="submit" icon="i-lucide-save" color="neutral" variant="soft">
      {{ $t('Guardar fuente') }}
    </UButton>
  </UForm>
</template>
