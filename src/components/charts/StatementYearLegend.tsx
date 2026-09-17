import type { CompareYears, SurveyYear, ViewMode } from '../../types';

interface StatementYearLegendProps {
  viewMode: ViewMode;
  compareYears: CompareYears;
  year: SurveyYear;
  variant: 'positive' | 'risk';
}

export function StatementYearLegend({
  viewMode,
  compareYears,
  year,
  variant,
}: StatementYearLegendProps) {
  const isYoY = viewMode === 'yoy';
  const currentDotClass = `statement-year-legend-dot is-${variant}`;

  if (isYoY) {
    return (
      <div
        className="pillar-composition-legend statement-year-legend"
        aria-label={`Chart bars show ${compareYears[0]} and ${compareYears[1]} agreement distributions`}
      >
        <span>
          <i className="pillar-composition-legend-dot previous" aria-hidden="true" />
          {compareYears[0]}
        </span>
        <span>
          <i className={currentDotClass} aria-hidden="true" />
          {compareYears[1]}
        </span>
      </div>
    );
  }

  return (
    <div
      className="pillar-composition-legend statement-year-legend"
      aria-label={`Chart bars show ${year} agreement distribution`}
    >
      <span>
        <i className={currentDotClass} aria-hidden="true" />
        {year}
      </span>
    </div>
  );
}
