import type { CompareYears, SurveyData, SurveyYear, ViewMode } from '../../types';
import { formatReportingContext } from '../../utils';

interface ReportingControlStripProps {
  data: SurveyData;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
  variant?: 'card' | 'subtitle';
}

export function ReportingControlStrip({
  data,
  viewMode,
  selectedYear,
  compareYears,
  variant = 'subtitle',
}: ReportingControlStripProps) {
  const context = formatReportingContext(data, viewMode, selectedYear, compareYears);
  const surveyPeriod = data.surveyPeriod ?? data.years.join('–');
  const yearLabel = viewMode === 'current' ? context.selectedYear : context.compareLabel;
  const sampleLabel = context.sampleBase != null ? `n = ${context.sampleBase.toLocaleString()}` : 'Sample pending';

  if (variant === 'subtitle') {
    const parts = [
      context.district,
      `${surveyPeriod} survey data`,
      yearLabel,
      sampleLabel,
    ];

    return (
      <p className="page-subtitle" aria-label="Reporting context">
        {parts.join(' · ')}
      </p>
    );
  }

  return (
    <div className="reporting-control-strip" aria-label="Reporting context">
      <div className="reporting-control-strip-inner">
        <div className="reporting-control-item">
          <span className="reporting-control-label">Survey data</span>
          <span className="reporting-control-value">{surveyPeriod}</span>
        </div>
        <div className="reporting-control-divider" aria-hidden="true" />
        <div className="reporting-control-item">
          <span className="reporting-control-label">Selected year</span>
          <span className="reporting-control-value">{yearLabel}</span>
        </div>
        <div className="reporting-control-divider" aria-hidden="true" />
        <div className="reporting-control-item">
          <span className="reporting-control-label">District</span>
          <span className="reporting-control-value">{context.district}</span>
        </div>
        <div className="reporting-control-divider" aria-hidden="true" />
        <div className="reporting-control-item">
          <span className="reporting-control-label">Sample base</span>
          <span className="reporting-control-value">
            {context.sampleBase != null ? `n = ${context.sampleBase}` : 'Pending'}
          </span>
        </div>
        <div className="reporting-control-divider" aria-hidden="true" />
        <div className="reporting-control-item reporting-control-item-wide">
          <span className="reporting-control-label">Measure</span>
          <span className="reporting-control-value">{context.measureDefinition}</span>
        </div>
      </div>
    </div>
  );
}
