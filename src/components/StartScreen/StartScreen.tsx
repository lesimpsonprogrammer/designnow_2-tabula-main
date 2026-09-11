import { useRef, useState } from 'react';
import { openProjectFile, useTabulaStore } from '../../store/useTabulaStore';

export function StartScreen() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const startNewProject = useTabulaStore((state) => state.startNewProject);
  const continueRecentProject = useTabulaStore((state) => state.continueRecentProject);
  const hasRecentProject = useTabulaStore((state) => state.hasRecentProject);
  const projectName = useTabulaStore((state) => state.projectName);
  const projectNumber = useTabulaStore((state) => state.projectNumber);

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

      <section className="start-card" aria-labelledby="start-title">
        <span className="start-brand">Tabula</span>
        <h1 id="start-title">What would you like to build?</h1>
        <p>Open or drag in a Tabula project file, or begin with a clear canvas.</p>

        <div className="start-actions">
          <button type="button" className="start-primary" onClick={startNewProject}>
            <strong>Start from scratch</strong>
            <span>Creates a new project ID and number</span>
          </button>
          <button type="button" onClick={() => inputRef.current?.click()}>
            <strong>Open project file</strong>
            <span>Choose a saved .tabula file</span>
          </button>
        </div>

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

        {hasRecentProject ? (
          <button type="button" className="start-recent" onClick={continueRecentProject}>
            <span>Continue recent project</span>
            <small>{projectName} · #{String(projectNumber).padStart(4, '0')}</small>
          </button>
        ) : null}
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
