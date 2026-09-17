import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import { formatCompareYearsLabel, type StatementComparisonItem, type WellbeingHeatmapRow } from '../../utils';
import { EnvironmentDomainHeatmap } from './EnvironmentDomainHeatmap';
import { EnvironmentStatementChart } from './EnvironmentStatementChart';
import { PillarTabIcon } from './PillarTabIcon';

interface EnvironmentAssessmentCardProps {
  positiveItems: StatementComparisonItem[];
  insectsRisk: StatementComparisonItem | null;
  domainRows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  title?: string;
  maxBodyHeight?: number;
}

const DEFAULT_LANE_CHART_MAX_HEIGHT = 220;

export function EnvironmentAssessmentCard({
  positiveItems,
  insectsRisk,
  domainRows,
  compareYears,
  year,
  viewMode,
  title = 'Environment assessment',
  maxBodyHeight = DEFAULT_LANE_CHART_MAX_HEIGHT,
}: EnvironmentAssessmentCardProps) {
  const isYoY = viewMode === 'yoy';
  const shellSubtitle = isYoY
    ? `Q601 positive statements and domain satisfaction (${formatCompareYearsLabel(compareYears)}).`
    : `Q601 positive statements and domain satisfaction for ${year}.`;

  return (
    <section className="environment-assessment-shell-card" aria-label={title}>
      <header className="environment-assessment-shell-header">
        <div className="environment-assessment-shell-heading">
          <span className="environment-assessment-shell-icon" aria-hidden="true">
            <PillarTabIcon name="leaf" size={20} />
          </span>
          <div className="environment-assessment-shell-heading-text">
            <h2 className="environment-assessment-shell-title">{title}</h2>
            <p className="environment-assessment-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="environment-assessment-shell-grid">
        <EnvironmentStatementChart
          positiveItems={positiveItems}
          insectsRisk={insectsRisk}
          compareYears={compareYears}
          year={year}
          viewMode={viewMode}
          maxBodyHeight={maxBodyHeight}
          embedded
        />
        <EnvironmentDomainHeatmap
          rows={domainRows}
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
