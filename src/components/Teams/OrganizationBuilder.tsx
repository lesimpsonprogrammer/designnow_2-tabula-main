import { useMemo, useState } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { useTeams } from './TeamsProvider';
import { APPOINTABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type TeamsRole } from './teamsTypes';

type Appointment = {
  key: string;
  role: TeamsRole;
  name: string;
  email: string;
  sectionName: string;
  assetApproved: boolean;
};

const PRIMARY_USES = [
  'Company website',
  'Client portal',
  'Internal application',
  'Dashboard',
  'Data application',
  'E-commerce site',
  'AI-powered application',
  'Prototype / Sandbox',
  'Other',
];

const TECHNOLOGIES = [
  'HTML / CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Python',
  'SQL',
  'PostgreSQL',
  'Not sure yet',
];

const TEMPLATE_MAP: Record<string, { key: string; name: string; description: string }[]> = {
  'Company website': [
    { key: 'business-site', name: 'Business Site', description: 'Marketing pages, services, contact, and brand-ready sections.' },
    { key: 'content-site', name: 'Content + Insights', description: 'Business site with articles, resources, and thought-leadership areas.' },
  ],
  'Client portal': [
    { key: 'client-portal', name: 'Client Portal', description: 'Authenticated workspace with client navigation and account areas.' },
  ],
  'Internal application': [
    { key: 'internal-app', name: 'Internal Application', description: 'Operational workspace with forms, data views, and internal navigation.' },
  ],
  Dashboard: [
    { key: 'dashboard', name: 'Dashboard', description: 'KPI, reporting, monitoring, and data visualization foundation.' },
  ],
  'Data application': [
    { key: 'data-app', name: 'Data Application', description: 'Data-first application layout for workflows, tables, SQL, and reporting.' },
  ],
  'E-commerce site': [
    { key: 'commerce', name: 'Commerce', description: 'Catalog, product, conversion, and checkout-oriented page structure.' },
  ],
  'AI-powered application': [
    { key: 'ai-app', name: 'AI Application', description: 'Prompt, response, workflow, and tool-oriented product shell.' },
  ],
  'Prototype / Sandbox': [
    { key: 'sandbox', name: 'Prototype Sandbox', description: 'A flexible starting point for testing ideas quickly.' },
  ],
  Other: [
    { key: 'blank', name: 'Blank Workspace', description: 'A clean Tabula workspace with no assumptions about structure.' },
  ],
};

function newAppointment(role: TeamsRole): Appointment {
  return {
    key: `${role}-${crypto.randomUUID()}`,
    role,
    name: '',
    email: '',
    sectionName: '',
    assetApproved: role === 'logo_designer',
  };
}

export function OrganizationBuilder() {
  const { client, org } = useAuth();
  const { setup, members, closeBuilder, refresh } = useTeams();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [orgName, setOrgName] = useState(org.name);
  const [workspaceName, setWorkspaceName] = useState(setup?.workspace_name ?? `${org.name} Workspace`);
  const [website, setWebsite] = useState(setup?.website ?? '');
  const [industry, setIndustry] = useState(setup?.industry ?? '');
  const [companySize, setCompanySize] = useState(setup?.company_size ?? '');
  const [region, setRegion] = useState(setup?.operating_region ?? 'United States');
  const [primaryUse, setPrimaryUse] = useState(setup?.primary_use ?? 'Company website');
  const [projectStage, setProjectStage] = useState(setup?.project_stage ?? 'New Project');
  const [templateKey, setTemplateKey] = useState(setup?.template_key ?? '');
  const [environmentType, setEnvironmentType] = useState(setup?.environment_type ?? 'Development');
  const [environmentName, setEnvironmentName] = useState(setup?.environment_name ?? `${org.name} Development`);
  const [separateEnvironments, setSeparateEnvironments] = useState<string[]>(setup?.separate_environments ?? ['Development', 'Production']);
  const [technologies, setTechnologies] = useState<string[]>(setup?.technologies ?? []);

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    APPOINTABLE_ROLES.flatMap((role) => {
      const existing = members.filter((member) => member.role === role);
      if (existing.length) {
        return existing.map((member) => ({
          key: member.id,
          role,
          name: member.name,
          email: member.email,
          sectionName: member.section_name ?? '',
          assetApproved: member.asset_design_approved,
        }));
      }
      return [newAppointment(role)];
    }),
  );

  const templates = useMemo(() => TEMPLATE_MAP[primaryUse] ?? TEMPLATE_MAP.Other, [primaryUse]);

  const toggleListValue = (value: string, list: string[], setter: (value: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const validateStep = () => {
    setError('');
    if (step === 1 && (!orgName.trim() || !workspaceName.trim() || !industry.trim() || !companySize || !region.trim())) {
      setError('Complete the organization details before continuing.');
      return false;
    }
    if (step === 2 && !templateKey) {
      setError('Choose a recommended template before continuing.');
      return false;
    }
    if (step === 3 && (!environmentName.trim() || technologies.length === 0)) {
      setError('Name the environment and select at least one technology, or choose “Not sure yet.”');
      return false;
    }
    if (step === 4) {
      for (const role of APPOINTABLE_ROLES) {
        const roleRows = appointments.filter((item) => item.role === role);
        if (!roleRows.length || roleRows.some((item) => !item.name.trim() || !item.email.trim())) {
          setError(`Appoint at least one ${ROLE_LABELS[role]} with a name and email address.`);
          return false;
        }
        if (role === 'section_leader' && roleRows.some((item) => !item.sectionName.trim())) {
          setError('Each Section Leader must be assigned to one section.');
          return false;
        }
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(4, current + 1));
  };

  const updateAppointment = (key: string, patch: Partial<Appointment>) => {
    setAppointments((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  };

  const save = async () => {
    if (!validateStep()) return;
    setBusy(true);
    setError('');

    const completedAt = new Date().toISOString();
    const { error: setupError } = await client
      .from('tabula_org_setups')
      .upsert({
        org_id: org.id,
        workspace_name: workspaceName.trim(),
        website: website.trim(),
        industry: industry.trim(),
        company_size: companySize,
        operating_region: region.trim(),
        primary_use: primaryUse,
        project_stage: projectStage,
        template_key: templateKey,
        environment_type: environmentType,
        environment_name: environmentName.trim(),
        separate_environments: separateEnvironments,
        technologies,
        setup_completed_at: completedAt,
      }, { onConflict: 'org_id' });

    if (setupError) {
      setError(setupError.message);
      setBusy(false);
      return;
    }

    if (orgName.trim() !== org.name) {
      await client.from('tabula_organizations').update({ name: orgName.trim() }).eq('id', org.id);
    }

    const records = appointments.map((item) => ({
      org_id: org.id,
      name: item.name.trim(),
      email: item.email.trim().toLowerCase(),
      role: item.role,
      section_name: item.role === 'section_leader' || item.role === 'site_designer' ? item.sectionName.trim() || null : null,
      asset_design_approved: item.role === 'logo_designer' ? true : item.role === 'site_designer' ? item.assetApproved : false,
      status: 'pending',
    }));

    const { error: memberError } = await client
      .from('tabula_team_members')
      .upsert(records, { onConflict: 'org_id,email,role' });

    if (memberError) {
      setError(memberError.message);
      setBusy(false);
      return;
    }

    await refresh();
    setBusy(false);
    closeBuilder();
  };

  return (
    <div className="teams-modal-backdrop" role="presentation">
      <section className="teams-modal teams-builder" role="dialog" aria-modal="true" aria-labelledby="teams-builder-title">
        <header className="teams-modal-header">
          <div>
            <span className="teams-kicker">Tabula Design Now · Teams Edition</span>
            <h2 id="teams-builder-title">Organization Builder</h2>
            <p>Build and revise your organization, environment, and team structure.</p>
          </div>
          {setup?.setup_completed_at ? <button type="button" className="teams-close" onClick={closeBuilder}>Close</button> : null}
        </header>

        <nav className="teams-steps" aria-label="Organization Builder progress">
          {['Organization', 'Template', 'Environment', 'Roles'].map((label, index) => (
            <button
              key={label}
              type="button"
              className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''}
              onClick={() => { if (index + 1 < step) setStep(index + 1); }}
            >
              <span>{index + 1}</span>{label}
            </button>
          ))}
        </nav>

        <div className="teams-modal-body">
          {step === 1 ? (
            <div className="teams-step-panel">
              <div className="teams-step-heading">
                <h3>Organization</h3>
                <p>Tell Tabula who you are and what you are building.</p>
              </div>
              <div className="teams-form-grid">
                <label>Organization name<input value={orgName} onChange={(event) => setOrgName(event.target.value)} /></label>
                <label>Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label>
                <label>Organization website<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" /></label>
                <label>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Technology, Healthcare, Professional Services…" /></label>
                <label>Organization size
                  <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
                    <option value="">Select size</option>
                    <option>1–10</option><option>11–50</option><option>51–200</option><option>201–500</option><option>501–1,000</option><option>1,001+</option>
                  </select>
                </label>
                <label>Country / primary operating region<input value={region} onChange={(event) => setRegion(event.target.value)} /></label>
                <label>Primary use
                  <select value={primaryUse} onChange={(event) => { setPrimaryUse(event.target.value); setTemplateKey(''); }}>
                    {PRIMARY_USES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>Project stage
                  <select value={projectStage} onChange={(event) => setProjectStage(event.target.value)}>
                    <option>New Project</option><option>Existing Project</option><option>Migration</option>
                  </select>
                </label>
              </div>
              {projectStage === 'Existing Project' ? (
                <div className="teams-inline-options">
                  <strong>Existing project options</strong>
                  <span>Connect GitHub</span><span>Upload existing files</span><span>Import project</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="teams-step-panel">
              <div className="teams-step-heading">
                <h3>Template recommendation</h3>
                <p>Based on “{primaryUse}”, these are the strongest starting points.</p>
              </div>
              <div className="teams-template-grid">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    className={`teams-template-card${templateKey === template.key ? ' selected' : ''}`}
                    onClick={() => setTemplateKey(template.key)}
                  >
                    <strong>{template.name}</strong>
                    <span>{template.description}</span>
                    <small>{templateKey === template.key ? 'Selected' : 'Choose template'}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="teams-step-panel">
              <div className="teams-step-heading">
                <h3>Environment</h3>
                <p>Set the architecture without requiring every technical decision up front.</p>
              </div>
              <div className="teams-form-grid">
                <label>Environment type
                  <select value={environmentType} onChange={(event) => setEnvironmentType(event.target.value)}>
                    <option>Development</option><option>Testing / Staging</option><option>Production</option><option>Sandbox</option>
                  </select>
                </label>
                <label>Environment name<input value={environmentName} onChange={(event) => setEnvironmentName(event.target.value)} /></label>
              </div>
              <fieldset className="teams-fieldset">
                <legend>Separate environments <small>Recommended: Development + Production</small></legend>
                <div className="teams-check-grid">
                  {['Development', 'Staging', 'Production'].map((item) => (
                    <label key={item}><input type="checkbox" checked={separateEnvironments.includes(item)} onChange={() => toggleListValue(item, separateEnvironments, setSeparateEnvironments)} />{item}</label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="teams-fieldset">
                <legend>Technologies</legend>
                <div className="teams-check-grid tech">
                  {TECHNOLOGIES.map((item) => (
                    <label key={item}><input type="checkbox" checked={technologies.includes(item)} onChange={() => toggleListValue(item, technologies, setTechnologies)} />{item}</label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="teams-step-panel">
              <div className="teams-step-heading">
                <h3>Role appointment</h3>
                <p>Appoint the people who will operate this Teams workspace. You can return and revise these assignments later.</p>
              </div>
              <div className="teams-role-stack">
                {APPOINTABLE_ROLES.map((role) => (
                  <section className="teams-role-card" key={role}>
                    <div className="teams-role-card-heading">
                      <div><h4>{ROLE_LABELS[role]}</h4><p>{ROLE_DESCRIPTIONS[role]}</p></div>
                      <button type="button" onClick={() => setAppointments((current) => [...current, newAppointment(role)])}>+ Add another</button>
                    </div>
                    {appointments.filter((item) => item.role === role).map((item, index) => (
                      <div className="teams-appointment-row" key={item.key}>
                        <label>Name<input value={item.name} onChange={(event) => updateAppointment(item.key, { name: event.target.value })} /></label>
                        <label>Email<input type="email" value={item.email} onChange={(event) => updateAppointment(item.key, { email: event.target.value })} /></label>
                        {role === 'section_leader' ? <label>Assigned section<input value={item.sectionName} onChange={(event) => updateAppointment(item.key, { sectionName: event.target.value })} placeholder="e.g. Home / Theme" /></label> : null}
                        {role === 'site_designer' ? <label>Section <input value={item.sectionName} onChange={(event) => updateAppointment(item.key, { sectionName: event.target.value })} placeholder="Any section" /></label> : null}
                        {role === 'site_designer' ? <label className="teams-inline-check"><input type="checkbox" checked={item.assetApproved} onChange={(event) => updateAppointment(item.key, { assetApproved: event.target.checked })} />Approve Asset Design Module</label> : null}
                        {appointments.filter((row) => row.role === role).length > 1 ? (
                          <button type="button" className="teams-remove" aria-label={`Remove ${ROLE_LABELS[role]} ${index + 1}`} onClick={() => setAppointments((current) => current.filter((row) => row.key !== item.key))}>Remove</button>
                        ) : null}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="teams-error" role="alert">{error}</p> : null}
        </div>

        <footer className="teams-modal-footer">
          <button type="button" disabled={step === 1 || busy} onClick={() => { setError(''); setStep((current) => current - 1); }}>Back</button>
          <span>Step {step} of 4</span>
          {step < 4 ? <button type="button" className="teams-primary" onClick={next}>Continue</button> : <button type="button" className="teams-primary" disabled={busy} onClick={() => void save()}>{busy ? 'Creating organization…' : 'Complete organization setup'}</button>}
        </footer>
      </section>
    </div>
  );
}
