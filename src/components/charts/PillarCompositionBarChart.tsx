import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN, PILLAR_TABS } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import type { PillarDumbbellItem } from '../../utils';
import { PillarTabIcon } from './PillarTabIcon';

interface PillarCompositionBarChartProps {
  items: PillarDumbbellItem[];
  compareYears: CompareYears;
  mode: ViewMode;
  selectedYear?: SurveyYear;
}

interface ChartRow {
  name: string;
  displayLabel: string;
  fullName: string;
  sectionId: string;
  icon: string;
  value2024: number | null;
  value2025: number | null;
  displayValue: number | null;
  isPending: boolean;
}

const PLOT_WIDTH = 1000;
const PLOT_MARGIN = { top: 8, right: 56, left: 10, bottom: 0 };
const AXIS_HEIGHT = 44;
const ROW_HEIGHT_YOY = 48;
const ROW_HEIGHT_SINGLE = 36;
const MAX_SCROLL_HEIGHT = 300;
const DOMAIN_TICKS = [0, 25, 50, 75, 100];

function getPillarIcon(sectionId: string): string {
  return PILLAR_TABS.find((tab) => tab.id === sectionId)?.icon ?? 'grid';
}

function getPillarLabel(sectionId: string, fallback: string): string {
  return PILLAR_TABS.find((item) => item.id === sectionId)?.label ?? fallback;
}

function buildChartRows(
  items: PillarDumbbellItem[],
  mode: ViewMode,
  selectedYear: SurveyYear,
): ChartRow[] {
  const isYoY = mode === 'yoy';

  return items.map((item) => {
    const isPending = item.status !== 'approved'
      || (isYoY
        ? item.value2024 == null || item.value2025 == null
        : (selectedYear === '2024' ? item.value2024 : item.value2025) == null);

    const displayValue = isPending
      ? null
      : isYoY
        ? item.value2025
        : selectedYear === '2024'
          ? item.value2024
          : item.value2025;

    return {
      name: item.sectionId,
      displayLabel: getPillarLabel(item.sectionId, item.name),
      fullName: item.name,
      sectionId: item.sectionId,
      icon: getPillarIcon(item.sectionId),
      value2024: isPending ? null : item.value2024,
      value2025: isPending ? null : item.value2025,
      displayValue,
      isPending,
    };
  });
}

function scaleX(value: number): number {
  const plotWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  return PLOT_MARGIN.left + (value / 100) * plotWidth;
}

function formatValueLabel(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function PillarCompositionBarChart({
  items,
  compareYears,
  mode,
  selectedYear = '2025',
}: PillarCompositionBarChartProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);
  const isYoY = mode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : selectedYear;
  const rows = buildChartRows(items, mode, selectedYear);
  const rowHeight = isYoY ? ROW_HEIGHT_YOY : ROW_HEIGHT_SINGLE;
  const chartHeight = Math.max(rows.length * rowHeight + PLOT_MARGIN.top + PLOT_MARGIN.bottom, 180);
  const plotBottom = chartHeight - PLOT_MARGIN.bottom;

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

  return (
    <div className="pillar-composition-chart-wrap">
      <div className="pillar-composition-chart-panel">
        <div
          className="pillar-composition-chart-scroll statement-bar-chart-scroll"
          style={{ maxHeight: MAX_SCROLL_HEIGHT }}
        >
          <div
            className="statement-bar-chart pillar-composition-bar-chart"
            style={{
              height: chartHeight,
              ['--statement-rows' as string]: rows.length,
              ['--statement-row-height' as string]: `${rowHeight}px`,
            }}
          >
            <div className="statement-bar-labels pillar-composition-labels" ref={labelsRef}>
              {rows.map((row) => (
                <div
                  key={row.sectionId}
                  className={`statement-bar-label pillar-composition-label${row.isPending ? ' is-pending' : ''}`}
                  title={row.fullName}
                >
                  <span className="statement-bar-label-icon pillar-composition-label-icon">
                    <PillarTabIcon name={row.icon} size={14} />
                  </span>
                  <span className="statement-bar-label-text">{row.displayLabel}</span>
                </div>
              ))}
            </div>

            <div className="statement-bar-plot pillar-composition-plot" style={{ height: chartHeight }}>
              <svg
                viewBox={`0 0 ${PLOT_WIDTH} ${chartHeight}`}
                className="pillar-composition-svg"
                width="100%"
                height={chartHeight}
                preserveAspectRatio="none"
                role="img"
                aria-label="Pillar score composition"
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

                  if (row.isPending) {
                    return null;
                  }

                  if (isYoY && row.value2024 != null && row.value2025 != null) {
                    const barHeight = 12;
                    const currentY = centerY - barHeight - 2;
                    const previousY = centerY + 2;
                    const previousWidth = scaleX(row.value2024) - PLOT_MARGIN.left;
                    const currentWidth = scaleX(row.value2025) - PLOT_MARGIN.left;

                    return (
                      <g key={row.sectionId}>
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
                          fill={DESIGN.chart.yearCurrent}
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
                          className="pillar-composition-bar-label"
                        >
                          {formatValueLabel(row.value2025)}
                        </text>
                        <text
                          x={scaleX(row.value2024) + 6}
                          y={previousY + barHeight / 2 + 4}
                          className="pillar-composition-bar-label"
                        >
                          {formatValueLabel(row.value2024)}
                        </text>
                      </g>
                    );
                  }

                  if (!isYoY && row.displayValue != null) {
                    const barHeight = 16;
                    const barY = centerY - barHeight / 2;
                    const barWidth = scaleX(row.displayValue) - PLOT_MARGIN.left;

                    return (
                      <g key={row.sectionId}>
                        <title>{`${row.fullName}\n${displayYear}: ${formatValueLabel(row.displayValue)}`}</title>
                        <rect
                          x={PLOT_MARGIN.left}
                          y={barY}
                          width={Math.max(barWidth, 0)}
                          height={barHeight}
                          rx={4}
                          ry={4}
                          fill={DESIGN.chart.yearCurrent}
                        />
                        <text
                          x={scaleX(row.displayValue) + 6}
                          y={centerY + 4}
                          className="pillar-composition-bar-label"
                        >
                          {formatValueLabel(row.displayValue)}
                        </text>
                      </g>
                    );
                  }

                  return null;
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="pillar-composition-x-axis-rail">
          <div
            className="pillar-composition-x-axis-gutter"
            style={labelColumnWidth > 0 ? { width: labelColumnWidth } : undefined}
            aria-hidden="true"
          />
          <svg
            viewBox={`0 0 ${PLOT_WIDTH} ${AXIS_HEIGHT}`}
            className="pillar-composition-x-axis-svg"
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
                className="pillar-composition-axis-label"
              >
                {tick}%
              </text>
            ))}
            <text
              x={PLOT_WIDTH / 2}
              y={36}
              textAnchor="middle"
              className="pillar-composition-axis-title"
            >
              Section score (%)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
