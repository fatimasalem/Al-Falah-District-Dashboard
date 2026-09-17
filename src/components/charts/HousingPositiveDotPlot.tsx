import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  generateHousingPositiveStatementsInsight,
  pickYearValue,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';

interface HousingPositiveDotPlotProps {
  positiveItems: StatementComparisonItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
}

const CHART_WIDTH = 640;
const ROW_HEIGHT = 36;
const MARGIN = { top: 14, right: 68, bottom: 44, left: 148 };
const DEFAULT_MAX_PLOT_HEIGHT = 380;
const VALUE_LABEL_OFFSET = 8;
const MIN_VALUE_LABEL_GAP = 42;

interface ValueLabelLayout {
  x: number;
  y: number;
  textAnchor: 'start' | 'middle' | 'end';
}

function layoutYoYValueLabels(
  value2024: number,
  value2025: number,
  scaleX: (value: number) => number,
  y: number,
): { previous: ValueLabelLayout; current: ValueLabelLayout } {
  const xPrevious = scaleX(value2024);
  const xCurrent = scaleX(value2025);
  const gap = Math.abs(xCurrent - xPrevious);

  if (gap < MIN_VALUE_LABEL_GAP) {
    const midX = (xPrevious + xCurrent) / 2;
    const halfGap = MIN_VALUE_LABEL_GAP / 2;
    return {
      previous: { x: midX - halfGap, y: y - 8, textAnchor: 'middle' },
      current: { x: midX + halfGap, y: y - 8, textAnchor: 'middle' },
    };
  }

  const previousOnLeft = xPrevious <= xCurrent;
  return {
    previous: {
      x: xPrevious + (previousOnLeft ? -VALUE_LABEL_OFFSET : VALUE_LABEL_OFFSET),
      y: y - 8,
      textAnchor: previousOnLeft ? 'end' : 'start',
    },
    current: {
      x: xCurrent + (previousOnLeft ? VALUE_LABEL_OFFSET : -VALUE_LABEL_OFFSET),
      y: y - 8,
      textAnchor: previousOnLeft ? 'start' : 'end',
    },
  };
}

function layoutSingleValueLabel(
  value: number,
  scaleX: (value: number) => number,
  y: number,
): ValueLabelLayout {
  return {
    x: scaleX(value) + VALUE_LABEL_OFFSET,
    y: y - 8,
    textAnchor: 'start',
  };
}

export function HousingPositiveDotPlot({
  positiveItems,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_PLOT_HEIGHT,
}: HousingPositiveDotPlotProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const compareLabel = formatCompareYearsLabel(compareYears);

  const approvedValues = positiveItems.flatMap((item) => {
    if (isYoY) return [item.value2024, item.value2025];
    return [pickYearValue(item.value2024, item.value2025, displayYear)];
  });

  const minValue = approvedValues.length > 0
    ? Math.max(0, Math.floor((Math.min(...approvedValues) - 10) / 10) * 10)
    : 0;
  const maxValue = approvedValues.length > 0
    ? Math.min(100, Math.ceil((Math.max(...approvedValues) + 5) / 5) * 5)
    : 100;
  const plotWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const plotContentHeight = MARGIN.top + positiveItems.length * ROW_HEIGHT;
  const axisHeight = MARGIN.bottom;

  const scaleX = (value: number) =>
    MARGIN.left + ((value - minValue) / Math.max(maxValue - minValue, 1)) * plotWidth;

  const ticks = Array.from(
    { length: Math.floor((maxValue - minValue) / 10) + 1 },
    (_, index) => minValue + index * 10,
  );

  const insight = generateHousingPositiveStatementsInsight(positiveItems, displayYear);
  const isScrollable = plotContentHeight > maxBodyHeight;

  return (
    <div className="chart-card chart-card-fill dumbbell-chart-card housing-positive-dot-plot-card chart-positive-lane">
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="compare"
          title="Q701 positive housing statements"
          titleClassName="dumbbell-chart-title"
          subtitleClassName="dumbbell-chart-subtitle"
          subtitle={
            isYoY
              ? `${compareYears[0]} vs ${compareYears[1]} satisfaction statements — ranked by ${compareYears[1]} agreement.`
              : `Positive Q701 statements for ${displayYear} — ranked by agreement.`
          }
        />
        <div className="dumbbell-chart-legend" aria-hidden="true">
          {isYoY ? (
            <>
              <span><i className="dumbbell-dot dumbbell-dot-previous" /> {compareYears[0]}</span>
              <span><i className="dumbbell-dot dumbbell-dot-current" /> {compareYears[1]}</span>
            </>
          ) : (
            <span><i className="dumbbell-dot dumbbell-dot-current" /> {displayYear}</span>
          )}
        </div>
      </div>

      <div className="dumbbell-chart-body housing-positive-dot-plot-body">
        {positiveItems.length === 0 ? (
          <p className="statement-lollipop-empty">No positive Q701 housing statements available.</p>
        ) : (
          <div className="two-lane-dot-plot-shell">
            <div
              className={`two-lane-dot-plot-scroll${isScrollable ? ' is-scrollable' : ''}`}
              style={{ minHeight: maxBodyHeight, maxHeight: maxBodyHeight }}
            >
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${plotContentHeight}`}
                className="dumbbell-chart-svg two-lane-dot-plot-svg-plot"
                role="img"
                aria-label="Q701 positive housing statements"
                preserveAspectRatio="xMidYMin meet"
              >
                {ticks.map((tick) => (
                  <line
                    key={tick}
                    x1={scaleX(tick)}
                    x2={scaleX(tick)}
                    y1={MARGIN.top}
                    y2={plotContentHeight}
                    stroke={DESIGN.chart.grid}
                    strokeDasharray="3 3"
                  />
                ))}

                {positiveItems.map((item, index) => {
                  const y = MARGIN.top + index * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const singleValue = pickYearValue(item.value2024, item.value2025, displayYear);
                  const yoyLabels = isYoY
                    ? layoutYoYValueLabels(item.value2024, item.value2025, scaleX, y)
                    : null;
                  const singleLabel = !isYoY
                    ? layoutSingleValueLabel(singleValue, scaleX, y)
                    : null;

                  return (
                    <g key={item.id}>
                      <text x={0} y={y + 4} textAnchor="start" className="dumbbell-row-label">
                        {item.name}
                      </text>
                      {isYoY && yoyLabels && (
                        <>
                          <line
                            x1={scaleX(item.value2024)}
                            x2={scaleX(item.value2025)}
                            y1={y}
                            y2={y}
                            stroke="#cbd5e1"
                            strokeWidth={2}
                          />
                          <circle
                            cx={scaleX(item.value2024)}
                            cy={y}
                            r={5}
                            fill={DESIGN.chart.yearPrevious}
                          />
                          <circle
                            cx={scaleX(item.value2025)}
                            cy={y}
                            r={5}
                            fill={DESIGN.chart.yearCurrent}
                          />
                          <text
                            x={yoyLabels.previous.x}
                            y={yoyLabels.previous.y}
                            textAnchor={yoyLabels.previous.textAnchor}
                            className="dumbbell-value-label"
                          >
                            {item.value2024.toFixed(1)}%
                          </text>
                          <text
                            x={yoyLabels.current.x}
                            y={yoyLabels.current.y}
                            textAnchor={yoyLabels.current.textAnchor}
                            className="dumbbell-value-label"
                          >
                            {item.value2025.toFixed(1)}%
                          </text>
                        </>
                      )}
                      {!isYoY && singleLabel && (
                        <>
                          <circle
                            cx={scaleX(singleValue)}
                            cy={y}
                            r={5}
                            fill={DESIGN.chart.yearCurrent}
                          />
                          <text
                            x={singleLabel.x}
                            y={singleLabel.y}
                            textAnchor={singleLabel.textAnchor}
                            className="dumbbell-value-label"
                          >
                            {singleValue.toFixed(1)}%
                          </text>
                        </>
                      )}
                      <title>{`${item.fullName} (${compareLabel})`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>

            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${axisHeight}`}
              className="dumbbell-chart-svg two-lane-dot-plot-svg-axis"
              aria-hidden="true"
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                x1={MARGIN.left}
                x2={CHART_WIDTH - MARGIN.right}
                y1={0}
                y2={0}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              {ticks.map((tick) => (
                <text
                  key={tick}
                  x={scaleX(tick)}
                  y={14}
                  textAnchor="middle"
                  className="dumbbell-axis-label"
                >
                  {tick}%
                </text>
              ))}
              <text
                x={MARGIN.left + plotWidth / 2}
                y={axisHeight - 6}
                textAnchor="middle"
                className="dumbbell-axis-title"
              >
                Agreement (%)
              </text>
            </svg>
          </div>
        )}
      </div>

      <ChartInsightFooter chartTitle="Q701 positive housing statements" insight={insight} />
    </div>
  );
}
