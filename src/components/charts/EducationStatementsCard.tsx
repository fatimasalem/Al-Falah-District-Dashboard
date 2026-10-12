import { useMemo, useState } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  EDUCATION_POSITIVE_CATEGORY_LABELS,
  EDUCATION_POSITIVE_CATEGORY_ORDER,
  filterEducationPositiveRowsByCategory,
  formatCompareYearsLabel,
  generateEducationPositiveStatementsInsight,
  generateEducationRiskStatementsInsight,
  type EducationPositiveCategory,
  type InsightPart,
  type StatementComparisonItem,
} from '../../utils';
import { ChartInsightFooter } from './ChartInsightFooter';
import { ChartSectionHeader, ChartSectionIcon } from './ChartSectionHeader';
import { StatementYearLegend } from './StatementYearLegend';
import { WorkStatementChart } from './WorkStatementChart';

interface EducationStatementsCardProps {
  positiveItems: StatementComparisonItem[];
  riskItems: StatementComparisonItem[];
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
  positiveItems,
  riskItems,
  year,
  viewMode,
  compareYears,
  title = 'Education statements',
  maxBodyHeight = 320,
  hideShellHeader = false,
}: EducationStatementsCardProps) {
  const [activeCategory, setActiveCategory] = useState<EducationPositiveCategory>('school');
  const isYoY = viewMode === 'yoy';
  const insightYear = isYoY ? compareYears[1] : year;

  const categoryItems = useMemo(
    () => filterEducationPositiveRowsByCategory(positiveItems, activeCategory),
    [activeCategory, positiveItems],
  );

  const activeCategoryLabel = EDUCATION_POSITIVE_CATEGORY_LABELS[activeCategory];
  const positiveInsight = useMemo(
    () => generateEducationPositiveStatementsInsight(categoryItems, insightYear, activeCategoryLabel),
    [activeCategoryLabel, categoryItems, insightYear],
  );
  const riskInsight = useMemo(
    () => generateEducationRiskStatementsInsight(riskItems, insightYear),
    [insightYear, riskItems],
  );

  const shellSubtitle = isYoY
    ? `${positiveItems.length} positive and ${riskItems.length} risk education statements (${formatCompareYearsLabel(compareYears)}).`
    : `${positiveItems.length} positive and ${riskItems.length} risk education statements for ${year}.`;
  const positiveSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} satisfaction and confidence statements, ranked by agreement.`
    : `Satisfaction and confidence statements for ${year}, ranked by agreement.`;
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
              const count = filterEducationPositiveRowsByCategory(positiveItems, tab.id).length;
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

          <WorkStatementChart
            items={categoryItems}
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="positive"
            maxBodyHeight={maxBodyHeight}
            emptyMessage={`No ${activeCategoryLabel.toLowerCase()} statements available.`}
            ariaLabel="Positive education statements"
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

          <WorkStatementChart
            items={riskItems}
            year={year}
            viewMode={viewMode}
            compareYears={compareYears}
            variant="risk"
            maxBodyHeight={maxBodyHeight}
            fillHeight
            emptyMessage="No reported school safety risk statements are available for this view."
            ariaLabel="Reported school safety risk statements"
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
