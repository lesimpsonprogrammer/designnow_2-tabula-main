import type { Kind, Obj } from '../types';

// Ported verbatim from reference/Tabula v2.dc.html — tuned so a freshly
// dropped object looks right with no adjustment. Do not "improve" the
// numbers without checking the prototype first.
export function objSpec(kind: Kind, x: number, y: number, label?: string): Omit<Obj, 'id'> {
  const topAligned = ['heading', 'text', 'subhead', 'list', 'quote', 'stat', 'table'].includes(kind);
  const base: Omit<Obj, 'id'> = {
    kind, x, y,
    radius: 0, color: '#1c1a18', bg: 'transparent',
    size: 16, wordSpacing: 0, sentenceSpacing: 0, fontFamily: '', italic: false, textColors: [], textItalics: [], w: 320, h: 60, text: '', label: label || '',
    pad: null, bw: 0, bc: '#e2ded6', opacity: 100, dividerGradient: false, align: 'left', vAlign: topAligned ? 'top' : 'middle',
    href: '#', navBrand: '', navLinks: [], navLogo: '', navLogoWidth: 120, navLogoHeight: 36, iconName: 'database', imageSrc: '', imageOriginalSrc: '', hidden: false, locked: false, groupId: null,
  };

  switch (kind) {
    case 'heading':
      return { ...base, text: 'A headline that does the work', size: 40, w: 520, h: 100 };
    case 'text':
      return { ...base, text: 'Supporting copy. Replace it with something true about the product.', size: 15, w: 420, h: 78, color: '#514b45' };
    case 'button':
      return { ...base, text: 'Get started', size: 14, w: 148, h: 42, radius: 8, bg: '#1c1a18', color: '#fdfcfa' };
    case 'reminder':
      return { ...base, text: 'Remind me', size: 14, w: 148, h: 42, radius: 8, bg: '#0e1cdf', color: '#ffffff', label: 'Reminder options' };
    case 'image':
      return { ...base, w: 380, h: 240, radius: 6, label: label || 'image' };
    case 'logo':
      return { ...base, w: 220, h: 80, label: label || 'Company logo' };
    case 'box':
      return { ...base, w: 360, h: 200, radius: 10, bg: '#f1eee8' };
    case 'divider':
      return { ...base, w: 520, h: 1, bg: '#ddd8d0' };
    case 'form':
      return { ...base, w: 420, h: 52, radius: 8, bg: '#f1eee8', text: 'you@company.com', size: 14, color: '#8a827a' };
    case 'nav':
      return { ...base, w: 760, h: 56, bg: 'transparent', text: 'Studio      Work    About    Contact', size: 14, color: '#3a352f' };
    case 'eyebrow':
      return { ...base, text: 'What we do', size: 12, w: 260, h: 20, color: '#8a827a' };
    case 'subhead':
      return { ...base, text: 'A section title', size: 26, w: 460, h: 40 };
    case 'list':
      return { ...base, text: '•  Data migration and cleanup\n•  Project delivery\n•  HR and payroll support', size: 15, w: 380, h: 96, color: '#514b45' };
    case 'quote':
      return { ...base, text: '“They moved twelve years of records without a day of downtime.”', size: 22, w: 520, h: 92, color: '#1c1a18' };
    case 'stat':
      return { ...base, text: '98%', size: 44, w: 200, h: 58 };
    case 'badge':
      return { ...base, text: 'New', size: 12, w: 76, h: 26, radius: 13, bg: '#f1eee8', color: '#514b45' };
    case 'card':
      return { ...base, w: 280, h: 220, radius: 10, bg: '#ffffff' };
    case 'spacer':
      return { ...base, w: 520, h: 64, bg: 'transparent' };
    case 'breadcrumb':
      return { ...base, text: 'Home  ›  Services  ›  Payroll', size: 12, w: 340, h: 20, color: '#8a827a' };
    case 'footer':
      return { ...base, w: 900, h: 140, bg: '#202a50', color: '#ffffff', size: 13, text: '© Momentum Data Solutions        Privacy    Terms    Contact' };
    case 'accordion':
      return { ...base, w: 520, h: 56, radius: 8, bg: '#f1eee8', size: 15, text: 'How long does a migration take?', color: '#1c1a18' };
    case 'video':
      return { ...base, w: 480, h: 270, radius: 6, label: label || 'video' };
    case 'cloud':
      return { ...base, w: 320, h: 420, color: '#1183f0', label: label || 'Interactive cloud network' };
    case 'icon':
      return { ...base, w: 32, h: 32, color: '#1183f0', iconName: 'database', label: label || 'Icon' };
    case 'logos':
      return { ...base, w: 720, h: 60, size: 15, color: '#8a827a', text: '⬡  Northline      ⬡  Verado      ⬡  Halstead      ⬡  Kerr & Co' };
    case 'table':
      return { ...base, w: 520, h: 128, size: 13, color: '#1c1a18', bg: '#ffffff', radius: 6, text: 'Service            Cadence      Owner\nPayroll run        Biweekly     Momentum\nCompliance audit   Quarterly    Shared' };
    case 'input':
      return { ...base, w: 300, h: 44, radius: 6, bg: '#ffffff', text: 'Full name', size: 14, color: '#8a827a' };
    case 'checkbox':
      return { ...base, w: 320, h: 26, size: 14, text: '☐  Send me the quarterly compliance brief', color: '#514b45' };
    default:
      return base;
  }
}

export function makeObject(kind: Kind, x: number, y: number, nextId: number, label?: string): Obj {
  return { ...objSpec(kind, x, y, label), id: `${kind}-${String(nextId).padStart(2, '0')}` };
}
