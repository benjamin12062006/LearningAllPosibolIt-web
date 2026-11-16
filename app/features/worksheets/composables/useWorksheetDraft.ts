import type { ProjectScope } from '../../projects/types/project-scope';
import { ApiFailure } from '../../../services/api-client';
import type { VersionedChangeset } from '../services/changesets';
import { MAX_OPERATIONS, type Operation } from '../types/changesets';

const AUTOSAVE_MS = 650;

export function useWorksheetDraft(
  scope: Ref<ProjectScope | null>,
  worksheetId: Ref<string>,
  draftId: Ref<string | null>,
) {
  const { $changesets } = useNuxtApp();
  const version = shallowRef<VersionedChangeset | null>(null);
  const operations = shallowRef<Operation[]>([]);
  const history = shallowRef<Operation[][]>([]);
  const saving = ref(false);
  const loading = ref(false);
  const error = ref('');
  const serverVersion = shallowRef<VersionedChangeset | null>(null);
  const stale = ref(false);
  const dirty = computed(
    () =>
      !!version.value &&
      operations.value !== version.value.changeset.operations,
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  let scopeVersion = 0;

  async function load() {
    const token = ++scopeVersion;
    const current = scope.value;
    const id = draftId.value;
    clearTimeout(timer);
    version.value = null;
    operations.value = [];
    history.value = [];
    error.value = '';
    stale.value = false;
    serverVersion.value = null;
    saving.value = false;
    loading.value = !!current && !!id;
    if (!current || !id) return;

    try {
      const loaded = await $changesets.find(current, id);
      if (token !== scopeVersion) return;
      if (loaded.changeset.worksheetId !== worksheetId.value) {
        error.value = 'El borrador pertenece a otra hoja.';
        return;
      }
      accept(loaded);
    } catch (cause) {
      if (token === scopeVersion) error.value = messageOf(cause);
    } finally {
      if (token === scopeVersion) loading.value = false;
    }
  }

  function accept(loaded: VersionedChangeset) {
    version.value = loaded;
    operations.value = loaded.changeset.operations;
  }

  function replace(next: Operation[]) {
    if (version.value?.changeset.status !== 'draft' || stale.value) return;
    if (next.length > MAX_OPERATIONS) {
      error.value = 'El borrador admite hasta 1.000 operaciones.';
      return;
    }
    history.value = [...history.value.slice(-29), operations.value];
    operations.value = next;
    scheduleSave();
  }

  function undo() {
    const last = history.value.at(-1);
    if (!last || stale.value) return;
    history.value = history.value.slice(0, -1);
    operations.value = last;
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(() => void save(), AUTOSAVE_MS);
  }

  async function save() {
    clearTimeout(timer);
    const current = scope.value;
    const active = version.value;
    if (!current || !active || !dirty.value || saving.value || stale.value)
      return;

    const token = scopeVersion;
    const snapshot = operations.value;
    saving.value = true;
    error.value = '';
    try {
      const saved = await $changesets.saveOperations(
        current,
        active.changeset.id,
        snapshot,
        active.etag,
      );
      if (token !== scopeVersion) return;
      version.value = saved;
      if (operations.value === snapshot)
        operations.value = saved.changeset.operations;
      if (dirty.value) scheduleSave();
    } catch (cause) {
      if (token !== scopeVersion) return;
      error.value = messageOf(cause);
      if (cause instanceof ApiFailure && cause.status === 412) {
        stale.value = true;
        error.value =
          'Otro guardado cambió el borrador. Conservamos tus cambios en pantalla.';
        try {
          const latest = await $changesets.find(current, active.changeset.id);
          if (token === scopeVersion) serverVersion.value = latest;
        } catch {
          // El aviso de conflicto y el búfer siguen disponibles sin conexión.
        }
      }
    } finally {
      if (token === scopeVersion) saving.value = false;
    }
  }

  function openServerVersion() {
    if (!serverVersion.value) {
      void load();
      return;
    }
    accept(serverVersion.value);
    error.value = '';
    serverVersion.value = null;
    stale.value = false;
    history.value = [];
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return;
    event.preventDefault();
    event.returnValue = '';
  }

  if (import.meta.client) {
    watch([scope, worksheetId, draftId], load, { immediate: true });
    window.addEventListener('beforeunload', beforeUnload);
    onScopeDispose(() =>
      window.removeEventListener('beforeunload', beforeUnload),
    );
  }
  onScopeDispose(() => {
    scopeVersion += 1;
    clearTimeout(timer);
  });

  return {
    version,
    operations,
    history,
    error,
    saving,
    loading,
    stale,
    dirty,
    replace,
    undo,
    save,
    load,
    openServerVersion,
  };
}

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo cargar o guardar el borrador.';
}
