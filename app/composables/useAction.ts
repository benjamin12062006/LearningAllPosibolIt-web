import { ApiFailure } from '../services/api-client';

/**
 * Ejecuta una acción de la persona (guardar, archivar, aplicar…) con su estado
 * «ocupado» y, si falla, un aviso con el texto de la API. Devuelve `null`
 * cuando falla: quien llama decide qué hacer solo si salió bien.
 */
export function useAction() {
  const toast = useToast();
  const isRunning = ref(false);
  const failure = ref<ApiFailure | null>(null);

  async function run<Result>(
    failureTitle: string,
    action: () => Promise<Result>,
  ): Promise<Result | null> {
    isRunning.value = true;
    failure.value = null;
    try {
      return await action();
    } catch (error) {
      failure.value = toApiFailure(error);
      toast.add({
        title: failureTitle,
        description: failure.value.message,
        color: 'error',
        icon: 'i-lucide-circle-alert',
      });
      return null;
    } finally {
      isRunning.value = false;
    }
  }

  return { isRunning, failure, run };
}

function toApiFailure(error: unknown): ApiFailure {
  if (error instanceof ApiFailure) return error;
  return new ApiFailure(0, 'Inténtalo de nuevo.');
}
