import { useEffect, useRef, useState, type ReactNode } from 'react';

type MenuButtonProps = {
  label: ReactNode;
  title: string;
  className?: string;
  align?: 'start' | 'end';
  children: (close: () => void) => ReactNode;
};

export function MenuButton({ label, title, className = '', align = 'end', children }: MenuButtonProps) {
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
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className={`menu-trigger ${className}${open ? ' active' : ''}`}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div className={`menu-popover align-${align}`} role="menu">
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
