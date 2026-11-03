<!-- Una revisión como fila Focus: número, cuántos datos mapea y cuántas reglas aplica. -->
<script setup lang="ts">
import { PRODUCT_ATTRIBUTES, type RulesetVersion } from '../types/rulesets';

const props = defineProps<{
  ruleset: RulesetVersion;
  to: string;
  latest: boolean;
}>();

const detail = computed(() => {
  const { mapping, rules } = props.ruleset;
  const ruleCount = rules.length === 1 ? '1 regla' : `${rules.length} reglas`;
  return `${mapping.length} de ${PRODUCT_ATTRIBUTES.length} datos mapeados · ${ruleCount} · ${formatDate(props.ruleset.createdAt)}`;
});
</script>

<template>
  <NuxtLink
    :to="to"
    class="focus-row group -mx-2 rounded-md px-2 transition-colors hover:bg-elevated/40"
  >
    <UIcon
      name="i-lucide-git-commit-horizontal"
      class="size-5 shrink-0 text-dimmed"
    />
    <span class="min-w-0 flex-1">
      <span class="block text-sm text-default">
        Revisión {{ ruleset.revision }}
      </span>
      <span class="block truncate text-xs text-muted">{{ detail }}</span>
    </span>
    <UBadge v-if="latest" color="primary" variant="subtle" size="sm">
      La más reciente
    </UBadge>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 text-dimmed opacity-0 transition-opacity group-hover:opacity-100"
    />
  </NuxtLink>
</template>
