import {
  clampWidth,
  readStoredWidth,
  widthAfterKey,
  type WidthLimits,
} from '../utils/resizable-width';

export const ASSISTANT_PANEL_WIDTH = { min: 19, max: 42, initial: 22 } as const;

export function useAssistantPanelWidth() {
  return useResizableWidth('ancho-del-panel-asistente', ASSISTANT_PANEL_WIDTH);
}

/**
 * Ancho de un panel pegado a la derecha, que se cambia arrastrando su borde
 * izquierdo o con las flechas. Se recuerda en el navegador.
 */
export function useResizableWidth(storageKey: string, limits: WidthLimits) {
  const width = useState(`resizable-width:${storageKey}`, () => limits.initial);

  onMounted(() => {
    width.value = readStoredWidth(localStorage.getItem(storageKey), limits);
  });

  function setWidth(next: number) {
    width.value = clampWidth(next, limits);
    localStorage.setItem(storageKey, String(width.value));
  }

  function onKeydown(event: KeyboardEvent) {
    const next = widthAfterKey(event.key, width.value, limits);
    if (next === null) return;
    event.preventDefault();
    setWidth(next);
  }

  /** Mientras se arrastra, el ancho es la distancia del puntero al borde derecho. */
  function onPointerDown(event: PointerEvent) {
    const handle = event.currentTarget;
    if (!(handle instanceof HTMLElement)) return;
    handle.setPointerCapture(event.pointerId);
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );

    const follow = (move: PointerEvent) => {
      setWidth((window.innerWidth - move.clientX) / rootFontSize);
    };
    const stop = () => {
      handle.removeEventListener('pointermove', follow);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
    };
    handle.addEventListener('pointermove', follow);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  return { width, onKeydown, onPointerDown };
}
