import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { makeSupabaseClient, saveSupabaseConfig } from '../../lib/supabase';

type AuthValue = {
  user: User;
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
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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

  const authValue = useMemo<AuthValue | null>(() => {
    if (!session?.user || !client) return null;
    return {
      user: session.user,
      signOut: async () => {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    };
  }, [session]);

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !email.trim()) return;
    setBusy(true);
    setMessage('');
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : 'Check your email for your secure Tabula sign-in link.');
    setBusy(false);
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

  if (!authValue) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <span className="auth-brand">Tabula</span>
          <h1 id="auth-title">Sign in to your workspace</h1>
          <p>Enter your email and we’ll send you a secure sign-in link. No password required.</p>
          <form onSubmit={requestLink}>
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
            <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
          </form>
          {message ? <p className="auth-message" role="status">{message}</p> : null}
        </section>
      </main>
    );
  }

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}
