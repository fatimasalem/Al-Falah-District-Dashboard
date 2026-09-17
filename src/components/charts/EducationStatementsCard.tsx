import { useMemo, useState } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  EDUCATION_POSITIVE_CATEGORY_LABELS,
  EDUCATION_POSITIVE_CATEGORY_ORDER,
  filterEducationPositiveRowsByCategory,
  formatCompareYearsLabel,
  generateEducationPositiveStatementsInsight,
  generateEducationRiskStatementsInsight,
  getCurrentYearDivergingLikertRows,
  type DivergingLikertStatementRow,
  type EducationPositiveCategory,
  type InsightPart,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader, ChartSectionIcon } from './ChartSectionHeader';
import { GroupedDivergingLikertChart } from './GroupedDivergingLikertChart';
import { StatementYearLegend } from './StatementYearLegend';

interface EducationStatementsCardProps {
  positiveRows: DivergingLikertStatementRow[];
  riskRows: DivergingLikertStatementRow[];
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears: CompareYears;
  title?: string;
  maxBodyHeight?: number;
  hideShellHeader?: boolean;
}

const POSITIVE_CATEGORY_TABS = EDUCATION_POSITIVE_CATEGORY_ORDER.map((id) => ({
  id,
  label: EDUCATION_POSITIVE_CATEGORY_LABELS[id],
}));

export function EducationStatementsCard({
  positiveRows,
  riskRows,
  year,
  viewMode,
  compareYears,
  title = 'Q301 education statements',
  maxBodyHeight = 320,
  hideShellHeader = false,
}: EducationStatementsCardProps) {
  const [activeCategory, setActiveCategory] = useState<EducationPositiveCategory>('school');
  const isYoY = viewMode === 'yoy';

  const categoryRows = useMemo(
    () => filterEducationPositiveRowsByCategory(positiveRows, activeCategory),
    [activeCategory, positiveRows],
  );

  const activeCategoryLabel = EDUCATION_POSITIVE_CATEGORY_LABELS[activeCategory];
  const positiveInsight = useMemo(() => {
    const insightRows = getCurrentYearDivergingLikertRows(categoryRows, viewMode, compareYears);
    return generateEducationPositiveStatementsInsight(insightRows, year, activeCategoryLabel);
  }, [activeCategoryLabel, categoryRows, compareYears, viewMode, year]);
  const riskInsight = useMemo(() => {
    const insightRows = getCurrentYearDivergingLikertRows(riskRows, viewMode, compareYears);
    return generateEducationRiskStatementsInsight(insightRows, year);
  }, [compareYears, riskRows, viewMode, year]);

  const shellSubtitle = isYoY
    ? `${positiveRows.length} positive and ${riskRows.length} risk Q301 statements (${formatCompareYearsLabel(compareYears)}).`
    : `${positiveRows.length} positive and ${riskRows.length} risk Q301 statements for ${year}.`;
  const positiveSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} satisfaction and confidence statements, sorted by agreement.`
    : `Satisfaction and confidence statements for ${year}, sorted by agreement.`;
  const riskSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} bullying and harm indicators — higher agreement signals reported concern.`
    : `Bullying and harm indicators for ${year} — higher agreement signals reported concern.`;

  const content = (
      <div className="education-statements-shell-grid">
        <article className="education-statements-lane-card education-statements-lane-card--positive">
          <div className="education-statements-lane-card-header">
            <ChartSectionHeader
              icon="protect"
              title="Positive education statements"
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

          <div
            className="statement-register-tabs education-statements-category-tabs"
            role="tablist"
            aria-label="Positive statement categories"
          >
            {POSITIVE_CATEGORY_TABS.map((tab) => {
              const count = filterEducationPositiveRowsByCategory(positiveRows, tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === tab.id}
                  className={`statement-register-tab${activeCategory === tab.id ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  {tab.label}
                  <span className="statement-register-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <GroupedDivergingLikertChart
            rows={categoryRows}
            title="Positive education statements"
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="positive"
            topic="education"
            embedded
            showInsight={false}
            maxBodyHeight={maxBodyHeight}
            emptyMessage={`No ${activeCategoryLabel.toLowerCase()} statements available.`}
          />

          <EducationLaneInsight
            chartTitle={`Positive education — ${activeCategoryLabel}`}
            insight={positiveInsight}
          />
        </article>

        <article className="education-statements-lane-card education-statements-lane-card--risk">
          <div className="education-statements-lane-card-header">
            <ChartSectionHeader
              icon="risk-register"
              title="Reported school safety risk statements"
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
            title="Reported school safety risk statements"
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="risk"
            topic="education"
            embedded
            showInsight={false}
            maxBodyHeight={maxBodyHeight}
          />

          <EducationLaneInsight chartTitle="Reported school safety risk" insight={riskInsight} />
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

function EducationLaneInsight({
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
