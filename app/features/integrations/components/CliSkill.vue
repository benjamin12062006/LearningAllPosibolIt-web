<script setup lang="ts">
import type { ProjectScope } from '../../projects/types/project-scope';
import { cliProjectContext } from '../utils/setup';
import { skillClipboard, skillTree, type SkillItem } from '../utils/skill';

const props = defineProps<{
  scope: ProjectScope;
  projectName: string;
}>();
const { $integrations } = useNuxtApp();
const webOrigin = useRequestURL().origin;
const { apiBaseUrl } = useRuntimeConfig().public;
const seen = ref(false);
const selected = shallowRef<SkillItem>();
const {
  data: skill,
  status,
  error,
  execute,
} = useAsyncData(
  () => `cli-skill:${props.scope.organizationId}:${props.scope.projectId}`,
  () => $integrations.cliSkill(props.scope),
  { server: false, immediate: false },
);
const tree = computed(() => (skill.value ? skillTree(skill.value) : []));
const file = computed(
  () =>
    selected.value?.file ??
    skill.value?.files.find((entry) => entry.path === 'SKILL.md'),
);
const clipboard = computed(() =>
  skill.value
    ? skillClipboard(
        skill.value,
        cliProjectContext(
          apiBaseUrl,
          webOrigin,
          props.scope,
          props.projectName,
        ),
      )
    : '',
);

function load(event: Event) {
  if (
    !(event.currentTarget instanceof HTMLDetailsElement) ||
    !event.currentTarget.open ||
    seen.value
  )
    return;
  seen.value = true;
  void execute();
}
</script>

<template>
  <details class="rounded-lg border border-default" @toggle="load">
    <summary class="cursor-pointer px-4 py-3 font-medium">
      {{ $t('Ver skill de KTSU CLI') }}
    </summary>
    <div class="space-y-3 border-t border-default p-4">
      <p class="text-sm text-muted">
        {{
          $t(
            'Lee los archivos aquí o copia la skill completa para que tu asistente pueda reconstruirla y seguir las instrucciones.',
          )
        }}
      </p>
      <USkeleton v-if="status === 'pending'" class="h-24" />
      <UAlert
        v-else-if="error"
        color="error"
        :title="$t('No se pudo cargar la skill')"
        :actions="[{ label: $t('Reintentar'), onClick: () => execute() }]"
      />
      <template v-else-if="skill && file">
        <div class="flex flex-wrap gap-2">
          <UiCopyButton
            :text="clipboard"
            :label="$t('Copiar skill completa')"
          />
          <UiCopyButton :text="file.content" :label="$t('Copiar archivo')" />
        </div>
        <div
          class="grid gap-3 lg:grid-cols-[minmax(13rem,0.5fr)_minmax(0,1fr)]"
        >
          <UTree
            v-model="selected"
            :items="tree"
            :get-key="(item) => item.id"
            :default-expanded="[
              'ktsu-cli',
              'ktsu-cli/references',
              'ktsu-cli/scripts',
            ]"
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
</template>
