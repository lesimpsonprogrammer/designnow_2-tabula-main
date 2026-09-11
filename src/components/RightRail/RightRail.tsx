import { useTabulaStore } from '../../store/useTabulaStore';
import { Inspector } from './Inspector';
import { ThemePanel } from './ThemePanel';

export function RightRail() {
  const rightTab = useTabulaStore((s) => s.rightTab);
  const setRightTab = useTabulaStore((s) => s.setRightTab);

  return (
    <aside className="right-rail">
      <div className="rail-tabs">
        <button className={`rail-tab${rightTab === 'inspect' ? ' active' : ''}`} onClick={() => setRightTab('inspect')}>
          Inspect
        </button>
        <button className={`rail-tab${rightTab === 'theme' ? ' active' : ''}`} onClick={() => setRightTab('theme')}>
          Theme
        </button>
      </div>
      <div className="rail-body">
        {rightTab === 'inspect' ? <Inspector /> : <ThemePanel />}
      </div>
    </aside>
  );
}
