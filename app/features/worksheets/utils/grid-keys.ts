/**
 * Movimiento de la celda activa en la tabla con el teclado, según el patrón
 * `grid` de WAI-ARIA (plan worksheets 02, TE4). Funciones puras: reciben dónde
 * está la celda y devuelven dónde queda.
 */
export interface CellPosition {
  row: number;
  column: number;
}

export interface GridSize {
  rows: number;
  columns: number;
}

export interface KeyPress {
  key: string;
  /** Ctrl en Windows y Linux, Cmd en macOS. */
  hasModifier: boolean;
}

/** Filas que saltan RePág y AvPág. */
export const PAGE_JUMP = 10;

/**
 * La posición a la que lleva una tecla, o `null` si la tecla no mueve la
 * celda. Nunca sale de la tabla: en un borde, se queda donde está.
 */
export function positionAfterKey(
  position: CellPosition,
  { key, hasModifier }: KeyPress,
  size: GridSize,
): CellPosition | null {
  const lastRow = size.rows - 1;
  const lastColumn = size.columns - 1;

  if (key === 'ArrowUp')
    return clamp({ ...position, row: position.row - 1 }, size);
  if (key === 'ArrowDown')
    return clamp({ ...position, row: position.row + 1 }, size);
  if (key === 'ArrowLeft') {
    return clamp({ ...position, column: position.column - 1 }, size);
  }
  if (key === 'ArrowRight') {
    return clamp({ ...position, column: position.column + 1 }, size);
  }
  if (key === 'PageUp') {
    return clamp({ ...position, row: position.row - PAGE_JUMP }, size);
  }
  if (key === 'PageDown') {
    return clamp({ ...position, row: position.row + PAGE_JUMP }, size);
  }
  // Con Ctrl, a la primera o la última celda de la tabla; sin él, de la fila.
  if (key === 'Home') {
    return hasModifier ? { row: 0, column: 0 } : { ...position, column: 0 };
  }
  if (key === 'End') {
    return hasModifier
      ? clamp({ row: lastRow, column: lastColumn }, size)
      : clamp({ ...position, column: lastColumn }, size);
  }
  return null;
}

/** Una tecla que escribe un carácter: empieza a editar sustituyendo el valor. */
export function isTypingKey(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}) {
  const hasShortcutModifier = event.ctrlKey || event.metaKey || event.altKey;
  return event.key.length === 1 && !hasShortcutModifier;
}

export function clamp(position: CellPosition, size: GridSize): CellPosition {
  return {
    row: Math.min(Math.max(position.row, 0), Math.max(size.rows - 1, 0)),
    column: Math.min(
      Math.max(position.column, 0),
      Math.max(size.columns - 1, 0),
    ),
  };
}
