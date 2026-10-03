import { useState } from 'react';
import { useTabulaStore } from '../../store/useTabulaStore';
import type { NavLink, Obj } from '../../types';

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function NavigationContent({ navigationObject }: { navigationObject: Obj }) {
  const [logoError, setLogoError] = useState('');
  const updateObject = useTabulaStore((state) => state.updateObject);
  const snapshot = useTabulaStore((state) => state.snapshot);

  const navigation = navigationData(navigationObject);
  const updateNavigation = (brand: string, links: NavLink[]) => updateObject(navigationObject.id, {
    navBrand: brand,
    navLinks: links,
    text: [brand, ...links.map((link) => link.label)].filter(Boolean).join('    '),
  });
  const patch = (value: Partial<Obj>) => updateObject(navigationObject.id, value);

  return (
    <div className="inspector-nav-content">
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
  );
}
