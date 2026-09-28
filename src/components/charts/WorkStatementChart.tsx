import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  pickYearValue,
  type StatementComparisonItem,
} from '../../utils';

interface WorkStatementChartProps {
  items: StatementComparisonItem[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  variant: 'positive' | 'risk';
  maxBodyHeight?: number;
  fillHeight?: boolean;
  emptyMessage?: string;
  ariaLabel: string;
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

function WorkStatementIcon({
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
    if (/busy|stress/.test(lower)) {
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h.01M15 9h.01M8 15c1.5 1 2.5 1.5 4 1.5s2.5-.5 4-1.5" />
        </svg>
      );
    }
    if (/afraid|losing/.test(lower)) {
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      );
    }
    if (/physical|psychological/.test(lower)) {
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    }
    if (/income|expenses|covers/.test(lower)) {
      return (
        <svg {...props}>
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M3 10h18" />
        </svg>
      );
    }
  }

  if (/balance|social|family/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (/remote|outside of official/.test(lower)) {
    return (
      <svg {...props}>
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 20h8M12 18v2" />
      </svg>
    );
  }
  if (/thank|prais/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    );
  }
  if (/benefit|compensation/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 11h.01" />
      </svg>
    );
  }
  if (/development|opportunities/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

export function WorkStatementChart({
  items,
  compareYears,
  year,
  viewMode,
  variant,
  maxBodyHeight = DEFAULT_MAX_SCROLL_HEIGHT,
  fillHeight = false,
  emptyMessage = 'No statements available.',
  ariaLabel,
}: WorkStatementChartProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);
  const [fillPlotHeight, setFillPlotHeight] = useState<number | null>(null);

  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const compareLabel = formatCompareYearsLabel(compareYears);
  const currentBarColor = variant === 'risk' ? DESIGN.negative : DESIGN.positive;
  const labelIconClass =
    variant === 'risk' ? 'statement-risk-label-icon' : 'statement-positive-label-icon';

  const rows = buildChartRows(items, isYoY, displayYear);
  const baseRowHeight = isYoY ? ROW_HEIGHT_YOY : ROW_HEIGHT_SINGLE;
  const naturalChartHeight = Math.max(
    rows.length * baseRowHeight + PLOT_MARGIN.top + PLOT_MARGIN.bottom,
    180,
  );
  const chartHeight =
    fillHeight && fillPlotHeight != null
      ? Math.max(fillPlotHeight, naturalChartHeight)
      : naturalChartHeight;
  const rowHeight =
    rows.length > 0
      ? Math.max(
          baseRowHeight,
          (chartHeight - PLOT_MARGIN.top - PLOT_MARGIN.bottom) / rows.length,
        )
      : baseRowHeight;
  const plotBottom = chartHeight - PLOT_MARGIN.bottom;
  const isScrollable = !fillHeight && chartHeight > maxBodyHeight;

  useLayoutEffect(() => {
    const measure = () => {
      if (labelsRef.current) {
        setLabelColumnWidth(labelsRef.current.offsetWidth);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rows, isYoY, chartHeight]);

  useLayoutEffect(() => {
    if (!fillHeight || !scrollRef.current) {
      setFillPlotHeight(null);
      return;
    }

    const node = scrollRef.current;
    const measure = () => {
      const available = node.clientHeight;
      setFillPlotHeight(available > 0 ? available : null);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fillHeight, rows.length, isYoY]);

  if (items.length === 0) {
    return <p className="statement-lollipop-empty">{emptyMessage}</p>;
  }

  return (
    <div
      className={`health-subgroup-body environment-statement-body work-statement-chart-body${
        fillHeight ? ' is-fill-height' : ''
      }`}
    >
      <div className="health-subgroup-bar-panel">
        <div
          ref={scrollRef}
          className={`health-subgroup-bar-scroll statement-bar-chart-scroll${
            isScrollable ? ' is-scrollable' : ''
          }${fillHeight ? ' is-fill-height' : ''}`}
          style={fillHeight ? undefined : { maxHeight: maxBodyHeight }}
        >
          <div
            className={`statement-bar-chart health-subgroup-bar-chart${
              fillHeight ? ' work-statement-chart-stretch' : ''
            }`}
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
                  <span className={`statement-bar-label-icon health-subgroup-bar-label-icon ${labelIconClass}`}>
                    <WorkStatementIcon fullName={row.fullName} variant={variant} />
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
                aria-label={ariaLabel}
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
    </div>
  );
}
