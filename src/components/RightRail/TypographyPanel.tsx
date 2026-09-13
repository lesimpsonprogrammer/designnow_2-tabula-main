import { useState } from 'react';
import { FONT_OPTIONS } from '../../lib/fonts';
import { HEAD_KINDS } from '../../types';
import { useTabulaStore } from '../../store/useTabulaStore';

const FONT_PAIRINGS = [
  { name: 'Modern', head: 'Archivo, sans-serif', body: 'DM Sans, sans-serif' },
  { name: 'Editorial', head: 'Instrument Serif, serif', body: 'DM Sans, sans-serif' },
  { name: 'Technical', head: 'Space Grotesk, sans-serif', body: 'DM Sans, sans-serif' },
  { name: 'Classic', head: 'Libre Baskerville, serif', body: 'Archivo, sans-serif' },
  { name: 'System', head: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
] as const;

const NON_TEXT_KINDS = new Set(['image', 'logo', 'box', 'card', 'divider', 'spacer', 'video', 'cloud', 'icon']);

const panelSectionStyle = {
  display: 'grid',
  gap: 10,
  padding: '12px 0',
  borderBottom: '1px solid rgba(28,26,24,.09)',
} as const;

const labelStyle = {
  display: 'grid',
  gap: 6,
} as const;

export function TypographyPanel() {
  const [scope, setScope] = useState<'selected' | 'global'>('selected');
  const theme = useTabulaStore((s) => s.theme);
  const objects = useTabulaStore((s) => s.objects);
  const selectedId = useTabulaStore((s) => s.selectedId);
  const updateObject = useTabulaStore((s) => s.updateObject);
  const snapshot = useTabulaStore((s) => s.snapshot);

  const obj = objects.find((object) => object.id === selectedId);
  const isTextObject = Boolean(obj && !NON_TEXT_KINDS.has(obj.kind));
  const effectiveFont = obj
    ? obj.fontFamily || (HEAD_KINDS.includes(obj.kind) ? theme.head : theme.body)
    : theme.body;
  const previewColor = obj && /^#[0-9a-f]{6}$/i.test(obj.color) ? obj.color : theme.ink;

  const beginEdit = () => snapshot();
  const patch = (value: Parameters<typeof updateObject>[1]) => {
    if (!obj) return;
    updateObject(obj.id, value);
  };

  const updateThemeFont = (key: 'head' | 'body', value: string) => {
    useTabulaStore.setState((state) => ({ theme: { ...state.theme, [key]: value } }));
  };

  const applyPairing = (head: string, body: string) => {
    useTabulaStore.setState((state) => ({ theme: { ...state.theme, head, body } }));
  };

  return (
    <div className="theme-panel">
      <div style={{ ...panelSectionStyle, paddingTop: 0 }}>
        <div className="inspector-heading">
          <span>Font Design</span>
          <span>{scope === 'selected' ? 'Selected' : 'Global'}</span>
        </div>
        <div className="inspector-align">
          <span>Scope</span>
          <div role="group" aria-label="Typography scope">
            <button
              type="button"
              className={scope === 'selected' ? 'active' : ''}
              aria-pressed={scope === 'selected'}
              onClick={() => setScope('selected')}
            >
              Selected
            </button>
            <button
              type="button"
              className={scope === 'global' ? 'active' : ''}
              aria-pressed={scope === 'global'}
              onClick={() => setScope('global')}
            >
              Global
            </button>
          </div>
        </div>
      </div>

      {scope === 'global' ? (
        <>
          <div style={panelSectionStyle}>
            <strong>Project typography</strong>
            <label style={labelStyle}>
              Heading font
              <select value={theme.head} onChange={(event) => updateThemeFont('head', event.target.value)}>
                {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Body font
              <select value={theme.body} onChange={(event) => updateThemeFont('body', event.target.value)}>
                {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
          </div>

          <div style={panelSectionStyle}>
            <strong>Font pairings</strong>
            <small>Apply a coordinated heading and body combination across the project.</small>
            <div style={{ display: 'grid', gap: 8 }}>
              {FONT_PAIRINGS.map((pair) => (
                <button
                  key={pair.name}
                  type="button"
                  onClick={() => applyPairing(pair.head, pair.body)}
                  style={{ display: 'grid', gap: 3, textAlign: 'left', padding: 10 }}
                >
                  <strong style={{ fontFamily: pair.head }}>{pair.name}</strong>
                  <span style={{ fontFamily: pair.body, opacity: .72 }}>Heading + body pairing</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...panelSectionStyle, borderBottom: 0 }}>
            <strong>Live preview</strong>
            <div style={{ display: 'grid', gap: 10, padding: 12, border: '1px solid rgba(28,26,24,.12)', borderRadius: 8, background: theme.paper, color: theme.ink }}>
              <div style={{ fontFamily: theme.head, fontSize: 26, lineHeight: 1.08 }}>Build without boundaries.</div>
              <div style={{ fontFamily: theme.body, fontSize: 14, lineHeight: 1.55 }}>Tabula gives you direct control over your site design and content.</div>
            </div>
          </div>
        </>
      ) : !obj ? (
        <div style={{ ...panelSectionStyle, borderBottom: 0 }}>
          <strong>Select a text object</strong>
          <small>Choose a heading, paragraph, button, navigation item, label, or other text layer on the canvas to design its typography.</small>
        </div>
      ) : !isTextObject ? (
        <div style={{ ...panelSectionStyle, borderBottom: 0 }}>
          <strong>{obj.kind} has no editable typography</strong>
          <small>Select a text-bearing object, or switch to Global to change the project font pairing.</small>
        </div>
      ) : (
        <>
          <div style={panelSectionStyle}>
            <strong>{obj.kind} typography</strong>
            <label style={labelStyle}>
              Font family
              <select value={obj.fontFamily} onFocus={beginEdit} onChange={(event) => patch({ fontFamily: event.target.value })}>
                <option value="">Project theme font</option>
                {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Font size
              <input
                type="number"
                min={1}
                max={240}
                value={obj.size}
                onFocus={beginEdit}
                onChange={(event) => patch({ size: Math.max(1, Math.min(240, Number(event.target.value))) })}
              />
            </label>
            <label className="inspector-range">
              <span>Word spacing <output>{obj.wordSpacing ?? 0}</output></span>
              <input
                type="range"
                min={-10}
                max={40}
                value={obj.wordSpacing ?? 0}
                onFocus={beginEdit}
                onChange={(event) => patch({ wordSpacing: Number(event.target.value) })}
              />
            </label>
            <label className="inspector-range">
              <span>Sentence spacing <output>{obj.sentenceSpacing ?? 0}</output></span>
              <input
                type="range"
                min={0}
                max={80}
                value={obj.sentenceSpacing ?? 0}
                onFocus={beginEdit}
                onChange={(event) => patch({ sentenceSpacing: Number(event.target.value) })}
              />
            </label>
          </div>

          <div style={panelSectionStyle}>
            <div className="inspector-align">
              <span>Alignment</span>
              <div role="group" aria-label="Typography alignment">
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
            <button
              type="button"
              className={obj.italic ? 'active' : ''}
              aria-pressed={obj.italic}
              onClick={() => {
                snapshot();
                patch({ italic: !obj.italic });
              }}
            >
              <em>I</em> Italic entire object
            </button>
          </div>

          <div style={panelSectionStyle}>
            <label style={labelStyle}>
              Text color
              <span className="inspector-color-row">
                <input
                  className="inspector-color"
                  type="color"
                  value={previewColor}
                  onFocus={beginEdit}
                  onChange={(event) => patch({ color: event.target.value })}
                />
                <input
                  className="inspector-hex"
                  value={obj.color}
                  onFocus={beginEdit}
                  onChange={(event) => patch({ color: event.target.value })}
                  aria-label="Text color hex value"
                />
              </span>
            </label>
          </div>

          <div style={{ ...panelSectionStyle, borderBottom: 0 }}>
            <strong>Live preview</strong>
            <div
              style={{
                padding: 12,
                border: '1px solid rgba(28,26,24,.12)',
                borderRadius: 8,
                background: theme.paper,
                color: previewColor,
                fontFamily: effectiveFont,
                fontSize: Math.max(10, Math.min(48, obj.size)),
                fontStyle: obj.italic ? 'italic' : 'normal',
                wordSpacing: `${obj.wordSpacing ?? 0}px`,
                textAlign: obj.align ?? 'left',
                lineHeight: 1.35,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {obj.text || 'Typography preview'}
            </div>
            <small>Changes apply immediately to the selected object.</small>
          </div>
        </>
      )}
    </div>
  );
}
