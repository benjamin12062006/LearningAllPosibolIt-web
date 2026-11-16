import type { RulesetVersion } from '../types/rulesets';

/** Revisiones de reglas de un proyecto, de la más reciente a la más antigua. */
export function useRulesets(projectId: MaybeRefOrGetter<string>) {
  const { $rulesets } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `rulesets:${toValue(projectId)}`,
    () => $rulesets.list(toValue(projectId)),
    { server: false },
  );

  const rulesets = computed<RulesetVersion[]>(() => data.value?.rulesets ?? []);
  const hasMore = computed(() => data.value?.page.hasMore ?? false);

  return { rulesets, hasMore, status, error, refresh };
}

/** Una revisión concreta, para leerla o usarla como base de la siguiente. */
export function useRuleset(
  projectId: MaybeRefOrGetter<string>,
  revision: MaybeRefOrGetter<number>,
) {
  const { $rulesets } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `ruleset:${toValue(projectId)}:${toValue(revision)}`,
    () => $rulesets.find(toValue(projectId), toValue(revision)),
    { server: false },
  );

  return { ruleset: data, status, error, refresh };
}
