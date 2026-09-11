import { PageBar } from './PageBar';
import { Canvas } from './Canvas';
import { NavigationMenuPanel } from './NavigationMenuPanel';
import { ButtonPanel } from './ButtonPanel';

export function CanvasArea() {
  return (
    <div className="canvas-area">
      <PageBar />
      <div className="canvas-scroll">
        <Canvas />
      </div>
      <NavigationMenuPanel />
      <ButtonPanel />
    </div>
  );
}
