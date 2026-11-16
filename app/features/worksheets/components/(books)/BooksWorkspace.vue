<script setup lang="ts">
import { useProjectScope } from '../../../projects/composables/useProjectScope';
import { useProject } from '../../../projects/composables/useProjects';
import { useWorkbooks } from '../../composables/useWorkbooks';
import { useAssistantWorkspace } from '../../../assistant/composables/useAssistantWorkspace';
import type { MenuAction } from '../../../../components/ui/Menu.vue';
import type { SheetAction } from './SheetRow.vue';
import type {
  ColumnDefinition,
  Workbook,
  WorksheetSummary,
} from '../../types/worksheets';

const { t } = useAppLocale();

/** Lo que se está pidiendo o confirmando: un solo diálogo abierto a la vez. */
type OpenDialog =
  | { kind: 'create-workbook' }
  | { kind: 'rename-workbook'; workbook: Workbook }
  | { kind: 'archive-workbook'; workbook: Workbook }
  | { kind: 'create-sheet'; workbook: Workbook }
  | { kind: 'from-catalog'; workbook: Workbook }
  | { kind: 'rename-sheet'; worksheet: WorksheetSummary }
  | { kind: 'duplicate-sheet'; worksheet: WorksheetSummary }
  | { kind: 'archive-sheet'; worksheet: WorksheetSummary };

const route = useRoute();
const toast = useToast();
const { $worksheets, $worksheetTransfers } = useNuxtApp();

const projectId = computed(() => String(route.params.id));
const { project } = useProject(projectId);
const { scope, can, error: accessError } = useProjectScope(projectId);

const assistant = useAssistantWorkspace();
function openBookChat(workbook: Workbook) {
  assistant.workbookId.value = workbook.id;
  assistant.open.value = true;
}
onBeforeUnmount(() => {
  assistant.workbookId.value = '';
});
const showArchived = ref(false);
const { books, status, error, refresh } = useWorkbooks(scope, showArchived);
const { isRunning, run } = useAction();

const dialog = ref<OpenDialog | null>(null);
const canWrite = computed(() => can('worksheet.write'));

const isFirstLoad = computed(
  () =>
    (status.value === 'pending' || scope.value === null) &&
    books.value.length === 0,
);
const loadError = computed(() => accessError.value ?? error.value);

function isOpen(kind: OpenDialog['kind']) {
  return computed({
    get: () => dialog.value?.kind === kind,
    set: (open: boolean) => {
      if (!open) dialog.value = null;
    },
  });
}

const isCreateWorkbookOpen = isOpen('create-workbook');
const isRenameWorkbookOpen = isOpen('rename-workbook');
const isArchiveWorkbookOpen = isOpen('archive-workbook');
const isCreateSheetOpen = isOpen('create-sheet');
const isFromCatalogOpen = isOpen('from-catalog');
const isRenameSheetOpen = isOpen('rename-sheet');
const isDuplicateSheetOpen = isOpen('duplicate-sheet');
const isArchiveSheetOpen = isOpen('archive-sheet');

/** El libro o la hoja del diálogo abierto, para sus textos. */
const dialogWorkbook = computed(() =>
  dialog.value && 'workbook' in dialog.value ? dialog.value.workbook : null,
);
const dialogSheet = computed(() =>
  dialog.value && 'worksheet' in dialog.value ? dialog.value.worksheet : null,
);

function workbookActions(workbook: Workbook): MenuAction[] {
  if (workbook.archivedAt !== null) {
    return [
      {
        value: 'restore',
        label: t('Restaurar'),
        icon: 'i-lucide-archive-restore',
      },
    ];
  }
  return [
    { value: 'create-sheet', label: t('Nueva hoja'), icon: 'i-lucide-plus' },
    {
      value: 'from-catalog',
      label: t('Abrir un catálogo como hoja'),
      icon: 'i-lucide-file-input',
    },
    { value: 'rename', label: 'Renombrar', icon: 'i-lucide-pencil' },
    {
      value: 'archive',
      label: t('Archivar'),
      icon: 'i-lucide-archive',
      isDestructive: true,
    },
  ];
}

function onWorkbookAction(workbook: Workbook, action: string) {
  if (action === 'create-sheet')
    dialog.value = { kind: 'create-sheet', workbook };
  if (action === 'from-catalog')
    dialog.value = { kind: 'from-catalog', workbook };
  if (action === 'rename') dialog.value = { kind: 'rename-workbook', workbook };
  if (action === 'archive')
    dialog.value = { kind: 'archive-workbook', workbook };
  if (action === 'restore') void restoreWorkbook(workbook);
}

function onSheetAction(worksheet: WorksheetSummary, action: SheetAction) {
  if (action === 'rename') dialog.value = { kind: 'rename-sheet', worksheet };
  if (action === 'duplicate')
    dialog.value = { kind: 'duplicate-sheet', worksheet };
  if (action === 'archive') dialog.value = { kind: 'archive-sheet', worksheet };
  if (action === 'restore') void restoreSheet(worksheet);
}

/** Tras cada cambio se vuelve a leer la lista: Nest es quien la ordena y filtra. */
async function finish(message: string) {
  dialog.value = null;
  await refresh();
  toast.add({ title: message, color: 'success', icon: 'i-lucide-check' });
}

async function createWorkbook(name: string) {
  const current = scope.value;
  if (!current) return;
  const created = await run(t('No se creó el libro'), () =>
    $worksheets.createWorkbook(current, name),
  );
  if (created) await finish(`Libro «${created.name}» creado`);
}

async function renameWorkbook(name: string) {
  const current = scope.value;
  const workbook = dialogWorkbook.value;
  if (!current || !workbook) return;
  const renamed = await run(t('No se renombró el libro'), () =>
    $worksheets.renameWorkbook(current, workbook.id, name),
  );
  if (renamed) await finish('Libro renombrado');
}

async function archiveWorkbook() {
  const current = scope.value;
  const workbook = dialogWorkbook.value;
  if (!current || !workbook) return;
  const archived = await run(t('No se archivó el libro'), () =>
    $worksheets.archiveWorkbook(current, workbook.id),
  );
  if (archived) await finish('Libro archivado');
}

async function restoreWorkbook(workbook: Workbook) {
  const current = scope.value;
  if (!current) return;
  const restored = await run(t('No se restauró el libro'), () =>
    $worksheets.restoreWorkbook(current, workbook.id),
  );
  if (restored) await finish('Libro restaurado');
}

async function createSheet(input: {
  name: string;
  columns: ColumnDefinition[];
}) {
  const current = scope.value;
  const workbook = dialogWorkbook.value;
  if (!current || !workbook) return;
  const created = await run(t('No se creó la hoja'), () =>
    $worksheets.createWorksheet(current, workbook.id, input),
  );
  if (!created) return;
  dialog.value = null;
  await navigateTo(
    `/projects/${projectId.value}/worksheets/${created.worksheet.id}`,
  );
}

async function openCatalog(input: { name: string; snapshotId: string }) {
  const current = scope.value;
  const workbook = dialogWorkbook.value;
  if (!current || !workbook) return;
  const created = await run(t('No se abrió el catálogo'), () =>
    $worksheetTransfers.openCatalogAsWorksheet(current, workbook.id, input),
  );
  if (!created) return;
  dialog.value = null;
  await navigateTo(
    `/projects/${projectId.value}/worksheets/${created.worksheet.id}`,
  );
}

async function renameSheet(name: string) {
  const current = scope.value;
  const worksheet = dialogSheet.value;
  if (!current || !worksheet) return;
  const renamed = await run(t('No se renombró la hoja'), () =>
    $worksheets.rename(current, worksheet.id, name),
  );
  if (renamed) await finish('Hoja renombrada');
}

async function duplicateSheet(name: string) {
  const current = scope.value;
  const worksheet = dialogSheet.value;
  if (!current || !worksheet) return;
  const copy = await run(t('No se duplicó la hoja'), () =>
    $worksheets.duplicate(current, worksheet.id, { name }),
  );
  if (copy) await finish(`Copia «${copy.worksheet.name}» creada`);
}

async function archiveSheet() {
  const current = scope.value;
  const worksheet = dialogSheet.value;
  if (!current || !worksheet) return;
  const archived = await run(t('No se archivó la hoja'), () =>
    $worksheets.archive(current, worksheet.id),
  );
  if (archived) await finish('Hoja archivada');
}

async function restoreSheet(worksheet: WorksheetSummary) {
  const current = scope.value;
  if (!current) return;
  const restored = await run(t('No se restauró la hoja'), () =>
    $worksheets.restore(current, worksheet.id),
  );
  if (restored) await finish('Hoja restaurada');
}
</script>

<template>
  <div class="contents">
    <WorkspacePage id="hojas" :title="$t('Hojas')">
      <template #subtitle>
        <p class="mt-1 text-sm text-muted">
          {{ project?.name ?? $t('Proyecto') }}
          {{ $t('· prepara aquí tus datos antes de llevarlos al catálogo.') }}
        </p>
      </template>

      <template #title-actions>
        <UButton
          v-if="canWrite"
          icon="i-lucide-plus"
          @click="dialog = { kind: 'create-workbook' }"
        >
          {{ $t('Nuevo libro') }}
        </UButton>
      </template>

      <ProjectNav :project-id="projectId" class="mb-6" />

      <div v-if="isFirstLoad && !loadError" class="space-y-3">
        <USkeleton v-for="row in 4" :key="row" class="h-12 w-full" />
      </div>

      <UAlert
        v-else-if="loadError"
        color="error"
        variant="subtle"
        icon="i-lucide-cloud-off"
        :title="loadError.message"
        :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
      />

      <template v-else>
        <UCheckbox
          v-model="showArchived"
          class="mb-4"
          :label="$t('Mostrar también los archivados')"
        />

        <UEmpty
          v-if="books.length === 0"
          icon="i-lucide-table-2"
          :title="$t('Todavía no hay libros')"
          :description="
            $t(
              'Un libro agrupa hojas. En una hoja editas filas y columnas con revisión antes de aplicar.',
            )
          "
          :actions="
            canWrite
              ? [
                  {
                    label: 'Crear el primer libro',
                    icon: 'i-lucide-plus',
                    onClick: () => (dialog = { kind: 'create-workbook' }),
                  },
                ]
              : []
          "
        />

        <TransitionGroup v-else tag="div" name="row" class="space-y-8">
          <section
            v-for="{ workbook, worksheets, hasMoreWorksheets } in books"
            :key="workbook.id"
            :aria-labelledby="`libro-${workbook.id}`"
          >
            <header class="flex items-center gap-2">
              <h2
                :id="`libro-${workbook.id}`"
                class="min-w-0 flex-1 truncate text-lg font-medium text-highlighted"
              >
                {{ workbook.name }}
                <UBadge
                  v-if="workbook.archivedAt"
                  color="neutral"
                  variant="subtle"
                  class="ms-1.5 align-middle"
                >
                  {{ $t('Archivado') }}
                </UBadge>
              </h2>
              <UButton
                v-if="canWrite && !workbook.archivedAt"
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-plus"
                @click="dialog = { kind: 'create-sheet', workbook }"
              >
                {{ $t('Nueva hoja') }}
              </UButton>
              <UButton
                v-if="can('ai.use') && !workbook.archivedAt"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-bot"
                :aria-label="$t('Chat del libro {0}', [workbook.name])"
                @click="openBookChat(workbook)"
              />
              <UiMenu
                v-if="canWrite"
                :label="$t('Acciones del libro {0}', [workbook.name])"
                :actions="workbookActions(workbook)"
                @select="(action) => onWorkbookAction(workbook, action)"
              />
            </header>

            <p v-if="worksheets.length === 0" class="mt-2 text-sm text-muted">
              {{ $t('Este libro no tiene hojas.') }}
            </p>
            <div v-else class="mt-1">
              <WorksheetsSheetRow
                v-for="worksheet in worksheets"
                :key="worksheet.id"
                :project-id="projectId"
                :worksheet="worksheet"
                :can-write="canWrite"
                @action="(action) => onSheetAction(worksheet, action)"
              />
            </div>
            <p v-if="hasMoreWorksheets" class="mt-2 text-xs text-muted">
              {{
                $t('Este libro tiene más hojas de las que caben en la lista.')
              }}
            </p>
          </section>
        </TransitionGroup>
      </template>

      <WorksheetsNameDialog
        v-model:open="isCreateWorkbookOpen"
        :title="$t('Nuevo libro')"
        submit-label="Crear libro"
        :is-saving="isRunning"
        @submit="createWorkbook"
      />
      <WorksheetsNameDialog
        v-model:open="isRenameWorkbookOpen"
        :title="$t('Renombrar el libro')"
        :initial-name="dialogWorkbook?.name"
        submit-label="Guardar"
        :is-saving="isRunning"
        @submit="renameWorkbook"
      />
      <WorksheetsNameDialog
        v-model:open="isRenameSheetOpen"
        :title="$t('Renombrar la hoja')"
        :initial-name="dialogSheet?.name"
        submit-label="Guardar"
        :is-saving="isRunning"
        @submit="renameSheet"
      />
      <WorksheetsNameDialog
        v-model:open="isDuplicateSheetOpen"
        :title="$t('Duplicar la hoja')"
        :description="
          $t(
            'La copia nace con las filas y columnas de la revisión actual, en el mismo libro.',
          )
        "
        :initial-name="dialogSheet ? `${dialogSheet.name} (copia)` : ''"
        submit-label="Duplicar"
        :is-saving="isRunning"
        @submit="duplicateSheet"
      />
      <WorksheetsNewSheetDialog
        v-model:open="isCreateSheetOpen"
        :workbook-name="dialogWorkbook?.name ?? ''"
        :is-saving="isRunning"
        @submit="createSheet"
      />
      <WorksheetsFromCatalogDialog
        v-model:open="isFromCatalogOpen"
        :project-id="projectId"
        :workbook-name="dialogWorkbook?.name ?? ''"
        :is-saving="isRunning"
        @submit="openCatalog"
      />

      <UiDialog
        v-model:open="isArchiveWorkbookOpen"
        :title="$t('¿Archivar el libro «{0}»?', [dialogWorkbook?.name])"
        :description="
          $t(
            'Sus hojas quedan de solo lectura. Se puede restaurar cuando quieras.',
          )
        "
      >
        <template #footer>
          <UButton color="neutral" variant="ghost" @click="dialog = null">
            {{ $t('Cancelar') }}
          </UButton>
          <UButton color="error" :loading="isRunning" @click="archiveWorkbook">
            {{ $t('Archivar') }}
          </UButton>
        </template>
      </UiDialog>
      <UiDialog
        v-model:open="isArchiveSheetOpen"
        :title="$t('¿Archivar la hoja «{0}»?', [dialogSheet?.name])"
        :description="
          $t(
            'Queda de solo lectura y sale de la lista. Se puede restaurar cuando quieras.',
          )
        "
      >
        <template #footer>
          <UButton color="neutral" variant="ghost" @click="dialog = null">
            {{ $t('Cancelar') }}
          </UButton>
          <UButton color="error" :loading="isRunning" @click="archiveSheet">
            {{ $t('Archivar') }}
          </UButton>
        </template>
      </UiDialog>
    </WorkspacePage>
  </div>
</template>
