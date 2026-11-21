<script setup lang="ts">
import {
  MCP_CLIENTS,
  resolveMcpSetup,
  setupPrompt,
  type McpClient,
  type McpMode,
} from '../utils/setup';
import { saveBlob } from '../../../utils/download';

const props = defineProps<{
  projectId: string;
  oauthResourceUrl: string | null;
  local: boolean;
  cliOAuthAvailable?: boolean;
}>();
const tab = defineModel<'mcp' | 'cli'>('tab', { required: true });
const selectedMode = ref<McpMode | null>(null);
const mode = computed({
  get: () =>
    selectedMode.value ??
    (props.oauthResourceUrl || !props.local ? 'remote' : 'local'),
  set: (value: McpMode) => {
    selectedMode.value = value;
  },
});
const client = ref<McpClient>('codex');
const webOrigin = useRequestURL().origin;
const setup = computed(() => ({
  client: client.value,
  mode: mode.value,
  oauthResourceUrl: props.oauthResourceUrl,
  webOrigin,
  projectId: props.projectId,
}));
const resolved = computed(() => resolveMcpSetup(setup.value, props.local));
const instructions = computed(() => resolved.value.instructions);
const canIssueCredential = computed(() => resolved.value.status === 'ready');
const prompt = computed(() => setupPrompt(setup.value, props.local));
const preferredCliMethod = ref<'oauth' | 'token'>('oauth');
const cliMethod = computed(() =>
  props.cliOAuthAvailable ? preferredCliMethod.value : 'token',
);
const cliMethods = computed(() => [
  { label: t('Cuenta Descope (OAuth)'), value: 'oauth' },
  { label: t('Credencial de proyecto'), value: 'token' },
]);
const { t } = useAppLocale();
const tabs = [
  { value: 'mcp', label: 'MCP' },
  { value: 'cli', label: 'CLI' },
] as const;
const tabItems = [...tabs];

function download() {
  const configuration = instructions.value;
  if (!configuration?.filename) return;
  saveBlob(
    new Blob([configuration.text], { type: 'text/plain;charset=utf-8' }),
    configuration.filename,
  );
}
</script>

<template>
  <UiTabs v-model="tab" :items="tabItems" :label="$t('Tipo de integración')">
    <template #mcp>
      <section class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField :label="$t('Cliente')">
            <USelect v-model="client" :items="[...MCP_CLIENTS]" />
          </UFormField>
          <UFormField :label="$t('Transporte')">
            <USelect
              v-model="mode"
              :items="[
                { value: 'local', label: 'Local (stdio)' },
                { value: 'remote', label: 'Remoto (OAuth)' },
              ]"
            />
          </UFormField>
        </div>
        <UAlert
          v-if="resolved.status === 'remote-resource-required'"
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
        <UAlert
          v-if="resolved.status === 'local-api-required'"
          color="neutral"
          variant="soft"
          :title="$t('Emite la credencial en tu entorno local.')"
          :description="
            $t(
              'Arranca Nest en tu equipo y abre KTSU conectado a esa API. Emite allí la credencial del proyecto local.',
            )
          "
        />
        <template v-if="resolved.status === 'local-client-unsupported'">
          <UAlert
            color="neutral"
            variant="soft"
            :title="$t('Este cliente usa OAuth remoto.')"
          />
          <UButton color="neutral" variant="outline" @click="mode = 'remote'">
            {{ $t('Ver OAuth remoto') }}
          </UButton>
        </template>
        <slot
          name="mcp"
          :mode="mode"
          :can-issue-credential="canIssueCredential"
        />
        <template v-if="instructions">
          <p class="text-sm text-muted">
            {{
              mode === 'local'
                ? $t(
                    'Ejecuta el cliente en el equipo que tiene el servicio de IA instalado. El administrador local configura el secreto del adaptador.',
                  )
                : $t(
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
          <div class="flex flex-wrap gap-2">
            <UiCopyButton
              :text="instructions.text"
              :label="$t('Copiar configuración')"
            />
            <UiCopyButton
              v-if="mode === 'remote' && oauthResourceUrl"
              :text="oauthResourceUrl"
              :label="$t('Copiar URL del MCP')"
            />
            <UButton
              v-if="instructions.filename"
              color="neutral"
              variant="outline"
              icon="i-lucide-download"
              @click="download"
              >{{ $t('Descargar plantilla') }}</UButton
            >
          </div>
          <p
            v-if="mode === 'remote' && client === 'codex'"
            class="text-sm text-muted"
          >
            {{ $t('Para iniciar sesión desde la terminal:') }}
            <code>codex mcp login ktsu-remoto</code>
          </p>
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
      </section>
    </template>
  </UiTabs>
  <details
    v-if="tab === 'mcp'"
    class="mt-5 rounded-lg border border-default p-4"
  >
    <summary class="cursor-pointer font-medium">
      {{ $t('Configurar con un agente externo') }}
    </summary>
    <p class="mt-3 whitespace-pre-wrap text-sm text-muted">{{ prompt }}</p>
    <UiCopyButton :text="prompt" :label="$t('Copiar prompt')" class="mt-3" />
  </details>
</template>
