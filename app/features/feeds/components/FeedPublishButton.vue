<script setup lang="ts">
import { useProjectFeed } from '../composables/useProjectFeed';
import { ApiFailure } from '../../../services/api-client';

const { t, language } = useAppLocale();

/**
 * Publica una exportación en el feed del proyecto. Sin feed, lleva a crearlo;
 * si ya es la versión publicada, lo dice en lugar de ofrecer publicar.
 */
const props = defineProps<{ projectId: string; exportId: string }>();

const toast = useToast();
const { feed, status, publish } = useProjectFeed(() => props.projectId);

const isPublishing = ref(false);

const isAlreadyPublished = computed(
  () => feed.value?.publishedVersion?.exportId === props.exportId,
);

async function publishExport() {
  isPublishing.value = true;
  try {
    const updated = await publish(props.exportId);
    toast.add({
      title: t('Publicada en el feed'),
      description: t('Merchant Center descargará {0} productos.', [
        updated.publishedVersion?.rowCount.toLocaleString(language.value) ??
          'los',
      ]),
      color: 'success',
      icon: 'i-lucide-rss',
    });
  } catch (failure) {
    toast.add({
      title: t('No se publicó'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isPublishing.value = false;
  }
}
</script>

<template>
  <USkeleton v-if="status === 'pending' && !feed" class="h-8 w-44" />

  <UButton
    v-else-if="!feed"
    :to="`/projects/${projectId}/feed`"
    icon="i-lucide-rss"
    color="neutral"
    variant="soft"
  >
    {{ $t('Crear el feed para publicar') }}
  </UButton>

  <p v-else-if="isAlreadyPublished" class="flex items-center gap-2 text-sm">
    <UIcon name="i-lucide-rss" class="size-4 text-success" />
    {{ $t('Es la versión publicada en el') }}
    <NuxtLink :to="`/projects/${projectId}/feed`" class="underline"
      >feed</NuxtLink
    >.
  </p>

  <UButton
    v-else
    icon="i-lucide-rss"
    color="neutral"
    variant="soft"
    :loading="isPublishing"
    @click="publishExport"
  >
    {{ $t('Publicar en el feed') }}
  </UButton>
</template>
