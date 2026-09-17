import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TabStatus } from '../types';
import { TAB_STATUS_TOOLTIPS } from '../types';

interface TabStatusBadgeProps {
  status: TabStatus;
  className?: string;
}

export function TabStatusBadge({ status, className }: TabStatusBadgeProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'bottom' });

  const tooltip = TAB_STATUS_TOOLTIPS[status];

  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 8;
    const tooltipHeight = 32;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceAbove >= tooltipHeight + gap || spaceAbove >= spaceBelow ? 'top' : 'bottom';

    setPosition({
      top: placement === 'top' ? rect.top - gap : rect.bottom + gap,
      left: rect.left + rect.width / 2,
      placement,
    });
  }, []);

  useEffect(() => {
    if (!visible) return;

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible, updatePosition]);

  return (
    <>
      <span
        ref={wrapRef}
        className={['tab-status-badge-wrap', className].filter(Boolean).join(' ')}
        aria-label={tooltip}
        onMouseEnter={() => {
          updatePosition();
          setVisible(true);
        }}
        onMouseLeave={() => setVisible(false)}
      >
        <span className={`tab-status-badge tab-status-badge-${status.toLowerCase()}`}>
          {status}
        </span>
      </span>
      {visible && createPortal(
        <span
          className={`tab-status-tooltip tab-status-tooltip-${position.placement}`}
          role="tooltip"
          style={{ top: position.top, left: position.left }}
        >
          {tooltip}
        </span>,
        document.body,
      )}
    </>
  );
}
