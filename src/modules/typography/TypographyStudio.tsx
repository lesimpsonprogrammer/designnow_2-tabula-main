import { useMemo, useState } from 'react';
import { useAuth } from '../../components/Auth/AuthGate';
import { FONT_OPTIONS, TYPOGRAPHY_PRESETS, TYPE_SCALE } from '../../lib/fonts';
import './TypographyStudio.css';

type Design = { brand: string; head: string; body: string; sample: string; size: number };
const brands = TYPOGRAPHY_PRESETS.filter((p) => !p.name.includes('preview only'));
const defaultDesign: Design = { brand: brands[0].name, head: brands[0].head, body: brands[0].body, sample: 'Where data becomes your business strength.', size: 40 };
const safeLoad = (key: string): Design => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultDesign;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultDesign;
    const item = parsed as Partial<Design>;
    if (typeof item.brand !== 'string' || typeof item.head !== 'string' || typeof item.body !== 'string' || typeof item.sample !== 'string' || typeof item.size !== 'number') return defaultDesign;
    if (!FONT_OPTIONS.some((f) => f.value === item.head) || !FONT_OPTIONS.some((f) => f.value === item.body)) return defaultDesign;
    return { brand: item.brand.slice(0, 120), head: item.head, body: item.body, sample: item.sample.slice(0, 500), size: Math.min(96, Math.max(16, item.size)) };
  } catch { return defaultDesign; }
};

export default function TypographyStudio() {
  const { org, user, signOut } = useAuth();
  const storageKey = `tabula:typography:v1:${org.id}:${user.id}`;
  const [design, setDesign] = useState<Design>(() => safeLoad(storageKey));
  const [status, setStatus] = useState('Changes are not saved until you choose Save.');
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => Object.entries(TYPE_SCALE), []);
  const patch = (value: Partial<Design>) => { setDesign((current) => ({ ...current, ...value })); setStatus('Unsaved changes'); };
  const save = () => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(design)); setStatus('Saved to this browser for your account and organization.'); }
    catch { setStatus('Unable to save: browser storage may be blocked.'); }
  };
  const exportDesign = () => {
    const payload = JSON.stringify({ version: 1, organization: org.name, typography: design, scale: TYPE_SCALE }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'tabula-typography.json'; anchor.click();
    URL.revokeObjectURL(url);
  };
  return <main className="type-studio">
    <header className="type-topbar">
      <div><strong>Tabula</strong><span>Typography Studio</span></div>
      <nav aria-label="Studio navigation"><a href="/">Full Tabula Editor</a><span>{org.name}</span><button disabled={busy} onClick={() => { setBusy(true); void signOut().catch(() => setStatus('Sign out failed.')).finally(() => setBusy(false)); }}>Sign out</button></nav>
    </header>
    <div className="type-wrap">
      <div className="type-intro"><p className="type-eyebrow">Independent workspace · v1.0</p><h1>Design your typography.</h1><p>Choose a brand style, fine-tune your fonts, and save or export your settings. No website project required.</p></div>
      <div className="type-layout">
        <section className="type-controls" aria-labelledby="controls-title">
          <h2 id="controls-title">Type settings</h2>
          <label>Brand starting point
            <select value={design.brand} onChange={(e) => { const selection = brands.find((p) => p.name === e.target.value); if (selection) patch({ brand: selection.name, head: selection.head, body: selection.body }); }}>
              {brands.map((brand) => <option key={brand.name}>{brand.name}</option>)}
            </select>
          </label>
          <label>Heading font<select value={design.head} onChange={(e) => patch({ head: e.target.value })}>{FONT_OPTIONS.map((font) => <option value={font.value} key={font.label}>{font.label}</option>)}</select></label>
          <label>Body font<select value={design.body} onChange={(e) => patch({ body: e.target.value })}>{FONT_OPTIONS.map((font) => <option value={font.value} key={font.label}>{font.label}</option>)}</select></label>
          <label>Heading size: {design.size}px<input type="range" min={16} max={96} value={design.size} onChange={(e) => patch({ size: Number(e.target.value) })}/></label>
          <label>Preview text<textarea rows={3} maxLength={500} value={design.sample} onChange={(e) => patch({ sample: e.target.value })}/></label>
          <div className="type-actions"><button className="type-primary" onClick={save}>Save</button><button onClick={exportDesign}>Export JSON</button></div>
          <p role="status" className="type-status">{status}</p>
          <p className="type-note">Saved settings stay in this browser; cloud sync is not enabled yet. Momentum Script remains a preview fallback until its custom font files are ready.</p>
        </section>
        <section className="type-preview" aria-labelledby="preview-title">
          <div className="type-preview-header"><h2 id="preview-title">Live preview</h2><span>{design.brand}</span></div>
          <div className="type-preview-paper">
            <p className="type-eyebrow" style={{ fontFamily: design.body }}>MOMENTUM DATA SOLUTIONS</p>
            <h3 style={{ fontFamily: design.head, fontSize: design.size, lineHeight: 1.15 }}>{design.sample || 'Your headline goes here'}</h3>
            <p style={{ fontFamily: design.body, fontSize: 16, lineHeight: 1.6 }}>Beautiful, accessible typography helps every brand communicate clearly. Review headings, body text, and interface labels before publishing.</p>
            <button className="type-sample-button" style={{ fontFamily: design.body }}>Explore the experience</button>
          </div>
          <h2>Typography scale</h2>
          <div className="type-scale">{summary.map(([name, value]) => <div key={name}><span>{name}</span><strong style={{ fontSize: Math.min(value, 40), fontFamily: design.head }}>{value}px · Aa</strong></div>)}</div>
        </section>
      </div>
    </div>
  </main>;
}
