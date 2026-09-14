import type { CSSProperties } from 'react';
import type { Obj, Section, Theme } from '../types';
import { HEAD_KINDS } from '../types';
import { MOMENTUM_SCRIPT_FAMILY, TABULA_CALM_FAMILY, TABULA_NARROW_TECH_FAMILY } from './fonts';

// Ported from reference/Tabula v2.dc.html (textStyle + objStyle).
// Carries most of the visual fidelity — keep in sync with the prototype
// rather than "fixing" numbers that look arbitrary.

const TIGHT_KINDS = ['heading', 'subhead', 'stat', 'quote'];
const PADDED_KINDS = ['form', 'nav', 'input', 'footer', 'accordion', 'table', 'logos'];
const BG_PAD_KINDS = ['heading', 'text', 'subhead', 'list', 'quote', 'stat'];

export function textStyle(o: Obj, theme: Theme): CSSProperties {
  const k = o.kind;
  const tight = TIGHT_KINDS.includes(k);
  const fontFamily = o.fontFamily || (HEAD_KINDS.includes(k) ? theme.head : theme.body);
  const momentumScript = fontFamily.includes(MOMENTUM_SCRIPT_FAMILY);
  const tabulaCalm = fontFamily.includes(TABULA_CALM_FAMILY);
  const narrowTech = fontFamily.includes(TABULA_NARROW_TECH_FAMILY);
  const s: CSSProperties = {
    fontFamily,
    fontSize: o.size + 'px',
    wordSpacing: `${o.wordSpacing ?? 0}px`,
    color: o.color,
    lineHeight: momentumScript
      ? 1.12
      : tabulaCalm
        ? (tight ? 1.22 : 1.6)
        : narrowTech
          ? (tight ? 1.08 : 1.42)
          : tight
            ? 1.14
            : 1.55,
    fontWeight: momentumScript
      ? 400
      : tabulaCalm
        ? (k === 'heading' || k === 'subhead' || k === 'stat' ? 500 : 400)
        : narrowTech
          ? (k === 'heading' || k === 'subhead' || k === 'stat' ? 600 : 450)
          : k === 'heading' || k === 'subhead' || k === 'stat'
            ? 600
            : k === 'button' || k === 'reminder' || k === 'accordion'
              ? 500
              : 400,
    letterSpacing: momentumScript
      ? '-0.035em'
      : tabulaCalm
        ? (tight ? '-0.005em' : '0.005em')
        : narrowTech
          ? (tight ? '-0.028em' : '-0.012em')
          : tight
            ? '-0.02em'
            : '0',
    whiteSpace: 'pre-wrap',
  };
  if (k === 'eyebrow' || k === 'badge') {
    s.textTransform = 'uppercase';
    s.letterSpacing = momentumScript ? '-0.02em' : tabulaCalm ? '0.08em' : narrowTech ? '0.06em' : '0.1em';
    s.fontWeight = momentumScript ? 400 : narrowTech ? 600 : 500;
  }
  if (k === 'quote' || o.italic) s.fontStyle = 'italic';
  if (k === 'table') {
    s.fontFamily = '"JetBrains Mono", monospace';
    s.letterSpacing = '0';
    s.lineHeight = 1.9;
  }
  if (k === 'stat' && !momentumScript && !tabulaCalm && !narrowTech) s.letterSpacing = '-0.03em';
  return s;
}

export function objectStyle(o: Obj, selected: boolean, theme: Theme): CSSProperties {
  const s: CSSProperties = {
    position: 'absolute',
    left: o.x,
    top: o.y,
    width: o.w,
    height: o.h,
    borderRadius: o.radius,
    background: o.bg,
    display: 'flex',
    alignItems: o.vAlign === 'bottom'
      ? 'flex-end'
      : o.vAlign === 'middle'
        ? 'center'
        : 'flex-start',
    justifyContent: o.kind === 'button' || o.kind === 'reminder' || o.kind === 'badge'
      ? 'center'
      : o.align === 'center'
        ? 'center'
        : o.align === 'right'
          ? 'flex-end'
          : 'flex-start',
    padding: PADDED_KINDS.includes(o.kind) ? '0 16px' : o.kind === 'badge' ? '0 10px' : 0,
    cursor: 'move',
    userSelect: 'none',
    textAlign: o.align ?? 'left',
    outline: selected ? `1.5px solid ${theme.accent}` : '1px solid transparent',
    outlineOffset: 2,
    ...textStyle(o, theme),
  };

  if (o.kind === 'image' || o.kind === 'video') {
    s.background = 'repeating-linear-gradient(135deg, #e7e3dc 0 6px, #efece6 6px 12px)';
    s.alignItems = 'center';
    s.justifyContent = 'center';
    s.border = '1px solid #ddd8d0';
  }
  if (o.kind === 'logo') {
    s.alignItems = 'center';
    s.justifyContent = 'center';
    if (!o.imageSrc) {
      s.background = 'repeating-linear-gradient(135deg, #e7e3dc 0 6px, #efece6 6px 12px)';
      s.border = '1px dashed #c9c5c1';
    }
  }
  if (o.kind === 'card' || o.kind === 'input' || o.kind === 'table') s.border = '1px solid #e2ded6';
  if (o.kind === 'card') s.boxShadow = '0 1px 2px rgba(28,26,24,0.05)';
  if (o.kind === 'spacer') {
    s.border = '1px dashed #ddd8d0';
    s.opacity = 0.55;
  }
  if (o.kind === 'divider' && o.dividerGradient) {
    s.background = `linear-gradient(90deg, transparent, ${o.bg} 18%, ${o.bg} 82%, transparent)`;
    s.backgroundSize = '200% 100%';
    s.animation = 'tabula-divider-shimmer 6s ease-in-out infinite';
  }
  if (o.kind === 'table') s.padding = '10px 16px';
  if (o.kind === 'accordion') s.justifyContent = 'space-between';
  if (BG_PAD_KINDS.includes(o.kind) && o.bg !== 'transparent') s.padding = '10px 12px';
  if (o.pad !== null && o.pad !== undefined) s.padding = o.pad;
  if (o.bw > 0) s.border = `${o.bw}px solid ${o.bc || '#e2ded6'}`;
  if (o.opacity != null && o.opacity < 100) s.opacity = o.opacity / 100;

  return s;
}

export function sectionStyle(s: Section, selected: boolean, accent = '#0e1cdf', isFirst = false): CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: s.y,
    width: '100%',
    height: s.h,
    background: s.bg === 'transparent' ? 'transparent' : s.bg,
    borderTop: isFirst ? 'none' : `1px solid ${selected ? accent : 'rgba(28,26,24,0.07)'}`,
    boxShadow: selected ? `inset 0 0 0 1.5px ${accent}` : 'none',
    cursor: 'default',
  };
}
