import { useEffect, useState } from 'react';
import type { SurveyData, TabId, ViewMode } from './types';
import { PILLAR_TABS } from './types';
import { Header } from './components/Header';
import { InsightsPanel } from './components/InsightsPanel';
import { OverviewCharts } from './components/OverviewTab';
import { PillarCharts } from './components/PillarTab';
import { KpiCards, buildOverviewKpis, buildPillarKpis, buildDemographicsKpis } from './components/KpiCards';

export default function App() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('current');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/survey-data.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load survey data');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  if (!data) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const activeSection = activeTab !== 'overview' ? data.sections[activeTab] : null;
  const kpiItems =
    activeTab === 'overview'
      ? buildOverviewKpis(data, viewMode)
      : activeTab === 'demographics' && activeSection
        ? buildDemographicsKpis(activeSection, viewMode)
        : activeSection?.score
          ? buildPillarKpis(activeSection.score, viewMode)
          : [];

  return (
    <div className="dashboard">
      {data.isDemoData && (
        <div className="demo-banner">
          This is a demo of the dashboard.
          {/* Demo data — the attached Excel file contains survey structure only. Replace with populated data and run{' '} */}
          {/* <code>npm run data:build</code> to load real values. */}
        </div>
      )}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        updatedAt={data.updatedAt}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        tabs={PILLAR_TABS}
      />
      <div className="dashboard-content">
        <KpiCards items={kpiItems} viewMode={viewMode} />
        <div className="dashboard-split">
          {activeTab === 'overview' ? (
            <OverviewCharts data={data} viewMode={viewMode} />
          ) : activeSection ? (
            <PillarCharts section={activeSection} viewMode={viewMode} />
          ) : (
            <div className="error-state">Section not found</div>
          )}
          <InsightsPanel data={data} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
