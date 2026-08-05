import type { SurveyData, ViewMode } from '../types';
import {
  PillarScoresChart,
  TrendChart,
  PartnerChart,
  DistributionChart,
  DataTable,
} from './Charts';

interface OverviewChartsProps {
  data: SurveyData;
  viewMode: ViewMode;
}

export function OverviewCharts({ data, viewMode }: OverviewChartsProps) {
  const scores = Object.values(data.sectionScores)
    .map((s) => ({
      name: s.sectionNameEn,
      fullName: s.sectionNameEn,
      score2024: s.score2024,
      score2025: s.score2025,
      value2024: s.score2024,
      value2025: s.score2025,
      value: viewMode === 'current' ? s.score2025 : s.yoyChange,
      positive: s.positive2025,
    }))
    .sort((a, b) => b.score2025 - a.score2025);

  const partnerData = scores.map((s) => ({
    name: s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name,
    fullName: s.fullName,
    value: viewMode === 'current' ? s.score2025 : s.value2025 - s.value2024,
  }));

  const compositionData = scores.slice(0, 6).map((s) => ({
    name: s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name,
    fullName: s.fullName,
    value: viewMode === 'current' ? s.score2025 : s.value2025 - s.value2024,
  }));

  const tableRows = scores.map((s) => ({
    pillar: s.fullName,
    score2024: s.score2024,
    score2025: s.score2025,
    change: s.score2025 - s.score2024,
    positive: s.positive,
  }));

  return (
    <div className="main-content">
      <div className="chart-grid-top">
        <TrendChart
          overall2024={data.overview.overallScore2024}
          overall2025={data.overview.overallScore2025}
          mode={viewMode}
        />
        <PartnerChart data={partnerData} mode={viewMode} />
      </div>
      <div className="chart-grid-bottom">
        <DistributionChart
          data={compositionData}
          title="Pillar Composition (% of Total)"
          subtitle={viewMode === 'current' ? '2025 satisfaction share' : 'YoY change by pillar'}
        />
        <PillarScoresChart
          data={scores}
          mode={viewMode}
          title="Pillar Scores — Annual (%)"
        />
      </div>
      <DataTable rows={tableRows} />
    </div>
  );
}
