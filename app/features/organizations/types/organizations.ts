import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';
import { isPageInfo, type PageInfo } from '../../projects/types/projects';

/** Roles cerrados de la API (`organization-roles.ts`), de menos a más. */
export const ORGANIZATION_ROLES = [
  'viewer',
  'editor',
  'manager',
  'admin',
  'owner',
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  viewer: 'Lector',
  editor: 'Editor',
  manager: 'Responsable',
  admin: 'Administrador',
  owner: 'Propietario',
};

/** Qué puede hacer cada rol, según la tabla de docs-diagrams/11. */
export const ROLE_DESCRIPTIONS: Record<OrganizationRole, string> = {
  viewer: 'Solo lee.',
  editor: 'Prepara borradores e importaciones, pero no aprueba.',
  manager: 'Además aprueba y aplica cambios de datos.',
  admin: 'Además gestiona miembros e invitaciones.',
  owner: 'Todo, incluido archivar la organización.',
};

export type OrganizationKind = 'personal' | 'team';

export interface Organization {
  id: string;
  name: string;
  kind: OrganizationKind;
  createdAt: string;
  /** `null` mientras está activa. */
  archivedAt: string | null;
}

/** Una organización vista por uno de sus miembros, con su rol. */
export interface OrganizationMembership extends Organization {
  role: OrganizationRole;
}

export interface OrganizationAccess {
  role: OrganizationRole;
  /** Calculados por la API; la web solo decide qué mostrar. */
  permissions: string[];
}

export interface OrganizationDetail {
  organization: Organization;
  access: OrganizationAccess;
}

export interface OrganizationMember {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: OrganizationRole;
  joinedAt: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  createdAt: string;
  expiresAt: string;
}

/** Respuesta de invitar: la única vez que llega el token. */
export interface CreatedInvitation {
  invitation: OrganizationInvitation;
  token: string;
}

export function canManageMembers(access: OrganizationAccess) {
  return access.permissions.includes('members.manage');
}

export function canOwn(access: OrganizationAccess) {
  return access.permissions.includes('organization.own');
}

export function isArchived(organization: Organization) {
  return organization.archivedAt !== null;
}

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return ORGANIZATION_ROLES.some((role) => role === value);
}

export function isOrganization(value: unknown): value is Organization {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    (value.kind === 'personal' || value.kind === 'team') &&
    isDateString(value.createdAt) &&
    isNullableString(value.archivedAt)
  );
}

export function isOrganizationMembership(
  value: unknown,
): value is OrganizationMembership {
  return (
    isOrganization(value) && isRecord(value) && isOrganizationRole(value.role)
  );
}

export function isOrganizationDetail(
  value: unknown,
): value is OrganizationDetail {
  return (
    isRecord(value) &&
    isOrganization(value.organization) &&
    isRecord(value.access) &&
    isOrganizationRole(value.access.role) &&
    Array.isArray(value.access.permissions) &&
    value.access.permissions.every((item) => typeof item === 'string')
  );
}

export function isOrganizationMember(
  value: unknown,
): value is OrganizationMember {
  return (
    isRecord(value) &&
    isNonEmptyString(value.userId) &&
    isNullableString(value.displayName) &&
    isNullableString(value.email) &&
    isOrganizationRole(value.role) &&
    isDateString(value.joinedAt)
  );
}

export function isOrganizationInvitation(
  value: unknown,
): value is OrganizationInvitation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.email === 'string' &&
    isOrganizationRole(value.role) &&
    isDateString(value.createdAt) &&
    isDateString(value.expiresAt)
  );
}

/** Listas paginadas de la API: `{ <clave>: [...], page }`. */
export function readPagedList<T>(
  value: unknown,
  key: string,
  isItem: (item: unknown) => item is T,
): { items: T[]; page: PageInfo } | null {
  if (!isRecord(value) || !isPageInfo(value.page)) return null;
  const items = value[key];
  if (!Array.isArray(items) || !items.every(isItem)) return null;
  return { items, page: value.page };
}
