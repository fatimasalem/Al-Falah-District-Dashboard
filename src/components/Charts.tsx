import { useState } from 'react';
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
import type { ViewMode } from '../types';
import { CHART_COLORS, DESIGN } from '../types';
import {
  generatePartnerChartInsight,
  generateEducationChartInsight,
  generateHealthChartInsight,
  generateEnvironmentChartInsight,
  generatePillarTableInsight,
  type InsightPart,
} from '../utils';

const STATEMENT_LABEL_WIDTH = 240;
const STATEMENT_CHARS_PER_LINE = 34;

function wrapStatementLabel(text: string, maxChars = STATEMENT_CHARS_PER_LINE, maxLines = 3): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const trimmed = lines.slice(0, maxLines);
  trimmed[maxLines - 1] = `${trimmed[maxLines - 1].slice(0, maxChars - 1)}…`;
  return trimmed;
}

function StatementAxisTick({
  x,
  y,
  payload,
}: {
  x: number;
  y: number;
  payload: { value: string };
}) {
  const lines = wrapStatementLabel(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={(i - (lines.length - 1) / 2) * 13}
          textAnchor="end"
          fill={DESIGN.chart.axis}
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function estimateStatementChartHeight(labels: string[]): number {
  const rowHeight = labels.reduce((max, label) => {
    const lines = wrapStatementLabel(label).length;
    return Math.max(max, lines * 14 + 28);
  }, 52);
  return Math.max(280, labels.length * rowHeight + 48);
}

function segmentLabel(value: number): string {
  const amount = Math.abs(value);
  return amount >= 6 ? `${amount.toFixed(0)}%` : '';
}

interface ChartTooltipEntry {
  name?: string;
  value?: number;
  color?: string;
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
        return (
          <div key={name} className="chart-tooltip-entry">
            <div className="chart-tooltip-header">
              <span className="chart-tooltip-swatch" style={{ background: entry.color ?? '#3b82f6' }} />
              <span className="chart-tooltip-label">{headerLabel}</span>
            </div>
            <div className="chart-tooltip-value">
              {headerLabel}: {value}{suffix}
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
  data: { name: string; value: number; fullName?: string }[];
  mode: ViewMode;
}

export function PartnerChart({ data, mode }: PartnerChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 7);
  const top = sorted[0];
  const pieData = sorted.map((d, i) => ({
    name: d.name,
    fullName: d.fullName ?? d.name,
    value: Math.max(d.value, 0),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const insight = generatePartnerChartInsight(data, mode);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Satisfaction by Pillar</div>
          <div className="chart-subtitle">
            {mode === 'current' ? 'Share of total — 2025 scores' : 'YoY change by pillar'}
          </div>
        </div>
      </div>
      <div className="partner-chart-body">
        <div className="partner-donut-wrap">
          <ResponsiveContainer width={160} height={160}>
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
              <div className="partner-donut-center-value">{top.value.toFixed(0)}%</div>
              <div className="partner-donut-center-label">{top.name}</div>
            </div>
          )}
        </div>
        <div className="partner-bar-list">
          {sorted.map((item, i) => (
            <div key={item.name} className="partner-bar-item">
              <span className="partner-bar-label">{item.fullName ?? item.name}</span>
              <span className="partner-bar-pct">{item.value.toFixed(1)}%</span>
              <div className="partner-bar-track">
                <div
                  className="partner-bar-fill"
                  style={{
                    width: `${Math.min(100, (item.value / (sorted[0]?.value || 1)) * 100)}%`,
                    background: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
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

type TrendDirection = 'up' | 'down' | 'same';

function getTrend(previous: number, current: number): { direction: TrendDirection; className: string } {
  const change = current - previous;
  if (change > 0) return { direction: 'up', className: 'growth-positive' };
  if (change < 0) return { direction: 'down', className: 'growth-negative' };
  return { direction: 'same', className: 'growth-neutral' };
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
            <th>Satisfied %</th>
            <th>Unsatisfied %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pillar}>
              <td>{row.pillar}</td>
              {!isCurrent && <td>{row.score2024.toFixed(1)}%</td>}
              <td>
                {isCurrent ? (
                  <CurrentValue value={row.score2025} tone={getScoreTone(row.score2025)} />
                ) : (
                  <TrendValue previous={row.score2024} current={row.score2025} />
                )}
              </td>
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

interface EducationDivergingBarProps {
  data: { name: string; fullName: string; dissatisfied: number; neutral: number; satisfied: number }[];
  mode: ViewMode;
}

export function EducationDivergingBar({ data, mode }: EducationDivergingBarProps) {
  const chartHeight = estimateStatementChartHeight(data.map((d) => d.fullName));
  const insight = generateEducationChartInsight(data);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Education Satisfaction</div>
          <div className="chart-subtitle">
            {mode === 'current' ? '2025 response breakdown by statement' : '2025 agreement vs disagreement'}
          </div>
        </div>
      </div>
      <div className="chart-card-body" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            stackOffset="sign"
            margin={{ top: 8, right: 28, left: 8, bottom: 8 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: DESIGN.chart.axis }}
              domain={[-100, 100]}
              ticks={[-100, -75, -50, -25, 0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${Math.abs(v)}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={STATEMENT_LABEL_WIDTH}
              tick={(props) => <StatementAxisTick {...props} />}
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
            <Bar dataKey="dissatisfied" stackId="stack" fill={DESIGN.negative} name="Dissatisfied" radius={[4, 0, 0, 4]}>
              <LabelList dataKey="dissatisfied" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
            <Bar dataKey="neutral" stackId="stack" fill="#94a3b8" name="Neutral">
              <LabelList dataKey="neutral" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
            <Bar dataKey="satisfied" stackId="stack" fill={DESIGN.chart.export} name="Satisfied" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="satisfied" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface HealthWaffleChartProps {
  satisfied: number;
  unsatisfied: number;
  neutral: number;
  score: number;
  mode: ViewMode;
}

export function HealthWaffleChart({ satisfied, unsatisfied, neutral, score, mode }: HealthWaffleChartProps) {
  const totalCells = 100;
  const satisfiedCells = Math.round(satisfied);
  const unsatisfiedCells = Math.round(unsatisfied);
  const neutralCells = Math.max(0, totalCells - satisfiedCells - unsatisfiedCells);
  const insight = generateHealthChartInsight(satisfied, unsatisfied, score);

  const cells: ('satisfied' | 'unsatisfied' | 'neutral')[] = [
    ...Array(satisfiedCells).fill('satisfied' as const),
    ...Array(unsatisfiedCells).fill('unsatisfied' as const),
    ...Array(neutralCells).fill('neutral' as const),
  ];

  const cellColors = {
    satisfied: DESIGN.chart.export,
    unsatisfied: DESIGN.negative,
    neutral: '#e2e8f0',
  };

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Health Satisfaction</div>
          <div className="chart-subtitle">
            {mode === 'current' ? '2025 resident health sentiment' : '2025 health sentiment breakdown'}
          </div>
        </div>
        <span className="chart-badge">{score.toFixed(1)}% Score</span>
      </div>
      <div className="waffle-chart">
        <div className="waffle-grid">
          {cells.map((type, i) => (
            <div key={i} className="waffle-cell" style={{ background: cellColors[type] }} />
          ))}
        </div>
        <div className="waffle-legend">
          <div className="waffle-legend-item">
            <span className="waffle-legend-dot" style={{ background: cellColors.satisfied }} />
            Satisfied <strong>{satisfied.toFixed(1)}%</strong>
          </div>
          <div className="waffle-legend-item">
            <span className="waffle-legend-dot" style={{ background: cellColors.unsatisfied }} />
            Unsatisfied <strong>{unsatisfied.toFixed(1)}%</strong>
          </div>
          <div className="waffle-legend-item">
            <span className="waffle-legend-dot" style={{ background: cellColors.neutral }} />
            Neutral <strong>{neutral.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
      <ChartInsightFooter insight={insight} />
    </div>
  );
}

interface EnvironmentStackedBarProps {
  data: { name: string; fullName: string; dissatisfied: number; neutral: number; satisfied: number }[];
  mode: ViewMode;
}

export function EnvironmentStackedBar({ data, mode }: EnvironmentStackedBarProps) {
  const chartHeight = estimateStatementChartHeight(data.map((d) => d.fullName));
  const insight = generateEnvironmentChartInsight(data);

  return (
    <div className="chart-card chart-card-fill">
      <div className="chart-card-header">
        <div>
          <div className="chart-title">Environment Satisfaction</div>
          <div className="chart-subtitle">
            {mode === 'current' ? '2025 response breakdown by statement' : '2025 satisfaction distribution'}
          </div>
        </div>
      </div>
      <div className="chart-card-body" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 28, left: 8, bottom: 8 }}
            barCategoryGap="20%"
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
            <YAxis
              type="category"
              dataKey="name"
              width={STATEMENT_LABEL_WIDTH}
              tick={(props) => <StatementAxisTick {...props} />}
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
            <Bar dataKey="dissatisfied" stackId="stack" fill={DESIGN.negative} name="Dissatisfied">
              <LabelList dataKey="dissatisfied" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
            <Bar dataKey="neutral" stackId="stack" fill="#94a3b8" name="Neutral">
              <LabelList dataKey="neutral" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
            <Bar dataKey="satisfied" stackId="stack" fill={DESIGN.chart.export} name="Satisfied" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="satisfied" position="center" formatter={segmentLabel} style={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
