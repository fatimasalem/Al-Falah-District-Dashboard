import type { ReactElement } from 'react';

export type ChartSectionIconName =
  | 'action-agenda'
  | 'compare'
  | 'executive-lens'
  | 'momentum-matrix'
  | 'overall-score'
  | 'risk-register'
  | 'statement-register'
  | 'scale'
  | 'protect'
  | 'target'
  | 'close';

const SVG_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

const SECTION_ICONS: Record<ChartSectionIconName, ReactElement> = {
  'action-agenda': (
    <svg {...SVG_PROPS}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  compare: (
    <svg {...SVG_PROPS}>
      <circle cx="8" cy="12" r="3" />
      <circle cx="16" cy="12" r="3" />
      <path d="M11 12h2" />
    </svg>
  ),
  'executive-lens': (
    <svg {...SVG_PROPS}>
      <rect x="3" y="4" width="8" height="16" rx="1.5" />
      <rect x="13" y="8" width="8" height="12" rx="1.5" />
      <path d="M7 20v-2M17 20v-2" />
    </svg>
  ),
  'momentum-matrix': (
    <svg {...SVG_PROPS}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="12" y="3" width="9" height="5" rx="1.5" />
      <rect x="3" y="12" width="11" height="9" rx="1.5" />
      <rect x="16" y="10" width="5" height="11" rx="1.5" />
    </svg>
  ),
  'overall-score': (
    <svg {...SVG_PROPS}>
      <path d="M12 3l2.2 6.8H21l-5.6 4.1 2.1 6.8L12 16.8 6.5 20.7l2.1-6.8L3 9.8h6.8L12 3z" />
    </svg>
  ),
  'risk-register': (
    <svg {...SVG_PROPS}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  'statement-register': (
    <svg {...SVG_PROPS}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  scale: (
    <svg {...SVG_PROPS}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  protect: (
    <svg {...SVG_PROPS}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  target: (
    <svg {...SVG_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
  close: (
    <svg {...SVG_PROPS}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
};

export function ChartSectionIcon({ name }: { name: ChartSectionIconName }) {
  return SECTION_ICONS[name];
}

interface ChartSectionHeaderProps {
  icon: ChartSectionIconName;
  title: string;
  subtitle?: string;
  singleLineSubtitle?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function ChartSectionHeader({
  icon,
  title,
  subtitle,
  singleLineSubtitle = false,
  titleClassName = 'chart-title',
  subtitleClassName = 'chart-subtitle',
}: ChartSectionHeaderProps) {
  return (
    <div className="chart-card-header-copy">
      <span className="chart-card-icon">
        <ChartSectionIcon name={icon} />
      </span>
      <div className="chart-card-header-text">
        <div className={titleClassName}>{title}</div>
        {subtitle && (
          <div className={`${subtitleClassName}${singleLineSubtitle ? ' chart-subtitle-single-line' : ''}`.trim()}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionAgendaColumnHeaderProps {
  icon: ChartSectionIconName;
  title: string;
  description: string;
}

export function ActionAgendaColumnHeader({ icon, title, description }: ActionAgendaColumnHeaderProps) {
  return (
    <div className="action-agenda-column-header">
      <div className="action-agenda-column-title-row">
        <span className="action-agenda-column-icon">
          <ChartSectionIcon name={icon} />
        </span>
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
    </div>
  );
}
