import { useState, type ReactElement } from 'react';
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
} from 'recharts';
import type { SectionScore, ViewMode } from '../types';
import { CHART_COLORS, DESIGN } from '../types';
import {
  generatePartnerChartInsight,
  generateEducationChartInsight,
  generateHealthChartInsight,
  generateEnvironmentChartInsight,
  generatePillarTableInsight,
  formatDelta,
  mergeStatementComparisonData,
  type InsightPart,
} from '../utils';

const STATEMENT_ROW_HEIGHT = 64;
const STATEMENT_CHART_CHROME = 64;

function estimateStatementChartHeight(rowCount: number): number {
  return Math.max(320, rowCount * STATEMENT_ROW_HEIGHT + STATEMENT_CHART_CHROME);
}

type BarLabelCoordinate = number | string | undefined;

function toBarLabelNumber(value: BarLabelCoordinate): number | undefined {
  if (value == null) return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function BarYearTopLabel({
  x,
  y,
  width,
  value,
  year,
}: {
  x?: BarLabelCoordinate;
  y?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  value?: BarLabelCoordinate;
  year: string;
}) {
  const nx = toBarLabelNumber(x);
  const ny = toBarLabelNumber(y);
  const nwidth = toBarLabelNumber(width);
  const nvalue = toBarLabelNumber(value);
  if (!nvalue || nvalue <= 0 || nx == null || ny == null || nwidth == null) return null;
  return (
    <text x={nx + nwidth / 2} y={ny - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill="#64748b">
      {year}
    </text>
  );
}

function BarYearEndLabel({
  x,
  y,
  width,
  height,
  value,
  year,
}: {
  x?: BarLabelCoordinate;
  y?: BarLabelCoordinate;
  width?: BarLabelCoordinate;
  height?: BarLabelCoordinate;
  value?: BarLabelCoordinate;
  year: string;
}) {
  const nx = toBarLabelNumber(x);
  const ny = toBarLabelNumber(y);
  const nwidth = toBarLabelNumber(width);
  const nheight = toBarLabelNumber(height);
  const nvalue = toBarLabelNumber(value);
  if (!nvalue || nvalue <= 0 || nx == null || ny == null || nwidth == null || nheight == null) return null;
  return (
    <text x={nx + nwidth + 8} y={ny + nheight / 2} dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#64748b">
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
}: {
  data: StatementChartRow[];
  chartHeight: number;
  children: ReactElement;
  renderLabelIcon?: (row: StatementChartRow) => ReactElement;
}) {
  return (
    <div
      className="statement-bar-chart"
      style={{ height: chartHeight, ['--statement-rows' as string]: data.length }}
    >
      <div className="statement-bar-labels">
        {data.map((row) => (
          <div key={row.fullName} className="statement-bar-label" title={row.fullName}>
            {renderLabelIcon && (
              <span className="statement-bar-label-icon">{renderLabelIcon(row)}</span>
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

function segmentLabel(value: number): string {
  const amount = Math.abs(value);
  return amount >= 6 ? `${amount.toFixed(0)}%` : '';
}

const SEGMENT_VALUE_LABEL_STYLE = { fontSize: 10, fill: '#ffffff', fontWeight: 600 as const };

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

type ComparisonSegmentKey = 'dissatisfied' | 'neutral' | 'satisfied';

function buildStatementComparisonTooltipSegments(
  row: StatementComparisonRow,
  yearKey: '2024' | '2025',
) {
  const segments: { key: ComparisonSegmentKey; name: string; color: string }[] = [
    { key: 'dissatisfied', name: 'Dissatisfied', color: DESIGN.negative },
    { key: 'neutral', name: 'Neutral', color: '#94a3b8' },
    { key: 'satisfied', name: 'Satisfied', color: DESIGN.chart.export },
  ];

  return segments.map((segment) => ({
    name: segment.name,
    value: row[`${segment.key}${yearKey}`],
    color: segment.color,
    change:
      yearKey === '2025'
        ? row[`${segment.key}2025`] - row[`${segment.key}2024`]
        : undefined,
  }));
}

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
    return <span className="chart-badge">{score.toFixed(1)}% Score</span>;
  }

  return (
    <span className={`chart-badge ${score < 0 ? 'chart-badge-negative' : 'chart-badge-yoy'}`}>
      {formatDelta(score)} YoY
    </span>
  );
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
  title?: string;
}

export function PillarScoresChart({ data, mode, title = 'Pillar Satisfaction — Annual (%)' }: PillarScoresChartProps) {
  const chartData = data.map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name,
    fullName: d.name,
    value: mode === 'current' ? d.value2025 : d.value,
    change: d.value,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">
            {mode === 'current' ? '2025 satisfaction by pillar' : 'Year-over-year change (pp)'}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} />
          <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={mode === 'yoy' ? ['auto', 'auto'] : [0, 100]} />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}${mode === 'current' ? '%' : ' pp'}`, mode === 'current' ? 'Score' : 'Change']}
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
      {prefix}{change.toFixed(1)} pp
    </span>
  );
}

export function PartnerChart({ data, mode }: PartnerChartProps) {
  const isCurrent = mode === 'current';
  const getScore = (item: PartnerChartProps['data'][number]) =>
    isCurrent ? item.value : (item.value2025 ?? item.value);
  const sorted = [...data].sort((a, b) => getScore(b) - getScore(a)).slice(0, 7);
  const top = sorted[0];
  const maxScore = Math.max(...sorted.map(getScore), 1);
  const pieData = sorted.map((d, i) => ({
    name: d.name,
    fullName: d.fullName ?? d.name,
    value: Math.max(getScore(d), 0),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const insight = generatePartnerChartInsight(data, mode);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Satisfaction by Pillar</div>
          <div className="chart-subtitle">
            {isCurrent ? 'Share of total — 2025 scores' : '2024 vs 2025 scores by pillar'}
          </div>
        </div>
      </div>
      <div className="partner-chart-body">
        <div className="partner-donut-wrap">
          <ResponsiveContainer width="100%" height="100%" minHeight={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0];
                  const name = String(entry.payload?.fullName ?? entry.name ?? 'Pillar');
                  return (
                    <ChartTooltip
                      active
                      payload={[{
                        name,
                        value: Number(entry.value),
                        color: String(entry.payload?.fill ?? entry.color ?? CHART_COLORS[0]),
                      }]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {top && (
            <div className="partner-donut-center">
              <div className="partner-donut-center-value">{getScore(top).toFixed(0)}%</div>
              <div className="partner-donut-center-label">{top.name}</div>
            </div>
          )}
        </div>
        <div className={`partner-bar-list ${!isCurrent ? 'partner-bar-list-yoy' : ''}`}>
          {sorted.map((item, i) => {
            const score2025 = item.value2025 ?? item.value;
            const score2024 = item.value2024 ?? score2025 - item.value;
            const barColor = CHART_COLORS[i % CHART_COLORS.length];

            return (
              <div key={item.name} className={`partner-bar-item ${!isCurrent ? 'partner-bar-item-yoy' : ''}`}>
                <span className="partner-bar-label">{item.fullName ?? item.name}</span>
                <span className="partner-bar-pct">
                  {isCurrent ? (
                    `${score2025.toFixed(1)}%`
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
                        width: `${Math.min(100, (score2025 / maxScore) * 100)}%`,
                        background: barColor,
                      }}
                    />
                  </div>
                ) : (
                  <div className="partner-bar-dual">
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
  title?: string;
}

export function LikertChart({ statements, mode, title = 'Key Survey Statements' }: LikertChartProps) {
  const top = statements.slice(0, 6);

  return (
    <div className="chart-card full-width">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">
            {mode === 'current' ? 'Agreement rate (2025)' : 'Change in agreement (2024 → 2025)'}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, top.length * 38)}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: DESIGN.chart.axis }} domain={mode === 'yoy' ? ['auto', 'auto'] : [0, 100]} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10, fill: DESIGN.chart.axis }} />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(1)}${mode === 'current' ? '%' : ' pp'}`, mode === 'current' ? 'Agreement' : 'Change']}
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

export function DataTable({ rows, mode }: DataTableProps) {
  const isCurrent = mode === 'current';
  const insight = generatePillarTableInsight(rows, mode);

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
            <th>2025 Score</th>
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
                <CurrentValue value={row.score2025} tone={getScoreTone(row.score2025)} />
              </td>
              {!isCurrent && (
                <td>
                  <ChangeValue change={row.score2025 - row.score2024} />
                </td>
              )}
              <td>
                {isCurrent ? (
                  <CurrentValue value={row.satisfied2025} tone="positive" />
                ) : (
                  <TrendValue previous={row.satisfied2024} current={row.satisfied2025} />
                )}
              </td>
              <td>
                {isCurrent ? (
                  <CurrentValue value={row.unsatisfied2025} tone="negative" />
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
const EDUCATION_COMPARISON_MARGIN = { top: 28, right: 12, left: 4, bottom: 48 };

interface EducationDivergingBarProps {
  data: EducationChartRow[];
  data2024: EducationChartRow[];
  mode: ViewMode;
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
        content={({ active, payload }) => (
          <ChartTooltip
            active={active}
            label={String(payload?.[0]?.payload?.fullName ?? '') || undefined}
            payload={payload?.map((entry) => ({
              name: String(entry.name ?? 'Value'),
              value: Number(entry.value),
              color: String(entry.color ?? entry.fill ?? '#94a3b8'),
            }))}
          />
        )}
      />
      <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />
      <Bar dataKey="dissatisfied" stackId="stack" fill={DESIGN.negative} name="Dissatisfied" radius={[0, 0, 4, 4]}>
        <LabelList dataKey="dissatisfied" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral" stackId="stack" fill="#94a3b8" name="Neutral">
        <LabelList dataKey="neutral" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied" stackId="stack" fill={DESIGN.chart.export} name="Satisfied" radius={[4, 4, 0, 0]}>
        <LabelList dataKey="satisfied" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
    </BarChart>
  );
}

function StackedComparisonLegend() {
  return (
    <div className="stacked-comparison-legend">
      <div className="stacked-comparison-years">
        <span className="year-chip year-chip-muted">2024</span>
        <span className="year-chip">2025</span>
      </div>
      <div className="sentiment-legend">
        <span className="sentiment-legend-item">
          <span className="sentiment-legend-swatch" style={{ background: DESIGN.negative }} />
          Dissatisfied
        </span>
        <span className="sentiment-legend-item">
          <span className="sentiment-legend-swatch" style={{ background: '#94a3b8' }} />
          Neutral
        </span>
        <span className="sentiment-legend-item">
          <span className="sentiment-legend-swatch" style={{ background: DESIGN.chart.export }} />
          Satisfied
        </span>
      </div>
    </div>
  );
}

function renderEducationComparisonChart(data: StatementComparisonRow[], rows: EducationChartRow[]) {
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
          const yearKey = year as '2024' | '2025';
          return (
            <ChartTooltip
              active={active}
              label={`${row.fullName} (${year})`}
              payload={buildStatementComparisonTooltipSegments(row, yearKey)}
            />
          );
        }}
      />
      <Bar dataKey="dissatisfied2024" stackId="2024" fill={DESIGN.negative} legendType="none" fillOpacity={0.55} radius={[0, 0, 4, 4]}>
        <LabelList dataKey="dissatisfied2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral2024" stackId="2024" fill="#94a3b8" legendType="none" fillOpacity={0.55}>
        <LabelList dataKey="neutral2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied2024" stackId="2024" fill={DESIGN.chart.export} legendType="none" fillOpacity={0.55} radius={[4, 4, 0, 0]}>
        <LabelList dataKey="satisfied2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
        <LabelList
          dataKey="satisfied2024"
          position="top"
          content={(props) => <BarYearTopLabel {...props} year="2024" />}
        />
      </Bar>
      <Bar dataKey="dissatisfied2025" stackId="2025" fill={DESIGN.negative} legendType="none" radius={[0, 0, 4, 4]}>
        <LabelList dataKey="dissatisfied2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral2025" stackId="2025" fill="#94a3b8" legendType="none">
        <LabelList dataKey="neutral2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied2025" stackId="2025" fill={DESIGN.chart.export} legendType="none" radius={[4, 4, 0, 0]}>
        <LabelList dataKey="satisfied2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
        <LabelList
          dataKey="satisfied2025"
          position="top"
          content={(props) => <BarYearTopLabel {...props} year="2025" />}
        />
      </Bar>
    </BarChart>
  );
}

export function EducationDivergingBar({ data, data2024, mode, score }: EducationDivergingBarProps) {
  const isCurrent = mode === 'current';
  const comparisonData = mergeStatementComparisonData(data2024, data);
  const insight = generateEducationChartInsight(data, mode, data2024);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Education Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? '2025 response breakdown by statement'
              : '2024 and 2025 response breakdown by statement'}
          </div>
        </div>
        <ChartScoreBadge score={score} mode={mode} />
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={isCurrent ? 340 : 368}>
          {isCurrent
            ? renderEducationCurrentChart(data, data)
            : renderEducationComparisonChart(comparisonData, data)}
        </ResponsiveContainer>
        {!isCurrent && <StackedComparisonLegend />}
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

export function HealthHeatmapChart({ heatmapData, sectionScore, mode }: HealthHeatmapChartProps) {
  if (!sectionScore || heatmapData.length === 0) return null;

  const isCurrent = mode === 'current';
  const badgeScore = isCurrent ? sectionScore.score2025 : sectionScore.yoyChange;
  const insight = generateHealthChartInsight(sectionScore, mode, heatmapData);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Health Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? '2025 agreement by health statement'
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
            <span className="health-heatmap-column">2025</span>
          </div>
          {heatmapData.map((row) => (
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
                  background: agreementHeatColor(row.agreement2025),
                  color: agreementHeatTextColor(row.agreement2025),
                }}
                title={`${row.fullName} (2025): ${row.agreement2025.toFixed(1)}% (${formatDelta(row.agreement2025 - row.agreement2024)})`}
              >
                <HeatmapCellValue
                  value={row.agreement2025}
                  change={row.agreement2025 - row.agreement2024}
                  showChange={!isCurrent}
                  invert={agreementHeatTextColor(row.agreement2025) === '#ffffff'}
                />
              </div>
            </div>
          ))}
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
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => (
          <ChartTooltip
            active={active}
            label={String(payload?.[0]?.payload?.fullName ?? '') || undefined}
            payload={payload?.map((entry) => ({
              name: String(entry.name ?? 'Value'),
              value: Number(entry.value),
              color: String(entry.color ?? entry.fill ?? '#94a3b8'),
            }))}
          />
        )}
      />
      <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />
      <Bar dataKey="dissatisfied" stackId="stack" fill={DESIGN.negative} name="Dissatisfied">
        <LabelList dataKey="dissatisfied" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral" stackId="stack" fill="#94a3b8" name="Neutral">
        <LabelList dataKey="neutral" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied" stackId="stack" fill={DESIGN.chart.export} name="Satisfied" radius={[0, 4, 4, 0]}>
        <LabelList dataKey="satisfied" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
    </BarChart>
  );
}

function renderEnvironmentComparisonChart(data: StatementComparisonRow[]) {
  return (
    <BarChart
      data={data}
      layout="vertical"
      margin={ENVIRONMENT_CHART_MARGIN}
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
      <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const row = payload[0]?.payload as StatementComparisonRow;
          const year = String(payload[0]?.dataKey ?? '').includes('2024') ? '2024' : '2025';
          const yearKey = year as '2024' | '2025';
          return (
            <ChartTooltip
              active={active}
              label={`${row.fullName} (${year})`}
              payload={buildStatementComparisonTooltipSegments(row, yearKey)}
            />
          );
        }}
      />
      <Bar dataKey="dissatisfied2024" stackId="2024" fill={DESIGN.negative} legendType="none" fillOpacity={0.55}>
        <LabelList dataKey="dissatisfied2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral2024" stackId="2024" fill="#94a3b8" legendType="none" fillOpacity={0.55}>
        <LabelList dataKey="neutral2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied2024" stackId="2024" fill={DESIGN.chart.export} legendType="none" fillOpacity={0.55} radius={[0, 4, 4, 0]}>
        <LabelList dataKey="satisfied2024" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
        <LabelList
          dataKey="satisfied2024"
          position="right"
          content={(props) => <BarYearEndLabel {...props} year="2024" />}
        />
      </Bar>
      <Bar dataKey="dissatisfied2025" stackId="2025" fill={DESIGN.negative} legendType="none">
        <LabelList dataKey="dissatisfied2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="neutral2025" stackId="2025" fill="#94a3b8" legendType="none">
        <LabelList dataKey="neutral2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
      </Bar>
      <Bar dataKey="satisfied2025" stackId="2025" fill={DESIGN.chart.export} legendType="none" radius={[0, 4, 4, 0]}>
        <LabelList dataKey="satisfied2025" position="center" formatter={segmentLabel} style={SEGMENT_VALUE_LABEL_STYLE} />
        <LabelList
          dataKey="satisfied2025"
          position="right"
          content={(props) => <BarYearEndLabel {...props} year="2025" />}
        />
      </Bar>
    </BarChart>
  );
}

export function EnvironmentStackedBar({ data, data2024, mode, score }: EnvironmentStackedBarProps) {
  const isCurrent = mode === 'current';
  const comparisonData = mergeStatementComparisonData(data2024, data);
  const chartHeight = estimateStatementChartHeight(data.length);
  const insight = generateEnvironmentChartInsight(data, mode, data2024);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Environment Satisfaction</div>
          <div className="chart-subtitle">
            {isCurrent
              ? '2025 response breakdown by statement'
              : '2024 and 2025 response breakdown by statement'}
          </div>
        </div>
        <ChartScoreBadge score={score} mode={mode} />
      </div>
      <div className="chart-card-body">
        <StatementChartShell
          data={data}
          chartHeight={chartHeight}
          renderLabelIcon={(row) => <EnvironmentStatementIcon fullName={row.fullName} />}
        >
          {isCurrent
            ? renderEnvironmentCurrentChart(data)
            : renderEnvironmentComparisonChart(comparisonData)}
        </StatementChartShell>
        {!isCurrent && <StackedComparisonLegend />}
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface YoYComparisonChartProps {
  items: { name: string; value2024: number; value2025: number }[];
  title?: string;
}

export function YoYComparisonChart({ items, title = '2024 vs 2025 Comparison' }: YoYComparisonChartProps) {
  const data = items.slice(0, 8).map((d) => ({
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
          <Bar dataKey="2024" fill={DESIGN.chart.barMuted} radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="2025" fill={DESIGN.chart.barAlt} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SentimentDonutProps {
  positive: number;
  negative: number;
  neutral?: number;
  mode: ViewMode;
}

export function SentimentDonut({ positive, negative, neutral }: SentimentDonutProps) {
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
          <div className="chart-subtitle">2025 positive vs negative sentiment</div>
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
