import { ApiFailure } from '../../../services/api-client';

/**
 * Cómo explicar cada fallo del visor (plan del visor, VW9). El texto es el
 * `message.es` de Nest; aquí se decide el título, el icono y la salida útil.
 */
export interface ViewerFailureView {
  title: string;
  description: string;
  icon: string;
  color: 'error' | 'warning' | 'info';
  action: 'retry' | 'feed' | 'evaluations' | 'none';
}

const RETIRED_CODES = ['FEED_VERSION_FILE_RETIRED'];
const UNAVAILABLE_CODES = ['EXPORT_FILE_UNAVAILABLE', 'FEED_FILE_UNAVAILABLE'];
const NOT_PUBLISHED_CODES = ['FEED_NOT_PUBLISHED'];
const NO_RESULTS_CODES = ['EVALUATION_RESULTS_UNAVAILABLE'];

export function describeViewerFailure(failure: unknown): ViewerFailureView {
  if (!(failure instanceof ApiFailure)) return unknownFailure();
  const { code, message, status } = failure;

  if (isOneOf(code, RETIRED_CODES)) {
    return {
      title: 'El archivo de esta versión ya se retiró',
      description: message,
      icon: 'i-lucide-archive-x',
      color: 'warning',
      action: 'feed',
    };
  }
  if (isOneOf(code, UNAVAILABLE_CODES)) {
    return {
      title: 'El archivo no está disponible ahora',
      description: message,
      icon: 'i-lucide-cloud-off',
      color: 'error',
      action: 'retry',
    };
  }
  if (isOneOf(code, NOT_PUBLISHED_CODES)) {
    return {
      title: 'Todavía no hay nada publicado',
      description: message,
      icon: 'i-lucide-rss',
      color: 'info',
      action: 'feed',
    };
  }
  if (isOneOf(code, NO_RESULTS_CODES)) {
    return {
      title: 'La evaluación no tiene resultados',
      description: message,
      icon: 'i-lucide-clipboard-x',
      color: 'info',
      action: 'evaluations',
    };
  }
  if (status === 404) {
    return {
      title: 'No lo encontramos',
      description: message,
      icon: 'i-lucide-file-question',
      color: 'warning',
      action: 'feed',
    };
  }
  return {
    title: 'No pudimos cargarlo',
    description: message,
    icon: 'i-lucide-cloud-off',
    color: 'error',
    action: 'retry',
  };
}

function unknownFailure(): ViewerFailureView {
  return {
    title: 'No pudimos cargarlo',
    description: 'Inténtalo de nuevo.',
    icon: 'i-lucide-cloud-off',
    color: 'error',
    action: 'retry',
  };
}

function isOneOf(code: string | null, codes: readonly string[]) {
  return code !== null && codes.includes(code);
}
