export const MOMENTUM_SCRIPT_FONT = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';

export const TYPOGRAPHY_PRESETS = [
  {
    name: 'Momentum Hand Script',
    head: MOMENTUM_SCRIPT_FONT,
    body: 'DM Sans, sans-serif',
    description: 'Casual handwritten headings paired with DM Sans body text.',
  },
] as const;

export const FONT_OPTIONS = [
  { label: 'Archivo', value: 'Archivo, sans-serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Momentum Hand Script', value: MOMENTUM_SCRIPT_FONT },
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
