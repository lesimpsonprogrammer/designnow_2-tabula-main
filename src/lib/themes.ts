import type { Theme } from '../types';

// Five presets from the handoff README. Momentum is the brand theme.
export const THEMES: Theme[] = [
  {
    name: 'Momentum',
    paper: '#ffffff',
    ink: '#191919',
    deep: '#202a50',
    tint: '#d6dbe6',
    accent: '#0e1cdf',
    head: 'Archivo, sans-serif',
    body: 'DM Sans, sans-serif',
  },
  {
    name: 'Editorial',
    paper: '#fbf8f2',
    ink: '#191714',
    deep: '#191714',
    tint: '#efe9dd',
    accent: '#8c3b23',
    head: 'Instrument Serif, serif',
    body: 'DM Sans, sans-serif',
  },
  {
    name: 'Studio',
    paper: '#f6f2ec',
    ink: '#2a2320',
    deep: '#2a2320',
    tint: '#e6ded3',
    accent: '#a4552c',
    head: 'Space Grotesk, sans-serif',
    body: 'DM Sans, sans-serif',
  },
  {
    name: 'Clinic',
    paper: '#ffffff',
    ink: '#1e2328',
    deep: '#1e2328',
    tint: '#eff1f3',
    accent: '#1f7a68',
    head: 'Archivo, sans-serif',
    body: 'Archivo, sans-serif',
  },
  {
    name: 'Press',
    paper: '#f7f3ea',
    ink: '#1c1613',
    deep: '#3d1512',
    tint: '#ebe2d2',
    accent: '#7c1f1a',
    head: 'Libre Baskerville, serif',
    body: 'Archivo, sans-serif',
  },
];

export const DEFAULT_THEME = THEMES[0];
