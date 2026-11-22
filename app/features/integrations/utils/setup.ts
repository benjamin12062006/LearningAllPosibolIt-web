export const MCP_CLIENTS = [
  { value: 'codex', label: 'Codex' },
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'claude-desktop', label: 'Claude Desktop' },
  { value: 'claude-web', label: 'Claude web' },
  { value: 'chatgpt', label: 'ChatGPT web' },
] as const;
export type McpClient = (typeof MCP_CLIENTS)[number]['value'];

interface McpSetupInput {
  client: McpClient;
  oauthResourceUrl: string | null;
}
/** Cómo añadir el servidor remoto en un cliente y cómo iniciar sesión. */
export interface McpInstructions {
  text: string;
  login: string;
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
const PROJECT_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u;
const SERVER_NAME = 'ktsu-remoto';
const CODEX_LOGIN_SCOPES = 'ktsu:mcp:read,ktsu:mcp:prepare';

/**
 * El MCP de KTSU es solo remoto (HTTP con OAuth de Descope). Sin la URL
 * pública del recurso no hay configuración que ofrecer.
 */
export function mcpSetup(input: McpSetupInput): McpInstructions | null {
  const url = mcpEndpoint(input.oauthResourceUrl);
  return url ? remoteSetup(input.client, url.href, serverNameFor(url)) : null;
}

export function cliProjectContext(
  apiUrl: string,
  webOrigin: string,
  scope: { organizationId: string; projectId: string },
  projectName: string,
) {
  const api = publicUrl(apiUrl, true);
  return {
    ...(api && { apiUrl: new URL(api).origin }),
    ...projectContext(webOrigin, scope, projectName),
  };
}

/** Contexto que acompaña a la skill del MCP al copiarla para un cliente. */
export function mcpProjectContext(
  input: McpSetupInput,
  webOrigin: string,
  scope: { organizationId: string; projectId: string },
  projectName: string,
) {
  const url = mcpEndpoint(input.oauthResourceUrl);
  const instructions = mcpSetup(input);
  const client = MCP_CLIENTS.find((item) => item.value === input.client);
  return {
    ...(url && { mcpUrl: url.href }),
    serverName: serverNameFor(url),
    client: client?.label ?? input.client,
    ...(instructions && {
      configuration: instructions.text,
      login: instructions.login,
    }),
    ...projectContext(webOrigin, scope, projectName),
  };
}

function projectContext(
  webOrigin: string,
  scope: { organizationId: string; projectId: string },
  projectName: string,
) {
  const web = publicUrl(webOrigin, true);
  return {
    ...(web && { webUrl: new URL(web).origin }),
    organizationId: scope.organizationId,
    projectId: scope.projectId,
    projectName,
  };
}

function remoteSetup(
  client: McpClient,
  url: string,
  serverName: string,
): McpInstructions {
  switch (client) {
    case 'codex':
      return {
        text: `[mcp_servers.${serverName}]\nurl = ${JSON.stringify(url)}`,
        login: `Añade el bloque a ~/.codex/config.toml y ejecuta codex mcp login ${serverName} --scopes ${CODEX_LOGIN_SCOPES}.`,
      };
    case 'claude-code':
      return {
        text: `claude mcp add --transport http ${serverName} ${shellArgument(url)}`,
        login: `Abre /mcp en Claude Code, elige ${serverName} y completa el inicio de sesión de Descope.`,
      };
    case 'claude-desktop':
    case 'claude-web':
      return {
        text: `Añade un conector personalizado de Claude con esta URL y completa OAuth con Descope.\n${url}`,
        login: 'Completa OAuth con Descope desde el conector.',
      };
    case 'chatgpt':
      return {
        text: `Añade un servidor MCP personalizado en Plugins con esta URL HTTPS. Completa OAuth con Descope desde un espacio que permita conectores personalizados.\n${url}`,
        login: 'Completa OAuth con Descope desde el servidor personalizado.',
      };
  }
}

function mcpEndpoint(value: string | null) {
  if (!value) return null;
  const url = URL.parse(value);
  if (
    !url ||
    url.protocol !== 'https:' ||
    url.pathname !== '/mcp' ||
    url.username ||
    url.password ||
    url.hash
  )
    return null;
  if (!url.search) return url;
  const projectId = url.searchParams.get('project');
  return url.searchParams.size === 1 && projectId && PROJECT_ID.test(projectId)
    ? url
    : null;
}

function serverNameFor(url: URL | null) {
  const projectId = url?.searchParams.get('project');
  return projectId ? `ktsu-${projectId}` : SERVER_NAME;
}

function publicUrl(value: string | null, allowLocal: boolean) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowed =
      url.protocol === 'https:' ||
      (allowLocal &&
        url.protocol === 'http:' &&
        LOCAL_HOSTS.includes(url.hostname));
    if (!allowed || url.username || url.password || url.search || url.hash)
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function shellArgument(text: string) {
  return "'" + text.replaceAll("'", "'\\''") + "'";
}
