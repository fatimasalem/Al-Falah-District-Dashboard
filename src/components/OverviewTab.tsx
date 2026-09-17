import type { CompareYears, SurveyData, SurveyYear, ViewMode } from '../types';
import { OverallDistrictScoreCard } from './executive/OverallDistrictScoreCard';
import { ExecutiveDecisionLens } from './executive/ExecutiveDecisionLens';
import {
  computeUnweightedOverallScore,
  getPillarDumbbellData,
  getEvidenceCoverageSummary,
  getMomentumMatrixData,
  getResidualRiskRegister,
} from '../utils';

interface OverviewChartsProps {
  data: SurveyData;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

export function OverviewCharts({ data, viewMode, selectedYear, compareYears }: OverviewChartsProps) {
  const chartYear = viewMode === 'yoy' ? compareYears[1] : selectedYear;
  const overall2024 = computeUnweightedOverallScore(data, compareYears[0]);
  const overall2025 = computeUnweightedOverallScore(data, compareYears[1]);
  const overallScore = computeUnweightedOverallScore(data, chartYear);
  const coverage = getEvidenceCoverageSummary(data);
  const dumbbellItems = getPillarDumbbellData(data);
  const momentumItems = getMomentumMatrixData(data, compareYears, chartYear);
  const riskItems = getResidualRiskRegister(data, compareYears, chartYear);

  return (
    <div className="main-content overview-landing">
      <section className="overview-hero">
        <OverallDistrictScoreCard
          score={overallScore}
          score2024={overall2024}
          score2025={overall2025}
          approvedCount={coverage.approvedCount}
          totalCount={coverage.totalCount}
          year={chartYear}
          viewMode={viewMode}
          compareYears={compareYears}
          pillarItems={dumbbellItems}
          selectedYear={selectedYear}
        />
      </section>

      <section className="overview-executive">
        <ExecutiveDecisionLens
          momentumItems={momentumItems}
          riskItems={riskItems}
          viewMode={viewMode}
          selectedYear={selectedYear}
          compareYears={compareYears}
        />
      </section>
    </div>
  );
}
