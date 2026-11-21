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
const SERVER_NAME = 'ktsu-remoto';

/**
 * El MCP de KTSU es solo remoto (HTTP con OAuth de Descope). Sin la URL
 * pública del recurso no hay configuración que ofrecer.
 */
export function mcpSetup(input: McpSetupInput): McpInstructions | null {
  const url = publicUrl(input.oauthResourceUrl, false);
  return url ? remoteSetup(input.client, url) : null;
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
  const url = publicUrl(input.oauthResourceUrl, false);
  const instructions = mcpSetup(input);
  const client = MCP_CLIENTS.find((item) => item.value === input.client);
  return {
    ...(url && { mcpUrl: url }),
    serverName: SERVER_NAME,
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

function remoteSetup(client: McpClient, url: string): McpInstructions {
  switch (client) {
    case 'codex':
      return {
        text: `[mcp_servers.${SERVER_NAME}]\nurl = ${JSON.stringify(url)}`,
        login: `Añade el bloque a ~/.codex/config.toml y ejecuta codex mcp login ${SERVER_NAME}.`,
      };
    case 'claude-code':
      return {
        text: `claude mcp add --transport http ${SERVER_NAME} ${shellArgument(url)}`,
        login: `Abre /mcp en Claude Code, elige ${SERVER_NAME} y completa el inicio de sesión de Descope.`,
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
