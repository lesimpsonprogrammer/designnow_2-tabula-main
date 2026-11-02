import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { createCloudProject, listCloudProjects, loadCloudProject, saveCloudProject } from '../../lib/cloudProjects';
import { openProjectFile, snapshotProjectDocument, useTabulaStore } from '../../store/useTabulaStore';

type Item = { id: string; name: string; revision: number };
type Linked = { localId: string; cloudId: string; revision: number };
const enabled = import.meta.env.VITE_TABULA_CLOUD_SAVE === 'true';

export function CloudProjectBar() {
  const { client, org } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [linked, setLinked] = useState<Linked | null>(null);
  const linkRef = useRef<Linked | null>(null);
  const [status, setStatus] = useState('Local backup active');
  const [busy, setBusy] = useState(false);
  const sequence = useRef(Promise.resolve());
  const projectId = useTabulaStore((s) => s.projectId);
  const projectOpen = useTabulaStore((s) => s.projectOpen);

  const setLink = (value: Linked | null) => { linkRef.current = value; setLinked(value); };
  const refresh = async () => {
    const result = await listCloudProjects(client, org.id);
    setItems(result.projects);
  };
  useEffect(() => { setLink(null); if (enabled) void refresh().catch(() => setStatus('Cloud storage unavailable; local backup remains')); }, [client, org.id]);
  useEffect(() => { if (linkRef.current?.localId !== projectId) setLink(null); }, [projectId]);

  async function save() {
    if (busy || !projectOpen) return;
    setBusy(true);
    setStatus('Saving to cloud…');
    const document = snapshotProjectDocument();
    const rawProject = document.project as { id?: string; name?: string };
    const name = rawProject.name || 'Untitled Project';
    const localId = rawProject.id || projectId;
    try {
      const current = linkRef.current?.localId === localId ? linkRef.current : null;
      const response = current
        ? await saveCloudProject(client, org.id, current.cloudId, name, document, current.revision)
        : await createCloudProject(client, org.id, name, document);
      setLink({ localId, cloudId: response.project.id, revision: response.project.revision });
      setStatus('Saved to cloud');
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cloud save failed; local backup remains');
    } finally {
      setBusy(false);
    }
  }

  async function open(id: string) {
    if (!id || busy) return;
    // Explicit user action only: never silently replace a local project.
    if (projectOpen && !window.confirm('Open this cloud project? Your current local backup stays on this device.')) return;
    setBusy(true);
    try {
      const { project } = await loadCloudProject(client, org.id, id);
      if (!openProjectFile(project.document)) throw new Error('Cloud project format is invalid');
      const localId = useTabulaStore.getState().projectId;
      setLink({ localId, cloudId: project.id, revision: project.revision });
      setStatus('Cloud project loaded');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load cloud project');
    } finally {
      setBusy(false);
    }
  }

  // After an explicit first cloud save/load, persist subsequent document edits.
  // Never auto-create or replace a remote project without the owner's action.
  useEffect(() => {
    if (!enabled || !linked) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let prior = JSON.stringify(snapshotProjectDocument().data);
    const unsubscribe = useTabulaStore.subscribe((state) => {
      if (!state.projectOpen || state.projectId !== linked.localId) return;
      const next = JSON.stringify(snapshotProjectDocument().data);
      if (next === prior) return;
      prior = next;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        sequence.current = sequence.current.then(async () => {
          const active = linkRef.current;
          if (!active || active.localId !== useTabulaStore.getState().projectId) return;
          const doc = snapshotProjectDocument();
          try {
            const result = await saveCloudProject(client, org.id, active.cloudId,
              (doc.project as { name?: string }).name || 'Untitled Project', doc, active.revision);
            setLink({ ...active, revision: result.project.revision });
            setStatus('Saved to cloud');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Cloud sync failed; local backup remains');
            // A conflict requires a deliberate reload; do not overwrite remote changes.
            setLink(null);
          }
        });
      }, 1500);
    });
    return () => { unsubscribe(); if (timer) clearTimeout(timer); };
  }, [linked?.cloudId, client, org.id]);

  if (!enabled) return null;
  return <aside aria-label="Cloud project storage" style={{ padding: '8px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
    <strong>Cloud Projects</strong>
    <button type="button" onClick={() => void save()} disabled={busy || !projectOpen}>{linked ? 'Save Now' : 'Save Project to Cloud'}</button>
    <select aria-label="Open a cloud project" defaultValue="" onChange={(event) => { const id = event.target.value; event.target.value = ''; void open(id); }} disabled={busy}>
      <option value="">Open Cloud Project…</option>
      {items.map((item) => <option key={item.id} value={item.id}>{item.name} (v{item.revision})</option>)}
    </select>
    <span role="status">{status}</span>
  </aside>;
}
