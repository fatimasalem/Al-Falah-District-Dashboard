import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatDelta,
  generateHousingConditionRiskInsight,
  pickYearValue,
  type ConditionRiskMatrixItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';

interface ConditionRiskMatrixProps {
  items: ConditionRiskMatrixItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
  embedded?: boolean;
  fillHeight?: boolean;
}

const DEFAULT_MAX_BODY_HEIGHT = 380;
const ROW_HEIGHT = 48;

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

function ConditionRiskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

export function ConditionRiskMatrix({
  items,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_BODY_HEIGHT,
  embedded = false,
  fillHeight = false,
}: ConditionRiskMatrixProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const insight = generateHousingConditionRiskInsight(items, compareYears);

  const currentConcern = (item: ConditionRiskMatrixItem) =>
    pickYearValue(item.concern2024, item.concern2025, displayYear);

  const rowsHeight = items.length * ROW_HEIGHT;
  const isScrollable = !fillHeight && items.length > 0 && rowsHeight > maxBodyHeight;
  const shouldCapHeight = embedded && !fillHeight;

  const laneSubtitle = isYoY
    ? `${compareYears[0]} vs ${compareYears[1]} housing condition risk — higher agreement means more reported concern.`
    : `Housing condition risk for ${displayYear} — higher agreement means more reported concern, not satisfaction.`;

  const heatmapBody = (
    <div className={`chart-card-body agreement-heatmap-body condition-risk-matrix-body${embedded ? ' agreement-heatmap-body-embedded' : ''}`}>
      {items.length === 0 ? (
        <p className="statement-lollipop-empty">No housing condition risk statements available.</p>
      ) : (
        <div
          className={`health-heatmap agreement-heatmap agreement-heatmap--risk condition-risk-heatmap${
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
              {items.map((item) => {
                const concern = currentConcern(item);
                return (
                  <div className="health-heatmap-row agreement-heatmap-row" key={item.id}>
                    <div className="health-heatmap-label" title={item.fullName}>
                      <span className="health-heatmap-label-icon agreement-heatmap-label-icon">
                        <ConditionRiskIcon />
                      </span>
                      <span className="health-heatmap-label-text">{item.name}</span>
                    </div>
                    {isYoY && (
                      <div
                        className="health-heatmap-cell"
                        style={{
                          background: riskHeatColor(item.concern2024),
                          color: riskHeatTextColor(item.concern2024),
                        }}
                        title={`${item.fullName} (${compareYears[0]}): ${item.concern2024.toFixed(1)}%`}
                      >
                        <span className="health-heatmap-cell-value">{item.concern2024.toFixed(0)}%</span>
                      </div>
                    )}
                    <div
                      className="health-heatmap-cell"
                      style={{
                        background: riskHeatColor(concern),
                        color: riskHeatTextColor(concern),
                      }}
                      title={
                        isYoY
                          ? `${item.fullName} (${compareYears[1]}): ${concern.toFixed(1)}% (${formatDelta(item.movement)})`
                          : `${item.fullName} (${displayYear}): ${concern.toFixed(1)}%`
                      }
                    >
                      <div className={`health-heatmap-cell-content${isYoY ? ' health-heatmap-cell-content-inline' : ''}`}>
                        <span className="health-heatmap-cell-value">{concern.toFixed(0)}%</span>
                        {isYoY && (
                          <span className={getRiskMovementClassName(item.movement, concern)}>
                            {formatRiskMovementLabel(item.movement)}
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
            <span>Lower reported concern</span>
            <span className="health-heatmap-scale-bar agreement-heatmap-scale-bar" aria-hidden="true" />
            <span>Higher reported concern</span>
          </div>
        </div>
      )}
    </div>
  );

  const insightFooter = (
    <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
      <ChartInsightFooter chartTitle="Reported concern and trend" insight={insight} singleLine />
    </div>
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--wellbeing housing-assessment-lane-card--risk">
        <div className="health-assessment-lane-card-header">
          <ChartSectionHeader
            icon="risk-register"
            title="Reported concern and trend"
            subtitle={laneSubtitle}
            titleClassName="health-assessment-lane-card-title"
            subtitleClassName="health-assessment-lane-card-subtitle"
          />
          <div className="health-assessment-lane-card-actions">
            <span className="statement-lollipop-badge is-risk">Condition risk</span>
          </div>
        </div>
        {heatmapBody}
        {insightFooter}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill condition-risk-matrix-card agreement-heatmap-card">
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="risk-register"
          title="Reported concern and trend"
          subtitle={laneSubtitle}
        />
        <div className="chart-header-actions">
          <span className="statement-lollipop-badge is-risk">Condition risk</span>
        </div>
      </div>
      {heatmapBody}
      {insightFooter}
    </div>
  );
}
