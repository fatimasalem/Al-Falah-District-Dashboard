import type { CompareYears, Section, SurveyYear, ViewMode } from '../types';
import {
  SentimentDonut,
  LikertChart,
  DistributionChart,
  YoYComparisonChart,
  PillarScoresChart,
  IncomeBarChartCard,
  IncomePieChartCard,
  IncomeBarriersHeatmap,
  IncomeFeelingTreemapCard,
  EducationDisciplineDonutCard,
  DemographicsGenderHubCard,
  DemographicsIncomeBarChartCard,
  DemographicsMaritalBarChartCard,
  DEMOGRAPHICS_CITIZENSHIP_LABELS,
  SecuritySentimentTreemapCard,
  HEALTH_STRESS_LABELS,
  HEALTH_BINARY_LABELS,
} from './Charts';
import {
  getLikertStatements,
  getCategoryByQuestion,
  getTopCategories,
  getIncomeFeelingChartData,
  getIncomeDistributionData,
  getIncomeBarrierHeatmapData,
  getIncomeChartBadgeScore,
  getHealthEmotionalStressData,
  getHealthChronicDiseaseData,
  getHealthTabChartBadgeScore,
  getInfrastructureStatementChanges,
  getInfrastructureServiceScorecard,
  isCategory,
  isMean,
  pickYearValue,
  getYearDelta,
  getDemographicsGenderData,
  getDemographicsCitizenshipData,
  getDemographicsMaritalChartData,
  getDemographicsIncomeChartData,
  getDemographicsDonutBadgeScore,
  getDemographicsDistributionBadgeScore,
  getDemographicsIncomeBadgeScore,
  generateDemographicsBinaryInsight,
  getStatementRegisterData,
  getSecurityConfidenceStatements,
  getSecurityConcernStatements,
  getHealthCentresAssessmentStatements,
  getHealthSystemQualityStatements,
  getHealthWellbeingContext,
  getCalculatedHealthScore,
  getHealthCentresOverallSatisfaction,
  getHealthcareSystemOverallSatisfaction,
  getEnvironmentPositiveStatements,
  getEnvironmentInsectsRiskStatement,
  getEnvironmentDomainHeatmap,
  getHousingPositiveStatements,
  getHousingConditionRiskMatrix,
} from '../utils';
import { translateLabel } from '../translations';
import { StatementRegister } from './registers/StatementRegister';
import { WorkEducationStatementRegisterSection } from './charts/WorkEducationStatementRegisterSection';
import { WorkEducationStatementsSection } from './charts/WorkEducationStatementsSection';
import { TwoLaneDotPlot } from './charts/TwoLaneDotPlot';
import { HealthAssessmentCard } from './charts/HealthAssessmentCard';
import { EnvironmentAssessmentCard } from './charts/EnvironmentAssessmentCard';
import { HousingAssessmentCard } from './charts/HousingAssessmentCard';
import { InfrastructureAssessmentCard } from './charts/InfrastructureAssessmentCard';

interface SectionChartsProps {
  section: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

interface PillarChartsProps {
  section?: Section;
  workSection?: Section;
  educationSection?: Section;
  infrastructureSection?: Section;
  housingSection?: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

function truncate(str: string, max = 36): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function DemographicsCharts({ section, viewMode, selectedYear, compareYears }: SectionChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const gender = getDemographicsGenderData(section.questions, chartYear);
  const gender2024 = getDemographicsGenderData(section.questions, compareYears[0]);
  const citizenship = getDemographicsCitizenshipData(section.questions, chartYear);
  const citizenship2024 = getDemographicsCitizenshipData(section.questions, compareYears[0]);
  const marital = getDemographicsMaritalChartData(section.questions, chartYear);
  const income = getDemographicsIncomeChartData(section.questions, chartYear);

  return (
    <div className="main-content main-content-education">
      <div className="chart-grid-bottom chart-grid-education">
        <DemographicsGenderHubCard
          data={gender}
          data2024={gender2024}
          title="Gender"
          description="Share of male and female residents in Al Falah district."
          badgeScore={getDemographicsDonutBadgeScore(gender, gender2024, viewMode, selectedYear)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="gender distribution"
          emptyMessage="No gender data available."
          insight={generateDemographicsBinaryInsight(
            gender[0],
            'Male',
            'Female',
            viewMode,
            gender2024[0],
          )}
        />
        <EducationDisciplineDonutCard
          data={citizenship}
          data2024={citizenship2024}
          title="Citizenship"
          description="Share of Emirati and non-Emirati residents in Al Falah district."
          badgeScore={getDemographicsDonutBadgeScore(citizenship, citizenship2024, viewMode, selectedYear)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="citizenship distribution"
          emptyMessage="No citizenship data available."
          sentimentLabels={DEMOGRAPHICS_CITIZENSHIP_LABELS}
          legendKeys={['dissatisfied', 'satisfied']}
          insight={generateDemographicsBinaryInsight(
            citizenship[0],
            'Emirati',
            'Non-Emirati',
            viewMode,
            citizenship2024[0],
          )}
        />
      </div>
      <div className="chart-grid-bottom chart-grid-education">
        <DemographicsMaritalBarChartCard
          data={marital}
          title="Marital Status"
          description="Share of residents by marital status — married, divorced, widowed, or single."
          badgeScore={getDemographicsDistributionBadgeScore(marital, viewMode, selectedYear)}
          mode={viewMode}
          year={selectedYear}
          singleLineDescription
        />
        <DemographicsIncomeBarChartCard
          data={income}
          title="Family Monthly Income Level"
          description="Distribution of household monthly income brackets across Al Falah residents."
          badgeScore={getDemographicsIncomeBadgeScore(income, viewMode, selectedYear)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
    </div>
  );
}

function IncomeCharts({ section, viewMode, selectedYear }: SectionChartsProps) {
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
          description="Share of residents who save from monthly income versus those who do not."
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
        <IncomeFeelingTreemapCard
          data={incomeFeelings}
          title="How Residents Feel About Income"
          description="How residents describe their household's ability to live on current income."
          badgeScore={getIncomeChartBadgeScore(incomeFeelings, selectedYear, 'feeling', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
    </div>
  );
}

function WorkEducationCharts({
  workSection,
  educationSection,
  viewMode,
  selectedYear,
  compareYears,
}: {
  workSection: Section;
  educationSection: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}) {
  return (
    <div className="main-content main-content-education pillar-viz-layout">
      <WorkEducationStatementsSection
        workSection={workSection}
        educationSection={educationSection}
        viewMode={viewMode}
        selectedYear={selectedYear}
        compareYears={compareYears}
      />
      <WorkEducationStatementRegisterSection
        workSection={workSection}
        educationSection={educationSection}
        compareYears={compareYears}
      />
    </div>
  );
}

function SecurityCharts({ section, viewMode, selectedYear, compareYears }: SectionChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const confidenceItems = getSecurityConfidenceStatements(section.questions, compareYears);
  const concernItems = getSecurityConcernStatements(section.questions, compareYears);
  const statementRegister = getStatementRegisterData(section.questions, compareYears, 'Q401');
  const confidenceRegister = statementRegister.filter((row) => row.polarity === 'positive');
  const concernRegister = statementRegister.filter((row) => row.polarity === 'negative');

  return (
    <div className="main-content main-content-education pillar-viz-layout">
      <TwoLaneDotPlot
        confidenceItems={confidenceItems}
        concernItems={concernItems}
        compareYears={compareYears}
        year={chartYear}
        viewMode={viewMode}
        title="Q401 confidence vs concern"
        maxBodyHeight={320}
      />
      <StatementRegister
        title="Q401 statement register"
        subtitle="Review Security pillar statements with agreement, disagreement, and movement."
        tabs={[
          {
            id: 'confidence',
            label: 'Confidence statements',
            rows: confidenceRegister,
            subtitle: 'Statements where higher agreement reflects stronger perceived security and safety.',
          },
          {
            id: 'concern',
            label: 'Reported concern',
            rows: concernRegister,
            subtitle: 'Risk-framed indicators where higher agreement means more reported concern.',
          },
        ]}
      />
    </div>
  );
}

function HealthCharts({ section, viewMode, selectedYear, compareYears }: SectionChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const centresItems = getHealthCentresAssessmentStatements(section.questions, compareYears);
  const systemItems = getHealthSystemQualityStatements(section.questions, compareYears);
  const wellbeingRows = getHealthWellbeingContext(section.questions, compareYears);
  const calculatedScore = getCalculatedHealthScore(section.questions, chartYear);
  const q501Score = getHealthCentresOverallSatisfaction(section.questions, chartYear);
  const q502Score = getHealthcareSystemOverallSatisfaction(section.questions, chartYear);
  const emotionalStress = getHealthEmotionalStressData(section.questions, chartYear);
  const emotionalStress2024 = getHealthEmotionalStressData(section.questions, compareYears[0]);
  const chronicDisease = getHealthChronicDiseaseData(section.questions, chartYear);
  const chronicDisease2024 = getHealthChronicDiseaseData(section.questions, compareYears[0]);
  return (
    <div className="main-content main-content-education pillar-viz-layout">
      <HealthAssessmentCard
        centresItems={centresItems}
        systemItems={systemItems}
        wellbeingRows={wellbeingRows}
        compareYears={compareYears}
        year={chartYear}
        viewMode={viewMode}
        calculatedScore={calculatedScore}
        q501Score={q501Score}
        q502Score={q502Score}
      />
      <div className="chart-grid-bottom chart-grid-education chart-grid-compact pillar-viz-detail-grid">
        <SecuritySentimentTreemapCard
          data={emotionalStress}
          data2024={emotionalStress2024}
          title="Residents Emotional Stress Levels"
          description="Distribution of resident emotional stress on a 0–10 scale grouped as low, moderate, or high."
          badgeScore={getHealthTabChartBadgeScore(emotionalStress, emotionalStress2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="emotional stress"
          emptyMessage="No emotional stress data available."
          sentimentLabels={HEALTH_STRESS_LABELS}
          compact
        />
        <EducationDisciplineDonutCard
          data={chronicDisease}
          data2024={chronicDisease2024}
          title="Chronic Diseases or Health Problems"
          description="Share of residents who report chronic diseases or ongoing health problems."
          badgeScore={getHealthTabChartBadgeScore(chronicDisease, chronicDisease2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="chronic health conditions"
          emptyMessage="No chronic disease data available."
          sentimentLabels={HEALTH_BINARY_LABELS}
          legendKeys={['dissatisfied', 'satisfied']}
        />
      </div>
    </div>
  );
}

function EnvironmentCharts({ section, viewMode, selectedYear, compareYears }: SectionChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const statementRegister = getStatementRegisterData(section.questions, compareYears, 'Q601');
  const positiveRegister = statementRegister.filter((row) => row.polarity === 'positive');
  const riskRegister = statementRegister.filter((row) => row.polarity === 'negative');
  const positiveItems = getEnvironmentPositiveStatements(section.questions, compareYears);
  const insectsRisk = getEnvironmentInsectsRiskStatement(section.questions, compareYears);
  const domainRows = getEnvironmentDomainHeatmap(section.questions, compareYears);

  return (
    <div className="main-content main-content-education pillar-viz-layout">
      <EnvironmentAssessmentCard
        positiveItems={positiveItems}
        insectsRisk={insectsRisk}
        domainRows={domainRows}
        compareYears={compareYears}
        year={chartYear}
        viewMode={viewMode}
      />
      <StatementRegister
        title="Q601 statement register"
        subtitle="Review Environment pillar statements with agreement, disagreement, and movement."
        tabs={[
          {
            id: 'positive',
            label: 'Positive statements',
            rows: positiveRegister,
            subtitle: 'Satisfaction statements behind the Environment pillar.',
          },
          {
            id: 'risk',
            label: 'Reported concern',
            rows: riskRegister,
            subtitle: 'Insects and rodents — higher agreement means more reported concern.',
          },
        ]}
      />
    </div>
  );
}

function HousingInfrastructureCharts({
  infrastructureSection,
  housingSection,
  viewMode,
  selectedYear,
  compareYears,
}: {
  infrastructureSection: Section;
  housingSection: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}) {
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const statementChanges = getInfrastructureStatementChanges(infrastructureSection.questions, compareYears);
  const serviceScorecard = getInfrastructureServiceScorecard(infrastructureSection.questions, compareYears);
  const positiveItems = getHousingPositiveStatements(housingSection.questions, compareYears);
  const riskMatrixItems = getHousingConditionRiskMatrix(housingSection.questions, compareYears);

  return (
    <div className="main-content main-content-education pillar-viz-layout">
      <InfrastructureAssessmentCard
        statementItems={statementChanges}
        serviceRows={serviceScorecard}
        compareYears={compareYears}
        year={chartYear}
        viewMode={viewMode}
      />
      <HousingAssessmentCard
        positiveItems={positiveItems}
        riskMatrixItems={riskMatrixItems}
        compareYears={compareYears}
        year={chartYear}
        viewMode={viewMode}
      />
    </div>
  );
}

export function PillarCharts({
  section,
  workSection,
  educationSection,
  infrastructureSection,
  housingSection,
  viewMode,
  selectedYear,
  compareYears,
}: PillarChartsProps) {
  if (workSection && educationSection) {
    return (
      <WorkEducationCharts
        workSection={workSection}
        educationSection={educationSection}
        viewMode={viewMode}
        selectedYear={selectedYear}
        compareYears={compareYears}
      />
    );
  }

  if (infrastructureSection && housingSection) {
    return (
      <HousingInfrastructureCharts
        infrastructureSection={infrastructureSection}
        housingSection={housingSection}
        viewMode={viewMode}
        selectedYear={selectedYear}
        compareYears={compareYears}
      />
    );
  }

  if (!section) {
    return null;
  }

  if (section.id === 'demographics') {
    return <DemographicsCharts section={section} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />;
  }

  if (section.id === 'income') {
    return <IncomeCharts section={section} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />;
  }

  if (!section.score) {
    return null;
  }

  if (section.id === 'security') {
    return <SecurityCharts section={section} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />;
  }

  if (section.id === 'health') {
    return <HealthCharts section={section} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />;
  }

  if (section.id === 'environment') {
    return <EnvironmentCharts section={section} viewMode={viewMode} selectedYear={selectedYear} compareYears={compareYears} />;
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
        : getYearDelta(q.data['2024']?.agreement ?? 0, q.data['2025']?.agreement ?? 0, compareYears),
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
