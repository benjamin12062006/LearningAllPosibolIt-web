import type { ImportJob, ImportUpload } from '../types/imports';
import { isFinishedJob } from '../types/imports';

/** Cada cuánto se consulta el trabajo y cuánto se espera como máximo. */
const JOB_POLLING = { intervalMs: 2_000, timeoutMs: 120_000 } as const;

/**
 * Importaciones de un proyecto: la lista (mismo patrón que useProjects) y la
 * subida de un CSV, que la API procesa en segundo plano. Tras subirlo se
 * consulta su trabajo hasta que termina y se vuelve a pedir la lista.
 */
export function useProjectImports(projectId: MaybeRefOrGetter<string>) {
  const { $imports } = useNuxtApp();

  const { data, status, error, refresh } = useAsyncData(
    () => `imports:${toValue(projectId)}`,
    () => $imports.list(toValue(projectId)),
    { server: false },
  );

  const imports = computed(() => data.value?.imports ?? []);
  const hasMore = computed(() => data.value?.page.hasMore ?? false);
  const runningJob = ref<ImportJob | null>(null);

  let stopped = false;
  onScopeDispose(() => {
    stopped = true;
  });

  async function upload(file: ImportUpload) {
    const acceptance = await $imports.upload(toValue(projectId), file);
    await refresh();
    const job = await waitForJob(acceptance.jobId);
    await refresh();
    return job;
  }

  async function remove(snapshotId: string) {
    await $imports.remove(toValue(projectId), snapshotId);
    await refresh();
  }

  /** Devuelve el último estado visto; `null` si se salió de la página antes. */
  async function waitForJob(jobId: string): Promise<ImportJob | null> {
    const deadline = Date.now() + JOB_POLLING.timeoutMs;
    try {
      while (!stopped && Date.now() < deadline) {
        const job = await $imports.findJob(toValue(projectId), jobId);
        runningJob.value = job;
        if (isFinishedJob(job)) return job;
        await wait(JOB_POLLING.intervalMs);
      }
      return runningJob.value;
    } finally {
      runningJob.value = null;
    }
  }

  return {
    imports,
    hasMore,
    status,
    error,
    refresh,
    runningJob,
    upload,
    remove,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Cabeceras de una importación, para elegir columnas al mapear. */
export function useImportSnapshot(
  projectId: MaybeRefOrGetter<string>,
  snapshotId: MaybeRefOrGetter<string | null>,
) {
  const { $imports } = useNuxtApp();

  const { data, status, error } = useAsyncData(
    () => `snapshot:${toValue(projectId)}:${toValue(snapshotId) ?? 'ninguna'}`,
    () => {
      const id = toValue(snapshotId);
      return id
        ? $imports.findSnapshot(toValue(projectId), id)
        : Promise.resolve(null);
    },
    { server: false },
  );

  const headers = computed(() => data.value?.headers ?? []);

  return { snapshot: data, headers, status, error };
}
