import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../Auth/AuthGate';

type Organization = { id: string; name: string; slug: string; plan: 'trial' | 'active' | 'expired' };
type License = { id: string; org_id: string; license_type: 'individual' | 'teams'; status: 'active' | 'suspended' | 'expired'; seat_limit: number; expires_at: string | null };

export function LicenseAdmin({ onClose }: { onClose: () => void }) {
  const { client, user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [orgId, setOrgId] = useState('');
  const [licenseType, setLicenseType] = useState<'individual' | 'teams'>('individual');
  const [seats, setSeats] = useState(5);
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: orgData }, { data: licenseData }, { data: membershipData }] = await Promise.all([
      client.from('tabula_organizations').select('id, name, slug, plan').order('name'),
      client.from('tabula_licenses').select('id, org_id, license_type, status, seat_limit, expires_at'),
      client.from('tabula_memberships').select('org_id'),
    ]);
    const nextOrgs = (orgData ?? []) as Organization[];
    setOrganizations(nextOrgs);
    setLicenses((licenseData ?? []) as License[]);
    setMemberCounts((membershipData ?? []).reduce<Record<string, number>>((counts, membership) => {
      counts[membership.org_id] = (counts[membership.org_id] ?? 0) + 1;
      return counts;
    }, {}));
    setOrgId((current) => current || nextOrgs[0]?.id || '');
  };

  useEffect(() => {
    void load();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const issueLicense = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) return;
    setBusy(true);
    setMessage('');
    const { error } = await client.from('tabula_licenses').upsert({
      org_id: orgId,
      license_type: licenseType,
      status: 'active',
      seat_limit: licenseType === 'individual' ? 1 : Math.max(2, seats),
      expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      issued_by: user.id,
    }, { onConflict: 'org_id' });
    setMessage(error ? error.message : 'License issued successfully.');
    if (!error) await load();
    setBusy(false);
  };

  const updateStatus = async (license: License, status: License['status']) => {
    setMessage('');
    const { error } = await client.from('tabula_licenses').update({ status }).eq('id', license.id);
    setMessage(error ? error.message : `License ${status}.`);
    if (!error) await load();
  };

  return (
    <div className="license-admin-backdrop" onMouseDown={onClose}>
      <section className="license-admin" role="dialog" aria-modal="true" aria-labelledby="license-admin-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="license-admin-close" aria-label="Close license manager" onClick={onClose}>×</button>
        <span className="license-admin-kicker">Internal administration</span>
        <h1 id="license-admin-title">Tabula licenses</h1>
        <p>Issue an Individual or Teams license to a customer organization.</p>

        <form onSubmit={issueLicense}>
          <label>Organization<select value={orgId} onChange={(event) => setOrgId(event.target.value)}>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
          <label>License type<select value={licenseType} onChange={(event) => setLicenseType(event.target.value as 'individual' | 'teams')}><option value="individual">Individual</option><option value="teams">Teams</option></select></label>
          {licenseType === 'teams' ? <label>Seats<input type="number" min="2" required value={seats} onChange={(event) => setSeats(Number(event.target.value))} /></label> : null}
          <label>Expiration (optional)<input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
          <button type="submit" disabled={busy || !orgId}>{busy ? 'Issuing…' : 'Issue license'}</button>
        </form>
        {message ? <p className="license-admin-message" role="status">{message}</p> : null}

        <div className="license-list" aria-label="Organization licenses">
          {organizations.map((org) => {
            const license = licenses.find((item) => item.org_id === org.id);
            return <article key={org.id}>
              <div><strong>{org.name}</strong><small>{memberCounts[org.id] ?? 0} member{memberCounts[org.id] === 1 ? '' : 's'}</small></div>
              <div><span>{license ? `${license.license_type === 'teams' ? 'Teams' : 'Individual'} · ${license.seat_limit} seat${license.seat_limit === 1 ? '' : 's'}` : 'No license'}</span><small>{license?.status ?? org.plan}</small></div>
              {license ? <div className="license-row-actions">
                {license.status !== 'active' ? <button type="button" onClick={() => void updateStatus(license, 'active')}>Activate</button> : <button type="button" onClick={() => void updateStatus(license, 'suspended')}>Suspend</button>}
                {license.status !== 'expired' ? <button type="button" onClick={() => void updateStatus(license, 'expired')}>Expire</button> : null}
              </div> : null}
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
