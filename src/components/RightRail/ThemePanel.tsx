import { useTabulaStore } from '../../store/useTabulaStore';
import { THEMES } from '../../lib/themes';
import { FONT_OPTIONS } from '../../lib/fonts';

export function ThemePanel() {
  const theme = useTabulaStore((s) => s.theme);

  return (
    <div className="theme-panel">
      <div className="theme-fonts">
        <label>
          Heading font
          <select value={theme.head} onChange={(event) => useTabulaStore.setState({ theme: { ...theme, head: event.target.value } })}>
            {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
          </select>
        </label>
        <label>
          Body font
          <select value={theme.body} onChange={(event) => useTabulaStore.setState({ theme: { ...theme, body: event.target.value } })}>
            {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
          </select>
        </label>
      </div>
      {THEMES.map((t) => (
        <button
          key={t.name}
          className={`theme-swatch${t.name === theme.name ? ' active' : ''}`}
          style={{ background: t.paper, color: t.ink, borderColor: t.accent }}
          onClick={() => useTabulaStore.setState({ theme: t })}
        >
          <span className="theme-dot" style={{ background: t.accent }} />
          {t.name}
        </button>
      ))}
    </div>
  );
}
