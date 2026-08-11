import { useState, type ReactElement, type ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie,
  LabelList,
  Label,
} from 'recharts';
import type { SectionScore, SurveyYear, ViewMode } from '../types';
import { CHART_COLORS, DESIGN } from '../types';
import {
  generatePartnerChartInsight,
  generateEducationChartInsight,
  generateHealthChartInsight,
  generateEnvironmentChartInsight,
  generatePillarTableInsight,
  formatDelta,
  mergeStatementComparisonData,
  generateIncomeSpendingInsight,
  generateIncomeSavingInsight,
  generateIncomeBarrierInsight,
  generateIncomeFeelingInsight,
  generateWorkJobseekerInsight,
  generateWorkChallengeInsight,
  generateWorkBusinessInsight,
  generateWorkSupportInsight,
  generateEducationTabChartInsight,
  generateEducationLikertScaleInsight,
  getLikertDominantSegmentIndex,
  EDUCATION_LIKERT_SCALE_LABELS,
  EDUCATION_LIKERT_SCALE_ORDER,
  type IncomeChartRow,
  type EducationSentimentRow,
  type EducationLikertScaleKey,
  type EducationLikertScaleRow,
  type InsightPart,
} from '../utils';

const STATEMENT_CHART_CHROME = 64;

type SentimentRow = { satisfied: number; fullName: string; name: string };

function sortSentimentRowsDescending<T extends SentimentRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.satisfied - a.satisfied);
}

function sortComparisonRowsDescending(rows: StatementComparisonRow[]): StatementComparisonRow[] {
  return [...rows].sort((a, b) => b.satisfied2025 - a.satisfied2025);
}

function sortIncomeChartRowsDescending(
  rows: IncomeChartRow[],
  isCurrent: boolean,
  year: SurveyYear,
): IncomeChartRow[] {
  return [...rows].sort((a, b) => {
    const aScore = isCurrent ? (year === '2025' ? a.value2025 : a.value2024) : a.value2025;
    const bScore = isCurrent ? (year === '2025' ? b.value2025 : b.value2024) : b.value2025;
    return bScore - aScore;
  });
}

type BarLabelCoordinate = number | string | undefined;

function toBarLabelNumber(value: BarLabelCoordinate): number | undefined {
  if (value == null) return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

const SENTIMENT_COLORS = {
  dissatisfied: DESIGN.negative,
  neutral: '#94a3b8',
  satisfied: DESIGN.chart.export,
} as const;

const SENTIMENT_LABELS = {
  dissatisfied: 'Unsatisfied',
  neutral: 'Neutral',
  satisfied: 'Satisfied',
} as const;

type SentimentKey = keyof typeof SENTIMENT_COLORS;

const SENTIMENT_LEGEND_ORDER: SentimentKey[] = ['satisfied', 'neutral', 'dissatisfied'];

function sentimentDataKey(key: SentimentKey, year?: '2024' | '2025'): string {
  return year ? `${key}${year}` : key;
}

function getSegmentLabelFill(segment: SentimentKey, value: number): string {
  if (segment === 'neutral') return '#1f2937';
  return value >= 16 ? '#ffffff' : '#1f2937';
}

function BarSegmentScoreLabel({
  x,
  y,
  width,
  height,
  value,
  segment,
}: {
  x?: BarLabelCoordinate;
  y?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  height?: BarLabelCoordinate;
  value?: BarLabelCoordinate;
  segment: SentimentKey;
}) {
  const nx = toBarLabelNumber(x);
  const ny = toBarLabelNumber(y);
  const nwidth = toBarLabelNumber(width);
  const nheight = toBarLabelNumber(height);
  const nvalue = toBarLabelNumber(value);
  if (nvalue == null || nvalue < 4 || nx == null || ny == null || nwidth == null || nheight == null || nheight < 14) {
    return null;
  }

  return (
    <text
      x={nx + nwidth / 2}
      y={ny + nheight / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={9}
      fontWeight={600}
      fill={getSegmentLabelFill(segment, nvalue)}
    >
      {`${nvalue.toFixed(0)}%`}
    </text>
  );
}

function BarSegmentScoreLabelHorizontal({
  x,
  y,
  width,
  height,
  value,
  segment,
}: {
  x?: BarLabelCoordinate;
  y?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  height?: BarLabelCoordinate;
  value?: BarLabelCoordinate;
  segment: SentimentKey;
}) {
  const nx = toBarLabelNumber(x);
  const ny = toBarLabelNumber(y);
  const nwidth = toBarLabelNumber(width);
  const nheight = toBarLabelNumber(height);
  const nvalue = toBarLabelNumber(value);
  if (nvalue == null || nvalue < 4 || nx == null || ny == null || nwidth == null || nheight == null || nwidth < 28) {
    return null;
  }

  return (
    <text
      x={nx + nwidth / 2}
      y={ny + nheight / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={9}
      fontWeight={600}
      fill={getSegmentLabelFill(segment, nvalue)}
    >
      {`${nvalue.toFixed(0)}%`}
    </text>
  );
}

function BarYearChartTopLabel({
  x,
  width,
  year,
}: {
  x?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  year: string;
}) {
  const nx = toBarLabelNumber(x);
  const nwidth = toBarLabelNumber(width);
  if (nx == null || nwidth == null) return null;
  return (
    <text x={nx + nwidth / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={600} fill="#64748b">
      {year}
    </text>
  );
}

function BarYearBarSideLabel({
  x,
  y,
  width,
  height,
  year,
}: {
  x?: BarLabelCoordinate;
  y?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  height?: BarLabelCoordinate;
  year: string;
}) {
  const nx = toBarLabelNumber(x);
  const ny = toBarLabelNumber(y);
  const nwidth = toBarLabelNumber(width);
  const nheight = toBarLabelNumber(height);
  if (nx == null || ny == null || nwidth == null || nheight == null) return null;
  return (
    <text
      x={nx + nwidth + 8}
      y={ny + nheight / 2}
      dominantBaseline="middle"
      fontSize={10}
      fontWeight={600}
      fill="#64748b"
    >
      {year}
    </text>
  );
}

interface StatementChartRow {
  name: string;
  fullName: string;
}

function StatementChartShell({
  data,
  chartHeight,
  children,
  renderLabelIcon,
  labelIconClassName,
  className,
  fillHeight = false,
  reverseLabelOrder = false,
}: {
  data: StatementChartRow[];
  chartHeight: number;
  children: ReactElement;
  renderLabelIcon?: (row: StatementChartRow) => ReactElement;
  labelIconClassName?: (row: StatementChartRow) => string | undefined;
  className?: string;
  fillHeight?: boolean;
  reverseLabelOrder?: boolean;
}) {
  const labelRows = reverseLabelOrder ? [...data].reverse() : data;

  return (
    <div
      className={`statement-bar-chart ${fillHeight ? 'statement-bar-chart-fill' : ''} ${className ?? ''}`.trim()}
      style={
        fillHeight
          ? { ['--statement-rows' as string]: data.length }
          : { height: chartHeight, ['--statement-rows' as string]: data.length }
      }
    >
      <div className="statement-bar-labels">
        {labelRows.map((row) => (
          <div key={row.fullName} className="statement-bar-label" title={row.fullName}>
            {renderLabelIcon && (
              <span
                className={`statement-bar-label-icon ${labelIconClassName?.(row) ?? ''}`.trim()}
              >
                {renderLabelIcon(row)}
              </span>
            )}
            <span className="statement-bar-label-text">{row.name}</span>
          </div>
        ))}
      </div>
      <div className="statement-bar-plot">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type StatementComparisonRow = {
  name: string;
  fullName: string;
  dissatisfied2024: number;
  neutral2024: number;
  satisfied2024: number;
  dissatisfied2025: number;
  neutral2025: number;
  satisfied2025: number;
};

type TrendDirection = 'up' | 'down' | 'same';

function getTrend(previous: number, current: number): { direction: TrendDirection; className: string } {
  const change = current - previous;
  if (change > 0) return { direction: 'up', className: 'growth-positive' };
  if (change < 0) return { direction: 'down', className: 'growth-negative' };
  return { direction: 'same', className: 'growth-neutral' };
}

function ChangeIndicator({ change, className = '' }: { change: number; className?: string }) {
  const { direction, className: trendClass } = getTrend(0, change);
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';

  return (
    <span className={`chart-change-indicator trend-value ${trendClass} ${className}`.trim()}>
      <span className="trend-arrow" aria-hidden="true">{arrow}</span>
      {formatDelta(change)}
    </span>
  );
}

function HeatmapCellValue({
  value,
  change,
  showChange = false,
  invert = false,
}: {
  value: number;
  change?: number;
  showChange?: boolean;
  invert?: boolean;
}) {
  return (
    <div className={`health-heatmap-cell-content${showChange ? ' health-heatmap-cell-content-inline' : ''}`}>
      <span className="health-heatmap-cell-value">{value.toFixed(0)}%</span>
      {showChange && change !== undefined && Math.abs(change) >= 0.5 && (
        <ChangeIndicator
          change={change}
          className={`health-heatmap-cell-change${invert ? ' health-heatmap-cell-change-invert' : ''}`}
        />
      )}
    </div>
  );
}

function ChartScoreBadge({ score, mode }: { score: number; mode: ViewMode }) {
  if (mode === 'current') {
    return (
      <span className="chart-badge chart-badge-compact">
        <strong>{score.toFixed(1)}%</strong> Score
      </span>
    );
  }

  const arrow = score >= 0 ? '▲' : '▼';
  return (
    <span className={`chart-badge chart-badge-compact ${score < 0 ? 'chart-badge-negative' : 'chart-badge-yoy'}`}>
      <strong>{formatDelta(score)}</strong>
      <span className="chart-badge-arrow" aria-hidden="true">{arrow}</span> YoY
    </span>
  );
}

/** Matches `.chart-legend-swatch-muted` / `.chart-legend-swatch-current` in index.css */
const YEAR_COMPARISON_BAR = {
  previous: DESIGN.chart.yearPrevious,
  current: DESIGN.chart.yearCurrent,
} as const;

function YearComparisonLegend({ rounded = false }: { rounded?: boolean }) {
  const swatchClass = (variant: 'muted' | 'current') =>
    [
      'chart-legend-swatch',
      rounded ? 'chart-legend-swatch-rounded' : '',
      variant === 'muted' ? 'chart-legend-swatch-muted' : 'chart-legend-swatch-current',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="chart-legend chart-legend-bottom-right">
      <span className="chart-legend-item">
        <span className={swatchClass('muted')} aria-hidden="true" />
        2024
      </span>
      <span className="chart-legend-item">
        <span className={swatchClass('current')} aria-hidden="true" />
        2025
      </span>
    </div>
  );
}

function renderYoYBarCells(chartData: { fullName: string }[], year: '2024' | '2025') {
  const fill = year === '2024' ? YEAR_COMPARISON_BAR.previous : YEAR_COMPARISON_BAR.current;
  return chartData.map((entry) => <Cell key={`${entry.fullName}-${year}`} fill={fill} />);
}

function yearBarColor(year: SurveyYear): string {
  return year === '2024' ? YEAR_COMPARISON_BAR.previous : YEAR_COMPARISON_BAR.current;
}

interface ChartTooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  change?: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = '%',
}: {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;

  const entries = payload.filter((entry) => Math.abs(Number(entry.value ?? 0)) > 0.05);
  if (!entries.length) return null;

  return (
    <div className="chart-tooltip">
      {label && entries.length > 1 && (
        <div className="chart-tooltip-title">{label}</div>
      )}
      {entries.map((entry) => {
        const name = entry.name ?? 'Value';
        const value = Math.abs(Number(entry.value ?? 0)).toFixed(1);
        const headerLabel = entries.length === 1 ? (label ?? name) : name;
        const change =
          entry.change !== undefined && Math.abs(entry.change) >= 0.5
            ? formatDelta(entry.change)
            : null;
        return (
          <div key={name} className="chart-tooltip-entry">
            <div className="chart-tooltip-header">
              <span className="chart-tooltip-swatch" style={{ background: entry.color ?? '#3b82f6' }} />
              <span className="chart-tooltip-label">{headerLabel}</span>
            </div>
            <div className="chart-tooltip-value">
              {headerLabel}: {value}{suffix}
              {change && <span className="chart-tooltip-change"> ({change})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderInsight(parts: InsightPart[]) {
  return parts.map((part, index) =>
    typeof part === 'string' ? (
      part
    ) : (
      <strong key={index} className="chart-insight-emphasis">
        {part.bold}
      </strong>
    ),
  );
}

function ChartInsightFooter({ insight }: { insight: InsightPart[] }) {
  return (
    <div className="chart-insight-footer">
      <hr className="chart-insight-separator" />
      <p className="chart-insight-text">
        <span className="chart-insight-icon" aria-hidden="true">
          <span className="insights-badge">Bayaan AI</span>
        </span>
        <span>{renderInsight(insight)}</span>
      </p>
    </div>
  );
}

interface PillarScoresChartProps {
  data: { name: string; value2024: number; value2025: number; value: number }[];
  mode: ViewMode;
  year?: SurveyYear;
  title?: string;
}

export function PillarScoresChart({ data, mode, year = '2025', title = 'Pillar Satisfaction — Annual (%)' }: PillarScoresChartProps) {
  const chartData = [...data]
    .sort((a, b) => {
      const aValue = mode === 'current' ? (year === '2025' ? a.value2025 : a.value2024) : a.value;
      const bValue = mode === 'current' ? (year === '2025' ? b.value2025 : b.value2024) : b.value;
      return bValue - aValue;
    })
    .map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name,
    fullName: d.name,
    value: mode === 'current' ? (year === '2025' ? d.value2025 : d.value2024) : d.value,
    change: d.value,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">
            {mode === 'current' ? `${year} satisfaction by pillar` : 'Year-over-year change (%)'}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} />
          <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={mode === 'yoy' ? ['auto', 'auto'] : [0, 100]} />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, mode === 'current' ? 'Score' : 'Change']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
          />
          <Bar dataKey="value" fill={DESIGN.chart.barAlt} radius={[4, 4, 0, 0]} maxBarSize={52}>
            <LabelList dataKey="value" position="top" formatter={(v: number) => `${v > 0 && mode === 'yoy' ? '+' : ''}${v.toFixed(1)}`} style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} />
            {chartData.map((entry) => (
              <Cell
                key={entry.fullName}
                fill={mode === 'yoy' && entry.value < 0 ? DESIGN.negative : DESIGN.chart.barAlt}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendChartProps {
  overall2024: number;
  overall2025: number;
  mode: ViewMode;
}

export function TrendChart({ overall2024, overall2025, mode }: TrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const chartData = [
    { year: '2024', score2024: overall2024, score2025: overall2024 },
    { year: '2025', score2024: overall2024, score2025: overall2025 },
  ];

  const vals = [overall2024, overall2025];
  const yMin = Math.floor(Math.min(...vals) - 5);
  const yMax = Math.ceil(Math.max(...vals) + 5);
  const stats = [
    { label: 'Latest', value: overall2025 },
    { label: 'Peak', value: Math.max(...vals) },
    { label: 'Low', value: Math.min(...vals) },
    { label: 'Average', value: vals.reduce((a, b) => a + b, 0) / vals.length },
  ];

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">District Satisfaction — Annual Trends (%)</div>
          <div className="chart-subtitle">Overall resident satisfaction score</div>
        </div>
        <div className="chart-header-actions">
          <span className="chart-badge">Live</span>
          <div className="chart-toggle">
            <button type="button" className={`chart-toggle-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>Line</button>
            <button type="button" className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>Bar</button>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        {chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: DESIGN.chart.axis }} />
            <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: DESIGN.chart.axis }} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Score']} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <Line type="monotone" dataKey="score2025" stroke={DESIGN.chart.export} strokeWidth={2.5} dot={{ r: 5, fill: DESIGN.chart.export, strokeWidth: 0 }} name="2025 Score" />
            <Line type="monotone" dataKey="score2024" stroke={DESIGN.chart.import} strokeWidth={2.5} dot={{ r: 5, fill: DESIGN.chart.import, strokeWidth: 0 }} name="2024 Score" />
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: DESIGN.chart.axis }} />
            <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: DESIGN.chart.axis }} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Score']} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            <Bar dataKey="score2025" fill={DESIGN.chart.export} radius={[4, 4, 0, 0]} name="2025 Score" maxBarSize={48} />
            <Bar dataKey="score2024" fill={DESIGN.chart.import} radius={[4, 4, 0, 0]} name="2024 Score" maxBarSize={48} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <div className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-box">
            <div className="stat-box-label">{s.label}</div>
            <div className="stat-box-value">{s.value.toFixed(mode === 'current' ? 0 : 1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PartnerChartProps {
  data: { name: string; value: number; fullName?: string; value2024?: number; value2025?: number }[];
  mode: ViewMode;
  year?: SurveyYear;
  badgeScore?: number;
}

function PartnerBarChange({ previous, current }: { previous: number; current: number }) {
  const change = current - previous;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
  const className = direction === 'up' ? 'growth-positive' : direction === 'down' ? 'growth-negative' : 'growth-neutral';
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';
  const prefix = change > 0 ? '+' : '';

  return (
    <span className={`partner-bar-change trend-value ${className}`}>
      <span className="trend-arrow" aria-hidden="true">{arrow}</span>
      {prefix}{change.toFixed(1)}%
    </span>
  );
}

export function PartnerChart({ data, mode, year = '2025', badgeScore }: PartnerChartProps) {
  const isCurrent = mode === 'current';
  const getScore = (item: PartnerChartProps['data'][number]) =>
    isCurrent ? item.value : (item.value2025 ?? item.value);
  const sorted = [...data].sort((a, b) => getScore(b) - getScore(a)).slice(0, 7);
  const maxScore = Math.max(...sorted.map(getScore), 1);
  const insight = generatePartnerChartInsight(data, mode);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Satisfaction by Pillar</div>
          <div className="chart-subtitle">
            {isCurrent ? `Share of total — ${year} scores` : '2024 vs 2025 scores by pillar'}
          </div>
        </div>
        {badgeScore !== undefined && <ChartScoreBadge score={badgeScore} mode={mode} />}
      </div>
      <div className="partner-chart-body">
        <div className={`partner-bar-list ${!isCurrent ? 'partner-bar-list-yoy' : ''}`}>
          {sorted.map((item, i) => {
            const score2025 = item.value2025 ?? item.value;
            const score2024 = item.value2024 ?? score2025 - item.value;
            const currentScore = isCurrent ? getScore(item) : score2025;
            const barColor = CHART_COLORS[i % CHART_COLORS.length];

            return (
              <div key={item.name} className={`partner-bar-item ${!isCurrent ? 'partner-bar-item-yoy' : ''}`}>
                <span className="partner-bar-label">{item.fullName ?? item.name}</span>
                <span className="partner-bar-pct">
                  {isCurrent ? (
                    `${currentScore.toFixed(1)}%`
                  ) : (
                    <>
                      {score2025.toFixed(1)}%
                      <PartnerBarChange previous={score2024} current={score2025} />
                    </>
                  )}
                </span>
                {isCurrent ? (
                  <div className="partner-bar-track">
                    <div
                      className="partner-bar-fill"
                      style={{
                        width: `${Math.min(100, (currentScore / maxScore) * 100)}%`,
                        background: barColor,
                      }}
                    />
                  </div>
                ) : (
                  <div className="partner-bar-dual">
                    <div className="partner-bar-dual-row">
                      <span className="partner-bar-year">2025</span>
                      <div className="partner-bar-track">
                        <div
                          className="partner-bar-fill"
                          style={{
                            width: `${Math.min(100, (score2025 / maxScore) * 100)}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>
                    <div className="partner-bar-dual-row">
                      <span className="partner-bar-year">2024</span>
                      <div className="partner-bar-track">
                        <div
                          className="partner-bar-fill partner-bar-fill-muted"
                          style={{
                            width: `${Math.min(100, (score2024 / maxScore) * 100)}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface DistributionChartProps {
  data: { name: string; value: number; fullName?: string }[];
  title: string;
  subtitle?: string;
}

export function DistributionChart({ data, title, subtitle }: DistributionChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 34)}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={[0, 'auto']} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: DESIGN.chart.axis }} />
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''} />
          <Bar dataKey="value" fill={DESIGN.chart.bar} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="value" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LikertChartProps {
  statements: { name: string; value2024: number; value2025: number; value: number; fullName?: string }[];
  mode: ViewMode;
  year?: SurveyYear;
  title?: string;
}

export function LikertChart({ statements, mode, year = '2025', title = 'Key Survey Statements' }: LikertChartProps) {
  const top = [...statements]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="chart-card full-width">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">
            {mode === 'current' ? `Agreement rate (${year})` : 'Change in agreement (2024 → 2025)'}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, top.length * 38)}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={mode === 'yoy' ? ['auto', 'auto'] : [0, 100]} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10, fill: DESIGN.chart.axis }} />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(1)}%`, mode === 'current' ? 'Agreement' : 'Change']}
            labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} fill={DESIGN.chart.bar}>
            {top.map((entry) => (
              <Cell key={entry.name} fill={mode === 'yoy' && entry.value < 0 ? DESIGN.negative : DESIGN.chart.bar} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DataTableProps {
  rows: {
    pillar: string;
    score2024: number;
    score2025: number;
    satisfied2024: number;
    satisfied2025: number;
    unsatisfied2024: number;
    unsatisfied2025: number;
  }[];
  mode: ViewMode;
  year?: SurveyYear;
}

function TrendValue({ previous, current }: { previous: number; current: number }) {
  const { direction, className } = getTrend(previous, current);
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';

  return (
    <span className={`trend-value ${className}`}>
      <span className="trend-arrow" aria-hidden="true">{arrow}</span>
      {current.toFixed(1)}%
    </span>
  );
}

function getScoreTone(score: number): 'positive' | 'negative' {
  return score >= 70 ? 'positive' : 'negative';
}

function CurrentValue({ value, tone }: { value: number; tone?: 'positive' | 'negative' }) {
  const className = tone === 'positive' ? 'growth-positive' : tone === 'negative' ? 'growth-negative' : '';
  return (
    <span className={className ? `trend-value ${className}` : undefined}>
      {value.toFixed(1)}%
    </span>
  );
}

function ChangeValue({ change }: { change: number }) {
  return <ChangeIndicator change={change} />;
}

export function DataTable({ rows, mode, year = '2025' }: DataTableProps) {
  const isCurrent = mode === 'current';
  const insight = generatePillarTableInsight(rows, mode);
  const currentScoreKey = year === '2025' ? 'score2025' : 'score2024';
  const currentSatisfiedKey = year === '2025' ? 'satisfied2025' : 'satisfied2024';
  const currentUnsatisfiedKey = year === '2025' ? 'unsatisfied2025' : 'unsatisfied2024';
  const scoreColumnLabel = `${year} Score`;

  return (
    <div className="data-table-card full-width">
      <div className="data-table-header">
        <div className="data-table-title">Annual Pillar Data</div>
        <button type="button" className="data-table-export">Export CSV ↓</button>
      </div>
      {!isCurrent && (
        <div className="data-table-legend">
          <span className="trend-value growth-positive"><span className="trend-arrow">▲</span> Increased</span>
          <span className="trend-value growth-negative"><span className="trend-arrow">▼</span> Decreased</span>
          <span className="trend-value growth-neutral"><span className="trend-arrow">●</span> Unchanged</span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Pillar</th>
            {!isCurrent && <th>2024 Score</th>}
            <th>{isCurrent ? scoreColumnLabel : '2025 Score'}</th>
            {!isCurrent && <th>Score Change</th>}
            <th>Satisfied %</th>
            <th>Unsatisfied %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pillar}>
              <td>{row.pillar}</td>
              {!isCurrent && (
                <td>
                  <span className="table-score table-score-2024">{row.score2024.toFixed(1)}%</span>
                </td>
              )}
              <td>
                <CurrentValue value={row[currentScoreKey]} tone={getScoreTone(row[currentScoreKey])} />
              </td>
              {!isCurrent && (
                <td>
                  <ChangeValue change={row.score2025 - row.score2024} />
                </td>
              )}
              <td>
                {isCurrent ? (
                  <CurrentValue value={row[currentSatisfiedKey]} tone="positive" />
                ) : (
                  <TrendValue previous={row.satisfied2024} current={row.satisfied2025} />
                )}
              </td>
              <td>
                {isCurrent ? (
                  <CurrentValue value={row[currentUnsatisfiedKey]} tone="negative" />
                ) : (
                  <TrendValue previous={row.unsatisfied2024} current={row.unsatisfied2025} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

type EducationChartRow = {
  name: string;
  fullName: string;
  dissatisfied: number;
  neutral: number;
  satisfied: number;
};

function getEducationStatementIconType(fullName: string): string {
  const lower = fullName.toLowerCase();
  if (/financial|cost/i.test(lower)) return 'cost';
  if (/university/i.test(lower)) return 'university';
  if (/private school/i.test(lower)) return 'private-school';
  if (/government|public school/i.test(lower)) return 'public-school';
  if (/quality/i.test(lower)) return 'quality';
  if (/ease|enrolling|attending|access/i.test(lower)) return 'access';
  if (/proximity|close|near/i.test(lower)) return 'location';
  return 'book';
}

function EducationStatementIcon({ fullName }: { fullName: string }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (getEducationStatementIconType(fullName)) {
    case 'cost':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" />
        </svg>
      );
    case 'university':
      return (
        <svg {...props}>
          <path d="M22 10l-10-5L2 10l10 5 10-5z" />
          <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
      );
    case 'private-school':
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
          <path d="M12 7v3M10.5 8.5L12 7l1.5 1.5" />
        </svg>
      );
    case 'public-school':
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
          <path d="M12 3v4" />
        </svg>
      );
    case 'quality':
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8l-6.3 4.2 2.3-7-6-4.6h7.6L12 2z" />
        </svg>
      );
    case 'access':
      return (
        <svg {...props}>
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      );
    case 'location':
      return (
        <svg {...props}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
  }
}

function EducationCategoryTick({
  x = 0,
  y = 0,
  payload,
  rows,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  rows: Array<{ name: string; fullName: string }>;
}) {
  const label = payload?.value ?? '';
  const row = rows.find((item) => item.name === label);

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-40} y={6} width={80} height={78}>
        <div className="education-axis-tick">
          <span className="education-axis-tick-icon">
            <EducationStatementIcon fullName={row?.fullName ?? label} />
          </span>
          <span className="education-axis-tick-label" title={row?.fullName ?? label}>
            {label}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

const EDUCATION_CHART_MARGIN = { top: 12, right: 12, left: 4, bottom: 48 };
const EDUCATION_COMPARISON_MARGIN = { top: 32, right: 12, left: 4, bottom: 48 };

function buildSentimentTooltipPayload(
  row: Record<string, number | string> | undefined,
  year?: '2024' | '2025',
  labels: Record<SentimentKey, string> = SENTIMENT_LABELS,
): ChartTooltipEntry[] {
  if (!row) return [];
  return (Object.keys(labels) as SentimentKey[])
    .map((key) => ({
      name: labels[key],
      value: Number(row[sentimentDataKey(key, year)] ?? 0),
      color: SENTIMENT_COLORS[key],
    }))
    .filter((entry) => Math.abs(entry.value) > 0.05);
}

function SentimentLegend({
  showYears = false,
  align = 'default',
  labels = SENTIMENT_LABELS,
}: {
  showYears?: boolean;
  align?: 'default' | 'bottom-right';
  labels?: Record<SentimentKey, string>;
}) {
  return (
    <div
      className={`stacked-comparison-legend ${
        align === 'bottom-right' ? 'stacked-comparison-legend-bottom-right' : ''
      }`.trim()}
    >
      {showYears && (
        <div className="stacked-comparison-years">
          <span className="year-chip year-chip-muted">2024</span>
          <span className="year-chip">2025</span>
        </div>
      )}
      <div className={`sentiment-legend ${align === 'bottom-right' ? 'sentiment-legend-bottom-right' : ''}`.trim()}>
        {SENTIMENT_LEGEND_ORDER.map((key) => (
          <span key={key} className="sentiment-legend-item">
            <span className="sentiment-legend-swatch" style={{ background: SENTIMENT_COLORS[key] }} />
            {labels[key]}
          </span>
        ))}
      </div>
    </div>
  );
}

interface EducationDivergingBarProps {
  data: EducationChartRow[];
  data2024: EducationChartRow[];
  mode: ViewMode;
  year?: SurveyYear;
  score: number;
}

function renderEducationCurrentChart(data: EducationChartRow[], rows: EducationChartRow[]) {
  return (
    <BarChart
      data={data}
      margin={EDUCATION_CHART_MARGIN}
      barCategoryGap="18%"
    >
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
      <XAxis
        dataKey="name"
        interval={0}
        height={86}
        tickLine={false}
        axisLine={{ stroke: DESIGN.chart.grid }}
        tick={(props) => <EducationCategoryTick {...props} rows={rows} />}
      />
      <YAxis
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          const row = payload?.[0]?.payload as Record<string, number | string> | undefined;
          return (
            <ChartTooltip
              active={active}
              label={String(row?.fullName ?? '') || undefined}
              payload={buildSentimentTooltipPayload(row)}
            />
          );
        }}
      />
      <Bar
        dataKey="dissatisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.dissatisfied}
        name={SENTIMENT_LABELS.dissatisfied}
        legendType="none"
        radius={[0, 0, 4, 4]}
        maxBarSize={48}
      >
        <LabelList
          dataKey="dissatisfied"
          content={(props) => <BarSegmentScoreLabel {...props} segment="dissatisfied" />}
        />
      </Bar>
      <Bar
        dataKey="neutral"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.neutral}
        name={SENTIMENT_LABELS.neutral}
        legendType="none"
        maxBarSize={48}
      >
        <LabelList
          dataKey="neutral"
          content={(props) => <BarSegmentScoreLabel {...props} segment="neutral" />}
        />
      </Bar>
      <Bar
        dataKey="satisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.satisfied}
        name={SENTIMENT_LABELS.satisfied}
        legendType="none"
        radius={[4, 4, 0, 0]}
        maxBarSize={48}
      >
        <LabelList
          dataKey="satisfied"
          content={(props) => <BarSegmentScoreLabel {...props} segment="satisfied" />}
        />
      </Bar>
    </BarChart>
  );
}

function renderEducationComparisonChart(data: StatementComparisonRow[], rows: EducationChartRow[]) {
  const comparisonBars: Array<'2024' | '2025'> = ['2024', '2025'];

  return (
    <BarChart
      data={data}
      margin={EDUCATION_COMPARISON_MARGIN}
      barCategoryGap="14%"
      barGap={4}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
      <XAxis
        dataKey="name"
        interval={0}
        height={86}
        tickLine={false}
        axisLine={{ stroke: DESIGN.chart.grid }}
        tick={(props) => <EducationCategoryTick {...props} rows={rows} />}
      />
      <YAxis
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const row = payload[0]?.payload as StatementComparisonRow;
          const year = String(payload[0]?.dataKey ?? '').includes('2024') ? '2024' : '2025';
          return (
            <ChartTooltip
              active={active}
              label={`${row.fullName} (${year})`}
              payload={buildSentimentTooltipPayload(row, year)}
            />
          );
        }}
      />
      {comparisonBars.flatMap((year) =>
        (['dissatisfied', 'neutral', 'satisfied'] as SentimentKey[]).map((segment, segmentIndex) => {
          const dataKey = sentimentDataKey(segment, year);
          const isBottom = segmentIndex === 0;
          const isTop = segmentIndex === 2;
          return (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              stackId={year}
              fill={SENTIMENT_COLORS[segment]}
              legendType="none"
              fillOpacity={year === '2024' ? 0.82 : 1}
              radius={isBottom ? [0, 0, 4, 4] : isTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={32}
            >
              <LabelList
                dataKey={dataKey}
                content={(props) => (
                  <>
                    <BarSegmentScoreLabel {...props} segment={segment} />
                    {isTop && <BarYearChartTopLabel {...props} year={year} />}
                  </>
                )}
              />
            </Bar>
          );
        })
      )}
    </BarChart>
  );
}

export function EducationDivergingBar({ data, data2024, mode, year = '2025', score }: EducationDivergingBarProps) {
  const isCurrent = mode === 'current';
  const sortedData = sortSentimentRowsDescending(data);
  const comparisonData = mergeStatementComparisonData(data2024, data);
  const sortedComparison = sortComparisonRowsDescending(comparisonData);
  const insight = generateEducationChartInsight(sortedData, mode, data2024);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Education Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? `${year} sentiment breakdown by statement`
              : '2024 vs 2025 sentiment breakdown by statement'}
          </div>
        </div>
        <ChartScoreBadge score={score} mode={mode} />
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={isCurrent ? 340 : 368}>
          {isCurrent
            ? renderEducationCurrentChart(sortedData, sortedData)
            : renderEducationComparisonChart(sortedComparison, sortedData)}
        </ResponsiveContainer>
        <SentimentLegend showYears={!isCurrent} align={isCurrent ? 'bottom-right' : 'default'} />
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface HealthHeatmapChartProps {
  heatmapData: {
    name: string;
    fullName: string;
    agreement2024: number;
    agreement2025: number;
  }[];
  sectionScore: SectionScore;
  mode: ViewMode;
  year?: SurveyYear;
}

function agreementHeatColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped >= 70) return `rgba(16, 185, 129, ${0.28 + ((clamped - 70) / 30) * 0.52})`;
  if (clamped >= 40) return `rgba(245, 158, 11, ${0.28 + ((clamped - 40) / 30) * 0.42})`;
  return `rgba(220, 38, 38, ${0.28 + (clamped / 40) * 0.42})`;
}

function agreementHeatTextColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  return clamped >= 55 ? '#ffffff' : '#1f2937';
}

function getHealthStatementIconType(fullName: string): string {
  const lower = fullName.toLowerCase();
  if (/physical activity|community sports|physical exercise|exercise programs/i.test(lower)) return 'activity';
  if (/cleanliness|hygiene|sanitary/i.test(lower)) return 'cleanliness';
  if (/register|counter staff|pharmacy staff|staff/i.test(lower)) return 'staff';
  if (/doctor|treatment and services/i.test(lower)) return 'doctor';
  if (/waiting time|review dates/i.test(lower)) return 'clock';
  if (/specialty clinics|health facility|health system|health services|hospitals|clinics/i.test(lower)) return 'facility';
  if (/emergency|rapid response/i.test(lower)) return 'emergency';
  if (/laboratory|lab readiness|radiology|imaging/i.test(lower)) return 'lab';
  if (/vaccination|medicine|drug prices|pharmacy/i.test(lower)) return 'medicine';
  if (/sad|depressed|anxiety|insomnia|concentration|remembering|fear|unity|boredom|physical pain/i.test(lower)) return 'wellness';
  if (/justice|distribution|equity|access/i.test(lower)) return 'equity';
  if (/proximity|close to/i.test(lower)) return 'location';
  return 'health';
}

function HealthStatementIcon({ fullName }: { fullName: string }) {
  const props = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (getHealthStatementIconType(fullName)) {
    case 'activity':
      return (
        <svg {...props}>
          <circle cx="12" cy="5" r="2" />
          <path d="M10 22V12l-2-4h8l-2 4v10" />
          <path d="M8 12h8" />
        </svg>
      );
    case 'cleanliness':
      return (
        <svg {...props}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'staff':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'doctor':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'facility':
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
          <path d="M12 7v3" />
        </svg>
      );
    case 'emergency':
      return (
        <svg {...props}>
          <path d="M12 3l9 16H3L12 3z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case 'lab':
      return (
        <svg {...props}>
          <path d="M9 3h6v7l4 11H5L9 10V3z" />
          <path d="M9 3h6" />
        </svg>
      );
    case 'medicine':
      return (
        <svg {...props}>
          <path d="M8 8l8 8M9 3h6l1 5H8L9 3zM8 21l-1-5h10l-1 5H8z" />
        </svg>
      );
    case 'wellness':
      return (
        <svg {...props}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" />
        </svg>
      );
    case 'equity':
      return (
        <svg {...props}>
          <path d="M12 3l7 4v6c0 5-3.5 8-7 8s-7-3-7-8V7l7-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'location':
      return (
        <svg {...props}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" />
          <path d="M6 18h12" />
        </svg>
      );
  }
}

export function HealthHeatmapChart({ heatmapData, sectionScore, mode, year = '2025' }: HealthHeatmapChartProps) {
  if (!sectionScore || heatmapData.length === 0) return null;

  const isCurrent = mode === 'current';
  const badgeScore = isCurrent
    ? (year === '2025' ? sectionScore.score2025 : sectionScore.score2024)
    : sectionScore.yoyChange;
  const insight = generateHealthChartInsight(sectionScore, mode, heatmapData);
  const currentAgreement = (row: HealthHeatmapChartProps['heatmapData'][number]) =>
    year === '2025' ? row.agreement2025 : row.agreement2024;

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Health Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? `${year} agreement by health statement`
              : 'Agreement heatmap by statement (2024 vs 2025)'}
          </div>
        </div>
        <ChartScoreBadge score={badgeScore} mode={mode} />
      </div>
      <div className="health-heatmap">
        <div className={`health-heatmap-grid ${isCurrent ? 'health-heatmap-grid--single' : ''}`}>
          <div className="health-heatmap-header">
            <span className="health-heatmap-corner" />
            {!isCurrent && <span className="health-heatmap-column">2024</span>}
            <span className="health-heatmap-column">{isCurrent ? year : '2025'}</span>
          </div>
          {heatmapData.map((row) => {
            const agreement = currentAgreement(row);
            return (
            <div className="health-heatmap-row" key={row.fullName}>
              <div className="health-heatmap-label" title={row.fullName}>
                <span className="health-heatmap-label-icon">
                  <HealthStatementIcon fullName={row.fullName} />
                </span>
                <span className="health-heatmap-label-text">{row.name}</span>
              </div>
              {!isCurrent && (
                <div
                  className="health-heatmap-cell"
                  style={{
                    background: agreementHeatColor(row.agreement2024),
                    color: agreementHeatTextColor(row.agreement2024),
                  }}
                  title={`${row.fullName} (2024): ${row.agreement2024.toFixed(1)}%`}
                >
                  <HeatmapCellValue value={row.agreement2024} />
                </div>
              )}
              <div
                className="health-heatmap-cell"
                style={{
                  background: agreementHeatColor(isCurrent ? agreement : row.agreement2025),
                  color: agreementHeatTextColor(isCurrent ? agreement : row.agreement2025),
                }}
                title={
                  isCurrent
                    ? `${row.fullName} (${year}): ${agreement.toFixed(1)}%`
                    : `${row.fullName} (2025): ${row.agreement2025.toFixed(1)}% (${formatDelta(row.agreement2025 - row.agreement2024)})`
                }
              >
                <HeatmapCellValue
                  value={isCurrent ? agreement : row.agreement2025}
                  change={row.agreement2025 - row.agreement2024}
                  showChange={!isCurrent}
                  invert={agreementHeatTextColor(isCurrent ? agreement : row.agreement2025) === '#ffffff'}
                />
              </div>
            </div>
            );
          })}
        </div>
        <div className="health-heatmap-scale">
          <span>Low agreement</span>
          <span className="health-heatmap-scale-bar" aria-hidden="true" />
          <span>High agreement</span>
        </div>
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface EnvironmentStackedBarProps {
  data: { name: string; fullName: string; dissatisfied: number; neutral: number; satisfied: number }[];
  data2024: { name: string; fullName: string; dissatisfied: number; neutral: number; satisfied: number }[];
  mode: ViewMode;
  year?: SurveyYear;
  score: number;
}

function getEnvironmentStatementIconType(fullName: string): string {
  const lower = fullName.toLowerCase();
  if (/cleanliness|hygiene|clean/i.test(lower)) return 'cleanliness';
  if (/urban planning|streets|parking|sidewalks/i.test(lower)) return 'planning';
  if (/architectural|aesthetic|facades|buildings/i.test(lower)) return 'architecture';
  if (/gardens|parks|public facilities/i.test(lower)) return 'parks';
  if (/road services|lighting|walkways/i.test(lower)) return 'roads';
  return 'leaf';
}

function EnvironmentStatementIcon({ fullName }: { fullName: string }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (getEnvironmentStatementIconType(fullName)) {
    case 'cleanliness':
      return (
        <svg {...props}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'planning':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'architecture':
      return (
        <svg {...props}>
          <path d="M3 21h18M6 21V9l6-4 6 4v12M10 21v-4h4v4" />
        </svg>
      );
    case 'parks':
      return (
        <svg {...props}>
          <path d="M12 22v-8M8 14c-2-3-1-7 4-7s6 4 4 7" />
          <path d="M12 14c2-3 1-7-4-7" />
        </svg>
      );
    case 'roads':
      return (
        <svg {...props}>
          <path d="M4 19l4-14M20 19l-4-14M12 5v14" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M11 20A7 7 0 019.5 6.5c.5-2 2-3.5 4.5-4 0 3 1 5.5 2.5 7.5S20 14 20 16a7 7 0 01-9 4z" />
        </svg>
      );
  }
}

const ENVIRONMENT_CHART_MARGIN = { top: 8, right: 48, left: 4, bottom: 36 };
const ENVIRONMENT_COMPARISON_MARGIN = { top: 8, right: 56, left: 4, bottom: 36 };

function renderEnvironmentCurrentChart(data: EnvironmentStackedBarProps['data']) {
  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={ENVIRONMENT_CHART_MARGIN}
      barCategoryGap="12%"
    >
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        allowDataOverflow
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          const row = payload?.[0]?.payload as Record<string, number | string> | undefined;
          return (
            <ChartTooltip
              active={active}
              label={String(row?.fullName ?? '') || undefined}
              payload={buildSentimentTooltipPayload(row)}
            />
          );
        }}
      />
      <Bar
        dataKey="dissatisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.dissatisfied}
        name={SENTIMENT_LABELS.dissatisfied}
        legendType="none"
        radius={[4, 0, 0, 4]}
        maxBarSize={28}
      >
        <LabelList
          dataKey="dissatisfied"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="dissatisfied" />}
        />
      </Bar>
      <Bar
        dataKey="neutral"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.neutral}
        name={SENTIMENT_LABELS.neutral}
        legendType="none"
        maxBarSize={28}
      >
        <LabelList
          dataKey="neutral"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="neutral" />}
        />
      </Bar>
      <Bar
        dataKey="satisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.satisfied}
        name={SENTIMENT_LABELS.satisfied}
        legendType="none"
        radius={[0, 4, 4, 0]}
        maxBarSize={28}
      >
        <LabelList
          dataKey="satisfied"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="satisfied" />}
        />
      </Bar>
    </BarChart>
  );
}

function renderEnvironmentComparisonChart(data: StatementComparisonRow[]) {
  const comparisonBars: Array<'2024' | '2025'> = ['2024', '2025'];

  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={ENVIRONMENT_COMPARISON_MARGIN}
      barCategoryGap="10%"
      barGap={3}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        allowDataOverflow
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const row = payload[0]?.payload as StatementComparisonRow;
          const year = String(payload[0]?.dataKey ?? '').includes('2024') ? '2024' : '2025';
          return (
            <ChartTooltip
              active={active}
              label={`${row.fullName} (${year})`}
              payload={buildSentimentTooltipPayload(row, year)}
            />
          );
        }}
      />
      {comparisonBars.flatMap((year) =>
        (['dissatisfied', 'neutral', 'satisfied'] as SentimentKey[]).map((segment, segmentIndex) => {
          const dataKey = sentimentDataKey(segment, year);
          const isFirst = segmentIndex === 0;
          const isLast = segmentIndex === 2;
          return (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              stackId={year}
              fill={SENTIMENT_COLORS[segment]}
              legendType="none"
              fillOpacity={year === '2024' ? 0.82 : 1}
              radius={isFirst ? [4, 0, 0, 4] : isLast ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              maxBarSize={24}
            >
              <LabelList
                dataKey={dataKey}
                content={(props) => (
                  <>
                    <BarSegmentScoreLabelHorizontal {...props} segment={segment} />
                    {isLast && <BarYearBarSideLabel {...props} year={year} />}
                  </>
                )}
              />
            </Bar>
          );
        })
      )}
    </BarChart>
  );
}

export function EnvironmentStackedBar({ data, data2024, mode, year = '2025', score }: EnvironmentStackedBarProps) {
  const isCurrent = mode === 'current';
  const sortedData = sortSentimentRowsDescending(data);
  const comparisonData = mergeStatementComparisonData(data2024, data);
  const sortedComparison = sortComparisonRowsDescending(comparisonData);
  const rowHeight = isCurrent ? 72 : 80;
  const chartHeight = Math.max(320, sortedData.length * rowHeight + STATEMENT_CHART_CHROME);
  const insight = generateEnvironmentChartInsight(sortedData, mode, data2024);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Environment Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? `${year} sentiment breakdown by statement`
              : '2024 vs 2025 sentiment breakdown by statement'}
          </div>
        </div>
        <ChartScoreBadge score={score} mode={mode} />
      </div>
      <div className="chart-card-body chart-card-body-environment">
        <StatementChartShell
          data={sortedData}
          chartHeight={chartHeight}
          renderLabelIcon={(row) => <EnvironmentStatementIcon fullName={row.fullName} />}
        >
          {isCurrent
            ? renderEnvironmentCurrentChart(sortedData)
            : renderEnvironmentComparisonChart(sortedComparison)}
        </StatementChartShell>
        <SentimentLegend showYears={!isCurrent} align={isCurrent ? 'bottom-right' : 'default'} />
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

const EDUCATION_AGREEMENT_LABELS: Record<SentimentKey, string> = {
  dissatisfied: 'Disagree',
  neutral: 'Neutral',
  satisfied: 'Agree',
};

const LIKERT_SCALE_COLORS: Record<EducationLikertScaleKey, string> = {
  stronglyDisagree: '#991B1B',
  disagree: DESIGN.negative,
  neutral: '#94a3b8',
  agree: '#34D399',
  stronglyAgree: DESIGN.chart.export,
};

function likertGaugePolar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeLikertGaugeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = likertGaugePolar(cx, cy, outerR, startAngle);
  const endOuter = likertGaugePolar(cx, cy, outerR, endAngle);
  const startInner = likertGaugePolar(cx, cy, innerR, endAngle);
  const endInner = likertGaugePolar(cx, cy, innerR, startAngle);
  const largeArc = startAngle - endAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function LikertGauge({
  row,
  yearLabel,
  compact = false,
}: {
  row: EducationLikertScaleRow;
  yearLabel?: string;
  compact?: boolean;
}) {
  const cx = 180;
  const cy = compact ? 178 : 188;
  const outerR = compact ? 108 : 128;
  const innerR = compact ? 64 : 76;
  const segmentSpan = 36;
  const dominantIndex = getLikertDominantSegmentIndex(row);
  const dominantStart = 180 - dominantIndex * segmentSpan;
  const dominantEnd = dominantStart - segmentSpan;
  const needleAngle = (dominantStart + dominantEnd) / 2;
  const needleTip = likertGaugePolar(cx, cy, innerR - 8, needleAngle);
  const needleBaseL = likertGaugePolar(cx, cy, 12, needleAngle + 90);
  const needleBaseR = likertGaugePolar(cx, cy, 12, needleAngle - 90);

  return (
    <div className={`likert-gauge-panel ${compact ? 'likert-gauge-panel-compact' : ''}`.trim()}>
      {yearLabel && <div className="income-pie-year-label">{yearLabel}</div>}
      <svg
        viewBox="0 0 360 240"
        className="likert-gauge-svg"
        role="img"
        aria-label={`Likert scale gauge for ${row.name}`}
      >
        <defs>
          <linearGradient id="likertGaugeBg" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef2f2" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - outerR - 10} ${cy + 2} A ${outerR + 10} ${outerR + 10} 0 0 1 ${cx + outerR + 10} ${cy + 2} L ${cx + innerR - 4} ${cy} A ${innerR - 4} ${innerR - 4} 0 0 0 ${cx - innerR + 4} ${cy} Z`}
          fill="url(#likertGaugeBg)"
          opacity={0.55}
        />
        {EDUCATION_LIKERT_SCALE_ORDER.map((key, index) => {
          const startAngle = 180 - index * segmentSpan;
          const endAngle = startAngle - segmentSpan;
          const midAngle = (startAngle + endAngle) / 2;
          const labelPos = likertGaugePolar(cx, cy, outerR + (compact ? 20 : 26), midAngle);
          const value = row[key];
          const valuePos = likertGaugePolar(cx, cy, (outerR + innerR) / 2, midAngle);
          const isEdge = index === 0 || index === EDUCATION_LIKERT_SCALE_ORDER.length - 1;
          const valueFontSize = compact ? (value >= 10 ? 11 : 9) : value >= 10 ? 13 : 10;
          return (
            <g key={key}>
              <path
                d={describeLikertGaugeArc(cx, cy, outerR, innerR, startAngle, endAngle)}
                fill={LIKERT_SCALE_COLORS[key]}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={valuePos.x}
                y={valuePos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={valueFontSize}
                fontWeight={700}
                fill={value >= 8 ? '#ffffff' : '#1e293b'}
              >
                {`${value.toFixed(1)}%`}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isEdge ? (compact ? 8 : 9) : compact ? 9 : 10}
                fontWeight={600}
                fill="#475569"
                transform={
                  isEdge
                    ? `rotate(${index === 0 ? -68 : 68}, ${labelPos.x}, ${labelPos.y})`
                    : undefined
                }
              >
                {EDUCATION_LIKERT_SCALE_LABELS[key]}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={16} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} />
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBaseL.x},${needleBaseL.y} ${needleBaseR.x},${needleBaseR.y}`}
          fill="#1e293b"
        />
        <circle cx={cx} cy={cy} r={6} fill="#1e293b" />
      </svg>
    </div>
  );
}

interface EducationSportsLikertGaugeCardProps {
  data: EducationLikertScaleRow[];
  data2024: EducationLikertScaleRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function EducationSportsLikertGaugeCard({
  data,
  data2024,
  title,
  description,
  badgeScore,
  mode,
  year: _year = '2025',
}: EducationSportsLikertGaugeCardProps) {
  const isCurrent = mode === 'current';
  const row = data[0];
  const row2024 = data2024[0];
  const insight = generateEducationLikertScaleInsight(data, mode, data2024, 'sports');

  return (
    <IncomeChartCard
      title={title}
      description={description}
      badgeScore={badgeScore}
      mode={mode}
      insight={insight}
      className="chart-card-education-tab"
    >
      <div className="chart-card-body-education-tab chart-card-body-education-gauge">
        {!row ? (
          <div className="likert-gauge-empty">No sports facilities data available.</div>
        ) : isCurrent ? (
          <LikertGauge row={row} />
        ) : row2024 ? (
          <div className="income-pie-dual">
            <LikertGauge row={row2024} yearLabel="2024" compact />
            <LikertGauge row={row} yearLabel="2025" compact />
          </div>
        ) : (
          <LikertGauge row={row} yearLabel="2025" />
        )}
      </div>
    </IncomeChartCard>
  );
}

function renderEducationDisciplineDonut(
  row: EducationSentimentRow,
  yearLabel: string,
  compact = false,
  showLegend = true,
) {
  const pieData = (
    [
      { key: 'dissatisfied' as const, value: row.dissatisfied },
      { key: 'neutral' as const, value: row.neutral },
      { key: 'satisfied' as const, value: row.satisfied },
    ] as const
  )
    .map(({ key, value }) => ({
      name: EDUCATION_AGREEMENT_LABELS[key],
      value,
      fill: SENTIMENT_COLORS[key],
    }))
    .filter((entry) => entry.value > 0);

  return (
    <div
      className={`income-pie-panel discipline-donut-panel ${compact ? 'income-pie-panel-compact discipline-donut-panel-compact' : ''}`.trim()}
    >
      {compact && <div className="income-pie-year-label">{yearLabel}</div>}
      <ResponsiveContainer width="100%" height={compact ? 210 : 240}>
        <PieChart margin={{ top: 16, right: 28, bottom: compact ? 12 : 36, left: 28 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy={compact ? '44%' : '46%'}
            innerRadius={compact ? 38 : 46}
            outerRadius={compact ? 58 : 72}
            paddingAngle={2}
            dataKey="value"
            label={renderIncomePieSliceLabel}
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
          >
            {pieData.map((entry) => (
              <Cell key={`${yearLabel}-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']} />
        </PieChart>
      </ResponsiveContainer>
      {showLegend && (
        <SentimentLegend align="bottom-right" labels={EDUCATION_AGREEMENT_LABELS} />
      )}
    </div>
  );
}

interface EducationDisciplineDonutCardProps {
  data: EducationSentimentRow[];
  data2024: EducationSentimentRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function EducationDisciplineDonutCard({
  data,
  data2024,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: EducationDisciplineDonutCardProps) {
  const isCurrent = mode === 'current';
  const row = data[0];
  const row2024 = data2024[0];
  const insight = generateEducationTabChartInsight(data, mode, data2024, 'discipline');

  if (!row) {
    return (
      <IncomeChartCard
        title={title}
        description={description}
        badgeScore={badgeScore}
        mode={mode}
        insight={['No discipline fairness data available.']}
        className="chart-card-education-tab"
      >
        <div className="chart-card-body-education-tab" />
      </IncomeChartCard>
    );
  }

  return (
    <IncomeChartCard
      title={title}
      description={description}
      badgeScore={badgeScore}
      mode={mode}
      insight={insight}
      className="chart-card-education-tab"
    >
      <div className="chart-card-body-education-tab chart-card-body-education-donut">
        {isCurrent ? (
          renderEducationDisciplineDonut(row, year)
        ) : row2024 ? (
          <div className="discipline-donut-yoy">
            <div className="income-pie-dual">
              {renderEducationDisciplineDonut(row2024, '2024', true, false)}
              {renderEducationDisciplineDonut(row, '2025', true, false)}
            </div>
            <SentimentLegend align="bottom-right" labels={EDUCATION_AGREEMENT_LABELS} />
          </div>
        ) : (
          renderEducationDisciplineDonut(row, '2025')
        )}
      </div>
    </IncomeChartCard>
  );
}

function EducationTabStatementIcon({ fullName }: { fullName: string }) {
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

  if (/sports facilities|sports competitions/i.test(lower)) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" />
        <path d="M2 12h20" />
      </svg>
    );
  }
  if (/discipline/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (/physical|hitting|kicking|harmed|hurt/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  if (/verbal|harass|ridicul|mock|rumor|name/i.test(lower)) {
    return (
      <svg {...props}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M22 10l-10-5L2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </svg>
  );
}

function renderEducationTabCurrentChart(data: EducationSentimentRow[]) {
  return (
    <BarChart data={data} layout="vertical" margin={ENVIRONMENT_CHART_MARGIN} barCategoryGap="12%">
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        allowDataOverflow
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          const row = payload?.[0]?.payload as Record<string, number | string> | undefined;
          return (
            <ChartTooltip
              active={active}
              label={String(row?.fullName ?? '') || undefined}
              payload={buildSentimentTooltipPayload(row, undefined, EDUCATION_AGREEMENT_LABELS)}
            />
          );
        }}
      />
      <Bar
        dataKey="dissatisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.dissatisfied}
        name={EDUCATION_AGREEMENT_LABELS.dissatisfied}
        legendType="none"
        radius={[4, 0, 0, 4]}
        maxBarSize={28}
      >
        <LabelList
          dataKey="dissatisfied"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="dissatisfied" />}
        />
      </Bar>
      <Bar
        dataKey="neutral"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.neutral}
        name={EDUCATION_AGREEMENT_LABELS.neutral}
        legendType="none"
        maxBarSize={28}
      >
        <LabelList
          dataKey="neutral"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="neutral" />}
        />
      </Bar>
      <Bar
        dataKey="satisfied"
        stackId="sentiment"
        fill={SENTIMENT_COLORS.satisfied}
        name={EDUCATION_AGREEMENT_LABELS.satisfied}
        legendType="none"
        radius={[0, 4, 4, 0]}
        maxBarSize={28}
      >
        <LabelList
          dataKey="satisfied"
          content={(props) => <BarSegmentScoreLabelHorizontal {...props} segment="satisfied" />}
        />
      </Bar>
    </BarChart>
  );
}

function renderEducationTabComparisonChart(data: StatementComparisonRow[]) {
  const comparisonBars: Array<'2024' | '2025'> = ['2024', '2025'];

  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={ENVIRONMENT_COMPARISON_MARGIN}
      barCategoryGap="10%"
      barGap={3}
    >
      <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
        domain={[0, 100]}
        allowDataOverflow
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
      />
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const row = payload[0]?.payload as StatementComparisonRow;
          const year = String(payload[0]?.dataKey ?? '').includes('2024') ? '2024' : '2025';
          return (
            <ChartTooltip
              active={active}
              label={`${row.fullName} (${year})`}
              payload={buildSentimentTooltipPayload(row, year, EDUCATION_AGREEMENT_LABELS)}
            />
          );
        }}
      />
      {comparisonBars.flatMap((year) =>
        (['dissatisfied', 'neutral', 'satisfied'] as SentimentKey[]).map((segment, segmentIndex) => {
          const dataKey = sentimentDataKey(segment, year);
          const isFirst = segmentIndex === 0;
          const isLast = segmentIndex === 2;
          return (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              stackId={year}
              fill={SENTIMENT_COLORS[segment]}
              legendType="none"
              fillOpacity={year === '2024' ? 0.82 : 1}
              radius={isFirst ? [4, 0, 0, 4] : isLast ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              maxBarSize={24}
            >
              <LabelList
                dataKey={dataKey}
                content={(props) => (
                  <>
                    <BarSegmentScoreLabelHorizontal {...props} segment={segment} />
                    {isLast && <BarYearBarSideLabel {...props} year={year} />}
                  </>
                )}
              />
            </Bar>
          );
        }),
      )}
    </BarChart>
  );
}

interface EducationLikertStackedCardProps {
  data: EducationSentimentRow[];
  data2024: EducationSentimentRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
  topic: 'sports' | 'bullying' | 'awareness' | 'discipline';
}

export function EducationLikertStackedCard({
  data,
  data2024,
  title,
  description,
  badgeScore,
  mode,
  year: _year = '2025',
  topic,
}: EducationLikertStackedCardProps) {
  const isCurrent = mode === 'current';
  const sortedData = sortSentimentRowsDescending(data);
  const comparisonData = mergeStatementComparisonData(data2024, data);
  const sortedComparison = sortComparisonRowsDescending(comparisonData);
  const rowHeight = isCurrent ? 72 : 80;
  const chartHeight = Math.max(280, sortedData.length * rowHeight + STATEMENT_CHART_CHROME);
  const insight = generateEducationTabChartInsight(sortedData, mode, data2024, topic);

  return (
    <IncomeChartCard
      title={title}
      description={description}
      badgeScore={badgeScore}
      mode={mode}
      insight={insight}
      className="chart-card-education-tab"
    >
      <div className="chart-card-body-education-tab">
        <StatementChartShell
          data={sortedData}
          chartHeight={chartHeight}
          fillHeight
          renderLabelIcon={(row) => <EducationTabStatementIcon fullName={row.fullName} />}
        >
          {isCurrent
            ? renderEducationTabCurrentChart(sortedData)
            : renderEducationTabComparisonChart(sortedComparison)}
        </StatementChartShell>
        <SentimentLegend
          showYears={!isCurrent}
          align={isCurrent ? 'bottom-right' : 'default'}
          labels={EDUCATION_AGREEMENT_LABELS}
        />
      </div>
    </IncomeChartCard>
  );
}

interface YoYComparisonChartProps {
  items: { name: string; value2024: number; value2025: number }[];
  title?: string;
}

export function YoYComparisonChart({ items, title = '2024 vs 2025 Comparison' }: YoYComparisonChartProps) {
  const data = [...items]
    .sort((a, b) => b.value2025 - a.value2025)
    .slice(0, 8)
    .map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name,
    fullName: d.name,
    '2024': d.value2024,
    '2025': d.value2025,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">Side-by-side year comparison</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: DESIGN.chart.axis }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} />
          <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="2024" fill={YEAR_COMPARISON_BAR.previous} radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="2025" fill={YEAR_COMPARISON_BAR.current} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface IncomeChartCardProps {
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  insight: InsightPart[];
  children: ReactNode;
  singleLineDescription?: boolean;
  className?: string;
}

function IncomeChartCard({
  title,
  description,
  badgeScore,
  mode,
  insight,
  children,
  singleLineDescription = false,
  className,
}: IncomeChartCardProps) {
  return (
    <div className={['chart-card chart-card-fill', className].filter(Boolean).join(' ')}>
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className={`chart-subtitle${singleLineDescription ? ' chart-subtitle-single-line' : ''}`.trim()}>
            {description}
          </div>
        </div>
        <ChartScoreBadge score={badgeScore} mode={mode} />
      </div>
      <div className="chart-card-body">{children}</div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

const INCOME_PIE_COLORS: Record<string, string> = {
  Yes: DESIGN.chart.export,
  No: DESIGN.negative,
  Higher: DESIGN.negative,
  Lower: DESIGN.chart.export,
  Same: '#94a3b8',
  'Live comfortably': DESIGN.chart.export,
  'Try to manage': '#94a3b8',
  'Find it difficult': DESIGN.negative,
};

function incomePieColor(name: string, index: number): string {
  return INCOME_PIE_COLORS[name] ?? CHART_COLORS[index % CHART_COLORS.length];
}


function incomeBarLabelIconClass(name: string, metric: 'spending' | 'feeling'): string {
  if (metric === 'spending') {
    if (name === 'Higher') return 'income-bar-label-icon--negative';
    if (name === 'Lower') return 'income-bar-label-icon--positive';
    return 'income-bar-label-icon--neutral';
  }
  if (name === 'Live comfortably') return 'income-bar-label-icon--positive';
  if (name === 'Find it difficult') return 'income-bar-label-icon--negative';
  return 'income-bar-label-icon--neutral';
}

function IncomeBarLabelIcon({ name, metric }: { name: string; metric: 'spending' | 'feeling' }) {
  const props = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  if (metric === 'spending') {
    switch (name) {
      case 'Higher':
        return (
          <svg {...props}>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
        );
      case 'Lower':
        return (
          <svg {...props}>
            <path d="M3 7l6 6 4-4 8 8" />
            <path d="M14 17h7v-7" />
          </svg>
        );
      case 'Same':
      default:
        return (
          <svg {...props}>
            <path d="M5 12h14" />
            <path d="M5 8h10" />
            <path d="M5 16h10" />
          </svg>
        );
    }
  }

  switch (name) {
    case 'Live comfortably':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case 'Try to manage':
      return (
        <svg {...props}>
          <path d="M12 3v18" />
          <path d="M5 8h14" />
          <path d="M7 16h10" />
        </svg>
      );
    case 'Find it difficult':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
  }
}

const INCOME_BAR_CHART_MARGIN = { top: 4, right: 44, left: 0, bottom: 28 };
const INCOME_BAR_CHART_MARGIN_YOY = { top: 4, right: 64, left: 0, bottom: 28 };

function renderIncomePieSliceLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  value = 0,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  value?: number;
}) {
  if (!value || value < 2) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
    >
      {`${value.toFixed(1)}%`}
    </text>
  );
}

function IncomePieLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`chart-legend chart-legend-bottom-right ${compact ? 'chart-legend-compact' : ''}`.trim()}>
      <span className="chart-legend-item">
        <span className="chart-legend-swatch chart-legend-swatch-saving-yes" aria-hidden="true" />
        Yes
      </span>
      <span className="chart-legend-item">
        <span className="chart-legend-swatch chart-legend-swatch-saving-no" aria-hidden="true" />
        No
      </span>
    </div>
  );
}

interface IncomeBarChartCardProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
  metric: 'spending' | 'feeling';
}

export function IncomeBarChartCard({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
  metric,
}: IncomeBarChartCardProps) {
  const isCurrent = mode === 'current';
  const sorted = sortIncomeChartRowsDescending(data, isCurrent, year);
  const chartData = sorted.map((row, index) => ({
    name: row.name,
    fullName: row.fullName,
    value: isCurrent ? (year === '2025' ? row.value2025 : row.value2024) : row.value2025,
    value2024: row.value2024,
    value2025: row.value2025,
    categoryColor: incomePieColor(row.name, index),
  }));
  const insight =
    metric === 'spending'
      ? generateIncomeSpendingInsight(data, mode, year)
      : generateIncomeFeelingInsight(data, mode, year);
  const chartHeight = Math.max(220, chartData.length * (isCurrent ? 48 : 58) + 28);
  const xAxisLabel = 'Response Percentage (%)';
  const fillHeight = metric === 'feeling';

  return (
    <IncomeChartCard title={title} description={description} badgeScore={badgeScore} mode={mode} insight={insight}>
      <div
        className={[
          'income-bar-chart-wrap',
          !isCurrent ? 'income-bar-chart-wrap-yoy' : '',
          fillHeight ? 'income-bar-chart-wrap-fill' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <StatementChartShell
          className="statement-bar-chart-income"
          data={chartData}
          chartHeight={chartHeight}
          fillHeight={fillHeight}
          renderLabelIcon={(row) => <IncomeBarLabelIcon name={row.name} metric={metric} />}
          labelIconClassName={(row) => incomeBarLabelIconClass(row.name, metric)}
        >
          {isCurrent ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={INCOME_BAR_CHART_MARGIN}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={[0, 'auto']}>
                <Label
                  value={xAxisLabel}
                  position="insideBottom"
                  offset={-2}
                  style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600 }}
                />
              </XAxis>
              <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} legendType="none">
                {chartData.map((entry) => (
                  <Cell key={entry.fullName} fill={entry.categoryColor} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={INCOME_BAR_CHART_MARGIN_YOY}
              barCategoryGap="18%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={[0, 'auto']}>
                <Label
                  value={xAxisLabel}
                  position="insideBottom"
                  offset={-2}
                  style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600 }}
                />
              </XAxis>
              <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} reversed />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''} />
              <Bar dataKey="value2025" name="2025" fill={YEAR_COMPARISON_BAR.current} radius={[0, 4, 4, 0]} maxBarSize={14} legendType="none">
                {renderYoYBarCells(chartData, '2025')}
                <LabelList
                  dataKey="value2025"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 9, fill: '#374151', fontWeight: 600 }}
                />
              </Bar>
              <Bar dataKey="value2024" name="2024" fill={YEAR_COMPARISON_BAR.previous} radius={[0, 4, 4, 0]} maxBarSize={14} legendType="none">
                {renderYoYBarCells(chartData, '2024')}
                <LabelList
                  dataKey="value2024"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          )}
        </StatementChartShell>
        {!isCurrent && <YearComparisonLegend rounded />}
      </div>
    </IncomeChartCard>
  );
}

interface IncomePieChartCardProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

function renderIncomePie(
  rows: IncomeChartRow[],
  yearLabel: string,
  compact = false,
  showLegend = true,
) {
  const pieData = rows
    .map((row, index) => ({
      name: row.name,
      value: yearLabel === '2024' ? row.value2024 : row.value2025,
      fill: incomePieColor(row.name, index),
    }))
    .filter((entry) => entry.value > 0);

  return (
    <div className={`income-pie-panel ${compact ? 'income-pie-panel-compact' : ''}`.trim()}>
      {compact && <div className="income-pie-year-label">{yearLabel}</div>}
      <ResponsiveContainer width="100%" height={compact ? 190 : 240}>
        <PieChart margin={{ top: 20, right: 36, bottom: compact ? 8 : 36, left: 36 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy={compact ? '50%' : '46%'}
            innerRadius={compact ? 40 : 46}
            outerRadius={compact ? 64 : 72}
            paddingAngle={2}
            dataKey="value"
            label={renderIncomePieSliceLabel}
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
          >
            {pieData.map((entry) => (
              <Cell key={`${yearLabel}-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']} />
        </PieChart>
      </ResponsiveContainer>
      {showLegend && <IncomePieLegend compact={compact} />}
    </div>
  );
}

export function IncomePieChartCard({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: IncomePieChartCardProps) {
  const isCurrent = mode === 'current';
  const insight = generateIncomeSavingInsight(data, mode, year);

  return (
    <IncomeChartCard
      title={title}
      description={description}
      badgeScore={badgeScore}
      mode={mode}
      insight={insight}
      singleLineDescription
    >
      {isCurrent ? (
        renderIncomePie(data, year)
      ) : (
        <div className="income-pie-yoy">
          <div className="income-pie-dual">
            {renderIncomePie(data, '2024', true, false)}
            {renderIncomePie(data, '2025', true, false)}
          </div>
          <IncomePieLegend compact />
        </div>
      )}
    </IncomeChartCard>
  );
}

function getIncomeBarrierIconType(fullName: string): string {
  const lower = fullName.toLowerCase();
  if (/income|enough/.test(lower)) return 'income';
  if (/believe|skeptical/.test(lower)) return 'belief';
  if (/know how|unsure/.test(lower)) return 'help';
  if (/debt/.test(lower)) return 'debt';
  if (/expenses/.test(lower)) return 'expenses';
  return 'barrier';
}

function IncomeBarrierIcon({ fullName }: { fullName: string }) {
  const props = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (getIncomeBarrierIconType(fullName)) {
    case 'income':
      return (
        <svg {...props}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'belief':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'help':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      );
    case 'debt':
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case 'expenses':
      return (
        <svg {...props}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <path d="M3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" />
        </svg>
      );
  }
}

interface IncomeBarriersHeatmapProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function IncomeBarriersHeatmap({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: IncomeBarriersHeatmapProps) {
  const isCurrent = mode === 'current';
  const insight = generateIncomeBarrierInsight(data, mode, year);
  const currentValue = (row: IncomeChartRow) => (year === '2025' ? row.value2025 : row.value2024);

  return (
    <IncomeChartCard title={title} description={description} badgeScore={badgeScore} mode={mode} insight={insight}>
      <div className="health-heatmap income-barriers-heatmap">
        <div className={`health-heatmap-grid ${isCurrent ? 'health-heatmap-grid--single' : ''}`}>
          <div className="health-heatmap-header">
            <span className="health-heatmap-corner" />
            {!isCurrent && <span className="health-heatmap-column">2024</span>}
            <span className="health-heatmap-column">{isCurrent ? year : '2025'}</span>
          </div>
          {data.map((row) => {
            const agreement = currentValue(row);
            return (
              <div className="health-heatmap-row" key={row.fullName}>
                <div className="health-heatmap-label" title={row.fullName}>
                  <span className="health-heatmap-label-icon income-barrier-icon">
                    <IncomeBarrierIcon fullName={row.fullName} />
                  </span>
                  <span className="health-heatmap-label-text">{row.name}</span>
                </div>
                {!isCurrent && (
                  <div
                    className="health-heatmap-cell"
                    style={{
                      background: agreementHeatColor(row.value2024),
                      color: agreementHeatTextColor(row.value2024),
                    }}
                    title={`${row.fullName} (2024): ${row.value2024.toFixed(1)}%`}
                  >
                    <HeatmapCellValue value={row.value2024} />
                  </div>
                )}
                <div
                  className="health-heatmap-cell"
                  style={{
                    background: agreementHeatColor(isCurrent ? agreement : row.value2025),
                    color: agreementHeatTextColor(isCurrent ? agreement : row.value2025),
                  }}
                  title={
                    isCurrent
                      ? `${row.fullName} (${year}): ${agreement.toFixed(1)}%`
                      : `${row.fullName} (2025): ${row.value2025.toFixed(1)}% (${formatDelta(row.value2025 - row.value2024)})`
                  }
                >
                  <HeatmapCellValue
                    value={isCurrent ? agreement : row.value2025}
                    change={row.value2025 - row.value2024}
                    showChange={!isCurrent}
                    invert
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="health-heatmap-scale">
          <span>Low prevalence</span>
          <span className="health-heatmap-scale-bar" aria-hidden="true" />
          <span>High prevalence</span>
        </div>
      </div>
    </IncomeChartCard>
  );
}

interface WorkPieChartCardProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function WorkPieChartCard({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: WorkPieChartCardProps) {
  const isCurrent = mode === 'current';
  const insight = generateWorkJobseekerInsight(data, mode, year);

  return (
    <IncomeChartCard title={title} description={description} badgeScore={badgeScore} mode={mode} insight={insight}>
      {isCurrent ? (
        renderIncomePie(data, year)
      ) : (
        <div className="income-pie-yoy">
          <div className="income-pie-dual">
            {renderIncomePie(data, '2024', true, false)}
            {renderIncomePie(data, '2025', true, false)}
          </div>
          <IncomePieLegend compact />
        </div>
      )}
    </IncomeChartCard>
  );
}

const WORK_BAR_CHART_MARGIN = { top: 8, right: 56, left: 4, bottom: 28 };
const WORK_BAR_CHART_MARGIN_YOY = { top: 8, right: 72, left: 4, bottom: 28 };
const WORK_COLUMN_CHART_MARGIN = { top: 20, right: 12, left: 4, bottom: 44 };
const WORK_COLUMN_CHART_MARGIN_YOY = { top: 24, right: 12, left: 4, bottom: 44 };

function WorkChallengeIcon({ fullName }: { fullName: string }) {
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
  if (/education|university|quality/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M22 10l-10-5L2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
      </svg>
    );
  }
  if (/field|qualification|match|align/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    );
  }
  if (/opportunit|suitable/.test(lower)) {
    return (
      <svg {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <path d="M9 12h6" />
      </svg>
    );
  }
  if (/competition/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    );
  }
  if (/social|connection/.test(lower)) {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" />
    </svg>
  );
}

interface WorkHorizontalBarChartCardProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function WorkHorizontalBarChartCard({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: WorkHorizontalBarChartCardProps) {
  const isCurrent = mode === 'current';
  const chartData = [...data]
    .map((row) => ({
      name: row.name,
      fullName: row.fullName,
      value: isCurrent ? (year === '2025' ? row.value2025 : row.value2024) : row.value2025,
      value2024: row.value2024,
      value2025: row.value2025,
    }))
    .sort((a, b) => a.value - b.value);
  const insight = generateWorkChallengeInsight(data, mode, year);
  const rowHeight = isCurrent ? 68 : 76;
  const chartHeight = Math.max(300, chartData.length * rowHeight + 28);
  const xAxisLabel = 'Response Percentage (%)';

  return (
    <IncomeChartCard title={title} description={description} badgeScore={badgeScore} mode={mode} insight={insight}>
      <div className={`income-bar-chart-wrap work-challenge-chart-wrap ${!isCurrent ? 'income-bar-chart-wrap-yoy' : ''}`.trim()}>
        <StatementChartShell
          className="statement-bar-chart-income"
          data={chartData}
          chartHeight={chartHeight}
          reverseLabelOrder
          renderLabelIcon={(row) => <WorkChallengeIcon fullName={row.fullName} />}
          labelIconClassName={() => 'work-challenge-label-icon'}
        >
          {isCurrent ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={WORK_BAR_CHART_MARGIN}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={[0, 'auto']}>
                <Label
                  value={xAxisLabel}
                  position="insideBottom"
                  offset={-2}
                  style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600 }}
                />
              </XAxis>
              <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="value" fill={yearBarColor(year)} radius={[0, 4, 4, 0]} maxBarSize={26} legendType="none">
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={WORK_BAR_CHART_MARGIN_YOY}
              barCategoryGap="18%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={[0, 'auto']}>
                <Label
                  value={xAxisLabel}
                  position="insideBottom"
                  offset={-2}
                  style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600 }}
                />
              </XAxis>
              <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''} />
              <Bar dataKey="value2025" name="2025" fill={YEAR_COMPARISON_BAR.current} radius={[0, 4, 4, 0]} maxBarSize={14} legendType="none">
                {renderYoYBarCells(chartData, '2025')}
                <LabelList
                  dataKey="value2025"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 9, fill: '#374151', fontWeight: 600 }}
                />
              </Bar>
              <Bar dataKey="value2024" name="2024" fill={YEAR_COMPARISON_BAR.previous} radius={[0, 4, 4, 0]} maxBarSize={14} legendType="none">
                {renderYoYBarCells(chartData, '2024')}
                <LabelList
                  dataKey="value2024"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          )}
        </StatementChartShell>
        {!isCurrent && <YearComparisonLegend rounded />}
      </div>
    </IncomeChartCard>
  );
}

interface WorkColumnBarChartCardProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function WorkColumnBarChartCard({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: WorkColumnBarChartCardProps) {
  const isCurrent = mode === 'current';
  const sorted = sortIncomeChartRowsDescending(data, isCurrent, year);
  const chartData = sorted.map((row) => ({
    name: row.name,
    fullName: row.fullName,
    value: isCurrent ? (year === '2025' ? row.value2025 : row.value2024) : row.value2025,
    value2024: row.value2024,
    value2025: row.value2025,
  }));
  const insight = generateWorkBusinessInsight(data, mode, year);

  return (
    <IncomeChartCard
      title={title}
      description={description}
      badgeScore={badgeScore}
      mode={mode}
      insight={insight}
      className={!isCurrent ? 'chart-card-work-business-yoy' : undefined}
    >
      <div className={`income-bar-chart-wrap work-column-bar-chart-wrap ${!isCurrent ? 'work-column-bar-chart-wrap-yoy' : ''}`.trim()}>
        <div className="work-column-bar-chart-plot">
          <ResponsiveContainer width="100%" height="100%">
            {isCurrent ? (
              <BarChart
                data={chartData}
                margin={WORK_COLUMN_CHART_MARGIN}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: DESIGN.chart.axis }}
                  interval={0}
                  textAnchor="middle"
                  height={36}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
                  width={44}
                  domain={[0, 'auto']}
                >
                  <Label
                    value="Response Percentage (%)"
                    angle={-90}
                    position="insideLeft"
                    offset={12}
                    style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600, textAnchor: 'middle' }}
                  />
                </YAxis>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="value" fill={yearBarColor(year)} radius={[4, 4, 0, 0]} maxBarSize={56} legendType="none">
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                    style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={WORK_COLUMN_CHART_MARGIN_YOY}
                barCategoryGap="22%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: DESIGN.chart.axis }}
                  interval={0}
                  textAnchor="middle"
                  height={36}
                />
                <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} width={44} domain={[0, 'auto']} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''} />
                <Bar dataKey="value2025" name="2025" fill={YEAR_COMPARISON_BAR.current} radius={[4, 4, 0, 0]} maxBarSize={32} legendType="none">
                  {renderYoYBarCells(chartData, '2025')}
                  <LabelList
                    dataKey="value2025"
                    position="top"
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                    style={{ fontSize: 9, fill: '#374151', fontWeight: 600 }}
                  />
                </Bar>
                <Bar dataKey="value2024" name="2024" fill={YEAR_COMPARISON_BAR.previous} radius={[4, 4, 0, 0]} maxBarSize={32} legendType="none">
                  {renderYoYBarCells(chartData, '2024')}
                  <LabelList
                    dataKey="value2024"
                    position="top"
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                    style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {!isCurrent && (
          <div className="work-column-bar-chart-legend">
            <YearComparisonLegend rounded />
          </div>
        )}
      </div>
    </IncomeChartCard>
  );
}

function WorkSupportIcon({ fullName }: { fullName: string }) {
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
  if (/financial|promotion/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    );
  }
  if (/job opportunit/.test(lower)) {
    return (
      <svg {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    );
  }
  if (/housing/.test(lower)) {
    return (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" />
    </svg>
  );
}

interface WorkSupportHeatmapProps {
  data: IncomeChartRow[];
  title: string;
  description: string;
  badgeScore: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function WorkSupportHeatmap({
  data,
  title,
  description,
  badgeScore,
  mode,
  year = '2025',
}: WorkSupportHeatmapProps) {
  const isCurrent = mode === 'current';
  const insight = generateWorkSupportInsight(data, mode, year);
  const currentValue = (row: IncomeChartRow) => (year === '2025' ? row.value2025 : row.value2024);

  return (
    <IncomeChartCard title={title} description={description} badgeScore={badgeScore} mode={mode} insight={insight}>
      <div className="health-heatmap income-barriers-heatmap work-support-heatmap">
        <div className="work-support-heatmap-scroll">
          <div className={`health-heatmap-grid ${isCurrent ? 'health-heatmap-grid--single' : ''}`}>
            <div className="health-heatmap-header">
              <span className="health-heatmap-corner" />
              {!isCurrent && <span className="health-heatmap-column">2024</span>}
              <span className="health-heatmap-column">{isCurrent ? year : '2025'}</span>
            </div>
            {data.map((row) => {
              const agreement = currentValue(row);
              return (
                <div className="health-heatmap-row" key={row.fullName}>
                  <div className="health-heatmap-label" title={row.fullName}>
                    <span className="health-heatmap-label-icon income-barrier-icon">
                      <WorkSupportIcon fullName={row.fullName} />
                    </span>
                    <span className="health-heatmap-label-text">{row.name}</span>
                  </div>
                  {!isCurrent && (
                    <div
                      className="health-heatmap-cell"
                      style={{
                        background: agreementHeatColor(row.value2024),
                        color: agreementHeatTextColor(row.value2024),
                      }}
                      title={`${row.fullName} (2024): ${row.value2024.toFixed(1)}%`}
                    >
                      <HeatmapCellValue value={row.value2024} />
                    </div>
                  )}
                  <div
                    className="health-heatmap-cell"
                    style={{
                      background: agreementHeatColor(isCurrent ? agreement : row.value2025),
                      color: agreementHeatTextColor(isCurrent ? agreement : row.value2025),
                    }}
                    title={
                      isCurrent
                        ? `${row.fullName} (${year}): ${agreement.toFixed(1)}%`
                        : `${row.fullName} (2025): ${row.value2025.toFixed(1)}% (${formatDelta(row.value2025 - row.value2024)})`
                    }
                  >
                    <HeatmapCellValue
                      value={isCurrent ? agreement : row.value2025}
                      change={row.value2025 - row.value2024}
                      showChange={!isCurrent}
                      invert
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="health-heatmap-scale">
          <span>Low demand</span>
          <span className="health-heatmap-scale-bar" aria-hidden="true" />
          <span>High demand</span>
        </div>
      </div>
    </IncomeChartCard>
  );
}

interface SentimentDonutProps {
  positive: number;
  negative: number;
  neutral?: number;
  mode: ViewMode;
  year?: SurveyYear;
}

export function SentimentDonut({ positive, negative, neutral, year = '2025' }: SentimentDonutProps) {
  const neu = neutral ?? Math.max(0, 100 - positive - negative);
  const pieData = [
    { name: 'Positive', value: positive, fill: DESIGN.chart.export },
    { name: 'Neutral', value: neu, fill: '#94a3b8' },
    { name: 'Negative', value: negative, fill: DESIGN.negative },
  ].filter((d) => d.value > 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Sentiment Breakdown</div>
          <div className="chart-subtitle">{year} positive vs negative sentiment</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Share']} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
