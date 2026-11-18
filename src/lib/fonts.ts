/** Tabula typography catalog. Custom Momentum Script is in beta and needs a verified font asset. */
export const MOMENTUM_SCRIPT_FONT = '"Momentum Script", "Segoe Print", "Bradley Hand", cursive';
export const TYPOGRAPHY_PRESETS = [
  { name: 'Momentum Corporate', head: 'DM Sans, sans-serif', body: 'DM Sans, sans-serif', description: 'Clear enterprise typography for Momentum Data Solutions.' },
  { name: 'Data Preview', head: 'Space Grotesk, sans-serif', body: 'DM Sans, sans-serif', description: 'Precise technology headings with readable content.' },
  { name: 'GLASS Security', head: 'Archivo, sans-serif', body: 'DM Sans, sans-serif', description: 'Direct, structured security communication.' },
  { name: 'Alba Reset', head: 'Instrument Serif, serif', body: 'DM Sans, sans-serif', description: 'Warm editorial headings with accessible interface text.' },
  { name: 'Momentum Hand Script — preview only', head: MOMENTUM_SCRIPT_FONT, body: 'DM Sans, sans-serif', description: 'Relaxed, closely spaced connected script. Requires final custom font asset for reliable rendering.' },
] as const;
export const FONT_OPTIONS = [
  { label: 'DM Sans — Interface', value: 'DM Sans, sans-serif' },
  { label: 'Space Grotesk — Technical', value: 'Space Grotesk, sans-serif' },
  { label: 'Archivo — Corporate', value: 'Archivo, sans-serif' },
  { label: 'Instrument Serif — Editorial', value: 'Instrument Serif, serif' },
  { label: 'Libre Baskerville — Classic', value: 'Libre Baskerville, serif' },
  { label: 'Momentum Script — preview fallback', value: MOMENTUM_SCRIPT_FONT },
  { label: 'JetBrains Mono — Code', value: 'JetBrains Mono, monospace' },
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
export const TYPE_SCALE = { caption: 12, label: 14, body: 16, h3: 24, h2: 32, h1: 40, hero: 56 } as const;
