// Static companion files shown in the code drawer alongside the generated
// site — examples for the backend the handoff README asks for, not
// something buildFiles derives from canvas state.

export const APP_JS = `const forms = document.querySelectorAll('[data-kind=form]');

async function subscribe(email) {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('subscribe failed: ' + res.status);
  return res.json();
}

forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    subscribe(new FormData(form).get('email'));
  });
});

const reminderModal = document.querySelector('[data-reminder-modal]');
const reminderForm = document.querySelector('[data-reminder-form]');
const reminderContact = document.querySelector('[data-reminder-contact]');
const reminderContactLabel = document.querySelector('[data-reminder-contact-label]');
const reminderConfirmation = document.querySelector('[data-reminder-confirmation]');
let reminderChannel = 'email';

document.querySelectorAll('[data-kind=reminder]').forEach((button) => button.addEventListener('click', () => {
  reminderModal.hidden = false;
  reminderConfirmation.hidden = true;
}));
document.querySelector('[data-reminder-close]')?.addEventListener('click', () => { reminderModal.hidden = true; });
reminderModal?.addEventListener('click', (event) => { if (event.target === reminderModal) reminderModal.hidden = true; });
document.querySelectorAll('[data-reminder-channel]').forEach((button) => button.addEventListener('click', () => {
  reminderChannel = button.dataset.reminderChannel;
  document.querySelectorAll('[data-reminder-channel]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-checked', String(active));
  });
  const settings = reminderChannel === 'email'
    ? ['Email address', 'email', 'you@company.com']
    : reminderChannel === 'sms'
      ? ['Mobile number', 'tel', '(555) 555-0123']
      : ['Facebook Messenger name', 'text', 'Messenger username'];
  reminderContactLabel.textContent = settings[0];
  reminderContact.type = settings[1];
  reminderContact.placeholder = settings[2];
}));
reminderForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(reminderForm));
  const request = { ...data, channel: reminderChannel, contact: reminderContact.value };
  try {
    const response = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    if (!response.ok) throw new Error('Reminder service unavailable');
    reminderConfirmation.textContent = 'Your reminder is scheduled.';
  } catch {
    const saved = JSON.parse(localStorage.getItem('tabula.reminders') || '[]');
    localStorage.setItem('tabula.reminders', JSON.stringify([...saved, request]));
    reminderConfirmation.textContent = 'Reminder request saved on this device. Connect a messaging provider to deliver it.';
  }
  reminderConfirmation.hidden = false;
});

const revealCards = Array.from(document.querySelectorAll('.obj.stagger-reveal'));
revealCards.forEach((card, index) => card.style.setProperty('--reveal-index', String(index % 4)));
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
  revealCards.forEach((card) => card.classList.add('is-revealed'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  revealCards.forEach((card) => revealObserver.observe(card));
}
`;

export const API_PY = `from dataclasses import dataclass

SUBSCRIBERS: list[str] = []
REMINDERS: list[dict] = []

@dataclass
class Subscriber:
    email: str
    source: str = "site"

def subscribe(email: str) -> dict:
    """Store a subscriber and echo back the count."""
    if "@" not in email:
        raise ValueError(f"not an email: {email!r}")
    SUBSCRIBERS.append(Subscriber(email).email)
    return {"ok": True, "total": len(SUBSCRIBERS)}

def schedule_reminder(channel: str, contact: str, date: str, time: str, note: str = "") -> dict:
    """Queue a reminder request for the configured delivery provider."""
    reminder = {"channel": channel, "contact": contact, "date": date, "time": time, "note": note}
    REMINDERS.append(reminder)
    return {"ok": True, "queued": len(REMINDERS)}
`;

export const DEPLOY_SH = `#!/usr/bin/env bash
set -euo pipefail

SITE="tabula-site"

echo "building $SITE"
npm run build

for region in iad sjc fra; do
  echo "pushing to $region"
  rsync -az dist/ "deploy@$region:/srv/$SITE"
done
`;

export const SCHEMA_SQL = `-- subscribers captured by the email form
create table subscribers (
  id bigserial primary key,
  email text not null unique,
  source text default 'site',
  created_at timestamptz default now()
);

create table reminder_requests (
  id bigserial primary key,
  channel text not null check (channel in ('email', 'messenger', 'sms')),
  contact text not null,
  remind_on date not null,
  remind_at time not null,
  note text,
  status text default 'queued',
  created_at timestamptz default now()
);

select source, count(*) as total
from subscribers
where created_at > now() - interval '30 days'
group by source
order by total desc;
`;
