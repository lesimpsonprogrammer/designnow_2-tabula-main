import { useTabulaStore } from '../../store/useTabulaStore';

export function PageBar() {
  const pages = useTabulaStore((s) => s.pages);
  const activePageId = useTabulaStore((s) => s.activePageId);
  const sections = useTabulaStore((s) => s.sections);
  const addSection = useTabulaStore((s) => s.addSection);

  const page = pages.find((p) => p.id === activePageId);

  return (
    <div className="page-bar">
      <span className="page-bar-name">{page?.name ?? 'Untitled'}</span>
      <span className="page-bar-meta">{page?.slug ? `/${page.slug}` : '/'}</span>
      <span className="page-bar-meta">{sections.length} sections</span>
      <button className="add-section" onClick={addSection}>+ Section</button>
    </div>
  );
}
