import { useEffect, useState } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { useTeams } from './TeamsProvider';
import {
  APPOINTABLE_ROLES,
  BASE_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  type AccessRequest,
  type PermissionKey,
  type TeamMember,
  type TeamsRole,
} from './teamsTypes';

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];
const MATRIX_ROLES: TeamsRole[] = ['org_admin', 'site_admin', 'section_leader', 'site_designer', 'logo_designer'];

export function TeamsSettings() {
  const { client, org, user } = useAuth();
  const { role, members, settingsReadOnly, closeSettings, refresh, openBuilder } = useTeams();
  const [tab, setTab] = useState<'permissions' | 'users' | 'requests'>('permissions');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedRole, setAssignedRole] = useState<TeamsRole>('site_designer');
  const [sectionName, setSectionName] = useState('');
  const [assetApproved, setAssetApproved] = useState(false);
  const [reason, setReason] = useState('');

  const loadRequests = async () => {
    const { data } = await client
      .from('tabula_user_access_requests')
      .select('*')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });
    setRequests((data as AccessRequest[] | null) ?? []);
  };

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setAssignedRole('site_designer');
    setSectionName('');
    setAssetApproved(false);
    setReason('');
  };

  const saveUser = async () => {
    if (settingsReadOnly || !name.trim() || !email.trim()) return;
    if (assignedRole === 'section_leader' && !sectionName.trim()) {
      setMessage('A Section Leader must be assigned to one section.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await client
      .from('tabula_team_members')
      .upsert({
        org_id: org.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        section_name: assignedRole === 'section_leader' || assignedRole === 'site_designer' ? sectionName.trim() || null : null,
        asset_design_approved: assignedRole === 'logo_designer' ? true : assignedRole === 'site_designer' ? assetApproved : false,
        status: 'pending',
      }, { onConflict: 'org_id,email,role' });
    if (error) setMessage(error.message);
    else {
      setMessage('User account assignment saved.');
      resetForm();
      await refresh();
    }
    setBusy(false);
  };

  const submitAccessRequest = async () => {
    if (!settingsReadOnly || !name.trim() || !email.trim()) return;
    if (assignedRole === 'section_leader' && !sectionName.trim()) {
      setMessage('A Section Leader request must identify one assigned section.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await client.from('tabula_user_access_requests').insert({
      org_id: org.id,
      requested_by: user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      requested_role: assignedRole,
      section_name: assignedRole === 'section_leader' || assignedRole === 'site_designer' ? sectionName.trim() || null : null,
      asset_design_requested: assignedRole === 'logo_designer' ? true : assignedRole === 'site_designer' ? assetApproved : false,
      reason: reason.trim() || null,
      status: 'pending',
    });
    if (error) setMessage(error.message);
    else {
      setMessage('User Access Change request sent to the Org Admin.');
      resetForm();
      await loadRequests();
    }
    setBusy(false);
  };

  const updateMember = async (member: TeamMember, patch: Partial<TeamMember>) => {
    if (settingsReadOnly) return;
    setBusy(true);
    const { error } = await client
      .from('tabula_team_members')
      .update(patch)
      .eq('id', member.id)
      .eq('org_id', org.id);
    if (error) setMessage(error.message);
    else await refresh();
    setBusy(false);
  };

  const decideRequest = async (request: AccessRequest, decision: 'approved' | 'rejected') => {
    if (settingsReadOnly) return;
    setBusy(true);
    setMessage('');

    if (decision === 'approved') {
      const { error: memberError } = await client
        .from('tabula_team_members')
        .upsert({
          org_id: org.id,
          name: request.name,
          email: request.email,
          role: request.requested_role,
          section_name: request.section_name,
          asset_design_approved: request.requested_role === 'logo_designer' ? true : request.asset_design_requested,
          status: 'pending',
        }, { onConflict: 'org_id,email,role' });
      if (memberError) {
        setMessage(memberError.message);
        setBusy(false);
        return;
      }
    }

    const { error } = await client
      .from('tabula_user_access_requests')
      .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', request.id)
      .eq('org_id', org.id);

    if (error) setMessage(error.message);
    else {
      setMessage(`Request ${decision}.`);
      await Promise.all([loadRequests(), refresh()]);
    }
    setBusy(false);
  };

  return (
    <div className="teams-modal-backdrop" role="presentation">
      <section className="teams-modal teams-settings" role="dialog" aria-modal="true" aria-labelledby="teams-settings-title">
        <header className="teams-modal-header">
          <div>
            <span className="teams-kicker">Tabula Design Now · Teams Edition</span>
            <h2 id="teams-settings-title">Organization Settings</h2>
            <p>{settingsReadOnly ? 'Site Admin · View-only settings with approval requests' : 'Org Admin · Full settings access'}</p>
          </div>
          <button type="button" className="teams-close" onClick={closeSettings}>Close</button>
        </header>

        <div className="teams-settings-layout">
          <nav className="teams-settings-nav" aria-label="Organization settings">
            <button className={tab === 'permissions' ? 'active' : ''} onClick={() => setTab('permissions')}>Access Permissions</button>
            <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>User Account Setup</button>
            <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>User Access Changes{requests.filter((item) => item.status === 'pending').length ? ` (${requests.filter((item) => item.status === 'pending').length})` : ''}</button>
            {role === 'org_admin' ? <button onClick={openBuilder}>Open Organization Builder</button> : null}
          </nav>

          <div className="teams-settings-content">
            {tab === 'permissions' ? (
              <section>
                <div className="teams-step-heading">
                  <h3>Access Permissions</h3>
                  <p>The Teams Edition baseline is enforced here. Org Admin manages role appointments and individual Asset Design approval; protected permissions cannot be elevated by another role.</p>
                </div>
                <div className="teams-permission-table-wrap">
                  <table className="teams-permission-table">
                    <thead><tr><th>Capability</th>{MATRIX_ROLES.map((matrixRole) => <th key={matrixRole}>{ROLE_LABELS[matrixRole]}</th>)}</tr></thead>
                    <tbody>
                      {PERMISSION_KEYS.map((permission) => (
                        <tr key={permission}>
                          <th>{PERMISSION_LABELS[permission]}</th>
                          {MATRIX_ROLES.map((matrixRole) => {
                            const granted = BASE_PERMISSIONS[matrixRole][permission];
                            const specialApproval = matrixRole === 'site_designer' && permission === 'asset_design';
                            return <td key={`${matrixRole}-${permission}`} className={granted ? 'granted' : 'denied'}>{specialApproval ? 'By approval' : granted ? 'Yes' : 'No'}</td>;
                          })}
                        </tr>
                      ))}
                      <tr><th>Section scope</th><td>All</td><td>All</td><td>One assigned section</td><td>Any section</td><td>Asset Design Module</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="teams-note">The Asset Design Module is forthcoming. Logo Designer access is reserved now so the role can be appointed before the module launches.</p>
              </section>
            ) : null}

            {tab === 'users' ? (
              <section>
                <div className="teams-step-heading">
                  <h3>User Account Setup</h3>
                  <p>{settingsReadOnly ? 'You can review current assignments. Submit changes for Org Admin approval below.' : 'Create or revise organization role assignments.'}</p>
                </div>

                <div className="teams-user-form">
                  <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
                  <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                  <label>Role assignment
                    <select value={assignedRole} onChange={(event) => { setAssignedRole(event.target.value as TeamsRole); setAssetApproved(false); }}>
                      {APPOINTABLE_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                    </select>
                  </label>
                  {assignedRole === 'section_leader' || assignedRole === 'site_designer' ? <label>{assignedRole === 'section_leader' ? 'Assigned section' : 'Section (optional)'}<input value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder={assignedRole === 'site_designer' ? 'Any section' : ''} /></label> : null}
                  {assignedRole === 'site_designer' ? <label className="teams-inline-check"><input type="checkbox" checked={assetApproved} onChange={(event) => setAssetApproved(event.target.checked)} />Asset Design Module approval</label> : null}
                  {settingsReadOnly ? <label className="teams-form-wide">Reason for access change<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></label> : null}
                  <div className="teams-form-wide teams-user-actions">
                    <button type="button" className="teams-primary" disabled={busy || !name.trim() || !email.trim()} onClick={() => void (settingsReadOnly ? submitAccessRequest() : saveUser())}>{settingsReadOnly ? 'Submit User Access Change' : 'Save user'}</button>
                  </div>
                </div>

                <div className="teams-member-list">
                  <h4>Organization team</h4>
                  {members.length === 0 ? <p>No role assignments have been saved yet.</p> : members.map((member) => (
                    <div className="teams-member-row" key={member.id}>
                      <div><strong>{member.name}</strong><span>{member.email}</span></div>
                      <span>{ROLE_LABELS[member.role]}</span>
                      <span>{member.section_name || '—'}</span>
                      <span className={`teams-status ${member.status}`}>{member.status}</span>
                      {member.role === 'site_designer' ? (
                        <label className="teams-inline-check compact"><input type="checkbox" disabled={settingsReadOnly || busy} checked={member.asset_design_approved} onChange={(event) => void updateMember(member, { asset_design_approved: event.target.checked })} />Asset Design</label>
                      ) : <span>{member.role === 'logo_designer' ? 'Asset Design' : '—'}</span>}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {tab === 'requests' ? (
              <section>
                <div className="teams-step-heading">
                  <h3>User Access Changes</h3>
                  <p>{settingsReadOnly ? 'Requests you submit here route to the Org Admin for approval.' : 'Review Site Admin requests before they change organization access.'}</p>
                </div>
                <div className="teams-request-list">
                  {requests.length === 0 ? <p>No user access change requests.</p> : requests.map((request) => (
                    <article className="teams-request-card" key={request.id}>
                      <div><strong>{request.name}</strong><span>{request.email}</span></div>
                      <div><span>Requested role</span><strong>{ROLE_LABELS[request.requested_role]}</strong></div>
                      <div><span>Section</span><strong>{request.section_name || '—'}</strong></div>
                      <div><span>Status</span><strong>{request.status}</strong></div>
                      {request.reason ? <p>{request.reason}</p> : null}
                      {!settingsReadOnly && request.status === 'pending' ? <div className="teams-request-actions"><button disabled={busy} onClick={() => void decideRequest(request, 'rejected')}>Reject</button><button className="teams-primary" disabled={busy} onClick={() => void decideRequest(request, 'approved')}>Approve</button></div> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {message ? <p className="teams-message" role="status">{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
