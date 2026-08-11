import { useEffect, useRef, useState } from 'react';
import type { SurveyYear, ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedYear: SurveyYear;
  onSelectedYearChange: (year: SurveyYear) => void;
  availableYears: readonly SurveyYear[];
  updatedAt: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: readonly { id: string; label: string; icon: string; reviewReady?: boolean }[];
}

function IconSparkle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 4.4L17 8l-3.8 1.2L12 14l-1.2-4.8L7 8l3.8-1.6L12 2z"
        fill="currentColor"
      />
      <path
        d="M5 18l.6 1.8L7.4 20l-1.8.6L5 22.4l-.6-1.8L2.6 20l1.8-.6L5 18zM19 16l.4 1.2L20.6 17l-1.2.4L19 18.6l-.4-1.2L17.4 17l1.2-.4L19 16z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TabIcon({ name }: { name: string }) {
  const props = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true as const };

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

export function Header({
  viewMode,
  onViewModeChange,
  selectedYear,
  onSelectedYearChange,
  availableYears,
  updatedAt,
  activeTab,
  onTabChange,
  tabs,
}: HeaderProps) {
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const yoyDisabled = selectedYear === '2024';

  useEffect(() => {
    if (!yearMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!yearDropdownRef.current?.contains(event.target as Node)) {
        setYearMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setYearMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [yearMenuOpen]);

  const handleYearSelect = (year: SurveyYear) => {
    onSelectedYearChange(year);
    setYearMenuOpen(false);
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="header-title-row">
              <h1 className="header-title">
                Al Falah District Dashboard
              </h1>
              <button type="button" className="header-ai-btn" aria-label="Ask AI">
                <IconSparkle />
              </button>
            </div>
            <p className="header-subtitle">
              Updated: {updatedAt} | District — Al Falah, Abu Dhabi
            </p>
          </div>
          <div className="header-actions">
            <div className="filter-pills" role="group" aria-label="View mode">
              <div className="year-dropdown" ref={yearDropdownRef}>
                <button
                  type="button"
                  className={`filter-pill year-dropdown-trigger ${viewMode === 'current' ? 'active' : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={yearMenuOpen}
                  aria-label={`Select survey year, currently ${selectedYear}`}
                  onClick={() => setYearMenuOpen((open) => !open)}
                >
                  <span>{selectedYear}</span>
                  <IconChevronDown />
                </button>
                {yearMenuOpen && (
                  <ul className="year-dropdown-menu" role="listbox" aria-label="Survey year">
                    {availableYears.map((year) => (
                      <li key={year} role="option" aria-selected={selectedYear === year}>
                        <button
                          type="button"
                          className={`year-dropdown-option ${selectedYear === year ? 'selected' : ''}`}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                className={`filter-pill ${viewMode === 'yoy' ? 'active' : ''}`}
                onClick={() => onViewModeChange('yoy')}
                disabled={yoyDisabled}
                title={yoyDisabled ? 'Year-over-year comparison requires 2025 data' : undefined}
                aria-disabled={yoyDisabled}
              >
                YoY
              </button>
            </div>
            <div className="header-actions-separator" aria-hidden="true" />
            <button type="button" className="action-btn action-btn-ghost">
              <IconShare /> Share
            </button>
            <button type="button" className="action-btn action-btn-ghost">
              <IconExport /> Export
            </button>
            <button type="button" className="action-btn action-btn-primary">
              <IconRefresh /> Refresh
            </button>
          </div>
        </div>
      </header>
      <nav className="tab-bar" role="tablist">
        <div className="tab-bar-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon"><TabIcon name={tab.icon} /></span>
              {tab.label}
              {tab.reviewReady && (
                <span className="tab-review-badge">Review ready</span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
