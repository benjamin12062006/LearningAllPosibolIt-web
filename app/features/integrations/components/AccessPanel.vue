<script setup lang="ts">
import { useAccess } from '../../access/composables/useAccess';
import type { ProjectScope } from '../../projects/types/project-scope';
import { ApiFailure } from '../../../services/api-client';
import type {
  Credential,
  CredentialAudience,
  CredentialCapability,
} from '../services/integrations';

const { t, language } = useAppLocale();

const props = defineProps<{
  scope: ProjectScope;
  projectName: string;
  archived: boolean;
  canPrepare: boolean;
  canManage: boolean;
  local: boolean;
}>();
const { $integrations } = useNuxtApp();
const { state } = useAccess();
const { run, isRunning, failure } = useAction();
const toast = useToast();
const tab = ref<'mcp' | 'cli'>('mcp');
const items = shallowRef<Credential[]>([]);
const nextCursor = ref<string | null>(null);
const oauthResourceUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref('');
const issued = shallowRef<{ label: string; token: string } | null>(null);
const revoking = shallowRef<Credential | null>(null);
const createAudience = ref<CredentialAudience | null>(null);
const label = ref('');
const grantPrepare = ref(false);
const issueKey = ref('');
const userId = computed(() =>
  state.value.status === 'ready' ? state.value.user.id : null,
);
const visibleItems = computed(() =>
  items.value.filter((item) =>
    tab.value === 'cli' ? item.audience === 'cli' : item.audience !== 'cli',
  ),
);
let generation = 0;

const codeOpen = computed({
  get: () => !!issued.value,
  set: (open: boolean) => {
    if (!open) issued.value = null;
  },
});
const revokeOpen = computed({
  get: () => !!revoking.value,
  set: (open: boolean) => {
    if (!open) revoking.value = null;
  },
});
const createOpen = computed({
  get: () => !!createAudience.value,
  set: (open: boolean) => {
    if (!open) createAudience.value = null;
  },
});
const audienceLabels: Record<CredentialAudience, string> = {
  mcp: 'MCP local',
  mcp_oauth: 'MCP remoto (OAuth)',
  cli: 'CLI',
};
const statusLabels: Record<Credential['status'], string> = {
  active: 'Activo',
  expired: 'Vencido',
  revoked: 'Revocado',
};
const createTitle = computed(() => {
  if (createAudience.value === 'mcp_oauth')
    return 'Autorizar cuenta para OAuth';
  if (createAudience.value === 'mcp') return 'Emitir credencial para MCP';
  if (createAudience.value === 'cli') return 'Emitir credencial para CLI';
  return 'Autorizar acceso';
});

onMounted(() => void load());
onScopeDispose(() => {
  generation += 1;
  issued.value = null;
});
watch([userId, () => props.archived], () => {
  issued.value = null;
  createAudience.value = null;
  revoking.value = null;
  items.value = [];
  oauthResourceUrl.value = null;
  if (userId.value) void load();
  else generation += 1;
});

async function load(continuation = false) {
  const cursor = continuation ? nextCursor.value : null;
  const request = ++generation;
  error.value = '';
  loading.value = true;
  try {
    const page = await $integrations.credentials(
      props.scope,
      cursor ?? undefined,
    );
    if (request !== generation) return;
    items.value = continuation ? [...items.value, ...page.items] : page.items;
    nextCursor.value = page.nextCursor;
    oauthResourceUrl.value = page.oauthResourceUrl;
  } catch (cause) {
    if (request === generation)
      error.value =
        cause instanceof Error
          ? cause.message
          : t('No se pudo leer el acceso al proyecto.');
  } finally {
    if (request === generation) loading.value = false;
  }
}

function startCreate(audience: CredentialAudience) {
  if (props.archived || !userId.value || loading.value || error.value) return;
  issued.value = null;
  label.value = '';
  grantPrepare.value = false;
  issueKey.value = '';
  createAudience.value = audience;
}

watch([label, grantPrepare], () => {
  issueKey.value = '';
});

async function issue() {
  const audience = createAudience.value;
  const trimmed = label.value.trim();
  if (
    !trimmed ||
    !audience ||
    props.archived ||
    !userId.value ||
    isRunning.value
  )
    return;
  const current = generation;
  const key = issueKey.value || crypto.randomUUID();
  issueKey.value = key;
  const capabilities: CredentialCapability[] =
    grantPrepare.value && props.canPrepare ? ['read', 'prepare'] : ['read'];
  const result = await run(t('No se emitió el acceso'), () =>
    $integrations.issue(
      props.scope,
      { audience, label: trimmed, capabilities },
      key,
    ),
  );
  if (current !== generation) return;
  if (!result) {
    if (
      failure.value instanceof ApiFailure &&
      failure.value.code === 'INTEGRATION_CREDENTIAL_ALREADY_ISSUED'
    ) {
      createAudience.value = null;
      await load();
      toast.add({
        title: 'La credencial ya existe',
        description: t('Revócala y emite otra si perdiste la entrega inicial.'),
        color: 'warning',
      });
    }
    return;
  }
  const stillOpen = createAudience.value === audience;
  createAudience.value = null;
  if (result.token && stillOpen)
    issued.value = { label: result.credential.label, token: result.token };
  else if (!result.token)
    toast.add({
      title: t('Cuenta autorizada para OAuth'),
      description: t(
        'Completa el inicio de sesión de Descope en tu cliente MCP.',
      ),
      color: 'success',
    });
  await load();
}

function requestRevoke(item: Credential) {
  issued.value = null;
  revoking.value = item;
}

async function revoke() {
  const item = revoking.value;
  if (!item || isRunning.value) return;
  const current = generation;
  const result = await run(t('No se revocó la credencial'), async () => {
    await $integrations.revoke(props.scope, item.id);
    return true;
  });
  if (!result || current !== generation) return;
  revoking.value = null;
  issued.value = null;
  toast.add({ title: 'Acceso revocado', color: 'success' });
  await load();
}

function showDate(value: string) {
  return new Date(value).toLocaleString(language.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
</script>

<template>
  <UAlert
    v-if="archived"
    color="warning"
    variant="soft"
    :title="$t('Organización archivada')"
    :description="$t('Puedes revisar y revocar los accesos existentes.')"
    class="mb-4"
  />
  <USkeleton v-if="loading && !items.length" class="mb-4 h-12" />
  <UAlert
    v-else-if="error"
    color="error"
    :title="error"
    :actions="[{ label: 'Reintentar', onClick: () => load() }]"
    class="mb-4"
  />
  <IntegrationsSetupGuide
    v-model:tab="tab"
    :project-id="scope.projectId"
    :oauth-resource-url="oauthResourceUrl"
    :local="local"
  >
    <template #mcp="{ mode, canIssueCredential }">
      <UButton
        v-if="!archived && canIssueCredential && userId"
        :disabled="loading || !!error"
        @click="startCreate(mode === 'local' ? 'mcp' : 'mcp_oauth')"
      >
        {{
          mode === 'local'
            ? $t('Emitir credencial para MCP')
            : $t('Autorizar cuenta para OAuth')
        }}
      </UButton>
    </template>
    <template #cli>
      <UButton
        v-if="!archived && userId"
        :disabled="loading || !!error"
        @click="startCreate('cli')"
        >{{ $t('Emitir credencial para CLI') }}</UButton
      >
    </template>
  </IntegrationsSetupGuide>
  <section class="mt-8 space-y-3">
    <h2 class="text-lg font-semibold">{{ $t('Accesos del proyecto') }}</h2>
    <p
      v-if="!loading && !error && !visibleItems.length"
      class="text-sm text-muted"
    >
      {{ $t('Aún no hay accesos de este tipo en el listado.') }}
    </p>
    <ul v-else class="divide-y divide-default">
      <li
        v-for="item in visibleItems"
        :key="item.id"
        class="flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div>
          <p class="break-words font-medium">{{ item.label }}</p>
          <p class="text-sm text-muted">
            {{ audienceLabels[item.audience] }} ·
            {{
              item.capabilities.includes('prepare')
                ? $t('Lectura y propuestas')
                : $t('Solo lectura')
            }}
            · {{ $t(statusLabels[item.status]) }}
          </p>
          <p class="text-xs text-muted">
            {{ $t('Vence') }} {{ showDate(item.expiresAt)
            }}<span v-if="item.lastUsedAt">
              {{ $t('· Último uso') }} {{ showDate(item.lastUsedAt) }}</span
            >
          </p>
        </div>
        <UButton
          v-if="
            item.status === 'active' && (canManage || item.ownerId === userId)
          "
          color="error"
          variant="ghost"
          @click="requestRevoke(item)"
          >{{ $t('Revocar') }}</UButton
        >
      </li>
    </ul>
    <UButton
      v-if="nextCursor"
      variant="soft"
      :disabled="isRunning"
      :loading="loading"
      @click="load(true)"
      >{{ $t('Cargar más accesos') }}</UButton
    >
  </section>

  <UiDialog v-model:open="createOpen" :title="$t(createTitle)">
    <form id="issue-access" class="space-y-4" @submit.prevent="issue">
      <p class="text-sm text-muted">
        {{ $t('Proyecto') }} {{ projectName
        }}{{ $t('. El acceso vence en 24 horas.') }}
      </p>
      <UFormField :label="$t('Nombre del acceso')" required
        ><UInput
          v-model="label"
          class="w-full"
          maxlength="80"
          :disabled="isRunning"
      /></UFormField>
      <UCheckbox
        v-if="props.canPrepare"
        v-model="grantPrepare"
        :label="$t('Permitir preparar propuestas para revisión humana')"
        :disabled="isRunning"
      />
      <p v-else class="text-sm">{{ $t('Alcance de solo lectura.') }}</p>
    </form>
    <template #footer>
      <UButton
        form="issue-access"
        type="submit"
        :disabled="!label.trim()"
        :loading="isRunning"
        >{{
          createAudience === 'mcp_oauth'
            ? $t('Autorizar cuenta para OAuth')
            : $t('Emitir credencial')
        }}</UButton
      >
    </template>
  </UiDialog>
  <UiDialog
    v-model:open="codeOpen"
    :title="$t('Credencial de entrega única')"
    :description="
      $t(
        'Copia el valor en el gestor de secretos del cliente. Se elimina al cerrar este diálogo.',
      )
    "
  >
    <p class="text-sm font-medium">{{ issued?.label }}</p>
    <code
      v-if="issued"
      class="mt-2 block break-all rounded bg-muted p-2 text-sm"
      >{{ issued.token }}</code
    >
    <template #footer
      ><UiCopyButton
        v-if="issued"
        :text="issued.token"
        :label="$t('Copiar credencial')"
    /></template>
  </UiDialog>
  <UiDialog
    v-model:open="revokeOpen"
    :title="$t('¿Revocar «{0}»?', [revoking?.label ?? ''])"
    :description="
      revoking
        ? $t(
            '{0} del proyecto «{1}». Las siguientes llamadas con ese acceso se rechazarán.',
            [audienceLabels[revoking.audience], projectName],
          )
        : undefined
    "
  >
    <template #footer>
      <UButton color="neutral" variant="ghost" @click="revokeOpen = false">{{
        $t('Cancelar')
      }}</UButton>
      <UButton color="error" :loading="isRunning" @click="revoke">{{
        $t('Revocar acceso')
      }}</UButton>
    </template>
  </UiDialog>
</template>
