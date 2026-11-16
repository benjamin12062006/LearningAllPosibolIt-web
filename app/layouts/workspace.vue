<script setup lang="ts">
import { useAccess } from '../features/access/composables/useAccess';
import { useProjects } from '../features/projects/composables/useProjects';
import { provideAssistantWorkspace } from '../features/assistant/composables/useAssistantWorkspace';
import type { NavigationMenuItem } from '@nuxt/ui';

/**
 * Espacio de trabajo como en el curso (UDashboardGroup + Sidebar + Panel) con
 * la estética Focus: lateral gris violáceo, tarjetas resumen y listas con contador.
 * Como en el curso, el grupo recuerda en el navegador el tamaño del lateral.
 */
const { state: access } = useAccess();
const { t } = useAppLocale();
const { projects, readyCount } = useProjects();
const route = useRoute();
const assistant = provideAssistantWorkspace();
const assistantMounted = ref(false);
const recentProjectId = ref('');
const historyDock = ref<HTMLElement | null>(null);
const isChatsPage = computed(() => route.path === '/chats');
const routeProjectId = computed(() => {
  if (
    route.path.startsWith('/projects/') &&
    typeof route.params.id === 'string'
  )
    return route.params.id;
  if (isChatsPage.value && typeof route.query.project === 'string')
    return route.query.project;
  return '';
});
watch(
  routeProjectId,
  (id) => {
    if (id) recentProjectId.value = id;
  },
  { immediate: true },
);
const assistantProjectId = computed(
  () =>
    routeProjectId.value ||
    recentProjectId.value ||
    projects.value[0]?.id ||
    '',
);
watchEffect(() => {
  assistant.hasProject.value = Boolean(assistantProjectId.value);
});
const projectOptions = computed(() =>
  projects.value.map((project) => ({
    label: project.name,
    value: project.id,
  })),
);
const chatsLink = computed(() => ({
  path: '/chats',
  query: assistantProjectId.value ? { project: assistantProjectId.value } : {},
}));

function changeChatProject(projectId: string) {
  void navigateTo({ path: '/chats', query: { project: projectId } });
}
// Un espacio de datos lo pliega al entrar para dejar sitio a la tabla.
const isSidebarCollapsed = useSidebarCollapsed();
watch(
  isChatsPage,
  (isOpen) => {
    if (isOpen) isSidebarCollapsed.value = false;
  },
  { flush: 'post' },
);
onMounted(() => {
  if (isChatsPage.value) isSidebarCollapsed.value = false;
});

const user = computed(() =>
  access.value.status === 'ready' ? access.value.user : null,
);
const userName = computed(
  () => user.value?.displayName ?? user.value?.email ?? t('Tu cuenta'),
);
const pendingCount = computed(() => projects.value.length - readyCount.value);

const workspaceItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t('Proyectos'),
    icon: 'i-lucide-folder-kanban',
    to: '/projects',
    exact: true,
    badge: String(projects.value.length),
  },
  { label: 'Chats', icon: 'i-lucide-messages-square', to: chatsLink.value },
  { label: t('Nuevo proyecto'), icon: 'i-lucide-plus', to: '/projects/new' },
  {
    label: t('Organizaciones'),
    icon: 'i-lucide-building-2',
    to: '/organizations',
  },
]);
</script>

<template>
  <UDashboardGroup
    unit="rem"
    storage="local"
    storage-key="lateral"
    :storage-options="{ initOnMounted: true }"
  >
    <UDashboardSidebar
      id="lateral"
      v-model:collapsed="isSidebarCollapsed"
      collapsible
      resizable
      :default-size="17"
      :min-size="15"
      :max-size="22"
      :ui="{
        root: 'bg-muted border-e-0',
        content: 'bg-muted',
        header: 'h-14',
        footer: 'border-t border-black/10 py-3',
      }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/projects"
          class="flex items-center gap-2 text-sm font-medium text-toned"
        >
          <UIcon
            name="i-lucide-chart-no-axes-column"
            class="size-5 text-primary"
          />
          <span v-if="!collapsed">{{ $t('Estadística') }}</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <div v-if="isChatsPage" class="space-y-3">
          <UButton
            to="/projects"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :square="collapsed"
            :aria-label="$t('Volver a proyectos')"
          >
            <span v-if="!collapsed">{{ $t('Volver a proyectos') }}</span>
          </UButton>
          <USelectMenu
            v-if="!collapsed && projectOptions.length"
            :model-value="assistantProjectId"
            :items="projectOptions"
            value-key="value"
            :aria-label="$t('Proyecto del chat')"
            class="w-full"
            @update:model-value="changeChatProject"
          />
          <div v-show="!collapsed" ref="historyDock" />
        </div>
        <template v-else>
          <!-- Tarjetas resumen, como «All» e «Inbox» en la referencia. -->
          <div v-if="!collapsed" class="grid grid-cols-2 gap-2">
            <SidebarSummary
              :to="{ path: '/projects', query: { estado: 'listos' } }"
              icon="i-lucide-folder-check"
              :label="$t('Listos')"
              :count="readyCount"
            />
            <SidebarSummary
              :to="{ path: '/projects', query: { estado: 'por-configurar' } }"
              icon="i-lucide-settings-2"
              :label="$t('Por configurar')"
              :count="pendingCount"
            />
          </div>

          <div>
            <p v-if="!collapsed" class="focus-section-label mb-1 px-2.5">
              {{ $t('Espacio') }}
            </p>
            <UNavigationMenu
              :items="workspaceItems"
              orientation="vertical"
              :collapsed="collapsed"
              tooltip
              :ui="{
                link: 'py-1.5 data-active:before:bg-elevated',
                linkTrailingBadge: 'bg-transparent text-dimmed font-normal',
              }"
            />
          </div>

          <div v-if="!collapsed && projects.length > 0">
            <p class="focus-section-label mb-1 px-2.5">{{ $t('Proyectos') }}</p>
            <ul>
              <li v-for="project in projects" :key="project.id">
                <NuxtLink
                  :to="`/projects/${project.id}`"
                  active-class="bg-elevated"
                  class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-default transition-colors hover:bg-elevated/60"
                >
                  <ProjectStatusDot :project="project" />
                  <span class="flex-1 truncate">{{ project.name }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </template>
      </template>

      <template #footer="{ collapsed }">
        <UButton
          to="/settings"
          color="neutral"
          variant="ghost"
          block
          :square="collapsed"
          :aria-label="t('Configuración')"
          class="min-w-0 justify-start gap-2.5 px-2.5 py-1.5"
        >
          <UAvatar :alt="userName" size="xs" />
          <span
            v-if="!collapsed"
            class="min-w-0 flex-1 truncate text-left text-xs"
          >
            {{ t('Configuración') }}
          </span>
          <UIcon
            v-if="!collapsed"
            name="i-lucide-settings"
            class="size-3.5 text-dimmed"
          />
        </UButton>
      </template>
    </UDashboardSidebar>

    <!-- Las páginas solo se montan con la sesión lista: así ya tienen token. -->
    <template v-if="access.status === 'ready'">
      <slot />
      <LazyAssistantWorkspace
        v-if="
          assistantProjectId &&
          (assistant.open.value || isChatsPage || assistantMounted)
        "
        :key="assistantProjectId"
        :project-id="assistantProjectId"
        :full-page="isChatsPage"
        :history-dock="historyDock"
        @ready="assistantMounted = true"
      />
      <UDashboardPanel v-else-if="isChatsPage" id="chats-empty">
        <template #header>
          <UDashboardNavbar title="Chats"
            ><template #leading><UDashboardSidebarToggle /></template
          ></UDashboardNavbar>
        </template>
        <template #body>
          <p class="text-sm text-muted">
            {{ $t('El historial aparece cuando tienes acceso a un proyecto.') }}
          </p>
        </template>
      </UDashboardPanel>
    </template>
    <div v-else class="flex flex-1 items-center justify-center">
      <SessionProgress />
    </div>
  </UDashboardGroup>
</template>
