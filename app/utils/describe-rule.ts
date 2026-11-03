import {
  ATTRIBUTE_LABELS,
  OPERATOR_LABELS,
  type Rule,
} from '../types/rulesets';

/** Una regla en una frase, para leer una revisión sin conocer el JSON. */
export function describeRule(rule: Rule): string {
  if (rule.type === 'clean_text') {
    return `Limpiar espacios y saltos de línea en ${listOf(rule.attributes.map(labelOf))}`;
  }
  if (rule.type === 'build_title') {
    return `Construir el título con «${rule.template}»`;
  }
  const condition = `${labelOf(rule.attribute)} ${OPERATOR_LABELS[rule.operator]}`;
  if (rule.operator === 'is_empty') return `Excluir si ${condition}`;
  return `Excluir si ${condition} «${rule.value}»`;
}

export const RULE_TYPE_LABELS: Record<Rule['type'], string> = {
  clean_text: 'Limpiar texto',
  build_title: 'Construir título',
  exclude_when: 'Excluir filas',
};

export const RULE_TYPE_ICONS: Record<Rule['type'], string> = {
  clean_text: 'i-lucide-eraser',
  build_title: 'i-lucide-heading',
  exclude_when: 'i-lucide-filter-x',
};

function labelOf(attribute: keyof typeof ATTRIBUTE_LABELS) {
  return ATTRIBUTE_LABELS[attribute].toLowerCase();
}

/** «a», «a y b», «a, b y c». */
function listOf(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}
