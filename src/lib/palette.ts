import type { Kind } from '../types';

export type PaletteItem = { key: Kind; glyph: string; label: string; hint?: string };
export type PaletteGroup = { name: string; items: PaletteItem[] };

// Ported from reference/Tabula v2.dc.html PALETTE_GROUPS.
export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    name: 'Text',
    items: [
      { key: 'eyebrow', glyph: 'ab', label: 'Eyebrow', hint: 'Small uppercase label above a heading' },
      { key: 'heading', glyph: 'H1', label: 'Heading' },
      { key: 'subhead', glyph: 'H2', label: 'Subhead' },
      { key: 'text', glyph: '¶', label: 'Paragraph' },
      { key: 'list', glyph: '⁝', label: 'Bullet list' },
      { key: 'quote', glyph: '❝', label: 'Pull quote' },
      { key: 'stat', glyph: '№', label: 'Stat' },
      { key: 'badge', glyph: '◍', label: 'Badge' },
    ],
  },
  {
    name: 'Layout',
    items: [
      { key: 'box', glyph: '⬒', label: 'Container' },
      { key: 'card', glyph: '▤', label: 'Card' },
      { key: 'divider', glyph: '⎯', label: 'Divider' },
      { key: 'spacer', glyph: '↕', label: 'Spacer' },
      { key: 'nav', glyph: '☰', label: 'Nav bar' },
      { key: 'breadcrumb', glyph: '›', label: 'Breadcrumb' },
      { key: 'footer', glyph: '▂', label: 'Footer' },
      { key: 'accordion', glyph: '⌄', label: 'FAQ row' },
    ],
  },
  {
    name: 'Media',
    items: [
      { key: 'image', glyph: '◫', label: 'Image + upload', hint: 'Starts as a placeholder with a built-in image uploader' },
      { key: 'logo', glyph: '◇', label: 'Logo + upload', hint: 'A transparent, contain-fit logo object with its own uploader' },
      { key: 'video', glyph: '▷', label: 'Video' },
      { key: 'cloud', glyph: '☁', label: 'Cloud graphic' },
      { key: 'icon', glyph: '◇', label: 'Icon' },
      { key: 'logos', glyph: '⬡', label: 'Logo strip' },
      { key: 'table', glyph: '▦', label: 'Table' },
      { key: 'splash', glyph: '✷', label: 'Color splash', hint: 'An artistic paint-splatter graphic in your theme colors' },
      { key: 'logomark', glyph: '◈', label: 'Logo design', hint: 'A generated abstract logomark you can recolor and drop in as a brand mark' },
    ],
  },
  {
    name: 'Forms',
    items: [
      { key: 'button', glyph: '▭', label: 'Button' },
      { key: 'reminder', glyph: '◷', label: 'Remind me', hint: 'Opens reminder delivery and scheduling options for visitors' },
      { key: 'form', glyph: '⌸', label: 'Email form' },
      { key: 'input', glyph: '▁', label: 'Text field' },
      { key: 'checkbox', glyph: '☑', label: 'Checkbox' },
    ],
  },
];

export const PALETTE: PaletteItem[] = PALETTE_GROUPS.flatMap((g) => g.items);
