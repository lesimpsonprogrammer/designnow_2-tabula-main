import { useState } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import type { NavLink, Obj } from '../../types';
import { FONT_OPTIONS } from '../../lib/fonts';

function navigationData(obj: Obj): { brand: string; links: NavLink[] } {
  if (obj.navBrand || obj.navLinks?.length) {
    return { brand: obj.navBrand ?? '', links: obj.navLinks ?? [] };
  }

  const parts = obj.text.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  return {
    brand: parts[0] ?? '',
    links: parts.slice(1).map((label, index) => ({
      id: `nav-${index}`,
      label,
      href: label.toLowerCase() === 'home'
        ? '/'
        : `/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    })),
  };
}

export function NavigationMenuPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
  const [logoError, setLogoError] = useState('');
  const objects = useTabulaStore((state) => state.objects);
  const selectedId = useTabulaStore((state) => state.selectedId);
  const updateObject = useTabulaStore((state) => state.updateObject);
  const snapshot = useTabulaStore((state) => state.snapshot);
  const navigationObject = objects.find((object) => object.id === selectedId && object.kind === 'nav');

  if (!navigationObject) return null;

  const navigation = navigationData(navigationObject);
  const updateNavigation = (brand: string, links: NavLink[]) => updateObject(navigationObject.id, {
    navBrand: brand,
    navLinks: links,
    text: [brand, ...links.map((link) => link.label)].filter(Boolean).join('    '),
  });
  const patch = (value: Partial<Obj>) => updateObject(navigationObject.id, value);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const colorValue = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';

  return (
    <aside className={`navigation-menu-panel${collapsed ? ' collapsed' : ''}`} aria-label="Navigation menu editor">
      <div className="navigation-menu-header">
        <div>
          <span>Navigation menu</span>
          {!collapsed ? <small>Edit labels and destinations</small> : null}
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expand navigation menu editor' : 'Collapse navigation menu editor'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? '+' : '−'}
        </button>
      </div>

      {!collapsed ? (
        <div className="navigation-menu-body">
          <div className="navigation-menu-tabs" role="tablist" aria-label="Navigation controls">
            <button type="button" role="tab" aria-selected={activeTab === 'content'} className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>Content</button>
            <button type="button" role="tab" aria-selected={activeTab === 'style'} className={activeTab === 'style' ? 'active' : ''} onClick={() => setActiveTab('style')}>Style</button>
          </div>

          {activeTab === 'content' ? (
            <div className="navigation-menu-tab-panel" role="tabpanel">
              <div className="navigation-logo-editor">
                <span className="navigation-menu-label">Logo</span>
                {navigationObject.navLogo ? (
                  <img src={navigationObject.navLogo} alt="Current navigation logo" />
                ) : (
                  <div className="navigation-logo-empty">No logo uploaded</div>
                )}
                <label className="navigation-logo-upload">
                  Upload logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1_500_000) {
                        setLogoError('Choose an image smaller than 1.5 MB.');
                        event.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        snapshot();
                        patch({ navLogo: typeof reader.result === 'string' ? reader.result : '' });
                        setLogoError('');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {logoError ? <span className="navigation-logo-error" role="alert">{logoError}</span> : null}
                {navigationObject.navLogo ? (
                  <button type="button" className="navigation-logo-remove" onClick={() => { snapshot(); patch({ navLogo: '' }); }}>Remove logo</button>
                ) : null}
                <div className="navigation-number-grid">
                  <label>Logo width<input aria-label="Logo width" type="number" min={16} max={400} value={navigationObject.navLogoWidth} onFocus={snapshot} onChange={(event) => patch({ navLogoWidth: clamp(Number(event.target.value), 16, 400) })} /></label>
                  <label>Logo height<input aria-label="Logo height" type="number" min={12} max={160} value={navigationObject.navLogoHeight} onFocus={snapshot} onChange={(event) => patch({ navLogoHeight: clamp(Number(event.target.value), 12, 160) })} /></label>
                </div>
              </div>

              <label>
                Brand
                <input
                  value={navigation.brand}
                  onFocus={snapshot}
                  onChange={(event) => updateNavigation(event.target.value, navigation.links)}
                />
              </label>

              <span className="navigation-menu-label">Menu items</span>
              {navigation.links.map((link, index) => (
                <div className="navigation-menu-item-editor" key={link.id}>
                  <div className="navigation-menu-row">
                    <input
                      value={link.label}
                      aria-label={`Menu item ${index + 1} label`}
                      onFocus={snapshot}
                      onChange={(event) => updateNavigation(
                        navigation.brand,
                        navigation.links.map((item, itemIndex) => itemIndex === index
                          ? { ...item, label: event.target.value }
                          : item),
                      )}
                    />
                    <input
                      value={link.href}
                      aria-label={`Menu item ${index + 1} destination`}
                      onFocus={snapshot}
                      onChange={(event) => updateNavigation(
                        navigation.brand,
                        navigation.links.map((item, itemIndex) => itemIndex === index
                          ? { ...item, href: event.target.value }
                          : item),
                      )}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${link.label}`}
                      onClick={() => {
                        snapshot();
                        updateNavigation(navigation.brand, navigation.links.filter((_, itemIndex) => itemIndex !== index));
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {link.children?.length ? (
                    <div className="navigation-submenu-editor">
                      <span>{link.label} submenu</span>
                      {link.children.map((child, childIndex) => (
                        <div className="navigation-menu-row nested" key={child.id}>
                          <input
                            value={child.label}
                            aria-label={`${link.label} submenu item ${childIndex + 1} label`}
                            onFocus={snapshot}
                            onChange={(event) => updateNavigation(
                              navigation.brand,
                              navigation.links.map((item, itemIndex) => itemIndex === index
                                ? { ...item, children: item.children?.map((entry, entryIndex) => entryIndex === childIndex ? { ...entry, label: event.target.value } : entry) }
                                : item),
                            )}
                          />
                          <input
                            value={child.href}
                            aria-label={`${link.label} submenu item ${childIndex + 1} destination`}
                            onFocus={snapshot}
                            onChange={(event) => updateNavigation(
                              navigation.brand,
                              navigation.links.map((item, itemIndex) => itemIndex === index
                                ? { ...item, children: item.children?.map((entry, entryIndex) => entryIndex === childIndex ? { ...entry, href: event.target.value } : entry) }
                                : item),
                            )}
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${child.label}`}
                            onClick={() => {
                              snapshot();
                              updateNavigation(
                                navigation.brand,
                                navigation.links.map((item, itemIndex) => itemIndex === index
                                  ? { ...item, children: item.children?.filter((_, entryIndex) => entryIndex !== childIndex) }
                                  : item),
                              );
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <button
                type="button"
                className="navigation-menu-add"
                onClick={() => {
                  snapshot();
                  updateNavigation(navigation.brand, [
                    ...navigation.links,
                    { id: `nav-${Date.now()}`, label: 'New item', href: '#' },
                  ]);
                }}
              >
                + Add menu item
              </button>
            </div>
          ) : (
            <div className="navigation-menu-tab-panel navigation-style-panel" role="tabpanel">
              <div className="navigation-style-control">
                <span>Text alignment</span>
                <div className="navigation-segmented" role="group" aria-label="Navigation text alignment">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button key={align} type="button" className={navigationObject.align === align ? 'active' : ''} aria-pressed={navigationObject.align === align} onClick={() => { snapshot(); patch({ align }); }}>
                      {align === 'left' ? 'Left' : align === 'center' ? 'Center' : 'Right'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="navigation-style-control">
                <span>Vertical alignment</span>
                <div className="navigation-segmented" role="group" aria-label="Navigation vertical alignment">
                  {(['top', 'middle', 'bottom'] as const).map((vAlign) => (
                    <button key={vAlign} type="button" className={navigationObject.vAlign === vAlign ? 'active' : ''} aria-pressed={navigationObject.vAlign === vAlign} onClick={() => { snapshot(); patch({ vAlign }); }}>
                      {vAlign === 'top' ? 'Top' : vAlign === 'middle' ? 'Middle' : 'Bottom'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="navigation-number-grid three">
                {([['X', 'x', navigationObject.x, undefined], ['Y', 'y', navigationObject.y, undefined], ['Size', 'size', navigationObject.size, 1]] as const).map(([label, key, value, min]) => (
                  <label key={key}>{label}<input type="number" min={min} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: min === undefined ? Number(event.target.value) : Math.max(min, Number(event.target.value)) })} /></label>
                ))}
              </div>
              <div className="navigation-number-grid">
                <label>Width<input type="number" min={16} value={navigationObject.w} onFocus={snapshot} onChange={(event) => patch({ w: Math.max(16, Number(event.target.value)) })} /></label>
                <label>Height<input type="number" min={1} value={navigationObject.h} onFocus={snapshot} onChange={(event) => patch({ h: Math.max(1, Number(event.target.value)) })} /></label>
              </div>

              <label>
                Font
                <select aria-label="Navigation font" value={navigationObject.fontFamily} onFocus={snapshot} onChange={(event) => patch({ fontFamily: event.target.value })}>
                  <option value="">Project theme font</option>
                  {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                </select>
              </label>
              <div className="navigation-format" role="group" aria-label="Navigation text formatting">
                <button type="button" className={navigationObject.italic ? 'active' : ''} aria-pressed={navigationObject.italic} onClick={() => { snapshot(); patch({ italic: !navigationObject.italic }); }}><em>I</em> Italic</button>
              </div>

              {([['Fill', 'bg', navigationObject.bg, true], ['Ink', 'color', navigationObject.color, false], ['Edge', 'bc', navigationObject.bc, true]] as const).map(([label, key, value, allowNone]) => (
                <label key={key}>{label}<span className="navigation-color-row">
                  <input type="color" value={colorValue(value)} onFocus={snapshot} onChange={(event) => patch({ [key]: event.target.value })} />
                  <input aria-label={`Navigation ${label} hex value`} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: event.target.value })} />
                  {allowNone ? <button type="button" onClick={() => { snapshot(); patch(key === 'bc' ? { bc: 'transparent', bw: 0 } : { [key]: 'transparent' }); }}>None</button> : null}
                </span></label>
              ))}

              {([['Radius', 'radius', navigationObject.radius, 0, 60], ['Border', 'bw', navigationObject.bw, 0, 12], ['Opacity', 'opacity', navigationObject.opacity, 10, 100]] as const).map(([label, key, value, min, max]) => (
                <label className="navigation-range" key={key}>
                  <span>{label}<output>{value}</output></span>
                  <span><input type="range" min={min} max={max} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: Number(event.target.value) })} /><input aria-label={`Navigation ${label} value`} type="number" min={min} max={max} value={value} onFocus={snapshot} onChange={(event) => patch({ [key]: clamp(Number(event.target.value), min, max) })} /></span>
                </label>
              ))}

              <label className="navigation-range">
                <span>Padding <output>{navigationObject.pad === null ? 'auto' : navigationObject.pad}</output></span>
                <span><input type="range" min={0} max={64} value={navigationObject.pad ?? 0} onFocus={snapshot} onChange={(event) => patch({ pad: Number(event.target.value) })} /><input aria-label="Navigation Padding value" type="number" min={0} max={64} value={navigationObject.pad ?? ''} placeholder="Auto" onFocus={snapshot} onChange={(event) => patch({ pad: event.target.value === '' ? null : clamp(Number(event.target.value), 0, 64) })} /></span>
                <button type="button" className="navigation-menu-add" onClick={() => { snapshot(); patch({ pad: null }); }}>Use automatic padding</button>
              </label>
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
}
