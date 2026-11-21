<script setup lang="ts">
import type { ProjectScope } from '../../projects/types/project-scope';
import {
  cliProjectContext,
  MCP_CLIENTS,
  mcpProjectContext,
  mcpSetup,
  type McpClient,
} from '../utils/setup';

const props = defineProps<{
  scope: ProjectScope;
  projectName: string;
  oauthResourceUrl: string | null;
  cliOAuthAvailable?: boolean;
}>();
const tab = defineModel<'mcp' | 'cli'>('tab', { required: true });
const { t } = useAppLocale();
const webOrigin = useRequestURL().origin;
const { apiBaseUrl } = useRuntimeConfig().public;

const client = ref<McpClient>('codex');
const mcpInput = computed(() => ({
  client: client.value,
  oauthResourceUrl: props.oauthResourceUrl,
}));
const instructions = computed(() => mcpSetup(mcpInput.value));
const mcpContext = computed(() =>
  mcpProjectContext(mcpInput.value, webOrigin, props.scope, props.projectName),
);

const preferredCliMethod = ref<'oauth' | 'token'>('oauth');
const cliMethod = computed(() =>
  props.cliOAuthAvailable ? preferredCliMethod.value : 'token',
);
const cliMethods = computed(() => [
  { label: t('Cuenta Descope (OAuth)'), value: 'oauth' },
  { label: t('Credencial de proyecto'), value: 'token' },
]);
const cliContext = computed(() =>
  cliProjectContext(apiBaseUrl, webOrigin, props.scope, props.projectName),
);

const tabItems = [
  { value: 'mcp', label: 'MCP' },
  { value: 'cli', label: 'CLI' },
];
</script>

<template>
  <UiTabs v-model="tab" :items="tabItems" :label="$t('Tipo de integración')">
    <template #mcp>
      <section class="space-y-4">
        <UFormField :label="$t('Cliente')">
          <USelect v-model="client" :items="[...MCP_CLIENTS]" />
        </UFormField>
        <UAlert
          v-if="!instructions"
          color="neutral"
          variant="soft"
          :title="
            $t('OAuth remoto aún no está configurado para este proyecto.')
          "
          :description="
            $t(
              'La URL del MCP aparecerá cuando el administrador habilite el acceso remoto en KTSU.',
            )
          "
        />
        <slot name="mcp" :can-issue-credential="!!instructions" />
        <template v-if="instructions">
          <p class="text-sm text-muted">
            {{
              $t(
                'Autoriza tu cuenta aquí y completa el inicio de sesión de Descope desde tu cliente.',
              )
            }}
          </p>
          <p class="text-sm text-muted">
            {{
              $t(
                'Conserva las entradas existentes. Añade solo la de KTSU y comprueba la conexión desde el cliente con una lectura.',
              )
            }}
          </p>
          <pre
            class="overflow-auto whitespace-pre-wrap break-all rounded-lg border border-default bg-muted p-3 text-sm"
            >{{ instructions.text }}</pre>
          <p class="text-sm text-muted">
            {{
              $t(
                '«Copiar configuración» copia la skill ktsu-mcp completa con esta configuración: pégala en tu asistente para que la cree o la actualice y configure el servidor.',
              )
            }}
          </p>
          <IntegrationsSkillViewer
            :scope="scope"
            skill-name="ktsu-mcp"
            :context="mcpContext"
            :copy-label="$t('Copiar configuración')"
          />
          <UiCopyButton
            v-if="oauthResourceUrl"
            :text="oauthResourceUrl"
            :label="$t('Copiar URL del MCP')"
          />
          <p class="text-sm text-muted">{{ instructions.login }}</p>
          <p class="text-sm text-muted">
            {{ $t('Comprueba la conexión con') }}
            <code>get_project_overview</code>.
          </p>
        </template>
      </section>
    </template>
    <template #cli>
      <section class="space-y-4">
        <UFormField v-if="cliOAuthAvailable" :label="$t('Método de acceso')">
          <USelect v-model="preferredCliMethod" :items="cliMethods" />
        </UFormField>
        <p v-if="cliMethod === 'oauth'" class="text-sm text-muted">
          {{
            $t(
              'Autoriza este proyecto y completa el inicio de sesión en el navegador. Para solicitar solo lectura, añade',
            )
          }}
          <code>--read-only</code>.
        </p>
        <p v-else class="text-sm text-muted">
          {{ $t('Indica la credencial en') }} <code>KTSU_TOKEN</code>
          {{
            $t(
              'mediante el gestor de secretos de tu terminal. También puedes pasarla con',
            )
          }}
          <code>--token-stdin</code>.
        </p>
        <slot name="cli" :method="cliMethod" />
        <IntegrationsSkillViewer
          :scope="scope"
          skill-name="ktsu-cli"
          :context="cliContext"
          :copy-label="$t('Copiar skill completa')"
        />
      </section>
    </template>
  </UiTabs>
</template>
