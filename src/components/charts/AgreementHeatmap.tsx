import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatDelta,
  generateHealthWellbeingInsight,
  pickYearValue,
  type WellbeingHeatmapRow,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';

interface AgreementHeatmapProps {
  rows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
  embedded?: boolean;
  fillHeight?: boolean;
}

const DEFAULT_MAX_BODY_HEIGHT = 220;
const ROW_HEIGHT = 40;

function riskHeatColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped >= 70) return `rgba(201, 106, 82, ${0.3 + ((clamped - 70) / 30) * 0.5})`;
  if (clamped >= 40) return `rgba(245, 158, 11, ${0.28 + ((clamped - 40) / 30) * 0.38})`;
  return `rgba(16, 185, 129, ${0.22 + ((40 - clamped) / 40) * 0.38})`;
}

function riskHeatTextColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  return clamped >= 55 ? '#ffffff' : '#1f2937';
}

function getRiskChangeClassName(movement: number, cellValue: number): string {
  const trendClass =
    movement > 0 ? 'growth-negative' : movement < 0 ? 'growth-positive' : 'growth-neutral';
  const invertClass =
    riskHeatTextColor(cellValue) === '#ffffff' ? ' health-heatmap-cell-change-invert' : '';
  return `health-heatmap-cell-change ${trendClass}${invertClass}`;
}

function formatRiskMovementLabel(movement: number): string {
  if (Math.abs(movement) < 0.5) return '0%';
  return formatDelta(movement);
}

function getRiskMovementClassName(movement: number, cellValue: number): string {
  if (Math.abs(movement) < 0.5) {
    const invertClass =
      riskHeatTextColor(cellValue) === '#ffffff' ? ' health-heatmap-cell-change-invert' : '';
    return `health-heatmap-cell-change growth-neutral${invertClass}`;
  }
  return getRiskChangeClassName(movement, cellValue);
}

function WellbeingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" />
    </svg>
  );
}

export function AgreementHeatmap({
  rows,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_BODY_HEIGHT,
  embedded = false,
  fillHeight = false,
}: AgreementHeatmapProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const insight = generateHealthWellbeingInsight(rows, displayYear);

  const currentAgreement = (row: WellbeingHeatmapRow) =>
    pickYearValue(row.agreement2024, row.agreement2025, displayYear);

  const rowsHeight = rows.length * ROW_HEIGHT;
  const isScrollable = !fillHeight && rows.length > 0 && rowsHeight > maxBodyHeight;
  const shouldCapHeight = embedded && !fillHeight;
  const laneSubtitle = isYoY
    ? `${compareYears[0]} vs ${compareYears[1]} reported problems — higher agreement means more concern, not improvement.`
    : `Reported wellbeing problems for ${displayYear} — shown separately from SCORE_5 (Q501 + Q502).`;

  const heatmapBody = (
    <div className={`chart-card-body agreement-heatmap-body${embedded ? ' agreement-heatmap-body-embedded' : ''}`}>
      {rows.length === 0 ? (
        <p className="statement-lollipop-empty">No Q508 wellbeing context data available.</p>
      ) : (
        <div
          className={`health-heatmap agreement-heatmap agreement-heatmap--risk${
            fillHeight ? ' agreement-heatmap-fill-height' : ''
          }`}
        >
          <div className={`health-heatmap-grid agreement-heatmap-grid ${!isYoY ? 'health-heatmap-grid--single' : ''}`}>
            <div className="health-heatmap-header">
              <span className="health-heatmap-corner" />
              {isYoY && <span className="health-heatmap-column">{compareYears[0]}</span>}
              <span className="health-heatmap-column">{isYoY ? compareYears[1] : displayYear}</span>
            </div>
            <div
              className={`agreement-heatmap-scroll${isScrollable ? ' is-scrollable' : ''}${
                fillHeight ? ' agreement-heatmap-scroll-fill' : ''
              }`}
              style={shouldCapHeight ? { maxHeight: maxBodyHeight } : undefined}
            >
              {rows.map((row) => {
                const agreement = currentAgreement(row);
                return (
                  <div className="health-heatmap-row agreement-heatmap-row" key={row.fullName}>
                    <div className="health-heatmap-label" title={row.fullName}>
                      <span className="health-heatmap-label-icon agreement-heatmap-label-icon">
                        <WellbeingIcon />
                      </span>
                      <span className="health-heatmap-label-text">{row.name}</span>
                    </div>
                    {isYoY && (
                      <div
                        className="health-heatmap-cell"
                        style={{
                          background: riskHeatColor(row.agreement2024),
                          color: riskHeatTextColor(row.agreement2024),
                        }}
                        title={`${row.fullName} (${compareYears[0]}): ${row.agreement2024.toFixed(1)}%`}
                      >
                        <span className="health-heatmap-cell-value">{row.agreement2024.toFixed(0)}%</span>
                      </div>
                    )}
                    <div
                      className="health-heatmap-cell"
                      style={{
                        background: riskHeatColor(agreement),
                        color: riskHeatTextColor(agreement),
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
                          <span className={getRiskMovementClassName(row.movement, agreement)}>
                            {formatRiskMovementLabel(row.movement)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="health-heatmap-scale agreement-heatmap-scale">
            <span>Lower reported problems</span>
            <span className="health-heatmap-scale-bar agreement-heatmap-scale-bar" aria-hidden="true" />
            <span>Higher reported problems</span>
          </div>
        </div>
      )}
    </div>
  );

  const insightFooter = (
    <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
      <ChartInsightFooter chartTitle="Q508 wellbeing context" insight={insight} singleLine />
    </div>
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--wellbeing housing-assessment-lane-card--risk">
        <div className="health-assessment-lane-card-header">
          <ChartSectionHeader
            icon="risk-register"
            title="Q508 wellbeing context"
            subtitle={laneSubtitle}
            titleClassName="health-assessment-lane-card-title"
            subtitleClassName="health-assessment-lane-card-subtitle"
          />
          <div className="health-assessment-lane-card-actions">
            <span className="statement-lollipop-badge is-risk">Risk context</span>
          </div>
        </div>
        {heatmapBody}
        {insightFooter}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill agreement-heatmap-card">
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="risk-register"
          title="Q508 wellbeing context"
          subtitle={laneSubtitle}
        />
        <div className="chart-header-actions">
          <span className="statement-lollipop-badge is-risk">Risk context</span>
        </div>
      </div>
      {heatmapBody}
      {insightFooter}
    </div>
  );
}
