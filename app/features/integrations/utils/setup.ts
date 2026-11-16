export const MCP_CLIENTS = [
  { value: 'codex', label: 'Codex local' },
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'claude-desktop', label: 'Claude Desktop' },
  { value: 'claude-web', label: 'Claude web' },
  { value: 'chatgpt', label: 'ChatGPT web' },
] as const;
export type McpClient = (typeof MCP_CLIENTS)[number]['value'];
export type McpMode = 'local' | 'remote';

interface PublicSetup {
  client: McpClient;
  mode: McpMode;
  oauthResourceUrl: string | null;
  webOrigin: string;
  projectId: string;
}
interface Instructions {
  text: string;
  filename?: string;
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
const LOCAL_ADAPTER = {
  command: '<RUTA_ABSOLUTA_DEL_SERVICIO_AI>/.venv/bin/ktsu-mcp',
  env: {
    KTSU_NEST_URL: 'http://127.0.0.1:8080',
    KTSU_MCP_ADAPTER_TOKEN: '<SECRETO_LOCAL_DEL_ADAPTADOR>',
    KTSU_MCP_CREDENTIAL: '<CREDENCIAL_MCP_DEL_PROYECTO>',
  },
};

export function mcpSetup(input: PublicSetup): Instructions | null {
  const { client, mode } = input;
  const remote = publicUrl(input.oauthResourceUrl, false);
  if (mode === 'remote') return remote ? remoteSetup(client, remote) : null;
  switch (client) {
    case 'codex':
      return {
        text: [
          '[mcp_servers.ktsu]',
          `command = ${JSON.stringify(LOCAL_ADAPTER.command)}`,
          'env_vars = ["KTSU_NEST_URL", "KTSU_MCP_ADAPTER_TOKEN", "KTSU_MCP_CREDENTIAL"]',
        ].join('\n'),
        filename: 'ktsu-mcp.toml',
      };
    case 'claude-code':
    case 'claude-desktop': {
      const env =
        client === 'claude-code'
          ? {
              KTSU_NEST_URL: '${KTSU_NEST_URL}',
              KTSU_MCP_ADAPTER_TOKEN: '${KTSU_MCP_ADAPTER_TOKEN}',
              KTSU_MCP_CREDENTIAL: '${KTSU_MCP_CREDENTIAL}',
            }
          : LOCAL_ADAPTER.env;
      return {
        text: JSON.stringify(
          {
            mcpServers: {
              ktsu: { command: LOCAL_ADAPTER.command, args: [], env },
            },
          },
          null,
          2,
        ),
        filename: 'ktsu-mcp.json',
      };
    }
    default:
      return null;
  }
}

export function cliSetup(apiUrl: string) {
  const api = publicUrl(apiUrl, true);
  const root = api ? new URL(api).origin : '<ORIGEN_API_KTSU>';
  return [
    'npm install -g ./packages/ktsu-cli',
    `ktsu config set --api-url '${root}'`,
    'ktsu auth status',
    'ktsu operations list',
    'ktsu read get_project_overview',
  ].join('\n');
}

export function setupPrompt(input: PublicSetup) {
  const client = MCP_CLIENTS.find((item) => item.value === input.client)?.label;
  const origin = publicUrl(input.webOrigin, true);
  const validProject = /^[a-z0-9-]+$/i.test(input.projectId);
  const address =
    origin && validProject
      ? new URL(`/projects/${input.projectId}/integrations`, origin).href
      : '<URL_DE_INTEGRACIONES>';
  const config = mcpSetup(input);
  const mcp = config
    ? `Revisa las instrucciones de ${client} y el transporte ${input.mode === 'local' ? 'local stdio' : 'remoto HTTPS'} antes de configurar MCP.`
    : `Para ${client}, el transporte seleccionado está pendiente. Comprueba otras opciones en la página.`;
  return [
    'Quiero conectar mi proyecto KTSU con el cliente que estoy usando.',
    `Abre Integraciones en ${address} si tienes navegador. Si no, usa las instrucciones que te comparta desde la pantalla.`,
    'Identifica el cliente y confirma conmigo la organización y el proyecto. Conserva las entradas existentes de configuración.',
    mcp,
    'Comprueba por separado la CLI de KTSU. Si tienes acceso a su paquete privado, usa la configuración y los comandos de lectura de la pantalla.',
    'Indícame dónde autorizar la cuenta o configurar las variables requeridas. Mantén los valores secretos fuera del chat y de archivos compartidos.',
    'Para verificar, descubre las herramientas MCP y realiza una lectura del proyecto. Para la CLI, comprueba la sesión, lista las operaciones y prueba la lectura get_project_overview.',
    'Indica qué conexión quedó verificada y qué autorización o prueba sigue pendiente.',
  ].join('\n\n');
}

function remoteSetup(client: McpClient, url: string): Instructions {
  switch (client) {
    case 'codex':
      return {
        text: `[mcp_servers.ktsu]\nurl = ${JSON.stringify(url)}`,
        filename: 'ktsu-mcp.toml',
      };
    case 'claude-code':
      return {
        text: `claude mcp add --transport http ktsu ${shellArgument(url)}`,
      };
    case 'claude-desktop':
    case 'claude-web':
      return {
        text: `Añade un conector personalizado de Claude con esta URL y completa OAuth con Descope.\n${url}`,
      };
    case 'chatgpt':
      return {
        text: `Añade un servidor MCP personalizado en Plugins con esta URL HTTPS. Completa OAuth con Descope desde un espacio que permita conectores personalizados.\n${url}`,
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
