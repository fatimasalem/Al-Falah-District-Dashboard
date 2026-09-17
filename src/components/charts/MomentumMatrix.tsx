import { useMemo } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { PILLAR_TABS } from '../../types';
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
}

interface MomentumTreemapNode {
  name: string;
  value: number;
  sectionId: string;
  pillar: string;
  yoyChange: number;
  weight: number;
  fill: string;
  icon: string;
  quadrant: MomentumQuadrant;
}

const TILE_GAP = 5;
const TILE_RADIUS = 10;
const TILE_PADDING = 12;

const QUADRANT_LEGEND: Array<{ key: MomentumQuadrant; label: string; color: string }> = [
  { key: 'scale', label: 'Scale', color: '#86efac' },
  { key: 'protect', label: 'Protect', color: '#93c5fd' },
  { key: 'investigate', label: 'Investigate', color: '#f8d7d7' },
];

function getPillarIcon(sectionId: string): string {
  return PILLAR_TABS.find((tab) => tab.id === sectionId)?.icon ?? 'grid';
}

function getDeltaToneClass(yoyChange: number): string {
  if (yoyChange > 0) return 'momentum-treemap-delta-positive';
  if (yoyChange < 0) return 'momentum-treemap-delta-negative';
  return 'momentum-treemap-delta-neutral';
}

function getTreemapFill(quadrant: MomentumQuadrant, yoyChange: number): string {
  if (quadrant === 'scale') return '#bbf7d0';
  if (quadrant === 'protect') return '#dbeafe';
  if (yoyChange < -3) return '#efb4b4';
  if (yoyChange < 0) return '#f5c8c8';
  return '#f8d7d7';
}

function toTreemapNodes(items: MomentumMatrixItem[]): MomentumTreemapNode[] {
  const totalScore = items.reduce((sum, item) => sum + item.score2025, 0);

  return items.map((item) => ({
    name: item.pillar,
    value: item.score2025,
    sectionId: item.sectionId,
    pillar: item.pillar,
    yoyChange: item.yoyChange,
    weight: totalScore > 0 ? (item.score2025 / totalScore) * 100 : 0,
    fill: getTreemapFill(item.quadrant, item.yoyChange),
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
  yoyChange?: number;
  weight?: number;
  icon?: string;
  quadrant?: MomentumQuadrant;
  children?: MomentumTreemapNode[];
  payload?: MomentumTreemapNode;
  viewMode?: ViewMode;
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
    yoyChange,
    weight,
    icon,
    children,
    payload,
    viewMode = 'yoy',
  } = props;

  if (depth === 0 || (children && children.length > 0)) return null;
  if (width < 2 || height < 2) return null;

  const node: MomentumTreemapNode = {
    name: name ?? payload?.name ?? '',
    value: props.value ?? payload?.value ?? 0,
    sectionId: props.sectionId ?? payload?.sectionId ?? '',
    pillar: pillar ?? payload?.pillar ?? name ?? '',
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
  const innerWidth = Math.max(0, tileWidth - TILE_PADDING * 2);

  const showIcon = tileWidth > 52 && tileHeight > 48;
  const showName = tileWidth > 60 && tileHeight > 56;
  const showMainValue = tileWidth > 40 && tileHeight > 36;
  const showSecondaryScore = isYoY && tileWidth > 68 && tileHeight > 72;

  const mainValueText = isYoY ? formatDelta(node.yoyChange) : `${node.value.toFixed(1)}%`;
  const mainValueClass = isYoY
    ? `momentum-treemap-delta ${getDeltaToneClass(node.yoyChange)}${showName ? '' : ' momentum-treemap-delta-compact'}`
    : `momentum-treemap-delta momentum-treemap-score-primary${showName ? '' : ' momentum-treemap-delta-compact'}`;

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
          <div className={mainValueClass}>
            {mainValueText}
          </div>
        </foreignObject>
      )}
      {showSecondaryScore && (
        <foreignObject
          x={tileX + TILE_PADDING}
          y={tileY + tileHeight - TILE_PADDING - 14}
          width={innerWidth}
          height={16}
        >
          <div className="momentum-treemap-score">
            {`Score ${node.value.toFixed(1)}%`}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function MomentumMatrix({ items, viewMode, compareYears, embedded = false }: MomentumMatrixProps) {
  const isYoY = viewMode === 'yoy';
  const compareLabel = formatCompareYearsLabel(compareYears);
  const nodes = toTreemapNodes(items);
  const subtitle = isYoY
    ? `2025 section score share vs ${compareLabel} movement for approved pillars`
    : 'Section score share for approved pillars in the selected year';
  const insight = useMemo(
    () => generateMomentumMatrixInsight(items, viewMode),
    [items, viewMode],
  );
  const chartTitle = 'Performance & momentum matrix';

  const body = (
    <>
      <div className="momentum-treemap-body">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={nodes}
            dataKey="value"
            stroke="#ffffff"
            fill="#f8d7d7"
            content={<MomentumTreemapContent viewMode={viewMode} />}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      </div>
      <ul className="momentum-treemap-legend" aria-label="Momentum quadrant legend">
        {QUADRANT_LEGEND.map((entry) => (
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
