<script setup lang="ts">
import { ApiFailure } from '../../../services/api-client';
import type { Feed } from '../../../types/feeds';

definePageMeta({ layout: 'workspace' });

const route = useRoute();
const projectId = computed(() => String(route.params.id));

const { $feeds } = useNuxtApp();
const toast = useToast();
const { project } = useProject(projectId);
const { feed, status, error, refresh, replaceFeed, publicUrl } =
  useProjectFeed(projectId);

const isCreating = ref(false);
// La URL completa solo existe mientras el modal la muestra.
const shownUrl = ref<string | null>(null);
const isUrlOpen = computed({
  get: () => shownUrl.value !== null,
  set: (open) => {
    if (!open) shownUrl.value = null;
  },
});

const isFirstLoad = computed(
  () => status.value === 'pending' && feed.value === null,
);

async function createFeed() {
  isCreating.value = true;
  try {
    const created = await $feeds.create(projectId.value);
    replaceFeed(created.feed);
    shownUrl.value = publicUrl(created.deliveryUrl);
  } catch (failure) {
    toast.add({
      title: 'No se creó el feed',
      description:
        failure instanceof ApiFailure ? failure.message : 'Inténtalo de nuevo.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isCreating.value = false;
  }
}

function onDeliveryChanged(updated: Feed, deliveryUrl: string | null) {
  replaceFeed(updated);
  if (deliveryUrl) shownUrl.value = publicUrl(deliveryUrl);
}
</script>

<template>
  <WorkspacePage id="feed" title="Feed">
    <template #subtitle>
      <p class="mt-1 text-sm text-muted">
        {{ project?.name ?? 'Proyecto' }} · la URL estable que Merchant Center
        descarga cada día.
      </p>
    </template>

    <ProjectNav :project-id="projectId" class="mb-6" />

    <div v-if="isFirstLoad" class="space-y-3">
      <USkeleton v-for="row in 3" :key="row" class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="error.message"
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <UEmpty
      v-else-if="!feed"
      icon="i-lucide-rss"
      title="Este proyecto todavía no tiene feed"
      description="El feed da una URL fija con los productos publicados. Merchant Center la descarga sin iniciar sesión."
      :actions="[
        {
          label: 'Crear feed',
          icon: 'i-lucide-plus',
          loading: isCreating,
          onClick: createFeed,
        },
      ]"
    />

    <div v-else class="space-y-10">
      <FeedPublishedVersion
        :version="feed.publishedVersion"
        :project-id="projectId"
      />
      <FeedDelivery
        :project-id="projectId"
        :feed="feed"
        @changed="onDeliveryChanged"
      />
      <FeedVersions :project-id="projectId" :feed-id="feed.id" />
    </div>

    <FeedUrlModal v-if="shownUrl" v-model:open="isUrlOpen" :url="shownUrl" />
  </WorkspacePage>
</template>
