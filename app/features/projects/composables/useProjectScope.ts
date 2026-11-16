import { useProjectAccess } from './useProjectAccess';
import type { ProjectScope } from '../types/project-scope';

/** Obtiene el ámbito REST desde el acceso al proyecto de la sesión. */
export function useProjectScope(projectId: MaybeRefOrGetter<string>) {
  const { access, organizationId, can, status, error, refresh } =
    useProjectAccess(projectId);
  const scope = computed<ProjectScope | null>(() => {
    if (organizationId.value === null) return null;
    return {
      organizationId: organizationId.value,
      projectId: toValue(projectId),
    };
  });

  return { scope, access, can, status, error, refresh };
}
