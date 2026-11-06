<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui';

/**
 * Espacio de trabajo como en el curso (UDashboardGroup + Sidebar + Panel) con
 * la estética Focus: lateral gris violáceo, tarjetas resumen y listas con contador.
 * Como en el curso, el grupo recuerda en el navegador el tamaño del lateral.
 */
const { state: access, actions } = useAccess();
const { projects, readyCount } = useProjects();
const colorMode = useColorMode();

const user = computed(() =>
  access.value.status === 'ready' ? access.value.user : null,
);
const userName = computed(
  () => user.value?.displayName ?? user.value?.email ?? 'Tu cuenta',
);
const pendingCount = computed(() => projects.value.length - readyCount.value);

const workspaceItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Proyectos',
    icon: 'i-lucide-folder-kanban',
    to: '/projects',
    exact: true,
    badge: String(projects.value.length),
  },
  { label: 'Nuevo proyecto', icon: 'i-lucide-plus', to: '/projects/new' },
  {
    label: 'Organizaciones',
    icon: 'i-lucide-building-2',
    to: '/organizations',
  },
]);

const accountItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: 'Cuenta', icon: 'i-lucide-user', to: '/account' }],
  [
    {
      label: colorMode.value === 'dark' ? 'Modo claro' : 'Modo oscuro',
      icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: toggleColorMode,
    },
  ],
  [
    {
      label: 'Cerrar sesión',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => void actions.signOut(),
    },
  ],
]);

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <UDashboardGroup unit="rem" storage="local" storage-key="lateral">
    <UDashboardSidebar
      id="lateral"
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
          <span v-if="!collapsed">Estadística</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <!-- Tarjetas resumen, como «All» e «Inbox» en la referencia. -->
        <div v-if="!collapsed" class="grid grid-cols-2 gap-2">
          <SidebarSummary
            :to="{ path: '/projects', query: { estado: 'listos' } }"
            icon="i-lucide-folder-check"
            label="Listos"
            :count="readyCount"
          />
          <SidebarSummary
            :to="{ path: '/projects', query: { estado: 'por-configurar' } }"
            icon="i-lucide-settings-2"
            label="Por configurar"
            :count="pendingCount"
          />
        </div>

        <div>
          <p v-if="!collapsed" class="focus-section-label mb-1 px-2.5">
            Espacio
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
          <p class="focus-section-label mb-1 px-2.5">Proyectos</p>
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

      <template #footer="{ collapsed }">
        <UDropdownMenu
          :items="accountItems"
          :content="{ align: 'start', side: 'top' }"
          class="w-full"
        >
          <UButton
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="justify-start gap-2.5"
            :aria-label="`Menú de ${userName}`"
          >
            <UAvatar :alt="userName" size="sm" />
            <span v-if="!collapsed" class="min-w-0 flex-1 text-left">
              <span class="block truncate text-sm text-default">{{
                userName
              }}</span>
              <span
                v-if="user?.email"
                class="block truncate text-xs text-muted"
                >{{ user.email }}</span
              >
            </span>
            <UIcon
              v-if="!collapsed"
              name="i-lucide-chevrons-up-down"
              class="size-4 text-dimmed"
            />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <!-- Las páginas solo se montan con la sesión lista: así ya tienen token. -->
    <slot v-if="access.status === 'ready'" />
    <div v-else class="flex flex-1 items-center justify-center">
      <SessionProgress />
    </div>
  </UDashboardGroup>
</template>
