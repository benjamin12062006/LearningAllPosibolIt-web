import { isNonEmptyString, isRecord } from '../../../utils/guards';
import {
  isOrganizationRole,
  type OrganizationRole,
} from '../../organizations/types/organizations';

/**
 * Qué puede hacer quien mira un proyecto (`GET /projects/:id/access`). Las
 * rutas de hojas necesitan `organizationId`; los permisos dicen qué botones
 * mostrar. Nest vuelve a comprobarlos en cada petición.
 */
export interface ProjectAccess {
  organizationId: string;
  role: OrganizationRole;
  /** Como `worksheet.write` o `changeset.approve` (`organization-roles.ts` de la API). */
  permissions: string[];
}

export function isProjectAccess(value: unknown): value is ProjectAccess {
  return (
    isRecord(value) &&
    isNonEmptyString(value.organizationId) &&
    isOrganizationRole(value.role) &&
    Array.isArray(value.permissions) &&
    value.permissions.every((permission) => typeof permission === 'string')
  );
}
