import { Canvas } from '../CanvasArea/Canvas';
import { useTabulaStore } from '../../store/useTabulaStore';
import type { Device } from '../../types';
import { CompletionIndicator } from '../Completion/CompletionIndicator';

const DEVICES: Array<{ value: Device; label: string }> = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'phone', label: 'Phone' },
];

export function Preview() {
  const pages = useTabulaStore((s) => s.pages);
  const activePageId = useTabulaStore((s) => s.activePageId);
  const device = useTabulaStore((s) => s.device);
  const setDevice = useTabulaStore((s) => s.setDevice);
  const togglePreview = useTabulaStore((s) => s.togglePreview);
  const accent = useTabulaStore((s) => s.theme.accent);

  const activePageName = pages.find((page) => page.id === activePageId)?.name ?? 'Untitled';

  return (
    <main className="preview-shell">
      <div className="preview-toolbar">
        <span className="preview-title">Preview · {activePageName}</span>
        <CompletionIndicator compact />
        <div className="preview-device-switcher" role="group" aria-label="Preview width">
          {DEVICES.map(({ value, label }) => (
            <button
              key={value}
              className={`preview-device${device === value ? ' active' : ''}`}
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="preview-done"
          style={{ background: accent }}
          onClick={togglePreview}
        >
          Done
        </button>
      </div>
      <div className="preview-scroll">
        <Canvas mode="preview" />
      </div>
    </main>
  );
}
