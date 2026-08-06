import type { SurveyData, SurveyYear, ViewMode } from '../types';
import {
  PartnerChart,
  DataTable,
  EducationDivergingBar,
  HealthHeatmapChart,
  EnvironmentStackedBar,
} from './Charts';
import {
  getEducationChartData,
  getEnvironmentChartData,
  getHealthHeatmapData,
  getScoreValue,
  pickYearValue,
} from '../utils';

interface OverviewChartsProps {
  data: SurveyData;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
}

export function OverviewCharts({ data, viewMode, selectedYear }: OverviewChartsProps) {
  const scores = Object.values(data.sectionScores)
    .map((s) => ({
      name: s.sectionNameEn,
      fullName: s.sectionNameEn,
      score2024: s.score2024,
      score2025: s.score2025,
      value2024: s.score2024,
      value2025: s.score2025,
      value: viewMode === 'current'
        ? pickYearValue(s.score2024, s.score2025, selectedYear)
        : s.yoyChange,
      satisfied: pickYearValue(s.positive2024, s.positive2025, selectedYear),
      unsatisfied: pickYearValue(s.negative2024, s.negative2025, selectedYear),
    }))
    .sort((a, b) => b.score2025 - a.score2025);

  const partnerData = scores.map((s) => ({
    name: s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name,
    fullName: s.fullName,
    value: viewMode === 'current'
      ? pickYearValue(s.value2024, s.value2025, selectedYear)
      : s.value2025 - s.value2024,
    value2024: s.score2024,
    value2025: s.score2025,
  }));

  const tableRows = Object.values(data.sectionScores)
    .map((s) => ({
      pillar: s.sectionNameEn,
      score2024: s.score2024,
      score2025: s.score2025,
      satisfied2024: s.positive2024,
      satisfied2025: s.positive2025,
      unsatisfied2024: s.negative2024,
      unsatisfied2025: s.negative2025,
    }))
    .sort((a, b) => b.score2025 - a.score2025);

  const educationSection = data.sections.education;
  const environmentSection = data.sections.environment;
  const healthSection = data.sections.health;
  const healthScore = data.sectionScores.health;
  const educationScore = data.sectionScores.education!;
  const environmentScore = data.sectionScores.environment!;

  const educationData = educationSection
    ? getEducationChartData(educationSection, selectedYear)
    : [];
  const educationData2024 = educationSection
    ? getEducationChartData(educationSection, '2024')
    : [];
  const environmentData = environmentSection
    ? getEnvironmentChartData(environmentSection, selectedYear)
    : [];
  const environmentData2024 = environmentSection
    ? getEnvironmentChartData(environmentSection, '2024')
    : [];
  const healthHeatmapData = healthSection
    ? getHealthHeatmapData(healthSection)
    : [];

  return (
    <div className="main-content">
      <div className="chart-grid-overview">
        <PartnerChart data={partnerData} mode={viewMode} year={selectedYear} />
        {educationData.length > 0 && (
          <EducationDivergingBar
            data={educationData}
            data2024={educationData2024}
            mode={viewMode}
            year={selectedYear}
            score={getScoreValue(educationScore, viewMode, selectedYear)}
          />
        )}
        {healthHeatmapData.length > 0 && healthScore && (
          <HealthHeatmapChart
            heatmapData={healthHeatmapData}
            sectionScore={healthScore}
            mode={viewMode}
            year={selectedYear}
          />
        )}
        {environmentData.length > 0 && (
          <EnvironmentStackedBar
            data={environmentData}
            data2024={environmentData2024}
            mode={viewMode}
            year={selectedYear}
            score={getScoreValue(environmentScore, viewMode, selectedYear)}
          />
        )}
      </div>
      <DataTable rows={tableRows} mode={viewMode} year={selectedYear} />
    </div>
  );
}
