import {
  ATTRIBUTE_LABELS,
  OPERATOR_LABELS,
  type Rule,
} from '../types/rulesets';

/** Una regla en una frase, para leer una revisión sin conocer el JSON. */
export function describeRule(
  rule: Rule,
  t: (text: string, values?: readonly unknown[]) => string = spanish,
  language: 'en' | 'es' = 'es',
): string {
  const labelOf = (attribute: keyof typeof ATTRIBUTE_LABELS) =>
    t(ATTRIBUTE_LABELS[attribute]).toLowerCase();
  if (rule.type === 'clean_text') {
    const list = new Intl.ListFormat(language).format(
      rule.attributes.map(labelOf),
    );
    return t('Limpiar espacios y saltos de línea en {0}', [list]);
  }
  if (rule.type === 'build_title') {
    return t('Construir el título con «{0}»', [rule.template]);
  }
  const condition = `${labelOf(rule.attribute)} ${t(OPERATOR_LABELS[rule.operator])}`;
  if (rule.operator === 'is_empty') return t('Excluir si {0}', [condition]);
  return t('Excluir si {0} «{1}»', [condition, rule.value]);
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

function spanish(text: string, values: readonly unknown[] = []) {
  return text.replace(/\{(\d+)\}/gu, (_, index: string) =>
    String(values[Number(index)] ?? ''),
  );
}
