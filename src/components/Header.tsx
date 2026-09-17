import { useEffect, useRef, useState } from 'react';
import type { CompareYears, SurveyData, SurveyYear, ViewMode } from '../types';
import { formatCompareYearsLabel, normalizeCompareYears } from '../utils';
import { ReportingControlStrip } from './governance/ReportingControlStrip';

interface HeaderProps {
  pageTitle: string;
  data: SurveyData;
  viewMode: ViewMode;
  compareYears: CompareYears;
  onCompareYearsChange: (years: CompareYears) => void;
  selectedYear: SurveyYear;
  onSelectedYearChange: (year: SurveyYear) => void;
  availableYears: readonly SurveyYear[];
  onOpenMethodology: () => void;
}

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

// function IconRefresh() {
//   return (
//     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
//       <path d="M1 4v6h6M23 20v-6h-6" />
//       <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
//     </svg>
//   );
// }

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function Header({
  pageTitle,
  data,
  viewMode,
  compareYears,
  onCompareYearsChange,
  selectedYear,
  onSelectedYearChange,
  availableYears,
  onOpenMethodology,
}: HeaderProps) {
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [compareMenuOpen, setCompareMenuOpen] = useState(false);
  const [pendingCompareYears, setPendingCompareYears] = useState<SurveyYear[]>(() => [...compareYears]);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const compareDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!compareMenuOpen) return;

    setPendingCompareYears([...compareYears]);

    const handlePointerDown = (event: MouseEvent) => {
      if (!compareDropdownRef.current?.contains(event.target as Node)) {
        setCompareMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCompareMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [compareMenuOpen, compareYears]);

  const handleYearSelect = (year: SurveyYear) => {
    onSelectedYearChange(year);
    setYearMenuOpen(false);
  };

  const handleCompareYearToggle = (year: SurveyYear) => {
    setPendingCompareYears((current) => {
      const isSelected = current.includes(year);
      if (isSelected) {
        return current.filter((value) => value !== year);
      }
      if (current.length >= 2) return current;
      return [...current, year];
    });
  };

  const handleCompareApply = () => {
    const normalized = normalizeCompareYears(pendingCompareYears);
    if (!normalized) return;
    onCompareYearsChange(normalized);
    setCompareMenuOpen(false);
  };

  const compareLabel = viewMode === 'yoy'
    ? formatCompareYearsLabel(compareYears)
    : 'YoY';

  return (
    <header className="dashboard-header">
      <div className="header-inner">
        <div className="header-left">
          <h1 className="header-title">{pageTitle}</h1>
          <ReportingControlStrip
            data={data}
            viewMode={viewMode}
            selectedYear={selectedYear}
            compareYears={compareYears}
            variant="subtitle"
          />
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
                  <span className="filter-dropdown-icon"><IconCalendar /></span>
                  <span>{selectedYear}</span>
                  <span className="filter-dropdown-chevron"><IconChevronDown /></span>
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
              <div className="year-dropdown compare-dropdown" ref={compareDropdownRef}>
                <button
                  type="button"
                  className={`filter-pill year-dropdown-trigger compare-dropdown-trigger ${viewMode === 'yoy' ? 'active' : ''}`}
                  aria-haspopup="dialog"
                  aria-expanded={compareMenuOpen}
                  aria-label={`Compare years, currently ${viewMode === 'yoy' ? formatCompareYearsLabel(compareYears) : 'year over year'}`}
                  onClick={() => setCompareMenuOpen((open) => !open)}
                >
                  <span className="filter-dropdown-icon"><IconCalendar /></span>
                  <span>{compareLabel}</span>
                  <span className="filter-dropdown-chevron"><IconChevronDown /></span>
                </button>
                {compareMenuOpen && (
                  <div className="compare-dropdown-panel" role="dialog" aria-label="Select two years to compare">
                    <p className="compare-dropdown-hint">Select exactly 2 years</p>
                    <ul className="compare-dropdown-list">
                      {availableYears.map((year) => {
                        const isChecked = pendingCompareYears.includes(year);
                        const isDisabled = !isChecked && pendingCompareYears.length >= 2;
                        return (
                          <li key={year}>
                            <label className={`compare-dropdown-option ${isDisabled ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => handleCompareYearToggle(year)}
                              />
                              <span>{year}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      className="compare-dropdown-apply"
                      disabled={pendingCompareYears.length !== 2}
                      onClick={handleCompareApply}
                    >
                      Compare
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="header-actions-separator" aria-hidden="true" />
            <button
              type="button"
              className="action-btn action-btn-share"
              aria-label="How to read this dashboard"
              onClick={onOpenMethodology}
            >
              <IconInfo />
            </button>
            <button type="button" className="action-btn action-btn-share" aria-label="Share">
              <IconShare />
            </button>
            <button type="button" className="action-btn action-btn-primary">
              <IconExport /> Download
            </button>
          </div>
      </div>
    </header>
  );
}
