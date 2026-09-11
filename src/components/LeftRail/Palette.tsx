import { PALETTE_GROUPS } from '../../lib/palette';
import { useTabulaStore } from '../../store/useTabulaStore';

export function Palette() {
  const addObject = useTabulaStore((s) => s.addObject);
  const snapshot = useTabulaStore((s) => s.snapshot);
  const selectObject = useTabulaStore((s) => s.selectObject);

  return (
    <div className="palette">
      {PALETTE_GROUPS.map((group) => (
        <div key={group.name} className="palette-group">
          <div className="palette-group-label">{group.name}</div>
          <div className="palette-tiles">
            {group.items.map((item) => (
              <button
                key={item.key}
                className="palette-tile"
                title={item.hint}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', item.key)}
                onClick={() => {
                  snapshot();
                  const obj = addObject(item.key, 60, 60);
                  selectObject(obj.id);
                }}
              >
                <span className="palette-glyph">{item.glyph}</span>
                <span className="palette-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
