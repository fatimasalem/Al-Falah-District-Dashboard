import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { METHODOLOGY_SECTIONS } from '../../utils';

interface HowToReadDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_ANIMATION_MS = 420;

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function HowToReadDrawer({ open, onClose }: HowToReadDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), DRAWER_ANIMATION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted || !visible) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mounted, visible, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`methodology-drawer-root${visible ? ' is-open' : ''}`}>
      <button
        type="button"
        className="methodology-drawer-overlay"
        aria-label="Close how to read panel"
        onClick={onClose}
      />
      <aside
        className="methodology-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-drawer-title"
      >
        <div className="methodology-drawer-header">
          <h2 id="methodology-drawer-title" className="methodology-drawer-title">
            How to read this dashboard
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="methodology-drawer-close"
            aria-label="Close"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>
        <div className="methodology-drawer-body">
          {METHODOLOGY_SECTIONS.map((section) => (
            <section key={section.title} className="methodology-drawer-section">
              <h3 className="methodology-drawer-section-title">{section.title}</h3>
              <p className="methodology-drawer-section-body">{section.body}</p>
            </section>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
