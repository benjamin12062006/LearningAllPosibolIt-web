import { describe, expect, it } from 'vitest';
import { createIntegrationsService } from '../../../app/features/integrations/services/integrations';
import type { Proposal } from '../../../app/features/assistant/types/assistant';
import {
  cliSetup,
  mcpSetup,
  resolveMcpSetup,
  setupPrompt,
} from '../../../app/features/integrations/utils/setup';
import { fakeApi } from '../support/fake-api';

const project = { organizationId: 'organization', projectId: 'the-project' };
const publicSetup = {
  client: 'codex' as const,
  mode: 'remote' as const,
  oauthResourceUrl: 'https://mcp.example/mcp',
  webOrigin: 'https://ktsu.example',
  projectId: project.projectId,
};

describe('configuración pública de las integraciones', () => {
  it('ofrece una plantilla válida para Codex y mantiene fuera de la configuración los secretos', () => {
    const marker = 'SECRET_MARKER_DO_NOT_SHARE';
    const response = { ...publicSetup, issuedToken: marker };
    expect(mcpSetup(response)).toEqual({
      filename: 'ktsu-mcp-remoto.toml',
      text: '[mcp_servers.ktsu-remoto]\nurl = "https://mcp.example/mcp"',
    });
    expect(setupPrompt(response)).toContain(
      '/projects/the-project/integrations',
    );
    expect(
      JSON.stringify(mcpSetup(response)) + setupPrompt(response),
    ).not.toContain(marker);

    const invalid = {
      ...response,
      webOrigin: `https://ktsu.example/?session=${marker}`,
      oauthResourceUrl: `https://mcp.example/mcp?token=${marker}`,
    };
    expect(mcpSetup(invalid)).toBeNull();
    expect(setupPrompt(invalid) + cliSetup(invalid.webOrigin)).not.toContain(
      marker,
    );
  });

  it('deja ChatGPT pendiente para stdio y anuncia Descope para un endpoint remoto', () => {
    expect(
      mcpSetup({ ...publicSetup, client: 'chatgpt', mode: 'local' }),
    ).toBeNull();
    expect(mcpSetup({ ...publicSetup, client: 'chatgpt' })?.text).toContain(
      'Descope',
    );
  });

  it('mantiene visible la guía stdio con una API alojada y explica dónde emitir la credencial', () => {
    const setup = { ...publicSetup, mode: 'local' as const };
    expect(resolveMcpSetup(setup, false)).toMatchObject({
      status: 'local-api-required',
      instructions: { filename: 'ktsu-mcp.toml' },
    });
    expect(resolveMcpSetup(setup, true).status).toBe('ready');
    expect(setupPrompt(setup, false)).toContain(
      'Abre KTSU con la API Nest local',
    );
  });

  it('distingue un cliente sin stdio de un proyecto sin OAuth', () => {
    expect(
      resolveMcpSetup(
        { ...publicSetup, client: 'chatgpt', mode: 'local' },
        true,
      ),
    ).toEqual({ status: 'local-client-unsupported', instructions: null });
    expect(
      resolveMcpSetup({ ...publicSetup, oauthResourceUrl: null }, false),
    ).toEqual({ status: 'remote-resource-required', instructions: null });
    expect(resolveMcpSetup(publicSetup, false).status).toBe('ready');
  });

  it('usa la credencial únicamente en la devolución del alta y confirma el hash visible', async () => {
    const credential = {
      id: 'credential',
      ownerId: 'viewer',
      label: 'Equipo local',
      audience: 'cli',
      capabilities: ['read'],
      status: 'active',
      expiresAt: '2026-11-16T00:00:00Z',
      lastUsedAt: null,
    };
    const issued = fakeApi({ credential, token: 'SECRET_MARKER_DO_NOT_SHARE' });
    await expect(
      createIntegrationsService(issued.api).issue(
        project,
        { label: credential.label, audience: 'cli', capabilities: ['read'] },
        'idem-1',
      ),
    ).resolves.toMatchObject({ token: 'SECRET_MARKER_DO_NOT_SHARE' });
    expect(issued.request).toHaveBeenCalledWith(
      '/organizations/organization/projects/the-project/integrations/credentials',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Idempotency-Key': 'idem-1' },
      }),
    );

    const proposal: Proposal = {
      id: 'proposal',
      operation: 'update',
      summary: 'Cambio',
      hash: 'reviewed',
      status: 'ready',
      target: null,
      result: null,
      expiresAt: '2026-11-16T00:00:00Z',
    };
    const confirmed = fakeApi({
      proposal: { ...proposal, status: 'confirmed' },
    });
    const service = createIntegrationsService(confirmed.api);
    await expect(
      service.decide(project, proposal, 'confirm'),
    ).resolves.toMatchObject({ status: 'confirmed' });
    expect(confirmed.request).toHaveBeenCalledWith(
      '/organizations/organization/projects/the-project/integrations/proposals/proposal/confirm',
      {
        method: 'POST',
        body: { proposalHash: 'reviewed' },
      },
    );
    await service.revoke(project, credential.id);
    expect(confirmed.request).toHaveBeenLastCalledWith(
      '/organizations/organization/projects/the-project/integrations/credentials/credential/revoke',
      { method: 'POST' },
    );
  });
});
