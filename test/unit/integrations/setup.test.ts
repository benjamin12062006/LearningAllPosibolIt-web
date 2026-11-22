import { describe, expect, it } from 'vitest';
import { createIntegrationsService } from '../../../app/features/integrations/services/integrations';
import type { Proposal } from '../../../app/features/assistant/types/assistant';
import {
  cliProjectContext,
  MCP_CLIENTS,
  mcpProjectContext,
  mcpSetup,
} from '../../../app/features/integrations/utils/setup';
import {
  parseSkill,
  skillClipboard,
  skillTree,
} from '../../../app/features/integrations/utils/skill';
import { fakeApi } from '../support/fake-api';

const project = { organizationId: 'organization', projectId: 'the-project' };
const remote = {
  client: 'codex' as const,
  oauthResourceUrl: 'https://mcp.example/mcp',
};

function pasted(clipboard: string) {
  return JSON.parse(clipboard.slice(clipboard.indexOf('\n\n') + 2));
}

describe('configuración pública de las integraciones', () => {
  it('ofrece solo el MCP remoto y mantiene fuera de la configuración los secretos', () => {
    const marker = 'SECRET_MARKER_DO_NOT_SHARE';
    expect(mcpSetup(remote)).toEqual({
      text: '[mcp_servers.ktsu-remoto]\nurl = "https://mcp.example/mcp"',
      login:
        'Añade el bloque a ~/.codex/config.toml y ejecuta codex mcp login ktsu-remoto --scopes ktsu:mcp:read,ktsu:mcp:prepare.',
    });
    for (const { value } of MCP_CLIENTS) {
      const instructions = mcpSetup({ ...remote, client: value });
      expect(instructions?.text).toContain('https://mcp.example/mcp');
      expect(JSON.stringify(instructions)).not.toMatch(
        /stdio|KTSU_MCP_|\.venv/u,
      );
    }
    expect(mcpSetup({ ...remote, oauthResourceUrl: null })).toBeNull();
    expect(
      mcpSetup({
        ...remote,
        oauthResourceUrl: `https://mcp.example/mcp?token=${marker}`,
      }),
    ).toBeNull();
    const context = mcpProjectContext(
      {
        ...remote,
        oauthResourceUrl: `https://mcp.example/mcp?token=${marker}`,
      },
      `https://ktsu.example/?session=${marker}`,
      project,
      'Proyecto',
    );
    expect(
      JSON.stringify(context) +
        JSON.stringify(
          cliProjectContext(
            `https://ktsu.example/?session=${marker}`,
            `https://ktsu.example/?session=${marker}`,
            project,
            'Proyecto',
          ),
        ),
    ).not.toContain(marker);
  });

  it('usa una URL y un nombre propios para cada proyecto del MCP', () => {
    const projectId = 'df68e46b-8e43-4a32-8ed1-da5405e2273c';
    const url = `https://mcp.example/mcp?project=${projectId}`;
    const scoped = { ...remote, oauthResourceUrl: url };
    const context = mcpProjectContext(
      scoped,
      'https://ktsu.example',
      project,
      'Proyecto',
    );
    expect(context.mcpUrl).toBe(url);
    expect(context.serverName).toBe(`ktsu-${projectId}`);
    expect(context.configuration).toContain(`[mcp_servers.ktsu-${projectId}]`);
    expect(context.login).toContain(`codex mcp login ktsu-${projectId}`);
    expect(
      mcpSetup({ ...scoped, oauthResourceUrl: `${url}&project=${projectId}` }),
    ).toBeNull();
    expect(
      mcpSetup({ ...scoped, oauthResourceUrl: `${url}&token=secret` }),
    ).toBeNull();
  });

  it('copia la skill del MCP con la configuración del cliente elegido', async () => {
    const document = {
      name: 'ktsu-mcp',
      files: [
        { path: 'SKILL.md', content: '# MCP\n' },
        { path: 'references/conexion.md', content: 'Conexión\n' },
      ],
    };
    const skill = await createIntegrationsService(fakeApi(document).api).skill(
      project,
      'ktsu-mcp',
    );
    const context = mcpProjectContext(
      { ...remote, client: 'claude-code' },
      'https://ktsu.example',
      project,
      'Prueba',
    );
    expect(context).toMatchObject({
      mcpUrl: 'https://mcp.example/mcp',
      serverName: 'ktsu-remoto',
      client: 'Claude Code',
      configuration:
        "claude mcp add --transport http ktsu-remoto 'https://mcp.example/mcp'",
      webUrl: 'https://ktsu.example',
      projectName: 'Prueba',
    });
    const clipboard = skillClipboard(skill, context);
    expect(pasted(clipboard)).toMatchObject({ ...document, context });
    expect(clipboard).toContain('Si no existe, créala. Si existe, actualízala');
    expect(clipboard).toContain('context.configuration');
    expect(clipboard).not.toContain('pnpm run ktsu');
    expect(parseSkill(document, 'ktsu-cli')).toBeNull();
  });

  it('reconstruye la skill de la CLI, conservando rutas y saltos de línea', async () => {
    const document = {
      name: 'ktsu-cli',
      files: [
        { path: 'SKILL.md', content: '# CLI\n' },
        {
          path: 'scripts/ktsu-cli/bin/ktsu.mjs',
          content: 'const value = "hola";\n',
        },
        { path: 'references/feed.md', content: 'Feed\n' },
      ],
    };
    const fake = fakeApi(document);
    const skill = await createIntegrationsService(fake.api).skill(
      project,
      'ktsu-cli',
    );
    expect(fake.request).toHaveBeenCalledWith(
      '/organizations/organization/projects/the-project/integrations/cli-skill',
    );
    expect(skillTree(skill)[0]?.children?.map((item) => item.label)).toEqual([
      'SKILL.md',
      'scripts',
      'references',
    ]);
    const clipboard = skillClipboard(skill, { projectId: 'a-project' });
    expect(pasted(clipboard)).toMatchObject(document);
    expect(clipboard).toContain('~/.claude/skills/ktsu-cli');
    expect(clipboard).toContain('pnpm run ktsu --help');
    expect(
      parseSkill(
        {
          ...document,
          files: [...document.files, { path: '../.env', content: 'secret' }],
        },
        'ktsu-cli',
      ),
    ).toBeNull();
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
