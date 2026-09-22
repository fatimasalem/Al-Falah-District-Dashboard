import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  generateSecurityDotPlotInsight,
  pickYearValue,
  type InsightPart,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';

interface TwoLaneDotPlotProps {
  confidenceItems: StatementComparisonItem[];
  concernItems: StatementComparisonItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  title?: string;
  subtitle?: string;
  insight?: InsightPart[];
  maxBodyHeight?: number;
}

type PlotTab = 'confidence' | 'concern';

const PLOT_WIDTH = 1000;
const PLOT_MARGIN = { top: 8, right: 56, left: 10, bottom: 0 };
const AXIS_HEIGHT = 44;
const ROW_HEIGHT_YOY = 48;
const ROW_HEIGHT_SINGLE = 36;
const DEFAULT_MAX_SCROLL_HEIGHT = 320;
const DOMAIN_TICKS = [0, 25, 50, 75, 100];

const TABS: { id: PlotTab; label: string }[] = [
  { id: 'confidence', label: 'Confidence' },
  { id: 'concern', label: 'Concern' },
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
  return items
    .map((item) => ({
      id: item.id,
      name: item.name,
      fullName: item.fullName,
      value2024: item.value2024,
      value2025: item.value2025,
      displayValue: isYoY
        ? item.value2025
        : pickYearValue(item.value2024, item.value2025, displayYear),
    }))
    .sort((a, b) => b.displayValue - a.displayValue);
}

function scaleX(value: number): number {
  const plotWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  return PLOT_MARGIN.left + (value / 100) * plotWidth;
}

function formatValueLabel(value: number): string {
  return `${value.toFixed(1)}%`;
}

function SecurityStatementIcon({
  fullName,
  variant,
}: {
  fullName: string;
  variant: 'positive' | 'risk';
}) {
  const props = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };
  const lower = fullName.toLowerCase();

  if (variant === 'risk') {
    if (/fear for my children|bad company/i.test(lower)) {
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    }
    if (/physical violence|threats/i.test(lower)) {
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    }
    if (/exposed to an incident/i.test(lower)) {
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
    }
  }

  if (/housing/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M3 9l9-5 9 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
        <path d="M9 22V12h6v10" />
      </svg>
    );
  }
  if (/power/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  if (/water/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.32 0L12 2.69z" />
      </svg>
    );
  }
  if (/cleanliness/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 3l1.5 4.5H18l-3.7 2.7 1.4 4.5L12 13.8 8.3 14.7l1.4-4.5L6 7.5h4.5L12 3z" />
      </svg>
    );
  }
  if (/food/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <path d="M6 1v3M10 1v3M14 1v3" />
      </svg>
    );
  }
  if (/job security/i.test(lower)) {
    return (
      <svg {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    );
  }
  if (/freedom of expression/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    );
  }
  if (/social media/i.test(lower)) {
    return (
      <svg {...props}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    );
  }
  if (/families|family/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    );
  }
  if (/laws/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 3v18M8 7h8M8 12h8M8 17h5" />
      </svg>
    );
  }
  if (/moving around|day and night/i.test(lower)) {
    return (
      <svg {...props}>
        <circle cx="12" cy="10" r="3" />
        <path d="M12 21a7 7 0 010-14 7 7 0 000 14z" />
      </svg>
    );
  }
  if (/religious/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 2v20M8 6h8M8 18h8" />
      </svg>
    );
  }
  if (/justice|equality/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 3v18M5 7h14M7 12h10" />
      </svg>
    );
  }
  if (/safe and protected|security and safety/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (/police/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (/drugs/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M18 6L6 18M6 6l12 12" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (/crime/i.test(lower)) {
    return (
      <svg {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function TwoLaneDotPlot({
  confidenceItems,
  concernItems,
  compareYears,
  year,
  viewMode,
  title = 'Q401 confidence vs concern',
  subtitle,
  insight: insightOverride,
  maxBodyHeight = DEFAULT_MAX_SCROLL_HEIGHT,
}: TwoLaneDotPlotProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);
  const [activeTab, setActiveTab] = useState<PlotTab>('confidence');

  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const compareLabel = formatCompareYearsLabel(compareYears);
  const activeItems = activeTab === 'confidence' ? confidenceItems : concernItems;
  const laneLabel = activeTab === 'confidence' ? 'confidence' : 'reported concern';
  const isConcernLane = activeTab === 'concern';
  const currentBarColor = isConcernLane ? DESIGN.negative : DESIGN.chart.yearCurrent;

  const defaultSubtitle = isYoY
    ? `${compareLabel} Q401 ${laneLabel} statements`
    : `Q401 ${laneLabel} statements for ${displayYear}`;

  const activeSubtitle = subtitle ?? defaultSubtitle;
  const rows = buildChartRows(activeItems, isYoY, displayYear);
  const rowHeight = isYoY ? ROW_HEIGHT_YOY : ROW_HEIGHT_SINGLE;
  const chartHeight = Math.max(rows.length * rowHeight + PLOT_MARGIN.top + PLOT_MARGIN.bottom, 180);
  const plotBottom = chartHeight - PLOT_MARGIN.bottom;

  const insight =
    insightOverride ??
    (activeTab === 'concern'
      ? generateSecurityDotPlotInsight([], concernItems, displayYear)
      : generateSecurityDotPlotInsight(confidenceItems, [], displayYear));

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

  return (
    <div
      className={`chart-card chart-card-fill two-lane-bar-chart-card${
        isConcernLane ? ' is-concern-lane' : ''
      }`}
    >
      <div className="two-lane-bar-chart-header">
        <ChartSectionHeader
          icon="protect"
          title={title}
          titleClassName="statement-register-title"
          subtitleClassName="statement-register-subtitle"
          subtitle={activeSubtitle}
        />
        <div className="pillar-composition-legend two-lane-bar-chart-legend" aria-hidden="true">
          {isYoY ? (
            <>
              <span><i className="pillar-composition-legend-dot previous" /> {compareYears[0]}</span>
              <span>
                <i
                  className={`pillar-composition-legend-dot ${
                    isConcernLane ? 'is-risk' : 'current'
                  }`}
                />
                {' '}
                {compareYears[1]}
              </span>
            </>
          ) : (
            <span>
              <i
                className={`pillar-composition-legend-dot ${
                  isConcernLane ? 'is-risk' : 'current'
                }`}
              />
              {' '}
              {displayYear}
            </span>
          )}
        </div>
      </div>

      <div className="two-lane-bar-chart-tabs" role="tablist" aria-label="Plot lanes">
        {TABS.map((tab) => {
          const count = tab.id === 'confidence' ? confidenceItems.length : concernItems.length;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`two-lane-bar-chart-tab${activeTab === tab.id ? ' is-active' : ''}${
                tab.id === 'concern' ? ' is-concern' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="two-lane-bar-chart-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="two-lane-bar-chart-body">
        {confidenceItems.length === 0 && concernItems.length === 0 ? (
          <p className="statement-lollipop-empty">No Q401 security statements available.</p>
        ) : activeItems.length === 0 ? (
          <p className="statement-lollipop-empty">No statements in this lane.</p>
        ) : (
          <div className="two-lane-bar-chart-panel">
            <div
              className="two-lane-bar-chart-scroll statement-bar-chart-scroll"
              style={{ maxHeight: maxBodyHeight }}
            >
              <div
                className="statement-bar-chart two-lane-bar-chart"
                style={{
                  height: chartHeight,
                  ['--statement-rows' as string]: rows.length,
                  ['--statement-row-height' as string]: `${rowHeight}px`,
                }}
              >
                <div className="statement-bar-labels two-lane-bar-chart-labels" ref={labelsRef}>
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="statement-bar-label two-lane-bar-chart-label"
                      title={row.fullName}
                    >
                      <span
                        className={`statement-bar-label-icon two-lane-bar-chart-label-icon ${
                          isConcernLane ? 'statement-risk-label-icon' : 'two-lane-bar-chart-label-icon--confidence'
                        }`}
                      >
                        <SecurityStatementIcon
                          fullName={row.fullName}
                          variant={isConcernLane ? 'risk' : 'positive'}
                        />
                      </span>
                      <span className="statement-bar-label-text">{row.name}</span>
                    </div>
                  ))}
                </div>

                <div className="statement-bar-plot two-lane-bar-chart-plot" style={{ height: chartHeight }}>
                  <svg
                    viewBox={`0 0 ${PLOT_WIDTH} ${chartHeight}`}
                    className="two-lane-bar-chart-svg"
                    width="100%"
                    height={chartHeight}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${title} — ${activeTab} lane`}
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
                              className="two-lane-bar-chart-value-label"
                            >
                              {formatValueLabel(row.value2025)}
                            </text>
                            <text
                              x={scaleX(row.value2024) + 6}
                              y={previousY + barHeight / 2 + 4}
                              className="two-lane-bar-chart-value-label"
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
                            className="two-lane-bar-chart-value-label"
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

            <div className="two-lane-bar-chart-x-axis-rail">
              <div
                className="two-lane-bar-chart-x-axis-gutter"
                style={labelColumnWidth > 0 ? { width: labelColumnWidth } : undefined}
                aria-hidden="true"
              />
              <svg
                viewBox={`0 0 ${PLOT_WIDTH} ${AXIS_HEIGHT}`}
                className="two-lane-bar-chart-x-axis-svg"
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
                    className="two-lane-bar-chart-axis-label"
                  >
                    {tick}%
                  </text>
                ))}
                <text
                  x={PLOT_WIDTH / 2}
                  y={36}
                  textAnchor="middle"
                  className="two-lane-bar-chart-axis-title"
                >
                  Agreement (%)
                </text>
              </svg>
            </div>
          </div>
        )}
      </div>

      <ChartInsightFooter chartTitle={title} insight={insight} />
    </div>
  );
}
