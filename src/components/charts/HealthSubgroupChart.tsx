import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  generateHealthSubgroupInsight,
  pickYearValue,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';

interface HealthSubgroupChartProps {
  centresItems: StatementComparisonItem[];
  systemItems: StatementComparisonItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  calculatedScore: number;
  q501Score: number;
  q502Score: number;
  maxBodyHeight?: number;
  embedded?: boolean;
}

type SubgroupTab = 'q501' | 'q502';

const PLOT_WIDTH = 1000;
const PLOT_MARGIN = { top: 8, right: 56, left: 10, bottom: 0 };
const AXIS_HEIGHT = 44;
const ROW_HEIGHT_YOY = 48;
const ROW_HEIGHT_SINGLE = 36;
const DEFAULT_MAX_SCROLL_HEIGHT = 220;
const DOMAIN_TICKS = [0, 25, 50, 75, 100];

const TABS: { id: SubgroupTab; label: string }[] = [
  { id: 'q501', label: 'Health centers (Q501)' },
  { id: 'q502', label: 'System quality (Q502)' },
];

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

function HealthStatementIcon() {
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
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function HealthSubgroupChart({
  centresItems,
  systemItems,
  compareYears,
  year,
  viewMode,
  calculatedScore,
  q501Score,
  q502Score,
  maxBodyHeight = DEFAULT_MAX_SCROLL_HEIGHT,
  embedded = false,
}: HealthSubgroupChartProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);
  const [activeTab, setActiveTab] = useState<SubgroupTab>('q501');

  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const currentBarColor = DESIGN.positive;

  const activeItems = activeTab === 'q501' ? centresItems : systemItems;
  const laneSubtitle =
    activeTab === 'q501'
      ? `Q501 health center assessments for ${displayYear} — combined with Q502 for SCORE_5.`
      : `Q502 healthcare system quality for ${displayYear} — combined with Q501 for SCORE_5.`;

  const rows = buildChartRows(activeItems, isYoY, displayYear);
  const rowHeight = isYoY ? ROW_HEIGHT_YOY : ROW_HEIGHT_SINGLE;
  const chartHeight = Math.max(rows.length * rowHeight + PLOT_MARGIN.top + PLOT_MARGIN.bottom, 180);
  const plotBottom = chartHeight - PLOT_MARGIN.bottom;

  const insight = generateHealthSubgroupInsight(activeItems, displayYear, activeTab);
  const isScrollable = chartHeight > maxBodyHeight;

  useLayoutEffect(() => {
    const measure = () => {
      if (labelsRef.current) {
        setLabelColumnWidth(labelsRef.current.offsetWidth);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rows, isYoY, activeTab]);

  const content = (
    <>
      <div className={embedded ? 'health-assessment-lane-card-header' : 'health-subgroup-chart-header'}>
        <ChartSectionHeader
          icon="compare"
          title="Healthcare assessment by subgroup"
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

      <div className="health-score-callout" aria-label="Calculated health section score">
        <div className="health-score-callout-main">
          <span className="health-score-callout-label">SCORE_5 (calculated)</span>
          <strong className="health-score-callout-value">{calculatedScore.toFixed(1)}%</strong>
          <span className="health-score-callout-caption">
            Average of Q501 + Q502 subgroup scores — Q508 wellbeing shown separately.
          </span>
        </div>
        <div className="health-score-callout-subgroups">
          <span>Q501 {q501Score.toFixed(1)}%</span>
          <span>Q502 {q502Score.toFixed(1)}%</span>
        </div>
      </div>

      <div
        className={`statement-register-tabs health-subgroup-tabs${embedded ? ' health-subgroup-tabs-embedded' : ''}`}
        role="tablist"
        aria-label="Health subgroups"
      >
        {TABS.map((tab) => {
          const count = tab.id === 'q501' ? centresItems.length : systemItems.length;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`statement-register-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="statement-register-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="health-subgroup-body">
        {centresItems.length === 0 && systemItems.length === 0 ? (
          <p className="statement-lollipop-empty">No healthcare assessment statements available.</p>
        ) : activeItems.length === 0 ? (
          <p className="statement-lollipop-empty">No statements in this subgroup.</p>
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
                        <HealthStatementIcon />
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
                    aria-label={`Healthcare assessment — ${activeTab}`}
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
                              {`${row.fullName}\n${compareYears[1]}: ${formatValueLabel(row.value2025)}\n${compareYears[0]}: ${formatValueLabel(row.value2024)}`}
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
                  Satisfaction (%)
                </text>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
        <ChartInsightFooter chartTitle="Healthcare assessment by subgroup" insight={insight} />
      </div>
    </>
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--assessment">
        {content}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill health-subgroup-chart-card">
      {content}
    </div>
  );
}
