import { isRecord } from '../../../utils/guards';

export interface SkillFile {
  path: string;
  content: string;
}
export interface CliSkill {
  name: 'ktsu-cli';
  files: SkillFile[];
}
export interface SkillItem {
  label: string;
  id: string;
  file?: SkillFile;
  children?: SkillItem[];
}

export function parseCliSkill(value: unknown): CliSkill | null {
  if (
    !isRecord(value) ||
    value.name !== 'ktsu-cli' ||
    !Array.isArray(value.files)
  ) {
    return null;
  }
  const files = new Map<string, SkillFile>();
  for (const file of value.files) {
    if (
      !isRecord(file) ||
      typeof file.path !== 'string' ||
      !/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*(?:\/[a-z0-9_-]+(?:\.[a-z0-9_-]+)*)*$/iu.test(
        file.path,
      ) ||
      typeof file.content !== 'string' ||
      files.has(file.path)
    )
      return null;
    files.set(file.path, { path: file.path, content: file.content });
  }
  if (!files.has('SKILL.md')) return null;
  return { name: 'ktsu-cli', files: [...files.values()] };
}

export function skillTree(skill: CliSkill): SkillItem[] {
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

export function skillClipboard(
  skill: CliSkill,
  context: Record<string, string>,
) {
  const tree = JSON.stringify({ version: 1, ...skill, context }, null, 2);
  // Las instrucciones van en líneas simples: la línea en blanco separa el
  // texto del JSON y permite leerlo sin ambigüedad.
  return [
    `Instala la skill ${skill.name} de KTSU reconstruyendo sus archivos exactos.`,
    `1. Crea la carpeta ${skill.name} en el directorio de skills de tu agente (por ejemplo ~/.claude/skills/${skill.name} en Claude Code o ~/.codex/skills/${skill.name} en Codex). Si ya existe, sustituye solo sus archivos.`,
    '2. Escribe cada files[].content literalmente en files[].path, relativo a esa carpeta, sin cambiar el contenido ni los saltos de línea.',
    `3. Comprueba la CLI con Node 24+: desde ${skill.name}/scripts/ktsu-cli ejecuta pnpm run ktsu --help (o node bin/ktsu.mjs --help).`,
    '4. Lee SKILL.md y sigue su recorrido. Usa context para el destino y el proyecto. No pidas ni guardes secretos en el chat.',
    '',
    tree,
  ].join('\n');
}
