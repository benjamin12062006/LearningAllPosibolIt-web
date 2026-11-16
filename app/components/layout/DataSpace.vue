<script setup lang="ts">
import {
  ASSISTANT_PANEL_WIDTH,
  useAssistantPanelWidth,
} from '../../composables/useResizableWidth';

const { t } = useAppLocale();

/**
 * Plantilla «Espacio de datos» (plan ui 04, §3.2): la tabla en el centro con
 * todo el sitio; alrededor, y plegables, la lista de hojas o vistas, el panel
 * inferior y el chat. Sin portada: una cabecera compacta de 56 px.
 *
 * Cada zona se dibuja una sola vez y cambia de sitio con el ancho, para que
 * su estado (el chat a medio escribir, la fila elegida) no se pierda:
 * - ≥1280: las cinco zonas.
 * - 1024–1279: la lista de hojas se abre superpuesta desde la cabecera.
 * - 768–1023: además, el chat se abre superpuesto a la derecha.
 * - <768: una vista a la vez, con pestañas inferiores fijas.
 */
export interface Crumb {
  label: string;
  to?: string;
}

export type MobileView = 'main' | 'chat' | 'detail';

const props = defineProps<{
  id: string;
  crumbs: Crumb[];
  mainLabel?: string;
  asideLabel?: string;
  detailLabel?: string;
  isChatBusy?: boolean;
}>();

const mainTitle = computed(() => props.mainLabel ?? t('Tabla'));
const asideTitle = computed(() => props.asideLabel ?? t('Hojas'));
const detailTitle = computed(() => props.detailLabel ?? t('Detalle'));

const slots = defineSlots<{
  default(): unknown;
  status?(): unknown;
  actions?(): unknown;
  toolbar?(): unknown;
  aside?(): unknown;
  detail?(): unknown;
  chat?(): unknown;
}>();

const isChatOpen = defineModel<boolean>('chatOpen', { default: true });
const isDetailOpen = defineModel<boolean>('detailOpen', { default: false });
const mobileView = defineModel<MobileView>('mobileView', { default: 'main' });

const CHAT_WIDTH = ASSISTANT_PANEL_WIDTH;

const isAsideOpen = ref(false);
const chat = useAssistantPanelWidth();
const isSidebarCollapsed = useSidebarCollapsed();

const current = computed(() => props.crumbs.at(-1));
const parents = computed(() => props.crumbs.slice(0, -1));

const mobileTabs = computed(() => {
  const tabs: { view: MobileView; label: string; icon: string }[] = [
    { view: 'main', label: mainTitle.value, icon: 'i-lucide-table-2' },
  ];
  if (slots.chat) {
    tabs.push({ view: 'chat', label: 'Chat', icon: 'i-lucide-bot' });
  }
  if (slots.detail) {
    tabs.push({
      view: 'detail',
      label: detailTitle.value,
      icon: 'i-lucide-panel-bottom',
    });
  }
  return tabs;
});

// El lateral de la app deja su ancho a la tabla y vuelve a como estaba al salir.
let wasSidebarCollapsed = false;
onMounted(() => {
  wasSidebarCollapsed = isSidebarCollapsed.value;
  isSidebarCollapsed.value = true;
});
onBeforeUnmount(() => {
  isSidebarCollapsed.value = wasSidebarCollapsed;
});

/** Escape cierra lo que esté superpuesto, sin tocar lo que está acoplado. */
function closeOverlays() {
  isAsideOpen.value = false;
}
</script>

<template>
  <UDashboardPanel
    :id="id"
    :ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0 overflow-hidden' }"
  >
    <template #body>
      <div class="flex h-full min-h-0 flex-col" @keydown.escape="closeOverlays">
        <header
          class="flex h-14 shrink-0 items-center gap-2 border-b border-default px-3"
        >
          <UDashboardSidebarToggle color="neutral" variant="ghost" />
          <UButton
            v-if="$slots.aside"
            class="touch-target xl:hidden"
            color="neutral"
            variant="ghost"
            icon="i-lucide-panel-left"
            :aria-label="$t('Mostrar {0}', [asideTitle.toLowerCase()])"
            :aria-expanded="isAsideOpen"
            @click="isAsideOpen = !isAsideOpen"
          />

          <nav :aria-label="$t('Dónde estás')" class="min-w-0 flex-1">
            <ol class="flex items-center gap-1.5 text-sm">
              <li
                v-for="crumb in parents"
                :key="crumb.label"
                class="hidden shrink-0 items-center gap-1.5 text-muted sm:flex"
              >
                <NuxtLink
                  v-if="crumb.to"
                  :to="crumb.to"
                  class="focus-ring rounded-sm hover:text-default"
                >
                  {{ crumb.label }}
                </NuxtLink>
                <span v-else>{{ crumb.label }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-3.5" />
              </li>
              <li class="min-w-0">
                <h1
                  class="truncate text-lg font-semibold text-highlighted"
                  data-assistant-route-anchor
                  aria-current="page"
                >
                  {{ current?.label }}
                </h1>
              </li>
            </ol>
          </nav>

          <div class="flex shrink-0 items-center gap-2">
            <slot name="status" />
            <slot name="actions" />
            <UButton
              v-if="$slots.chat"
              class="touch-target max-md:hidden"
              color="neutral"
              :variant="isChatOpen ? 'soft' : 'ghost'"
              icon="i-lucide-bot"
              :aria-label="
                isChatOpen ? $t('Ocultar el chat') : $t('Mostrar el chat')
              "
              :aria-pressed="isChatOpen"
              @click="isChatOpen = !isChatOpen"
            />
          </div>
        </header>

        <div
          v-if="$slots.toolbar"
          class="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-default px-3 py-1.5"
          :class="{ 'max-md:hidden': mobileView !== 'main' }"
        >
          <slot name="toolbar" />
        </div>

        <div class="relative flex min-h-0 flex-1">
          <!-- Lista de hojas o vistas: fija desde 1280, superpuesta por debajo. -->
          <div
            v-if="isAsideOpen"
            class="fixed inset-0 z-(--layer-panel) bg-black/40 xl:hidden"
            aria-hidden="true"
            @click="isAsideOpen = false"
          />
          <aside
            v-if="$slots.aside"
            :aria-label="asideTitle"
            class="w-60 shrink-0 flex-col overflow-y-auto border-e border-default bg-default max-xl:fixed max-xl:inset-y-0 max-xl:start-0 max-xl:z-(--layer-panel) max-xl:w-72 max-xl:animate-fade-in max-xl:shadow-xl xl:flex"
            :class="isAsideOpen ? 'max-xl:flex' : 'max-xl:hidden'"
          >
            <slot name="aside" />
          </aside>

          <div class="flex min-w-0 flex-1 flex-col">
            <main
              class="min-h-0 flex-1 overflow-auto"
              :class="{ 'max-md:hidden': mobileView !== 'main' }"
            >
              <slot />
            </main>

            <!-- Panel inferior: abajo no tapa columnas. En el móvil es una vista. -->
            <section
              v-if="$slots.detail"
              :aria-label="detailTitle"
              class="flex-col overflow-auto border-default md:max-h-[40%] md:border-t"
              :class="[
                mobileView === 'detail'
                  ? 'max-md:flex max-md:flex-1'
                  : 'max-md:hidden',
                isDetailOpen ? 'md:flex' : 'md:hidden',
              ]"
            >
              <slot name="detail" />
            </section>
          </div>

          <!-- Chat: acoplado desde 1024, superpuesto en tableta, vista en el móvil. -->
          <div
            v-if="$slots.chat && isChatOpen"
            class="fixed inset-0 z-(--layer-panel) hidden bg-black/40 md:max-lg:block"
            aria-hidden="true"
            @click="isChatOpen = false"
          />
          <aside
            v-if="$slots.chat"
            :aria-label="$t('Chat del asistente')"
            class="relative min-w-0 flex-col bg-default max-md:flex-1 md:border-s md:border-default md:max-lg:fixed md:max-lg:inset-y-0 md:max-lg:end-0 md:max-lg:z-(--layer-panel) md:max-lg:w-(--chat-width) md:max-lg:max-w-full md:max-lg:animate-panel-in md:max-lg:shadow-xl lg:w-(--chat-width) lg:max-w-[55vw] lg:shrink-0"
            :class="[
              mobileView === 'chat' ? 'max-md:flex' : 'max-md:hidden',
              isChatOpen ? 'md:flex' : 'md:hidden',
            ]"
            :style="{ '--chat-width': `${chat.width.value}rem` }"
          >
            <div
              role="separator"
              tabindex="0"
              aria-orientation="vertical"
              :aria-label="$t('Ancho del chat')"
              :aria-valuemin="CHAT_WIDTH.min"
              :aria-valuemax="CHAT_WIDTH.max"
              :aria-valuenow="chat.width.value"
              class="absolute inset-y-0 -start-1 z-(--layer-bar) hidden w-2 cursor-col-resize touch-none outline-none hover:bg-primary/30 focus-visible:bg-primary/50 lg:block"
              @pointerdown="chat.onPointerDown"
              @keydown="chat.onKeydown"
            />
            <slot name="chat" />
          </aside>
        </div>

        <!-- Móvil: una vista a la vez; la selección se conserva al cambiar. -->
        <nav
          v-if="mobileTabs.length > 1"
          :aria-label="$t('Vistas')"
          class="flex h-14 shrink-0 border-t border-default bg-muted md:hidden"
        >
          <button
            v-for="tab in mobileTabs"
            :key="tab.view"
            type="button"
            class="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-[current=true]:font-medium aria-[current=true]:text-highlighted"
            :aria-current="mobileView === tab.view"
            @click="mobileView = tab.view"
          >
            <UIcon :name="tab.icon" class="size-5" />
            {{ tab.label }}
            <span
              v-if="tab.view === 'chat' && isChatBusy"
              class="absolute end-[calc(50%-1rem)] top-2 size-2 rounded-full bg-ai"
            >
              <span class="sr-only">{{
                $t('El asistente está trabajando')
              }}</span>
            </span>
          </button>
        </nav>
      </div>
    </template>
  </UDashboardPanel>
</template>
