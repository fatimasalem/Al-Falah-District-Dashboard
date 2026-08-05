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
    value: Math.max(d.value, 0),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="chart-card">
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
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Score']} />
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
      {top && (
        <p className="partner-footnote">
          {top.fullName ?? top.name} leads at {top.value.toFixed(1)}% across {sorted.length} pillars
        </p>
      )}
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
  rows: { pillar: string; score2024: number; score2025: number; change: number; positive: number }[];
}

export function DataTable({ rows }: DataTableProps) {
  return (
    <div className="data-table-card full-width">
      <div className="data-table-header">
        <div className="data-table-title">Annual Pillar Data</div>
        <button type="button" className="data-table-export">Export CSV ↓</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Pillar</th>
            <th>2024 Score</th>
            <th>2025 Score</th>
            <th>Change</th>
            <th>Positive %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pillar}>
              <td>{row.pillar}</td>
              <td>{row.score2024.toFixed(1)}%</td>
              <td>{row.score2025.toFixed(1)}%</td>
              <td className={row.change >= 0 ? 'growth-positive' : 'growth-negative'}>
                {row.change >= 0 ? '▲' : '▼'} {Math.abs(row.change).toFixed(1)} pp
              </td>
              <td>{row.positive.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
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
