import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import { formatCompareYearsLabel, type StatementComparisonItem, type WellbeingHeatmapRow } from '../../utils';
import { InfrastructureServiceScorecard } from './InfrastructureServiceScorecard';
import { InfrastructureStatementChangeChart } from './InfrastructureStatementChangeChart';
import { PillarTabIcon } from './PillarTabIcon';

interface InfrastructureAssessmentCardProps {
  statementItems: StatementComparisonItem[];
  serviceRows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  title?: string;
  maxBodyHeight?: number;
}

const DEFAULT_LANE_CHART_MAX_HEIGHT = 220;

export function InfrastructureAssessmentCard({
  statementItems,
  serviceRows,
  compareYears,
  year,
  viewMode,
  title = 'Infrastructure assessment',
  maxBodyHeight = DEFAULT_LANE_CHART_MAX_HEIGHT,
}: InfrastructureAssessmentCardProps) {
  const isYoY = viewMode === 'yoy';
  const shellSubtitle = isYoY
    ? `Q801 statement movement and service-access satisfaction (${formatCompareYearsLabel(compareYears)}).`
    : `Q801 statement movement and service-access satisfaction for ${year}.`;

  return (
    <section className="infrastructure-assessment-shell-card" aria-label={title}>
      <header className="infrastructure-assessment-shell-header">
        <div className="infrastructure-assessment-shell-heading">
          <span className="infrastructure-assessment-shell-icon" aria-hidden="true">
            <PillarTabIcon name="building" size={20} />
          </span>
          <div className="infrastructure-assessment-shell-heading-text">
            <h2 className="infrastructure-assessment-shell-title">{title}</h2>
            <p className="infrastructure-assessment-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="infrastructure-assessment-shell-grid">
        <InfrastructureStatementChangeChart
          items={statementItems}
          compareYears={compareYears}
          year={year}
          viewMode={viewMode}
          maxBodyHeight={maxBodyHeight}
          embedded
        />
        <InfrastructureServiceScorecard
          rows={serviceRows}
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
