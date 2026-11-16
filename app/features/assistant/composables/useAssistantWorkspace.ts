import type { InjectionKey, Ref } from 'vue';
import type { ProjectScope } from '../../projects/types/project-scope';
import type { RunContext } from '../services/assistant';
import { EMPTY_LIVE_RUN } from '../utils/run-state';
import { createAssistantChat } from './useAssistantChat';

interface WorksheetDock {
  worksheetId: string;
  element: Ref<HTMLElement | null>;
  selectionLabel: Ref<string>;
  context: () => Promise<RunContext | undefined>;
  locate: (columnId?: string) => void;
}

const workspaceKey: InjectionKey<ReturnType<typeof provideAssistantWorkspace>> =
  Symbol('assistant workspace');

export function provideAssistantWorkspace() {
  const { $assistant } = useNuxtApp();
  const sessions = new Map<string, ReturnType<typeof createAssistantChat>>();
  onScopeDispose(() => {
    for (const session of sessions.values()) session.dispose();
  });

  const workspace = {
    open: ref(false),
    hasProject: ref(false),
    busy: ref(false),
    live: shallowRef(EMPTY_LIVE_RUN),
    worksheet: shallowRef<WorksheetDock>(),
    workbookId: ref(''),
    followActions: ref(true),
    session(scope: ProjectScope) {
      const key = `${scope.organizationId}:${scope.projectId}`;
      const existing = sessions.get(key);
      if (existing) return existing;
      const session = createAssistantChat($assistant, scope);
      sessions.set(key, session);
      return session;
    },
  };
  provide(workspaceKey, workspace);
  return workspace;
}

export function useAssistantWorkspace() {
  const workspace = inject(workspaceKey);
  if (!workspace)
    throw new Error('El asistente requiere el layout de workspace.');
  return workspace;
}
