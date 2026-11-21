<script setup lang="ts">
import type { ProjectScope } from '../../projects/types/project-scope';
import {
  skillClipboard,
  skillTree,
  type SkillItem,
  type SkillName,
} from '../utils/skill';

/**
 * Muestra una skill publicada por KTSU y la deja copiar entera para que un
 * agente la cree o la actualice. La skill se carga al montar para que el botón
 * de copiar tenga el texto listo en el momento del clic.
 */
const props = defineProps<{
  scope: ProjectScope;
  skillName: SkillName;
  context: Record<string, string>;
  copyLabel: string;
}>();
const { $integrations } = useNuxtApp();
const selected = shallowRef<SkillItem>();
const {
  data: skill,
  status,
  error,
  refresh,
} = useAsyncData(
  () =>
    `skill:${props.skillName}:${props.scope.organizationId}:${props.scope.projectId}`,
  () => $integrations.skill(props.scope, props.skillName),
  { server: false },
);
const tree = computed(() => (skill.value ? skillTree(skill.value) : []));
const file = computed(
  () =>
    selected.value?.file ??
    skill.value?.files.find((entry) => entry.path === 'SKILL.md'),
);
const clipboard = computed(() =>
  skill.value ? skillClipboard(skill.value, props.context) : '',
);
const expanded = computed(() => [
  props.skillName,
  `${props.skillName}/references`,
  `${props.skillName}/scripts`,
]);
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <UiCopyButton :text="clipboard" :label="copyLabel" />
      <USkeleton v-if="status === 'pending'" class="h-8 w-32" />
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="$t('No se pudo cargar la skill')"
      :actions="[{ label: $t('Reintentar'), onClick: () => refresh() }]"
    />
    <details v-else class="rounded-lg border border-default">
      <summary class="cursor-pointer px-4 py-3 font-medium">
        {{ $t('Ver skill') }} <code>{{ skillName }}</code>
      </summary>
      <div class="space-y-3 border-t border-default p-4">
        <p class="text-sm text-muted">
          {{
            $t(
              'Lee los archivos aquí o copia la skill completa para que tu asistente la cree o la actualice y siga sus instrucciones.',
            )
          }}
        </p>
        <template v-if="skill && file">
          <UiCopyButton :text="file.content" :label="$t('Copiar archivo')" />
          <div
            class="grid gap-3 lg:grid-cols-[minmax(13rem,0.5fr)_minmax(0,1fr)]"
          >
            <UTree
              v-model="selected"
              :items="tree"
              :get-key="(item) => item.id"
              :default-expanded="expanded"
              :aria-label="$t('Archivos de la skill')"
              class="min-w-0"
            />
            <section class="min-w-0 rounded-lg border border-default bg-muted">
              <h3
                class="break-all border-b border-default px-3 py-2 font-mono text-xs"
              >
                {{ file.path }}
              </h3>
              <pre
                class="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words p-3 text-sm"
                >{{ file.content }}</pre>
            </section>
          </div>
        </template>
      </div>
    </details>
  </div>
</template>
