import type { TabId, TabStatus } from '../types';
import { isTabAccessible } from '../types';
import { TabStatusBadge } from './TabStatusBadge';

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: readonly { id: string; label: string; icon: string; status: TabStatus }[];
}

function TabIcon({ name }: { name: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...props}>
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 11h.01" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      );
    case 'book':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...props}>
          <path d="M11 20A7 7 0 019.5 6.5c.5-2 2-3.5 4.5-4 0 3 1 5.5 2.5 7.5S20 14 20 16a7 7 0 01-9 4z" />
          <path d="M11 20c-2-1-3-3-3-5" />
        </svg>
      );
    case 'building':
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

export function SidebarNav({ activeTab, onTabChange, tabs }: SidebarNavProps) {
  return (
    <nav className="dashboard-sidebar" role="tablist" aria-label="Dashboard sections">
      <div className="sidebar-nav-panel">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isAccessible = isTabAccessible(tab.id as TabId);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={!isAccessible}
              aria-label={isAccessible ? tab.label : `${tab.label} — pending score approval`}
              title={isAccessible ? undefined : 'Pending score approval — section unavailable'}
              className={[
                'sidebar-tab-btn',
                isActive ? 'active' : '',
                !isAccessible ? 'is-disabled' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (isAccessible) onTabChange(tab.id);
              }}
            >
              <span className="sidebar-tab-icon-wrap">
                <TabIcon name={tab.icon} />
              </span>
              <span className="sidebar-tab-label">{tab.label}</span>
              <TabStatusBadge status={tab.status} className="sidebar-tab-status-badge" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
