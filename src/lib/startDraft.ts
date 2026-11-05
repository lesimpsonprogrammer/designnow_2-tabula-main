export type StartDraft = {
  version: 1;
  action: 'new';
  projectName: string;
  category: 'website';
  savedAt: number;
  expiresAt: number;
};

const KEY = 'tabula.start.response.v1';
export const DURATIONS = [
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
  { hours: 168, label: '7 days' },
] as const;

export function clearStartDraft(): void {
  try { window.localStorage.removeItem(KEY); } catch { /* storage can be disabled */ }
}

export function loadStartDraft(): StartDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') { clearStartDraft(); return null; }
    const draft = data as Partial<StartDraft>;
    if (draft.version !== 1 || draft.action !== 'new' || draft.category !== 'website'
      || typeof draft.projectName !== 'string' || typeof draft.expiresAt !== 'number'
      || !Number.isFinite(draft.expiresAt) || draft.expiresAt <= Date.now()) {
      clearStartDraft();
      return null;
    }
    return draft as StartDraft;
  } catch { clearStartDraft(); return null; }
}

export function saveStartDraft(name: string, hours: 24 | 48 | 168): StartDraft {
  const now = Date.now();
  const draft: StartDraft = {
    version: 1, action: 'new', projectName: name.trim() || 'Untitled Project',
    category: 'website', savedAt: now, expiresAt: now + hours * 60 * 60 * 1000,
  };
  window.localStorage.setItem(KEY, JSON.stringify(draft));
  return draft;
}
