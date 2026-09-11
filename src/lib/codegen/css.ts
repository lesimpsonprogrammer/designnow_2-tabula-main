import type { Theme } from '../../types';

export function genCss(theme: Theme): string {
  return `/* Tabula theme: ${theme.name} — Tabula writes the layout, you write the rest. */
:root {
  --paper: ${theme.paper};
  --ink: ${theme.ink};
  --deep: ${theme.deep};
  --tint: ${theme.tint};
  --accent: ${theme.accent};
  --head: ${theme.head};
  --body: ${theme.body};
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
}

h1, h2, h3, nav { font-family: var(--head); }

nav.obj { display: flex; align-items: center; gap: 24px; }
nav.obj .nav-brand { margin-right: auto; }
nav.obj .nav-brand { display: flex; align-items: center; gap: 10px; }
nav.obj .nav-brand img { display: block; object-fit: contain; }
nav.obj a { color: inherit; text-decoration: none; }
nav.obj .nav-item { position: relative; }
nav.obj .nav-submenu { position: absolute; z-index: 20; top: calc(100% + 12px); left: 50%; display: grid; width: 240px; gap: 2px; padding: 7px; border: 1px solid rgba(17,131,240,.24); border-radius: 8px; background: #fff; color: #1c1a18; box-shadow: 0 16px 38px rgba(18,17,15,.2); opacity: 0; pointer-events: none; transform: translate(-50%, -5px); transition: opacity .18s ease, transform .18s ease; }
nav.obj .nav-submenu a { padding: 8px 9px; border-radius: 5px; font-size: 12px; white-space: normal; }
nav.obj .nav-submenu a:hover { background: rgba(17,131,240,.09); color: #1183f0; }
nav.obj .nav-item:hover .nav-submenu,
nav.obj .nav-item:focus-within .nav-submenu { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); }

.row > .obj { min-width: 0; }

.obj[data-kind="button"],
.obj[data-kind="reminder"] {
  display: grid;
  place-items: center;
  text-decoration: none;
}

.obj[data-kind="button"]:hover,
.obj[data-kind="reminder"]:hover { filter: brightness(1.12); }

.obj[data-kind="card"].stagger-reveal,
.obj[data-kind="box"].stagger-reveal {
  opacity: 0;
  transform: translateY(24px) scale(.985);
  transition: opacity 620ms cubic-bezier(.2, .75, .25, 1), transform 620ms cubic-bezier(.2, .75, .25, 1);
  transition-delay: calc(var(--reveal-index, 0) * 120ms);
  will-change: opacity, transform;
}
.obj.stagger-reveal.is-revealed { opacity: 1; transform: translateY(0) scale(1); }

.reminder-modal-backdrop[hidden] { display: none; }
.reminder-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; background: rgba(18,17,15,.68); backdrop-filter: blur(4px); }
.reminder-modal { position: relative; display: grid; width: min(460px, 100%); gap: 14px; padding: 28px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: #fdfcfa; color: #1c1a18; box-shadow: 0 26px 80px rgba(0,0,0,.35); font-family: var(--body); }
.reminder-modal h2 { margin: 0; font-size: 27px; }
.reminder-modal p { margin: -7px 0 0; color: #6f6963; font-size: 13px; }
.reminder-modal label { display: grid; gap: 6px; color: #514b45; font-size: 11px; }
.reminder-modal input, .reminder-modal textarea { width: 100%; padding: 10px 11px; border: 1px solid #d8d3cb; border-radius: 6px; background: #fff; color: #1c1a18; font: 13px var(--body); }
.reminder-modal-kicker { color: var(--accent); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
.reminder-modal-close { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: #efede8; color: #514b45; font-size: 18px; }
.reminder-channel-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.reminder-channel-options button { min-height: 42px; padding: 7px; border: 1px solid #d8d3cb; border-radius: 6px; background: #fff; color: #514b45; font-size: 10px; }
.reminder-channel-options button.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 9%, white); color: var(--accent); }
.reminder-date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.reminder-submit { min-height: 44px; border: 0; border-radius: 6px; background: var(--accent); color: #fff; font-weight: 600; }
.reminder-confirmation { padding: 9px; border-radius: 6px; background: #e7f8ed; color: #176637; font-size: 11px; }

.obj[data-kind="spacer"] { pointer-events: none; }

.obj[data-kind="icon"] .tabula-icon {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: center;
  transition: transform .24s ease, filter .24s ease;
}

.obj[data-kind="icon"] .icon-motion {
  transform-origin: center;
  animation: icon-float 2.8s ease-in-out infinite;
}

.obj[data-kind="icon"]:hover .tabula-icon {
  filter: drop-shadow(0 5px 7px rgba(17, 131, 240, .24));
  transform: translateY(-3px) scale(1.12) rotate(-3deg);
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-2px) rotate(2deg); }
}

.powered-by-jaren { position: relative; isolation: isolate; display: inline-flex; align-items: center; gap: .42em; }
.powered-by-jaren::before { position: absolute; z-index: -1; inset: -.55em -1em; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(17,131,240,.4) 0%, rgba(17,131,240,.14) 48%, rgba(17,131,240,0) 76%); content: ''; filter: blur(.22em); transform: scale(.78); animation: jaren-blue-halo 1.35s ease-in-out infinite; pointer-events: none; }
.power-status-light {
  display: inline-block;
  width: .34em;
  height: .34em;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #1183f0;
  box-shadow: 0 0 0 0 rgba(17, 131, 240, .65);
  animation: power-light-pulse 1.35s ease-in-out infinite;
}

.powered-by-jaren > span {
  animation: power-text-illuminate 1.35s ease-in-out infinite;
}

@keyframes power-light-pulse {
  0%, 100% { opacity: .38; box-shadow: 0 0 0 0 rgba(17, 131, 240, 0); }
  45% { opacity: 1; box-shadow: 0 0 0 .2em rgba(17, 131, 240, .2), 0 0 .7em rgba(17, 131, 240, 1); }
}

@keyframes power-text-illuminate {
  0%, 100% { color: inherit; filter: brightness(.8); text-shadow: 0 0 0 rgba(17, 131, 240, 0); }
  45% { color: #1183f0; filter: brightness(1.2); text-shadow: 0 0 .42em rgba(17, 131, 240, .9); }
}

@keyframes jaren-blue-halo {
  0%, 100% { opacity: .18; transform: scale(.78); }
  45% { opacity: 1; transform: scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .obj[data-kind="icon"] .tabula-icon,
  .obj[data-kind="icon"] .icon-motion,
  .power-status-light,
  .powered-by-jaren > span,
  .powered-by-jaren::before { animation: none; transition: none; opacity: 1; filter: none; }
  .obj.stagger-reveal { opacity: 1; transform: none; transition: none; }
}

.cloud-artwork { background-image: linear-gradient(to right, rgba(255,255,255,.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.42) 1px, transparent 1px); background-size: 56px 56px; }
.cloud-artwork svg { width: 100%; height: 100%; color: inherit; }
.cloud-artwork .cloud-outline { fill: none; stroke: currentColor; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }
.cloud-artwork:hover { transform: translateY(-4px) rotate(2deg); transition: transform .35s ease; }

@keyframes tabula-divider-shimmer {
  0%, 22% { background-position: 115% 0; opacity: .55; }
  42% { background-position: 50% 0; opacity: 1; }
  62%, 100% { background-position: -15% 0; opacity: .55; }
}

img, video { max-width: 100%; display: block; }
`;
}
