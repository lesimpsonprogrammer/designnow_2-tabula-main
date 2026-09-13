import { useRef, useState } from 'react';
import { flushPendingSave, openProjectFile, prepareProjectDownload, useTabulaStore } from '../../store/useTabulaStore';
import { CompletionIndicator } from '../Completion/CompletionIndicator';
import { useAuth } from '../Auth/AuthGate';

export function Header() {
  const { user, org, signOut } = useAuth();
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const preview = useTabulaStore((s) => s.preview);
  const togglePreview = useTabulaStore((s) => s.togglePreview);
  const undo = useTabulaStore((s) => s.undo);
  const redo = useTabulaStore((s) => s.redo);
  const past = useTabulaStore((s) => s.past.length);
  const future = useTabulaStore((s) => s.future.length);
  const rightRailOpen = useTabulaStore((s) => s.rightRailOpen);
  const toggleRightRail = useTabulaStore((s) => s.toggleRightRail);
  const projectName = useTabulaStore((s) => s.projectName);
  const projectNumber = useTabulaStore((s) => s.projectNumber);
  const saveStatus = useTabulaStore((s) => s.saveStatus);
  const savedAt = useTabulaStore((s) => s.savedAt);
  const projectId = useTabulaStore((s) => s.projectId);
  const returnToStart = useTabulaStore((s) => s.returnToStart);

  const readProject = (file: globalThis.File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!openProjectFile(JSON.parse(String(reader.result)))) throw new Error('invalid');
        setFileError('');
      } catch {
        setFileError('Invalid Tabula project file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="tabula-header">
      <div className="header-left">
        <button type="button" className="brand header-home" onClick={returnToStart}>Tabula</button>
        <span className="header-project-divider">/</span>
        <input
          className="header-project-name"
          value={projectName}
          aria-label="Project name"
          onChange={(event) => useTabulaStore.setState({ projectName: event.target.value })}
        />
        <span className="header-project-number" title={`Project ID: ${projectId}`}>#{String(projectNumber).padStart(4, '0')}</span>
      </div>
      <div className="header-center">
        <CompletionIndicator />
        <button disabled={!past} onClick={undo}>Undo</button>
        <button disabled={!future} onClick={redo}>Redo</button>
      </div>
      <div className="header-right">
        <span className="header-user" title={user.email}>{org.name} · {user.email}</span>
        <button type="button" onClick={() => void signOut()}>Sign out</button>
        <span role="status" aria-live="polite" className="autosave-status"
          title={savedAt ? `Last saved in this browser: ${new Date(savedAt).toLocaleString()}` : 'Autosaves in this browser'}>
          {saveStatus === 'error' ? 'Autosave failed — use Save to download a copy' : saveStatus === 'pending' ? 'Saving…' : saveStatus === 'saved' ? 'Saved locally' : 'Autosave ready'}
        </span>
        {saveStatus === 'error' && <button type="button" onClick={flushPendingSave}>Retry autosave</button>}
        <button type="button" onClick={() => projectInputRef.current?.click()}>Open</button>
        <a className="header-action-link" href="#" download onClick={(event) => prepareProjectDownload(event.currentTarget)}>Save</a>
        <input
          ref={projectInputRef}
          className="project-file-input"
          type="file"
          accept=".tabula,.json,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readProject(file);
            event.target.value = '';
          }}
        />
        {fileError ? <span className="header-file-error" role="alert">{fileError}</span> : null}
        <button
          className={rightRailOpen ? 'active' : ''}
          aria-pressed={rightRailOpen}
          title={`${rightRailOpen ? 'Hide' : 'Show'} Inspect and Theme`}
          onClick={toggleRightRail}
        >
          Inspector {rightRailOpen ? '−' : '+'}
        </button>
        <button onClick={togglePreview}>{preview ? 'Edit' : 'Preview'}</button>
      </div>
    </header>
  );
}
