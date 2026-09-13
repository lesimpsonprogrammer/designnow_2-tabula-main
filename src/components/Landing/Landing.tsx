import './Landing.css';

const FEATURES = [
  { title: 'Design on a real canvas', body: 'Drag, drop, and arrange sections the way you actually think about a page — not a form full of fields.' },
  { title: 'Export clean code, not a black box', body: 'Every project exports plain HTML, CSS, and JS. No proprietary runtime, no lock-in — host it anywhere.' },
  { title: 'Built for teams', body: 'Organizations, invites, and role-based access are built in from day one. Bring your whole team, not just yourself.' },
];

export function Landing({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <main className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Tabula Design Now</span>
        <div className="landing-nav-actions">
          <button type="button" className="landing-nav-signin" onClick={onSignIn}>Sign in</button>
          <button type="button" className="landing-nav-cta" onClick={onSignUp}>Request access</button>
        </div>
      </header>

      <section className="landing-hero">
        <span className="landing-eyebrow">Invite-only · early access</span>
        <h1>Design real pages. Export real code.</h1>
        <p>
          Tabula is a visual canvas for building web pages that exports clean, portable HTML and CSS —
          no proprietary runtime, no lock-in. Design it here, host it anywhere. We're onboarding
          teams by invite while we're in early access — request a code to get started.
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-hero-cta" onClick={onSignUp}>Request access</button>
          <button type="button" className="landing-hero-secondary" onClick={onSignIn}>Sign in</button>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="landing-feature">
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Tabula Design Now</span>
      </footer>
    </main>
  );
}
