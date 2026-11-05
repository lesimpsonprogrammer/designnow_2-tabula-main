import { useRef, useState } from 'react';
import { clearStartDraft, DURATIONS, loadStartDraft, saveStartDraft } from '../../lib/startDraft';
import type { StartDraft } from '../../lib/startDraft';
import './StartScreen.css';
import { openProjectFile, useTabulaStore } from '../../store/useTabulaStore';
import { useTeams } from '../Teams/TeamsProvider';
import { useTutorial } from '../Tutorial/Tutorial';

export function StartScreen() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [step, setStep] = useState<'choose' | 'configure'>('choose');
  const [name, setName] = useState('Untitled Project');
  const [duration, setDuration] = useState<24 | 48 | 168>(24);
  const [draft, setDraft] = useState<StartDraft | null>(() => loadStartDraft());
  const [draftMessage, setDraftMessage] = useState('');
  const { licenseType, isTeamsEdition, canOpenBuilder, canOpenSettings, openBuilder, openSettings } = useTeams();
  const { completed: tutorialCompleted, openTutorial } = useTutorial();
  const startNewProject = useTabulaStore((state) => state.startNewProject);
  const openMomentumTemplate = useTabulaStore((state) => state.openMomentumTemplate);
  const continueRecentProject = useTabulaStore((state) => state.continueRecentProject);
  const hasRecentProject = useTabulaStore((state) => state.hasRecentProject);
  const projectName = useTabulaStore((state) => state.projectName);
  const projectNumber = useTabulaStore((state) => state.projectNumber);

  const beginBlankProject = () => {
    startNewProject();
    useTabulaStore.setState({ projectName: name.trim() || 'Untitled Project' });
    clearStartDraft();
    setDraft(null);
  };

  const restoreDraft = () => {
    const valid = loadStartDraft();
    if (!valid) {
      setDraft(null);
      setDraftMessage('Your saved response has expired or is no longer available.');
      return;
    }
    setName(valid.projectName);
    setStep('configure');
    setDraftMessage('Saved selections restored. Continue when you are ready.');
  };

  const persistDraft = () => {
    try {
      const saved = saveStartDraft(name, duration);
      setDraft(saved);
      setDraftMessage('Response saved in this browser until ' + new Date(saved.expiresAt).toLocaleString() + '.');
    } catch {
      setDraftMessage('Browser storage is unavailable. Your response was not saved.');
    }
  };

  const cancelDraft = () => {
    clearStartDraft();
    setDraft(null);
    setDraftMessage('Saved response canceled and deleted.');
  };

  const editionLabel = licenseType === 'teams' ? 'Teams Edition' : licenseType === 'individual' ? 'Individual Edition' : 'Tabula';

  const readProject = (file: globalThis.File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!openProjectFile(JSON.parse(String(reader.result)))) throw new Error('invalid');
        setError('');
      } catch {
        setError('That file is not a valid Tabula project.');
      }
    };
    reader.onerror = () => setError('Tabula could not read that project file.');
    reader.readAsText(file);
  };

  return (
    <main
      className={`start-screen${isDraggingFile ? ' is-file-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (event.dataTransfer.types.includes('Files')) setIsDraggingFile(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingFile(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggingFile(false);
        const file = event.dataTransfer.files?.[0];
        if (file) readProject(file);
      }}
    >
      <div className="start-background" aria-hidden="true">
        <span>Begin with a blank page.</span>
        <span>Open something already in motion.</span>
        <span>Shape the structure. Refine the details.</span>
      </div>

      <section className="start-card start-card-focused" aria-labelledby="start-title">
        <span className="start-brand">Tabula</span>
        {step === 'choose' ? (
          <>
            <h1 id="start-title">What would you like to build?</h1>
            <p>Select how you want to begin. Only relevant settings appear next.</p>
            <div className="start-flow-actions">
              <button type="button" onClick={openMomentumTemplate}>
                <strong>Open Momentum Data Solutions</strong>
                <span>Open the existing website pages directly in the editor</span>
              </button>
              <button type="button" onClick={() => { setStep('configure'); setDraftMessage(''); }}>
                <strong>Start From Scratch</strong>
                <span>Configure a new website project</span>
              </button>
              <button type="button" onClick={() => inputRef.current?.click()}>
                <strong>Open Project File</strong>
                <span>Import a saved .tabula or JSON project</span>
              </button>
            </div>
            {draft ? (
              <div className="start-flow-save">
                <strong>Saved response available</strong>
                <p className="start-flow-note">Saved until {new Date(draft.expiresAt).toLocaleString()} on this browser.</p>
                <div className="start-flow-mini">
                  <button type="button" className="start-flow-cta" onClick={restoreDraft}>Resume Saved Response</button>
                  <button type="button" onClick={cancelDraft}>Cancel Saved Response</button>
                </div>
              </div>
            ) : null}
            {hasRecentProject ? (
              <button type="button" className="start-recent" onClick={continueRecentProject}>
                <span>Continue Recent Project</span>
                <small>{projectName} · #{String(projectNumber).padStart(4, '0')}</small>
              </button>
            ) : null}
            <div className="start-flow-utilities">
              <span>{editionLabel}</span>
              <button type="button" onClick={openTutorial}>{tutorialCompleted ? 'Review tutorial' : 'Tutorial'}</button>
              {isTeamsEdition && canOpenBuilder ? <button type="button" onClick={openBuilder}>Organization Builder</button> : null}
              {isTeamsEdition && canOpenSettings ? <button type="button" onClick={openSettings}>Organization Settings</button> : null}
            </div>
          </>
        ) : (
          <>
            <h1 id="start-title">Set up your website</h1>
            <p>Step 2 of 2 · Configure only what your new project needs.</p>
            <div className="start-flow-fields">
              <label>Project name
                <input type="text" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="Untitled Project" />
              </label>
              <label>Design category
                <select value="website" disabled aria-label="Design category">
                  <option value="website">Website — available now</option>
                </select>
              </label>
              <p className="start-flow-note">Other design categories are coming soon. Opening an existing project or importing a file skips this step.</p>
            </div>
            <div className="start-flow-footer">
              <button type="button" onClick={() => { setStep('choose'); setDraftMessage(''); }}>Back</button>
              <button type="button" className="start-flow-cta" onClick={beginBlankProject}>Create Project</button>
            </div>
            <div className="start-flow-save">
              <label>Save My Response for
                <select value={duration} onChange={(event) => setDuration(Number(event.target.value) as 24 | 48 | 168)}>
                  {DURATIONS.map((option) => <option key={option.hours} value={option.hours}>{option.label}</option>)}
                </select>
              </label>
              <div className="start-flow-mini">
                <button type="button" onClick={persistDraft}>Save My Response</button>
                <button type="button" onClick={cancelDraft}>Cancel Saved Response</button>
              </div>
              <p className="start-flow-note">Temporary selections are stored only in this browser and removed when expired or canceled. Existing projects are unaffected.</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          className="project-file-input"
          type="file"
          accept=".tabula,.json,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readProject(file);
            event.target.value = '';
          }}
        />
        {draftMessage ? <p className="start-flow-status" role="status">{draftMessage}</p> : null}
        {error ? <p className="start-error" role="alert">{error}</p> : null}
      </section>

      {isDraggingFile ? (
        <div className="start-drop-overlay" aria-hidden="true">
          <div>
            <strong>Drop your project here</strong>
            <span>Tabula will open and validate the file</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}
