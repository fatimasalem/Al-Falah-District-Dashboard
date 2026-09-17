import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatDelta,
  generateInfrastructureServiceScorecardInsight,
  pickYearValue,
  type WellbeingHeatmapRow,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';

interface InfrastructureServiceScorecardProps {
  rows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
  embedded?: boolean;
  fillHeight?: boolean;
}

const DEFAULT_MAX_BODY_HEIGHT = 220;
const ROW_HEIGHT = 48;

function satisfactionHeatColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped >= 70) return `rgba(16, 185, 129, ${0.3 + ((clamped - 70) / 30) * 0.5})`;
  if (clamped >= 40) return `rgba(245, 158, 11, ${0.28 + ((clamped - 40) / 30) * 0.38})`;
  return `rgba(201, 106, 82, ${0.22 + ((40 - clamped) / 40) * 0.38})`;
}

function satisfactionHeatTextColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  return clamped >= 55 ? '#ffffff' : '#1f2937';
}

function getServiceChangeClassName(movement: number, cellValue: number): string {
  const trendClass =
    movement > 0 ? 'growth-positive' : movement < 0 ? 'growth-negative' : 'growth-neutral';
  const invertClass =
    satisfactionHeatTextColor(cellValue) === '#ffffff' ? ' health-heatmap-cell-change-invert' : '';
  return `health-heatmap-cell-change ${trendClass}${invertClass}`;
}

function formatServiceMovementLabel(movement: number): string {
  if (Math.abs(movement) < 0.5) return '0%';
  return formatDelta(movement);
}

function getServiceMovementClassName(movement: number, cellValue: number): string {
  if (Math.abs(movement) < 0.5) {
    const invertClass =
      satisfactionHeatTextColor(cellValue) === '#ffffff' ? ' health-heatmap-cell-change-invert' : '';
    return `health-heatmap-cell-change growth-neutral${invertClass}`;
  }
  return getServiceChangeClassName(movement, cellValue);
}

function ServiceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function InfrastructureServiceScorecard({
  rows,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_BODY_HEIGHT,
  embedded = false,
  fillHeight = false,
}: InfrastructureServiceScorecardProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const insight = generateInfrastructureServiceScorecardInsight(rows, displayYear);

  const currentAgreement = (row: WellbeingHeatmapRow) =>
    pickYearValue(row.agreement2024, row.agreement2025, displayYear);

  const rowsHeight = rows.length * ROW_HEIGHT;
  const isScrollable = !fillHeight && rows.length > 0 && rowsHeight > maxBodyHeight;
  const shouldCapHeight = embedded && !fillHeight;

  const laneSubtitle = isYoY
    ? `${compareYears[0]} vs ${compareYears[1]} satisfaction across five core infrastructure services.`
    : `Service-access satisfaction for ${displayYear} — utilities, retail, mental health, and sports.`;

  const scorecardBody = (
    <div className={`chart-card-body agreement-heatmap-body infrastructure-service-scorecard-body${embedded ? ' agreement-heatmap-body-embedded' : ''}`}>
      {rows.length === 0 ? (
        <p className="statement-lollipop-empty">No infrastructure service-access data available.</p>
      ) : (
        <div className="health-heatmap agreement-heatmap agreement-heatmap--positive">
          <div className={`health-heatmap-grid agreement-heatmap-grid ${!isYoY ? 'health-heatmap-grid--single' : ''}`}>
            <div className="health-heatmap-header">
              <span className="health-heatmap-corner" />
              {isYoY && <span className="health-heatmap-column">{compareYears[0]}</span>}
              <span className="health-heatmap-column">{isYoY ? compareYears[1] : displayYear}</span>
            </div>
            <div
              className={`agreement-heatmap-scroll${isScrollable || shouldCapHeight ? ' is-scrollable' : ''}`}
              style={isScrollable || shouldCapHeight ? { maxHeight: maxBodyHeight } : undefined}
            >
              {rows.map((row) => {
                const agreement = currentAgreement(row);
                return (
                  <div className="health-heatmap-row agreement-heatmap-row" key={row.fullName}>
                    <div className="health-heatmap-label" title={row.fullName}>
                      <span className="health-heatmap-label-icon agreement-heatmap-label-icon">
                        <ServiceIcon />
                      </span>
                      <span className="health-heatmap-label-text">{row.name}</span>
                    </div>
                    {isYoY && (
                      <div
                        className="health-heatmap-cell"
                        style={{
                          background: satisfactionHeatColor(row.agreement2024),
                          color: satisfactionHeatTextColor(row.agreement2024),
                        }}
                        title={`${row.fullName} (${compareYears[0]}): ${row.agreement2024.toFixed(1)}%`}
                      >
                        <span className="health-heatmap-cell-value">{row.agreement2024.toFixed(0)}%</span>
                      </div>
                    )}
                    <div
                      className="health-heatmap-cell"
                      style={{
                        background: satisfactionHeatColor(agreement),
                        color: satisfactionHeatTextColor(agreement),
                      }}
                      title={
                        isYoY
                          ? `${row.fullName} (${compareYears[1]}): ${agreement.toFixed(1)}% (${formatDelta(row.movement)})`
                          : `${row.fullName} (${displayYear}): ${agreement.toFixed(1)}%`
                      }
                    >
                      <div className={`health-heatmap-cell-content${isYoY ? ' health-heatmap-cell-content-inline' : ''}`}>
                        <span className="health-heatmap-cell-value">{agreement.toFixed(0)}%</span>
                        {isYoY && (
                          <span className={getServiceMovementClassName(row.movement, agreement)}>
                            {formatServiceMovementLabel(row.movement)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="health-heatmap-scale agreement-heatmap-scale infrastructure-service-scorecard-scale">
            <span>Lower satisfaction</span>
            <span className="health-heatmap-scale-bar agreement-heatmap-scale-bar infrastructure-service-scorecard-scale-bar" aria-hidden="true" />
            <span>Higher satisfaction</span>
          </div>
        </div>
      )}
    </div>
  );

  const insightFooter = (
    <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
      <ChartInsightFooter chartTitle="Service-access scorecard" insight={insight} singleLine />
    </div>
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--domain infrastructure-assessment-lane-card--services">
        <div className="health-assessment-lane-card-header">
          <ChartSectionHeader
            icon="compare"
            title="Service-access scorecard"
            subtitle={laneSubtitle}
            titleClassName="health-assessment-lane-card-title"
            subtitleClassName="health-assessment-lane-card-subtitle"
          />
          <div className="health-assessment-lane-card-actions">
            <span className="statement-lollipop-badge is-positive">Service view</span>
          </div>
        </div>
        {scorecardBody}
        {insightFooter}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill chart-positive-lane infrastructure-service-scorecard-card">
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="compare"
          title="Service-access scorecard"
          subtitle={laneSubtitle}
        />
        <div className="chart-header-actions">
          <span className="statement-lollipop-badge is-positive">Service view</span>
        </div>
      </div>
      {scorecardBody}
      {insightFooter}
    </div>
  );
}
