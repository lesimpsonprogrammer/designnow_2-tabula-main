import type { Obj, Page, State } from '../types';

export type CompletionCategory = { label: string; percent: number; weight: number };
export type CompletionEstimate = { complete: number; incomplete: number; categories: CompletionCategory[] };

const PLACEHOLDER_TEXT = /^(untitled|new item|get started|a headline that|supporting copy|full name|image|video)$/i;
const NON_CONTENT_KINDS = new Set(['box', 'card', 'divider', 'spacer', 'nav']);

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function meaningfulText(value: string) {
  const clean = value.trim();
  return Boolean(clean) && !PLACEHOLDER_TEXT.test(clean);
}

function pageContentScore(page: Page) {
  if (!page.objects.length) return 0;
  const content = page.objects.filter((object) => !NON_CONTENT_KINDS.has(object.kind));
  if (!content.length) return 20;
  const complete = content.filter((object) => {
    if (object.kind === 'image' || object.kind === 'logo' || object.kind === 'video' || object.kind === 'cloud') return meaningfulText(object.label);
    return meaningfulText(object.text);
  }).length;
  return Math.round(30 + (complete / content.length) * 70);
}

function configuredLinkScore(objects: Obj[]) {
  const links: boolean[] = [];
  for (const object of objects) {
    if (object.kind === 'button') links.push(Boolean(object.href && object.href !== '#'));
    if (object.kind === 'nav') {
      if (!object.navLinks.length) links.push(false);
      else object.navLinks.forEach((link) => {
        links.push(Boolean(link.label.trim() && link.href && link.href !== '#'));
        link.children?.forEach((child) => links.push(Boolean(child.label.trim() && child.href && child.href !== '#')));
      });
    }
  }
  return links.length ? Math.round(average(links.map((ready) => ready ? 100 : 0))) : 0;
}

export function estimateCompletion(state: Pick<State, 'projectName' | 'pages' | 'activePageId' | 'objects' | 'sections' | 'theme'>): CompletionEstimate {
  const pages = state.pages.map((page) => page.id === state.activePageId
    ? { ...page, objects: state.objects, sections: state.sections }
    : page);
  const allObjects = pages.flatMap((page) => page.objects);
  const structureChecks = [
    Boolean(state.projectName.trim() && !/^untitled project$/i.test(state.projectName.trim())),
    pages.length > 0,
    pages.every((page) => Boolean(page.name.trim()) && !/^untitled$/i.test(page.name.trim())),
    pages.every((page) => page.sections.length > 0),
  ];
  const validStyleObjects = allObjects.filter((object) => object.w >= 16 && object.h >= 1 && object.size >= 1 && object.opacity >= 10).length;
  const designPercent = Math.round((state.theme.paper && state.theme.ink && state.theme.head && state.theme.body ? 50 : 0) + (allObjects.length ? (validStyleObjects / allObjects.length) * 50 : 0));

  const categories: CompletionCategory[] = [
    { label: 'Structure', percent: Math.round(average(structureChecks.map((ready) => ready ? 100 : 0))), weight: 20 },
    { label: 'Content', percent: Math.round(average(pages.map(pageContentScore))), weight: 35 },
    { label: 'Links & navigation', percent: configuredLinkScore(allObjects), weight: 20 },
    { label: 'Design', percent: designPercent, weight: 10 },
    { label: 'Ready to publish', percent: Math.round(average(pages.map((page) => page.status === 'published' ? 100 : 0))), weight: 15 },
  ];
  const complete = Math.max(0, Math.min(100, Math.round(categories.reduce((sum, category) => sum + category.percent * category.weight / 100, 0))));
  return { complete, incomplete: 100 - complete, categories };
}
