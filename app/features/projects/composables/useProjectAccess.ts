/**
 * Organización, rol y permisos de quien mira el proyecto. Se pide una vez por
 * proyecto: las rutas de hojas necesitan la organización y los permisos dicen
 * qué acciones enseñar. Nest vuelve a comprobarlos en cada petición.
 */
export function useProjectAccess(projectId: MaybeRefOrGetter<string>) {
  const { $projects } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `project-access:${toValue(projectId)}`,
    () => $projects.access(toValue(projectId)),
    { server: false },
  );

  const organizationId = computed(() => data.value?.organizationId ?? null);

  function can(permission: string) {
    return data.value?.permissions.includes(permission) ?? false;
  }

  return { access: data, organizationId, can, status, error, refresh };
}
