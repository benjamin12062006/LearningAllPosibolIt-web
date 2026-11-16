import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Contraste del tema (plan ui 04, S0; WCAG 2.2 AA): 4,5:1 para texto y 3:1
 * para bordes de controles y contornos. Los valores se leen de `main.css`,
 * que es donde viven: cambiar un color sin cumplir el mínimo falla aquí.
 */
const CSS_PATH = fileURLToPath(
  new URL('../../../app/assets/css/main.css', import.meta.url),
);
const TEXT_MINIMUM = 4.5;
const CONTROL_MINIMUM = 3;

type Tokens = Record<string, string>;

const css = readFileSync(CSS_PATH, 'utf8');
const light = readTokens(css, ':root');
// El modo oscuro solo redefine colores: lo demás lo hereda del claro.
const dark = { ...light, ...readTokens(css, '.dark') };

/** [texto, fondo]: pares que la interfaz usa de verdad. */
const TEXT_PAIRS: [string, string][] = [
  ['--ui-text-highlighted', '--ui-bg'],
  ['--ui-text', '--ui-bg'],
  ['--ui-text', '--ui-bg-muted'],
  // La fila seleccionada usa texto normal sobre el fondo elevado.
  ['--ui-text', '--ui-bg-elevated'],
  ['--ui-text-toned', '--ui-bg'],
  ['--ui-text-toned', '--ui-bg-muted'],
  ['--ui-text-muted', '--ui-bg'],
  ['--ui-text-muted', '--ui-bg-muted'],
  ['--ui-primary', '--ui-bg'],
  ['--app-ai', '--ui-bg'],
  ['--ui-success', '--ui-bg'],
  ['--ui-error', '--ui-bg'],
  ['--ui-warning', '--ui-bg'],
  ['--ui-info', '--ui-bg'],
];

const CONTROL_PAIRS: [string, string][] = [
  ['--ui-border-accented', '--ui-bg'],
  ['--app-ai-outline', '--ui-bg'],
  ['--ui-primary', '--ui-bg-muted'],
];

/** Texto del botón principal: blanco en claro y zinc-900 en oscuro (Nuxt UI). */
const TEXT_ON_PRIMARY = { light: '#ffffff', dark: '#18181b' };

describe.each([
  ['claro', light, TEXT_ON_PRIMARY.light],
  ['oscuro', dark, TEXT_ON_PRIMARY.dark],
])('contraste del modo %s', (_mode, tokens, textOnPrimary) => {
  it.each(TEXT_PAIRS)('%s sobre %s llega a 4,5:1', (text, background) => {
    expect(
      contrast(hexOf(tokens, text), hexOf(tokens, background)),
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
  });

  it.each(CONTROL_PAIRS)('%s sobre %s llega a 3:1', (control, background) => {
    expect(
      contrast(hexOf(tokens, control), hexOf(tokens, background)),
    ).toBeGreaterThanOrEqual(CONTROL_MINIMUM);
  });

  it('el texto del botón principal llega a 4,5:1', () => {
    expect(
      contrast(textOnPrimary, hexOf(tokens, '--ui-primary')),
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
  });
});

describe('las reglas de la medición', () => {
  it('negro sobre blanco da 21:1', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('un color sobre sí mismo da 1:1', () => {
    expect(contrast('#7f22fe', '#7f22fe')).toBe(1);
  });
});

/** Las variables `--nombre: #rrggbb` del primer bloque con ese selector. */
function readTokens(source: string, selector: string): Tokens {
  const start = source.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`No hay bloque ${selector} en main.css`);
  const block = source.slice(start, source.indexOf('\n}', start));
  const tokens: Tokens = {};
  for (const [, name, value] of block.matchAll(
    /(--[\w-]+):\s*(#[0-9a-f]{6})\b/gi,
  )) {
    if (name && value) tokens[name] = value;
  }
  return tokens;
}

function hexOf(tokens: Tokens, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Falta ${name} como color #rrggbb en main.css`);
  return value;
}

/** Razón de contraste de WCAG: (L1 + 0,05) / (L2 + 0,05), con L1 la más clara. */
function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Luminancia relativa de un color sRGB (WCAG 2.2, definición). */
function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const [red, green, blue] = [value >> 16, (value >> 8) & 255, value & 255].map(
    linearChannel,
  ) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function linearChannel(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}
