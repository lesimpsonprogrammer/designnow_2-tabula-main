import { useState } from 'react';
import { FONT_OPTIONS } from '../../lib/fonts';
import { useTabulaStore } from '../../store/useTabulaStore';
import type { Obj } from '../../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const colorValue = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';

export function ButtonPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
  const objects = useTabulaStore((state) => state.objects);
  const selectedId = useTabulaStore((state) => state.selectedId);
  const updateObject = useTabulaStore((state) => state.updateObject);
  const snapshot = useTabulaStore((state) => state.snapshot);
  const duplicateSelected = useTabulaStore((state) => state.duplicateSelected);
  const removeObject = useTabulaStore((state) => state.removeObject);
  const setAllButtonSize = useTabulaStore((state) => state.setAllButtonSize);
  const button = objects.find((object) => object.id === selectedId && object.kind === 'button');

  if (!button) return null;
  const patch = (value: Partial<Obj>) => updateObject(button.id, value);

  return (
    <aside className={`navigation-menu-panel button-floating-panel${collapsed ? ' collapsed' : ''}`} aria-label="Button editor">
      <div className="navigation-menu-header">
        <div><span>Button</span>{!collapsed ? <small>Edit content and appearance</small> : null}</div>
        <button type="button" aria-label={collapsed ? 'Expand button editor' : 'Collapse button editor'} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '+' : '−'}</button>
      </div>

      {!collapsed ? (
        <div className="navigation-menu-body">
          <div className="navigation-menu-tabs" role="tablist" aria-label="Button controls">
            <button type="button" role="tab" aria-selected={activeTab === 'content'} className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>Content</button>
            <button type="button" role="tab" aria-selected={activeTab === 'style'} className={activeTab === 'style' ? 'active' : ''} onClick={() => setActiveTab('style')}>Style</button>
          </div>

          {activeTab === 'content' ? (
            <div className="navigation-menu-tab-panel" role="tabpanel">
              <label>Button label<input aria-label="Button label" value={button.text} onFocus={snapshot} onChange={(event) => patch({ text: event.target.value })} /></label>
              <label>Destination URL<input aria-label="Button destination URL" value={button.href || '#'} placeholder="https:// or /page" onFocus={snapshot} onChange={(event) => patch({ href: event.target.value })} /></label>
              <div className="button-panel-actions">
                <button type="button" onClick={duplicateSelected}>Duplicate</button>
                <button type="button" className="danger-button" onClick={() => { snapshot(); removeObject(button.id); }}>Delete</button>
              </div>
              <button type="button" className="navigation-menu-add" onClick={() => setAllButtonSize(148, 42)}>Apply 148 × 42 to every site button</button>
            </div>
          ) : (
            <div className="navigation-menu-tab-panel navigation-style-panel" role="tabpanel">
              <label>Font<select aria-label="Button font" value={button.fontFamily} onFocus={snapshot} onChange={(event) => patch({ fontFamily: event.target.value })}><option value="">Project theme font</option>{FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select></label>
              <div className="navigation-format" role="group" aria-label="Button text formatting">
                <button type="button" className={button.italic ? 'active' : ''} aria-pressed={button.italic} onClick={() => { snapshot(); patch({ italic: !button.italic }); }}><em>I</em> Italic</button>
              </div>

              <div className="navigation-style-control"><span>Text alignment</span><div className="navigation-segmented" role="group" aria-label="Button text alignment">{(['left', 'center', 'right'] as const).map((align) => <button key={align} type="button" className={button.align === align ? 'active' : ''} aria-pressed={button.align === align} onClick={() => { snapshot(); patch({ align }); }}>{align === 'left' ? 'Left' : align === 'center' ? 'Center' : 'Right'}</button>)}</div></div>
              <div className="navigation-style-control"><span>Vertical alignment</span><div className="navigation-segmented" role="group" aria-label="Button vertical alignment">{(['top', 'middle', 'bottom'] as const).map((vAlign) => <button key={vAlign} type="button" className={button.vAlign === vAlign ? 'active' : ''} aria-pressed={button.vAlign === vAlign} onClick={() => { snapshot(); patch({ vAlign }); }}>{vAlign === 'top' ? 'Top' : vAlign === 'middle' ? 'Middle' : 'Bottom'}</button>)}</div></div>

              <div className="navigation-number-grid three">
                <label>X<input type="number" value={button.x} onFocus={snapshot} onChange={(event) => patch({ x: Number(event.target.value) })} /></label>
                <label>Y<input type="number" value={button.y} onFocus={snapshot} onChange={(event) => patch({ y: Number(event.target.value) })} /></label>
                <label>Size<input type="number" min={1} value={button.size} onFocus={snapshot} onChange={(event) => patch({ size: Math.max(1, Number(event.target.value)) })} /></label>
              </div>
              <div className="navigation-number-grid">
                <label>Width<input type="number" min={16} value={button.w} onFocus={snapshot} onChange={(event) => patch({ w: Math.max(16, Number(event.target.value)) })} /></label>
                <label>Height<input type="number" min={1} value={button.h} onFocus={snapshot} onChange={(event) => patch({ h: Math.max(1, Number(event.target.value)) })} /></label>
              </div>

              {([['Fill', 'bg', button.bg, true], ['Ink', 'color', button.color, false], ['Edge', 'bc', button.bc, true]] as const).map(([label, key, value, allowNone]) => <label key={key}>{label}<span className="navigation-color-row"><input type="color" value={colorValue(value)} onFocus={snapshot} onChange={(event) => patch({ [key]: event.target.value })} /><input aria-label={`Button ${label} hex value`} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: event.target.value })} />{allowNone ? <button type="button" onClick={() => { snapshot(); patch(key === 'bc' ? { bc: 'transparent', bw: 0 } : { [key]: 'transparent' }); }}>None</button> : null}</span></label>)}

              {([['Radius', 'radius', button.radius, 0, 60], ['Border', 'bw', button.bw, 0, 12], ['Opacity', 'opacity', button.opacity, 10, 100]] as const).map(([label, key, value, min, max]) => <label className="navigation-range" key={key}><span>{label}<output>{value}</output></span><span><input type="range" min={min} max={max} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: Number(event.target.value) })} /><input aria-label={`Button ${label} value`} type="number" min={min} max={max} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: clamp(Number(event.target.value), min, max) })} /></span></label>)}

              <label className="navigation-range"><span>Padding <output>{button.pad === null ? 'auto' : button.pad}</output></span><span><input type="range" min={0} max={64} value={button.pad ?? 0} onFocus={snapshot} onChange={(event) => patch({ pad: Number(event.target.value) })} /><input aria-label="Button Padding value" type="number" min={0} max={64} value={button.pad ?? ''} placeholder="Auto" onFocus={snapshot} onChange={(event) => patch({ pad: event.target.value === '' ? null : clamp(Number(event.target.value), 0, 64) })} /></span><button type="button" className="navigation-menu-add" onClick={() => { snapshot(); patch({ pad: null }); }}>Use automatic padding</button></label>
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
}
