import { useEffect, useState } from 'react';
import type { SurveyData, TabId, ViewMode, SurveyYear } from './types';
import { PILLAR_TABS, SURVEY_YEARS } from './types';
import { Header } from './components/Header';
import { InsightsPanel } from './components/InsightsPanel';
import { OverviewCharts } from './components/OverviewTab';
import { PillarCharts } from './components/PillarTab';
import { KpiCards, buildOverviewKpis, buildPillarKpis, buildDemographicsKpis, buildIncomeKpis, buildWorkKpis, buildEducationKpis, buildSecurityKpis, buildHealthKpis, buildEnvironmentKpis, buildInfrastructureKpis } from './components/KpiCards';

const VIEW_MODE_STORAGE_KEY = 'alfalah-view-mode';
const SELECTED_YEAR_STORAGE_KEY = 'alfalah-selected-year';
const TAB_STORAGE_KEY = 'alfalah-active-tab';
const VIEW_MODE_PARAM = 'view';
const YEAR_PARAM = 'year';
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
  const year = readSelectedYearFromUrl() ?? readSelectedYearFromSession() ?? '2025';
  const mode = readViewModeFromUrl() ?? readViewModeFromSession() ?? 'yoy';
  if (year === '2024' && mode === 'yoy') return 'current';
  return mode;
}

function persistViewMode(mode: ViewMode) {
  writeViewModeToUrl(mode);
  writeViewModeToSession(mode);
  writeViewModeToStorage(mode);
}

function persistFilters(mode: ViewMode, year: SurveyYear) {
  persistViewMode(mode);
  persistSelectedYear(year);
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
    persistFilters(viewMode, selectedYear);
    persistActiveTab(activeTab);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const mode = readViewModeFromUrl() ?? readViewModeFromSession();
      const year = readSelectedYearFromUrl() ?? readSelectedYearFromSession();
      const tab = readActiveTabFromUrl() ?? readActiveTabFromSession();
      if (mode) setViewMode(mode);
      if (year) setSelectedYear(year);
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    if (selectedYear === '2024' && mode === 'yoy') return;
    persistFilters(mode, selectedYear);
    setViewMode(mode);
  };

  const handleSelectedYearChange = (year: SurveyYear) => {
    persistFilters('current', year);
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
      ? buildOverviewKpis(data, viewMode, selectedYear)
      : activeTab === 'demographics' && activeSection
        ? buildDemographicsKpis(activeSection, viewMode, selectedYear)
        : activeTab === 'income' && activeSection
          ? buildIncomeKpis(data, activeSection, viewMode, selectedYear)
          : activeTab === 'work' && activeSection
            ? buildWorkKpis(activeSection, viewMode, selectedYear)
            : activeTab === 'education' && activeSection
              ? buildEducationKpis(activeSection, viewMode, selectedYear)
              : activeTab === 'security' && activeSection
                ? buildSecurityKpis(activeSection, viewMode, selectedYear)
                : activeTab === 'health' && activeSection
                  ? buildHealthKpis(activeSection, viewMode, selectedYear)
                  : activeTab === 'environment' && activeSection
                    ? buildEnvironmentKpis(activeSection, viewMode, selectedYear)
                    : activeTab === 'infrastructure' && activeSection
                      ? buildInfrastructureKpis(activeSection, viewMode, selectedYear)
                      : activeSection?.score
                ? buildPillarKpis(activeSection.score, viewMode, selectedYear)
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
        onViewModeChange={handleViewModeChange}
        selectedYear={selectedYear}
        onSelectedYearChange={handleSelectedYearChange}
        availableYears={SURVEY_YEARS}
        updatedAt={data.updatedAt}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabId)}
        tabs={PILLAR_TABS}
      />
      <div className="dashboard-content">
        <KpiCards items={kpiItems} viewMode={viewMode} />
        <div className="dashboard-split">
          {activeTab === 'overview' ? (
            <OverviewCharts data={data} viewMode={viewMode} selectedYear={selectedYear} />
          ) : activeSection ? (
            <PillarCharts section={activeSection} viewMode={viewMode} selectedYear={selectedYear} />
          ) : (
            <div className="error-state">Section not found</div>
          )}
          <InsightsPanel data={data} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
