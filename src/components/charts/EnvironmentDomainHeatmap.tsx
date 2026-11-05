import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DESIGN } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatDelta,
  generateEnvironmentDomainHeatmapInsight,
  pickYearValue,
  type WellbeingHeatmapRow,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';

interface EnvironmentDomainHeatmapProps {
  rows: WellbeingHeatmapRow[];
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  maxBodyHeight?: number;
  embedded?: boolean;
  fillHeight?: boolean;
}

interface CurrentYearLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string;
  index?: number;
}

const DEFAULT_MAX_BODY_HEIGHT = 220;
const CHART_MARGIN = { top: 20, right: 8, left: 0, bottom: 8 };
const CHART_MARGIN_YOY = { top: 36, right: 8, left: 0, bottom: 8 };
const YEAR_BAR = {
  previous: DESIGN.chart.yearPrevious,
  current: DESIGN.positive,
} as const;
const SATISFACTION_THRESHOLD = 60;

function changeTone(actualValue: number): string {
  return actualValue >= SATISFACTION_THRESHOLD ? DESIGN.positive : DESIGN.negative;
}

function createCurrentYearBarLabel(getMovement: (index: number) => number | undefined) {
  return function CurrentYearBarLabel({ x = 0, y = 0, width = 0, value, index = 0 }: CurrentYearLabelProps) {
    if (value == null) return null;
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return null;

    const movement = getMovement(index);
    const centerX = Number(x) + Number(width) / 2;
    const topY = Number(y);

    return (
      <g>
        <text
          x={centerX}
          y={topY - 14}
          textAnchor="middle"
          fill="#374151"
          fontSize={9}
          fontWeight={600}
        >
          {`${numericValue.toFixed(0)}%`}
        </text>
        {movement != null && Number.isFinite(movement) && (
          <text
            x={centerX}
            y={topY - 2}
            textAnchor="middle"
            fill={changeTone(numericValue)}
            fontSize={9}
            fontWeight={700}
          >
            {Math.abs(movement) < 0.5 ? '0%' : formatDelta(movement)}
          </text>
        )}
      </g>
    );
  };
}

export function EnvironmentDomainHeatmap({
  rows,
  compareYears,
  year,
  viewMode,
  maxBodyHeight = DEFAULT_MAX_BODY_HEIGHT,
  embedded = false,
  fillHeight = false,
}: EnvironmentDomainHeatmapProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : year;
  const insight = generateEnvironmentDomainHeatmapInsight(rows, displayYear);

  const chartData = rows.map((row) => ({
    name: row.name,
    fullName: row.fullName,
    value: pickYearValue(row.agreement2024, row.agreement2025, displayYear),
    value2024: row.agreement2024,
    value2025: row.agreement2025,
    movement: row.movement,
  }));
  const CurrentYearBarLabel = createCurrentYearBarLabel((index) => chartData[index]?.movement);

  const laneSubtitle = isYoY
    ? `${compareYears[0]} vs ${compareYears[1]} agreement across six environment domains.`
    : `Domain-level satisfaction for ${displayYear} — cleanliness, facilities, planning, roads, air, and noise.`;

  const chartBody = (
    <div
      className={`chart-card-body agreement-heatmap-body environment-domain-body${
        embedded ? ' agreement-heatmap-body-embedded' : ''
      }`}
    >
      {rows.length === 0 ? (
        <p className="statement-lollipop-empty">No environment domain data available.</p>
      ) : (
        <div
          className={`income-bar-chart-wrap work-column-bar-chart-wrap environment-domain-bar-wrap${
            isYoY ? ' work-column-bar-chart-wrap-yoy' : ''
          }${fillHeight ? ' environment-domain-bar-wrap-fill' : ''}`}
          style={!fillHeight && embedded ? { minHeight: maxBodyHeight } : undefined}
        >
          <div className="work-column-bar-chart-plot environment-domain-bar-plot">
            <ResponsiveContainer width="100%" height="100%">
              {isYoY ? (
                <BarChart
                  data={chartData}
                  margin={CHART_MARGIN_YOY}
                  barCategoryGap="18%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: DESIGN.chart.axis }}
                    interval={0}
                    textAnchor="middle"
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} width={40} domain={[0, 100]}>
                    <Label
                      value="Satisfaction (%)"
                      angle={-90}
                      position="insideLeft"
                      offset={10}
                      style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600, textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  />
                  <Bar
                    dataKey="value2025"
                    name="2025"
                    fill={YEAR_BAR.current}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    legendType="none"
                  >
                    <LabelList dataKey="value2025" content={CurrentYearBarLabel} />
                  </Bar>
                  <Bar
                    dataKey="value2024"
                    name="2024"
                    fill={YEAR_BAR.previous}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    legendType="none"
                  >
                    <LabelList
                      dataKey="value2024"
                      position="top"
                      formatter={(v: number) => `${v.toFixed(0)}%`}
                      style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke={DESIGN.chart.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: DESIGN.chart.axis }}
                    interval={0}
                    textAnchor="middle"
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 11, fill: DESIGN.chart.axis }} width={40} domain={[0, 100]}>
                    <Label
                      value="Satisfaction (%)"
                      angle={-90}
                      position="insideLeft"
                      offset={10}
                      style={{ fontSize: 11, fill: DESIGN.chart.axis, fontWeight: 600, textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, 'Satisfaction']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  />
                  <Bar
                    dataKey="value"
                    fill={YEAR_BAR.current}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    legendType="none"
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v: number) => `${v.toFixed(0)}%`}
                      style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const insightFooter = (
    <div className={embedded ? 'health-assessment-lane-insight' : undefined}>
      <ChartInsightFooter chartTitle="Environment domain satisfaction" insight={insight} singleLine />
    </div>
  );

  const headerActions = (
    <StatementYearLegend
      viewMode={viewMode}
      compareYears={compareYears}
      year={year}
      variant="positive"
    />
  );

  if (embedded) {
    return (
      <article className="health-assessment-lane-card health-assessment-lane-card--domain environment-assessment-lane-card--domain">
        <div className="health-assessment-lane-card-header">
          <ChartSectionHeader
            icon="compare"
            title="Environment domain satisfaction"
            subtitle={laneSubtitle}
            titleClassName="health-assessment-lane-card-title"
            subtitleClassName="health-assessment-lane-card-subtitle"
          />
          <div className="health-assessment-lane-card-actions">{headerActions}</div>
        </div>
        {chartBody}
        {insightFooter}
      </article>
    );
  }

  return (
    <div className="chart-card chart-card-fill chart-positive-lane environment-domain-heatmap-card">
      <div className="chart-card-header">
        <ChartSectionHeader
          icon="compare"
          title="Environment domain satisfaction"
          subtitle={laneSubtitle}
        />
        <div className="chart-header-actions">{headerActions}</div>
      </div>
      {chartBody}
      {insightFooter}
    </div>
  );
}
