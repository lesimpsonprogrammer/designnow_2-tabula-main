import { useRef, useState } from 'react';
import { flushPendingSave, openProjectFile, prepareProjectDownload, useTabulaStore } from '../../store/useTabulaStore';
import { CompletionIndicator } from '../Completion/CompletionIndicator';
import { useAuth } from '../Auth/AuthGate';
import { LicenseAdmin } from '../LicenseAdmin/LicenseAdmin';
import { useTeams } from '../Teams/TeamsProvider';
import { useTutorial } from '../Tutorial/Tutorial';
import { MenuButton } from '../Menu/MenuButton';

const SAVE_LABEL = { error: 'Autosave failed', pending: 'Saving…', saved: 'Saved', idle: 'Autosave on' } as const;

export function Header() {
  const { user, org, isPlatformAdmin, signOut } = useAuth();
  const { isTeamsEdition, canOpenBuilder, canOpenSettings, openBuilder, openSettings } = useTeams();
  const { completed: tutorialCompleted, openTutorial } = useTutorial();
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [licenseAdminOpen, setLicenseAdminOpen] = useState(false);
  const [openedAt] = useState(() => Date.now());
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

  const trialDaysLeft = Math.ceil((new Date(org.trialEndsAt).getTime() - openedAt) / 86_400_000);
  const trialExpired = org.plan === 'trial' && trialDaysLeft <= 0;
  const initials = (org.name || user.email || '?').trim().slice(0, 1).toUpperCase();

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
        <button type="button" className="brand header-home" title="Back to Start" onClick={returnToStart}>Tabula</button>
        <span className="header-project-divider">/</span>
        <input
          className="header-project-name"
          value={projectName}
          aria-label="Project name"
          onChange={(event) => useTabulaStore.setState({ projectName: event.target.value })}
        />
        <span className="header-project-number" title={`Project ID: ${projectId}`}>#{String(projectNumber).padStart(4, '0')}</span>
        <span
          role="status"
          aria-live="polite"
          className={`autosave-status is-${saveStatus}`}
          title={savedAt ? `Last saved in this browser: ${new Date(savedAt).toLocaleString()}` : 'Autosaves in this browser'}
        >
          <i aria-hidden="true" />{SAVE_LABEL[saveStatus]}
        </span>
        {saveStatus === 'error' ? <button type="button" className="header-link-btn" onClick={flushPendingSave}>Retry</button> : null}
      </div>

      <div className="header-center">
        <div className="header-history" role="group" aria-label="History">
          <button type="button" className="header-icon-btn" disabled={!past} onClick={undo} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
          <button type="button" className="header-icon-btn" disabled={!future} onClick={redo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button>
        </div>
        <CompletionIndicator compact />
      </div>

      <div className="header-right">
        {org.plan === 'trial' ? (
          <span className={`trial-pill${trialExpired ? ' trial-pill-expired' : ''}`}>
            {trialExpired ? 'Trial ended' : `Trial · ${trialDaysLeft}d left`}
          </span>
        ) : null}
        {fileError ? <span className="header-file-error" role="alert">{fileError}</span> : null}

        <MenuButton label={<>File <span aria-hidden="true">▾</span></>} title="Open or download the project file">
          {(close) => (
            <>
              <button type="button" role="menuitem" onClick={() => { close(); projectInputRef.current?.click(); }}>
                Open project file…
              </button>
              <a role="menuitem" href="#" download onClick={(event) => { prepareProjectDownload(event.currentTarget); close(); }}>
                Save a copy (.tabula)
              </a>
              {saveStatus === 'error' ? (
                <button type="button" role="menuitem" onClick={() => { close(); flushPendingSave(); }}>Retry autosave</button>
              ) : null}
            </>
          )}
        </MenuButton>
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

        <span className="header-divider" aria-hidden="true" />

        <button
          type="button"
          className={rightRailOpen ? 'active' : ''}
          aria-pressed={rightRailOpen}
          title={`${rightRailOpen ? 'Hide' : 'Show'} Inspect, Typography and Theme`}
          onClick={toggleRightRail}
        >
          Inspector
        </button>
        <button type="button" className="header-primary" onClick={togglePreview}>{preview ? 'Edit' : 'Preview'}</button>

        <MenuButton
          className="header-account"
          title={`${org.name} · ${user.email}`}
          label={<span className="header-avatar" aria-hidden="true">{initials}</span>}
        >
          {(close) => (
            <>
              <div className="menu-identity">
                <strong>{org.name}</strong>
                <span>{user.email}</span>
                {isTeamsEdition || isPlatformAdmin ? (
                  <div className="menu-badges">
                    {isTeamsEdition ? <span className="trial-pill">Teams</span> : null}
                    {isPlatformAdmin ? <span className="trial-pill" title="Platform-wide developer visibility is active">Developer</span> : null}
                  </div>
                ) : null}
              </div>
              <button type="button" role="menuitem" onClick={() => { close(); openTutorial(); }}>
                Tutorial{tutorialCompleted ? <span className="menu-meta">Completed ✓</span> : null}
              </button>
              {canOpenBuilder ? <button type="button" role="menuitem" onClick={() => { close(); openBuilder(); }}>Organization</button> : null}
              {canOpenSettings ? <button type="button" role="menuitem" onClick={() => { close(); openSettings(); }}>Settings</button> : null}
              {isPlatformAdmin ? <button type="button" role="menuitem" onClick={() => { close(); setLicenseAdminOpen(true); }}>Licenses</button> : null}
              <hr />
              <button type="button" role="menuitem" onClick={() => { close(); void signOut(); }}>Sign out</button>
            </>
          )}
        </MenuButton>
      </div>
      {licenseAdminOpen ? <LicenseAdmin onClose={() => setLicenseAdminOpen(false)} /> : null}
    </header>
  );
}
