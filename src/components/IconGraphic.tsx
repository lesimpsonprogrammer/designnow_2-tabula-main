import type { Obj } from '../types';

const ICON_PATHS: Record<Obj['iconName'], React.ReactNode> = {
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  workflow: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h5a4 4 0 0 1 4 4v5M15 18H10a4 4 0 0 1-4-4V9" /></>,
  users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M14 15c3.8-.8 6.3 1 7 5" /></>,
  calculator: <><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M7 6h10v4H7zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7.5v.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7" /></>,
  facebook: <><circle cx="12" cy="12" r="9" /><path d="M14.5 7.5h-1.4c-1.2 0-2.1.9-2.1 2.2V19M8.5 12h6" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  youtube: <><path d="M21 12c0 2.8-.3 4.5-.8 5.2-.6.8-2.1 1-8.2 1s-7.6-.2-8.2-1C3.3 16.5 3 14.8 3 12s.3-4.5.8-5.2c.6-.8 2.1-1 8.2-1s7.6.2 8.2 1c.5.7.8 2.4.8 5.2Z" /><path d="m10 9 5 3-5 3Z" /></>,
  x: <path d="M5 4 19 20M19 4 5 20" />,
};

export function IconGraphic({ name }: { name: Obj['iconName'] }) {
  return <svg className="tabula-icon" viewBox="0 0 24 24" role="img" aria-label={`${name} icon`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><g className="icon-motion">{ICON_PATHS[name]}</g></svg>;
}
