import { useState } from 'react';
import { estimateCompletion } from '../../lib/completion';
import { useTabulaStore } from '../../store/useTabulaStore';

export function CompletionIndicator({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const projectName = useTabulaStore((state) => state.projectName);
  const pages = useTabulaStore((state) => state.pages);
  const activePageId = useTabulaStore((state) => state.activePageId);
  const objects = useTabulaStore((state) => state.objects);
  const sections = useTabulaStore((state) => state.sections);
  const theme = useTabulaStore((state) => state.theme);
  const estimate = estimateCompletion({ projectName, pages, activePageId, objects, sections, theme });

  return (
    <div className={`completion-indicator${compact ? ' compact' : ''}`}>
      <button
        type="button"
        className="completion-trigger"
        aria-label={`Estimated website completion: ${estimate.complete}% complete, ${estimate.incomplete}% incomplete`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="completion-copy"><strong>{estimate.complete}%</strong><small>complete</small></span>
        <span className="completion-track" aria-hidden="true"><span style={{ width: `${estimate.complete}%` }} /></span>
        {!compact ? <span className="completion-incomplete">{estimate.incomplete}% incomplete</span> : null}
      </button>

      {open ? (
        <div className="completion-popover" role="dialog" aria-label="Website completion breakdown">
          <div className="completion-popover-heading"><span>Estimated completion</span><strong>{estimate.complete}%</strong></div>
          <p>Updates automatically as the website’s structure, content, links, design, and publishing status change.</p>
          <div className="completion-categories">
            {estimate.categories.map((category) => (
              <div className="completion-category" key={category.label}>
                <span>{category.label}</span><output>{category.percent}%</output>
                <div><i style={{ width: `${category.percent}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="completion-summary"><span>{estimate.complete}% complete</span><span>{estimate.incomplete}% incomplete</span></div>
        </div>
      ) : null}
    </div>
  );
}
