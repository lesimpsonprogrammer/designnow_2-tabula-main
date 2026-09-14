import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTabulaStore } from '../../store/useTabulaStore';
import { buildFiles } from '../../lib/codegen';

const MonacoCodeEditor = lazy(() => import('./MonacoCodeEditor'));

const languageIds: Record<string, string> = {
  js: 'javascript',
  py: 'python',
  sh: 'shell',
};

export function CodeDrawer({ layout, onLayoutChange }: {
  layout: 'bottom' | 'side';
  onLayoutChange: (layout: 'bottom' | 'side') => void;
}) {
  const popup = useRef<Window | null>(null);
  const [popupRoot, setPopupRoot] = useState<HTMLElement | null>(null);
  const [popupError, setPopupError] = useState('');
  useEffect(() => () => { popup.current?.close(); }, []);
  const openWindow = () => {
    if (popup.current && !popup.current.closed) { popup.current.focus(); return; }
    const win = window.open('', '', 'width=1000,height=760');
    if (!win) { setPopupError('Allow pop-ups for Tabula to open the code window.'); return; }
    setPopupError('');
    popup.current = win;
    win.document.title = 'Tabula — Code';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((style) => win.document.head.appendChild(style.cloneNode(true)));
    const styleObserver = new MutationObserver((changes) => {
      changes.forEach((change) => change.addedNodes.forEach((node) => {
        if (node instanceof HTMLStyleElement || node instanceof HTMLLinkElement) {
          win.document.head.appendChild(node.cloneNode(true));
        }
      }));
    });
    styleObserver.observe(document.head, { childList: true });
    const root = win.document.createElement('div');
    root.className = 'code-window';
    win.document.body.appendChild(root);
    win.addEventListener('pagehide', () => { styleObserver.disconnect(); popup.current = null; setPopupRoot(null); });
    setPopupRoot(root);
  };
  const drawerOpen = useTabulaStore((s) => s.drawerOpen);
  const toggleDrawer = useTabulaStore((s) => s.toggleDrawer);
  const activeFile = useTabulaStore((s) => s.activeFile);
  const setActiveFile = (name: string) => useTabulaStore.setState({ activeFile: name });

  const pages = useTabulaStore((s) => s.pages);
  const activePageId = useTabulaStore((s) => s.activePageId);
  const objects = useTabulaStore((s) => s.objects);
  const sections = useTabulaStore((s) => s.sections);
  const theme = useTabulaStore((s) => s.theme);

  const storedFiles = useTabulaStore((s) => s.files);

  const generatedFiles = useMemo(() => {
    const page = pages.find((p) => p.id === activePageId);
    if (!page) return [];
    return buildFiles({ ...page, objects, sections }, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, activePageId, objects, sections, theme]);

  const files = storedFiles.length > 0 ? storedFiles : generatedFiles;
  const file = files.find((f) => f.name === activeFile) ?? files[0];
  const language = file ? (languageIds[file.language] ?? file.language) : 'plaintext';

  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft(file?.content ?? '');
  }, [file?.name, file?.content]);

  const applyChanges = () => {
    if (!file) return;

    const nextFiles = files.map((item) =>
      item.name === file.name
        ? { ...item, content: draft }
        : item
    );

    useTabulaStore.setState({
      files: nextFiles,
      saveStatus: 'pending',
    });
  };

  const content = (
    <div className="drawer-body">
      <div className="drawer-tabs" role="tablist" aria-label="Generated files">
        {files.map((f) => <button type="button" role="tab" aria-selected={f.name === file?.name} key={f.name}
          className={`drawer-tab${f.name === file?.name ? ' active' : ''}`} onClick={() => setActiveFile(f.name)}>{f.name}</button>)}
      </div>
      <div className="drawer-editor-actions">
        <button type="button" onClick={applyChanges}>Apply changes</button>
      </div>
      <div className="drawer-editor" aria-label={`Edit ${file?.name ?? 'generated file'}`}>
        {file && (
          <Suspense fallback={<div className="drawer-loading">Loading editor…</div>}>
            <MonacoCodeEditor
              path={file.name}
              language={language}
              value={draft}
              onChange={setDraft}
            />
          </Suspense>
        )}
      </div>
      <div className="drawer-status">
        <span>{file?.language.toUpperCase()}</span>
        <span>{draft !== (file?.content ?? '') ? 'Edited' : 'Saved in project'}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
  return (
    <div className={`code-drawer${drawerOpen ? ' open' : ''}`}>
      <div className="drawer-bar">
        <button type="button" onClick={toggleDrawer} aria-expanded={drawerOpen}>Code {drawerOpen ? '▾' : '▸'}</button>
        <div className="drawer-actions">
          <button type="button" onClick={() => { onLayoutChange(layout === 'side' ? 'bottom' : 'side'); useTabulaStore.setState({ drawerOpen: true }); }}>
            {layout === 'side' ? 'Bottom view' : 'Multi view'}
          </button>
          <button type="button" onClick={applyChanges}>Apply changes</button>
        <button type="button" onClick={openWindow}>Open in new window ↗</button>
        </div>
      </div>
      {popupError && <p role="alert">{popupError}</p>}
      {drawerOpen && !popupRoot && content}
      {popupRoot && <p className="drawer-window-note">Code is open in a separate window. <button onClick={() => { popup.current?.close(); popup.current = null; setPopupRoot(null); }}>Bring back</button></p>}
      {popupRoot && createPortal(content, popupRoot)}
    </div>
  );
}
