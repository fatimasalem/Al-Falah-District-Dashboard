import { useMemo } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { DESIGN, PILLAR_TABS } from '../../types';
import type { CompareYears, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  formatDelta,
  generateMomentumMatrixInsight,
  type MomentumMatrixItem,
  type MomentumQuadrant,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { PillarTabIcon } from './PillarTabIcon';

interface MomentumMatrixProps {
  items: MomentumMatrixItem[];
  viewMode: ViewMode;
  compareYears: CompareYears;
  embedded?: boolean;
  /** Render only the treemap body (no header, legend, or insight). */
  chartOnly?: boolean;
}

interface MomentumTreemapNode {
  name: string;
  value: number;
  sectionId: string;
  pillar: string;
  score2024: number;
  yoyChange: number;
  weight: number;
  fill: string;
  icon: string;
  quadrant: MomentumQuadrant;
}

const TILE_GAP = 5;
const TILE_RADIUS = 10;
const TILE_PADDING = 12;

export const SCORE_BAND_LEGEND: Array<{ key: MomentumQuadrant; label: string; color: string }> = [
  { key: 'scale', label: 'Scale · 75%+', color: '#86efac' },
  { key: 'protect', label: 'Protect · 70–74%', color: '#93c5fd' },
  { key: 'investigate', label: 'Target · Below 70%', color: '#f8d7d7' },
];

function getPillarIcon(sectionId: string): string {
  return PILLAR_TABS.find((tab) => tab.id === sectionId)?.icon ?? 'grid';
}

function getDeltaToneClass(yoyChange: number): string {
  if (yoyChange > 0) return 'momentum-treemap-delta-positive';
  if (yoyChange < 0) return 'momentum-treemap-delta-negative';
  return 'momentum-treemap-delta-neutral';
}

export function getScoreBandFill(quadrant: MomentumQuadrant): string {
  if (quadrant === 'scale') return '#bbf7d0';
  if (quadrant === 'protect') return '#dbeafe';
  return '#f8d7d7';
}

function toTreemapNodes(items: MomentumMatrixItem[]): MomentumTreemapNode[] {
  const totalScore = items.reduce((sum, item) => sum + item.score2025, 0);

  return items.map((item) => ({
    name: item.pillar,
    value: item.score2025,
    sectionId: item.sectionId,
    pillar: item.pillar,
    score2024: item.score2024,
    yoyChange: item.yoyChange,
    weight: totalScore > 0 ? (item.score2025 / totalScore) * 100 : 0,
    fill: getScoreBandFill(item.quadrant),
    icon: getPillarIcon(item.sectionId),
    quadrant: item.quadrant,
  }));
}

function MomentumTreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  name?: string;
  value?: number;
  fill?: string;
  sectionId?: string;
  pillar?: string;
  score2024?: number;
  yoyChange?: number;
  weight?: number;
  icon?: string;
  quadrant?: MomentumQuadrant;
  children?: MomentumTreemapNode[];
  payload?: MomentumTreemapNode;
  viewMode?: ViewMode;
  compareYears?: CompareYears;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    depth = 0,
    name,
    fill,
    pillar,
    score2024,
    yoyChange,
    weight,
    icon,
    children,
    payload,
    viewMode = 'yoy',
    compareYears = ['2024', '2025'] as CompareYears,
  } = props;

  if (depth === 0 || (children && children.length > 0)) return null;
  if (width < 2 || height < 2) return null;

  const node: MomentumTreemapNode = {
    name: name ?? payload?.name ?? '',
    value: props.value ?? payload?.value ?? 0,
    sectionId: props.sectionId ?? payload?.sectionId ?? '',
    pillar: pillar ?? payload?.pillar ?? name ?? '',
    score2024: score2024 ?? payload?.score2024 ?? 0,
    yoyChange: yoyChange ?? payload?.yoyChange ?? 0,
    weight: weight ?? payload?.weight ?? 0,
    fill: fill ?? payload?.fill ?? '#f8d7d7',
    icon: icon ?? payload?.icon ?? 'grid',
    quadrant: props.quadrant ?? payload?.quadrant ?? 'investigate',
  };

  const isYoY = viewMode === 'yoy';
  const tileX = x + TILE_GAP / 2;
  const tileY = y + TILE_GAP / 2;
  const tileWidth = Math.max(0, width - TILE_GAP);
  const tileHeight = Math.max(0, height - TILE_GAP);
  const clipId = `momentum-tile-clip-${node.sectionId}`;

  if (isYoY) {
    const showSplitContent = tileWidth > 56 && tileHeight > 48;
    const showRecentScore = tileWidth > 40 && tileHeight > 36;
    const showPreviousMeta = tileWidth > 72 && tileHeight > 64;
    const recentLabelWidth = Math.max(40, tileWidth * 0.48);
    const previousLabelWidth = Math.max(40, tileWidth * 0.48);

    return (
      <g fill="none">
        <defs>
          <clipPath id={clipId}>
            <rect
              x={tileX}
              y={tileY}
              width={tileWidth}
              height={tileHeight}
              rx={TILE_RADIUS}
              ry={TILE_RADIUS}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={tileX}
            y={tileY}
            width={tileWidth}
            height={tileHeight}
            fill={node.fill}
          />
          <polygon
            points={[
              `${tileX + tileWidth},${tileY}`,
              `${tileX + tileWidth},${tileY + tileHeight}`,
              `${tileX},${tileY + tileHeight}`,
            ].join(' ')}
            fill={DESIGN.chart.yearPrevious}
          />
        </g>
        <rect
          x={tileX}
          y={tileY}
          width={tileWidth}
          height={tileHeight}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.5}
          rx={TILE_RADIUS}
          ry={TILE_RADIUS}
        />
        {showRecentScore && (
          <foreignObject
            x={tileX + TILE_PADDING}
            y={tileY + TILE_PADDING}
            width={recentLabelWidth}
            height={showSplitContent ? 52 : 28}
          >
            <div className="momentum-treemap-split-recent">
              <span className="momentum-treemap-split-year">{compareYears[1]}</span>
              <span className="momentum-treemap-split-score">{`${node.value.toFixed(1)}%`}</span>
              {showSplitContent && (
                <span className={`momentum-treemap-split-delta ${getDeltaToneClass(node.yoyChange)}`}>
                  {formatDelta(node.yoyChange)}
                </span>
              )}
            </div>
          </foreignObject>
        )}
        {showPreviousMeta && (
          <foreignObject
            x={tileX + tileWidth - TILE_PADDING - previousLabelWidth}
            y={tileY + tileHeight - TILE_PADDING - 48}
            width={previousLabelWidth}
            height={48}
          >
            <div className="momentum-treemap-split-previous">
              <span className="momentum-treemap-split-name">{node.pillar}</span>
              <span className="momentum-treemap-split-prev-score">
                {`${compareYears[0]} · ${node.score2024.toFixed(1)}%`}
              </span>
            </div>
          </foreignObject>
        )}
      </g>
    );
  }

  const innerWidth = Math.max(0, tileWidth - TILE_PADDING * 2);
  const showIcon = tileWidth > 52 && tileHeight > 48;
  const showName = tileWidth > 60 && tileHeight > 56;
  const showMainValue = tileWidth > 40 && tileHeight > 36;
  const nameTop = tileY + TILE_PADDING + (showIcon ? 32 : 0);
  const mainValueTop = nameTop + (showName ? 34 : 0) + (showIcon && !showName ? 4 : 0);

  return (
    <g fill="none">
      <rect
        x={tileX}
        y={tileY}
        width={tileWidth}
        height={tileHeight}
        fill={node.fill}
        rx={TILE_RADIUS}
        ry={TILE_RADIUS}
      />
      {showIcon && (
        <foreignObject
          x={tileX + TILE_PADDING}
          y={tileY + TILE_PADDING}
          width={28}
          height={28}
        >
          <div className="momentum-treemap-node-icon analytics-risk-category-icon">
            <PillarTabIcon name={node.icon} size={14} />
          </div>
        </foreignObject>
      )}
      {showName && (
        <foreignObject
          x={tileX + TILE_PADDING}
          y={nameTop}
          width={innerWidth}
          height={32}
        >
          <div className="momentum-treemap-label">
            {node.pillar}
          </div>
        </foreignObject>
      )}
      {showMainValue && (
        <foreignObject
          x={tileX + TILE_PADDING}
          y={showName ? mainValueTop : tileY + (tileHeight - 20) / 2}
          width={innerWidth}
          height={24}
        >
          <div className={`momentum-treemap-delta momentum-treemap-score-primary${showName ? '' : ' momentum-treemap-delta-compact'}`}>
            {`${node.value.toFixed(1)}%`}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function MomentumMatrix({
  items,
  viewMode,
  compareYears,
  embedded = false,
  chartOnly = false,
}: MomentumMatrixProps) {
  const isYoY = viewMode === 'yoy';
  const compareLabel = formatCompareYearsLabel(compareYears);
  const nodes = toTreemapNodes(items);
  const subtitle = isYoY
    ? `${compareLabel} section scores — recent year share with previous-year cut`
    : 'Section score share for approved pillars in the selected year';
  const insight = useMemo(
    () => generateMomentumMatrixInsight(items, viewMode),
    [items, viewMode],
  );
  const chartTitle = 'Performance & momentum matrix';

  const yearLegend = isYoY ? (
    <div
      className="pillar-composition-legend pillar-composition-legend--end"
      aria-label={`Treemap tiles show ${compareYears[0]} and ${compareYears[1]} section scores`}
    >
      <span>
        <i className="pillar-composition-legend-dot previous" aria-hidden="true" />
        {compareYears[0]}
      </span>
      <span>
        <i className="pillar-composition-legend-dot current-bands" aria-hidden="true" />
        {compareYears[1]}
      </span>
    </div>
  ) : null;

  const treemap = (
    <div className="momentum-treemap-chart-wrap">
      {yearLegend}
      <div className="momentum-treemap-body">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={nodes}
            dataKey="value"
            stroke="#ffffff"
            fill="#f8d7d7"
            content={<MomentumTreemapContent viewMode={viewMode} compareYears={compareYears} />}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (chartOnly) {
    return treemap;
  }

  const body = (
    <>
      {treemap}
      <ul className="momentum-treemap-legend" aria-label="Score band legend">
        {SCORE_BAND_LEGEND.map((entry) => (
          <li key={entry.key}>
            <span
              className="momentum-treemap-legend-swatch"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </li>
        ))}
      </ul>
      <ChartInsightFooter chartTitle={chartTitle} insight={insight} singleLine />
    </>
  );

  if (embedded) {
    return (
      <div className="executive-decision-lens-section momentum-treemap-section">
        <div className="executive-decision-lens-section-header">
          <h3 className="executive-decision-lens-section-title">{chartTitle}</h3>
          <p className="executive-decision-lens-section-subtitle">{subtitle}</p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="chart-card momentum-matrix-card">
      <div className="chart-card-header">
        <div className="executive-decision-lens-section-header">
          <h3 className="executive-decision-lens-section-title">{chartTitle}</h3>
          <p className="executive-decision-lens-section-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="momentum-matrix-body">{body}</div>
    </div>
  );
}
