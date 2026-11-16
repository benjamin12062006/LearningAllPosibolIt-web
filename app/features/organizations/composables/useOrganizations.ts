import { useAccess } from '../../access/composables/useAccess';
import type { OrganizationDetail } from '../types/organizations';

/** Organizaciones de la cuenta, con el rol en cada una. */
export function useOrganizations() {
  const { $organizations } = useNuxtApp();
  const { state } = useAccess();
  const userId = computed(() =>
    state.value.status === 'ready' ? state.value.user.id : 'nadie',
  );

  const { data, status, error, refresh } = useAsyncData(
    () => `organizations:${userId.value}`,
    () => $organizations.list(),
    { server: false },
  );

  const organizations = computed(() => data.value ?? []);

  return { organizations, status, error, refresh };
}

/**
 * Una organización con lo que puedo hacer en ella. Las acciones que la
 * cambian devuelven el detalle nuevo y se guarda sin volver a pedirlo.
 */
export function useOrganization(organizationId: MaybeRefOrGetter<string>) {
  const { $organizations } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `organization:${toValue(organizationId)}`,
    () => $organizations.find(toValue(organizationId)),
    { server: false },
  );

  function replaceDetail(detail: OrganizationDetail) {
    data.value = detail;
  }

  return { detail: data, status, error, refresh, replaceDetail };
}

/** Proyectos de la organización; con E1.2 retirada, solo se abren los propios. */
export function useOrganizationProjects(
  organizationId: MaybeRefOrGetter<string>,
) {
  const { $organizations } = useNuxtApp();

  const { data, status, error } = useAsyncData(
    () => `organization-projects:${toValue(organizationId)}`,
    () => $organizations.projects(toValue(organizationId)),
    { server: false },
  );

  return { projects: computed(() => data.value ?? []), status, error };
}

/** Miembros de la organización con su rol. */
export function useOrganizationMembers(
  organizationId: MaybeRefOrGetter<string>,
) {
  const { $organizations } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `organization-members:${toValue(organizationId)}`,
    () => $organizations.members(toValue(organizationId)),
    { server: false },
  );

  return { members: computed(() => data.value ?? []), status, error, refresh };
}

/** Invitaciones pendientes (sin token: solo llega una vez, al invitar). */
export function useOrganizationInvitations(
  organizationId: MaybeRefOrGetter<string>,
) {
  const { $organizations } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `organization-invitations:${toValue(organizationId)}`,
    () => $organizations.invitations(toValue(organizationId)),
    { server: false },
  );

  return {
    invitations: computed(() => data.value ?? []),
    status,
    error,
    refresh,
  };
}
