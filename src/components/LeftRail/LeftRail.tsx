import { useTabulaStore } from '../../store/useTabulaStore';
import { PagesPanel } from './PagesPanel';
import { Palette } from './Palette';
import { LibraryPanel } from './LibraryPanel';
import { LayersPanel } from './LayersPanel';
import { EventsPanel } from './EventsPanel';
import type { LeftTab } from '../../types';

const TABS: LeftTab[] = ['pages', 'objects', 'layers', 'library', 'events'];

export function LeftRail() {
  const leftTab = useTabulaStore((s) => s.leftTab);
  const setLeftTab = useTabulaStore((s) => s.setLeftTab);

  return (
    <aside className="left-rail">
      <div className="rail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`rail-tab${tab === leftTab ? ' active' : ''}`}
            onClick={() => setLeftTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="rail-body">
        {leftTab === 'pages' && <PagesPanel />}
        {leftTab === 'objects' && <Palette />}
        {leftTab === 'layers' && <LayersPanel />}
        {leftTab === 'library' && <LibraryPanel />}
        {leftTab === 'events' && <EventsPanel />}
      </div>
    </aside>
  );
}
