import { useState } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import type { Obj } from '../../types';

function layerName(object: Obj) {
  const content = object.text || object.label || object.kind;
  return content.replace(/\s+/g, ' ').trim().slice(0, 34) || object.kind;
}

export function LayersPanel() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const objects = useTabulaStore((state) => state.objects);
  const sections = useTabulaStore((state) => state.sections);
  const selectedId = useTabulaStore((state) => state.selectedId);
  const selectedSectionId = useTabulaStore((state) => state.selectedSectionId);
  const groupSelection = useTabulaStore((state) => state.groupSelection);
  const selectObject = useTabulaStore((state) => state.selectObject);
  const selectSection = useTabulaStore((state) => state.selectSection);
  const toggleObjectVisibility = useTabulaStore((state) => state.toggleObjectVisibility);
  const toggleObjectLock = useTabulaStore((state) => state.toggleObjectLock);
  const moveObjectLayer = useTabulaStore((state) => state.moveObjectLayer);
  const toggleGroupSelection = useTabulaStore((state) => state.toggleGroupSelection);
  const clearGroupSelection = useTabulaStore((state) => state.clearGroupSelection);
  const groupSelectedObjects = useTabulaStore((state) => state.groupSelectedObjects);
  const ungroupObjectGroup = useTabulaStore((state) => state.ungroupObjectGroup);
  const toggleObjectGroupLock = useTabulaStore((state) => state.toggleObjectGroupLock);

  const selectedObject = objects.find((object) => object.id === selectedId);
  const selectedGroup = selectedObject?.groupId
    ? objects.filter((object) => object.groupId === selectedObject.groupId)
    : [];
  const selectedGroupLocked = selectedGroup.length > 0 && selectedGroup.every((object) => object.locked);

  const toggleSection = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="layers-panel">
      <div className="layers-panel-heading">
        <span className="palette-group-label">Page layers</span>
        <small>{objects.length} objects</small>
      </div>
      <div className="layer-group-toolbar">
        <button type="button" disabled={groupSelection.length < 2} onClick={groupSelectedObjects}>Group ({groupSelection.length})</button>
        {groupSelection.length ? <button type="button" onClick={clearGroupSelection}>Clear</button> : null}
        {selectedGroup.length ? (
          <>
            <button type="button" onClick={() => toggleObjectGroupLock(selectedObject!.id)}>{selectedGroupLocked ? 'Unlock group' : 'Lock group'}</button>
            <button type="button" onClick={() => ungroupObjectGroup(selectedObject!.id)}>Ungroup</button>
          </>
        ) : null}
      </div>
      <p className="layer-group-help">Select the square beside two or more layers, then choose Group.</p>
      {sections.map((section) => {
        const sectionObjects = objects.filter((object) => object.y >= section.y && object.y < section.y + section.h);
        const isCollapsed = collapsed.has(section.id);
        return (
          <section className="layer-section" key={section.id}>
            <div className={`layer-section-row${selectedSectionId === section.id ? ' selected' : ''}`}>
              <button type="button" className="layer-disclosure" aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${section.name}`} onClick={() => toggleSection(section.id)}>{isCollapsed ? '▸' : '▾'}</button>
              <button type="button" className="layer-section-name" onClick={() => selectSection(section.id)}>{section.name}</button>
              <span>{sectionObjects.length}</span>
            </div>
            {!isCollapsed ? (
              <div className="layer-object-list">
                {[...sectionObjects].reverse().map((object) => (
                  <div className={`layer-object-row${selectedId === object.id ? ' selected' : ''}${object.hidden ? ' hidden-layer' : ''}`} key={object.id}>
                    <button
                      type="button"
                      className={`layer-group-select${groupSelection.includes(object.id) ? ' active' : ''}`}
                      aria-label={`${groupSelection.includes(object.id) ? 'Remove' : 'Add'} ${layerName(object)} ${groupSelection.includes(object.id) ? 'from' : 'to'} group selection`}
                      aria-pressed={groupSelection.includes(object.id)}
                      title="Select for grouping"
                      onClick={() => toggleGroupSelection(object.id)}
                    >{object.groupId ? '▣' : groupSelection.includes(object.id) ? '■' : '□'}</button>
                    <button type="button" className="layer-object-name" title={object.text || object.label || object.id} onClick={() => selectObject(object.id)}>
                      <span>{object.kind}</span>
                      <strong>{layerName(object)}</strong>
                    </button>
                    <div className="layer-actions">
                      <button type="button" aria-label={`Bring ${layerName(object)} forward`} title="Bring forward" onClick={() => moveObjectLayer(object.id, 1)}>↑</button>
                      <button type="button" aria-label={`Send ${layerName(object)} backward`} title="Send backward" onClick={() => moveObjectLayer(object.id, -1)}>↓</button>
                      <button type="button" className={object.hidden ? 'active' : ''} aria-label={`${object.hidden ? 'Show' : 'Hide'} ${layerName(object)}`} title={object.hidden ? 'Show' : 'Hide'} onClick={() => toggleObjectVisibility(object.id)}>{object.hidden ? '○' : '◉'}</button>
                      <button type="button" className={object.locked ? 'active' : ''} aria-label={`${object.locked ? 'Unlock' : 'Lock'} ${layerName(object)}`} title={object.locked ? 'Unlock' : 'Lock'} onClick={() => toggleObjectLock(object.id)}>{object.locked ? '◆' : '◇'}</button>
                    </div>
                  </div>
                ))}
                {!sectionObjects.length ? <p>No objects in this section.</p> : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
