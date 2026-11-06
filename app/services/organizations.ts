import {
  isOrganizationDetail,
  isOrganizationInvitation,
  isOrganizationMember,
  isOrganizationMembership,
  readPagedList,
  type CreatedInvitation,
  type OrganizationDetail,
  type OrganizationInvitation,
  type OrganizationMember,
  type OrganizationMembership,
  type OrganizationRole,
} from '../types/organizations';
import { isProject, type Project } from '../types/projects';
import { isRecord } from '../utils/guards';
import { invalidResponse, type ApiClient } from './api-client';

/** Organizaciones, miembros e invitaciones son pocos; 100 es el máximo de la API. */
const LIST_LIMIT = 100;

export function createOrganizationsService(api: ApiClient) {
  return {
    async list(): Promise<OrganizationMembership[]> {
      const response = await api.request('/organizations', {
        query: { limit: LIST_LIMIT },
      });
      return itemsOf(response, 'organizations', isOrganizationMembership);
    },

    /** De equipo; quien la crea queda como propietario. */
    async create(name: string): Promise<OrganizationDetail> {
      const response = await api.request('/organizations', {
        method: 'POST',
        body: { name },
      });
      return readDetail(response);
    },

    async find(organizationId: string): Promise<OrganizationDetail> {
      return readDetail(await api.request(organizationPath(organizationId)));
    },

    async setArchived(
      organizationId: string,
      archived: boolean,
    ): Promise<OrganizationDetail> {
      const action = archived ? 'archive' : 'restore';
      const response = await api.request(
        `${organizationPath(organizationId)}/${action}`,
        { method: 'POST' },
      );
      return readDetail(response);
    },

    async projects(organizationId: string): Promise<Project[]> {
      const response = await api.request(
        `${organizationPath(organizationId)}/projects`,
        { query: { limit: LIST_LIMIT } },
      );
      return itemsOf(response, 'projects', isProject);
    },

    async members(organizationId: string): Promise<OrganizationMember[]> {
      const response = await api.request(
        `${organizationPath(organizationId)}/members`,
        { query: { limit: LIST_LIMIT } },
      );
      return itemsOf(response, 'members', isOrganizationMember);
    },

    async changeRole(
      organizationId: string,
      userId: string,
      role: OrganizationRole,
    ): Promise<OrganizationMember> {
      const response = await api.request(memberPath(organizationId, userId), {
        method: 'PATCH',
        body: { role },
      });
      if (isRecord(response) && isOrganizationMember(response.member)) {
        return response.member;
      }
      throw invalidResponse();
    },

    /** Con el propio `userId` es salir de la organización. */
    async removeMember(organizationId: string, userId: string): Promise<void> {
      await api.request(memberPath(organizationId, userId), {
        method: 'DELETE',
      });
    },

    async invite(
      organizationId: string,
      invitation: { email: string; role: OrganizationRole },
    ): Promise<CreatedInvitation> {
      const response = await api.request(
        `${organizationPath(organizationId)}/invitations`,
        { method: 'POST', body: { ...invitation } },
      );
      if (
        isRecord(response) &&
        isOrganizationInvitation(response.invitation) &&
        typeof response.token === 'string'
      ) {
        return { invitation: response.invitation, token: response.token };
      }
      throw invalidResponse();
    },

    async invitations(
      organizationId: string,
    ): Promise<OrganizationInvitation[]> {
      const response = await api.request(
        `${organizationPath(organizationId)}/invitations`,
        { query: { limit: LIST_LIMIT } },
      );
      return itemsOf(response, 'invitations', isOrganizationInvitation);
    },

    async revokeInvitation(
      organizationId: string,
      invitationId: string,
    ): Promise<void> {
      await api.request(
        `${organizationPath(organizationId)}/invitations/${encodeURIComponent(invitationId)}`,
        { method: 'DELETE' },
      );
    },

    /** Exige entrar con el mismo correo invitado. */
    async acceptInvitation(token: string): Promise<OrganizationDetail> {
      const response = await api.request('/invitations/accept', {
        method: 'POST',
        body: { token },
      });
      return readDetail(response);
    },
  };
}

export type OrganizationsService = ReturnType<
  typeof createOrganizationsService
>;

function itemsOf<T>(
  response: unknown,
  key: string,
  isItem: (item: unknown) => item is T,
): T[] {
  const list = readPagedList(response, key, isItem);
  if (!list) throw invalidResponse();
  return list.items;
}

function readDetail(response: unknown): OrganizationDetail {
  if (isOrganizationDetail(response)) return response;
  throw invalidResponse();
}

function organizationPath(organizationId: string) {
  return `/organizations/${encodeURIComponent(organizationId)}`;
}

function memberPath(organizationId: string, userId: string) {
  return `${organizationPath(organizationId)}/members/${encodeURIComponent(userId)}`;
}
