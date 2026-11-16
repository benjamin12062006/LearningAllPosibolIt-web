import { describe, expect, it, vi } from 'vitest';
import { ApiFailure, type ApiClient } from '../../../app/services/api-client';
import { createProjectsService } from '../../../app/features/projects/services/projects';

/** Un cliente que responde lo que se le dé y anota las rutas pedidas. */
function fakeApi(response: unknown) {
  const request = vi.fn(async () => response);
  const api: ApiClient = {
    request,
    requestWithETag: vi.fn(),
  };
  return { api, request };
}

// Forma de `GET /projects/:id/access` en la API (`project-membership.service.ts`).
const ACCESS = {
  actorId: 'u1',
  organizationId: 'o1',
  projectId: 'p/1',
  role: 'editor',
  permissions: ['organization.read', 'worksheet.write', 'ai.use'],
};

describe('createProjectsService · access', () => {
  it('pide el acceso del proyecto y devuelve organización, rol y permisos', async () => {
    const { api, request } = fakeApi({ access: ACCESS });

    const access = await createProjectsService(api).access('p/1');

    expect(request).toHaveBeenCalledWith('/projects/p%2F1/access');
    expect(access).toMatchObject({
      organizationId: 'o1',
      role: 'editor',
      permissions: ['organization.read', 'worksheet.write', 'ai.use'],
    });
  });

  it.each([
    ['sin envoltorio', ACCESS],
    ['sin organización', { access: { ...ACCESS, organizationId: '' } }],
    ['con un rol desconocido', { access: { ...ACCESS, role: 'superuser' } }],
    [
      'con permisos que no son texto',
      { access: { ...ACCESS, permissions: [1] } },
    ],
  ])('rechaza una respuesta %s', async (_case, response) => {
    const { api } = fakeApi(response);

    await expect(
      createProjectsService(api).access('p1'),
    ).rejects.toBeInstanceOf(ApiFailure);
  });
});
