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

function renderPositiveCell(item: RiskRegisterItem, year: SurveyYear) {
  if (item.status === 'unavailable') return <MutedPlaceholder>—</MutedPlaceholder>;

  const value = pickYearValue(item.positive2024, item.positive2025, year);
  return value != null ? formatPercent(value) : <MutedPlaceholder>—</MutedPlaceholder>;
}

function renderNegativeCell(item: RiskRegisterItem, year: SurveyYear) {
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

function YearSentimentHeaders({ year }: { year: SurveyYear }) {
  return (
    <>
      <th scope="col">{year} Positive Sentiment</th>
      <th scope="col">{year} Negative Sentiment</th>
    </>
  );
}

function YearSentimentCells({
  item,
  year,
}: {
  item: RiskRegisterItem;
  year: SurveyYear;
}) {
  return (
    <>
      <td className="analytics-risk-metric analytics-risk-positive">{renderPositiveCell(item, year)}</td>
      <td className="analytics-risk-metric analytics-risk-negative">{renderNegativeCell(item, year)}</td>
    </>
  );
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
    ? `${compareLabel} positive and negative sentiment with section scores.`
    : `${selectedYear} positive and negative sentiment with section scores.`;
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
            {isYoY ? (
              <>
                <YearSentimentHeaders year={compareYears[0]} />
                <YearSentimentHeaders year={compareYears[1]} />
                <th scope="col">{compareYears[0]} Score</th>
                <th scope="col">{compareYears[1]} Score</th>
                <th scope="col">{compareLabel}</th>
              </>
            ) : (
              <>
                <th scope="col">Positive Sentiment</th>
                <th scope="col">Negative Sentiment</th>
                <th scope="col">Score</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
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
                {isYoY ? (
                  <>
                    <YearSentimentCells item={item} year={compareYears[0]} />
                    <YearSentimentCells item={item} year={compareYears[1]} />
                    <td className="analytics-risk-score">{renderScoreCell(item, compareYears[0])}</td>
                    <td className="analytics-risk-score">{renderScoreCell(item, compareYears[1])}</td>
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
                  </>
                ) : (
                  <>
                    <td className="analytics-risk-metric analytics-risk-positive">{renderPositiveCell(item, displayYear)}</td>
                    <td className="analytics-risk-metric analytics-risk-negative">{renderNegativeCell(item, displayYear)}</td>
                    <td className="analytics-risk-score">{renderScoreCell(item, displayYear)}</td>
                  </>
                )}
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
