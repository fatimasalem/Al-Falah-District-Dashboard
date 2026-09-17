import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  formatDelta,
  generateEnvironmentPositiveStatementsInsight,
  pickYearValue,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';

interface EnvironmentStatementChartProps {
  positiveItems: StatementComparisonItem[];
  insectsRisk: StatementComparisonItem | null;
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
  embedded?: boolean;
}

const PLOT_WIDTH = 1000;
const PLOT_MARGIN = { top: 8, right: 56, left: 10, bottom: 0 };
const AXIS_HEIGHT = 44;
const ROW_HEIGHT_YOY = 48;
const ROW_HEIGHT_SINGLE = 36;
const DEFAULT_MAX_SCROLL_HEIGHT = 220;
const DOMAIN_TICKS = [0, 25, 50, 75, 100];

interface ChartRow {
  id: string;
  name: string;
  fullName: string;
  value2024: number;
  value2025: number;
  displayValue: number;
}

function buildChartRows(
  items: StatementComparisonItem[],
  isYoY: boolean,
  displayYear: SurveyYear,
): ChartRow[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    fullName: item.fullName,
    value2024: item.value2024,
    value2025: item.value2025,
    displayValue: isYoY
      ? item.value2025
      : pickYearValue(item.value2024, item.value2025, displayYear),
  }));
}

function scaleX(value: number): number {
  const plotWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  return PLOT_MARGIN.left + (value / 100) * plotWidth;
}

function formatValueLabel(value: number): string {
  return `${value.toFixed(1)}%`;
}

function EnvironmentStatementIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M11 20A7 7 0 019.5 6.5c.5-2 2-3.5 4.5-4 0 3 1 5.5 2.5 7.5S20 14 20 16a7 7 0 01-9 4z" />
      <path d="M11 20c-2-1-3-3-3-5" />
    </svg>
  );
}

export function EnvironmentStatementChart({
  positiveItems,
  insectsRisk,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_SCROLL_HEIGHT,
  embedded = false,
}: EnvironmentStatementChartProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);

  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const compareLabel = formatCompareYearsLabel(compareYears);
  const currentBarColor = DESIGN.positive;

  const laneSubtitle = isYoY
    ? `${compareYears[0]} vs ${compareYears[1]} satisfaction statements — ranked by ${compareYears[1]} agreement.`
    : `Positive Q601 statements for ${displayYear} — ranked by agreement.`;

  const rows = buildChartRows(positiveItems, isYoY, displayYear);
  const rowHeight = isYoY ? ROW_HEIGHT_YOY : ROW_HEIGHT_SINGLE;
  const chartHeight = Math.max(rows.length * rowHeight + PLOT_MARGIN.top + PLOT_MARGIN.bottom, 180);
  const plotBottom = chartHeight - PLOT_MARGIN.bottom;

  const insight = generateEnvironmentPositiveStatementsInsight(positiveItems, displayYear);
  const isScrollable = chartHeight > maxBodyHeight;

  const insectsValue = insectsRisk
    ? pickYearValue(insectsRisk.value2024, insectsRisk.value2025, displayYear)
    : null;

  useLayoutEffect(() => {
    const measure = () => {
      if (labelsRef.current) {
        setLabelColumnWidth(labelsRef.current.offsetWidth);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rows, isYoY]);

  const content = (
    <>
      <div className={embedded ? 'health-assessment-lane-card-header' : 'chart-card-header'}>
        <ChartSectionHeader
          icon="compare"
          title="Q601 positive environment statements"
          titleClassName={embedded ? 'health-assessment-lane-card-title' : 'dumbbell-chart-title'}
          subtitleClassName={embedded ? 'health-assessment-lane-card-subtitle' : 'dumbbell-chart-subtitle'}
          subtitle={laneSubtitle}
        />
        <div className={embedded ? 'health-assessment-lane-card-actions' : 'health-subgroup-chart-legend-wrap'}>
          <StatementYearLegend
            viewMode={viewMode}
            compareYears={compareYears}
            year={year}
            variant="positive"
          />
        </div>
      </div>

      {insectsRisk && insectsValue != null && (
        <div
          className={`environment-risk-callout${embedded ? ' environment-risk-callout-embedded' : ''}`}
          aria-label="Insects and rodents reported concern"
        >
          <div className="environment-risk-callout-main">
            <span className="environment-risk-callout-label">Reported concern</span>
            <strong className="environment-risk-callout-value">{insectsValue.toFixed(1)}%</strong>
            <span className="environment-risk-callout-caption">
              Insects &amp; rodents in living areas — higher agreement means more reported concern, not satisfaction.
            </span>
          </div>
          {isYoY && Math.abs(insectsRisk.movement) >= 0.5 && (
            <span className="environment-risk-callout-delta">
              {formatDelta(insectsRisk.movement)} vs {compareYears[0]}
            </span>
          )}
        </div>
      )}

      <div className="health-subgroup-body environment-statement-body">
        {positiveItems.length === 0 ? (
          <p className="statement-lollipop-empty">No positive Q601 environment statements available.</p>
        ) : (
          <div className="health-subgroup-bar-panel">
            <div
              className={`health-subgroup-bar-scroll statement-bar-chart-scroll${
                embedded || isScrollable ? ' is-scrollable' : ''
              }`}
              style={{ maxHeight: maxBodyHeight }}
            >
              <div
                className="statement-bar-chart health-subgroup-bar-chart"
                style={{
                  height: chartHeight,
                  ['--statement-rows' as string]: rows.length,
                  ['--statement-row-height' as string]: `${rowHeight}px`,
                }}
              >
                <div className="statement-bar-labels health-subgroup-bar-labels" ref={labelsRef}>
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="statement-bar-label health-subgroup-bar-label"
                      title={row.fullName}
                    >
                      <span className="statement-bar-label-icon health-subgroup-bar-label-icon">
                        <EnvironmentStatementIcon />
                      </span>
                      <span className="statement-bar-label-text">{row.name}</span>
                    </div>
                  ))}
                </div>

                <div className="statement-bar-plot health-subgroup-bar-plot" style={{ height: chartHeight }}>
                  <svg
                    viewBox={`0 0 ${PLOT_WIDTH} ${chartHeight}`}
                    className="health-subgroup-bar-svg"
                    width="100%"
                    height={chartHeight}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Q601 positive environment statements"
                  >
                    {DOMAIN_TICKS.map((tick) => (
                      <line
                        key={tick}
                        x1={scaleX(tick)}
                        x2={scaleX(tick)}
                        y1={PLOT_MARGIN.top}
                        y2={plotBottom}
                        stroke={DESIGN.chart.grid}
                        strokeDasharray="3 3"
                      />
                    ))}

                    {rows.map((row, index) => {
                      const centerY = PLOT_MARGIN.top + index * rowHeight + rowHeight / 2;

                      if (isYoY) {
                        const barHeight = 12;
                        const currentY = centerY - barHeight - 2;
                        const previousY = centerY + 2;
                        const previousWidth = scaleX(row.value2024) - PLOT_MARGIN.left;
                        const currentWidth = scaleX(row.value2025) - PLOT_MARGIN.left;

                        return (
                          <g key={row.id}>
                            <title>
                              {`${row.fullName} (${compareLabel})\n${compareYears[1]}: ${formatValueLabel(row.value2025)}\n${compareYears[0]}: ${formatValueLabel(row.value2024)}`}
                            </title>
                            <rect
                              x={PLOT_MARGIN.left}
                              y={currentY}
                              width={Math.max(currentWidth, 0)}
                              height={barHeight}
                              rx={4}
                              ry={4}
                              fill={currentBarColor}
                            />
                            <rect
                              x={PLOT_MARGIN.left}
                              y={previousY}
                              width={Math.max(previousWidth, 0)}
                              height={barHeight}
                              rx={4}
                              ry={4}
                              fill={DESIGN.chart.yearPrevious}
                            />
                            <text
                              x={scaleX(row.value2025) + 6}
                              y={currentY + barHeight / 2 + 4}
                              className="health-subgroup-bar-value-label"
                            >
                              {formatValueLabel(row.value2025)}
                            </text>
                            <text
                              x={scaleX(row.value2024) + 6}
                              y={previousY + barHeight / 2 + 4}
                              className="health-subgroup-bar-value-label"
                            >
                              {formatValueLabel(row.value2024)}
                            </text>
                          </g>
                        );
                      }

                      const barHeight = 16;
                      const barY = centerY - barHeight / 2;
                      const barWidth = scaleX(row.displayValue) - PLOT_MARGIN.left;

                      return (
                        <g key={row.id}>
                          <title>{`${row.fullName}\n${displayYear}: ${formatValueLabel(row.displayValue)}`}</title>
                          <rect
                            x={PLOT_MARGIN.left}
                            y={barY}
                            width={Math.max(barWidth, 0)}
                            height={barHeight}
                            rx={4}
                            ry={4}
                            fill={currentBarColor}
                          />
                          <text
                            x={scaleX(row.displayValue) + 6}
                            y={centerY + 4}
                            className="health-subgroup-bar-value-label"
                          >
                            {formatValueLabel(row.displayValue)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            <div className="health-subgroup-x-axis-rail">
              <div
                className="health-subgroup-x-axis-gutter"
                style={labelColumnWidth > 0 ? { width: labelColumnWidth } : undefined}
                aria-hidden="true"
              />
              <svg
                viewBox={`0 0 ${PLOT_WIDTH} ${AXIS_HEIGHT}`}
                className="health-subgroup-x-axis-svg"
                width="100%"
                height={AXIS_HEIGHT}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {DOMAIN_TICKS.map((tick) => (
                  <text
                    key={tick}
                    x={scaleX(tick)}
                    y={16}
                    textAnchor="middle"
                    className="health-subgroup-axis-label"
                  >
                    {tick}%
                  </text>
                ))}
                <text
                  x={PLOT_WIDTH / 2}
                  y={36}
                  textAnchor="middle"
                  className="health-subgroup-axis-title"
                >
                  Agreement (%)
                </text>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
        <ChartInsightFooter chartTitle="Q601 positive environment statements" insight={insight} />
      </div>
    </>
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--assessment environment-assessment-lane-card--statements">
        {content}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill health-subgroup-chart-card environment-statement-chart-card">
      {content}
    </div>
  );
}
