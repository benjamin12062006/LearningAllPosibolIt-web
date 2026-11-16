import { RUN_EVENTS, type RunEvent } from '../types/assistant';
import { isRecord } from '../../../utils/guards';

const MAX_BUFFER_BYTES = 128 * 1024;

// El delimitador puede llegar partido entre lecturas, incluso con CRLF.
export function createRunEventReader(onEvent: (event: RunEvent) => void) {
  let buffer = '';
  const delimiter = /\r?\n\r?\n/;

  return (chunk: string) => {
    buffer += chunk;
    for (
      let match = delimiter.exec(buffer);
      match;
      match = delimiter.exec(buffer)
    ) {
      const event = parseFrame(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
      if (event) onEvent(event);
    }
    if (buffer.length > MAX_BUFFER_BYTES)
      throw new Error('El evento del asistente supera el tamaño admitido.');
  };
}

function parseFrame(frame: string): RunEvent | null {
  let sequence = 0;
  let name = '';
  const data: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('id:')) sequence = Number(line.slice(3).trim());
    if (line.startsWith('event:')) name = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  const type = RUN_EVENTS.find((event) => event === name);
  if (
    !type ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1 ||
    data.length === 0
  )
    return null;
  const payload: unknown = JSON.parse(data.join('\n'));
  return isRecord(payload) ? { sequence, type, data: payload } : null;
}
