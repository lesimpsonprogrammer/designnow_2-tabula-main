import type { State } from '../types';

// Version 1 bridge: an export-only, framework-neutral typography token snapshot.
// Does not upload source, tokens, credentials, or project data to another service.
const palette = /^#[0-9a-fA-F]{6}$/;
const fonts = ['Arial', 'Georgia', 'Verdana', 'Trebuchet MS'];
const color = (value: string | undefined, fallback: string) => value && palette.test(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));
export function exportAzurFlameTokens(state: State) {
  const selected = state.objects.find(obj => obj.id === state.selectedId && (obj.kind === 'heading' || obj.kind === 'subhead'));
  const heading = selected ?? state.objects.find(obj => obj.kind === 'heading');
  const requestedFont = (heading?.fontFamily || state.theme.head || 'Arial').split(',')[0].replace(/['"]/g, '').trim();
  const fontFamily = fonts.includes(requestedFont) ? requestedFont : 'Arial';
  const fontSize = clamp(heading?.size ?? 34, 18, 56);
  return {
    version: 1,
    brand: state.projectName.slice(0, 180),
    headline: (heading?.text ?? 'Your Data. Your Business Strength.').replace(/\s+/g, ' ').trim().slice(0, 180),
    fontFamily,
    fontSize,
    fontWeight: 700,
    foreground: color(heading?.color, '#173B5D'),
    accent: color(state.theme.accent, '#2B8EDF'),
    background: color(state.theme.paper, '#F9F8F3'),
    spacing: 36,
    motion: true,
  };
}
export function downloadAzurFlameTokens(state: State) {
  const json = JSON.stringify(exportAzurFlameTokens(state), null, 2) + '\n';
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tabula-azurflame.tokens.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
