import { useEffect } from 'react';
import { useTabulaStore } from '../store/useTabulaStore';

// Ported from reference/Tabula v2.dc.html onKey.
export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && /input|textarea|select/i.test(t.tagName);
      const mod = e.metaKey || e.ctrlKey;
      const s = useTabulaStore.getState();

      if (e.key === 'Escape') {
        if (s.editingId) return s.setEditingId(null);
        if (s.preview) return useTabulaStore.setState({ preview: false });
        if (!typing) return s.selectObject(null);
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return e.shiftKey ? s.redo() : s.undo();
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        return s.duplicateSelected();
      }
      if (mod && e.key.toLowerCase() === 'c' && s.selectedId) {
        return s.copySelected();
      }
      if (mod && e.key.toLowerCase() === 'v' && s.clipboard) {
        e.preventDefault();
        return s.pasteClipboard();
      }
      if (e.key.startsWith('Arrow') && s.selectedId) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        if (e.key === 'ArrowUp') s.nudge(0, -step);
        if (e.key === 'ArrowDown') s.nudge(0, step);
        if (e.key === 'ArrowLeft') s.nudge(-step, 0);
        if (e.key === 'ArrowRight') s.nudge(step, 0);
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && s.selectedId) {
        e.preventDefault();
        s.snapshot();
        s.removeObject(s.selectedId);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
