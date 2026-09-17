import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import { formatCompareYearsLabel, type StatementComparisonItem, type WellbeingHeatmapRow } from '../../utils';
import { AgreementHeatmap } from './AgreementHeatmap';
import { HealthSubgroupChart } from './HealthSubgroupChart';
import { PillarTabIcon } from './PillarTabIcon';

interface HealthAssessmentCardProps {
  centresItems: StatementComparisonItem[];
  systemItems: StatementComparisonItem[];
  wellbeingRows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  calculatedScore: number;
  q501Score: number;
  q502Score: number;
  title?: string;
  maxBodyHeight?: number;
}

const DEFAULT_LANE_CHART_MAX_HEIGHT = 220;

export function HealthAssessmentCard({
  centresItems,
  systemItems,
  wellbeingRows,
  compareYears,
  year,
  viewMode,
  calculatedScore,
  q501Score,
  q502Score,
  title = 'Healthcare assessment',
  maxBodyHeight = DEFAULT_LANE_CHART_MAX_HEIGHT,
}: HealthAssessmentCardProps) {
  const isYoY = viewMode === 'yoy';
  const shellSubtitle = isYoY
    ? `Q501 and Q502 assessments plus Q508 wellbeing context (${formatCompareYearsLabel(compareYears)}).`
    : `Q501 and Q502 assessments plus Q508 wellbeing context for ${year}.`;

  return (
    <section className="health-assessment-shell-card" aria-label={title}>
      <header className="health-assessment-shell-header">
        <div className="health-assessment-shell-heading">
          <span className="health-assessment-shell-icon" aria-hidden="true">
            <PillarTabIcon name="heart" size={20} />
          </span>
          <div className="health-assessment-shell-heading-text">
            <h2 className="health-assessment-shell-title">{title}</h2>
            <p className="health-assessment-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="health-assessment-shell-grid">
        <HealthSubgroupChart
          centresItems={centresItems}
          systemItems={systemItems}
          compareYears={compareYears}
          year={year}
          viewMode={viewMode}
          calculatedScore={calculatedScore}
          q501Score={q501Score}
          q502Score={q502Score}
          maxBodyHeight={maxBodyHeight}
          embedded
        />
        <AgreementHeatmap
          rows={wellbeingRows}
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
