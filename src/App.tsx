import { useState } from 'react';
import { Header } from './components/Header/Header';
import { LeftRail } from './components/LeftRail/LeftRail';
import { CanvasArea } from './components/CanvasArea/CanvasArea';
import { RightRail } from './components/RightRail/RightRail';
import { CodeDrawer } from './components/CodeDrawer/CodeDrawer';
import { Preview } from './components/Preview/Preview';
import { StartScreen } from './components/StartScreen/StartScreen';
import { TeamsProvider } from './components/Teams/TeamsProvider';
import { TeamsOverlays } from './components/Teams/TeamsOverlays';
import { useGlobalKeys } from './lib/useGlobalKeys';
import { useTabulaStore } from './store/useTabulaStore';
import './lib/tokens.css';
import './App.css';

function TabulaWorkspace() {
  const [codeLayout, setCodeLayout] = useState<'bottom' | 'side'>('bottom');
  useGlobalKeys();

  const preview = useTabulaStore((s) => s.preview);
  const rightRailOpen = useTabulaStore((s) => s.rightRailOpen);
  const projectOpen = useTabulaStore((s) => s.projectOpen);

  if (!projectOpen) return <StartScreen />;

  if (preview) {
    return (
      <div className="tabula-app">
        <Preview />
      </div>
    );
  }

  return (
    <div className="tabula-app">
      <Header />
      <div className={`workspace-views ${codeLayout}`}>
        <div className="tabula-body">
          <LeftRail />
          <CanvasArea />
          {rightRailOpen ? <RightRail /> : null}
        </div>
        <CodeDrawer layout={codeLayout} onLayoutChange={setCodeLayout} />
      </div>
    </div>
  );
}

function App() {
  return (
    <TeamsProvider>
      <TabulaWorkspace />
      <TeamsOverlays />
    </TeamsProvider>
  );
}

export default App;
