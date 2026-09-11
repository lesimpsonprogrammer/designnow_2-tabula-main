import { useState } from 'react';
import type { FocusEventHandler } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import { FONT_OPTIONS } from '../../lib/fonts';

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onChange: (value: number) => void;
};

function NumberField({ label, value, min, onFocus, onChange }: NumberFieldProps) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onChange: (value: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function RangeField({ label, value, min, max, onFocus, onChange }: RangeFieldProps) {
  return (
    <label className="inspector-range">
      <span>{label}<output>{value}</output></span>
      <span className="inspector-range-controls">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          className="inspector-range-number"
          type="number"
          min={min}
          max={max}
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
          aria-label={`${label} value`}
        />
      </span>
    </label>
  );
}

type ColorFieldProps = {
  label: string;
  value: string;
  allowNone?: boolean;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onChange: (value: string) => void;
};

function ColorField({ label, value, allowNone = false, onFocus, onChange }: ColorFieldProps) {
  const colorValue = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';

  return (
    <label>
      {label}
      <span className="inspector-color-row">
        <input
          className="inspector-color"
          type="color"
          value={colorValue}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="inspector-hex"
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} hex value`}
        />
        {allowNone ? <button type="button" onClick={() => onChange('transparent')}>None</button> : null}
      </span>
    </label>
  );
}

function removeConnectedImageBackground(source: string, tolerance: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        reject(new Error('Canvas is unavailable'));
        return;
      }
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      const width = canvas.width;
      const height = canvas.height;
      const cornerIndices = [0, width - 1, (height - 1) * width, height * width - 1];
      const cornerColors = cornerIndices.map((index) => [data[index * 4], data[index * 4 + 1], data[index * 4 + 2]]);
      const threshold = tolerance * tolerance * 3;
      const visited = new Uint8Array(width * height);
      const stack: number[] = [];
      for (let x = 0; x < width; x += 1) stack.push(x, (height - 1) * width + x);
      for (let y = 1; y < height - 1; y += 1) stack.push(y * width, y * width + width - 1);

      const matchesBackground = (index: number) => cornerColors.some(([red, green, blue]) => {
        const offset = index * 4;
        const dr = data[offset] - red;
        const dg = data[offset + 1] - green;
        const db = data[offset + 2] - blue;
        return dr * dr + dg * dg + db * db <= threshold;
      });

      while (stack.length) {
        const index = stack.pop()!;
        if (visited[index]) continue;
        visited[index] = 1;
        if (!matchesBackground(index)) continue;
        data[index * 4 + 3] = 0;
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) stack.push(index - 1);
        if (x < width - 1) stack.push(index + 1);
        if (y > 0) stack.push(index - width);
        if (y < height - 1) stack.push(index + width);
      }

      context.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('The image could not be processed'));
    image.src = source;
  });
}

export function Inspector() {
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const [selectionColor, setSelectionColor] = useState('#1183f0');
  const [liftStrength, setLiftStrength] = useState(50);
  const [backgroundTolerance, setBackgroundTolerance] = useState(34);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const objects = useTabulaStore((s) => s.objects);
  const sections = useTabulaStore((s) => s.sections);
  const selectedId = useTabulaStore((s) => s.selectedId);
  const selectedSectionId = useTabulaStore((s) => s.selectedSectionId);
  const updateObject = useTabulaStore((s) => s.updateObject);
  const removeObject = useTabulaStore((s) => s.removeObject);
  const duplicateSelected = useTabulaStore((s) => s.duplicateSelected);
  const ungroupObjectGroup = useTabulaStore((s) => s.ungroupObjectGroup);
  const toggleObjectGroupLock = useTabulaStore((s) => s.toggleObjectGroupLock);
  const copySelectedStyleToSection = useTabulaStore((s) => s.copySelectedStyleToSection);
  const snapshot = useTabulaStore((s) => s.snapshot);
  const setSectionHeight = useTabulaStore((s) => s.setSectionHeight);
  const renameSection = useTabulaStore((s) => s.renameSection);
  const setSectionBg = useTabulaStore((s) => s.setSectionBg);
  const shiftSectionContent = useTabulaStore((s) => s.shiftSectionContent);
  const applyCloudHero = useTabulaStore((s) => s.applyCloudHero);
  const restoreServiceContainers = useTabulaStore((s) => s.restoreServiceContainers);
  const addServiceIcons = useTabulaStore((s) => s.addServiceIcons);
  const moveSection = useTabulaStore((s) => s.moveSection);
  const duplicateSection = useTabulaStore((s) => s.duplicateSection);
  const deleteSection = useTabulaStore((s) => s.deleteSection);

  const obj = objects.find((object) => object.id === selectedId);
  const sec = sections.find((section) => section.id === selectedSectionId);
  const beginEdit = () => snapshot();

  if (obj) {
    const patch = (value: Parameters<typeof updateObject>[1]) => updateObject(obj.id, value);
    const containingSection = sections.find((section) => obj.y >= section.y && obj.y < section.y + section.h);
    const otherObjectsInSection = containingSection
      ? objects.filter((object) => object.id !== obj.id && object.y >= containingSection.y && object.y < containingSection.y + containingSection.h).length
      : 0;
    const hasTextSelection = textSelection.start !== textSelection.end;
    const selectionIsItalic = hasTextSelection && (obj.textItalics ?? []).some((range) => range.start <= textSelection.start && range.end >= textSelection.end);

    return (
      <div className="inspector">
        <div className="inspector-heading">
          <span>{obj.kind}</span>
          <span>{obj.id}</span>
        </div>

        {obj.groupId ? (
          <div className="inspector-group-status">
            <span>Grouped with {objects.filter((object) => object.groupId === obj.groupId).length - 1} other {objects.filter((object) => object.groupId === obj.groupId).length === 2 ? 'layer' : 'layers'}</span>
            <div>
              <button type="button" onClick={() => toggleObjectGroupLock(obj.id)}>{objects.filter((object) => object.groupId === obj.groupId).every((object) => object.locked) ? 'Unlock group' : 'Lock group'}</button>
              <button type="button" onClick={() => ungroupObjectGroup(obj.id)}>Ungroup</button>
            </div>
          </div>
        ) : null}

        {obj.kind === 'icon' ? (
          <label>
            Icon
            <select value={obj.iconName} onFocus={beginEdit} onChange={(event) => patch({ iconName: event.target.value as typeof obj.iconName })}>
              <option value="database">Database</option>
              <option value="workflow">Workflow</option>
              <option value="users">People</option>
              <option value="calculator">Payroll</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="x">X</option>
            </select>
            <span>Destination URL</span>
            <input value={obj.href} placeholder="https://" onFocus={beginEdit} onChange={(event) => patch({ href: event.target.value })} />
          </label>
        ) : null}

        {obj.kind === 'nav' ? (
          <p className="inspector-note inspector-nav-note">Menu content is available in the floating Navigation panel beside the canvas.</p>
        ) : obj.kind === 'button' ? (
          <p className="inspector-note inspector-nav-note">Button content and design are available in the floating Button panel beside the canvas.</p>
        ) : obj.kind === 'icon' ? (
          <p className="inspector-note">Choose the symbol below, then use Ink to recolor it.</p>
        ) : obj.kind === 'image' || obj.kind === 'logo' ? (
          <div className="inspector-image-upload">
            <label>
              {obj.kind === 'logo' ? 'Logo file' : 'Image file'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  snapshot();
                  const reader = new FileReader();
                  reader.onload = () => patch({ imageSrc: String(reader.result), imageOriginalSrc: '', label: obj.label || file.name.replace(/\.[^.]+$/, '') });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <label>{obj.kind === 'logo' ? 'Logo alt text' : 'Alt text'}<input value={obj.label} onFocus={beginEdit} onChange={(event) => patch({ label: event.target.value })} /></label>
            {obj.imageSrc ? (
              <div className="inspector-background-removal">
                <label className="inspector-range">
                  <span>Background tolerance <output>{backgroundTolerance}</output></span>
                  <input type="range" min={8} max={80} value={backgroundTolerance} onChange={(event) => setBackgroundTolerance(Number(event.target.value))} />
                </label>
                <button
                  type="button"
                  disabled={backgroundBusy}
                  onClick={async () => {
                    setBackgroundBusy(true);
                    try {
                      const original = obj.imageOriginalSrc || obj.imageSrc;
                      const imageSrc = await removeConnectedImageBackground(original, backgroundTolerance);
                      snapshot();
                      patch({ imageSrc, imageOriginalSrc: original });
                    } finally {
                      setBackgroundBusy(false);
                    }
                  }}
                >
                  {backgroundBusy ? 'Removing background…' : 'Remove background'}
                </button>
                {obj.imageOriginalSrc ? <button type="button" onClick={() => { snapshot(); patch({ imageSrc: obj.imageOriginalSrc, imageOriginalSrc: '' }); }}>Restore original background</button> : null}
                <small>Best for solid or nearly solid backgrounds connected to the image edges.</small>
              </div>
            ) : null}
            {obj.imageSrc ? <button type="button" onClick={() => { snapshot(); patch({ imageSrc: '', imageOriginalSrc: '' }); }}>Remove {obj.kind}</button> : null}
          </div>
        ) : (
          <label>
            Text
            <textarea
              value={obj.text}
              rows={4}
              onFocus={beginEdit}
              onSelect={(event) => setTextSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })}
              onChange={(event) => patch({ text: event.target.value, textColors: [], textItalics: [] })}
            />
          </label>
        )}

        <div className="inspector-align">
          <span>Text alignment</span>
          <div role="group" aria-label="Text alignment">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                className={(obj.align ?? 'left') === align ? 'active' : ''}
                aria-pressed={(obj.align ?? 'left') === align}
                onClick={() => {
                  snapshot();
                  patch({ align });
                }}
              >
                {align === 'left' ? 'Left' : align === 'center' ? 'Center' : 'Right'}
              </button>
            ))}
          </div>
        </div>

        <div className="inspector-align">
          <span>Vertical alignment</span>
          <div role="group" aria-label="Vertical alignment">
            {(['top', 'middle', 'bottom'] as const).map((vAlign) => (
              <button
                key={vAlign}
                type="button"
                className={(obj.vAlign ?? 'top') === vAlign ? 'active' : ''}
                aria-pressed={(obj.vAlign ?? 'top') === vAlign}
                onClick={() => {
                  snapshot();
                  patch({ vAlign });
                }}
              >
                {vAlign === 'top' ? 'Top' : vAlign === 'middle' ? 'Middle' : 'Bottom'}
              </button>
            ))}
          </div>
        </div>

        <div className="inspector-grid inspector-grid-3">
          <NumberField label="X" value={obj.x} onFocus={beginEdit} onChange={(x) => patch({ x })} />
          <NumberField label="Y" value={obj.y} onFocus={beginEdit} onChange={(y) => patch({ y })} />
          <NumberField label="Size" value={obj.size} min={1} onFocus={beginEdit} onChange={(size) => patch({ size: Math.max(1, size) })} />
        </div>
        <label>
          Font
          <select value={obj.fontFamily} onFocus={beginEdit} onChange={(event) => patch({ fontFamily: event.target.value })}>
            <option value="">Project theme font</option>
            {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
          </select>
        </label>
        {obj.text ? (
          <div className="inspector-text-spacing">
            <RangeField label="Word spacing" value={obj.wordSpacing ?? 0} min={-10} max={40} onFocus={beginEdit} onChange={(wordSpacing) => patch({ wordSpacing })} />
            <RangeField label="Sentence spacing" value={obj.sentenceSpacing ?? 0} min={0} max={80} onFocus={beginEdit} onChange={(sentenceSpacing) => patch({ sentenceSpacing })} />
            <small>Word spacing changes every gap. Sentence spacing adds room after periods, question marks, and exclamation marks.</small>
          </div>
        ) : null}
        <div className="inspector-format" role="group" aria-label="Text formatting">
          <button
            type="button"
            className={(hasTextSelection ? selectionIsItalic : obj.italic) ? 'active' : ''}
            aria-pressed={hasTextSelection ? selectionIsItalic : obj.italic}
            onClick={() => {
              snapshot();
              if (!hasTextSelection) {
                patch({ italic: !obj.italic });
                return;
              }
              const existing = obj.textItalics ?? [];
              if (selectionIsItalic) {
                const next = existing.flatMap((range) => {
                  if (range.end <= textSelection.start || range.start >= textSelection.end) return [range];
                  return [
                    ...(range.start < textSelection.start ? [{ ...range, end: textSelection.start }] : []),
                    ...(range.end > textSelection.end ? [{ ...range, start: textSelection.end }] : []),
                  ];
                });
                patch({ textItalics: next });
                return;
              }
              patch({ textItalics: [...existing, { start: textSelection.start, end: textSelection.end }] });
            }}
          ><em>I</em> {hasTextSelection ? 'Italic selected text' : 'Italic entire object'}</button>
        </div>
        {!['nav', 'button', 'icon', 'image', 'logo'].includes(obj.kind) ? (
          <div className="inspector-selection-color">
            <label>
              Selection color
              <span className="inspector-color-row">
                <input className="inspector-color" type="color" value={selectionColor} onChange={(event) => setSelectionColor(event.target.value)} />
                <input className="inspector-hex" aria-label="Selection color hex value" value={selectionColor} onChange={(event) => setSelectionColor(event.target.value)} />
              </span>
            </label>
            <button
              type="button"
              disabled={textSelection.start === textSelection.end || !/^#[0-9a-f]{6}$/i.test(selectionColor)}
              onClick={() => {
                snapshot();
                const nextRanges = (obj.textColors ?? []).flatMap((range) => {
                  if (range.end <= textSelection.start || range.start >= textSelection.end) return [range];
                  return [
                    ...(range.start < textSelection.start ? [{ ...range, end: textSelection.start }] : []),
                    ...(range.end > textSelection.end ? [{ ...range, start: textSelection.end }] : []),
                  ];
                });
                patch({ textColors: [...nextRanges, { start: textSelection.start, end: textSelection.end, color: selectionColor }] });
              }}
            >
              Apply to selected text
            </button>
            <RangeField label="Lift strength" value={liftStrength} min={0} max={100} onFocus={() => undefined} onChange={setLiftStrength} />
            <button
              type="button"
              disabled={textSelection.start === textSelection.end || !/^#[0-9a-f]{6}$/i.test(selectionColor)}
              onClick={() => {
                snapshot();
                const nextRanges = (obj.textColors ?? []).flatMap((range) => {
                  if (range.end <= textSelection.start || range.start >= textSelection.end) return [range];
                  return [
                    ...(range.start < textSelection.start ? [{ ...range, end: textSelection.start }] : []),
                    ...(range.end > textSelection.end ? [{ ...range, start: textSelection.end }] : []),
                  ];
                });
                patch({ textColors: [...nextRanges, { start: textSelection.start, end: textSelection.end, color: selectionColor, shadow: liftStrength > 0, lift: liftStrength }] });
              }}
            >
              Lift selected text
            </button>
            <small>{textSelection.start === textSelection.end ? 'Highlight text above to color only that part.' : `Applies to ${textSelection.end - textSelection.start} selected characters.`}</small>
          </div>
        ) : null}
        <div className="inspector-grid">
          <NumberField label="Width" value={obj.w} min={16} onFocus={beginEdit} onChange={(w) => patch({ w: Math.max(16, w) })} />
          <NumberField label="Height" value={obj.h} min={1} onFocus={beginEdit} onChange={(h) => patch({ h: Math.max(1, h) })} />
        </div>

        <ColorField label="Fill" value={obj.bg} allowNone onFocus={beginEdit} onChange={(bg) => patch({ bg })} />
        {obj.kind === 'divider' ? (
          <label className="inspector-check"><input type="checkbox" checked={obj.dividerGradient} onChange={(event) => { snapshot(); patch({ dividerGradient: event.target.checked }); }} /> Fade divider ends</label>
        ) : null}
        <ColorField label="Ink" value={obj.color} onFocus={beginEdit} onChange={(color) => patch({ color })} />
        <ColorField label="Edge" value={obj.bc} allowNone onFocus={beginEdit} onChange={(bc) => patch({ bc, bw: bc === 'transparent' ? 0 : obj.bw })} />

        <RangeField label="Radius" value={obj.radius} min={0} max={60} onFocus={beginEdit} onChange={(radius) => patch({ radius })} />
        <label className="inspector-range">
          <span>Padding <output>{obj.pad === null ? 'auto' : obj.pad}</output></span>
          <span className="inspector-range-controls">
            <input
              type="range"
              min={0}
              max={64}
              value={obj.pad ?? 0}
              onFocus={beginEdit}
              onChange={(event) => patch({ pad: Number(event.target.value) })}
            />
            <input
              className="inspector-range-number"
              type="number"
              min={0}
              max={64}
              value={obj.pad ?? ''}
              placeholder="Auto"
              onFocus={beginEdit}
              onChange={(event) => patch({
                pad: event.target.value === '' ? null : clamp(Number(event.target.value), 0, 64),
              })}
              aria-label="Padding value"
            />
          </span>
          <button type="button" className="inspector-auto" onClick={() => patch({ pad: null })}>Use automatic padding</button>
        </label>
        <RangeField label="Border" value={obj.bw} min={0} max={12} onFocus={beginEdit} onChange={(bw) => patch({ bw })} />
        <RangeField label="Opacity" value={obj.opacity} min={10} max={100} onFocus={beginEdit} onChange={(opacity) => patch({ opacity })} />

        <button
          type="button"
          className="inspector-copy-style"
          disabled={otherObjectsInSection === 0}
          onClick={() => setCopyDialogOpen(true)}
        >
          Copy design to section ({otherObjectsInSection})
        </button>

        {copyDialogOpen ? (
          <div className="inspector-confirm-backdrop" role="presentation" onMouseDown={() => setCopyDialogOpen(false)}>
            <div
              className="inspector-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="copy-design-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span className="inspector-confirm-kicker">Apply to section</span>
              <h2 id="copy-design-title">
                Want to copy this design to the other {otherObjectsInSection}{' '}
                {otherObjectsInSection === 1 ? 'object' : 'objects'} in this section?
              </h2>
              <p>Text, position, width, height, and object type will stay unchanged.</p>
              <div className="inspector-confirm-actions">
                <button type="button" onClick={() => setCopyDialogOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="inspector-confirm-primary"
                  onClick={() => {
                    copySelectedStyleToSection();
                    setCopyDialogOpen(false);
                  }}
                >
                  Copy design
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="inspector-row">
          <button type="button" onClick={duplicateSelected}>Duplicate</button>
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              snapshot();
              removeObject(obj.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (sec) {
    return (
      <div className="inspector">
        <div className="inspector-heading"><span>Section</span><span>{sec.id}</span></div>
        <label>
          Name
          <input value={sec.name} onFocus={beginEdit} onChange={(event) => renameSection(sec.id, event.target.value)} />
        </label>
        <ColorField label="Background" value={sec.bg} allowNone onFocus={beginEdit} onChange={(bg) => setSectionBg(sec.id, bg)} />
        <label className="inspector-range">
          <span>Height <output>{sec.h}</output></span>
          <input
            type="range"
            min={80}
            max={1200}
            step={20}
            value={sec.h}
            onFocus={beginEdit}
            onChange={(event) => setSectionHeight(sec.id, Number(event.target.value))}
          />
        </label>
        <div className="inspector-row">
          <button onClick={() => moveSection(sec.id, -1)}>Move up</button>
          <button onClick={() => moveSection(sec.id, 1)}>Move down</button>
        </div>
        <div className="inspector-row">
          <button onClick={() => shiftSectionContent(sec.id, -32)}>Content up</button>
          <button onClick={() => shiftSectionContent(sec.id, 32)}>Content down</button>
        </div>
        <button type="button" className="inspector-cloud-hero" onClick={() => applyCloudHero(sec.id)}>Store current objects + apply Cloud Hero</button>
        {objects.some((object) => object.text.trim() === 'Human Resources' && object.y >= sec.y && object.y < sec.y + sec.h) ? (
          <button type="button" onClick={() => restoreServiceContainers(sec.id)}>Restore missing service containers</button>
        ) : null}
        {objects.some((object) => object.text.trim() === 'Human Resources' && object.y >= sec.y && object.y < sec.y + sec.h) ? (
          <button type="button" onClick={() => addServiceIcons(sec.id)}>Format service cards + icons</button>
        ) : null}
        <div className="inspector-row">
          <button onClick={() => duplicateSection(sec.id)}>Duplicate</button>
          <button className="danger-button" onClick={() => deleteSection(sec.id)}>Delete</button>
        </div>
        <p className="inspector-note">Moving or deleting carries the objects inside.</p>
      </div>
    );
  }

  return <div className="rail-placeholder">Select an object or section</div>;
}
