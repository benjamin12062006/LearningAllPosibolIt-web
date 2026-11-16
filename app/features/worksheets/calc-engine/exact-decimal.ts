/**
 * Aritmética decimal exacta para el motor de cálculo (plan worksheets 03, V5).
 * Un número es una fracción de dos `BigInt`: sumar, restar, multiplicar y
 * dividir no pierde nada. `number` no sirve: es IEEE-754 y aproxima (C19).
 * Solo se redondea una vez, al final, con la regla de la columna.
 */
export type Rational = Readonly<{
  numerator: bigint;
  /** Siempre positivo: el signo va en el numerador. */
  denominator: bigint;
}>;

export const ROUNDING_MODES = ['half_up', 'half_even'] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number];

const TEN = 10n;

/** `"-12.345"` → −12345/1000. El texto ya tiene la forma canónica decimal. */
export function parseDecimal(text: string): Rational {
  const isNegative = text.startsWith('-');
  const digits = isNegative ? text.slice(1) : text;
  const [whole, fraction = ''] = digits.split('.');
  const magnitude = BigInt(whole + fraction);
  return {
    numerator: isNegative ? -magnitude : magnitude,
    denominator: TEN ** BigInt(fraction.length),
  };
}

export function add(a: Rational, b: Rational): Rational {
  return simplified(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function subtract(a: Rational, b: Rational): Rational {
  return add(a, { numerator: -b.numerator, denominator: b.denominator });
}

export function multiply(a: Rational, b: Rational): Rational {
  return simplified(a.numerator * b.numerator, a.denominator * b.denominator);
}

/** `null` si el divisor es cero: el resultado no está definido (H15). */
export function divide(a: Rational, b: Rational): Rational | null {
  if (b.numerator === 0n) {
    return null;
  }
  const sign = b.numerator < 0n ? -1n : 1n;
  return simplified(
    a.numerator * b.denominator * sign,
    a.denominator * b.numerator * sign,
  );
}

/**
 * Divide numerador y denominador por su máximo común divisor. Sin esto, cada
 * operación multiplica los denominadores y una suma de 5.000 filas llega a un
 * denominador de 10.000 dígitos (medido en la ficha 04).
 */
function simplified(numerator: bigint, denominator: bigint): Rational {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

/** Algoritmo de Euclides sobre valores absolutos; nunca devuelve 0 (el denominador no lo es). */
function greatestCommonDivisor(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

/**
 * Redondea a `scale` decimales. La división de `BigInt` trunca hacia cero
 * (F44), así que el resto decide: más de la mitad sube; justo la mitad sube
 * con `half_up` y va al par con `half_even`. Se trabaja con el valor absoluto
 * y el signo se pone al final, para que −2,5 y 2,5 redondeen igual.
 */
export function round(
  value: Rational,
  scale: number,
  mode: RoundingMode,
): Rational {
  const isNegative = value.numerator < 0n;
  const scaled =
    (isNegative ? -value.numerator : value.numerator) * TEN ** BigInt(scale);
  const truncated = scaled / value.denominator;
  const twiceRemainder = (scaled % value.denominator) * 2n;

  const roundsAway =
    twiceRemainder > value.denominator ||
    (twiceRemainder === value.denominator &&
      (mode === 'half_up' || truncated % 2n === 1n));
  const magnitude = roundsAway ? truncated + 1n : truncated;

  return {
    numerator: isNegative ? -magnitude : magnitude,
    denominator: TEN ** BigInt(scale),
  };
}

/** Texto con exactamente `scale` decimales: `round` ya dejó ese denominador. */
export function formatRounded(value: Rational, scale: number): string {
  const isNegative = value.numerator < 0n;
  const digits = (isNegative ? -value.numerator : value.numerator)
    .toString()
    .padStart(scale + 1, '0');
  const whole = digits.slice(0, digits.length - scale);
  const fraction = digits.slice(digits.length - scale);
  // «-0.00» no aporta nada: el cero no lleva signo.
  const sign = isNegative && value.numerator !== 0n ? '-' : '';
  return scale === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
}
