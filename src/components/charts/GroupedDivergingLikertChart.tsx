import { useLayoutEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  generateEducationPositiveStatementsInsight,
  generateEducationRiskStatementsInsight,
  generateWorkPositiveStatementsInsight,
  generateWorkRiskStatementsInsight,
  getCurrentYearDivergingLikertRows,
  type DivergingLikertStatementRow,
  type InsightPart,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';

interface GroupedDivergingLikertChartProps {
  rows: DivergingLikertStatementRow[];
  title: string;
  subtitle?: string;
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears?: CompareYears;
  variant: 'positive' | 'risk';
  topic?: 'work' | 'education';
  insight?: InsightPart[];
  maxBodyHeight?: number;
  emptyMessage?: string;
  embedded?: boolean;
  showHeader?: boolean;
  showInsight?: boolean;
  showLaneBadge?: boolean;
}

type ChartRow = DivergingLikertStatementRow & {
  disagree: number;
  neutralLeft: number;
  neutralRight: number;
  agree: number;
};

type SentimentSegment = 'dissatisfied' | 'neutral' | 'satisfied';

const MIN_INSIDE_LABEL_WIDTH = 24;

const NEUTRAL_COLOR = '#e2e8f0';
const PLOT_WIDTH = 1000;
const PLOT_MARGIN = { top: 8, right: 48, left: 48, bottom: 0 };
const AXIS_HEIGHT = 36;
const ROW_HEIGHT = 44;
const PLOT_CHROME = PLOT_MARGIN.top;
const DOMAIN_TICKS = [-100, -50, 0, 50, 100];

const POSITIVE_BAR_COLORS = {
  light: '#86EFAC',
  dark: DESIGN.positive,
};

const RISK_BAR_COLORS = {
  light: '#FCA5A5',
  dark: DESIGN.negative,
};

function getBarColors(variant: 'positive' | 'risk') {
  return variant === 'risk' ? RISK_BAR_COLORS : POSITIVE_BAR_COLORS;
}

function scaleDivergingX(value: number): number {
  const innerWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
  return PLOT_MARGIN.left + ((value + 100) / 200) * innerWidth;
}

function DivergingLikertAxisRail({ labelColumnWidth }: { labelColumnWidth: number }) {
  return (
    <div className="grouped-diverging-likert-x-axis-rail">
      <div
        className="grouped-diverging-likert-x-axis-gutter"
        style={labelColumnWidth > 0 ? { width: labelColumnWidth } : undefined}
        aria-hidden="true"
      />
      <svg
        viewBox={`0 0 ${PLOT_WIDTH} ${AXIS_HEIGHT}`}
        className="grouped-diverging-likert-x-axis-svg"
        width="100%"
        height={AXIS_HEIGHT}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {DOMAIN_TICKS.map((tick) => (
          <text
            key={tick}
            x={scaleDivergingX(tick)}
            y={14}
            textAnchor="middle"
            className="grouped-diverging-likert-axis-label"
          >
            {Math.abs(tick)}%
          </text>
        ))}
        <line
          x1={scaleDivergingX(-100)}
          x2={scaleDivergingX(100)}
          y1={22}
          y2={22}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <line
          x1={scaleDivergingX(0)}
          x2={scaleDivergingX(0)}
          y1={18}
          y2={AXIS_HEIGHT}
          stroke="#64748b"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

function toChartRow(row: DivergingLikertStatementRow): ChartRow {
  return {
    ...row,
    disagree: -row.dissatisfied,
    neutralLeft: -row.neutral / 2,
    neutralRight: row.neutral / 2,
    agree: row.satisfied,
  };
}

function getSegmentLabelFill(
  segment: SentimentSegment,
  value: number,
  variant: 'positive' | 'risk',
): string {
  if (segment === 'neutral') return '#334155';
  if (segment === 'satisfied') {
    return value >= 16 ? '#ffffff' : variant === 'risk' ? '#b91c1c' : '#047857';
  }
  return value >= 16 ? '#0f172a' : '#64748b';
}

function DivergingBarValueLabel({
  x,
  y,
  width,
  height,
  index = 0,
  rows,
  segment,
  variant,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  rows: ChartRow[];
  segment: SentimentSegment;
  variant: 'positive' | 'risk';
}) {
  const row = rows[index];
  if (!row) return null;

  const displayValue =
    segment === 'dissatisfied' ? row.dissatisfied : segment === 'neutral' ? row.neutral : row.satisfied;
  if (displayValue <= 0) return null;

  const rawWidth = Number(width ?? 0);
  const barHeight = Number(height ?? 0);
  const barX = Number(x ?? 0);
  const barY = Number(y ?? 0);
  if (!Number.isFinite(rawWidth) || !Number.isFinite(barHeight) || barHeight < 8) return null;

  const segmentWidth = Math.abs(rawWidth);
  const centerY = barY + barHeight / 2;
  const placeInside = segmentWidth >= MIN_INSIDE_LABEL_WIDTH;
  let labelX = barX;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';

  if (segment === 'dissatisfied') {
    if (placeInside) {
      labelX = barX + rawWidth / 2;
      textAnchor = 'middle';
    } else {
      labelX = barX + rawWidth - 4;
      textAnchor = 'end';
    }
  } else if (placeInside) {
    labelX = barX + segmentWidth / 2;
    textAnchor = 'middle';
  } else {
    labelX = barX + segmentWidth + 4;
    textAnchor = 'start';
  }

  const fill = getSegmentLabelFill(segment, displayValue, variant);
  const useStroke = placeInside && segment !== 'neutral' && displayValue >= 16;

  return (
    <text
      x={labelX}
      y={centerY}
      textAnchor={textAnchor}
      dominantBaseline="middle"
      fontSize={10}
      fontWeight={700}
      fill={fill}
      stroke={useStroke ? 'rgba(15, 23, 42, 0.2)' : 'none'}
      strokeWidth={0.5}
      paintOrder="stroke fill"
      pointerEvents="none"
    >
      {`${displayValue.toFixed(1)}%`}
    </text>
  );
}

function makeDivergingBarLabel(rows: ChartRow[], segment: SentimentSegment, variant: 'positive' | 'risk') {
  return (props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => (
    <DivergingBarValueLabel {...props} rows={rows} segment={segment} variant={variant} />
  );
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

function EducationStatementIcon({
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
    if (/verbal abuse|ridicule|rumors/i.test(lower)) {
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    }
    if (/physical abuse|physically harmed|hitting|kicking/i.test(lower)) {
      return (
        <svg {...props}>
          <path d="M14 9V5a3 3 0 00-6 0v4" />
          <rect x="2" y="9" width="20" height="12" rx="2" />
        </svg>
      );
    }
    if (/harassed|harassment/i.test(lower)) {
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
        </svg>
      );
    }
  }

  if (/university|enrolling in university/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
      </svg>
    );
  }
  if (/government school|private school|school education|school quality|attending school/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M3 9l9-5 9 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
        <path d="M9 22V12h6v10" />
      </svg>
    );
  }
  if (/financial costs|costs of/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (/physically safe|physical safety/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (/discipline/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 3v18M8 7h8M8 12h8M8 17h5" />
      </svg>
    );
  }
  if (/sports|life skills|innovation/i.test(lower)) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a15 15 0 010 18M12 3a15 15 0 000 18M3 12h18" />
      </svg>
    );
  }
  if (/teaching profession|respect for the teaching/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    );
  }
  if (/proximity|educational facility/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function getDefaultSubtitle(topic: 'work' | 'education', variant: 'positive' | 'risk', year: SurveyYear): string {
  if (topic === 'education') {
    return variant === 'risk'
      ? `Q301 school safety risk statements for ${year}. Higher agreement signals reported concern.`
      : `Q301 positive education statements for ${year}, sorted by agreement.`;
  }

  return variant === 'risk'
    ? `Q210 risk statements for ${year}. Higher agreement signals reported employment concern.`
    : `Q210 positive statements for ${year}, sorted by agreement.`;
}

function resolveInsight(
  topic: 'work' | 'education',
  variant: 'positive' | 'risk',
  rows: DivergingLikertStatementRow[],
  year: SurveyYear,
  insight?: InsightPart[],
): InsightPart[] {
  if (insight) return insight;

  if (topic === 'education') {
    return variant === 'risk'
      ? generateEducationRiskStatementsInsight(rows, year)
      : generateEducationPositiveStatementsInsight(rows, year);
  }

  return variant === 'risk'
    ? generateWorkRiskStatementsInsight(rows, year)
    : generateWorkPositiveStatementsInsight(rows, year);
}

export function GroupedDivergingLikertChart({
  rows,
  title,
  subtitle,
  year,
  viewMode,
  compareYears = ['2024', '2025'],
  variant,
  topic = 'work',
  insight: insightOverride,
  maxBodyHeight,
  emptyMessage = 'No statements available.',
  embedded = false,
  showHeader,
  showInsight,
  showLaneBadge,
}: GroupedDivergingLikertChartProps) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [labelColumnWidth, setLabelColumnWidth] = useState(0);
  const laneClass = variant === 'risk' ? 'chart-risk-lane' : 'chart-positive-lane';
  const barColors = getBarColors(variant);
  const chartData = rows.map(toChartRow);
  const plotHeight = Math.max(180, chartData.length * ROW_HEIGHT + PLOT_CHROME);
  const scrollMaxHeight =
    maxBodyHeight != null ? Math.max(120, maxBodyHeight - AXIS_HEIGHT) : undefined;
  const isScrollable = scrollMaxHeight != null && plotHeight > scrollMaxHeight;

  useLayoutEffect(() => {
    const measure = () => {
      if (labelsRef.current) {
        setLabelColumnWidth(labelsRef.current.offsetWidth);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [chartData]);
  const insight = resolveInsight(
    topic,
    variant,
    getCurrentYearDivergingLikertRows(rows, viewMode, compareYears),
    year,
    insightOverride,
  );
  const headerIcon = variant === 'risk' ? 'risk-register' : 'protect';
  const labelIconClass = variant === 'risk' ? 'statement-risk-label-icon' : 'statement-positive-label-icon';
  const StatementIcon = topic === 'education' ? EducationStatementIcon : WorkStatementIcon;
  const shouldShowHeader = showHeader ?? !embedded;
  const shouldShowInsight = showInsight ?? true;
  const shouldShowLaneBadge = showLaneBadge ?? shouldShowHeader;
  const wrapperClassName = embedded
    ? `grouped-diverging-likert-embedded ${laneClass}`
    : `chart-card chart-card-fill grouped-diverging-likert-card ${laneClass}`;

  return (
    <div className={wrapperClassName}>
      {shouldShowHeader ? (
        <div className="chart-card-header">
          <ChartSectionHeader
            icon={headerIcon}
            title={title}
            subtitle={subtitle ?? getDefaultSubtitle(topic, variant, year)}
          />
          {shouldShowLaneBadge ? (
            <div className="chart-header-actions chart-header-actions-stacked">
              <StatementYearLegend
                viewMode={viewMode}
                compareYears={compareYears}
                year={year}
                variant={variant}
              />
              <span className={`statement-lollipop-badge ${variant === 'risk' ? 'is-risk' : 'is-positive'}`}>
                {variant === 'risk' ? 'Risk lane' : 'Positive lane'}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`chart-card-body grouped-diverging-likert-body${embedded ? ' is-embedded' : ''}`}>
        {chartData.length === 0 ? (
          <p className="statement-lollipop-empty">{emptyMessage}</p>
        ) : (
          <div className="grouped-diverging-likert-panel">
            <div
              className={`grouped-diverging-likert-chart-wrap${isScrollable ? ' is-scrollable' : ''}`}
              style={scrollMaxHeight != null ? { maxHeight: scrollMaxHeight } : undefined}
            >
              <div
                className="statement-bar-chart grouped-diverging-likert-shell"
                style={{ height: plotHeight, ['--statement-rows' as string]: chartData.length }}
              >
                <div className="statement-bar-labels" ref={labelsRef}>
                  {chartData.map((row) => (
                    <div key={row.id} className="statement-bar-label" title={row.fullName}>
                      <span
                        className={`statement-bar-label-icon ${labelIconClass}`}
                      >
                        <StatementIcon fullName={row.fullName} variant={variant} />
                      </span>
                      <span className="statement-bar-label-text">{row.name}</span>
                    </div>
                  ))}
                </div>
                <div className="statement-bar-plot">
                  <ResponsiveContainer width="100%" height={plotHeight}>
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={PLOT_MARGIN}
                      barCategoryGap="18%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
                      <XAxis type="number" domain={[-100, 100]} hide />
                      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} tickLine={false} />
                      <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
                      <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                        formatter={(value: number, name: string) => [`${Math.abs(value).toFixed(1)}%`, name]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                      />
                      <Bar dataKey="neutralLeft" stackId="left" fill={NEUTRAL_COLOR} legendType="none" isAnimationActive={false} />
                      <Bar
                        dataKey="disagree"
                        stackId="left"
                        fill={barColors.light}
                        legendType="none"
                        radius={[4, 0, 0, 4]}
                        isAnimationActive={false}
                        label={makeDivergingBarLabel(chartData, 'dissatisfied', variant)}
                      />
                      <Bar dataKey="neutralRight" stackId="right" fill={NEUTRAL_COLOR} legendType="none" isAnimationActive={false} label={makeDivergingBarLabel(chartData, 'neutral', variant)} />
                      <Bar
                        dataKey="agree"
                        stackId="right"
                        fill={barColors.dark}
                        legendType="none"
                        radius={[0, 4, 4, 0]}
                        isAnimationActive={false}
                        label={makeDivergingBarLabel(chartData, 'satisfied', variant)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <DivergingLikertAxisRail labelColumnWidth={labelColumnWidth} />
          </div>
        )}
      </div>

      {shouldShowInsight ? <ChartInsightFooter chartTitle={title} insight={insight} /> : null}
    </div>
  );
}
