import type { Section, ViewMode } from '../types';
import {
  SentimentDonut,
  LikertChart,
  DistributionChart,
  YoYComparisonChart,
  PillarScoresChart,
  PartnerChart,
} from './Charts';
import {
  getLikertStatements,
  getCategoryByQuestion,
  getTopCategories,
  isCategory,
  isMean,
} from '../utils';
import { translateLabel } from '../translations';

interface PillarChartsProps {
  section: Section;
  viewMode: ViewMode;
}

function truncate(str: string, max = 36): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

const DEMO_QUESTIONS: { code: string; title: string }[] = [
  { code: 'Q902', title: 'Gender Distribution' },
  { code: 'Q903', title: 'Age Group Distribution' },
  { code: 'Q905', title: 'Nationality Distribution' },
  { code: 'Q907', title: 'Education Level Distribution' },
];

function DemographicsCharts({ section, viewMode }: PillarChartsProps) {
  const meanComparison = section.questions
    .filter(isMean)
    .filter((q) => q.dimensionAr === 'الإجمالي')
    .map((q) => ({
      name: truncate(translateLabel(q.labelEn ?? q.labelAr), 22),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
    }));

  const charts = DEMO_QUESTIONS.map(({ code, title }) => {
    const items = getTopCategories(getCategoryByQuestion(section.questions, code), viewMode, 10);
    return {
      title,
      data: items.map((c) => ({
        name: truncate(c.name, 24),
        fullName: c.name,
        value: viewMode === 'current' ? c.value2025 : c.value,
      })),
    };
  }).filter((c) => c.data.length > 0);

  const partnerData = charts[0]?.data ?? [];

  return (
    <div className="main-content">
      <div className="chart-grid-top">
        <DistributionChart
          data={charts[0]?.data ?? []}
          title={charts[0]?.title ?? 'Gender Distribution'}
          subtitle={viewMode === 'current' ? '2025 share (%)' : 'YoY change (pp)'}
        />
        <PartnerChart
          data={partnerData}
          mode={viewMode}
        />
      </div>
      <div className="chart-grid-bottom">
        {charts.slice(1, 3).map((chart) => (
          <DistributionChart
            key={chart.title}
            data={chart.data}
            title={chart.title}
            subtitle={viewMode === 'current' ? '2025 share (%)' : 'YoY change (pp)'}
          />
        ))}
      </div>
      {charts[3] && (
        <DistributionChart
          data={charts[3].data}
          title={charts[3].title}
          subtitle={viewMode === 'current' ? '2025 share (%)' : 'YoY change (pp)'}
        />
      )}
      {meanComparison.length > 0 && (
        <YoYComparisonChart items={meanComparison} title="Household Metrics — Year Comparison" />
      )}
    </div>
  );
}

export function PillarCharts({ section, viewMode }: PillarChartsProps) {
  if (section.id === 'demographics' || !section.score) {
    return <DemographicsCharts section={section} viewMode={viewMode} />;
  }

  const { score, questions } = section;

  const likertStatements = getLikertStatements(questions).map((q) => ({
    name: truncate(translateLabel(q.statementEn ?? q.statementAr)),
    fullName: translateLabel(q.statementEn ?? q.statementAr),
    value2024: q.data['2024']?.agreement ?? 0,
    value2025: q.data['2025']?.agreement ?? 0,
    value:
      viewMode === 'current'
        ? (q.data['2025']?.agreement ?? 0)
        : (q.data['2025']?.agreement ?? 0) - (q.data['2024']?.agreement ?? 0),
  }));

  const categoricalQuestions = [...new Set(questions.filter(isCategory).map((q) => q.code))];
  const primaryCatCode = categoricalQuestions[0];
  const categoryData = primaryCatCode
    ? getTopCategories(getCategoryByQuestion(questions, primaryCatCode), viewMode).map((c) => ({
        name: truncate(c.name, 28),
        fullName: c.name,
        value: viewMode === 'current' ? c.value2025 : c.value,
      }))
    : [];

  const meanQuestions = questions.filter(isMean);
  const meanComparison = meanQuestions
    .filter((q) => q.dimensionAr === 'الإجمالي' || q.dimensionAr === 'إماراتي')
    .slice(0, 6)
    .map((q) => ({
      name: truncate(translateLabel(q.labelEn ?? q.labelAr), 18),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
    }));

  const hasLikert = likertStatements.length > 0;
  const hasCategories = categoryData.length > 0;
  const hasMean = meanComparison.length > 0;

  return (
    <div className="main-content">
      <div className="chart-grid">
        <SentimentDonut
          positive={score.positive2025}
          negative={score.negative2025}
          mode={viewMode}
        />
        {hasMean ? (
          <YoYComparisonChart items={meanComparison} title="Key Metrics — Year Comparison" />
        ) : hasCategories ? (
          <DistributionChart
            data={categoryData}
            title="Response Distribution"
            subtitle={viewMode === 'current' ? '2025 share (%)' : 'YoY change (pp)'}
          />
        ) : (
          <PillarScoresChart
            data={[{
              name: section.nameEn,
              value2024: score.score2024,
              value2025: score.score2025,
              value: score.yoyChange,
            }]}
            mode={viewMode}
            title={`${section.nameEn} — Score Trend`}
          />
        )}
      </div>

      {hasLikert && (
        <LikertChart
          statements={likertStatements.sort((a, b) => b.value - a.value)}
          mode={viewMode}
          title={`${section.nameEn} — Survey Statements`}
        />
      )}

      {hasCategories && hasLikert && (
        <DistributionChart
          data={categoryData}
          title="Category Breakdown"
          subtitle={viewMode === 'current' ? '2025 distribution (%)' : 'YoY change (pp)'}
        />
      )}

      {!hasLikert && !hasCategories && hasMean && (
        <YoYComparisonChart items={meanComparison} title="Demographic Metrics" />
      )}
    </div>
  );
}
