import { useMemo } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  generateWorkPositiveStatementsInsight,
  generateWorkRiskStatementsInsight,
  type InsightPart,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader, ChartSectionIcon } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';
import { WorkStatementChart } from './WorkStatementChart';

interface WorkStatementsCardProps {
  positiveItems: StatementComparisonItem[];
  riskItems: StatementComparisonItem[];
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears: CompareYears;
  title?: string;
  maxBodyHeight?: number;
  hideShellHeader?: boolean;
}

export function WorkStatementsCard({
  positiveItems,
  riskItems,
  year,
  viewMode,
  compareYears,
  title = 'Q210 employment statements',
  maxBodyHeight = 320,
  hideShellHeader = false,
}: WorkStatementsCardProps) {
  const isYoY = viewMode === 'yoy';
  const insightYear = isYoY ? compareYears[1] : year;

  const positiveInsight = useMemo(
    () => generateWorkPositiveStatementsInsight(positiveItems, insightYear),
    [insightYear, positiveItems],
  );
  const riskInsight = useMemo(
    () => generateWorkRiskStatementsInsight(riskItems, insightYear),
    [insightYear, riskItems],
  );

  const shellSubtitle = isYoY
    ? `${positiveItems.length} positive and ${riskItems.length} risk Q210 statements (${formatCompareYearsLabel(compareYears)}).`
    : `${positiveItems.length} positive and ${riskItems.length} risk Q210 statements for ${year}.`;
  const positiveSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} employment satisfaction statements, ranked by agreement.`
    : `Employment satisfaction statements for ${year}, ranked by agreement.`;
  const riskSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} employment risk indicators — higher agreement signals reported concern.`
    : `Employment risk indicators for ${year} — higher agreement signals reported concern.`;

  const content = (
      <div className="education-statements-shell-grid">
        <article className="education-statements-lane-card education-statements-lane-card--positive">
          <div className="education-statements-lane-card-header">
            <ChartSectionHeader
              icon="protect"
              title="Positive employment statements"
              subtitle={positiveSubtitle}
              titleClassName="education-statements-lane-card-title"
              subtitleClassName="education-statements-lane-card-subtitle"
            />
            <div className="education-statements-lane-card-actions">
              <StatementYearLegend
                viewMode={viewMode}
                compareYears={compareYears}
                year={year}
                variant="positive"
              />
              <span className="statement-lollipop-badge is-positive">Positive lane</span>
            </div>
          </div>

          <WorkStatementChart
            items={positiveItems}
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="positive"
            maxBodyHeight={maxBodyHeight}
            emptyMessage="No positive employment statements are available for this view."
            ariaLabel="Positive employment statements"
          />

          <WorkLaneInsight chartTitle="Positive employment statements" insight={positiveInsight} />
        </article>

        <article className="education-statements-lane-card education-statements-lane-card--risk">
          <div className="education-statements-lane-card-header">
            <ChartSectionHeader
              icon="risk-register"
              title="Reported employment risk statements"
              subtitle={riskSubtitle}
              titleClassName="education-statements-lane-card-title"
              subtitleClassName="education-statements-lane-card-subtitle"
            />
            <div className="education-statements-lane-card-actions">
              <StatementYearLegend
                viewMode={viewMode}
                compareYears={compareYears}
                year={year}
                variant="risk"
              />
              <span className="statement-lollipop-badge is-risk">Risk lane</span>
            </div>
          </div>

          <WorkStatementChart
            items={riskItems}
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="risk"
            maxBodyHeight={maxBodyHeight}
            fillHeight
            emptyMessage="No reported employment risk statements are available for this view."
            ariaLabel="Reported employment risk statements"
          />

          <WorkLaneInsight chartTitle="Reported employment risk" insight={riskInsight} />
        </article>
      </div>
  );

  if (hideShellHeader) {
    return content;
  }

  return (
    <section className="education-statements-shell-card" aria-label={title}>
      <header className="education-statements-shell-header">
        <div className="education-statements-shell-heading">
          <span className="education-statements-shell-icon" aria-hidden="true">
            <ChartSectionIcon name="statement-register" />
          </span>
          <div className="education-statements-shell-heading-text">
            <h2 className="education-statements-shell-title">{title}</h2>
            <p className="education-statements-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
      </header>
      {content}
    </section>
  );
}

function WorkLaneInsight({
  chartTitle,
  insight,
}: {
  chartTitle: string;
  insight: InsightPart[];
}) {
  return (
    <div className="education-statements-lane-insight">
      <ChartInsightFooter chartTitle={chartTitle} insight={insight} />
    </div>
  );
}
