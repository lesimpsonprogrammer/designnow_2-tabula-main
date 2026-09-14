import { useRef, useState } from 'react';
import { flushPendingSave, openProjectFile, prepareProjectDownload, useTabulaStore } from '../../store/useTabulaStore';
import { CompletionIndicator } from '../Completion/CompletionIndicator';
import { useAuth } from '../Auth/AuthGate';
import { LicenseAdmin } from '../LicenseAdmin/LicenseAdmin';
import { useTeams } from '../Teams/TeamsProvider';

export function Header() {
  const { user, org, isPlatformAdmin, signOut } = useAuth();
  const { isTeamsEdition, canOpenBuilder, canOpenSettings, openBuilder, openSettings } = useTeams();
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [licenseAdminOpen, setLicenseAdminOpen] = useState(false);
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

  const trialDaysLeft = Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / 86_400_000);
  const trialExpired = org.plan === 'trial' && trialDaysLeft <= 0;

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
        <div className="header-group header-group-session">
          {org.plan === 'trial' ? (
            <span className={`trial-pill${trialExpired ? ' trial-pill-expired' : ''}`}>
              {trialExpired ? 'Trial ended' : `Trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`}
            </span>
          ) : null}
          {isTeamsEdition ? <span className="trial-pill">Teams</span> : null}
          <span className="header-user" title={user.email}>{org.name} · {user.email}</span>
          {canOpenBuilder ? <button type="button" onClick={openBuilder}>Organization</button> : null}
          {canOpenSettings ? <button type="button" onClick={openSettings}>Settings</button> : null}
          {isPlatformAdmin ? <button type="button" onClick={() => setLicenseAdminOpen(true)}>Licenses</button> : null}
          <button type="button" className="header-link-btn" onClick={() => void signOut()}>Sign out</button>
        </div>

        <span className="header-divider" aria-hidden="true" />

        <div className="header-group">
          <span role="status" aria-live="polite" className="autosave-status"
            title={savedAt ? `Last saved in this browser: ${new Date(savedAt).toLocaleString()}` : 'Autosaves in this browser'}>
            {saveStatus === 'error' ? 'Autosave failed' : saveStatus === 'pending' ? 'Saving…' : saveStatus === 'saved' ? 'Saved locally' : 'Autosave ready'}
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
        </div>

        <span className="header-divider" aria-hidden="true" />

        <div className="header-group">
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
      </div>
      {licenseAdminOpen ? <LicenseAdmin onClose={() => setLicenseAdminOpen(false)} /> : null}
    </header>
  );
}
