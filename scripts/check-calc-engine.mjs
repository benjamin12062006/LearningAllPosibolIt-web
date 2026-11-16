// Comprueba que el motor de cálculo de la web es una copia exacta del de Nest
// (plan worksheets 02, TE2). Nest calcula el valor oficial; si los archivos
// difieren, la vista previa de la web podría enseñar otro número.
//
// Uso: node scripts/check-calc-engine.mjs [carpeta de la API]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHARED_FILES = [
  'exact-decimal.ts',
  'formula.ts',
  'cell-values.ts',
  'row-evaluation.ts',
];

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webEngine = join(webRoot, 'app/features/worksheets/calc-engine');
const apiRoot = resolve(
  process.argv[2] ?? join(webRoot, '../LearningAllPosibolIt'),
);
const apiEngine = join(apiRoot, 'src/worksheets');

if (!existsSync(apiEngine)) {
  // En un clon sin la API al lado no hay con qué comparar: mandan los casos fijos.
  console.warn(
    `No está la API en ${apiEngine}. Sin comparación: quedan las pruebas de casos fijos.`,
  );
  process.exit(0);
}

const different = SHARED_FILES.filter(
  (file) =>
    hashOf(withoutWebHeader(read(join(webEngine, file)))) !==
    hashOf(read(join(apiEngine, file))),
);

if (different.length > 0) {
  console.error(
    `El motor de cálculo difiere del de Nest en: ${different.join(', ')}.\n` +
      'Copia de nuevo esos archivos y repasa los casos fijos.',
  );
  process.exit(1);
}
console.log(
  `Motor de cálculo idéntico al de Nest (${SHARED_FILES.length} archivos).`,
);

function read(path) {
  return readFileSync(path, 'utf8');
}

function hashOf(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * La web comprueba los índices de forma más estricta que Nest
 * (`noUncheckedIndexedAccess`). Una copia puede empezar con una línea
 * `// @ts-nocheck` para pasar esa comprobación sin cambiar ni un carácter del
 * código: esa línea, y solo esa, no cuenta en la comparación.
 */
function withoutWebHeader(text) {
  if (!text.startsWith('// @ts-nocheck')) return text;
  return text.slice(text.indexOf('\n') + 1);
}
