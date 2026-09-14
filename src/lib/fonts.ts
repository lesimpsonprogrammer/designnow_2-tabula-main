export const MOMENTUM_SCRIPT_FAMILY = 'Momentum Script';
export const MOMENTUM_SCRIPT_FALLBACK = '"Segoe Print", "Bradley Hand", "Brush Script MT", cursive';
export const MOMENTUM_SCRIPT_FONT = `"${MOMENTUM_SCRIPT_FAMILY}", ${MOMENTUM_SCRIPT_FALLBACK}`;

export const MOMENTUM_SCRIPT_PROFILE = {
  family: MOMENTUM_SCRIPT_FAMILY,
  label: 'Momentum Script',
  category: 'script',
  status: 'draft',
  fallback: MOMENTUM_SCRIPT_FALLBACK,
  description: 'Momentum Script custom display typeface. Uses controlled handwriting fallbacks until the final font file is installed.',
} as const;

export const TYPOGRAPHY_PRESETS = [
  {
    name: 'Momentum Script',
    head: MOMENTUM_SCRIPT_FONT,
    body: 'DM Sans, sans-serif',
    description: 'Momentum Script headings paired with DM Sans body text.',
  },
] as const;

export const FONT_OPTIONS = [
  { label: 'Archivo', value: 'Archivo, sans-serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Momentum Script', value: MOMENTUM_SCRIPT_FONT },
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
