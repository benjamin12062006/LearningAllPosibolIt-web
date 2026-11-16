<script setup lang="ts">
import { Highlight } from '@ark-ui/vue/highlight';
import type { TsvProduct } from '../types/feed-viewer';
import { MAIN_COLUMN_LABELS, mainColumnsOf } from '../utils/product-columns';

const { t } = useAppLocale();

/**
 * Productos de un TSV: tabla en escritorio y tarjetas en el móvil, donde cinco
 * columnas no caben (WCAG 1.4.10). Los valores son texto de terceros: siempre
 * se interpolan, nunca se insertan como HTML.
 */
const props = defineProps<{
  columns: string[];
  products: TsvProduct[];
  /** Texto buscado, para resaltarlo en el ID y el título. */
  search: string;
  /** El producto cuya ficha está abierta. */
  selectedId: string | null;
}>();

const emit = defineEmits<{ open: [productId: string] }>();

const visibleColumns = computed(() => mainColumnsOf(props.columns));
const textColumns = computed(() =>
  visibleColumns.value.filter((column) => column !== 'image_link'),
);
const hasImages = computed(() => visibleColumns.value.includes('image_link'));

/** Sin `id` no hay ficha que abrir: la ruta de la API lo pide. */
function idOf(product: TsvProduct) {
  return product.values.id ?? '';
}

function nameOf(product: TsvProduct) {
  return (
    product.values.title || idOf(product) || t('Línea {0}', [product.line])
  );
}

function isHighlighted(column: string) {
  return column === 'id' || column === 'title';
}

function open(product: TsvProduct) {
  const id = idOf(product);
  if (id) emit('open', id);
}
</script>

<template>
  <div>
    <table class="w-full border-collapse text-sm max-md:hidden">
      <caption class="sr-only">
        {{
          $t('Productos del archivo')
        }}
      </caption>
      <thead class="sticky top-0 z-(--layer-bar) bg-default">
        <tr class="border-b border-default text-left text-muted">
          <th
            v-for="column in visibleColumns"
            :key="column"
            scope="col"
            class="h-9 px-3 font-medium whitespace-nowrap"
            :class="{ 'w-14': column === 'image_link' }"
          >
            <span :class="{ 'sr-only': column === 'image_link' }">
              {{ $t(MAIN_COLUMN_LABELS[column]) }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="product in products"
          :key="product.line"
          :data-product-id="idOf(product)"
          tabindex="0"
          class="data-row cursor-pointer border-b border-default outline-primary transition-colors duration-(--motion-instant) hover:bg-elevated/60 focus-visible:outline-2 focus-visible:-outline-offset-2 aria-selected:bg-elevated"
          :aria-selected="selectedId !== null && selectedId === idOf(product)"
          @click="open(product)"
          @keydown.enter="open(product)"
        >
          <td
            v-for="column in visibleColumns"
            :key="column"
            class="px-3"
            :class="{
              'text-right tabular-nums whitespace-nowrap': column === 'price',
              'max-w-0 truncate': column === 'title',
              'whitespace-nowrap': column === 'id',
            }"
          >
            <FeedViewerProductImage
              v-if="column === 'image_link'"
              :src="product.values.image_link"
              alt=""
            />
            <Highlight
              v-else-if="isHighlighted(column) && search"
              :query="search"
              :text="product.values[column] ?? ''"
              ignore-case
              class="rounded-xs bg-primary/25 text-default"
            />
            <template v-else>{{ product.values[column] }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <ul class="divide-y divide-default md:hidden">
      <li v-for="product in products" :key="product.line">
        <button
          type="button"
          :data-product-id="idOf(product)"
          class="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left outline-primary focus-visible:outline-2 focus-visible:-outline-offset-2 aria-pressed:bg-elevated"
          :aria-pressed="selectedId !== null && selectedId === idOf(product)"
          @click="open(product)"
        >
          <FeedViewerProductImage
            v-if="hasImages"
            :src="product.values.image_link"
            alt=""
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-base text-default">
              {{ nameOf(product) }}
            </span>
            <span class="block truncate text-sm text-muted">
              {{
                textColumns
                  .filter((column) => column !== 'title')
                  .map((column) => product.values[column])
                  .filter(Boolean)
                  .join(' · ')
              }}
            </span>
          </span>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 shrink-0 text-dimmed"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
