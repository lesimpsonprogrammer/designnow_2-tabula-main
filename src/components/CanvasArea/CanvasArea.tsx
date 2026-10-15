import { PageBar } from './PageBar';
import { Canvas } from './Canvas';

export function CanvasArea() {
  return (
    <div className="canvas-area">
      <PageBar />
      <div className="canvas-scroll">
        <Canvas />
      </div>
    </div>
  );
}
