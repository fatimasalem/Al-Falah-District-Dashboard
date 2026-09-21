import { useMemo } from 'react';
import { PILLAR_TABS } from '../../types';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  formatDelta,
  generateResidualRiskRegisterInsight,
  pickYearValue,
  type RiskRegisterItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { PillarTabIcon } from './PillarTabIcon';

interface RiskRegisterProps {
  items: RiskRegisterItem[];
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
  embedded?: boolean;
}

const NS_TOOLTIP = 'NS — No negative score. This pillar has no approved negative score in the current cube.';

function getPillarIcon(sectionId: string): string {
  return PILLAR_TABS.find((tab) => tab.id === sectionId)?.icon ?? 'grid';
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getRiskLevel(
  item: RiskRegisterItem,
  year: SurveyYear,
): { label: string; tone: 'moderate' | 'stable' | 'pending' | 'na' } {
  if (item.status === 'not_applicable') return { label: 'N/A', tone: 'na' };
  if (item.status === 'unavailable') return { label: 'Pending', tone: 'pending' };

  const current = pickYearValue(item.negative2024, item.negative2025, year) ?? 0;
  const previous = year === '2025' ? item.negative2024 : item.negative2025;
  const concern = Math.max(current, previous ?? current);
  if (concern >= 15) return { label: 'Moderate', tone: 'moderate' };
  return { label: 'Stable', tone: 'stable' };
}

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'flat') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {direction === 'up' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  );
}

function NegativeScoreNa() {
  return (
    <abbr className="analytics-risk-muted analytics-risk-ns" title={NS_TOOLTIP} aria-label={NS_TOOLTIP}>
      NS
    </abbr>
  );
}

function MutedPlaceholder({ children }: { children: string }) {
  return <span className="analytics-risk-muted">{children}</span>;
}

function renderConcernCell(item: RiskRegisterItem, year: SurveyYear) {
  if (item.status === 'unavailable') return <MutedPlaceholder>—</MutedPlaceholder>;
  if (item.status === 'not_applicable') return <NegativeScoreNa />;

  const value = pickYearValue(item.negative2024, item.negative2025, year);
  return value != null ? formatPercent(value) : <MutedPlaceholder>—</MutedPlaceholder>;
}

function renderScoreCell(item: RiskRegisterItem, year: SurveyYear) {
  if (item.status === 'unavailable') return <MutedPlaceholder>—</MutedPlaceholder>;
  const value = pickYearValue(item.score2024, item.score2025, year);
  return value != null ? formatPercent(value) : <MutedPlaceholder>—</MutedPlaceholder>;
}

export function RiskRegister({
  items,
  viewMode,
  selectedYear,
  compareYears,
  embedded = false,
}: RiskRegisterProps) {
  const isYoY = viewMode === 'yoy';
  const displayYear = isYoY ? compareYears[1] : selectedYear;
  const compareLabel = formatCompareYearsLabel(compareYears);
  const subtitle = isYoY
    ? `Ranked ${compareYears[1]} negative concern (lower is better); NS means no negative score.`
    : `Ranked ${selectedYear} negative concern (lower is better); NS means no negative score.`;
  const insight = useMemo(
    () => generateResidualRiskRegisterInsight(items, displayYear, isYoY),
    [displayYear, isYoY, items],
  );
  const chartTitle = 'Residual risk register';

  const table = (
    <div className="analytics-risk-table-wrap">
      <table className="analytics-risk-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Risk</th>
            {isYoY ? <th scope="col">{compareYears[0]} concern</th> : null}
            <th scope="col">{displayYear} concern</th>
            <th scope="col">Score</th>
            {isYoY ? <th scope="col">{compareLabel}</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const risk = getRiskLevel(item, displayYear);
            const yoyDirection = item.yoyChange == null || item.yoyChange === 0
              ? 'flat'
              : item.yoyChange > 0
                ? 'up'
                : 'down';

            return (
              <tr key={item.sectionId}>
                <th scope="row">
                  <span className="analytics-risk-category">
                    <span className="analytics-risk-category-icon">
                      <PillarTabIcon name={getPillarIcon(item.sectionId)} size={14} />
                    </span>
                    <span className="analytics-risk-category-text">{item.pillar}</span>
                  </span>
                </th>
                <td>
                  <span className={`analytics-risk-badge analytics-risk-badge-${risk.tone}`}>
                    {risk.label}
                    {risk.tone === 'moderate' || risk.tone === 'stable' ? (
                      <TrendIcon direction={yoyDirection} />
                    ) : null}
                  </span>
                </td>
                {isYoY ? (
                  <td className="analytics-risk-metric">{renderConcernCell(item, compareYears[0])}</td>
                ) : null}
                <td className="analytics-risk-metric">{renderConcernCell(item, displayYear)}</td>
                <td className="analytics-risk-score">{renderScoreCell(item, displayYear)}</td>
                {isYoY ? (
                  <td className={`analytics-risk-yoy${item.yoyChange != null && item.yoyChange >= 0 ? ' is-rise' : item.yoyChange != null ? ' is-fall' : ''}`}>
                    {item.yoyChange != null ? (
                      <span className="analytics-risk-yoy-value">
                        <TrendIcon direction={yoyDirection} />
                        {formatDelta(item.yoyChange)}
                      </span>
                    ) : (
                      <MutedPlaceholder>—</MutedPlaceholder>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div className="executive-decision-lens-section risk-register-section">
        <div className="executive-decision-lens-section-header">
          <h3 className="executive-decision-lens-section-title">{chartTitle}</h3>
          <p className="executive-decision-lens-section-subtitle">{subtitle}</p>
        </div>
        {table}
        <ChartInsightFooter chartTitle={chartTitle} insight={insight} singleLine />
      </div>
    );
  }

  return (
    <div className="chart-card risk-register-card">
      <div className="chart-card-header">
        <div className="executive-decision-lens-section-header">
          <h3 className="executive-decision-lens-section-title">{chartTitle}</h3>
          <p className="executive-decision-lens-section-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="risk-register-body">
        {table}
        <ChartInsightFooter chartTitle={chartTitle} insight={insight} singleLine />
      </div>
    </div>
  );
}
