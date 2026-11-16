<script setup lang="ts">
import {
  cliSetup,
  MCP_CLIENTS,
  mcpSetup,
  setupPrompt,
  type McpClient,
  type McpMode,
} from '../utils/setup';
import { saveBlob } from '../../../utils/download';

const props = defineProps<{
  projectId: string;
  oauthResourceUrl: string | null;
  local: boolean;
}>();
const tab = defineModel<'mcp' | 'cli'>('tab', { required: true });
const mode = ref<McpMode>(props.oauthResourceUrl ? 'remote' : 'local');
const client = ref<McpClient>('codex');
const webOrigin = useRequestURL().origin;
const { apiBaseUrl } = useRuntimeConfig().public;
const setup = computed(() => ({
  client: client.value,
  mode: mode.value,
  oauthResourceUrl: props.oauthResourceUrl,
  webOrigin,
  projectId: props.projectId,
}));
const instructions = computed(() =>
  mode.value === 'local' && !props.local ? null : mcpSetup(setup.value),
);
const prompt = computed(() =>
  setupPrompt({
    ...setup.value,
    mode: mode.value === 'local' && !props.local ? 'remote' : mode.value,
  }),
);
const cli = computed(() => cliSetup(apiBaseUrl));
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
          v-if="!instructions"
          color="neutral"
          variant="soft"
          :title="$t('Transporte pendiente para este cliente o entorno')"
        />
        <template v-else>
          <p class="text-sm text-muted">
            {{
              mode === 'local'
                ? $t(
                    'Ejecuta el cliente en el equipo que tiene el servicio de IA instalado. El administrador local configura el secreto del adaptador.',
                  )
                : $t(
                    'Autoriza tu cuenta en KTSU y completa el inicio de sesión de Descope cuando el cliente lo abra.',
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
        </template>
        <p class="text-sm text-muted" role="status">
          {{ $t('Conexión del cliente pendiente de comprobar.') }}
        </p>
        <slot name="mcp" :mode="mode" :can-configure="!!instructions" />
      </section>
    </template>
    <template #cli>
      <section class="space-y-4">
        <p class="text-sm text-muted">
          {{
            $t(
              'La CLI de KTSU está disponible en el repositorio como paquete privado. Desde la raíz del repositorio de Nest, instala el paquete con Node 24 o superior y ejecuta estos comandos desde tu terminal.',
            )
          }}
        </p>
        <p class="text-sm text-muted">
          {{ $t('Indica la credencial en') }} <code>KTSU_TOKEN</code>
          {{
            $t(
              'mediante el gestor de secretos de tu terminal. También puedes pasarla con',
            )
          }}
          <code>--token-stdin</code>.
        </p>
        <pre
          class="overflow-auto whitespace-pre-wrap break-all rounded-lg border border-default bg-muted p-3 text-sm"
          >{{ cli }}</pre>
        <UiCopyButton :text="cli" :label="$t('Copiar comandos de CLI')" />
        <p class="text-sm text-muted" role="status">
          {{ $t('Conexión de la CLI pendiente de comprobar.') }}
        </p>
        <slot name="cli" />
      </section>
    </template>
  </UiTabs>
  <details class="mt-5 rounded-lg border border-default p-4">
    <summary class="cursor-pointer font-medium">
      {{ $t('Configurar con un agente externo') }}
    </summary>
    <p class="mt-3 whitespace-pre-wrap text-sm text-muted">{{ prompt }}</p>
    <UiCopyButton :text="prompt" :label="$t('Copiar prompt')" class="mt-3" />
  </details>
</template>
