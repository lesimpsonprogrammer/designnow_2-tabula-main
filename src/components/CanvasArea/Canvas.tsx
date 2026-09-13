import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import { objectStyle, sectionStyle, textStyle } from '../../lib/styles';
import { BLOCK_KINDS } from '../../types';
import type { Kind, NavLink, Obj } from '../../types';
import { IconGraphic } from '../IconGraphic';

const PAGE_WIDTH = 900;
const DEVICE_WIDTHS = { desktop: PAGE_WIDTH, tablet: 768, phone: 390 } as const;

function navigationParts(text: string) {
  return text.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
}

function isPoweredByJaren(text: string) {
  return /^Powered by\s+Jaren(?:\s+(?:Intelligence|Inelligence))?[.!]?$/i.test(text.replace(/\s+/g, ' ').trim());
}

function coloredText(o: Obj) {
  const colorRanges = o.textColors ?? [];
  const italicRanges = o.textItalics ?? [];
  const sentenceBoundaries = Array.from(o.text.matchAll(/[.!?](?=\s|$)/g), (match) => (match.index ?? 0) + 1);
  if (!colorRanges.length && !italicRanges.length && !(o.sentenceSpacing > 0)) return o.text;
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
    const colorRange = [...colorRanges].reverse().find((candidate) => candidate.start <= start && candidate.end >= end);
    const italic = italicRanges.some((candidate) => candidate.start <= start && candidate.end >= end);
    const endsSentence = sentenceBoundaries.includes(end);
    const lift = colorRange?.shadow ? Math.max(0, Math.min(100, colorRange.lift ?? 50)) : 0;
    const offset = Math.round(1 + lift / 25);
    const blur = Math.round(3 + lift / 8);
    const alpha = Math.round(25 + lift * .45).toString(16).padStart(2, '0');
    return <span key={`${start}-${end}`} style={{
      ...(colorRange ? { color: colorRange.color } : {}),
      ...(lift > 0 ? { textShadow: `0 ${offset}px ${blur}px ${colorRange?.color}${alpha}, 0 0 ${blur + 6}px ${colorRange?.color}${alpha}` } : {}),
      ...(italic ? { fontStyle: 'italic' } : {}),
      ...(endsSentence ? { marginRight: o.sentenceSpacing } : {}),
    }}>{o.text.slice(start, end)}</span>;
  });
}

const CLOUD_NODES = [
  [80, 178], [96, 140], [122, 116], [150, 102], [181, 116], [207, 142], [220, 178],
  [190, 194], [156, 202], [120, 194], [104, 168], [136, 148], [172, 154], [150, 178],
] as const;

function CloudGraphic() {
  const links = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0], [1, 10], [10, 11], [11, 2], [11, 12], [12, 4], [12, 13], [13, 8], [13, 9], [10, 13], [11, 13]];
  return (
    <div className="cloud-artwork">
      <svg viewBox="0 0 300 300" role="img" aria-label="Animated cloud network">
        <g className="cloud-artwork-float">
          <g className="cloud-network">
            {links.map(([from, to]) => <line key={`${from}-${to}`} x1={CLOUD_NODES[from][0]} y1={CLOUD_NODES[from][1]} x2={CLOUD_NODES[to][0]} y2={CLOUD_NODES[to][1]} />)}
            {CLOUD_NODES.map(([x, y], index) => <rect key={index} x={x - 2} y={y - 2} width="4" height="4" />)}
          </g>
          <path className="cloud-outline" d="M78 200 A34 34 0 0 1 78 132 A38 38 0 0 1 116 96 A48 48 0 0 1 196 108 A38 38 0 0 1 226 132 A34 34 0 0 1 226 200 Z" />
        </g>
      </svg>
      <span>Hover to crystallize</span>
    </div>
  );
}

let splashFilterSeed = 0;

function SplashGraphic() {
  const [idBase] = useState(() => `splash-${++splashFilterSeed}`);
  return (
    <div className="splash-artwork">
      <svg viewBox="0 0 300 300" role="img" aria-label="Artistic paint splash">
        <defs>
          <filter id={`${idBase}-a`} x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${idBase}-b`} x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.026" numOctaves="2" seed="9" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${idBase}-c`} x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.022" numOctaves="2" seed="17" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g className="splash-blob splash-blob-1" filter={`url(#${idBase}-a)`}>
          <circle cx="140" cy="150" r="90" fill="#7b2ff7" />
          <circle cx="205" cy="205" r="22" fill="#7b2ff7" />
          <circle cx="90" cy="220" r="14" fill="#7b2ff7" />
        </g>
        <g className="splash-blob splash-blob-2" filter={`url(#${idBase}-b)`}>
          <circle cx="185" cy="110" r="66" fill="#ff5ea8" />
          <circle cx="240" cy="150" r="16" fill="#ff5ea8" />
        </g>
        <g className="splash-blob splash-blob-3" filter={`url(#${idBase}-c)`}>
          <circle cx="110" cy="95" r="46" fill="#ffb84d" />
          <circle cx="70" cy="140" r="12" fill="#ffb84d" />
        </g>
      </svg>
    </div>
  );
}

function LogomarkGraphic({ color }: { color: string }) {
  return (
    <div className="logomark-artwork">
      <svg viewBox="0 0 100 100" role="img" aria-label="Logo design">
        <circle className="logomark-ring" cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" strokeDasharray="200" strokeDashoffset="60" />
        <path d="M28 30h44M50 30v42" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <circle className="logomark-dot" cx="50" cy="78" r="6" fill={color} />
      </svg>
    </div>
  );
}

type AlignmentGuide = {
  axis: 'x' | 'y';
  position: number;
  start: number;
  end: number;
};

const GUIDE_THRESHOLD = 6;
const NEARBY_DISTANCE = 96;

function closestGuide(moving: Obj, rawX: number, rawY: number, others: Obj[], axis: 'x' | 'y') {
  const movingSize = axis === 'x' ? moving.w : moving.h;
  const movingStart = axis === 'x' ? rawX : rawY;
  const movingAnchors = [0, movingSize / 2, movingSize];
  let best: { distance: number; snapped: number; guide: AlignmentGuide } | null = null;

  for (const other of others) {
    const nearby = axis === 'x'
      ? other.y <= rawY + moving.h + NEARBY_DISTANCE && other.y + other.h >= rawY - NEARBY_DISTANCE
      : other.x <= rawX + moving.w + NEARBY_DISTANCE && other.x + other.w >= rawX - NEARBY_DISTANCE;
    if (!nearby) continue;

    const otherStart = axis === 'x' ? other.x : other.y;
    const otherSize = axis === 'x' ? other.w : other.h;
    const otherAnchors = [otherStart, otherStart + otherSize / 2, otherStart + otherSize];

    for (const movingOffset of movingAnchors) {
      for (const target of otherAnchors) {
        const distance = Math.abs(movingStart + movingOffset - target);
        if (distance > GUIDE_THRESHOLD || (best && distance >= best.distance)) continue;
        const snapped = target - movingOffset;
        const crossMovingStart = axis === 'x' ? rawY : rawX;
        const crossMovingEnd = crossMovingStart + (axis === 'x' ? moving.h : moving.w);
        const crossOtherStart = axis === 'x' ? other.y : other.x;
        const crossOtherEnd = crossOtherStart + (axis === 'x' ? other.h : other.w);
        best = {
          distance,
          snapped,
          guide: {
            axis,
            position: target,
            start: Math.min(crossMovingStart, crossOtherStart) - 8,
            end: Math.max(crossMovingEnd, crossOtherEnd) + 8,
          },
        };
      }
    }
  }

  return best;
}

type CanvasProps = {
  mode?: 'editor' | 'preview';
};

export function Canvas({ mode = 'editor' }: CanvasProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<'email' | 'messenger' | 'sms'>('email');
  const [reminderSaved, setReminderSaved] = useState(false);
  const isPreview = mode === 'preview';

  const sections = useTabulaStore((s) => s.sections);
  const objects = useTabulaStore((s) => s.objects);
  const theme = useTabulaStore((s) => s.theme);
  const selectedId = useTabulaStore((s) => s.selectedId);
  const selectedSectionId = useTabulaStore((s) => s.selectedSectionId);
  const editingId = useTabulaStore((s) => s.editingId);
  const selectObject = useTabulaStore((s) => s.selectObject);
  const selectSection = useTabulaStore((s) => s.selectSection);
  const updateObject = useTabulaStore((s) => s.updateObject);
  const moveObjectOrGroup = useTabulaStore((s) => s.moveObjectOrGroup);
  const setEditingId = useTabulaStore((s) => s.setEditingId);
  const snapshot = useTabulaStore((s) => s.snapshot);
  const snapVal = useTabulaStore((s) => s.snapVal);
  const addObject = useTabulaStore((s) => s.addObject);
  const device = useTabulaStore((s) => s.device);

  const sectionsHeight = sections.reduce((m, s) => Math.max(m, s.y + s.h), 0);
  const objectsHeight = objects.reduce((m, o) => Math.max(m, o.y + o.h), 0);
  const height = isPreview ? Math.max(sectionsHeight, objectsHeight + 60) : sectionsHeight;
  const serviceTitles = /^(Data Management|Project Management|Human Resources|Managed Payroll Services)$/i;
  const serviceHeadings = objects.filter((object) => object.kind === 'heading' && serviceTitles.test(object.text.trim()));
  const cardContainers = objects.filter((object) => object.kind === 'card' || (object.kind === 'box' && serviceHeadings.some((heading) => {
    const centerX = heading.x + heading.w / 2;
    const centerY = heading.y + heading.h / 2;
    return centerX >= object.x && centerX <= object.x + object.w && centerY >= object.y && centerY <= object.y + object.h;
  })));
  const revealIndexById = new Map<string, number>();
  cardContainers.forEach((card, index) => {
    revealIndexById.set(card.id, index);
    objects.forEach((object) => {
      if (!['heading', 'text', 'icon'].includes(object.kind)) return;
      const centerX = object.x + object.w / 2;
      const centerY = object.y + object.h / 2;
      if (centerX >= card.x && centerX <= card.x + card.w && centerY >= card.y && centerY <= card.y + card.h) {
        revealIndexById.set(object.id, index);
      }
    });
  });

  useEffect(() => {
    if (!isPreview || !pageRef.current) return;
    const targets = Array.from(pageRef.current.querySelectorAll<HTMLElement>('.stagger-reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [isPreview, objects]);

  const startDrag = (id: string, e: ReactPointerEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    if (e.target instanceof Element && e.target.closest('textarea, input, select, [contenteditable="true"]')) return;
    if (editingId === id) return;
    const page = pageRef.current;
    if (!page) return;
    snapshot();
    const o = useTabulaStore.getState().objects.find((x) => x.id === id);
    if (!o) return;
    const groupIds = new Set(useTabulaStore.getState().objects
      .filter((object) => object.id === id || (o.groupId && object.groupId === o.groupId))
      .map((object) => object.id));
    const r = page.getBoundingClientRect();
    const offX = e.clientX - r.left - o.x;
    const offY = e.clientY - r.top - o.y;
    selectObject(id);

    const move = (ev: PointerEvent) => {
      const rr = page.getBoundingClientRect();
      const rawX = ev.clientX - rr.left - offX;
      const rawY = ev.clientY - rr.top - offY;
      const others = useTabulaStore.getState().objects.filter((object) => !groupIds.has(object.id));
      const xMatch = closestGuide(o, rawX, rawY, others, 'x');
      const yMatch = closestGuide(o, rawX, rawY, others, 'y');
      moveObjectOrGroup(
        id,
        xMatch ? xMatch.snapped : snapVal(rawX),
        yMatch ? yMatch.snapped : snapVal(rawY),
      );
      setAlignmentGuides([xMatch?.guide, yMatch?.guide].filter((guide): guide is AlignmentGuide => Boolean(guide)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setAlignmentGuides([]);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResize = (id: string, e: ReactPointerEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    snapshot();
    const o = useTabulaStore.getState().objects.find((x) => x.id === id);
    if (!o) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const w0 = o.w;
    const h0 = o.h;

    const move = (ev: PointerEvent) => {
      updateObject(id, {
        w: Math.max(16, snapVal(w0 + ev.clientX - sx)),
        h: Math.max(1, snapVal(h0 + ev.clientY - sy)),
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPreview) return;
    const kind = e.dataTransfer.getData('text/plain') as Kind;
    if (!kind) return;
    const page = pageRef.current;
    if (!page) return;
    const r = page.getBoundingClientRect();
    snapshot();
    const obj = addObject(kind, snapVal(e.clientX - r.left - 40), snapVal(e.clientY - r.top - 20));
    const band = sections.find((s) => obj.y >= s.y && obj.y < s.y + s.h);
    selectObject(obj.id);
    if (band) selectSection(band.id);
  };

  return (
    <div
      ref={pageRef}
      className={`canvas-page${isPreview ? ' preview-page' : ''}`}
      style={{
        width: isPreview ? DEVICE_WIDTHS[device] : PAGE_WIDTH,
        minHeight: Math.max(height, 80),
        background: theme.paper,
        position: 'relative',
        overflow: isPreview ? 'hidden' : undefined,
      }}
      onDragOver={isPreview ? undefined : (e) => e.preventDefault()}
      onDrop={isPreview ? undefined : onDrop}
      onClick={isPreview ? undefined : (event) => {
        if (event.target !== event.currentTarget) return;
        selectObject(null);
        selectSection(null);
      }}
    >
      {sections.map((sec, i) => (
        <div
          key={sec.id}
          className="canvas-section"
          style={sectionStyle(sec, !isPreview && sec.id === selectedSectionId, theme.accent, i === 0)}
          onClick={isPreview ? undefined : (e) => {
            e.stopPropagation();
            selectSection(sec.id);
          }}
        >
          {!isPreview && <span className="section-chip">{sec.name}</span>}
        </div>
      ))}
      {objects.filter((o) => !o.hidden).map((o) => {
        const selectedObject = objects.find((candidate) => candidate.id === selectedId);
        const primarySelected = !isPreview && o.id === selectedId;
        const selected = primarySelected || (!isPreview && Boolean(selectedObject?.groupId) && o.groupId === selectedObject?.groupId);
        const groupLocked = o.locked || Boolean(o.groupId && objects.some((candidate) => candidate.groupId === o.groupId && candidate.locked));
        const editable = !BLOCK_KINDS.includes(o.kind);
        const editing = editingId === o.id;
        return (
          <div
            key={o.id}
            className={`canvas-object${isPreview && revealIndexById.has(o.id) ? ' stagger-reveal' : ''}`}
            data-kind={o.kind}
            style={{
              ...objectStyle(o, selected, theme),
              ...(isPreview ? {
                cursor: 'default',
                outline: 'none',
                transitionDelay: `${(revealIndexById.get(o.id) ?? 0) % 4 * 120}ms`,
              } : {}),
            }}
            onPointerDown={isPreview || groupLocked ? undefined : (e) => startDrag(o.id, e)}
            onClick={isPreview ? undefined : (e) => {
              e.stopPropagation();
              selectObject(o.id);
            }}
            onDoubleClick={isPreview ? undefined : (e) => {
              if (!editable) return;
              e.stopPropagation();
              snapshot();
              selectObject(o.id);
              setEditingId(o.id);
            }}
          >
            {editing ? (
              <textarea
                autoFocus
                value={o.text}
                style={{
                  ...textStyle(o, theme),
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  resize: 'none',
                  outline: 'none',
                  background: theme.paper,
                  overflow: 'hidden',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  selectObject(o.id);
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => updateObject(o.id, { text: e.target.value })}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (o.kind === 'image' || o.kind === 'logo') && o.imageSrc ? (
              <img className={o.kind === 'logo' ? 'canvas-uploaded-logo' : 'canvas-uploaded-image'} src={o.imageSrc} alt={o.label || (o.kind === 'logo' ? 'Uploaded logo' : 'Uploaded image')} draggable={false} />
            ) : o.kind === 'image' || o.kind === 'logo' ? (
              <label className="canvas-image-placeholder" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                <span>{o.label || (o.kind === 'logo' ? 'Logo placeholder' : 'Image placeholder')}</span>
                <strong>+ Upload {o.kind}</strong>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    snapshot();
                    const reader = new FileReader();
                    reader.onload = () => updateObject(o.id, { imageSrc: String(reader.result), imageOriginalSrc: '', label: o.label || file.name.replace(/\.[^.]+$/, '') });
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            ) : o.kind === 'cloud' ? (
              <CloudGraphic />
            ) : o.kind === 'splash' ? (
              <SplashGraphic />
            ) : o.kind === 'logomark' ? (
              <LogomarkGraphic color={o.color} />
            ) : o.kind === 'icon' ? (
              isPreview && o.href && o.href !== '#' ? (
                <a className="canvas-icon-link" href={o.href} aria-label={o.label || `${o.iconName} link`}><IconGraphic name={o.iconName} /></a>
              ) : <IconGraphic name={o.iconName} />
            ) : o.kind === 'reminder' ? (
              <button
                type="button"
                className="canvas-reminder-trigger"
                tabIndex={0}
                onPointerDown={(event) => {
                  if (isPreview) event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isPreview) {
                    selectObject(o.id);
                  }
                  setReminderSaved(false);
                  setReminderOpen(true);
                }}
              >{o.text || 'Remind me'}</button>
            ) : o.kind === 'nav' ? (
              <div className="canvas-navigation">
                <span className="canvas-navigation-brand">
                  {o.navLogo ? <img src={o.navLogo} alt={o.navBrand || navigationParts(o.text)[0] || 'Company logo'} style={{ width: o.navLogoWidth, height: o.navLogoHeight }} /> : null}
                  {!o.navLogo ? (o.navBrand || navigationParts(o.text)[0] || '') : null}
                </span>
                <span className="canvas-navigation-links">
                  {((o.navLinks?.length ? o.navLinks : navigationParts(o.text).slice(1).map((label, index) => ({ id: `nav-${index}`, label, href: '#' }))) as NavLink[]).map((link) => (
                    <span key={link.id} className={`canvas-nav-item${link.children?.length ? ' has-submenu' : ''}`} tabIndex={link.children?.length ? 0 : undefined}>
                      <span>{link.label}{link.children?.length ? ' ▾' : ''}</span>
                      {link.children?.length ? (
                        <span className="canvas-nav-submenu">
                          {link.children.map((child) => <span key={child.id}>{child.label}</span>)}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </span>
              </div>
            ) : isPoweredByJaren(o.text) ? (
              <span className="powered-by-jaren">
                <span>{coloredText(o)}</span>
                <i className="power-status-light" aria-hidden="true" />
              </span>
            ) : (
              o.text ? coloredText(o) : (o.kind === 'video' ? o.label || o.kind : '')
            )}
            {primarySelected && !editing && !isPreview && !groupLocked && (
              <span
                className="resize-handle"
                style={{ background: theme.accent }}
                onPointerDown={(e) => startResize(o.id, e)}
              />
            )}
          </div>
        );
      })}
      {!isPreview && alignmentGuides.map((guide) => (
        <span
          key={`${guide.axis}-${guide.position}`}
          className={`alignment-guide ${guide.axis === 'x' ? 'vertical' : 'horizontal'}`}
          style={guide.axis === 'x'
            ? { left: guide.position, top: guide.start, height: guide.end - guide.start }
            : { top: guide.position, left: guide.start, width: guide.end - guide.start }}
          aria-hidden="true"
        />
      ))}
      {reminderOpen ? (
        <div className="reminder-modal-backdrop" role="presentation" onMouseDown={() => setReminderOpen(false)}>
          <form
            className="reminder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setReminderSaved(true);
            }}
          >
            <button type="button" className="reminder-modal-close" aria-label="Close reminder options" onClick={() => setReminderOpen(false)}>×</button>
            <span className="reminder-modal-kicker">Stay connected</span>
            <h2 id="reminder-modal-title">How should we remind you?</h2>
            <p>Choose where you want to receive the reminder.</p>
            <div className="reminder-channel-options" role="radiogroup" aria-label="Reminder delivery method">
              {([['email', 'Email'], ['messenger', 'Facebook Messenger'], ['sms', 'Text message']] as const).map(([value, label]) => (
                <button key={value} type="button" role="radio" aria-checked={reminderChannel === value} className={reminderChannel === value ? 'active' : ''} onClick={() => { setReminderChannel(value); setReminderSaved(false); }}>{label}</button>
              ))}
            </div>
            <label>{reminderChannel === 'email' ? 'Email address' : reminderChannel === 'sms' ? 'Mobile number' : 'Facebook Messenger name'}<input required type={reminderChannel === 'email' ? 'email' : reminderChannel === 'sms' ? 'tel' : 'text'} placeholder={reminderChannel === 'email' ? 'you@company.com' : reminderChannel === 'sms' ? '(555) 555-0123' : 'Messenger username'} /></label>
            <div className="reminder-date-row">
              <label>Date<input required type="date" /></label>
              <label>Time<input required type="time" /></label>
            </div>
            <label>Reminder note<textarea rows={3} placeholder="What would you like us to remind you about?" /></label>
            <button type="submit" className="reminder-submit">Schedule reminder</button>
            {reminderSaved ? <output className="reminder-confirmation">Reminder request saved. Delivery connects when a messaging provider is configured.</output> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
