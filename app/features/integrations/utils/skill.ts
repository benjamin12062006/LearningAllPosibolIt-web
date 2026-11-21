import { isRecord } from '../../../utils/guards';

/** Skills que KTSU publica en Integraciones; el sufijo dice para qué canal es. */
export const SKILL_NAMES = ['ktsu-cli', 'ktsu-mcp'] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

export interface SkillFile {
  path: string;
  content: string;
}
export interface PublishedSkill {
  name: SkillName;
  files: SkillFile[];
}
export interface SkillItem {
  label: string;
  id: string;
  file?: SkillFile;
  children?: SkillItem[];
}

const SAFE_PATH =
  /^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*(?:\/[a-z0-9_-]+(?:\.[a-z0-9_-]+)*)*$/iu;

export function parseSkill(
  value: unknown,
  expected: SkillName,
): PublishedSkill | null {
  if (
    !isRecord(value) ||
    value.name !== expected ||
    !Array.isArray(value.files)
  ) {
    return null;
  }
  const files = new Map<string, SkillFile>();
  for (const file of value.files) {
    if (
      !isRecord(file) ||
      typeof file.path !== 'string' ||
      !SAFE_PATH.test(file.path) ||
      typeof file.content !== 'string' ||
      files.has(file.path)
    )
      return null;
    files.set(file.path, { path: file.path, content: file.content });
  }
  if (!files.has('SKILL.md')) return null;
  return { name: expected, files: [...files.values()] };
}

export function skillTree(skill: PublishedSkill): SkillItem[] {
  const root: SkillItem = { id: skill.name, label: skill.name, children: [] };
  for (const file of skill.files) {
    const segments = file.path.split('/');
    const label = segments.pop()!;
    let parent = root;
    for (const directory of segments) {
      const id = `${parent.id}/${directory}`;
      const existing = parent.children?.find(
        (item) => item.id === id && item.children,
      );
      if (existing) {
        parent = existing;
      } else {
        const folder: SkillItem = { label: directory, id, children: [] };
        parent.children?.push(folder);
        parent = folder;
      }
    }
    parent.children?.push({ label, id: `${parent.id}/${label}`, file });
  }
  return [root];
}

/**
 * Texto para pegar en un agente: instrucciones para crear o actualizar la
 * skill y el JSON con sus archivos exactos. Las instrucciones van en líneas
 * simples; la primera línea en blanco separa el texto del JSON.
 */
export function skillClipboard(
  skill: PublishedSkill,
  context: Record<string, string>,
) {
  const tree = JSON.stringify({ version: 1, ...skill, context }, null, 2);
  return [...instructionsFor(skill.name), '', tree].join('\n');
}

function instructionsFor(name: SkillName): string[] {
  const folder = [
    `Instala o actualiza la skill ${name} de KTSU con sus archivos exactos.`,
    `1. Busca la carpeta ${name} en el directorio de skills de tu agente (por ejemplo ~/.claude/skills/${name} en Claude Code o ~/.codex/skills/${name} en Codex). Si no existe, créala. Si existe, actualízala: sustituye sus archivos por los de files y borra los que ya no aparezcan.`,
    '2. Escribe cada files[].content literalmente en files[].path, relativo a esa carpeta, sin cambiar el contenido ni los saltos de línea.',
  ];
  if (name === 'ktsu-cli') {
    return [
      ...folder,
      `3. Comprueba la CLI con Node 24+: desde ${name}/scripts/ktsu-cli ejecuta pnpm run ktsu --help (o node bin/ktsu.mjs --help).`,
      '4. Lee SKILL.md y sigue su recorrido. Usa context para el destino y el proyecto. No pidas ni guardes secretos en el chat.',
    ];
  }
  return [
    ...folder,
    '3. Configura el servidor MCP en este cliente con context.configuration (servidor context.serverName, URL context.mcpUrl). Conserva las demás entradas MCP: añade o actualiza solo esta.',
    '4. Pide a la persona que pulse «Autorizar cuenta para OAuth» en Integraciones → MCP del proyecto y, después, que inicie sesión como indica context.login.',
    '5. Lee SKILL.md y sigue su recorrido: comprueba con get_project_overview que el proyecto es context.projectName. No pidas ni guardes secretos en el chat.',
  ];
}
