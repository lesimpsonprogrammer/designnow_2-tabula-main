import { useState } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import { IconGraphic } from '../IconGraphic';

export function LibraryPanel() {
  const [name, setName] = useState('');
  const [socialIcon, setSocialIcon] = useState<'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'x'>('linkedin');
  const objects = useTabulaStore((state) => state.objects);
  const selectedId = useTabulaStore((state) => state.selectedId);
  const library = useTabulaStore((state) => state.library);
  const saveSelectedToLibrary = useTabulaStore((state) => state.saveSelectedToLibrary);
  const insertLibraryItem = useTabulaStore((state) => state.insertLibraryItem);
  const removeLibraryItem = useTabulaStore((state) => state.removeLibraryItem);
  const selected = objects.find((object) => object.id === selectedId);
  const addObject = useTabulaStore((state) => state.addObject);
  const selectObject = useTabulaStore((state) => state.selectObject);
  const snapshot = useTabulaStore((state) => state.snapshot);
  const serviceIcons = ['database', 'workflow', 'users', 'calculator'] as const;
  const socialIcons = ['linkedin', 'facebook', 'instagram', 'youtube', 'x'] as const;
  const iconLabel = (iconName: (typeof serviceIcons)[number] | (typeof socialIcons)[number]) =>
    iconName === 'users' ? 'People' : iconName === 'calculator' ? 'Payroll' : iconName === 'x' ? 'X' : iconName;
  const insertIcon = (iconName: (typeof serviceIcons)[number] | (typeof socialIcons)[number]) => {
    snapshot();
    const icon = addObject('icon', 60, 60);
    useTabulaStore.getState().updateObject(icon.id, { iconName, label: `${iconLabel(iconName)} icon` });
    selectObject(icon.id);
  };

  return (
    <div className="library-panel">
      <div className="library-save">
        <span className="palette-group-label">Save for later</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={selected ? 'Name this object' : 'Select an object first'} disabled={!selected} />
        <button type="button" disabled={!selected} onClick={() => { saveSelectedToLibrary(name); setName(''); }}>+ Save selected object</button>
      </div>

      <div className="library-list">
        <span className="palette-group-label">Icon library</span>
        <div className="icon-library-grid">
          {serviceIcons.map((iconName) => (
            <button type="button" key={iconName} onClick={() => insertIcon(iconName)}>
              <IconGraphic name={iconName} />
              <span>{iconLabel(iconName)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="library-list">
        <span className="palette-group-label">Social media selector</span>
        <div className="social-icon-picker">
          <span className="social-icon-preview"><IconGraphic name={socialIcon} /></span>
          <select aria-label="Social media platform" value={socialIcon} onChange={(event) => setSocialIcon(event.target.value as typeof socialIcon)}>
            {socialIcons.map((iconName) => <option key={iconName} value={iconName}>{iconLabel(iconName)}</option>)}
          </select>
          <button type="button" onClick={() => insertIcon(socialIcon)}>+ Insert social icon</button>
        </div>
      </div>

      <div className="library-list">
        <span className="palette-group-label">Saved objects · {library.length}</span>
        {!library.length ? <p>No saved objects yet. Select anything on the canvas and save it here.</p> : null}
        {library.map((item) => (
          <article className="library-item" key={item.id}>
            <div><span>{item.object.kind}</span><strong>{item.name}</strong><small>{item.object.w} × {item.object.h}</small></div>
            <div className="library-item-actions">
              <button type="button" onClick={() => insertLibraryItem(item.id)}>Insert</button>
              <button type="button" aria-label={`Remove ${item.name} from library`} onClick={() => removeLibraryItem(item.id)}>×</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
