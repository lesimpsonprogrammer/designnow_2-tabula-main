import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../components/Auth/AuthGate';
import { FONT_OPTIONS, TYPOGRAPHY_PRESETS, TYPE_SCALE } from '../../lib/fonts';
import { readTypographyCloud, saveTypographyCloud, type TypographyDesign } from './cloudTypography';
import './TypographyStudio.css';

const brands = TYPOGRAPHY_PRESETS.filter(p => !p.name.includes('preview only'));
const defaultDesign: TypographyDesign = { brand: brands[0].name, head: brands[0].head, body: brands[0].body, sample: 'Where data becomes your business strength.', size: 40 };

function validate(raw: unknown): TypographyDesign | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<TypographyDesign>;
  if (typeof d.brand !== 'string' || typeof d.head !== 'string' || typeof d.body !== 'string' || typeof d.sample !== 'string' || typeof d.size !== 'number' || !Number.isFinite(d.size)) return null;
  if (!FONT_OPTIONS.some(f => f.value === d.head) || !FONT_OPTIONS.some(f => f.value === d.body)) return null;
  return { brand: d.brand.slice(0, 120), head: d.head, body: d.body, sample: d.sample.slice(0, 500), size: Math.min(96, Math.max(16, d.size)) };
}
function safeLoad(key: string): TypographyDesign | null {
  try { return validate(JSON.parse(window.localStorage.getItem(key) || 'null')); } catch { return null; }
}
export default function TypographyStudio() {
  const {client,org,user,signOut} = useAuth();
  const storageKey = `tabula:typography:v1:${org.id}:${user.id}`;
  const initialLocal = useRef(safeLoad(storageKey));
  const [design,setDesign] = useState<TypographyDesign>(()=>initialLocal.current || defaultDesign);
  const [status,setStatus] = useState('Loading your cloud typography settings…');
  const [busy,setBusy] = useState(false);
  const [cloudRevision,setCloudRevision] = useState(0);
  const [remoteDesign,setRemoteDesign] = useState<TypographyDesign | null>(null);
  const [cloudAvailable,setCloudAvailable] = useState(false);
  const [dirty,setDirty] = useState(false);
  const summary = useMemo(()=>Object.entries(TYPE_SCALE),[]);

  useEffect(()=>{
    let mounted=true;
    void readTypographyCloud(client,org.id,user.id).then(record=>{
      if(!mounted)return;
      setCloudAvailable(true);
      if(!record){setStatus(initialLocal.current ? 'Local settings available. Save to Cloud to sync across devices.' : 'No cloud design yet. Customize and choose Save to Cloud.');return;}
      const valid=validate(record.design);
      if(!valid){setStatus('Cloud design format is invalid. Your local settings were preserved.');return;}
      setCloudRevision(record.revision);
      setRemoteDesign(valid);
      if(!initialLocal.current){
        setDesign(valid);
        try{window.localStorage.setItem(storageKey,JSON.stringify(valid));}catch{/* Optional backup */}
        setStatus('Your typography settings were loaded from the cloud.');
      }else{
        setStatus('A cloud design is available. Compare or load it before saving your local changes.');
      }
    }).catch(error=>{if(mounted)setStatus(`Cloud unavailable: ${error instanceof Error ? error.message : 'connection failed'}. Local backup remains available.`);});
    return ()=>{mounted=false;};
  },[client,org.id,user.id,storageKey]);

  const patch=(p: Partial<TypographyDesign>)=>{
    setDesign(current=>{
      const next={...current,...p};
      try{window.localStorage.setItem(storageKey,JSON.stringify(next));}catch{/* Save to cloud remains possible */}
      return next;
    });
    setDirty(true);setStatus('Unsaved cloud changes. Local backup updated.');
  };
  const saveLocal=()=>{
    try{window.localStorage.setItem(storageKey,JSON.stringify(design));setStatus('Saved on this device. Use Save to Cloud for cross-device access.');}
    catch{setStatus('Browser storage unavailable. Try Save to Cloud.');}
  };
  const saveCloud=async()=>{
    if(!cloudAvailable||busy)return;
    setBusy(true);setStatus('Saving to cloud…');
    try{
      const next=await saveTypographyCloud(client,org.id,design,cloudRevision);
      setCloudRevision(next);setRemoteDesign(design);setDirty(false);
      try{window.localStorage.setItem(storageKey,JSON.stringify(design));}catch{/* Cloud is authoritative */}
      setStatus(`Saved to cloud (revision ${next}). Available on your other devices after signing in.`);
    }catch(error){
      setStatus(`Cloud save failed: ${error instanceof Error ? error.message : 'unknown error'}. Local changes were not overwritten. Reload cloud settings if another device updated them.`);
    }finally{setBusy(false);}
  };
  const loadCloud=()=>{
    if(!remoteDesign)return;
    if(dirty&&!window.confirm('Replace unsaved changes with the cloud version? Your current browser backup will also be replaced.'))return;
    setDesign(remoteDesign);setDirty(false);
    try{window.localStorage.setItem(storageKey,JSON.stringify(remoteDesign));}catch{/* Nonfatal */}
    setStatus(`Loaded cloud revision ${cloudRevision}.`);
  };
  const refreshCloud=async()=>{
    if(busy)return;
    setBusy(true);
    try{
      const latest=await readTypographyCloud(client,org.id,user.id);
      const valid=validate(latest?.design);
      if(!latest||!valid){setStatus('No valid cloud design found.');return;}
      setCloudRevision(latest.revision);setRemoteDesign(valid);
      setStatus(`Cloud revision ${latest.revision} ready. Select Load Cloud Version to apply it.`);
      setCloudAvailable(true);
    }catch(error){setStatus(`Refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`);}
    finally{setBusy(false);}
  };
  const exportDesign=()=>{
    const json=JSON.stringify({version:1,organization:org.name,typography:design,scale:TYPE_SCALE},null,2);
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='tabula-typography.json';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  return <main className="type-studio">
    <header className="type-topbar">
      <div><strong>Tabula</strong><span>Typography Studio</span></div>
      <nav aria-label="Studio navigation"><a href="/">Full Tabula Editor</a><span>{org.name}</span><button disabled={busy} onClick={()=>{setBusy(true);void signOut().catch(()=>setStatus('Sign out failed.')).finally(()=>setBusy(false));}}>Sign out</button></nav>
    </header>
    <div className="type-wrap">
      <div className="type-intro"><p className="type-eyebrow">Independent workspace · v1.1</p><h1>Design your typography.</h1><p>Choose a brand, refine your fonts, and sync styles to your secure organization workspace. No website project required.</p></div>
      <div className="type-layout">
        <section className="type-controls" aria-labelledby="controls-title">
          <h2 id="controls-title">Type settings</h2>
          <label>Brand starting point<select value={design.brand} onChange={e=>{const p=brands.find(p=>p.name===e.target.value);if(p)patch({brand:p.name,head:p.head,body:p.body});}}>{brands.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}</select></label>
          <label>Heading font<select value={design.head} onChange={e=>patch({head:e.target.value})}>{FONT_OPTIONS.map(f=><option key={f.label} value={f.value}>{f.label}</option>)}</select></label>
          <label>Body font<select value={design.body} onChange={e=>patch({body:e.target.value})}>{FONT_OPTIONS.map(f=><option key={f.label} value={f.value}>{f.label}</option>)}</select></label>
          <label>Heading size: {design.size}px<input type="range" min={16} max={96} value={design.size} onChange={e=>patch({size:Number(e.target.value)})}/></label>
          <label>Preview text<textarea rows={3} maxLength={500} value={design.sample} onChange={e=>patch({sample:e.target.value})}/></label>
          <div className="type-actions"><button className="type-primary" onClick={()=>void saveCloud()} disabled={busy||!cloudAvailable}>{busy?'Working…':'Save to Cloud'}</button><button onClick={saveLocal}>Save Locally</button></div>
          <div className="type-actions" style={{marginTop:10}}><button onClick={()=>void refreshCloud()} disabled={busy}>Check Cloud</button><button onClick={loadCloud} disabled={!remoteDesign||busy}>Load Cloud Version</button><button onClick={exportDesign}>Export JSON</button></div>
          <p role="status" className="type-status">{status}</p>
          <p className="type-note">Cloud revisions prevent accidental overwrites from another device. Your browser backup remains available if cloud access fails. The database migration must be applied before cloud saving works.</p>
        </section>
        <section className="type-preview" aria-labelledby="preview-title">
          <div className="type-preview-header"><h2 id="preview-title">Live preview</h2><span>{design.brand}</span></div>
          <div className="type-preview-paper">
            <p className="type-eyebrow" style={{fontFamily:design.body}}>MOMENTUM DATA SOLUTIONS</p>
            <h3 style={{fontFamily:design.head,fontSize:design.size,lineHeight:1.15}}>{design.sample||'Your headline goes here'}</h3>
            <p style={{fontFamily:design.body,fontSize:16,lineHeight:1.6}}>Beautiful, accessible typography helps every brand communicate clearly. Review headings and body text before publishing.</p>
            <button className="type-sample-button" style={{fontFamily:design.body}}>Explore the experience</button>
          </div>
          <h2>Typography scale</h2>
          <div className="type-scale">{summary.map(([name,value])=><div key={name}><span>{name}</span><strong style={{fontSize:Math.min(value,40),fontFamily:design.head}}>{value}px · Aa</strong></div>)}</div>
        </section>
      </div>
    </div>
  </main>;
}
