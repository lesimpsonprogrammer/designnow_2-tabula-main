import { useEffect, useRef, useState, type ReactNode } from 'react';

type HeaderMenuProps = {
  label: ReactNode;
  title: string;
  className?: string;
  align?: 'start' | 'end';
  children: (close: () => void) => ReactNode;
};

export function HeaderMenu({ label, title, className = '', align = 'end', children }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className={`header-menu-trigger ${className}${open ? ' active' : ''}`}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div className={`header-menu-popover align-${align}`} role="menu">
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
