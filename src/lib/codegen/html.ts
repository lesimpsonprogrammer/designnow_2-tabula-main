import type { NavLink, Obj, Page, Theme } from '../../types';
import { HEAD_KINDS } from '../../types';
import { slugify } from '../slug';
import { inferRows, columnGap } from './layout';

// Text kinds reflow with their content; box/media/form kinds keep the
// author's intended height so placeholders and controls don't collapse.
const FIXED_HEIGHT_KINDS = new Set([
  'image', 'logo', 'video', 'box', 'card', 'divider', 'spacer', 'table', 'nav',
  'footer', 'accordion', 'form', 'input', 'button', 'reminder', 'badge', 'checkbox',
]);

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;');
}

function styledText(o: Obj): string {
  const colorRanges = o.textColors ?? [];
  const italicRanges = o.textItalics ?? [];
  const sentenceBoundaries = Array.from(o.text.matchAll(/[.!?](?=\s|$)/g), (match) => (match.index ?? 0) + 1);
  if (!colorRanges.length && !italicRanges.length && !(o.sentenceSpacing > 0)) return esc(o.text);
  const boundaries = Array.from(new Set([
    0,
    o.text.length,
    ...colorRanges.flatMap((range) => [range.start, range.end]),
    ...italicRanges.flatMap((range) => [range.start, range.end]),
    ...sentenceBoundaries,
  ]))
    .filter((position) => position >= 0 && position <= o.text.length)
    .sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    const range = [...colorRanges].reverse().find((candidate) => candidate.start <= start && candidate.end >= end);
    const italic = italicRanges.some((candidate) => candidate.start <= start && candidate.end >= end);
    const content = esc(o.text.slice(start, end));
    const lift = range?.shadow ? Math.max(0, Math.min(100, range.lift ?? 50)) : 0;
    const liftOffset = Math.round(1 + lift / 25);
    const liftBlur = Math.round(3 + lift / 8);
    const liftAlpha = Math.round(25 + lift * .45).toString(16).padStart(2, '0');
    const styles = [
      range ? `color:${escAttr(range.color)}` : '',
      lift > 0 ? `text-shadow:0 ${liftOffset}px ${liftBlur}px ${escAttr(range?.color ?? '#000000')}${liftAlpha},0 0 ${liftBlur + 6}px ${escAttr(range?.color ?? '#000000')}${liftAlpha}` : '',
      italic ? 'font-style:italic' : '',
      sentenceBoundaries.includes(end) ? `margin-right:${o.sentenceSpacing}px` : '',
    ].filter(Boolean).join(';');
    return styles ? `<span style="${styles}">${content}</span>` : content;
  }).join('');
}

function renderedText(o: Obj): string {
  const text = styledText(o);
  const poweredByJaren = /^Powered by\s+Jaren(?:\s+(?:Intelligence|Inelligence))?[.!]?$/i.test(o.text.replace(/\s+/g, ' ').trim());
  return poweredByJaren
    ? `<span class="powered-by-jaren"><span>${text}</span><i class="power-status-light" aria-hidden="true"></i></span>`
    : text;
}

const ICON_SVG: Record<Obj['iconName'], string> = {
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  workflow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h5a4 4 0 0 1 4 4v5M15 18H10a4 4 0 0 1-4-4V9"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M14 15c3.8-.8 6.3 1 7 5"/>',
  calculator: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M7 6h10v4H7zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7.5v.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7"/>',
  facebook: '<circle cx="12" cy="12" r="9"/><path d="M14.5 7.5h-1.4c-1.2 0-2.1.9-2.1 2.2V19M8.5 12h6"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  youtube: '<path d="M21 12c0 2.8-.3 4.5-.8 5.2-.6.8-2.1 1-8.2 1s-7.6-.2-8.2-1C3.3 16.5 3 14.8 3 12s.3-4.5.8-5.2c.6-.8 2.1-1 8.2-1s7.6.2 8.2 1c.5.7.8 2.4.8 5.2Z"/><path d="m10 9 5 3-5 3Z"/>',
  x: '<path d="M5 4 19 20M19 4 5 20"/>',
};

function tag(name: string, attrs: string, inner?: string, selfClose?: boolean): string {
  return `<${name}${attrs ? ' ' + attrs : ''}${selfClose ? ' />' : `>${inner || ''}</${name}>`}`;
}

// Inline style for one object. The prototype's genHtml only emitted
// position/size/radius/padding/border/opacity and dropped fill + text
// color entirely — a real gap for shippable output, so this also carries
// background and color (see reference/Tabula v2.dc.html genHtml vs objStyle).
function objectCss(o: Obj, theme: Theme): string {
  const decls: string[] = [];

  if (o.bg && o.bg !== 'transparent') decls.push(`background:${o.kind === 'divider' && o.dividerGradient ? `linear-gradient(90deg,transparent,${o.bg} 18%,${o.bg} 82%,transparent)` : o.bg}`);
  if (o.kind === 'divider' && o.dividerGradient) decls.push('background-size:200% 100%', 'animation:tabula-divider-shimmer 6s ease-in-out infinite');
  if (o.color) decls.push(`color:${o.color}`);
  if (o.fontFamily) decls.push(`font-family:${o.fontFamily}`);
  else if (HEAD_KINDS.includes(o.kind)) decls.push(`font-family:${theme.head}`);
  else decls.push(`font-family:${theme.body}`);
  if (o.size) decls.push(`font-size:${o.size}px`);
  if (o.wordSpacing) decls.push(`word-spacing:${o.wordSpacing}px`);
  if (o.italic) decls.push('font-style:italic');
  if (o.align !== 'left') decls.push(`text-align:${o.align}`);
  if (o.vAlign !== 'top' && o.kind !== 'nav') {
    decls.push('display:flex', 'flex-direction:column');
    decls.push(`justify-content:${o.vAlign === 'middle' ? 'center' : 'flex-end'}`);
  }
  if (o.radius) decls.push(`border-radius:${o.radius}px`);
  if (o.pad !== null && o.pad !== undefined) decls.push(`padding:${o.pad}px`);
  if (o.bw > 0) decls.push(`border:${o.bw}px solid ${o.bc || '#e2ded6'}`);
  if (o.opacity != null && o.opacity < 100) decls.push(`opacity:${o.opacity / 100}`);
  if (o.text && o.text.includes('\n')) decls.push('white-space:pre-wrap');

  decls.push(`max-width:${o.w}px`);
  decls.push(FIXED_HEIGHT_KINDS.has(o.kind) ? `height:${o.h}px` : 'width:100%');

  return decls.join('; ');
}

function objectTag(o: Obj, theme: Theme): string {
  const st = objectCss(o, theme);
  const slug = (o.label || 'image').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  switch (o.kind) {
    case 'image':
      return tag('figure', `class="obj" data-kind="image" style="${st}"`,
        '\n  ' + tag('img', `src="${escAttr(o.imageSrc || `/media/${slug}.jpg`)}" alt="${escAttr(o.label)}"`, '', true) + '\n');
    case 'logo':
      return tag('figure', `class="obj" data-kind="logo" style="${st}"`,
        '\n  ' + tag('img', `src="${escAttr(o.imageSrc || `/media/${slug}.svg`)}" alt="${escAttr(o.label)}" style="width:100%;height:100%;object-fit:contain"`, '', true) + '\n');
    case 'video':
      return tag('div', `class="obj" data-kind="video" style="${st}"`,
        '\n  ' + tag('video', `src="/media/${slug}.mp4" controls playsinline`, '') + '\n');
    case 'cloud':
      return tag('div', `class="obj cloud-artwork" data-kind="cloud" style="${st}"`,
        '\n  <svg viewBox="0 0 300 300" role="img" aria-label="Interactive cloud network">\n' +
        '    <path class="cloud-outline" d="M78 200 A34 34 0 0 1 78 132 A38 38 0 0 1 116 96 A48 48 0 0 1 196 108 A38 38 0 0 1 226 132 A34 34 0 0 1 226 200 Z" />\n' +
        '  </svg>\n');
    case 'icon':
      return tag(o.href && o.href !== '#' ? 'a' : 'div', `class="obj" data-kind="icon"${o.href && o.href !== '#' ? ` href="${escAttr(o.href)}"` : ''} aria-label="${escAttr(o.label || `${o.iconName} icon`)}" style="${st}"`,
        `<svg class="tabula-icon" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g class="icon-motion">${ICON_SVG[o.iconName]}</g></svg>`);
    case 'heading':
      return tag('h1', `class="obj" style="${st}"`, renderedText(o));
    case 'subhead':
      return tag('h2', `class="obj" style="${st}"`, renderedText(o));
    case 'eyebrow':
      return tag('p', `class="obj" data-kind="eyebrow" style="${st}"`, styledText(o));
    case 'badge':
      return tag('span', `class="obj" data-kind="badge" style="${st}"`, styledText(o));
    case 'stat':
      return tag('p', `class="obj" data-kind="stat" style="${st}"`, styledText(o));
    case 'quote':
      return tag('blockquote', `class="obj" style="${st}"`, styledText(o));
    case 'list':
      return tag('ul', `class="obj" style="${st}"`,
        '\n' + o.text.split('\n').map((li) => '  ' + tag('li', '', esc(li.replace(/^[•\-\s]+/, '')))).join('\n') + '\n');
    case 'table': {
      const rows = o.text.split('\n').map((r, i) =>
        '  ' + tag('tr', '', r.split(/\s{2,}/).map((c) => tag(i === 0 ? 'th' : 'td', '', esc(c))).join('')));
      return tag('table', `class="obj" style="${st}"`, '\n' + rows.join('\n') + '\n');
    }
    case 'button':
      return tag('a', `class="obj" data-kind="button" href="${escAttr(o.href || '#')}" style="${st}"`, styledText(o));
    case 'reminder':
      return tag('button', `class="obj" data-kind="reminder" type="button" style="${st}"`, styledText(o));
    case 'divider':
      return tag('hr', `class="obj" style="${st}"`, '', true);
    case 'form':
      return tag('form', `class="obj" data-kind="form" style="${st}"`,
        '\n  ' + tag('input', `name="email" type="email" placeholder="${esc(o.text)}"`, '', true) + '\n');
    case 'nav': {
      const parts = o.text.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
      const brand = o.navBrand || parts[0] || '';
      const links: NavLink[] = o.navLinks?.length
        ? o.navLinks
        : parts.slice(1).map((label, index) => ({ id: `nav-${index}`, label, href: label.toLowerCase() === 'home' ? '/' : `/${slugify(label)}` }));
      const inner = [
        tag('span', 'class="nav-brand"', o.navLogo
          ? tag('img', `src="${escAttr(o.navLogo)}" alt="${escAttr(brand || 'Company logo')}" width="${o.navLogoWidth}" height="${o.navLogoHeight}"`, '', true)
          : esc(brand)),
        ...links.map((link) => link.children?.length
          ? tag('span', 'class="nav-item has-submenu"', `${tag('a', `href="${escAttr(link.href)}"`, `${esc(link.label)} <span aria-hidden="true">▾</span>`)}${tag('span', 'class="nav-submenu"', link.children.map((child) => tag('a', `href="${escAttr(child.href)}"`, esc(child.label))).join(''))}`)
          : tag('a', `href="${escAttr(link.href)}"`, esc(link.label))),
      ].join('\n  ');
      return tag('nav', `class="obj" style="${st}"`, `\n  ${inner}\n`);
    }
    case 'box':
      return tag('div', `class="obj stagger-reveal" data-kind="box" style="${st}"`, '');
    case 'card':
      return tag('article', `class="obj stagger-reveal" data-kind="card" style="${st}"`, '');
    case 'spacer':
      return tag('div', `class="obj" data-kind="spacer" aria-hidden="true" style="${st}"`, '');
    case 'logos':
      return tag('div', `class="obj" data-kind="logos" style="${st}"`, styledText(o));
    case 'breadcrumb':
      return tag('nav', `class="obj" data-kind="breadcrumb" aria-label="Breadcrumb" style="${st}"`, styledText(o));
    case 'footer':
      return tag('footer', `class="obj" style="${st}"`, styledText(o));
    case 'accordion':
      return tag('details', `class="obj" style="${st}"`,
        '\n  ' + tag('summary', '', esc(o.text)) + '\n  ' + tag('p', '', 'Answer copy.') + '\n');
    case 'input':
      return tag('label', `class="obj" data-kind="input" style="${st}"`,
        '\n  ' + tag('input', `type="text" placeholder="${esc(o.text)}"`, '', true) + '\n');
    case 'checkbox':
      return tag('label', `class="obj" data-kind="checkbox" style="${st}"`,
        '\n  ' + tag('input', 'type="checkbox"', '', true) + '\n  ' + esc(o.text.replace(/^[☐☑\s]+/, '')) + '\n');
    default:
      return tag('p', `class="obj" style="${st}"`, renderedText(o));
  }
}

function indent(s: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return s.split('\n').map((line) => pad + line).join('\n');
}

function renderSection(page: Page, sectionId: string, theme: Theme): string {
  const section = page.sections.find((s) => s.id === sectionId)!;
  const inBand = page.objects.filter((o) => !o.hidden && o.y >= section.y && o.y < section.y + section.h);
  const relObjects = inBand.map((o) => ({ ...o, y: o.y - section.y }));
  const rows = inferRows(relObjects);
  const gap = columnGap(rows);

  const rowsHtml = rows.map((row) => {
    const cells = row.objects.map((o) => indent(objectTag(o, theme), 2)).join('\n');
    if (row.objects.length === 1) return cells; // no wrapper needed for a lone object
    const display = row.equalWidth
      ? `display:grid; grid-template-columns:repeat(${row.objects.length}, minmax(0, 1fr)); gap:${row.gap}px`
      : `display:flex; flex-wrap:wrap; align-items:flex-start; gap:${row.gap}px`;
    return `<div class="row" style="${display}">\n${cells}\n</div>`;
  });

  const secStyle = [
    'display:flex', 'flex-direction:column', `gap:${gap}px`,
    `min-height:${section.h}px`, 'padding:48px max(24px, (100% - 1100px) / 2)', 'box-sizing:border-box',
  ];
  if (section.bg && section.bg !== 'transparent') secStyle.push(`background:${section.bg}`);

  const body = rowsHtml.length ? indent(rowsHtml.join('\n'), 2) : '  <!-- drag objects onto the canvas -->';
  return `<section id="${slugify(section.name)}" style="${secStyle.join('; ')}">\n${body}\n</section>`;
}

export function genHtml(page: Page, theme: Theme): string {
  const sections = page.sections.map((s) => renderSection(page, s.id, theme)).join('\n');
  const reminderModal = page.objects.some((object) => !object.hidden && object.kind === 'reminder') ? `
  <div class="reminder-modal-backdrop" data-reminder-modal hidden>
    <form class="reminder-modal" data-reminder-form role="dialog" aria-modal="true" aria-labelledby="reminder-title">
      <button type="button" class="reminder-modal-close" data-reminder-close aria-label="Close reminder options">×</button>
      <span class="reminder-modal-kicker">Stay connected</span>
      <h2 id="reminder-title">How should we remind you?</h2>
      <p>Choose where you want to receive the reminder.</p>
      <div class="reminder-channel-options" role="radiogroup" aria-label="Reminder delivery method">
        <button type="button" role="radio" aria-checked="true" class="active" data-reminder-channel="email">Email</button>
        <button type="button" role="radio" aria-checked="false" data-reminder-channel="messenger">Facebook Messenger</button>
        <button type="button" role="radio" aria-checked="false" data-reminder-channel="sms">Text message</button>
      </div>
      <label><span data-reminder-contact-label>Email address</span><input required type="email" data-reminder-contact placeholder="you@company.com" /></label>
      <div class="reminder-date-row"><label>Date<input required name="date" type="date" /></label><label>Time<input required name="time" type="time" /></label></div>
      <label>Reminder note<textarea name="note" rows="3" placeholder="What would you like us to remind you about?"></textarea></label>
      <button type="submit" class="reminder-submit">Schedule reminder</button>
      <output class="reminder-confirmation" data-reminder-confirmation hidden></output>
    </form>
  </div>` : '';
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${esc(page.name)}</title>`,
    '  <link rel="stylesheet" href="styles.css" />',
    '</head>',
    '<body>',
    indent(sections, 2),
    reminderModal,
    '  <script src="app.js"></script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
