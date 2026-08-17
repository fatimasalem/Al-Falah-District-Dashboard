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
  IncomeFeelingTreemapCard,
  WorkPieChartCard,
  WorkHorizontalBarChartCard,
  WorkColumnBarChartCard,
  WorkSupportHeatmap,
  EducationLikertStackedCard,
  EducationSportsLikertGaugeCard,
  EducationDisciplineDonutCard,
  SecurityDivergingLikertBarCard,
  SecuritySentimentTreemapCard,
  HealthAssessmentBarChartCard,
  HEALTH_STRESS_LABELS,
  HEALTH_EATING_LABELS,
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
  getWorkJobseekerChartData,
  getWorkChallengeChartData,
  getWorkBusinessChartData,
  getWorkSupportHeatmapData,
  getWorkChartBadgeScore,
  getEducationSportsFacilitiesData,
  getEducationBullyingExperienceData,
  getEducationBullyingAwarenessData,
  getEducationDisciplineFairnessData,
  getEducationTabChartBadgeScore,
  getEducationLikertScaleBadgeScore,
  getSecurityFreedomExpressionData,
  getSecurityPeerInfluenceData,
  getSecurityPowerOutagesData,
  getSecurityDrugPreventionData,
  getHealthServiceAssessmentData,
  getHealthSystemAssessmentData,
  getHealthEmotionalStressData,
  getHealthHealthyEatingData,
  getHealthChronicDiseaseData,
  getHealthTabChartBadgeScore,
  getEnvironmentInsectsRodentsData,
  getEnvironmentServiceFacilitiesData,
  getEnvironmentInternalRoadServicesData,
  getEnvironmentUrbanPlanningData,
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

function WorkCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const jobseekers = getWorkJobseekerChartData(section.questions, selectedYear);
  const challenges = getWorkChallengeChartData(section.questions, selectedYear);
  const business = getWorkBusinessChartData(section.questions, selectedYear);
  const support = getWorkSupportHeatmapData(section.questions, selectedYear);

  return (
    <div className="main-content main-content-work">
      <div className="chart-grid-top chart-grid-work-top">
        <WorkPieChartCard
          data={jobseekers}
          title="Active Jobseekers"
          description="Share of residents who looked for paid work in the past four weeks."
          badgeScore={getWorkChartBadgeScore(jobseekers, selectedYear, 'jobseekers', viewMode)}
          singleLineDescription
          mode={viewMode}
          year={selectedYear}
        />
        <WorkHorizontalBarChartCard
          data={challenges}
          title="Challenges to Finding Employment"
          description="Most common barriers preventing residents from obtaining a job opportunity."
          badgeScore={getWorkChartBadgeScore(challenges, selectedYear, 'challenges', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
      <div className="chart-grid-bottom chart-grid-work-bottom">
        <WorkColumnBarChartCard
          data={business}
          title="Private Business or Investment"
          description="Where residents hold a private project or investment, inside or outside the UAE."
          badgeScore={getWorkChartBadgeScore(business, selectedYear, 'business', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
        <WorkSupportHeatmap
          data={support}
          title="Expected Government Employment Support"
          description="Types of support residents expect from government entities in the field of employment."
          badgeScore={getWorkChartBadgeScore(support, selectedYear, 'support', viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
    </div>
  );
}

function EducationCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : '2025';
  const sports = getEducationSportsFacilitiesData(section.questions, chartYear);
  const sports2024 = getEducationSportsFacilitiesData(section.questions, '2024');
  const bullying = getEducationBullyingExperienceData(section.questions, chartYear);
  const bullying2024 = getEducationBullyingExperienceData(section.questions, '2024');
  const awareness = getEducationBullyingAwarenessData(section.questions, chartYear);
  const awareness2024 = getEducationBullyingAwarenessData(section.questions, '2024');
  const discipline = getEducationDisciplineFairnessData(section.questions, chartYear);
  const discipline2024 = getEducationDisciplineFairnessData(section.questions, '2024');

  return (
    <div className="main-content main-content-education">
      <div className="chart-grid-bottom chart-grid-education">
        <EducationSportsLikertGaugeCard
          data={sports}
          data2024={sports2024}
          title="Sports Facilities Availability"
          description="Residents' perception of sports facilities for students and the community."
          badgeScore={getEducationLikertScaleBadgeScore(sports, sports2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
        <EducationLikertStackedCard
          data={bullying}
          data2024={bullying2024}
          title="Children's Reported Experience of Bullying"
          description="Parents' reports of repeated bullying at neighborhood schools."
          badgeScore={getEducationTabChartBadgeScore(bullying, bullying2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topic="bullying"
          singleLineDescription
        />
      </div>
      <div className="chart-grid-bottom chart-grid-education">
        <EducationLikertStackedCard
          data={awareness}
          data2024={awareness2024}
          title="Awareness of Bullying Incidents"
          description="Whether residents have heard or seen bullying involving students in their neighborhood."
          badgeScore={getEducationTabChartBadgeScore(awareness, awareness2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topic="awareness"
        />
        <EducationDisciplineDonutCard
          data={discipline}
          data2024={discipline2024}
          title="Fairness of Student Discipline"
          description="Residents' perception of school disciplinary practices on a Likert scale."
          badgeScore={getEducationTabChartBadgeScore(discipline, discipline2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
        />
      </div>
    </div>
  );
}

function SecurityCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : '2025';
  const freedom = getSecurityFreedomExpressionData(section.questions, chartYear);
  const freedom2024 = getSecurityFreedomExpressionData(section.questions, '2024');
  const peerInfluence = getSecurityPeerInfluenceData(section.questions, chartYear);
  const peerInfluence2024 = getSecurityPeerInfluenceData(section.questions, '2024');
  const powerOutages = getSecurityPowerOutagesData(section.questions, chartYear);
  const powerOutages2024 = getSecurityPowerOutagesData(section.questions, '2024');
  const drugPrevention = getSecurityDrugPreventionData(section.questions, chartYear);
  const drugPrevention2024 = getSecurityDrugPreventionData(section.questions, '2024');

  return (
    <div className="main-content main-content-education">
      <div className="chart-grid-bottom chart-grid-education">
        <EducationSportsLikertGaugeCard
          data={freedom}
          data2024={freedom2024}
          title="Safety Through Freedom of Expression"
          description="Residents' perceptions of whether they feel safe expressing their views in their community."
          badgeScore={getEducationLikertScaleBadgeScore(freedom, freedom2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="freedom of expression safety"
          emptyMessage="No freedom of expression data available."
        />
        <EducationDisciplineDonutCard
          data={peerInfluence}
          data2024={peerInfluence2024}
          title="Concern About Negative Peer Influence"
          description="Residents worried about their children's exposure to negative peer groups."
          badgeScore={getEducationTabChartBadgeScore(peerInfluence, peerInfluence2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="negative peer influence concern"
          emptyMessage="No peer influence data available."
        />
      </div>
      <div className="chart-grid-bottom chart-grid-education">
        <SecurityDivergingLikertBarCard
          data={powerOutages}
          data2024={powerOutages2024}
          title="Safety from Power Outages"
          description="Residents' perception of electricity reliability and security."
          badgeScore={getEducationTabChartBadgeScore(powerOutages, powerOutages2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="power outage safety"
          emptyMessage="No power outage safety data available."
        />
        <SecuritySentimentTreemapCard
          data={drugPrevention}
          data2024={drugPrevention2024}
          title="Confidence in Drug Prevention"
          description="Residents' confidence in Abu Dhabi Police's ability to combat drugs in their residential area."
          badgeScore={getEducationTabChartBadgeScore(drugPrevention, drugPrevention2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="drug prevention confidence"
          emptyMessage="No drug prevention confidence data available."
        />
      </div>
    </div>
  );
}

function HealthCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : '2025';
  const serviceAssessment = getHealthServiceAssessmentData(section.questions, chartYear);
  const systemAssessment = getHealthSystemAssessmentData(section.questions, chartYear);
  const emotionalStress = getHealthEmotionalStressData(section.questions, chartYear);
  const emotionalStress2024 = getHealthEmotionalStressData(section.questions, '2024');
  const healthyEating = getHealthHealthyEatingData(section.questions, chartYear);
  const healthyEating2024 = getHealthHealthyEatingData(section.questions, '2024');
  const chronicDisease = getHealthChronicDiseaseData(section.questions, chartYear);
  const chronicDisease2024 = getHealthChronicDiseaseData(section.questions, '2024');

  return (
    <div className="main-content main-content-education">
      <div className="chart-grid-bottom chart-grid-education">
        <HealthAssessmentBarChartCard
          serviceData={serviceAssessment}
          systemData={systemAssessment}
          title="Healthcare Assessment"
          description="Healthcare service and system ratings (good 60%+, acceptable 50–59%, bad below 50%)."
          mode={viewMode}
          year={selectedYear}
        />
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
        />
      </div>
      <div className="chart-grid-bottom chart-grid-education">
        <SecurityDivergingLikertBarCard
          data={healthyEating}
          data2024={healthyEating2024}
          title="Residents Healthy Eating Frequency"
          description="How often residents believe they eat healthy meals."
          badgeScore={getHealthTabChartBadgeScore(healthyEating, healthyEating2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="healthy eating frequency"
          emptyMessage="No healthy eating data available."
          sentimentLabels={HEALTH_EATING_LABELS}
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

function EnvironmentCharts({ section, viewMode, selectedYear }: PillarChartsProps) {
  const chartYear = viewMode === 'current' ? selectedYear : '2025';
  const insectsRodents = getEnvironmentInsectsRodentsData(section.questions, chartYear);
  const insectsRodents2024 = getEnvironmentInsectsRodentsData(section.questions, '2024');
  const serviceFacilities = getEnvironmentServiceFacilitiesData(section.questions, chartYear);
  const serviceFacilities2024 = getEnvironmentServiceFacilitiesData(section.questions, '2024');
  const internalRoadServices = getEnvironmentInternalRoadServicesData(section.questions, chartYear);
  const internalRoadServices2024 = getEnvironmentInternalRoadServicesData(section.questions, '2024');
  const urbanPlanning = getEnvironmentUrbanPlanningData(section.questions, chartYear);
  const urbanPlanning2024 = getEnvironmentUrbanPlanningData(section.questions, '2024');

  return (
    <div className="main-content main-content-education">
      <div className="chart-grid-bottom chart-grid-education">
        <EducationDisciplineDonutCard
          data={insectsRodents}
          data2024={insectsRodents2024}
          title="Insects and Rodents in Living Areas"
          description="Residents' perception on whether insects and rodents keep showing up in the living area."
          badgeScore={getEducationTabChartBadgeScore(insectsRodents, insectsRodents2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="insects and rodents presence"
          emptyMessage="No insects and rodents data available."
        />
        <SecurityDivergingLikertBarCard
          data={serviceFacilities}
          data2024={serviceFacilities2024}
          title="Service Facilities Quality"
          description="Resident satisfaction with parks, playgrounds, and public amenities."
          badgeScore={getEducationTabChartBadgeScore(serviceFacilities, serviceFacilities2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="service facilities quality"
          singleLineDescription
          emptyMessage="No service facilities data available."
        />
      </div>
      <div className="chart-grid-bottom chart-grid-education">
        <SecuritySentimentTreemapCard
          data={internalRoadServices}
          data2024={internalRoadServices2024}
          title="Satisfaction with Internal Road Services"
          description="Resident satisfaction with sidewalks, street lighting, parking, and walkways."
          badgeScore={getEducationTabChartBadgeScore(internalRoadServices, internalRoadServices2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="internal road services"
          singleLineDescription
          emptyMessage="No internal road services data available."
        />
        <EducationSportsLikertGaugeCard
          data={urbanPlanning}
          data2024={urbanPlanning2024}
          title="Satisfaction with Urban Planning"
          description="Resident satisfaction with urban planning of streets, parking, sidewalks, and area access."
          badgeScore={getEducationLikertScaleBadgeScore(urbanPlanning, urbanPlanning2024, viewMode)}
          mode={viewMode}
          year={selectedYear}
          topicLabel="urban planning satisfaction"
          singleLineDescription
          emptyMessage="No urban planning data available."
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

  if (section.id === 'work') {
    return <WorkCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  if (section.id === 'education') {
    return <EducationCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  if (section.id === 'security') {
    return <SecurityCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  if (section.id === 'health') {
    return <HealthCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
  }

  if (section.id === 'environment') {
    return <EnvironmentCharts section={section} viewMode={viewMode} selectedYear={selectedYear} />;
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
