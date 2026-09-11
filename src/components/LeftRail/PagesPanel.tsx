import { useTabulaStore } from '../../store/useTabulaStore';
import type { Page } from '../../types';

type Row =
  | { kind: 'page'; page: Page; depth: number }
  | { kind: 'folder'; id: string; name: string; open: boolean; count: number };

function buildRows(pages: Page[], folders: { id: string; name: string; open: boolean }[]): Row[] {
  const rows: Row[] = [];
  const roots = pages.filter((p) => !p.folderId);

  roots.slice(0, 2).forEach((p) => rows.push({ kind: 'page', page: p, depth: 0 }));

  folders.forEach((f) => {
    const children = pages.filter((p) => p.folderId === f.id);
    rows.push({ kind: 'folder', id: f.id, name: f.name, open: f.open, count: children.length });
    if (f.open) children.forEach((p) => rows.push({ kind: 'page', page: p, depth: 1 }));
  });

  roots.slice(2).forEach((p) => rows.push({ kind: 'page', page: p, depth: 0 }));

  return rows;
}

function PageRow({ page, depth }: { page: Page; depth: number }) {
  const activePageId = useTabulaStore((s) => s.activePageId);
  const renamingId = useTabulaStore((s) => s.renamingId);
  const pagesCount = useTabulaStore((s) => s.pages.length);
  const setActivePage = useTabulaStore((s) => s.setActivePage);
  const startRenamePage = useTabulaStore((s) => s.startRenamePage);
  const commitRename = useTabulaStore((s) => s.commitRename);
  const cancelRename = useTabulaStore((s) => s.cancelRename);
  const toggleStatus = useTabulaStore((s) => s.toggleStatus);
  const setHomePage = useTabulaStore((s) => s.setHomePage);
  const deletePage = useTabulaStore((s) => s.deletePage);

  const active = page.id === activePageId;
  const renaming = page.id === renamingId;
  const glyph = page.home ? '⌂' : page.status === 'draft' ? '◌' : '▢';

  if (renaming) {
    return (
      <input
        className="page-rename-input"
        style={{ marginLeft: 10 + depth * 16 }}
        defaultValue={page.name}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename(page.id, e.currentTarget.value);
          if (e.key === 'Escape') cancelRename();
        }}
        onBlur={(e) => commitRename(page.id, e.currentTarget.value)}
      />
    );
  }

  return (
    <div
      className={`page-row${active ? ' active' : ''}${page.status === 'draft' ? ' draft' : ''}`}
      style={{ paddingLeft: 10 + depth * 16 }}
      draggable={!renaming && !page.home}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/tabula-page-id', page.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => setActivePage(page.id)}
      onDoubleClick={() => startRenamePage(page.id)}
    >
      <span className="page-glyph">{glyph}</span>
      <span className="page-name">{page.name}</span>
      <button
        className="page-status"
        disabled={page.home}
        title={page.home ? 'Home is always live' : page.status === 'draft' ? 'Hidden — click to publish' : 'Live — click to hide'}
        onClick={(e) => {
          e.stopPropagation();
          toggleStatus(page.id);
        }}
      >
        {page.status === 'draft' ? 'hidden' : 'live'}
      </button>
      {!page.home && (
        <button
          className="page-home"
          title="Make home page"
          onClick={(e) => {
            e.stopPropagation();
            setHomePage(page.id);
          }}
        >
          ⌂
        </button>
      )}
      {pagesCount > 1 && (
        <button
          className="page-delete"
          title="Delete page"
          onClick={(e) => {
            e.stopPropagation();
            deletePage(page.id);
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function PagesPanel() {
  const pages = useTabulaStore((s) => s.pages);
  const folders = useTabulaStore((s) => s.folders);
  const toggleFolder = useTabulaStore((s) => s.toggleFolder);
  const deleteFolder = useTabulaStore((s) => s.deleteFolder);
  const addPage = useTabulaStore((s) => s.addPage);
  const addFolder = useTabulaStore((s) => s.addFolder);
  const applyHomeChromeToAllPages = useTabulaStore((s) => s.applyHomeChromeToAllPages);
  const addSolutionsNavigation = useTabulaStore((s) => s.addSolutionsNavigation);
  const setPageStatus = useTabulaStore((s) => s.setPageStatus);

  const liveRows = buildRows(
    [...pages.filter((page) => page.status === 'published')].sort((a, b) => Number(b.home) - Number(a.home)),
    folders,
  );
  const hiddenRows = buildRows(pages.filter((page) => page.status === 'draft'), folders);

  const dropPage = (event: React.DragEvent, status: Page['status']) => {
    event.preventDefault();
    const pageId = event.dataTransfer.getData('text/tabula-page-id');
    if (pageId) setPageStatus(pageId, status);
  };

  const renderRows = (rows: Row[]) => rows.map((row) =>
    row.kind === 'page' ? (
      <PageRow key={row.page.id} page={row.page} depth={row.depth} />
    ) : (
      <div key={row.id} className="folder-row" onClick={() => toggleFolder(row.id)}>
        <span className="folder-glyph">{row.open ? '▾' : '▸'}</span>
        <span className="folder-name">{row.name}</span>
        <span className="folder-count">{row.count} pages</span>
        <button className="folder-add" title="Add page to folder" onClick={(e) => { e.stopPropagation(); addPage(row.id); }}>+</button>
        <button className="folder-delete" title="Delete folder" onClick={(e) => { e.stopPropagation(); deleteFolder(row.id); }}>✕</button>
      </div>
    )
  );

  return (
    <div className="pages-panel">
      <div className="page-status-group live" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropPage(event, 'published')}>
        <div className="page-status-heading"><strong>Live &amp; posted</strong><span>{pages.filter((page) => page.status === 'published').length}</span></div>
        <div className="pages-list">{renderRows(liveRows)}</div>
        <p className="page-drop-hint">Drag pages here to publish</p>
      </div>
      <div className="page-status-group hidden" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropPage(event, 'draft')}>
        <div className="page-status-heading"><strong>Unposted &amp; hidden</strong><span>{pages.filter((page) => page.status === 'draft').length}</span></div>
        <div className="pages-list">{renderRows(hiddenRows)}</div>
        <p className="page-drop-hint">Drag pages here to hide</p>
      </div>
      <div className="pages-actions">
        <button onClick={() => addPage(null)}>+ Page</button>
        <button onClick={addFolder}>DIR</button>
      </div>
      <p className="pages-shared-note">Home header, navigation, and footer are shared automatically.</p>
      <button type="button" className="pages-shared-chrome" onClick={applyHomeChromeToAllPages}>Refresh shared Home elements now</button>
      <button type="button" className="pages-shared-chrome" onClick={addSolutionsNavigation}>Add or refresh Solutions menu</button>
    </div>
  );
}
