import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import { formatCompareYearsLabel, type PillarDumbbellItem } from '../../utils';
import { ChartSectionHeader } from './ChartSectionHeader';

interface DumbbellChartProps {
  items: PillarDumbbellItem[];
  compareYears: CompareYears;
  mode: ViewMode;
  selectedYear?: SurveyYear;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const CHART_WIDTH = 640;
const ROW_HEIGHT = 26;
const COMPACT_ROW_HEIGHT = 30;
const MARGIN = { top: 12, right: 56, bottom: 40, left: 132 };
const COMPACT_MARGIN = { top: 12, right: 40, bottom: 12, left: 132 };

function getPillarYearValue(item: PillarDumbbellItem, year: SurveyYear): number | null {
  return year === '2024' ? item.value2024 : item.value2025;
}

export function DumbbellChart({
  items,
  compareYears,
  mode,
  selectedYear = '2025',
  title = 'Pillar scores',
  subtitle,
  compact = false,
}: DumbbellChartProps) {
  const isYoY = mode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : selectedYear;
  const compareLabel = formatCompareYearsLabel(compareYears);
  const chartMargin = compact ? COMPACT_MARGIN : MARGIN;
  const rowHeight = compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT;

  const approvedValues = items.flatMap((item) => {
    if (isYoY) {
      return [item.value2024, item.value2025].filter((value): value is number => value != null);
    }
    const value = getPillarYearValue(item, displayYear);
    return value != null ? [value] : [];
  });

  const minValue = approvedValues.length > 0
    ? Math.max(0, Math.floor((Math.min(...approvedValues) - 10) / 10) * 10)
    : 0;
  const maxValue = approvedValues.length > 0
    ? Math.min(100, Math.ceil((Math.max(...approvedValues) + 5) / 5) * 5)
    : 100;
  const plotWidth = CHART_WIDTH - chartMargin.left - chartMargin.right;
  const plotHeight = items.length * rowHeight;
  const height = plotHeight + chartMargin.top + chartMargin.bottom;
  const axisY = height - chartMargin.bottom;

  const scaleX = (value: number) =>
    chartMargin.left + ((value - minValue) / Math.max(maxValue - minValue, 1)) * plotWidth;

  const ticks = Array.from(
    { length: Math.floor((maxValue - minValue) / 10) + 1 },
    (_, index) => minValue + index * 10,
  );

  const defaultSubtitle = isYoY
    ? `${compareLabel} approved section scores`
    : `Approved section scores for ${displayYear}`;

  return (
    <div className={`chart-card dumbbell-chart-card${compact ? ' dumbbell-chart-card-compact' : ''}`}>
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="compare"
          title={title}
          titleClassName="dumbbell-chart-title"
          subtitleClassName="dumbbell-chart-subtitle"
          subtitle={subtitle ?? defaultSubtitle}
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
      <div className="dumbbell-chart-body">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} className="dumbbell-chart-svg" role="img">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={scaleX(tick)}
                x2={scaleX(tick)}
                y1={chartMargin.top}
                y2={axisY}
                stroke={DESIGN.chart.grid}
                strokeDasharray="3 3"
              />
              <text
                x={scaleX(tick)}
                y={axisY + 14}
                textAnchor="middle"
                className="dumbbell-axis-label"
              >
                {tick}%
              </text>
            </g>
          ))}

          <text
            x={MARGIN.left + plotWidth / 2}
            y={height - 6}
            textAnchor="middle"
            className="dumbbell-axis-title"
          >
            Section score (%)
          </text>

          {items.map((item, index) => {
            const y = chartMargin.top + index * rowHeight + rowHeight / 2;
            const singleValue = getPillarYearValue(item, displayYear);
            const isPending = item.status !== 'approved'
              || (isYoY
                ? item.value2024 == null || item.value2025 == null
                : singleValue == null);

            return (
              <g key={item.sectionId}>
                <text
                  x={0}
                  y={y + 4}
                  textAnchor="start"
                  className={`dumbbell-row-label${isPending ? ' dumbbell-row-label-pending' : ''}`}
                >
                  {item.name}
                </text>
                {!isPending && isYoY && (
                  <>
                    <line
                      x1={scaleX(item.value2024!)}
                      x2={scaleX(item.value2025!)}
                      y1={y}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth={2}
                    />
                    <circle
                      cx={scaleX(item.value2024!)}
                      cy={y}
                      r={4}
                      fill={DESIGN.chart.yearPrevious}
                    />
                    <circle
                      cx={scaleX(item.value2025!)}
                      cy={y}
                      r={4}
                      fill={DESIGN.chart.yearCurrent}
                    />
                    <text
                      x={scaleX(item.value2024!)}
                      y={y - 8}
                      textAnchor="middle"
                      className="dumbbell-value-label"
                    >
                      {item.value2024!.toFixed(1)}%
                    </text>
                    <text
                      x={scaleX(item.value2025!)}
                      y={y - 8}
                      textAnchor="middle"
                      className="dumbbell-value-label"
                    >
                      {item.value2025!.toFixed(1)}%
                    </text>
                  </>
                )}
                {!isPending && !isYoY && singleValue != null && (
                  <>
                    <circle
                      cx={scaleX(singleValue)}
                      cy={y}
                      r={4}
                      fill={DESIGN.chart.yearCurrent}
                    />
                    <text
                      x={scaleX(singleValue)}
                      y={y - 8}
                      textAnchor="middle"
                      className="dumbbell-value-label"
                    >
                      {singleValue.toFixed(1)}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
