import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { makeSupabaseClient, saveSupabaseConfig } from '../../lib/supabase';
import { slugify } from '../../lib/slug';
import { Landing } from '../Landing/Landing';

type Org = { id: string; name: string; slug: string; role: 'owner' | 'admin' | 'member'; plan: 'trial' | 'active' | 'expired'; trialEndsAt: string };
type Invite = { id: string; org_id: string; email: string; role: 'admin' | 'member'; tabula_organizations: { name: string } | null };

type AuthValue = {
  user: User;
  org: Org;
  client: SupabaseClient;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthGate');
  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(() => makeSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [setupUrl, setSetupUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupError, setSetupError] = useState('');

  const [showAuthForm, setShowAuthForm] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [orgBusy, setOrgBusy] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!client) return;

    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const loadMemberships = async () => {
    if (!client || !session?.user) return;
    const { data: adminRecord } = await client
      .from('tabula_platform_admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setIsPlatformAdmin(Boolean(adminRecord));

    const { data: memberships } = await client
      .from('tabula_memberships')
      .select('org_id, role, tabula_organizations(id, name, slug, plan, trial_ends_at)')
      .eq('user_id', session.user.id);

    const list: Org[] = (memberships ?? [])
      .map((m) => {
        const o = m.tabula_organizations as unknown as { id: string; name: string; slug: string; plan: Org['plan']; trial_ends_at: string } | null;
        if (!o) return null;
        return { id: o.id, name: o.name, slug: o.slug, role: m.role as Org['role'], plan: o.plan, trialEndsAt: o.trial_ends_at };
      })
      .filter((o): o is Org => o !== null);

    setOrgs(list);
    setActiveOrgId((current) => current ?? list[0]?.id ?? null);

    if (list.length === 0) {
      const { data: pending } = await client
        .from('tabula_invites')
        .select('id, org_id, email, role, tabula_organizations(name)')
        .is('accepted_at', null);
      setInvites((pending ?? []) as unknown as Invite[]);
    } else {
      setInvites([]);
    }
  };

  useEffect(() => {
    if (session?.user) void loadMemberships();
    else {
      setOrgs(null);
      setInvites(null);
      setActiveOrgId(null);
      setIsPlatformAdmin(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const authValue = useMemo<AuthValue | null>(() => {
    if (!session?.user || !client) return null;
    const active = orgs?.find((o) => o.id === activeOrgId);
    if (!active) return null;
    return {
      user: session.user,
      org: active,
      client,
      isPlatformAdmin,
      signOut: async () => {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, client, orgs, activeOrgId, isPlatformAdmin]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !email.trim() || !password) return;
    setBusy(true);
    setMessage('');
    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({ email: email.trim(), password });
      if (error) {
        setMessage(error.message);
      } else if (!data.session) {
        setMessage('Account created — check your email to confirm it, then sign in.');
      }
    } else {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage(error.message);
    }
    setBusy(false);
  };

  const createOrg = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !orgName.trim() || !accessCode.trim()) return;
    setOrgBusy(true);
    setOrgError('');
    const slug = slugify(orgName) + '-' + Math.random().toString(36).slice(2, 7);
    const { error } = await client.rpc('tabula_create_organization', { org_name: orgName.trim(), org_slug: slug, access_code: accessCode.trim() });
    if (error) {
      setOrgError(error.message);
      setOrgBusy(false);
      return;
    }
    await loadMemberships();
    setOrgBusy(false);
  };

  const acceptInvite = async (inviteId: string) => {
    if (!client) return;
    setOrgBusy(true);
    setOrgError('');
    const { error } = await client.rpc('tabula_accept_invite', { invite_id: inviteId });
    if (error) {
      setOrgError(error.message);
      setOrgBusy(false);
      return;
    }
    await loadMemberships();
    setOrgBusy(false);
  };

  const saveSetup = (event: FormEvent) => {
    event.preventDefault();
    const url = setupUrl.trim().replace(/\/$/, '');
    const publishableKey = setupKey.trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
      setSetupError('Enter a valid Supabase project URL ending in .supabase.co.');
      return;
    }
    if (!publishableKey) {
      setSetupError('Enter the project publishable key.');
      return;
    }
    setSetupError('');
    setLoading(true);
    setClient(saveSupabaseConfig({ url, publishableKey }));
  };

  if (!client) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="auth-brand">Tabula</span>
          <h1>Connect cloud authentication</h1>
          <p>Enter the API details from your Supabase project settings. Use only the public publishable key—never a secret or service-role key.</p>
          <form onSubmit={saveSetup}>
            <label htmlFor="setup-url">Supabase project URL</label>
            <input id="setup-url" type="url" required value={setupUrl} onChange={(event) => setSetupUrl(event.target.value)} placeholder="https://project-ref.supabase.co" />
            <label htmlFor="setup-key">Publishable key</label>
            <input id="setup-key" type="text" autoComplete="off" spellCheck={false} required value={setupKey} onChange={(event) => setSetupKey(event.target.value)} placeholder="sb_publishable_…" />
            <button type="submit">Connect Supabase</button>
          </form>
          {setupError ? <p className="auth-message" role="alert">{setupError}</p> : null}
        </section>
      </main>
    );
  }

  if (loading) {
    return <main className="auth-screen"><p className="auth-loading">Securing your workspace…</p></main>;
  }

  if (!session?.user) {
    if (!showAuthForm) {
      return (
        <Landing
          onSignIn={() => { setMode('signin'); setShowAuthForm(true); }}
          onSignUp={() => { setMode('signup'); setShowAuthForm(true); }}
        />
      );
    }
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <span className="auth-brand">Tabula</span>
          <h1 id="auth-title">{mode === 'signup' ? 'Create your account' : 'Sign in to your workspace'}</h1>
          <form onSubmit={submitAuth}>
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          </form>
          <button type="button" className="auth-switch-mode" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
          {message ? <p className="auth-message" role="status">{message}</p> : null}
          <button type="button" className="auth-back-link" onClick={() => setShowAuthForm(false)}>← Back</button>
        </section>
      </main>
    );
  }

  if (orgs === null) {
    return <main className="auth-screen"><p className="auth-loading">Loading your workspace…</p></main>;
  }

  if (!authValue) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="org-title">
          <span className="auth-brand">Tabula</span>
          <h1 id="org-title">
            {invites && invites.length > 0 ? 'You have a pending invitation' : 'Design your organization'}
          </h1>
          {!(invites && invites.length > 0) ? (
            <p>Tabula is invite-only for now — enter your access code below to set it up.</p>
          ) : null}

          {invites && invites.length > 0 ? (
            <div className="auth-invites">
              {invites.map((invite) => (
                <div key={invite.id} className="auth-invite-row">
                  <span>{invite.tabula_organizations?.name ?? 'A team'} invited you as {invite.role}</span>
                  <button type="button" disabled={orgBusy} onClick={() => void acceptInvite(invite.id)}>Accept</button>
                </div>
              ))}
              <p className="auth-or">— or, with an access code —</p>
            </div>
          ) : null}

          <form onSubmit={createOrg}>
            <label htmlFor="org-name">Organization name</label>
            <input id="org-name" type="text" required value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="Acme Inc." />
            <label htmlFor="org-access-code">Access code</label>
            <input id="org-access-code" type="text" required value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Ask your Tabula contact for a code" />
            <button type="submit" disabled={orgBusy}>{orgBusy ? 'Designing…' : 'Design organization'}</button>
          </form>
          {orgError ? <p className="auth-message" role="alert">{orgError}</p> : null}
        </section>
      </main>
    );
  }

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}
