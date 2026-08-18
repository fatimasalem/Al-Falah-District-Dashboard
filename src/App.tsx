import { useEffect, useState } from 'react';
import type { SurveyData, TabId, ViewMode, SurveyYear, CompareYears } from './types';
import { PILLAR_TABS, SURVEY_YEARS, DEFAULT_COMPARE_YEARS } from './types';
import { normalizeCompareYears } from './utils';
import { Header } from './components/Header';
import { InsightsPanel } from './components/InsightsPanel';
import { OverviewCharts } from './components/OverviewTab';
import { PillarCharts } from './components/PillarTab';
import { KpiCards, buildOverviewKpis, buildPillarKpis, buildDemographicsKpis, buildIncomeKpis, buildWorkKpis, buildEducationKpis, buildSecurityKpis, buildHealthKpis, buildEnvironmentKpis, buildInfrastructureKpis, buildHousingKpis } from './components/KpiCards';

const VIEW_MODE_STORAGE_KEY = 'alfalah-view-mode';
const SELECTED_YEAR_STORAGE_KEY = 'alfalah-selected-year';
const COMPARE_YEARS_STORAGE_KEY = 'alfalah-compare-years';
const TAB_STORAGE_KEY = 'alfalah-active-tab';
const VIEW_MODE_PARAM = 'view';
const YEAR_PARAM = 'year';
const COMPARE_PARAM = 'compare';
const TAB_PARAM = 'tab';

function isViewMode(value: string | null): value is ViewMode {
  return value === 'current' || value === 'yoy';
}

function isSurveyYear(value: string | null): value is SurveyYear {
  return value === '2024' || value === '2025';
}

function isTabId(value: string | null): value is TabId {
  return PILLAR_TABS.some((tab) => tab.id === value);
}

function readViewModeFromUrl(): ViewMode | null {
  const value = new URLSearchParams(window.location.search).get(VIEW_MODE_PARAM);
  return isViewMode(value) ? value : null;
}

function readViewModeFromSession(): ViewMode | null {
  try {
    const stored = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return isViewMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeViewModeToSession(mode: ViewMode) {
  try {
    sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage access errors
  }
}

function writeViewModeToStorage(mode: ViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage access errors
  }
}

function parseCompareYears(value: string | null): CompareYears | null {
  if (!value) return null;
  const parts = value.split(',');
  if (parts.length !== 2 || !isSurveyYear(parts[0]) || !isSurveyYear(parts[1])) return null;
  return normalizeCompareYears([parts[0], parts[1]]);
}

function readCompareYearsFromUrl(): CompareYears | null {
  return parseCompareYears(new URLSearchParams(window.location.search).get(COMPARE_PARAM));
}

function readCompareYearsFromSession(): CompareYears | null {
  try {
    const stored = sessionStorage.getItem(COMPARE_YEARS_STORAGE_KEY);
    return parseCompareYears(stored);
  } catch {
    return null;
  }
}

function writeCompareYearsToSession(years: CompareYears) {
  try {
    sessionStorage.setItem(COMPARE_YEARS_STORAGE_KEY, years.join(','));
  } catch {
    // ignore storage access errors
  }
}

function writeCompareYearsToStorage(years: CompareYears) {
  try {
    localStorage.setItem(COMPARE_YEARS_STORAGE_KEY, years.join(','));
  } catch {
    // ignore storage access errors
  }
}

function writeCompareYearsToUrl(years: CompareYears) {
  const url = new URL(window.location.href);
  url.searchParams.set(COMPARE_PARAM, years.join(','));
  window.history.replaceState(window.history.state, '', url);
}

function getInitialCompareYears(): CompareYears {
  return readCompareYearsFromUrl() ?? readCompareYearsFromSession() ?? DEFAULT_COMPARE_YEARS;
}

function persistCompareYears(years: CompareYears) {
  writeCompareYearsToUrl(years);
  writeCompareYearsToSession(years);
  writeCompareYearsToStorage(years);
}

function readSelectedYearFromUrl(): SurveyYear | null {
  const value = new URLSearchParams(window.location.search).get(YEAR_PARAM);
  return isSurveyYear(value) ? value : null;
}

function readSelectedYearFromSession(): SurveyYear | null {
  try {
    const stored = sessionStorage.getItem(SELECTED_YEAR_STORAGE_KEY);
    return isSurveyYear(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeSelectedYearToSession(year: SurveyYear) {
  try {
    sessionStorage.setItem(SELECTED_YEAR_STORAGE_KEY, year);
  } catch {
    // ignore storage access errors
  }
}

function writeSelectedYearToStorage(year: SurveyYear) {
  try {
    localStorage.setItem(SELECTED_YEAR_STORAGE_KEY, year);
  } catch {
    // ignore storage access errors
  }
}

function writeSelectedYearToUrl(year: SurveyYear) {
  const url = new URL(window.location.href);
  url.searchParams.set(YEAR_PARAM, year);
  window.history.replaceState(window.history.state, '', url);
}

function getInitialSelectedYear(): SurveyYear {
  return readSelectedYearFromUrl() ?? readSelectedYearFromSession() ?? '2025';
}

function persistSelectedYear(year: SurveyYear) {
  writeSelectedYearToUrl(year);
  writeSelectedYearToSession(year);
  writeSelectedYearToStorage(year);
}

function writeViewModeToUrl(mode: ViewMode) {
  const url = new URL(window.location.href);
  url.searchParams.set(VIEW_MODE_PARAM, mode);
  window.history.replaceState(window.history.state, '', url);
}

function getInitialViewMode(): ViewMode {
  return readViewModeFromUrl() ?? readViewModeFromSession() ?? 'yoy';
}

function persistViewMode(mode: ViewMode) {
  writeViewModeToUrl(mode);
  writeViewModeToSession(mode);
  writeViewModeToStorage(mode);
}

function persistFilters(mode: ViewMode, year: SurveyYear, compareYears: CompareYears) {
  persistViewMode(mode);
  persistSelectedYear(year);
  persistCompareYears(compareYears);
}

function readActiveTabFromUrl(): TabId | null {
  const value = new URLSearchParams(window.location.search).get(TAB_PARAM);
  return isTabId(value) ? value : null;
}

function readActiveTabFromSession(): TabId | null {
  try {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    return isTabId(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeActiveTabToSession(tab: TabId) {
  try {
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // ignore storage access errors
  }
}

function writeActiveTabToStorage(tab: TabId) {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // ignore storage access errors
  }
}

function writeActiveTabToUrl(tab: TabId) {
  const url = new URL(window.location.href);
  url.searchParams.set(TAB_PARAM, tab);
  window.history.replaceState(window.history.state, '', url);
}

function getInitialActiveTab(): TabId {
  return readActiveTabFromUrl() ?? readActiveTabFromSession() ?? 'overview';
}

function persistActiveTab(tab: TabId) {
  writeActiveTabToUrl(tab);
  writeActiveTabToSession(tab);
  writeActiveTabToStorage(tab);
}

export default function App() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() => getInitialActiveTab());
  const [viewMode, setViewMode] = useState<ViewMode>(() => getInitialViewMode());
  const [selectedYear, setSelectedYear] = useState<SurveyYear>(() => getInitialSelectedYear());
  const [compareYears, setCompareYears] = useState<CompareYears>(() => getInitialCompareYears());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/survey-data.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load survey data');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    persistFilters(viewMode, selectedYear, compareYears);
    persistActiveTab(activeTab);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const mode = readViewModeFromUrl() ?? readViewModeFromSession();
      const year = readSelectedYearFromUrl() ?? readSelectedYearFromSession();
      const years = readCompareYearsFromUrl() ?? readCompareYearsFromSession();
      const tab = readActiveTabFromUrl() ?? readActiveTabFromSession();
      if (mode) setViewMode(mode);
      if (year) setSelectedYear(year);
      if (years) setCompareYears(years);
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleCompareYearsChange = (years: CompareYears) => {
    persistFilters('yoy', selectedYear, years);
    setCompareYears(years);
    setViewMode('yoy');
  };

  const handleSelectedYearChange = (year: SurveyYear) => {
    persistFilters('current', year, compareYears);
    setSelectedYear(year);
    setViewMode('current');
  };

  const handleTabChange = (tab: TabId) => {
    persistActiveTab(tab);
    setActiveTab(tab);
  };

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  if (!data) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const activeSection = activeTab !== 'overview' ? data.sections[activeTab] : null;
  const kpiItems =
    activeTab === 'overview'
      ? buildOverviewKpis(data, viewMode, selectedYear, compareYears)
      : activeTab === 'demographics' && activeSection
        ? buildDemographicsKpis(activeSection, viewMode, selectedYear, compareYears)
        : activeTab === 'income' && activeSection
          ? buildIncomeKpis(data, activeSection, viewMode, selectedYear, compareYears)
          : activeTab === 'work' && activeSection
            ? buildWorkKpis(activeSection, viewMode, selectedYear, compareYears)
            : activeTab === 'education' && activeSection
              ? buildEducationKpis(activeSection, viewMode, selectedYear, compareYears)
              : activeTab === 'security' && activeSection
                ? buildSecurityKpis(activeSection, viewMode, selectedYear, compareYears)
                : activeTab === 'health' && activeSection
                  ? buildHealthKpis(activeSection, viewMode, selectedYear, compareYears)
                  : activeTab === 'environment' && activeSection
                    ? buildEnvironmentKpis(activeSection, viewMode, selectedYear, compareYears)
                    : activeTab === 'infrastructure' && activeSection
                      ? buildInfrastructureKpis(activeSection, viewMode, selectedYear, compareYears)
                      : activeTab === 'housing' && activeSection
                        ? buildHousingKpis(activeSection, viewMode, selectedYear, compareYears)
                        : activeSection?.score
                ? buildPillarKpis(activeSection.score, viewMode, selectedYear, compareYears)
                : [];

  return (
    <div className="dashboard">
      {data.isDemoData && (
        <div className="demo-banner">
          This is a demo dashboard.
        </div>
      )}
      <Header
        viewMode={viewMode}
        compareYears={compareYears}
        onCompareYearsChange={handleCompareYearsChange}
        selectedYear={selectedYear}
        onSelectedYearChange={handleSelectedYearChange}
        availableYears={SURVEY_YEARS}
        updatedAt={data.updatedAt}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabId)}
        tabs={PILLAR_TABS}
      />
      <div className="dashboard-content">
        <KpiCards items={kpiItems} viewMode={viewMode} compareYears={compareYears} />
        <div className="dashboard-split">
          {activeTab === 'overview' ? (
            <OverviewCharts data={data} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />
          ) : activeSection ? (
            <PillarCharts section={activeSection} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />
          ) : (
            <div className="error-state">Section not found</div>
          )}
          <InsightsPanel data={data} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
