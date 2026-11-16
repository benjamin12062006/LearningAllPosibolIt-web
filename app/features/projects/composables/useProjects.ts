import { useAccess } from '../../access/composables/useAccess';
import type { Project } from '../types/projects';

/**
 * Proyectos de la cuenta, compartidos por el lateral y las páginas.
 *
 * Como en el curso, se devuelve `data`, `status`, `error` y `refresh`; pero la
 * carga es solo de cliente (`server: false`): el token Descope no existe en el
 * servidor. La clave incluye el usuario para no mostrar datos de otra cuenta.
 */
export function useProjects() {
  const { $projects } = useNuxtApp();
  const userId = useCurrentUserId();

  const { data, status, error, refresh } = useAsyncData(
    () => `projects:${userId.value ?? 'nadie'}`,
    () => $projects.list(),
    { server: false },
  );

  const projects = computed<Project[]>(() => data.value?.projects ?? []);
  const hasMore = computed(() => data.value?.page.hasMore ?? false);
  const readyCount = computed(() => projects.value.filter(isConfigured).length);

  return { projects, hasMore, readyCount, status, error, refresh };
}

/** Un proyecto concreto, para su página y su formulario de edición. */
export function useProject(projectId: MaybeRefOrGetter<string>) {
  const { $projects } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `project:${toValue(projectId)}`,
    () => $projects.find(toValue(projectId)),
    { server: false },
  );

  return { project: data, status, error, refresh };
}

export function isConfigured(project: Project) {
  return project.configurationStatus === 'ready';
}

function useCurrentUserId() {
  const { state } = useAccess();
  return computed(() =>
    state.value.status === 'ready' ? state.value.user.id : null,
  );
}
