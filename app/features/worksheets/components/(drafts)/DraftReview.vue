<script setup lang="ts">
import type { ProjectScope } from '../../../projects/types/project-scope';
import {
  CHANGESET_STATUS_LABELS,
  CONFLICT_REASON_LABELS,
  type Changeset,
  type ChangesetReview,
  type ConflictResolution,
  type DiffEntry,
} from '../../types/changesets';

const { t } = useAppLocale();

const operationLabels: Record<DiffEntry['type'], string> = {
  set_cell: 'Editar celda',
  insert_row: t('Añadir fila'),
  delete_row: 'Quitar fila',
  add_column: t('Añadir columna'),
  rename_column: 'Renombrar columna',
  delete_column: 'Quitar columna',
  change_column_type: t('Cambiar tipo de columna'),
};

const props = defineProps<{
  scope: ProjectScope;
  draft: Changeset;
  canWrite: boolean;
  canApprove: boolean;
  isAuthor: boolean;
  hasUnsavedChanges: boolean;
}>();
const emit = defineEmits<{ changed: []; applied: [] }>();
const { $changesets } = useNuxtApp();
const { run, isRunning } = useAction();
const review = shallowRef<ChangesetReview>();
const error = ref('');
const loading = ref(false);
const reason = ref('');
const choices = ref<Record<number, ConflictResolution['choice']>>({});
let request = 0;

watch(
  () => [
    props.draft.id,
    props.draft.draftVersion,
    props.draft.status,
    props.scope.projectId,
  ],
  () => void load(),
  { immediate: true },
);
onScopeDispose(() => {
  request += 1;
});

const conflicts = computed(
  () =>
    review.value?.entries.filter((entry) => entry.status === 'conflict') ?? [],
);
const needsRebase = computed(
  () =>
    review.value && review.value.headRevisionId !== props.draft.baseRevisionId,
);
const canRebase = computed(
  () =>
    needsRebase.value &&
    conflicts.value.every((entry) => choices.value[entry.index]),
);
const canReview = computed(
  () => review.value && !props.hasUnsavedChanges && !loading.value,
);
const hasChanges = computed(() => props.draft.operations.length > 0);
const canCancel = computed(
  () =>
    props.canWrite &&
    props.isAuthor &&
    ['draft', 'pending_review', 'approved', 'rejected', 'conflicted'].includes(
      props.draft.status,
    ),
);

async function load() {
  const token = ++request;
  review.value = undefined;
  choices.value = {};
  error.value = '';
  loading.value = true;
  try {
    const next = await $changesets.review(props.scope, props.draft.id);
    if (token === request) review.value = next;
  } catch (cause) {
    if (token === request)
      error.value =
        cause instanceof Error
          ? cause.message
          : t('No se pudo consultar la revisión.');
  } finally {
    if (token === request) loading.value = false;
  }
}

async function submit() {
  const result = await run(t('No se envió a revisión'), () =>
    $changesets.submit(props.scope, props.draft.id, props.draft.draftVersion),
  );
  if (result) emit('changed');
}

async function reopen() {
  const result = await run(t('No se reabrió el borrador'), () =>
    $changesets.reopen(props.scope, props.draft.id, props.draft.draftVersion),
  );
  if (result) emit('changed');
}

async function cancel() {
  const result = await run(t('No se canceló el borrador'), () =>
    $changesets.cancel(props.scope, props.draft.id),
  );
  if (result) emit('changed');
}

async function decide(decision: 'accept' | 'reject') {
  const reviewed = review.value;
  if (!reviewed) return;
  const result = await run(t('No se registró la decisión'), () =>
    $changesets.decide(props.scope, props.draft.id, {
      decision,
      draftVersion: props.draft.draftVersion,
      contentHash: reviewed.contentHash,
      expectedHeadRevisionId: reviewed.headRevisionId,
      reason: reason.value.trim() || undefined,
    }),
  );
  if (result) {
    reason.value = '';
    emit('changed');
  }
}

async function apply() {
  const reviewed = review.value;
  if (!reviewed) return;
  const signature = `${props.draft.id}:${reviewed.contentHash}:${reviewed.headRevisionId}`;
  const result = await run(t('No se aplicó el borrador'), async () => {
    // El mismo contenido revisado conserva la clave al cerrar o recargar el panel.
    const signatureBytes = new TextEncoder().encode(signature);
    const digest = await crypto.subtle.digest('SHA-256', signatureBytes);
    const key = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    return $changesets.apply(
      props.scope,
      props.draft.id,
      {
        contentHash: reviewed.contentHash,
        expectedHeadRevisionId: reviewed.headRevisionId,
      },
      key,
    );
  });
  if (result) emit('applied');
}

async function rebase() {
  if (!canRebase.value) return;
  const resolutions: ConflictResolution[] = [];
  for (const entry of conflicts.value) {
    const choice = choices.value[entry.index];
    if (choice)
      resolutions.push({
        rowId: entry.rowId,
        columnId: entry.columnId,
        choice,
      });
  }
  const result = await run(t('No se resolvieron los conflictos'), () =>
    $changesets.rebase(
      props.scope,
      props.draft.id,
      props.draft.draftVersion,
      resolutions,
    ),
  );
  if (result) emit('changed');
}

function show(value: DiffEntry['base']) {
  if (value === null || value === undefined) return t('Vacío');
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return JSON.stringify(value);
}
</script>

<template>
  <section class="space-y-4" :aria-busy="loading">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="text-base font-semibold">{{ draft.title }}</h2>
      <UBadge color="neutral" variant="soft">{{
        $t(CHANGESET_STATUS_LABELS[draft.status])
      }}</UBadge>
    </div>
    <USkeleton v-if="loading" class="h-16" />
    <UAlert
      v-else-if="error"
      color="error"
      :title="error"
      :actions="[{ label: 'Reintentar', onClick: load }]"
    />
    <template v-else-if="review">
      <p class="text-sm text-muted">
        {{ review.counts.change }} {{ $t('cambios ·') }}
        {{ review.counts.conflict }} {{ $t('conflictos ·') }}
        {{ review.resultingRowCount }} {{ $t('filas resultantes') }}
      </p>
      <UAlert
        v-if="hasUnsavedChanges"
        color="warning"
        :title="$t('Guarda los cambios locales para actualizar la revisión.')"
      />
      <UAlert
        v-else-if="review.problems.length"
        color="warning"
        :title="$t('{0} celdas con problemas', [review.problems.length])"
      />
      <p
        v-for="conversion in review.columnConversions"
        :key="conversion.columnId"
        class="text-sm"
      >
        {{ conversion.convertedCells }} {{ $t('valores convertidos ·') }}
        {{ conversion.incompatibleCells }} {{ $t('incompatibles') }}
      </p>
      <ul class="divide-y divide-default text-sm">
        <li
          v-for="entry in review.entries"
          :key="entry.index"
          class="space-y-1 py-2"
        >
          <p class="font-medium">
            {{ operationLabels[entry.type] }}
            <span v-if="entry.reason" class="text-error"
              >· {{ $t(CONFLICT_REASON_LABELS[entry.reason]) }}</span
            >
          </p>
          <dl class="grid grid-cols-3 gap-2 break-words text-xs">
            <div>
              <dt class="text-muted">Base</dt>
              <dd>{{ show(entry.base) }}</dd>
            </div>
            <div>
              <dt class="text-muted">{{ $t('Actual') }}</dt>
              <dd>{{ show(entry.head) }}</dd>
            </div>
            <div>
              <dt class="text-muted">{{ $t('Propuesto') }}</dt>
              <dd>{{ show(entry.proposed) }}</dd>
            </div>
          </dl>
          <select
            v-if="entry.status === 'conflict' && canWrite && isAuthor"
            v-model="choices[entry.index]"
            :aria-label="`Resolver conflicto ${entry.index + 1}`"
            class="rounded border border-default bg-default p-1"
          >
            <option :value="undefined">
              {{ $t('Elige cómo resolverlo') }}
            </option>
            <option value="head">{{ $t('Conservar el valor actual') }}</option>
            <option value="proposed">{{ $t('Conservar lo propuesto') }}</option>
          </select>
        </li>
      </ul>
      <UFormField
        v-if="draft.status === 'pending_review' && canApprove"
        :label="$t('Motivo de la decisión')"
      >
        <UInput v-model="reason" maxlength="500" />
      </UFormField>
    </template>
    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="draft.status === 'draft' && canWrite && isAuthor"
        :loading="isRunning"
        :disabled="
          !canReview ||
          !hasChanges ||
          needsRebase ||
          conflicts.length > 0 ||
          !!review?.problems.length
        "
        @click="submit"
        >{{ $t('Enviar a revisión') }}</UButton
      >
      <UButton
        v-if="draft.status === 'pending_review' && canApprove"
        :loading="isRunning"
        :disabled="!canReview || conflicts.length > 0"
        @click="decide('accept')"
        >{{ $t('Aprobar') }}</UButton
      >
      <UButton
        v-if="draft.status === 'pending_review' && canApprove"
        variant="soft"
        color="error"
        :loading="isRunning"
        :disabled="!canReview"
        @click="decide('reject')"
        >{{ $t('Rechazar') }}</UButton
      >
      <UButton
        v-if="draft.status === 'approved' && canApprove"
        :loading="isRunning"
        :disabled="!canReview || conflicts.length > 0"
        @click="apply"
        >{{ $t('Aplicar a la hoja') }}</UButton
      >
      <UButton
        v-if="
          needsRebase &&
          canWrite &&
          isAuthor &&
          ['draft', 'conflicted'].includes(draft.status)
        "
        :loading="isRunning"
        :disabled="!canReview || !canRebase"
        @click="rebase"
        >{{ $t('Actualizar sobre la revisión actual') }}</UButton
      >
      <UButton
        v-if="
          ['pending_review', 'rejected', 'conflicted'].includes(draft.status) &&
          canWrite &&
          isAuthor
        "
        variant="soft"
        :loading="isRunning"
        @click="reopen"
        >{{ $t('Reabrir para editar') }}</UButton
      >
      <UButton
        v-if="canCancel"
        variant="ghost"
        color="error"
        :loading="isRunning"
        :disabled="hasUnsavedChanges"
        @click="cancel"
        >{{ $t('Cancelar borrador') }}</UButton
      >
    </div>
  </section>
</template>
