// Core domain types for the Tabula site builder.
// Mirrors the state shape documented in the handoff README.

export type Kind =
  // Text
  | 'eyebrow' | 'heading' | 'subhead' | 'text' | 'list' | 'quote' | 'stat' | 'badge'
  // Layout
  | 'box' | 'card' | 'divider' | 'spacer' | 'nav' | 'breadcrumb' | 'footer' | 'accordion'
  // Media
  | 'image' | 'logo' | 'video' | 'cloud' | 'icon' | 'logos' | 'table'
  // Forms
  | 'button' | 'reminder' | 'form' | 'input' | 'checkbox';

export const BLOCK_KINDS: Kind[] = ['image', 'logo', 'box', 'card', 'divider', 'spacer', 'video', 'cloud', 'icon'];
export const HEAD_KINDS: Kind[] = ['heading', 'subhead', 'nav', 'stat', 'quote'];

export type NavLink = { id: string; label: string; href: string; children?: NavLink[] };
export type TextColorRange = { start: number; end: number; color: string; shadow?: boolean; lift?: number };
export type TextRange = { start: number; end: number };
export type LibraryItem = { id: string; name: string; object: Obj; createdAt: number };
export type AuditEvent = {
  id: string;
  createdAt: number;
  projectId: string;
  pageId: string | null;
  kind: 'transaction' | 'major-resize';
  summary: string;
  details: string[];
};

export type Obj = {
  id: string;             // `${kind}-${nn}`
  kind: Kind;
  x: number; y: number;   // px from PAGE top-left (page-absolute, not section-relative)
  w: number; h: number;
  text: string;           // "\n" separated for multi-line kinds
  label: string;          // media placeholder caption
  size: number;           // font px
  wordSpacing: number;    // extra px between words
  sentenceSpacing: number; // extra px after sentence punctuation
  fontFamily: string;     // empty = use the project theme
  italic: boolean;
  textColors: TextColorRange[]; // character ranges with their own ink color
  textItalics: TextRange[]; // character ranges with independent italic styling
  color: string;          // ink
  bg: string;             // fill; 'transparent' = none
  radius: number;         // 0-60
  pad: number | null;     // null = kind default
  bw: number;             // border width 0-12
  bc: string;             // border color
  opacity: number;        // 10-100
  dividerGradient: boolean; // fade divider color to transparent at both ends
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  href: string;
  navBrand: string;
  navLinks: NavLink[];
  navLogo: string;
  navLogoWidth: number;
  navLogoHeight: number;
  iconName: 'database' | 'workflow' | 'users' | 'calculator' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'x';
  imageSrc: string;
  imageOriginalSrc: string;
  hidden: boolean;
  locked: boolean;
  groupId: string | null;
};

export type Section = {
  id: string;
  name: string;           // also the exported <section id>, slugified
  y: number;              // px from page top
  h: number;              // band height, min 80
  bg: string;             // 'transparent' or hex
};

export type Folder = {
  id: string;
  name: string;
  open: boolean;
};

export type Page = {
  id: string;
  name: string;
  slug: string;           // '' for the home page
  folderId: string | null;
  status: 'published' | 'draft';
  home: boolean;
  sections: Section[];
  objects: Obj[];
};

export type Theme = {
  name: string;
  paper: string;  // page background
  ink: string;    // body text
  deep: string;   // dark surfaces
  tint: string;   // light fills
  accent: string; // buttons, links, active states
  head: string;   // heading font stack
  body: string;   // body font stack
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type Snapshot = {
  objects: Obj[];
  sections: Section[];
};

export type File = {
  name: string;
  language: string;
  content: string;
};

export type LeftTab = 'pages' | 'objects' | 'layers' | 'library' | 'events';
export type RightTab = 'inspect' | 'typography' | 'theme';
export type Device = 'desktop' | 'tablet' | 'phone';

export type State = {
  view: 'templates' | 'editor' | null;
  projectOpen: boolean;
  hasRecentProject: boolean;
  projectId: string;
  projectNumber: number;
  projectName: string;
  projectCreatedAt: number;

  pages: Page[];
  folders: Folder[];
  activePageId: string | null;

  // Active page's objects/sections, hoisted for editing; written back on page switch.
  objects: Obj[];
  sections: Section[];

  selectedId: string | null;          // object
  selectedSectionId: string | null;   // section
  editingId: string | null;           // inline text edit in progress
  renamingId: string | null;          // page being renamed in the tree
  clipboard: Obj | null;
  library: LibraryItem[];
  auditEvents: AuditEvent[];
  groupSelection: string[];

  past: Snapshot[];
  future: Snapshot[];

  leftTab: LeftTab;
  rightTab: RightTab;
  rightRailOpen: boolean;
  preview: boolean;
  device: Device;
  snap: boolean;
  drawerOpen: boolean;

  files: File[];
  activeFile: string;

  theme: Theme;
  savedAt: number | null;
  saveStatus: 'idle' | 'pending' | 'saved' | 'error';
  thumbW: number;

  messages: ChatMessage[];
  chatInput: string;
  chatBusy: boolean;

  themePrompt: string;
  themeBusy: boolean;
  themeNote: string;

  nextId: number;
};