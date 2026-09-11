import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AuditEvent, Device, Folder, Kind, LibraryItem, NavLink, Obj, Page, Section, Snapshot, State } from '../types';
import { DEFAULT_THEME } from '../lib/themes';
import { makeObject, objSpec } from '../lib/objSpec';
import { createAboutTemplate, createContactTemplate, createMomentumTemplate } from '../lib/momentumTemplate';
import { slugify } from '../lib/slug';

const PAST_CAP = 60;
const STORE_KEY = 'tabula.site.v3';
const PROJECT_COUNTER_KEY = 'tabula.project.counter';

function makeProjectId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `project-${nanoid(16)}`;
}

function nextProjectNumber() {
  if (typeof window === 'undefined') return 1;
  const next = Math.max(1, Number(window.localStorage.getItem(PROJECT_COUNTER_KEY) ?? 0) + 1);
  window.localStorage.setItem(PROJECT_COUNTER_KEY, String(next));
  return next;
}

function rememberProjectNumber(number: number) {
  if (typeof window === 'undefined') return;
  const current = Number(window.localStorage.getItem(PROJECT_COUNTER_KEY) ?? 0);
  if (number > current) window.localStorage.setItem(PROJECT_COUNTER_KEY, String(number));
}

function sid() {
  return 'sec-' + nanoid(5);
}

function inBand(o: Obj, s: Section) {
  return o.y >= s.y && o.y < s.y + s.h;
}

function makeHomePage(): Page {
  const { objects, sections } = createMomentumTemplate(sid);
  return {
    id: nanoid(8),
    name: 'Home',
    slug: '',
    folderId: null,
    status: 'draft',
    home: true,
    sections,
    objects,
  };
}

function makeAboutPage(): Page {
  const { objects, sections } = createAboutTemplate(sid);
  return {
    id: nanoid(8),
    name: 'About',
    slug: 'about',
    folderId: null,
    status: 'published',
    home: false,
    sections,
    objects,
  };
}

function makeContactPage(): Page {
  const { objects, sections } = createContactTemplate(sid);
  return {
    id: nanoid(8),
    name: 'Contact us',
    slug: 'contact-us',
    folderId: null,
    status: 'published',
    home: false,
    sections,
    objects,
  };
}

function blankSections(): Section[] {
  return [{ id: sid(), name: 'Section', y: 0, h: 420, bg: 'transparent' }];
}

function blankPage(name: string, folderId: string | null, status: Page['status'] = 'published'): Page {
  return {
    id: nanoid(8),
    name,
    slug: slugify(name),
    folderId,
    status,
    home: false,
    sections: blankSections(),
    objects: [],
  };
}

function pageSectionForObject(page: Page, object: Obj) {
  return page.sections.find((section) => inBand(object, section));
}

function applyHomeChrome(page: Page, home: Page): Page {
  if (page.id === home.id) return page;
  const homeHeader = home.sections.find((section) => /^header$/i.test(section.name.trim())) ?? home.sections.find((section) => section.y === 0);
  const homeFooterObject = home.objects.find((object) => object.kind === 'footer');
  const homeFooter = home.sections.find((section) => /^footer$/i.test(section.name.trim()))
    ?? (homeFooterObject ? pageSectionForObject(home, homeFooterObject) : undefined)
    ?? home.sections[home.sections.length - 1];
  if (!homeHeader || !homeFooter) return page;

  const targetHeader = page.sections.find((section) => /^header$/i.test(section.name.trim())) ?? page.sections.find((section) => section.y === 0 && page.objects.some((object) => object.kind === 'nav' && inBand(object, section)));
  const targetFooterObject = page.objects.find((object) => object.kind === 'footer');
  const targetFooter = page.sections.find((section) => /^footer$/i.test(section.name.trim()))
    ?? (targetFooterObject ? pageSectionForObject(page, targetFooterObject) : undefined);
  const replacedSectionIds = new Set([targetHeader?.id, targetFooter?.id].filter((id): id is string => Boolean(id)));
  const shift = homeHeader.h - (targetHeader?.h ?? 0);
  const bodySections = page.sections.filter((section) => !replacedSectionIds.has(section.id)).map((section) => ({ ...section, y: section.y + shift }));
  const bodyObjects = page.objects
    .filter((object) => {
      const section = pageSectionForObject(page, object);
      return !section || !replacedSectionIds.has(section.id);
    })
    .map((object) => ({ ...object, y: object.y + shift }));
  const footerY = Math.max(homeHeader.h, ...bodySections.map((section) => section.y + section.h));
  const cloneBandObjects = (source: Section, y: number, prefix: string) => home.objects
    .filter((object) => inBand(object, source))
    .map((object) => ({ ...object, id: `${prefix}-${nanoid(8)}`, y: y + (object.y - source.y), groupId: null }));
  const headerSection: Section = { ...homeHeader, id: targetHeader?.id ?? sid(), y: 0 };
  const footerSection: Section = { ...homeFooter, id: targetFooter?.id ?? sid(), y: footerY };

  return {
    ...page,
    sections: [headerSection, ...bodySections, footerSection].sort((a, b) => a.y - b.y),
    objects: [...cloneBandObjects(homeHeader, 0, 'shared-header'), ...bodyObjects, ...cloneBandObjects(homeFooter, footerY, 'shared-footer')],
  };
}

function activeHomePage(state: State): Page | undefined {
  const home = state.pages.find((page) => page.home);
  if (!home) return undefined;
  return home.id === state.activePageId ? { ...home, objects: state.objects, sections: state.sections } : home;
}

function homeChromeSignature(state: State): string {
  const home = activeHomePage(state);
  if (!home) return '';
  const header = home.sections.find((section) => /^header$/i.test(section.name.trim())) ?? home.sections.find((section) => section.y === 0);
  const footerObject = home.objects.find((object) => object.kind === 'footer');
  const footer = home.sections.find((section) => /^footer$/i.test(section.name.trim()))
    ?? (footerObject ? pageSectionForObject(home, footerObject) : undefined)
    ?? home.sections[home.sections.length - 1];
  if (!header || !footer) return '';
  return JSON.stringify({
    header,
    headerObjects: home.objects.filter((object) => inBand(object, header)),
    footer,
    footerObjects: home.objects.filter((object) => inBand(object, footer)),
  });
}

// Seeded site map mirrors the customer's live Squarespace site (see handoff README).
function seedSite(): { pages: Page[]; folders: Folder[]; homePage: Page } {
  const homePage = makeHomePage();
  const compliance: Folder = { id: nanoid(8), name: 'Compliance', open: false };
  const resources: Folder = { id: nanoid(8), name: 'Resources', open: false };

  const pages: Page[] = [
    homePage,
    makeAboutPage(),
    blankPage('Community', compliance.id),
    blankPage('HIPAA', compliance.id),
    blankPage('Data Handling Policy', compliance.id),
    blankPage('Data Security & Governance', compliance.id),
    blankPage('Blog', resources.id),
    blankPage('Data Glossary', resources.id),
    blankPage('Relentless Commitment', resources.id),
    blankPage('Executive Brief', resources.id),
    blankPage("Data API's", resources.id),
    blankPage('Data Webhooks', resources.id),
    blankPage('Data Connectors', resources.id),
    blankPage('Support Tools', resources.id, 'draft'),
    blankPage('Cloud Performance', resources.id, 'draft'),
    makeContactPage(),
  ];

  return { pages, folders: [compliance, resources], homePage };
}

function migrateObject(raw: Partial<Obj>, index: number): Obj {
  const kind = raw.kind ?? 'text';
  const defaults = objSpec(kind, raw.x ?? 0, raw.y ?? 0, raw.label);
  const navLinks = Array.isArray(raw.navLinks)
    ? raw.navLinks.map((link: Partial<NavLink>, linkIndex: number) => ({
        id: link.id ?? `nav-${linkIndex}`,
        label: link.label ?? 'Menu item',
        href: link.href ?? '#',
        children: Array.isArray(link.children) ? link.children.map((child, childIndex) => ({
          id: child.id ?? `nav-${linkIndex}-${childIndex}`,
          label: child.label ?? 'Submenu item',
          href: child.href ?? '#',
        })) : undefined,
      }))
    : [];

  return {
    ...defaults,
    ...raw,
    id: raw.id ?? `${kind}-${String(index + 1).padStart(2, '0')}`,
    kind,
    fontFamily: raw.fontFamily ?? '',
    wordSpacing: raw.wordSpacing ?? 0,
    sentenceSpacing: raw.sentenceSpacing ?? 0,
    italic: raw.italic ?? false,
    textColors: Array.isArray(raw.textColors)
      ? raw.textColors.filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && typeof range.color === 'string')
      : [],
    textItalics: Array.isArray(raw.textItalics)
      ? raw.textItalics.filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end))
      : [],
    dividerGradient: raw.dividerGradient ?? false,
    align: raw.align ?? 'left',
    vAlign: raw.vAlign ?? defaults.vAlign,
    href: raw.href ?? '#',
    navBrand: raw.navBrand ?? '',
    navLinks,
    navLogo: raw.navLogo ?? '',
    navLogoWidth: raw.navLogoWidth ?? 120,
    navLogoHeight: raw.navLogoHeight ?? 36,
    iconName: raw.iconName ?? 'database',
    imageSrc: raw.imageSrc ?? '',
    imageOriginalSrc: raw.imageOriginalSrc ?? '',
    hidden: raw.hidden ?? false,
    locked: raw.locked ?? false,
    groupId: raw.groupId ?? null,
  };
}

function migratePage(raw: Partial<Page>, index: number): Page {
  const name = raw.name ?? `Page ${index + 1}`;
  const isBlankContactPage = /^contact us$/i.test(name.trim()) && (!Array.isArray(raw.objects) || raw.objects.length === 0);
  const contactTemplate = isBlankContactPage ? createContactTemplate(sid) : null;
  return {
    id: raw.id ?? `page-${index + 1}`,
    name,
    slug: raw.home ? '' : raw.slug ?? slugify(name),
    folderId: raw.folderId ?? null,
    status: raw.status === 'draft' ? 'draft' : 'published',
    home: raw.home ?? index === 0,
    sections: contactTemplate?.sections ?? (Array.isArray(raw.sections) && raw.sections.length ? raw.sections : blankSections()),
    objects: contactTemplate?.objects ?? (Array.isArray(raw.objects) ? raw.objects.map(migrateObject) : []),
  };
}

function loadSavedState(fallbackPages: Page[], fallbackFolders: Folder[]): Partial<State> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? 'null') as Partial<State> | null;
    if (!raw || !Array.isArray(raw.pages) || !raw.pages.length) return null;

    // Older v3 snapshots kept the active page's newest working arrays at the
    // top level. Fold those into that page before migration so no edit is lost.
    const rawPages = raw.pages.map((page) => page.id === raw.activePageId
      ? {
          ...page,
          ...(Array.isArray(raw.objects) ? { objects: raw.objects } : {}),
          ...(Array.isArray(raw.sections) ? { sections: raw.sections } : {}),
        }
      : page);
    const pages = rawPages.map(migratePage);
    const activePageId = pages.some((page) => page.id === raw.activePageId)
      ? raw.activePageId!
      : pages.find((page) => page.home)?.id ?? pages[0].id;
    const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
    const highestObjectNumber = pages
      .flatMap((page) => page.objects)
      .reduce((max, object) => Math.max(max, Number(object.id.match(/(\d+)$/)?.[1] ?? 0)), 0);

    return {
      view: 'editor',
      projectOpen: false,
      hasRecentProject: true,
      projectId: raw.projectId ?? `legacy-${activePageId}`,
      projectNumber: raw.projectNumber ?? 1,
      projectName: raw.projectName ?? 'Recovered Project',
      projectCreatedAt: raw.projectCreatedAt ?? raw.savedAt ?? Date.now(),
      pages: pages.length ? pages : fallbackPages,
      folders: Array.isArray(raw.folders) ? raw.folders : fallbackFolders,
      activePageId,
      objects: activePage.objects,
      sections: activePage.sections,
      selectedId: null,
      selectedSectionId: null,
      editingId: null,
      renamingId: null,
      clipboard: null,
      groupSelection: [],
      library: Array.isArray(raw.library)
        ? raw.library.map((item, index) => ({
            id: item.id ?? `library-${index + 1}`,
            name: item.name ?? `Saved object ${index + 1}`,
            object: migrateObject(item.object ?? {}, index),
            createdAt: item.createdAt ?? Date.now(),
          }))
        : [],
      auditEvents: Array.isArray(raw.auditEvents) ? raw.auditEvents : [],
      past: [],
      future: [],
      leftTab: raw.leftTab ?? 'pages',
      rightTab: raw.rightTab ?? 'inspect',
      rightRailOpen: raw.rightRailOpen ?? true,
      preview: false,
      device: raw.device ?? 'desktop',
      snap: raw.snap ?? true,
      drawerOpen: raw.drawerOpen ?? false,
    files: Array.isArray(raw.files) ? raw.files : [],
    activeFile: typeof raw.activeFile === 'string' ? raw.activeFile : 'index.html',
      theme: raw.theme ?? DEFAULT_THEME,
      savedAt: raw.savedAt ?? null,
      saveStatus: raw.savedAt ? 'saved' : 'idle',
      nextId: Math.max(raw.nextId ?? 1, highestObjectNumber + 1),
    };
  } catch {
    return null;
  }
}

function persistState(state: State): boolean {
  if (typeof window === 'undefined') return false;
  const pages = state.pages.map((page) => page.id === state.activePageId
    ? { ...page, objects: state.objects, sections: state.sections }
    : page);
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({
      view: 'editor',
      projectId: state.projectId,
      projectNumber: state.projectNumber,
      projectName: state.projectName,
      projectCreatedAt: state.projectCreatedAt,
      pages,
      folders: state.folders,
      activePageId: state.activePageId,
      leftTab: state.leftTab,
      rightTab: state.rightTab,
      rightRailOpen: state.rightRailOpen,
      device: state.device,
      snap: state.snap,
      drawerOpen: state.drawerOpen,
      files: state.files,
      activeFile: state.activeFile,
      theme: state.theme,
      library: state.library,
      auditEvents: state.auditEvents,
      savedAt: state.savedAt,
      nextId: state.nextId,
    }));
    return true;
  } catch {
    return false;
  }
}

type Actions = {
  // Page lifecycle
  syncActivePage: () => void;
  setActivePage: (id: string) => void;
  addPage: (folderId?: string | null) => void;
  deletePage: (id: string) => void;
  startRenamePage: (id: string) => void;
  commitRename: (id: string, name: string) => void;
  cancelRename: () => void;
  setHomePage: (id: string) => void;
  toggleStatus: (id: string) => void;
  setPageStatus: (id: string, status: Page['status']) => void;
  addFolder: () => void;
  deleteFolder: (id: string) => void;
  toggleFolder: (id: string) => void;
  applyHomeChromeToAllPages: () => void;
  addSolutionsNavigation: () => void;

  // Selection
  selectObject: (id: string | null) => void;
  selectSection: (id: string | null) => void;
  toggleGroupSelection: (id: string) => void;
  clearGroupSelection: () => void;
  groupSelectedObjects: () => void;
  ungroupObjectGroup: (id: string) => void;
  toggleObjectGroupLock: (id: string) => void;

  // Objects
  addObject: (kind: Kind, x: number, y: number, label?: string) => Obj;
  updateObject: (id: string, patch: Partial<Obj>) => void;
  moveObjectOrGroup: (id: string, x: number, y: number) => void;
  removeObject: (id: string) => void;
  duplicateSelected: () => void;
  nudge: (dx: number, dy: number) => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  copySelectedStyleToSection: () => void;
  saveSelectedToLibrary: (name?: string) => void;
  insertLibraryItem: (id: string) => void;
  removeLibraryItem: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  toggleObjectLock: (id: string) => void;
  moveObjectLayer: (id: string, direction: 1 | -1) => void;
  setAllButtonSize: (width: number, height: number) => void;
  snapVal: (v: number) => number;

  // Inline editing
  setEditingId: (id: string | null) => void;

  // Undo/redo
  snapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Section ops
  addSection: () => void;
  duplicateSection: (id: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (id: string, dir: 1 | -1) => void;
  setSectionHeight: (id: string, h: number) => void;
  renameSection: (id: string, name: string) => void;
  setSectionBg: (id: string, bg: string) => void;
  shiftSectionContent: (id: string, dy: number) => void;
  applyCloudHero: (id: string) => void;
  restoreServiceContainers: (id: string) => void;
  addServiceIcons: (id: string) => void;

  // UI
  setLeftTab: (tab: State['leftTab']) => void;
  setRightTab: (tab: State['rightTab']) => void;
  toggleRightRail: () => void;
  setDevice: (device: Device) => void;
  togglePreview: () => void;
  toggleSnap: () => void;
  toggleDrawer: () => void;
  startNewProject: () => void;
  continueRecentProject: () => void;
  returnToStart: () => void;
};

const { pages: seededPages, folders: seededFolders, homePage } = seedSite();

export const useTabulaStore = create<State & Actions>((set, get) => ({
  view: 'editor',
  projectOpen: false,
  hasRecentProject: false,
  projectId: '',
  projectNumber: 0,
  projectName: '',
  projectCreatedAt: 0,
  pages: seededPages,
  folders: seededFolders,
  activePageId: homePage.id,

  objects: homePage.objects,
  sections: homePage.sections,

  selectedId: null,
  selectedSectionId: null,
  editingId: null,
  renamingId: null,
  clipboard: null,
  groupSelection: [],
  library: [],
  auditEvents: [],

  past: [],
  future: [],

  leftTab: 'pages',
  rightTab: 'inspect',
  rightRailOpen: true,
  preview: false,
  device: 'desktop',
  snap: true,
  drawerOpen: false,

  files: [],
  activeFile: 'index.html',

  theme: DEFAULT_THEME,
  savedAt: null,
  saveStatus: 'idle',
  thumbW: 300,

  messages: [],
  chatInput: '',
  chatBusy: false,

  themePrompt: '',
  themeBusy: false,
  themeNote: '',

  nextId: homePage.objects.length + 1,

  // --- Page lifecycle -----------------------------------------------

  syncActivePage: () => {
    const s = get();
    if (!s.activePageId) return;
    set({
      pages: s.pages.map((p) =>
        p.id === s.activePageId ? { ...p, objects: s.objects, sections: s.sections } : p
      ),
    });
  },

  setActivePage: (id) => {
    get().syncActivePage();
    const next = get().pages.find((p) => p.id === id);
    if (!next) return;
    set({
      activePageId: id,
      objects: next.objects,
      sections: next.sections,
      selectedId: null,
      selectedSectionId: null,
      groupSelection: [],
      past: [],
      future: [],
    });
  },

  addPage: (folderId = null) => {
    get().syncActivePage();
    const state = get();
    const blank: Page = { ...blankPage('Untitled', folderId, 'draft'), slug: 'untitled' };
    const home = state.pages.find((page) => page.home);
    const page = home ? applyHomeChrome(blank, home) : blank;
    set((s) => ({ pages: s.pages.concat(page), renamingId: page.id }));
  },

  deletePage: (id) => {
    if (get().pages.length < 2) return;
    set((s) => {
      const pages = s.pages.filter((p) => p.id !== id);
      if (s.activePageId !== id) return { pages };
      const next = pages[0];
      return {
        pages,
        activePageId: next?.id ?? null,
        objects: next?.objects ?? [],
        sections: next?.sections?.length ? next.sections : blankSections(),
        selectedId: null,
        selectedSectionId: null,
        groupSelection: [],
        past: [],
        future: [],
      };
    });
  },

  startRenamePage: (id) => set({ renamingId: id }),
  cancelRename: () => set({ renamingId: null }),

  commitRename: (id, name) => {
    const clean = name.trim();
    set((s) => ({
      renamingId: null,
      pages: clean
        ? s.pages.map((p) => (p.id === id ? { ...p, name: clean, slug: p.home ? '' : slugify(clean) } : p))
        : s.pages,
    }));
  },

  setHomePage: (id) => {
    set((s) => ({
      pages: s.pages.map((p) => ({
        ...p,
        home: p.id === id,
        status: p.id === id ? 'published' : p.status,
        slug: p.id === id ? '' : p.slug || slugify(p.name),
      })),
    }));
  },

  toggleStatus: (id) => {
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === id && !p.home ? { ...p, status: p.status === 'draft' ? 'published' : 'draft' } : p
      ),
    }));
  },

  setPageStatus: (id, status) => {
    set((s) => ({
      pages: s.pages.map((p) => p.id === id && !p.home ? { ...p, status } : p),
    }));
  },

  addFolder: () => {
    const folder: Folder = { id: nanoid(8), name: 'New folder', open: true };
    set((s) => ({ folders: s.folders.concat(folder) }));
  },

  deleteFolder: (id) => {
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      pages: s.pages.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)),
    }));
  },

  toggleFolder: (id) => {
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, open: !f.open } : f)) }));
  },

  applyHomeChromeToAllPages: () => {
    get().syncActivePage();
    const state = get();
    const home = state.pages.find((page) => page.home);
    if (!home) return;
    set((current) => {
      const pages = current.pages.map((page) => applyHomeChrome(page, home));
      const active = pages.find((page) => page.id === current.activePageId);
      return {
        pages,
        ...(active ? { objects: active.objects, sections: active.sections, selectedId: null, selectedSectionId: null } : {}),
      };
    });
  },

  addSolutionsNavigation: () => {
    get().syncActivePage();
    const state = get();
    const home = state.pages.find((page) => page.home);
    if (!home) return;
    const nav = home.objects.find((object) => object.kind === 'nav');
    if (!nav) return;
    const parts = nav.text.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
    const brand = nav.navBrand || parts[0] || 'Momentum';
    const existing = nav.navLinks.length ? nav.navLinks : parts.slice(1).map((label, index) => ({
      id: `nav-${index}`,
      label,
      href: label.toLowerCase() === 'home' ? '/' : `/${slugify(label)}`,
    }));
    const solutions: NavLink = {
      id: existing.find((link) => /^solutions$/i.test(link.label))?.id ?? `nav-solutions-${nanoid(6)}`,
      label: 'Solutions',
      href: '/solutions',
      children: [
        { id: 'solution-data-management', label: 'Data Management', href: '/solutions/data-management' },
        { id: 'solution-hr-consulting', label: 'Human Resources / HR Consulting', href: '/solutions/human-resources-consulting' },
        { id: 'solution-project-management', label: 'Project Management', href: '/solutions/project-management' },
        { id: 'solution-managed-payroll', label: 'Managed Payroll', href: '/solutions/managed-payroll' },
      ],
    };
    const withoutSolutions = existing.filter((link) => !/^solutions$/i.test(link.label));
    const afterAbout = withoutSolutions.findIndex((link) => /^about$/i.test(link.label)) + 1;
    const insertAt = afterAbout > 0 ? afterAbout : Math.max(0, withoutSolutions.findIndex((link) => /^contact us$/i.test(link.label)));
    const links = [...withoutSolutions.slice(0, insertAt), solutions, ...withoutSolutions.slice(insertAt)];
    const updatedNav = { ...nav, navBrand: brand, navLinks: links, text: [brand, ...links.map((link) => link.label)].join('    ') };
    set((current) => ({
      pages: current.pages.map((page) => page.id === home.id
        ? { ...page, objects: page.objects.map((object) => object.id === nav.id ? updatedNav : object) }
        : page),
      ...(current.activePageId === home.id ? { objects: current.objects.map((object) => object.id === nav.id ? updatedNav : object) } : {}),
    }));
  },

  // --- Selection -------------------------------------------------------

  selectObject: (id) => set((state) => {
    const kind = state.objects.find((object) => object.id === id)?.kind;
    const usesFloatingControls = kind === 'nav' || kind === 'button';
    return {
      selectedId: id,
      selectedSectionId: null,
      ...(id && !usesFloatingControls ? { rightRailOpen: true, rightTab: 'inspect' as const } : {}),
    };
  }),
  selectSection: (id) => set({
    selectedSectionId: id,
    selectedId: null,
    ...(id ? { rightRailOpen: true, rightTab: 'inspect' as const } : {}),
  }),
  toggleGroupSelection: (id) => set((state) => ({
    groupSelection: state.groupSelection.includes(id)
      ? state.groupSelection.filter((candidate) => candidate !== id)
      : [...state.groupSelection, id],
  })),
  clearGroupSelection: () => set({ groupSelection: [] }),
  groupSelectedObjects: () => {
    const state = get();
    const ids = state.groupSelection.filter((id) => state.objects.some((object) => object.id === id));
    if (ids.length < 2) return;
    state.snapshot();
    const groupId = `group-${nanoid(8)}`;
    const selected = new Set(ids);
    set((current) => ({
      objects: current.objects.map((object) => selected.has(object.id) ? { ...object, groupId } : object),
      groupSelection: [],
      selectedId: ids[0],
      selectedSectionId: null,
    }));
  },
  ungroupObjectGroup: (id) => {
    const state = get();
    const groupId = state.objects.find((object) => object.id === id)?.groupId;
    if (!groupId) return;
    state.snapshot();
    set((current) => ({
      objects: current.objects.map((object) => object.groupId === groupId ? { ...object, groupId: null } : object),
      groupSelection: [],
    }));
  },
  toggleObjectGroupLock: (id) => {
    const state = get();
    const object = state.objects.find((candidate) => candidate.id === id);
    if (!object?.groupId) return;
    const members = state.objects.filter((candidate) => candidate.groupId === object.groupId);
    const shouldLock = !members.every((candidate) => candidate.locked);
    state.snapshot();
    set((current) => ({
      objects: current.objects.map((candidate) => candidate.groupId === object.groupId ? { ...candidate, locked: shouldLock } : candidate),
    }));
  },

  // --- Objects -------------------------------------------------------

  snapVal: (v) => (get().snap ? Math.round(v / 8) * 8 : Math.round(v)),

  addObject: (kind, x, y, label) => {
    const s = get();
    const obj = makeObject(kind, x, y, s.nextId, label);
    set({ objects: s.objects.concat([obj]), nextId: s.nextId + 1 });
    return obj;
  },

  updateObject: (id, patch) => {
    set((s) => ({ objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  },

  moveObjectOrGroup: (id, x, y) => {
    set((state) => {
      const anchor = state.objects.find((object) => object.id === id);
      if (!anchor) return {};
      const dx = x - anchor.x;
      const dy = y - anchor.y;
      return {
        objects: state.objects.map((object) => object.id === id || (anchor.groupId && object.groupId === anchor.groupId)
          ? { ...object, x: object.x + dx, y: object.y + dy }
          : object),
      };
    });
  },

  removeObject: (id) => {
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      groupSelection: s.groupSelection.filter((candidate) => candidate !== id),
    }));
  },

  toggleObjectVisibility: (id) => {
    get().snapshot();
    set((state) => ({ objects: state.objects.map((object) => object.id === id ? { ...object, hidden: !object.hidden } : object) }));
  },

  toggleObjectLock: (id) => {
    get().snapshot();
    set((state) => ({ objects: state.objects.map((object) => object.id === id ? { ...object, locked: !object.locked } : object) }));
  },

  moveObjectLayer: (id, direction) => {
    const state = get();
    const object = state.objects.find((candidate) => candidate.id === id);
    if (!object) return;
    const section = state.sections.find((candidate) => inBand(object, candidate));
    const indices = state.objects.flatMap((candidate, index) => (!section || inBand(candidate, section)) ? [index] : []);
    const currentIndex = state.objects.findIndex((candidate) => candidate.id === id);
    const position = indices.indexOf(currentIndex);
    const targetPosition = position + direction;
    if (position < 0 || targetPosition < 0 || targetPosition >= indices.length) return;
    state.snapshot();
    set((current) => {
      const objects = [...current.objects];
      const targetIndex = indices[targetPosition];
      [objects[currentIndex], objects[targetIndex]] = [objects[targetIndex], objects[currentIndex]];
      return { objects };
    });
  },

  setAllButtonSize: (width, height) => {
    const state = get();
    const w = Math.max(16, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const resize = (objects: Obj[]) => objects.map((object) => object.kind === 'button' || object.kind === 'reminder'
      ? { ...object, w, h }
      : object);
    state.snapshot();
    const activeObjects = resize(state.objects);
    set((current) => ({
      objects: activeObjects,
      pages: current.pages.map((page) => page.id === current.activePageId
        ? { ...page, objects: activeObjects }
        : { ...page, objects: resize(page.objects) }),
    }));
  },

  duplicateSelected: () => {
    const s = get();
    const o = s.objects.find((x) => x.id === s.selectedId);
    if (!o) return;
    s.snapshot();
    set((st) => {
      const copy: Obj = { ...o, x: o.x + 24, y: o.y + 24, groupId: null, id: `${o.kind}-${String(st.nextId).padStart(2, '0')}` };
      return { objects: st.objects.concat([copy]), nextId: st.nextId + 1, selectedId: copy.id };
    });
  },

  nudge: (dx, dy) => {
    const s = get();
    if (!s.selectedId) return;
    const o = s.objects.find((x) => x.id === s.selectedId);
    if (o) s.moveObjectOrGroup(o.id, o.x + dx, o.y + dy);
  },

  copySelected: () => {
    const s = get();
    const o = s.objects.find((x) => x.id === s.selectedId);
    if (o) set({ clipboard: o });
  },

  pasteClipboard: () => {
    const s = get();
    if (!s.clipboard) return;
    s.snapshot();
    set((st) => {
      const c = st.clipboard!;
      const copy: Obj = { ...c, x: c.x + 24, y: c.y + 24, groupId: null, id: `${c.kind}-${String(st.nextId).padStart(2, '0')}` };
      return { objects: st.objects.concat([copy]), nextId: st.nextId + 1, selectedId: copy.id };
    });
  },

  copySelectedStyleToSection: () => {
    const s = get();
    const source = s.objects.find((object) => object.id === s.selectedId);
    if (!source) return;
    const section = s.sections.find((candidate) => inBand(source, candidate));
    if (!section) return;

    const targets = s.objects.filter((object) => object.id !== source.id && inBand(object, section));
    if (!targets.length) return;

    get().snapshot();
    const style = {
      size: source.size,
      color: source.color,
      bg: source.bg,
      radius: source.radius,
      pad: source.pad,
      bw: source.bw,
      bc: source.bc,
      opacity: source.opacity,
      align: source.align ?? 'left',
      vAlign: source.vAlign ?? 'top',
    };
    const targetIds = new Set(targets.map((object) => object.id));
    set((current) => ({
      objects: current.objects.map((object) => targetIds.has(object.id) ? { ...object, ...style } : object),
    }));
  },

  saveSelectedToLibrary: (name) => {
    const state = get();
    const object = state.objects.find((item) => item.id === state.selectedId);
    if (!object) return;
    const suggested = object.text.trim().split('\n')[0].slice(0, 34) || object.label || object.kind;
    const item: LibraryItem = {
      id: `library-${nanoid(10)}`,
      name: name?.trim() || suggested,
      object: { ...object, groupId: null },
      createdAt: Date.now(),
    };
    set((current) => ({ library: [item, ...current.library] }));
  },

  insertLibraryItem: (id) => {
    const state = get();
    const item = state.library.find((entry) => entry.id === id);
    if (!item) return;
    get().snapshot();
    const section = state.sections.find((entry) => entry.id === state.selectedSectionId) ?? state.sections[0];
    const object = {
      ...item.object,
      id: `${item.object.kind}-${String(state.nextId).padStart(2, '0')}`,
      x: section ? Math.max(24, Math.min(item.object.x, 900 - item.object.w - 24)) : 60,
      y: section ? section.y + 40 : 60,
      groupId: null,
    };
    set((current) => ({ objects: [...current.objects, object], selectedId: object.id, selectedSectionId: null, nextId: current.nextId + 1 }));
  },

  removeLibraryItem: (id) => set((state) => ({ library: state.library.filter((item) => item.id !== id) })),

  // --- Inline editing ------------------------------------------------

  setEditingId: (id) => set({
    editingId: id,
    ...(id ? {
      selectedId: id,
      selectedSectionId: null,
      rightRailOpen: true,
      rightTab: 'inspect' as const,
    } : {}),
  }),

  // --- Undo/redo ---------------------------------------------------------

  snapshot: () => {
    const s = get();
    const entry: Snapshot = { objects: s.objects, sections: s.sections };
    set({ past: s.past.concat([entry]).slice(-PAST_CAP), future: [] });
  },

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({
      past: s.past.slice(0, -1),
      future: [{ objects: s.objects, sections: s.sections }, ...s.future],
      objects: prev.objects,
      sections: prev.sections,
    });
  },

  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({
      past: s.past.concat([{ objects: s.objects, sections: s.sections }]),
      future: s.future.slice(1),
      objects: next.objects,
      sections: next.sections,
    });
  },

  // --- Section ops --------------------------------------------------------
  // Ported from reference/Tabula v2.dc.html — membership is o.y in [s.y, s.y+s.h).

  addSection: () => {
    get().snapshot();
    set((s) => {
      const y = s.sections.reduce((m, sec) => Math.max(m, sec.y + sec.h), 0);
      return {
        sections: s.sections.concat([{ id: sid(), name: 'Section', y, h: 420, bg: 'transparent' }]),
        selectedSectionId: null,
      };
    });
  },

  duplicateSection: (id) => {
    get().snapshot();
    set((s) => {
      const sec = s.sections.find((x) => x.id === id);
      if (!sec) return {};
      const at = sec.y + sec.h;
      const objects = s.objects.map((o) => (o.y >= at ? { ...o, y: o.y + sec.h } : o));
      const sections = s.sections.map((x) => (x.y >= at ? { ...x, y: x.y + sec.h } : x));
      const clones = s.objects.filter((o) => inBand(o, sec)).map((o) => ({
        ...o, id: nanoid(8), y: o.y + sec.h, groupId: null,
      }));
      const idx = sections.findIndex((x) => x.id === id);
      const nextSections = sections.slice();
      nextSections.splice(idx + 1, 0, { ...sec, id: sid(), y: at, name: sec.name + ' copy' });
      return { objects: objects.concat(clones), sections: nextSections };
    });
  },

  deleteSection: (id) => {
    if (get().sections.length < 2) return;
    get().snapshot();
    set((s) => {
      const sec = s.sections.find((x) => x.id === id);
      if (!sec) return {};
      const kept = s.objects.filter((o) => !inBand(o, sec));
      const below = sec.y + sec.h;
      return {
        objects: kept.map((o) => (o.y >= below ? { ...o, y: o.y - sec.h } : o)),
        sections: s.sections
          .filter((x) => x.id !== id)
          .map((x) => (x.y >= below ? { ...x, y: x.y - sec.h } : x)),
        selectedSectionId: null,
        selectedId: null,
      };
    });
  },

  moveSection: (id, dir) => {
    get().snapshot();
    set((s) => {
      const i = s.sections.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.sections.length) return {};
      const a = s.sections[i];
      const b = s.sections[j];
      const da = dir > 0 ? b.h : -b.h;
      const db = dir > 0 ? -a.h : a.h;
      const objects = s.objects.map((o) => {
        if (inBand(o, a)) return { ...o, y: o.y + da };
        if (inBand(o, b)) return { ...o, y: o.y + db };
        return o;
      });
      const sections = s.sections.slice();
      sections[i] = { ...b, y: dir > 0 ? a.y : a.y + db };
      sections[j] = { ...a, y: dir > 0 ? a.y + da : b.y };
      sections.sort((p, q) => p.y - q.y);
      return { objects, sections };
    });
  },

  setSectionHeight: (id, h) => {
    const next = Math.max(80, h);
    set((s) => {
      const sec = s.sections.find((x) => x.id === id);
      if (!sec) return {};
      const delta = next - sec.h;
      const below = sec.y + sec.h;
      return {
        objects: s.objects.map((o) => (o.y >= below ? { ...o, y: o.y + delta } : o)),
        sections: s.sections.map((x) =>
          x.id === id ? { ...x, h: next } : x.y >= below ? { ...x, y: x.y + delta } : x
        ),
      };
    });
  },

  renameSection: (id, name) => {
    set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, name } : x)) }));
  },

  setSectionBg: (id, bg) => {
    set((s) => ({ sections: s.sections.map((x) => (x.id === id ? { ...x, bg } : x)) }));
  },

  shiftSectionContent: (id, dy) => {
    if (!dy) return;
    get().snapshot();
    set((state) => {
      const section = state.sections.find((item) => item.id === id);
      if (!section) return {};
      const below = section.y + section.h;
      const nextHeight = Math.max(80, section.h + dy);
      const applied = nextHeight - section.h;
      return {
        objects: state.objects.map((object) => inBand(object, section) || object.y >= below
          ? { ...object, y: object.y + applied }
          : object),
        sections: state.sections.map((item) => item.id === id
          ? { ...item, h: nextHeight }
          : item.y >= below
            ? { ...item, y: item.y + applied }
            : item),
      };
    });
  },

  applyCloudHero: (id) => {
    const state = get();
    const section = state.sections.find((item) => item.id === id);
    if (!section) return;
    get().snapshot();
    const previousHeroObjects = state.objects.filter((object) => inBand(object, section));
    const savedHeroItems: LibraryItem[] = previousHeroObjects.map((object, index) => ({
      id: `library-${nanoid(10)}`,
      name: `Previous Hero · ${object.text.trim().split('\n')[0].slice(0, 28) || object.label || object.kind}`,
      object: { ...object },
      createdAt: Date.now() + index,
    }));
    const nextHeight = 620;
    const delta = nextHeight - section.h;
    let nextId = state.nextId;
    const makeHeroObject = (kind: Kind, x: number, y: number, patch: Partial<Obj>) => ({
      ...objSpec(kind, x, y),
      ...patch,
      id: `${kind}-${String(nextId++).padStart(2, '0')}`,
    });
    const y = section.y;
    const heroObjects: Obj[] = [
      makeHeroObject('eyebrow', 48, y + 60, { text: '—  Data platform', w: 300, h: 24, size: 12, color: '#4a4644' }),
      makeHeroObject('heading', 48, y + 104, { text: 'Where Your Data Drives Performance, Powered by Jaren.', w: 470, h: 174, size: 48, color: '#201e1d' }),
      makeHeroObject('text', 48, y + 300, { text: 'One governed surface for every dataset, model and dashboard your teams depend on.', w: 460, h: 62, size: 18, color: '#4a4644' }),
      makeHeroObject('button', 48, y + 390, { text: 'Get started', href: '#get-started', w: 140, h: 46, radius: 6, bg: '#1183f0', color: '#ffffff' }),
      makeHeroObject('button', 204, y + 390, { text: 'Talk to us', href: '#contact', w: 130, h: 46, radius: 6, bg: 'transparent', color: '#201e1d', bw: 1, bc: '#c9c5c1' }),
      makeHeroObject('divider', 48, y + 464, { w: 410, h: 2, bg: '#c9c5c1' }),
      makeHeroObject('stat', 48, y + 490, { text: '1.4B', w: 150, h: 40, size: 26, color: '#201e1d' }),
      makeHeroObject('eyebrow', 48, y + 538, { text: 'rows queried daily', w: 170, h: 20, size: 11, color: '#4a4644' }),
      makeHeroObject('stat', 250, y + 490, { text: '99.99%', w: 150, h: 40, size: 26, color: '#201e1d' }),
      makeHeroObject('eyebrow', 250, y + 538, { text: 'platform uptime', w: 170, h: 20, size: 11, color: '#4a4644' }),
      makeHeroObject('cloud', 550, y + 54, { w: 310, h: 500, color: '#1183f0', label: 'Interactive cloud network' }),
    ];
    const below = section.y + section.h;

    set((current) => ({
      library: [...savedHeroItems, ...current.library],
      objects: [
        ...current.objects.filter((object) => !inBand(object, section)).map((object) => object.y >= below ? { ...object, y: object.y + delta } : object),
        ...heroObjects,
      ],
      sections: current.sections.map((item) => item.id === id
        ? { ...item, name: 'Cloud Hero', h: nextHeight, bg: '#f3f2f2' }
        : item.y >= below
          ? { ...item, y: item.y + delta }
          : item),
      nextId,
      selectedId: null,
      selectedSectionId: id,
    }));
  },

  restoreServiceContainers: (id) => {
    const state = get();
    const section = state.sections.find((candidate) => candidate.id === id);
    if (!section) return;
    const sectionObjects = state.objects.filter((object) => inBand(object, section));
    const headings = sectionObjects.filter((object) =>
      (object.kind === 'heading' || object.kind === 'subhead') &&
      ['Data Management', 'Human Resources', 'Managed Payroll Services'].includes(object.text.trim())
    );
    const dataHeading = headings.find((object) => object.text.trim() === 'Data Management');
    const targets = headings.filter((object) => ['Human Resources', 'Managed Payroll Services'].includes(object.text.trim()));
    const containers = sectionObjects.filter((object) => object.kind === 'card' || object.kind === 'box');
    const contains = (container: Obj, heading: Obj) =>
      container.x <= heading.x && container.y <= heading.y &&
      container.x + container.w >= heading.x + heading.w && container.y + container.h >= heading.y + heading.h;
    const reference = dataHeading ? containers.find((container) => contains(container, dataHeading)) : containers[0];
    if (!reference || !dataHeading) return;
    const missing = targets.filter((heading) => !containers.some((container) => contains(container, heading)));
    if (!missing.length) return;

    state.snapshot();
    set((current) => {
      let nextId = current.nextId;
      const restored = missing.map((heading) => ({
        ...reference,
        id: `${reference.kind}-${String(nextId++).padStart(2, '0')}`,
        x: heading.x - (dataHeading.x - reference.x),
        y: heading.y - (dataHeading.y - reference.y),
        text: '',
        label: '',
      }));
      return { objects: [...restored, ...current.objects], nextId };
    });
  },

  addServiceIcons: (id) => {
    const state = get();
    const section = state.sections.find((candidate) => candidate.id === id);
    if (!section) return;
    const sectionObjects = state.objects.filter((object) => inBand(object, section));
    const assignments = [
      ['Data Management', 'database'],
      ['Project Management', 'workflow'],
      ['Human Resources', 'users'],
      ['Managed Payroll Services', 'calculator'],
    ] as const;
    const headings = assignments.flatMap(([title, iconName]) => {
      const heading = state.objects.find((object) => inBand(object, section) && object.text.trim() === title);
      return heading ? [{ heading, title, iconName }] : [];
    });
    const missing = headings.filter(({ title }) => !state.objects.some((object) => object.kind === 'icon' && object.label === `Service icon: ${title}`));
    const serviceContainers = sectionObjects.filter((object) =>
      (object.kind === 'card' || object.kind === 'box') &&
      headings.some(({ heading }) =>
        object.x <= heading.x && object.y <= heading.y &&
        object.x + object.w >= heading.x + heading.w && object.y + object.h >= heading.y + heading.h
      )
    );
    const serviceBodies = sectionObjects.filter((object) => object.kind === 'text' && headings.some(({ heading }) =>
      object.x >= heading.x - 24 && object.x <= heading.x + 24 && object.y > heading.y && object.y < heading.y + 90
    ));

    state.snapshot();
    set((current) => {
      let nextId = current.nextId;
      const icons = missing.map(({ heading, title, iconName }) => ({
        ...makeObject('icon', heading.x - 10, heading.y - 3, nextId++),
        w: 30,
        h: 30,
        color: '#1183f0',
        iconName,
        label: `Service icon: ${title}`,
      }));
      const containerIds = new Set(serviceContainers.map((object) => object.id));
      const bodyIds = new Set(serviceBodies.map((object) => object.id));
      const formatted = current.objects.map((object) => {
        if (containerIds.has(object.id)) return { ...object, w: 390, h: 240, radius: 4 };
        if (!bodyIds.has(object.id)) return object;
        const text = object.text.split('\n').map((line) => line.trim() ? `• ${line.replace(/^[•-]\s*/, '')}` : line).join('\n');
        return { ...object, text, textColors: [] };
      });
      return { objects: formatted.concat(icons), nextId };
    });
  },

  // --- UI ---------------------------------------------------------------

  setLeftTab: (tab) => set({ leftTab: tab }),
  setRightTab: (tab) => set({ rightTab: tab }),
  toggleRightRail: () => set((s) => ({ rightRailOpen: !s.rightRailOpen })),
  setDevice: (device) => set({ device }),
  togglePreview: () => set((s) => ({
    preview: !s.preview,
    selectedId: null,
    selectedSectionId: null,
    editingId: null,
  })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
  startNewProject: () => {
    const page = { ...blankPage('Home', null, 'draft'), home: true, slug: '' };
    const now = Date.now();
    set({
      projectOpen: true,
      hasRecentProject: true,
      projectId: makeProjectId(),
      projectNumber: nextProjectNumber(),
      projectName: 'Untitled Project',
      projectCreatedAt: now,
      pages: [page],
      folders: [],
      activePageId: page.id,
      objects: [],
      sections: page.sections,
      selectedId: null,
      selectedSectionId: null,
      editingId: null,
      groupSelection: [],
      past: [],
      future: [],
      preview: false,
      savedAt: null,
      nextId: 1,
    });
  },
  continueRecentProject: () => set({ projectOpen: true, preview: false }),
  returnToStart: () => {
    get().syncActivePage();
    set({ projectOpen: false, preview: false, selectedId: null, selectedSectionId: null, groupSelection: [] });
  },
}));

type ProjectDocument = {
  format: 'tabula-project';
  version: 1;
  project: { id: string; number: number; name: string; createdAt: number; updatedAt: number };
  data: {
    pages: Page[];
    folders: Folder[];
    activePageId: string | null;
    theme: State['theme'];
    nextId: number;
    library: LibraryItem[];
    auditEvents: AuditEvent[];
  };
};

function projectDocument(state: State): ProjectDocument {
  const updatedAt = Date.now();
  const pages = state.pages.map((page) => page.id === state.activePageId
    ? { ...page, objects: state.objects, sections: state.sections }
    : page);
  return {
    format: 'tabula-project',
    version: 1,
    project: {
      id: state.projectId,
      number: state.projectNumber,
      name: state.projectName,
      createdAt: state.projectCreatedAt,
      updatedAt,
    },
    data: { pages, folders: state.folders, activePageId: state.activePageId, theme: state.theme, nextId: state.nextId, library: state.library, auditEvents: state.auditEvents },
  };
}

export function prepareProjectDownload(anchor: HTMLAnchorElement) {
  const state = useTabulaStore.getState();
  const documentData = projectDocument(state);
  const safeName = state.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `project-${state.projectNumber}`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json' }));
  anchor.href = url;
  anchor.download = `${safeName}.tabula`;
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  flushPendingSave();
}

export function openProjectFile(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const raw = value as Partial<ProjectDocument>;
  if (raw.format !== 'tabula-project' || raw.version !== 1 || !raw.project || !raw.data || !Array.isArray(raw.data.pages) || !raw.data.pages.length) return false;

  const pages = raw.data.pages.map(migratePage);
  const activePageId = pages.some((page) => page.id === raw.data!.activePageId)
    ? raw.data.activePageId!
    : pages.find((page) => page.home)?.id ?? pages[0].id;
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const project = raw.project;
  rememberProjectNumber(Number(project.number) || 0);
  const highestObjectNumber = pages.flatMap((page) => page.objects).reduce((max, object) => Math.max(max, Number(object.id.match(/(\d+)$/)?.[1] ?? 0)), 0);

  useTabulaStore.setState({
    projectOpen: true,
    hasRecentProject: true,
    projectId: typeof project.id === 'string' && project.id ? project.id : makeProjectId(),
    projectNumber: Number(project.number) || nextProjectNumber(),
    projectName: typeof project.name === 'string' && project.name ? project.name : 'Untitled Project',
    projectCreatedAt: Number(project.createdAt) || Date.now(),
    pages,
    folders: Array.isArray(raw.data.folders) ? raw.data.folders : [],
    activePageId,
    objects: activePage.objects,
    sections: activePage.sections,
    theme: raw.data.theme ?? DEFAULT_THEME,
    nextId: Math.max(Number(raw.data.nextId) || 1, highestObjectNumber + 1),
    library: Array.isArray(raw.data.library) ? raw.data.library : [],
    auditEvents: Array.isArray(raw.data.auditEvents) ? raw.data.auditEvents : [],
    selectedId: null,
    selectedSectionId: null,
    editingId: null,
    groupSelection: [],
    past: [],
    future: [],
    preview: false,
    savedAt: Number(project.updatedAt) || null,
  });
  return true;
}

const restoredState = loadSavedState(seededPages, seededFolders);
if (restoredState) useTabulaStore.setState(restoredState);

let lastHomeChromeSignature = homeChromeSignature(useTabulaStore.getState());
const unsubscribeSharedChrome = useTabulaStore.subscribe((state) => {
  const signature = homeChromeSignature(state);
  if (!signature || signature === lastHomeChromeSignature) return;
  lastHomeChromeSignature = signature;
  const home = activeHomePage(state);
  if (!home) return;
  const pages = state.pages.map((page) => applyHomeChrome(page, home));
  const active = pages.find((page) => page.id === state.activePageId);
  useTabulaStore.setState({
    pages,
    ...(active && active.id !== home.id ? { objects: active.objects, sections: active.sections } : {}),
  });
});

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSave = false;

// UI selection and status changes must not postpone document saves.
const persistedKeys = [
  'projectId', 'projectNumber', 'projectName', 'projectCreatedAt',
  'pages', 'objects', 'sections', 'folders', 'activePageId',
  'leftTab', 'rightTab', 'rightRailOpen', 'device', 'snap',
  'drawerOpen', 'files', 'activeFile', 'theme', 'library', 'auditEvents', 'nextId',
] as const satisfies readonly (keyof State)[];

function saveCurrentState(): void {
  saveTimer = undefined;
  const state = useTabulaStore.getState();
  const savedAt = Date.now();
  if (!persistState({ ...state, savedAt })) {
    // Retain dirty state for retry, including on page hide.
    useTabulaStore.setState({ saveStatus: 'error' });
    return;
  }
  pendingSave = false;
  useTabulaStore.setState({ savedAt, saveStatus: 'saved', hasRecentProject: true });
}

export function flushPendingSave(): void {
  if (!pendingSave) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveCurrentState();
}

const unsubscribeAutosave = useTabulaStore.subscribe((state, previous) => {
  if (!persistedKeys.some((key) => state[key] !== previous[key])) return;
  if (!state.projectOpen && !state.hasRecentProject) return;
  pendingSave = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentState, 400);
  if (state.saveStatus !== 'pending') useTabulaStore.setState({ saveStatus: 'pending' });
});

const transactionKeys = ['projectName', 'pages', 'objects', 'sections', 'folders', 'theme', 'library'] as const satisfies readonly (keyof State)[];
let transactionTimer: ReturnType<typeof setTimeout> | undefined;
let transactionStart: State | undefined;

function eventId(): string {
  const date = new Date();
  const stamp = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : nanoid(8).toUpperCase();
  return `EVT-${stamp}-${token}`;
}

function describeTransaction(before: State, after: State): Pick<AuditEvent, 'kind' | 'summary' | 'details'> {
  const details: string[] = [];
  let majorResize = false;
  const oldObjects = new Map(before.objects.map((object) => [object.id, object]));
  for (const object of after.objects) {
    const old = oldObjects.get(object.id);
    if (!old || (old.w === object.w && old.h === object.h)) continue;
    if (['image', 'logo', 'nav', 'footer'].includes(object.kind)) {
      majorResize = true;
      details.push(`${object.kind} ${object.id}: ${old.w}×${old.h} → ${object.w}×${object.h}`);
    }
  }

  const oldSections = new Map(before.sections.map((section) => [section.id, section]));
  for (const section of after.sections) {
    const old = oldSections.get(section.id);
    if (!old || old.h === section.h || !/header|footer/i.test(section.name)) continue;
    majorResize = true;
    details.push(`${section.name}: ${old.h}px → ${section.h}px high`);
  }

  for (const page of after.pages) {
    const old = before.pages.find((candidate) => candidate.id === page.id);
    if (old && old.status !== page.status) details.push(`${page.name}: ${old.status} → ${page.status}`);
  }

  if (!details.length) {
    const changed = transactionKeys.filter((key) => before[key] !== after[key]);
    details.push(`Changed ${changed.join(', ') || 'project content'}`);
  }

  return {
    kind: majorResize ? 'major-resize' : 'transaction',
    summary: majorResize ? 'Major site element resized' : 'Project transaction',
    details,
  };
}

const unsubscribeEvents = useTabulaStore.subscribe((state, previous) => {
  if (!transactionKeys.some((key) => state[key] !== previous[key])) return;
  if (!state.projectOpen && !state.hasRecentProject) return;
  transactionStart ??= previous;
  if (transactionTimer) clearTimeout(transactionTimer);
  transactionTimer = setTimeout(() => {
    const before = transactionStart;
    transactionStart = undefined;
    transactionTimer = undefined;
    if (!before) return;
    const current = useTabulaStore.getState();
    const description = describeTransaction(before, current);
    const event: AuditEvent = {
      id: eventId(),
      createdAt: Date.now(),
      projectId: current.projectId,
      pageId: current.activePageId,
      ...description,
    };
    useTabulaStore.setState({ auditEvents: [event, ...current.auditEvents].slice(0, 500) });
  }, 500);
});

const handlePageHide = () => flushPendingSave();
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') flushPendingSave();
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', handlePageHide);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    flushPendingSave();
    unsubscribeSharedChrome();
    unsubscribeAutosave();
    unsubscribeEvents();
    if (transactionTimer) clearTimeout(transactionTimer);
    if (saveTimer) clearTimeout(saveTimer);
    window.removeEventListener('pagehide', handlePageHide);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
}
