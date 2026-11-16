<script setup lang="ts">
import { Pagination } from '@ark-ui/vue/pagination';

const { t } = useAppLocale();

/**
 * Paginación de enlaces reales (`?pagina=N`), con Ark UI y el tema de la app
 * (plan del visor, VW1 y VW5): cada página se puede abrir en otra pestaña y
 * «Atrás» vuelve a la anterior. La página la manda la URL, no este componente.
 */
defineProps<{
  page: number;
  /** Total de elementos, no de páginas. */
  count: number;
  pageSize: number;
  /** Dirección de una página, por ejemplo `pageHref` de `usePageInUrl`. */
  pageHref: (page: number) => string;
}>();

// Ark trae las etiquetas para lectores de pantalla en inglés.
const LABELS = {
  rootLabel: t('Paginación'),
  prevTriggerLabel: t('Página anterior'),
  nextTriggerLabel: t('Página siguiente'),
  itemLabel: ({ page, totalPages }: { page: number; totalPages: number }) =>
    totalPages > 1 && page === totalPages
      ? t('Última página, {0}', [page])
      : t('Página {0}', [page]),
};

const LINK =
  'inline-flex min-w-8 items-center justify-center rounded-md px-2.5 py-1.5 text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary';
const CURRENT = 'data-[selected]:bg-primary data-[selected]:text-inverted';
const DISABLED =
  'inline-flex items-center px-2.5 py-1.5 text-dimmed cursor-not-allowed';
</script>

<template>
  <Pagination.Root
    :count="count"
    :page-size="pageSize"
    :page="page"
    :sibling-count="1"
    type="link"
    :get-page-url="({ page: target }) => pageHref(target)"
    :translations="LABELS"
    class="flex flex-wrap items-center gap-1 text-sm"
  >
    <Pagination.Context v-slot="pagination">
      <Pagination.PrevTrigger as-child>
        <NuxtLink
          v-if="pagination.previousPage"
          :to="pageHref(pagination.previousPage)"
          :class="LINK"
        >
          {{ $t('Anterior') }}
        </NuxtLink>
        <span v-else :class="DISABLED">{{ $t('Anterior') }}</span>
      </Pagination.PrevTrigger>

      <template v-for="(item, index) in pagination.pages" :key="index">
        <Pagination.Item v-if="item.type === 'page'" v-bind="item" as-child>
          <NuxtLink :to="pageHref(item.value)" :class="[LINK, CURRENT]">
            {{ item.value }}
          </NuxtLink>
        </Pagination.Item>
        <Pagination.Ellipsis v-else :index="index" class="px-1.5 text-dimmed">
          …
        </Pagination.Ellipsis>
      </template>

      <Pagination.NextTrigger as-child>
        <NuxtLink
          v-if="pagination.nextPage"
          :to="pageHref(pagination.nextPage)"
          :class="LINK"
        >
          {{ $t('Siguiente') }}
        </NuxtLink>
        <span v-else :class="DISABLED">{{ $t('Siguiente') }}</span>
      </Pagination.NextTrigger>
    </Pagination.Context>
  </Pagination.Root>
</template>
