// @ts-nocheck: copia exacta de Nest; la web comprueba los índices de forma más estricta (scripts/check-calc-engine.mjs).
import {
  add,
  divide,
  formatRounded,
  multiply,
  parseDecimal,
  round,
  subtract,
  type Rational,
  type RoundingMode,
} from './exact-decimal.js';

/** Versión del motor: se guarda en cada fórmula para poder reproducir un resultado. */
export const CALCULATION_ENGINE = 'calc-v1';

/** Límites del árbol (plan worksheets 03, V2): propuesta propia sujeta a pruebas. */
export const FORMULA_LIMITS = {
  depth: 5,
  nodes: 25,
  maxScale: 6,
} as const;

export const FORMULA_OPERATORS = ['add', 'sub', 'mul', 'div'] as const;
export type FormulaOperator = (typeof FORMULA_OPERATORS)[number];

/** Árbol guardado: las columnas van por ID, nunca por nombre (V3). */
export type FormulaExpression =
  | Readonly<{
      op: FormulaOperator;
      args: readonly [FormulaExpression, FormulaExpression];
    }>
  | Readonly<{ column: string }>
  | Readonly<{ value: string }>;

export type StoredFormula = Readonly<{
  engine: typeof CALCULATION_ENGINE;
  expression: FormulaExpression;
  scale: number;
  rounding: RoundingMode;
}>;

export type CalculationProblem = 'CALC_DIVISION_BY_ZERO' | 'CALC_INPUT_INVALID';

/**
 * Resultado de evaluar: un valor exacto, «no hay valor» (alguna entrada vacía)
 * o un problema que impide calcular.
 */
export type Outcome =
  | Readonly<{ kind: 'value'; value: Rational }>
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'problem'; problem: CalculationProblem }>;

/** De dónde saca la fórmula el valor de una columna referenciada. */
export type InputReader = (columnId: string) => Outcome;

export type CalculatedValue = Readonly<{
  value: string | null;
  problem: CalculationProblem | null;
}>;

/**
 * Evalúa la fórmula y redondea una sola vez, al final (V5). Sin `eval`: solo
 * se recorre el árbol ya validado (H15).
 */
export function calculate(
  formula: StoredFormula,
  readInput: InputReader,
): CalculatedValue {
  const outcome = roundOutcome(
    formula,
    evaluate(formula.expression, readInput),
  );
  if (outcome.kind === 'value') {
    return {
      value: formatRounded(outcome.value, formula.scale),
      problem: null,
    };
  }
  if (outcome.kind === 'problem') {
    return { value: null, problem: outcome.problem };
  }
  return { value: null, problem: null };
}

/** El mismo redondeo, sin pasar a texto: lo usa una calculada que lee a otra. */
export function roundOutcome(
  formula: StoredFormula,
  outcome: Outcome,
): Outcome {
  if (outcome.kind !== 'value') {
    return outcome;
  }
  return {
    kind: 'value',
    value: round(outcome.value, formula.scale, formula.rounding),
  };
}

function evaluate(
  expression: FormulaExpression,
  readInput: InputReader,
): Outcome {
  if ('value' in expression) {
    return { kind: 'value', value: parseDecimal(expression.value) };
  }
  if ('column' in expression) {
    return readInput(expression.column);
  }

  const [left, right] = expression.args.map((arg) => evaluate(arg, readInput));
  return combine(expression.op, left, right);
}

/**
 * Un problema pesa más que un vacío: si una entrada no se puede leer, el
 * resultado lo dice aunque otra entrada esté vacía.
 */
function combine(op: FormulaOperator, left: Outcome, right: Outcome): Outcome {
  for (const side of [left, right]) {
    if (side.kind === 'problem') {
      return side;
    }
  }
  if (left.kind !== 'value' || right.kind !== 'value') {
    return { kind: 'empty' };
  }

  switch (op) {
    case 'add':
      return { kind: 'value', value: add(left.value, right.value) };
    case 'sub':
      return { kind: 'value', value: subtract(left.value, right.value) };
    case 'mul':
      return { kind: 'value', value: multiply(left.value, right.value) };
    case 'div': {
      const quotient = divide(left.value, right.value);
      return quotient
        ? { kind: 'value', value: quotient }
        : { kind: 'problem', problem: 'CALC_DIVISION_BY_ZERO' };
    }
  }
}
