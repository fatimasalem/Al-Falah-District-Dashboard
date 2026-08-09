import type { Section, SurveyYear, ViewMode } from '../types';
import {
  SentimentDonut,
  LikertChart,
  DistributionChart,
  YoYComparisonChart,
  PillarScoresChart,
  PartnerChart,
  IncomeBarChartCard,
  IncomePieChartCard,
  IncomeBarriersHeatmap,
} from './Charts';
import {
  getLikertStatements,
  getCategoryByQuestion,
  getTopCategories,
  getIncomeFeelingChartData,
  getIncomeDistributionData,
  getIncomeBarrierHeatmapData,
  getIncomeChartBadgeScore,
  isCategory,
  isMean,
  pickYearValue,
} from '../utils';
import { translateLabel } from '../translations';

interface PillarChartsProps {
  section: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
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

function IncomeCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const spendingExpectation = getIncomeDistributionData(section.questions, 'Q108', selectedYear, 6);
  const savingBehaviour = getIncomeDistributionData(section.questions, 'Q105', selectedYear, 4);
  const savingBarriers = getIncomeBarrierHeatmapData(section.questions, selectedYear);
  const incomeFeelings = getIncomeFeelingChartData(section.questions, selectedYear);

  return (
    <div className="main-content">
      <div className="chart-grid-top">
        <IncomeBarChartCard
          data={spendingExpectation}
          title="Expected Monthly Spending"
          description="Share of residents expecting lower, stable, or higher spending over the next three months."
          badgeScore={getIncomeChartBadgeScore(spendingExpectation, selectedYear, 'spending', viewMode)}
          mode={viewMode}
          year={selectedYear}
          metric="spending"
        />
        <IncomePieChartCard
          data={savingBehaviour}
          title="Saving from Monthly Income"
          description="Percentage of residents who save from monthly income versus those who do not."
          badgeScore={getIncomeChartBadgeScore(savingBehaviour, selectedYear, 'saving', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
      <div className="chart-grid-bottom">
        <IncomeBarriersHeatmap
          data={savingBarriers}
          title="Barriers to Saving"
          description="Main reasons residents cite for not being able to save, as a share of responses."
          badgeScore={getIncomeChartBadgeScore(savingBarriers, selectedYear, 'barriers', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
        <IncomeBarChartCard
          data={incomeFeelings}
          title="How Residents Feel About Income"
          description="How residents describe their household's ability to live on current income."
          badgeScore={getIncomeChartBadgeScore(incomeFeelings, selectedYear, 'feeling', viewMode)}
          mode={viewMode}
          year={selectedYear}
          metric="feeling"
        />
      </div>
    </div>
  );
}

function DemographicsCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const meanComparison = section.questions
    .filter(isMean)
    .filter((q) => q.dimensionAr === 'الإجمالي')
    .map((q) => ({
      name: truncate(translateLabel(q.labelEn ?? q.labelAr), 22),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
    }));

  const shareSubtitle = viewMode === 'current' ? `${selectedYear} share (%)` : 'YoY change (%)';

  const charts = DEMO_QUESTIONS.map(({ code, title }) => {
    const items = getTopCategories(getCategoryByQuestion(section.questions, code), viewMode, 10, selectedYear);
    return {
      title,
      data: items.map((c) => ({
        name: truncate(c.name, 24),
        fullName: c.name,
        value: viewMode === 'current'
          ? pickYearValue(c.value2024, c.value2025, selectedYear)
          : c.value,
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
          subtitle={shareSubtitle}
        />
        <PartnerChart
          data={partnerData}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
      <div className="chart-grid-bottom">
        {charts.slice(1, 3).map((chart) => (
          <DistributionChart
            key={chart.title}
            data={chart.data}
            title={chart.title}
            subtitle={shareSubtitle}
          />
        ))}
      </div>
      {charts[3] && (
        <DistributionChart
          data={charts[3].data}
          title={charts[3].title}
          subtitle={shareSubtitle}
        />
      )}
      {meanComparison.length > 0 && (
        <YoYComparisonChart items={meanComparison} title="Household Metrics — Year Comparison" />
      )}
    </div>
  );
}

export function PillarCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  if (section.id === 'demographics' || !section.score) {
    return <DemographicsCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  if (section.id === 'income') {
    return <IncomeCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  const { score, questions } = section;
  const shareSubtitle = viewMode === 'current' ? `${selectedYear} share (%)` : 'YoY change (%)';

  const likertStatements = getLikertStatements(questions).map((q) => ({
    name: truncate(translateLabel(q.statementEn ?? q.statementAr)),
    fullName: translateLabel(q.statementEn ?? q.statementAr),
    value2024: q.data['2024']?.agreement ?? 0,
    value2025: q.data['2025']?.agreement ?? 0,
    value:
      viewMode === 'current'
        ? pickYearValue(q.data['2024']?.agreement ?? 0, q.data['2025']?.agreement ?? 0, selectedYear)
        : (q.data['2025']?.agreement ?? 0) - (q.data['2024']?.agreement ?? 0),
  }));

  const categoricalQuestions = [...new Set(questions.filter(isCategory).map((q) => q.code))];
  const primaryCatCode = categoricalQuestions[0];
  const categoryData = primaryCatCode
    ? getTopCategories(getCategoryByQuestion(questions, primaryCatCode), viewMode, undefined, selectedYear).map((c) => ({
        name: truncate(c.name, 28),
        fullName: c.name,
        value: viewMode === 'current'
          ? pickYearValue(c.value2024, c.value2025, selectedYear)
          : c.value,
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
          positive={pickYearValue(score.positive2024, score.positive2025, selectedYear)}
          negative={pickYearValue(score.negative2024, score.negative2025, selectedYear)}
          mode={viewMode}
          year={selectedYear}
        />
        {hasMean ? (
          <YoYComparisonChart items={meanComparison} title="Key Metrics — Year Comparison" />
        ) : hasCategories ? (
          <DistributionChart
            data={categoryData}
            title="Response Distribution"
            subtitle={shareSubtitle}
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
            year={selectedYear}
            title={`${section.nameEn} — Score Trend`}
          />
        )}
      </div>

      {hasLikert && (
        <LikertChart
          statements={likertStatements.sort((a, b) => b.value - a.value)}
          mode={viewMode}
          year={selectedYear}
          title={`${section.nameEn} — Survey Statements`}
        />
      )}

      {hasCategories && hasLikert && (
        <DistributionChart
          data={categoryData}
          title="Category Breakdown"
          subtitle={viewMode === 'current' ? `${selectedYear} distribution (%)` : 'YoY change (%)'}
        />
      )}

      {!hasLikert && !hasCategories && hasMean && (
        <YoYComparisonChart items={meanComparison} title="Demographic Metrics" />
      )}
    </div>
  );
}
