import type { Kind, Obj, Section } from '../types';
import { objSpec } from './objSpec';

type TemplateRow = [
  kind: Kind,
  x: number,
  y: number,
  label?: string,
  patch?: Partial<Omit<Obj, 'id'>>,
];

const MOMENTUM_ROWS: TemplateRow[] = [
  ['nav', 0, 0, '', { text: 'Momentum        Home    About    Compliance    Resources    Contact us', w: 900, h: 68, size: 13, bg: 'transparent', color: '#ffffff' }],
  ['button', 762, 16, '', { text: 'Contact us', w: 110, h: 36, bg: 'transparent', color: '#ffffff', radius: 4 }],
  ['heading', 48, 118, '', { text: 'Four Disciplines.\nOne Team behind your Data and your People.', w: 620, h: 150, size: 42, color: '#ffffff' }],
  ['text', 48, 296, '', { text: 'Momentum Data Solutions prepares organizations for what comes next — clean data, sound project delivery, and the HR and payroll expertise to carry it through.', w: 560, h: 76, size: 15, color: '#d6dbe6' }],
  ['button', 48, 392, '', { text: 'Contact Sales', w: 168, h: 46, radius: 4, bg: '#ffffff', color: '#202a50' }],

  ['box', 48, 522, '', { w: 390, h: 240, radius: 4, bg: '#d6dbe6' }],
  ['heading', 72, 546, '', { text: 'Data Management', size: 20, w: 340, h: 30 }],
  ['text', 72, 588, '', { text: 'Data Extraction — pulling clean source data from legacy and current systems.\nData Transformation — shaping and standardizing data for its destination.\nData Loading — structured, validated loads into the new platform.\nHCM and ERP Platform Support.', w: 340, h: 150, size: 13 }],

  ['box', 462, 522, '', { w: 390, h: 240, radius: 4, bg: '#d6dbe6' }],
  ['heading', 486, 546, '', { text: 'Project Management', size: 20, w: 340, h: 30 }],
  ['text', 486, 588, '', { text: 'Implementation Support — hands-on delivery from kickoff to go-live.\nEmployer Responsibility — compliance and accountability throughout.\nEmployer Due Diligence — payroll records, tax accounts, obligations.\nData Analysis — turning project data into decisions.', w: 340, h: 150, size: 13 }],

  ['box', 48, 786, '', { w: 390, h: 240, radius: 4, bg: '#d6dbe6' }],
  ['heading', 72, 810, '', { text: 'Human Resources', size: 20, w: 340, h: 30 }],
  ['text', 72, 852, '', { text: 'Human Resources Consulting — strategic HR guidance for growing teams.\nCompliance — policies, documentation, and regulatory requirements.\nHuman Resources on Demand — flexible HR support when you need it.\nSHRM-Certified HR Professionals.', w: 340, h: 150, size: 13 }],

  ['box', 462, 786, '', { w: 390, h: 240, radius: 4, bg: '#d6dbe6' }],
  ['heading', 486, 810, '', { text: 'Managed Payroll Services', size: 20, w: 340, h: 30 }],
  ['text', 486, 852, '', { text: 'Payroll Processing — accurate, on-time, fully managed payroll.\nQuarterly Tax Filings — accurate preparation and timely filing.\nState Unemployment Tax Research Service.\nNew Payroll Set-up — complete configuration for a compliant launch.', w: 340, h: 150, size: 13 }],

  ['divider', 48, 1074, '', { w: 804 }],
  ['heading', 48, 1110, '', { text: 'New: the Momentum Executive Brief', size: 26, w: 520, h: 40 }],
  ['text', 48, 1162, '', { text: 'Why Clean Data Comes First — lessons from an HRIS/HCM/ERP implementation that almost went wrong, and the readiness framework we use to keep it from happening to you.', w: 520, h: 80, size: 14 }],
  ['button', 48, 1258, '', { text: 'Read the brief', w: 168, h: 44, radius: 4, bg: '#0e1cdf', color: '#ffffff' }],
  ['image', 600, 1110, 'executive brief cover', { w: 252, h: 192, radius: 4 }],

  ['heading', 48, 1404, '', { text: 'One platform for every spreadsheet, HCM, and ERP connection.', w: 600, h: 90, size: 30 }],
  ['text', 48, 1510, '', { text: 'Connectors, ETL pipelines, webhooks, and a REST API — built for data extraction, HR consulting, and managed payroll teams who move data for a living.', w: 560, h: 76, size: 15 }],
  ['button', 48, 1606, '', { text: 'Sign in to Service Manager', w: 260, h: 46, radius: 4, bg: '#0e1cdf', color: '#ffffff' }],
  ['image', 620, 1404, 'platform dashboard', { w: 232, h: 248, radius: 4 }],

  ['heading', 48, 1810, '', { text: 'Sign up with your email address to receive news and updates.', w: 560, h: 76, size: 24 }],
  ['form', 48, 1906, '', { text: 'you@company.com', w: 420, h: 52, radius: 4 }],
  ['button', 484, 1906, '', { text: 'Contact us', w: 150, h: 52, radius: 4, bg: '#0e1cdf', color: '#ffffff' }],

  ['divider', 48, 2010, '', { w: 804 }],
  ['text', 48, 2040, '', { text: 'Momentum Data Solutions\n\nClean data, sound project delivery, and the HR and payroll expertise to carry it through.', w: 380, h: 100, size: 13 }],
  ['text', 480, 2040, '', { text: 'Home    About    Services    Resources\nRelentless Commitment    Blog    Contact\n\n© Momentum Data Solutions. All rights reserved.', w: 372, h: 100, size: 13 }],
];

const MOMENTUM_SECTIONS: Array<Omit<Section, 'id'>> = [
  { name: 'Header', y: 0, h: 68, bg: '#1e5faf' },
  { name: 'Hero', y: 68, h: 402, bg: '#202a50' },
  { name: 'Four Disciplines', y: 470, h: 604, bg: 'transparent' },
  { name: 'Executive Brief', y: 1074, h: 286, bg: 'transparent' },
  { name: 'Platform', y: 1360, h: 400, bg: '#d6dbe6' },
  { name: 'Newsletter', y: 1760, h: 240, bg: 'transparent' },
];

const ABOUT_ROWS: TemplateRow[] = [
  ['nav', 0, 0, '', { text: 'Momentum        Home    About    Compliance    Resources    Contact us', w: 900, h: 68, size: 13, bg: 'transparent', color: '#ffffff' }],
  ['button', 762, 16, '', { text: 'Contact us', w: 110, h: 36, bg: 'transparent', color: '#ffffff', radius: 4 }],

  ['eyebrow', 48, 126, '', { text: 'About Momentum', color: '#d6dbe6', w: 300 }],
  ['heading', 48, 166, '', { text: 'Sometimes big things come in small packages.', color: '#ffffff', size: 42, w: 700, h: 112 }],
  ['subhead', 48, 302, '', { text: 'We’re talking about big data.', color: '#d6dbe6', size: 24, w: 520, h: 42 }],
  ['button', 48, 382, '', { text: 'Book your consultation', w: 210, h: 46, radius: 4, bg: '#ffffff', color: '#202a50' }],

  ['eyebrow', 48, 548, '', { text: 'Who we are', color: '#1e5faf', w: 220 }],
  ['heading', 48, 584, '', { text: 'Data work built around the way your business operates.', size: 30, w: 650, h: 78 }],
  ['text', 48, 684, '', { text: 'Momentum Data Solutions helps growing organizations collect, clean, transform, automate, and move information with greater accuracy. Every engagement begins by understanding your systems, rules, reporting needs, integrations, and desired outcomes—then shaping a practical process around them.', size: 16, w: 760, h: 130, color: '#514b45' }],

  ['eyebrow', 48, 958, '', { text: 'The Process', color: '#1e5faf', w: 220 }],
  ['heading', 48, 994, '', { text: 'Listen first. Design for the outcome.', size: 30, w: 600, h: 48 }],
  ['text', 48, 1062, '', { text: 'We map the source environment before moving anything: file formats, required fields, business logic, reporting expectations, and integration constraints. That shared understanding becomes a clear data plan aligned with the work your team actually needs to complete.', size: 15, w: 760, h: 108, color: '#514b45' }],
  ['card', 48, 1204, '', { w: 380, h: 130, radius: 6, bg: '#ffffff' }],
  ['heading', 72, 1228, '', { text: 'Understand the source', size: 19, w: 320, h: 28 }],
  ['text', 72, 1268, '', { text: 'Systems, formats, fields, rules, and risks are documented before delivery begins.', size: 13, w: 320, h: 52, color: '#514b45' }],
  ['card', 472, 1204, '', { w: 380, h: 130, radius: 6, bg: '#ffffff' }],
  ['heading', 496, 1228, '', { text: 'Build for the destination', size: 19, w: 320, h: 28 }],
  ['text', 496, 1268, '', { text: 'The process is structured around usable outputs, repeatable workflows, and confident decisions.', size: 13, w: 320, h: 52, color: '#514b45' }],

  ['eyebrow', 48, 1442, '', { text: 'The Work', color: '#1e5faf', w: 220 }],
  ['heading', 48, 1478, '', { text: 'Flexible inputs. Clean, actionable outputs.', size: 30, w: 650, h: 48 }],
  ['text', 48, 1546, '', { text: 'Projects may begin with spreadsheets, PDFs, CSV exports, cloud platforms, system reports, APIs, connectors, or webhook events. We identify required fields, standardize formats, resolve inconsistencies, remove duplicates, and validate the final structure against the business rules.', size: 15, w: 760, h: 112, color: '#514b45' }],
  ['box', 48, 1694, '', { w: 244, h: 140, radius: 6, bg: '#d6dbe6' }],
  ['heading', 68, 1718, '', { text: 'Prepare', size: 18, w: 200, h: 26 }],
  ['text', 68, 1756, '', { text: 'Collect and organize data from the systems and files already in use.', size: 13, w: 200, h: 58 }],
  ['box', 328, 1694, '', { w: 244, h: 140, radius: 6, bg: '#d6dbe6' }],
  ['heading', 348, 1718, '', { text: 'Transform', size: 18, w: 200, h: 26 }],
  ['text', 348, 1756, '', { text: 'Clean, map, normalize, deduplicate, and validate every required field.', size: 13, w: 200, h: 58 }],
  ['box', 608, 1694, '', { w: 244, h: 140, radius: 6, bg: '#d6dbe6' }],
  ['heading', 628, 1718, '', { text: 'Activate', size: 18, w: 200, h: 26 }],
  ['text', 628, 1756, '', { text: 'Deliver dependable information for migrations, reporting, and automation.', size: 13, w: 200, h: 58 }],

  ['heading', 48, 1988, '', { text: 'Move from scattered data to confident decisions.', color: '#ffffff', size: 30, w: 600, h: 72 }],
  ['text', 48, 2074, '', { text: 'Bring us the next data challenge. We’ll help define a secure, practical path forward.', color: '#d6dbe6', size: 15, w: 560, h: 54 }],
  ['button', 650, 2028, '', { text: 'Start a conversation', w: 202, h: 46, radius: 4, bg: '#ffffff', color: '#202a50' }],

  ['text', 48, 2256, '', { text: 'Momentum Data Solutions\nClean data. Sound delivery. Better decisions.', color: '#ffffff', size: 13, w: 360, h: 72 }],
  ['text', 500, 2256, '', { text: 'Home    About    Resources    Contact\n\n© Momentum Data Solutions', color: '#ffffff', size: 13, w: 352, h: 72 }],
];

const ABOUT_SECTIONS: Array<Omit<Section, 'id'>> = [
  { name: 'Header', y: 0, h: 68, bg: '#1e5faf' },
  { name: 'About Hero', y: 68, h: 420, bg: '#202a50' },
  { name: 'Who We Are', y: 488, h: 390, bg: 'transparent' },
  { name: 'Process', y: 878, h: 516, bg: '#d6dbe6' },
  { name: 'Work', y: 1394, h: 494, bg: 'transparent' },
  { name: 'Consultation', y: 1888, h: 300, bg: '#202a50' },
  { name: 'Footer', y: 2188, h: 180, bg: '#1e5faf' },
];

const CONTACT_ROWS: TemplateRow[] = [
  ['nav', 0, 0, '', { text: 'Momentum        Home    About    Compliance    Resources    Contact us', w: 900, h: 68, size: 13, bg: 'transparent', color: '#ffffff' }],
  ['button', 762, 16, '', { text: 'Contact us', href: '/contact-us', w: 110, h: 36, bg: 'transparent', color: '#ffffff', radius: 4 }],

  ['eyebrow', 48, 126, '', { text: 'Start a conversation', color: '#8dbfff', w: 280 }],
  ['heading', 48, 166, '', { text: 'Bring us the next data challenge.', color: '#ffffff', size: 44, w: 650, h: 112 }],
  ['text', 48, 300, '', { text: 'Tell us what you are working through. We will help define a secure, practical path forward for your data, systems, people, and payroll.', color: '#d6dbe6', size: 17, w: 620, h: 82 }],

  ['eyebrow', 48, 536, '', { text: 'Contact Momentum', color: '#1e5faf', w: 240 }],
  ['heading', 48, 572, '', { text: 'Let’s make the complex manageable.', size: 30, w: 370, h: 82 }],
  ['text', 48, 676, '', { text: 'Share a little about your organization and the outcome you need. A member of the Momentum team will follow up to learn more.', size: 15, color: '#514b45', w: 350, h: 100 }],
  ['subhead', 48, 822, '', { text: 'What happens next', size: 18, w: 300, h: 28 }],
  ['list', 48, 866, '', { text: '•  We review your request and identify the right specialist.\n•  We contact you within two business days.\n•  We schedule a focused discovery conversation.', size: 14, color: '#514b45', w: 350, h: 108 }],
  ['text', 48, 1010, '', { text: 'Prefer email?\nhello@momentumdatasolutions.com', size: 14, color: '#1e5faf', w: 350, h: 60 }],

  ['card', 448, 520, '', { w: 404, h: 590, radius: 8, bg: '#f1eee8' }],
  ['heading', 480, 552, '', { text: 'Tell us about your project', size: 24, w: 340, h: 38 }],
  ['text', 480, 606, '', { text: 'All fields help us route your request accurately.', size: 13, color: '#6f6963', w: 340, h: 28 }],
  ['eyebrow', 480, 662, '', { text: 'Name', color: '#514b45', w: 160 }],
  ['input', 480, 688, '', { text: 'Full name', w: 340, h: 46, bg: '#ffffff' }],
  ['eyebrow', 480, 754, '', { text: 'Work email', color: '#514b45', w: 160 }],
  ['form', 480, 780, '', { text: 'you@company.com', w: 340, h: 46, bg: '#ffffff' }],
  ['eyebrow', 480, 846, '', { text: 'Company', color: '#514b45', w: 160 }],
  ['input', 480, 872, '', { text: 'Organization name', w: 340, h: 46, bg: '#ffffff' }],
  ['eyebrow', 480, 938, '', { text: 'How can we help?', color: '#514b45', w: 180 }],
  ['input', 480, 964, '', { text: 'Briefly describe your project or challenge', w: 340, h: 72, bg: '#ffffff', vAlign: 'top', pad: 12 }],
  ['button', 480, 1054, '', { text: 'Send inquiry', href: '#contact-submit', w: 160, h: 44, radius: 4, bg: '#0e1cdf', color: '#ffffff' }],

  ['eyebrow', 48, 1218, '', { text: 'Built for clarity', color: '#1e5faf', w: 220 }],
  ['heading', 48, 1254, '', { text: 'A focused start, with no guesswork.', size: 30, w: 620, h: 48 }],
  ['card', 48, 1334, '', { w: 244, h: 142, radius: 6, bg: '#ffffff' }],
  ['heading', 68, 1358, '', { text: 'Listen', size: 18, w: 200, h: 26 }],
  ['text', 68, 1398, '', { text: 'We begin with your systems, constraints, priorities, and desired outcome.', size: 13, color: '#514b45', w: 200, h: 62 }],
  ['card', 328, 1334, '', { w: 244, h: 142, radius: 6, bg: '#ffffff' }],
  ['heading', 348, 1358, '', { text: 'Define', size: 18, w: 200, h: 26 }],
  ['text', 348, 1398, '', { text: 'Together, we shape the scope, responsibilities, and practical next steps.', size: 13, color: '#514b45', w: 200, h: 62 }],
  ['card', 608, 1334, '', { w: 244, h: 142, radius: 6, bg: '#ffffff' }],
  ['heading', 628, 1358, '', { text: 'Move', size: 18, w: 200, h: 26 }],
  ['text', 628, 1398, '', { text: 'You leave the conversation with a clearer path and an aligned team.', size: 13, color: '#514b45', w: 200, h: 62 }],

  ['text', 48, 1584, '', { text: 'Momentum Data Solutions\nClean data. Sound delivery. Better decisions.', color: '#ffffff', size: 13, w: 360, h: 72 }],
  ['text', 500, 1584, '', { text: 'Home    About    Resources    Contact\n\n© Momentum Data Solutions', color: '#ffffff', size: 13, w: 352, h: 72 }],
];

const CONTACT_SECTIONS: Array<Omit<Section, 'id'>> = [
  { name: 'Header', y: 0, h: 68, bg: '#1e5faf' },
  { name: 'Contact Hero', y: 68, h: 402, bg: '#202a50' },
  { name: 'Inquiry', y: 470, h: 700, bg: 'transparent' },
  { name: 'Next Steps', y: 1170, h: 354, bg: '#d6dbe6' },
  { name: 'Footer', y: 1524, h: 180, bg: '#1e5faf' },
];

function createTemplate(
  rows: TemplateRow[],
  sections: Array<Omit<Section, 'id'>>,
  sectionId: () => string,
): { objects: Obj[]; sections: Section[] } {
  return {
    objects: rows.map(([kind, x, y, label, patch], index) => ({
      ...objSpec(kind, x, y, label),
      ...patch,
      id: `${kind}-${String(index + 1).padStart(2, '0')}`,
    })),
    sections: sections.map((section) => ({ ...section, id: sectionId() })),
  };
}

export function createMomentumTemplate(sectionId: () => string): { objects: Obj[]; sections: Section[] } {
  return createTemplate(MOMENTUM_ROWS, MOMENTUM_SECTIONS, sectionId);
}

export function createAboutTemplate(sectionId: () => string): { objects: Obj[]; sections: Section[] } {
  return createTemplate(ABOUT_ROWS, ABOUT_SECTIONS, sectionId);
}

export function createContactTemplate(sectionId: () => string): { objects: Obj[]; sections: Section[] } {
  return createTemplate(CONTACT_ROWS, CONTACT_SECTIONS, sectionId);
}
