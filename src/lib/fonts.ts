export const MOMENTUM_SCRIPT_FAMILY = 'Tabula Momentum Script';
export const MOMENTUM_SCRIPT_FALLBACK = '"Segoe Script", "Apple Chancery", "Brush Script MT", cursive';
export const MOMENTUM_SCRIPT_FONT = `"${MOMENTUM_SCRIPT_FAMILY}", ${MOMENTUM_SCRIPT_FALLBACK}`;

export const MOMENTUM_SCRIPT_PROFILE = {
  family: MOMENTUM_SCRIPT_FAMILY,
  label: 'Tabula Momentum Script',
  category: 'casual-cursive',
  status: 'draft',
  fallback: MOMENTUM_SCRIPT_FALLBACK,
  personality: 'lazy, casual, warm, connected cursive',
  slant: 'soft-right',
  rhythm: 'compact-and-loose',
  joins: 'mostly-connected',
  stroke: 'rounded-monoline',
  baseline: 'slightly-irregular',
  caps: 'simple-with-light-flourish',
  letterSpacing: 'close',
  wordSpacing: 'relaxed',
  description: 'Tabula Momentum Script is a relaxed personal-note cursive with rounded connected strokes, soft right slant, close letter spacing, continuous joins, loose rhythm, and a slightly imperfect handwritten baseline.',
} as const;

export const TABULA_CALM_FAMILY = 'Tabula Calm';
export const TABULA_CALM_FALLBACK = '"Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const TABULA_CALM_FONT = `"${TABULA_CALM_FAMILY}", ${TABULA_CALM_FALLBACK}`;

export const TABULA_CALM_PROFILE = {
  family: TABULA_CALM_FAMILY,
  label: 'Tabula Calm',
  category: 'soft-humanist-sans',
  status: 'draft',
  fallback: TABULA_CALM_FALLBACK,
  personality: 'calm, warm, clear, grounded',
  rhythm: 'open-and-steady',
  stroke: 'soft-low-contrast',
  corners: 'gently-rounded',
  counters: 'open',
  letterSpacing: 'relaxed',
  wordSpacing: 'natural',
  description: 'Tabula Calm is a soft humanist sans with open counters, gently rounded forms, quiet proportions, regular visual weight, and relaxed spacing designed for calm, highly readable interfaces and body copy.',
} as const;

export const TABULA_NARROW_TECH_FAMILY = 'Tabula Narrow Tech';
export const TABULA_NARROW_TECH_FALLBACK = '"Arial Narrow", "Aptos Narrow", "Roboto Condensed", Arial, sans-serif';
export const TABULA_NARROW_TECH_FONT = `"${TABULA_NARROW_TECH_FAMILY}", ${TABULA_NARROW_TECH_FALLBACK}`;

export const TABULA_NARROW_TECH_PROFILE = {
  family: TABULA_NARROW_TECH_FAMILY,
  label: 'Tabula Narrow Tech',
  category: 'condensed-neo-grotesk',
  status: 'draft',
  fallback: TABULA_NARROW_TECH_FALLBACK,
  personality: 'precise, technical, efficient, modern',
  width: 'narrow',
  rhythm: 'tight-and-controlled',
  stroke: 'clean-low-contrast',
  corners: 'subtly-squared',
  counters: 'open-medium',
  numerals: 'high-clarity-tabular-ready',
  letterSpacing: 'tight-neutral',
  wordSpacing: 'compact',
  capitalT: 'slightly taller vertical stem/root than neighboring capitals',
  description: 'Tabula Narrow Tech is an original condensed neo-grotesk designed for dashboards, technical interfaces, data labels, navigation, and dense information. It uses narrow proportions, subtly squared curves, crisp terminals, strong numerals, controlled spacing, and a signature capital T with a slightly taller stem/root.',
} as const;

export const TYPOGRAPHY_PRESETS = [
  {
    name: 'Tabula Momentum Script',
    head: MOMENTUM_SCRIPT_FONT,
    body: 'DM Sans, sans-serif',
    description: 'Compact casual cursive headings paired with clean DM Sans body text.',
  },
  {
    name: 'Tabula Calm',
    head: TABULA_CALM_FONT,
    body: TABULA_CALM_FONT,
    description: 'Soft, spacious humanist sans for a calm and highly readable interface.',
  },
  {
    name: 'Momentum + Calm',
    head: MOMENTUM_SCRIPT_FONT,
    body: TABULA_CALM_FONT,
    description: 'Expressive Tabula Momentum Script headings with calm Tabula Calm body text.',
  },
  {
    name: 'Tabula Narrow Tech',
    head: TABULA_NARROW_TECH_FONT,
    body: TABULA_NARROW_TECH_FONT,
    description: 'Condensed technical typography for dashboards, data-heavy layouts, and modern product interfaces.',
  },
  {
    name: 'Tech + Calm',
    head: TABULA_NARROW_TECH_FONT,
    body: TABULA_CALM_FONT,
    description: 'Precise narrow technical headings paired with calm, readable body copy.',
  },
] as const;

export const FONT_OPTIONS = [
  { label: 'Archivo', value: 'Archivo, sans-serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Tabula Momentum Script', value: MOMENTUM_SCRIPT_FONT },
  { label: 'Tabula Calm', value: TABULA_CALM_FONT },
  { label: 'Tabula Narrow Tech', value: TABULA_NARROW_TECH_FONT },
  { label: 'Instrument Serif', value: 'Instrument Serif, serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville, serif' },
  { label: 'System Sans', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Palatino', value: 'Palatino, "Palatino Linotype", serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Monaco', value: 'Monaco, Menlo, Consolas, monospace' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
] as const;
