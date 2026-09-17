import { useMemo } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  generateWorkPositiveStatementsInsight,
  generateWorkRiskStatementsInsight,
  getCurrentYearDivergingLikertRows,
  type DivergingLikertStatementRow,
  type InsightPart,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader, ChartSectionIcon } from './ChartSectionHeader';
import { GroupedDivergingLikertChart } from './GroupedDivergingLikertChart';
import { StatementYearLegend } from './StatementYearLegend';

interface WorkStatementsCardProps {
  positiveRows: DivergingLikertStatementRow[];
  riskRows: DivergingLikertStatementRow[];
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears: CompareYears;
  title?: string;
  maxBodyHeight?: number;
  hideShellHeader?: boolean;
}

export function WorkStatementsCard({
  positiveRows,
  riskRows,
  year,
  viewMode,
  compareYears,
  title = 'Q210 employment statements',
  maxBodyHeight = 320,
  hideShellHeader = false,
}: WorkStatementsCardProps) {
  const isYoY = viewMode === 'yoy';

  const positiveInsight = useMemo(() => {
    const insightRows = getCurrentYearDivergingLikertRows(positiveRows, viewMode, compareYears);
    return generateWorkPositiveStatementsInsight(insightRows, year);
  }, [compareYears, positiveRows, viewMode, year]);
  const riskInsight = useMemo(() => {
    const insightRows = getCurrentYearDivergingLikertRows(riskRows, viewMode, compareYears);
    return generateWorkRiskStatementsInsight(insightRows, year);
  }, [compareYears, riskRows, viewMode, year]);

  const shellSubtitle = isYoY
    ? `${positiveRows.length} positive and ${riskRows.length} risk Q210 statements (${formatCompareYearsLabel(compareYears)}).`
    : `${positiveRows.length} positive and ${riskRows.length} risk Q210 statements for ${year}.`;
  const positiveSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} employment satisfaction statements, sorted by agreement.`
    : `Employment satisfaction statements for ${year}, sorted by agreement.`;
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

          <GroupedDivergingLikertChart
            rows={positiveRows}
            title="Positive employment statements"
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="positive"
            topic="work"
            embedded
            showInsight={false}
            maxBodyHeight={maxBodyHeight}
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

          <GroupedDivergingLikertChart
            rows={riskRows}
            title="Reported employment risk statements"
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="risk"
            topic="work"
            embedded
            showInsight={false}
            maxBodyHeight={maxBodyHeight}
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
