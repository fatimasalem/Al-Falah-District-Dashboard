import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  type ConditionRiskMatrixItem,
  type StatementComparisonItem,
} from '../../utils';
import { ConditionRiskMatrix } from './ConditionRiskMatrix';
import { HousingStatementChart } from './HousingStatementChart';
import { PillarTabIcon } from './PillarTabIcon';

interface HousingAssessmentCardProps {
  positiveItems: StatementComparisonItem[];
  riskMatrixItems: ConditionRiskMatrixItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  title?: string;
  maxBodyHeight?: number;
}

const DEFAULT_LANE_CHART_MAX_HEIGHT = 220;

export function HousingAssessmentCard({
  positiveItems,
  riskMatrixItems,
  compareYears,
  year,
  viewMode,
  title = 'Housing assessment',
  maxBodyHeight = DEFAULT_LANE_CHART_MAX_HEIGHT,
}: HousingAssessmentCardProps) {
  const isYoY = viewMode === 'yoy';
  const shellSubtitle = isYoY
    ? `Q701 positive statements and condition risk (${formatCompareYearsLabel(compareYears)}).`
    : `Q701 positive statements and condition risk for ${year}.`;

  return (
    <section className="housing-assessment-shell-card" aria-label={title}>
      <header className="housing-assessment-shell-header">
        <div className="housing-assessment-shell-heading">
          <span className="housing-assessment-shell-icon" aria-hidden="true">
            <PillarTabIcon name="home" size={20} />
          </span>
          <div className="housing-assessment-shell-heading-text">
            <h2 className="housing-assessment-shell-title">{title}</h2>
            <p className="housing-assessment-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="housing-assessment-shell-grid">
        <HousingStatementChart
          positiveItems={positiveItems}
          compareYears={compareYears}
          year={year}
          viewMode={viewMode}
          maxBodyHeight={maxBodyHeight}
          embedded
        />
        <ConditionRiskMatrix
          items={riskMatrixItems}
          compareYears={compareYears}
          year={year}
          viewMode={viewMode}
          maxBodyHeight={maxBodyHeight}
          embedded
          fillHeight
        />
      </div>
    </section>
  );
}
