<script setup lang="ts">
import { useProductDetail } from '../composables/useProductDetail';
import { useProductPage } from '../composables/useProductPage';
import { useProjectFeed } from '../../feeds/composables/useProjectFeed';
import { useProject } from '../../projects/composables/useProjects';
import { ApiFailure } from '../../../services/api-client';
import { productSourceQuery, readProductSource } from '../utils/product-source';

const { t, language } = useAppLocale();

/** Pausa tras la última tecla antes de buscar; Intro busca al momento. */
const SEARCH_PAUSE_MS = 350;

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $exports } = useNuxtApp();

const projectId = computed(() => String(route.params.id));
const source = computed(() => readProductSource(route.query));

const { project } = useProject(projectId);
const { feed, status: feedStatus } = useProjectFeed(projectId);

const {
  products,
  columns,
  rowCount,
  hasMore,
  isSearching,
  page,
  search,
  setSearch,
  pageHref,
  status,
  error,
  refresh,
} = useProductPage(projectId, source);

const {
  productId,
  detail,
  status: detailStatus,
  error: detailError,
  refresh: refreshDetail,
  open: openProduct,
  close: closeProduct,
} = useProductDetail(projectId, source);

const typedSearch = ref(search.value);
const isDownloading = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const isSheetOpen = computed({
  get: () => productId.value !== null,
  set: (open) => {
    if (!open) void closeProduct();
  },
});

const isResolvingSource = computed(
  () => source.value === null && feedStatus.value === 'pending',
);
const isFirstLoad = computed(
  () => status.value === 'pending' && products.value.length === 0,
);
const hasNoSource = computed(
  () => source.value === null && !isResolvingSource.value,
);

const sourceLabel = computed(() => {
  if (source.value?.kind === 'export') return t('Exportación sin publicar');
  if (source.value?.kind === 'feed_version') {
    const isCurrent =
      feed.value?.publishedVersion?.id === source.value.versionId;
    return isCurrent ? t('Versión publicada') : t('Versión anterior del feed');
  }
  return '';
});

const countLabel = computed(() => {
  if (isSearching.value) {
    return t('{0} en esta página', [
      products.value.length.toLocaleString(language.value),
    ]);
  }
  return t('{0} productos', [rowCount.value.toLocaleString(language.value)]);
});

// Sin archivo en la URL se abre lo publicado, que es lo que ve el canal.
watch(
  [source, () => feed.value?.publishedVersion?.id],
  ([current, publishedVersionId]) => {
    if (current !== null || !feed.value || !publishedVersionId) return;
    void router.replace({
      query: {
        ...route.query,
        ...productSourceQuery({
          kind: 'feed_version',
          feedId: feed.value.id,
          versionId: publishedVersionId,
        }),
      },
    });
  },
  { immediate: true },
);

// «Atrás» cambia la búsqueda de la URL: la caja la sigue.
watch(search, (current) => {
  typedSearch.value = current;
});

function searchAfterPause() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchNow, SEARCH_PAUSE_MS);
}

function searchNow() {
  clearTimeout(searchTimer);
  if (typedSearch.value.trim() !== search.value) {
    void setSearch(typedSearch.value);
  }
}

function clearSearch() {
  typedSearch.value = '';
  searchNow();
}

/** El foco vuelve a la fila que abrió la ficha (plan del visor, VW7). */
let lastOpenedId: string | null = null;
watch(productId, (id) => {
  if (id !== null) lastOpenedId = id;
});

function openedRow(): HTMLElement | null {
  if (lastOpenedId === null) return null;
  const rows = document.querySelectorAll<HTMLElement>('[data-product-id]');
  for (const row of rows) {
    const isVisible = row.offsetParent !== null;
    if (row.dataset.productId === lastOpenedId && isVisible) return row;
  }
  return null;
}

async function downloadExport() {
  if (source.value?.kind !== 'export') return;
  isDownloading.value = true;
  try {
    const file = await $exports.download(
      projectId.value,
      source.value.exportId,
    );
    saveBlob(file, 'productos.tsv');
  } catch (failure) {
    toast.add({
      title: t('No se descargó productos.tsv'),
      description:
        failure instanceof ApiFailure
          ? failure.message
          : t('Inténtalo de nuevo.'),
      color: 'error',
      icon: 'i-lucide-circle-alert',
    });
  } finally {
    isDownloading.value = false;
  }
}

onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <LayoutDataSpace
    id="productos"
    :crumbs="[
      { label: project?.name ?? 'Proyecto', to: `/projects/${projectId}` },
      { label: 'Productos' },
    ]"
    :main-label="$t('Productos')"
  >
    <template #status>
      <UBadge
        v-if="sourceLabel"
        color="neutral"
        variant="subtle"
        class="max-sm:hidden"
      >
        {{ sourceLabel }}
      </UBadge>
    </template>

    <template #actions>
      <UButton
        v-if="source?.kind === 'export'"
        icon="i-lucide-download"
        color="neutral"
        variant="soft"
        :loading="isDownloading"
        class="touch-target"
        @click="downloadExport"
      >
        <span class="max-sm:sr-only">{{ $t('Descargar') }}</span>
      </UButton>
      <AssistantProjectLauncher />
    </template>

    <template v-if="source" #toolbar>
      <form
        role="search"
        class="flex min-w-0 flex-1 items-center gap-2"
        @submit.prevent="searchNow"
      >
        <UInput
          v-model="typedSearch"
          type="search"
          icon="i-lucide-search"
          :placeholder="$t('Buscar por ID o título')"
          :aria-label="$t('Buscar productos por ID o título')"
          maxlength="150"
          class="w-full max-w-sm"
          :ui="{ base: 'pointer-coarse:text-base' }"
          @input="searchAfterPause"
        />
        <UButton
          v-if="isSearching"
          type="button"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          :aria-label="$t('Quitar la búsqueda')"
          class="touch-target"
          @click="clearSearch"
        />
      </form>
      <p class="text-sm text-muted tabular-nums" role="status">
        {{ countLabel }}
      </p>
    </template>

    <div v-if="isResolvingSource || isFirstLoad" class="space-y-px p-3">
      <USkeleton v-for="row in 12" :key="row" class="h-9 w-full" />
    </div>

    <div v-else-if="hasNoSource" class="p-6">
      <UEmpty
        icon="i-lucide-package-search"
        :title="$t('Todavía no hay productos que ver')"
        :description="
          $t(
            'Aquí se ven los productos exactos de una exportación o de lo publicado en el feed.',
          )
        "
        :actions="[
          {
            label: 'Ir a evaluaciones',
            to: `/projects/${projectId}/evaluations`,
          },
          {
            label: 'Ir al feed',
            to: `/projects/${projectId}/feed`,
            color: 'neutral',
            variant: 'soft',
          },
        ]"
      />
    </div>

    <div v-else-if="error" class="p-6">
      <FeedViewerFailure
        :project-id="projectId"
        :failure="error"
        @retry="refresh()"
      />
    </div>

    <div v-else-if="products.length === 0" class="p-6">
      <UEmpty
        icon="i-lucide-search-x"
        :title="
          isSearching
            ? $t('Ningún producto coincide con «{0}»', [search])
            : $t('El archivo no tiene productos')
        "
        :actions="
          isSearching
            ? [{ label: 'Quitar la búsqueda', onClick: clearSearch }]
            : []
        "
      />
    </div>

    <template v-else>
      <FeedViewerProductTable
        :columns="columns"
        :products="products"
        :search="search"
        :selected-id="productId"
        @open="openProduct"
      />

      <div class="flex justify-center border-t border-default px-3 py-3">
        <!-- Con búsqueda la API no da el total: solo se sabe si hay más. -->
        <div v-if="isSearching" class="flex gap-2">
          <UButton
            :to="page > 1 ? pageHref(page - 1) : undefined"
            :disabled="page === 1"
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
          >
            {{ $t('Anterior') }}
          </UButton>
          <UButton
            :to="hasMore ? pageHref(page + 1) : undefined"
            :disabled="!hasMore"
            trailing-icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
          >
            {{ $t('Siguiente') }}
          </UButton>
        </div>
        <UiPagination
          v-else
          :page="page"
          :count="rowCount"
          :page-size="PRODUCTS_PAGE_SIZE"
          :page-href="pageHref"
        />
      </div>
    </template>

    <UiSidePanel
      v-model:open="isSheetOpen"
      :title="detail?.product.values.title || productId || 'Producto'"
      :description="productId ? `ID ${productId}` : undefined"
      :return-focus-to="openedRow"
    >
      <div v-if="detailStatus === 'pending' && !detail" class="space-y-3">
        <USkeleton v-for="row in 8" :key="row" class="h-8 w-full" />
      </div>
      <FeedViewerFailure
        v-else-if="detailError"
        :project-id="projectId"
        :failure="detailError"
        @retry="refreshDetail()"
      />
      <FeedViewerProductSheet
        v-else-if="detail"
        :project-id="projectId"
        :detail="detail"
      />
    </UiSidePanel>
  </LayoutDataSpace>
</template>
