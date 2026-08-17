import type { ReactElement, ReactNode } from 'react';
import type { ViewMode, SurveyData, SurveyYear, Section } from '../types';
import {
  formatDelta,
  getIncomeComfortPercent,
  getEmploymentPercent,
  getSafetyPercent,
  getOverviewKpiSentence,
  getIncomeKpiSentence,
  pickYearValue,
  getAverageMonthlyIncome,
  getTopMultiSelectCategory,
  INCOME_DEBT_EXCLUSIONS,
  getAverageWeeklyHours,
  getWorkLifeBalancePercent,
  getGovernmentAssistancePercent,
  getWorkKpiSentence,
  getEducationChildSafetyPercent,
  getEducationLifeSkillsPercent,
  getEducationUniversitySatisfactionPercent,
  getEducationKpiSentence,
  getSecurityMovingSafePercent,
  getSecurityPoliceTrustPercent,
  getSecurityJobSecurityPercent,
  getSecurityKpiSentence,
  getHealthCurrentHealthGoodPercent,
  getHealthPhysicalActivityHours,
  getHealthSleepQualityGoodPercent,
  getHealthKpiSentence,
  getEnvironmentCleanlinessPercent,
  getEnvironmentAirQualityPercent,
  getEnvironmentNoiseLevelPercent,
  getEnvironmentKpiSentence,
  getInfrastructureWaterElectricityPercent,
  getInfrastructureGasStationsPercent,
  getInfrastructureShoppingPercent,
  getInfrastructureKpiSentence,
  getDemographicsMeanValue,
  getDemographicsTopCategory,
  getDemographicsKpiSentence,
} from '../utils';

export type KpiIconName =
  | 'satisfaction'
  | 'wallet'
  | 'briefcase'
  | 'shield'
  | 'receipt'
  | 'credit-card'
  | 'education'
  | 'spark';

export type CategoryIconName =
  | 'car'
  | 'home'
  | 'food'
  | 'credit-card'
  | 'education'
  | 'school'
  | 'health'
  | 'transport'
  | 'phone'
  | 'entertainment'
  | 'children'
  | 'personal-care'
  | 'misc'
  | 'debt'
  | 'loan';

export interface KpiItem {
  label: string;
  value: string;
  icon?: KpiIconName;
  valueIcon?: CategoryIconName;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  valueCaption?: string;
  subtext?: ReactNode;
  tone?: 'positive' | 'negative';
}

const KPI_GOOD_THRESHOLD = 70;

function getPercentTone(value: number, invert = false): 'positive' | 'negative' {
  const good = value >= KPI_GOOD_THRESHOLD;
  if (invert) return good ? 'negative' : 'positive';
  return good ? 'positive' : 'negative';
}

function getFamilySizeTone(value: number): 'positive' | 'negative' {
  return value >= 3 ? 'positive' : 'negative';
}

function getWorkingMembersTone(value: number): 'positive' | 'negative' {
  return value >= 1 ? 'positive' : 'negative';
}

function getMonthlyIncomeTone(value: number): 'positive' | 'negative' {
  return value >= 8000 ? 'positive' : 'negative';
}

function getWeeklyHoursTone(value: number): 'positive' | 'negative' {
  return value >= 20 ? 'positive' : 'negative';
}

function getPhysicalActivityTone(value: number): 'positive' | 'negative' {
  return value >= 1 ? 'positive' : 'negative';
}

function finalizeKpiCards(
  cards: KpiItem[],
  mode: ViewMode,
  tones: Array<'positive' | 'negative' | undefined>,
): KpiItem[] {
  const cardsWithTone = cards.map((card, index) => ({
    ...card,
    tone: tones[index],
  }));
  if (mode === 'yoy') return cardsWithTone;
  return cardsWithTone.map(({ delta: _delta, deltaLabel: _deltaLabel, ...rest }) => rest);
}

function KpiIcon({ name }: { name: KpiIconName }) {
  const props = {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  const icons: Record<KpiIconName, ReactElement> = {
    satisfaction: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    wallet: (
      <svg {...props}>
        <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 11h.01" />
        <path d="M3 10h18" />
      </svg>
    ),
    briefcase: (
      <svg {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    shield: (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    receipt: (
      <svg {...props}>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
    'credit-card': (
      <svg {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    education: (
      <svg {...props}>
        <path d="M22 10l-10-5L2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
      </svg>
    ),
    spark: (
      <svg {...props}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
      </svg>
    ),
  };

  return icons[name];
}

function CategoryIcon({ name, size = 'default' }: { name: CategoryIconName; size?: 'default' | 'value' }) {
  const isValue = size === 'value';
  const props = {
    width: isValue ? undefined : 22,
    height: isValue ? undefined : 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: isValue ? 2.25 : 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  const icons: Record<CategoryIconName, ReactElement> = {
    car: (
      <svg {...props}>
        <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
      </svg>
    ),
    home: (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    food: (
      <svg {...props}>
        <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 002-2V2M7 2v20M17 2v7a4 4 0 01-4 4h0a4 4 0 01-4-4V2" />
      </svg>
    ),
    'credit-card': (
      <svg {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    education: (
      <svg {...props}>
        <path d="M22 10l-10-5L2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
      </svg>
    ),
    school: (
      <svg {...props}>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    health: (
      <svg {...props}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    transport: (
      <svg {...props}>
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v5h-3M5 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
    phone: (
      <svg {...props}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    entertainment: (
      <svg {...props}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M10 9l6 3-6 3V9z" />
      </svg>
    ),
    children: (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    'personal-care': (
      <svg {...props}>
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      </svg>
    ),
    misc: (
      <svg {...props}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
    debt: (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    loan: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  };

  return icons[name];
}

interface KpiCardsProps {
  items: KpiItem[];
  viewMode?: ViewMode;
}

export function KpiCards({ items, viewMode = 'current' }: KpiCardsProps) {
  return (
    <div className="kpi-row">
      {items.slice(0, 4).map((item) => {
        return (
          <div key={item.label} className="kpi-card">
            <div className="kpi-label">
              {item.icon && (
                <span className="kpi-label-icon">
                  <KpiIcon name={item.icon} />
                </span>
              )}
              {item.label}
            </div>
            <div className={`kpi-value${item.tone ? ` ${item.tone}` : ''}`}>
              {item.valueIcon && (
                <span className="kpi-value-icon">
                  <CategoryIcon name={item.valueIcon} size="value" />
                </span>
              )}
              <span className="kpi-value-text">
                {item.value}
                {item.suffix && <span className="kpi-suffix">{item.suffix}</span>}
                {item.valueCaption && <span className="kpi-value-caption">{item.valueCaption}</span>}
              </span>
            </div>
            {viewMode === 'yoy' && item.delta !== undefined && (
              <div className={`kpi-delta${item.tone ? ` ${item.tone}` : ''}`}>
                <span className="kpi-delta-icon">{item.delta >= 0 ? '▲' : '▼'}</span>
                {formatDelta(Math.abs(item.delta))} {item.deltaLabel ?? 'YoY'}
              </div>
            )}
            {item.subtext && <div className="kpi-subtext">{item.subtext}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function buildOverviewKpis(data: SurveyData, mode: ViewMode, year: SurveyYear = '2025'): KpiItem[] {
  const { overview } = data;
  const satisfaction = pickYearValue(overview.overallScore2024, overview.overallScore2025, year);
  const incomeComfort = getIncomeComfortPercent(data, year);
  const employment = getEmploymentPercent(data, year);
  const safety = getSafetyPercent(data, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Satisfaction',
      icon: 'satisfaction',
      value: `${satisfaction.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getOverviewKpiSentence('satisfaction', satisfaction),
      delta: overview.overallYoyChange,
    },
    {
      label: 'Income Comfort',
      icon: 'wallet',
      value: `${incomeComfort.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are comfortable',
      subtext: getOverviewKpiSentence('income', incomeComfort),
      delta: incomeComfort - getIncomeComfortPercent(data, '2024'),
    },
    {
      label: 'Employment',
      icon: 'briefcase',
      value: `${employment.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are employed',
      subtext: getOverviewKpiSentence('employment', employment),
      delta: employment - getEmploymentPercent(data, '2024'),
    },
    {
      label: 'Safety',
      icon: 'shield',
      value: `${safety.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel safe',
      subtext: getOverviewKpiSentence('safety', safety),
      delta: safety - getSafetyPercent(data, '2024'),
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(satisfaction),
    getPercentTone(incomeComfort),
    getPercentTone(employment),
    getPercentTone(safety),
  ]);
}

function formatDemographicsAgeLabel(categoryEn: string | undefined, categoryAr: string): string {
  const raw = categoryEn ?? categoryAr;
  if (raw === '65 years and over') return '65+';
  if (raw === 'Under 18 years old') return 'Under 18';
  return raw;
}

function formatDemographicsEducationLabel(categoryEn: string | undefined, categoryAr: string): string {
  const labels: Record<string, string> = {
    "Bachelor's": "Bachelor's",
    secondary: 'Secondary',
    preparatory: 'Preparatory',
    'Primary school or less': 'Primary or less',
    diploma: 'Diploma',
    "Master's degree or higher": "Master's or higher",
  };
  const raw = categoryEn ?? categoryAr;
  return labels[raw] ?? raw;
}

export function buildDemographicsKpis(
  section: import('../types').Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const questions = section.questions;
  const familySize2024 = getDemographicsMeanValue(questions, 'Q914', '2024');
  const familySize2025 = getDemographicsMeanValue(questions, 'Q914', '2025');
  const familySize = pickYearValue(familySize2024, familySize2025, year);
  const workingMembers2024 = getDemographicsMeanValue(questions, 'Q915', '2024');
  const workingMembers2025 = getDemographicsMeanValue(questions, 'Q915', '2025');
  const workingMembers = pickYearValue(workingMembers2024, workingMembers2025, year);
  const topAge = getDemographicsTopCategory(
    questions,
    'Q903',
    year,
    new Set(['Not mentioned', 'لم يذكر']),
    formatDemographicsAgeLabel,
  );
  const topEducation = getDemographicsTopCategory(
    questions,
    'Q907',
    year,
    new Set(),
    formatDemographicsEducationLabel,
  );

  const cards: KpiItem[] = [
    {
      label: 'Average Number of Family Members',
      icon: 'spark',
      value: `${familySize.toFixed(1)}`,
      suffix: ' members',
      valueCaption: 'per household',
      subtext: getDemographicsKpiSentence('familySize', familySize),
      delta: familySize2025 - familySize2024,
    },
    {
      label: 'Largest Age Group',
      icon: 'briefcase',
      value: topAge?.name ?? '—',
      subtext: topAge
        ? getDemographicsKpiSentence('ageGroup', topAge.value, topAge.name)
        : 'No age group data available.',
      delta: topAge ? topAge.value2025 - topAge.value2024 : undefined,
    },
    {
      label: 'Highest-Represented Education Level',
      icon: 'education',
      value: topEducation?.name ?? '—',
      subtext: topEducation
        ? getDemographicsKpiSentence('education', topEducation.value, topEducation.name)
        : 'No education level data available.',
      delta: topEducation ? topEducation.value2025 - topEducation.value2024 : undefined,
    },
    {
      label: 'Avg Number of Working Family Members',
      icon: 'wallet',
      value: `${workingMembers.toFixed(1)}`,
      suffix: ' members',
      valueCaption: 'per household',
      subtext: getDemographicsKpiSentence('workingMembers', workingMembers),
      delta: workingMembers2025 - workingMembers2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getFamilySizeTone(familySize),
    topAge ? getPercentTone(topAge.value) : undefined,
    topEducation ? getPercentTone(topEducation.value) : undefined,
    getWorkingMembersTone(workingMembers),
  ]);
}

export function buildPillarKpis(
  score: import('../types').SectionScore | null,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  if (!score) return [];
  if (mode === 'current') {
    const sectionScore = pickYearValue(score.score2024, score.score2025, year);
    const positiveSentiment = pickYearValue(score.positive2024, score.positive2025, year);
    const negativeSentiment = pickYearValue(score.negative2024, score.negative2025, year);
    const comparisonScore = year === '2025' ? score.score2024 : score.score2025;
    return finalizeKpiCards(
      [
        { label: 'Section Score', value: `${sectionScore}`, suffix: '%', delta: score.yoyChange },
        { label: 'Positive Sentiment', value: `${positiveSentiment}`, suffix: '%', delta: score.positive2025 - score.positive2024 },
        { label: 'Negative Sentiment', value: `${negativeSentiment}`, suffix: '%', delta: score.negative2025 - score.negative2024 },
        { label: year === '2025' ? '2024 Baseline' : '2025 Score', value: `${comparisonScore}`, suffix: '%' },
        { label: 'Top Partner', value: score.sectionNameEn, subtext: 'Current pillar', delta: score.yoyChange },
      ],
      mode,
      [
        getPercentTone(sectionScore),
        getPercentTone(positiveSentiment),
        getPercentTone(negativeSentiment, true),
        getPercentTone(comparisonScore),
      ],
    );
  }
  return [
    { label: 'Score Change', value: formatDelta(score.yoyChange) },
    { label: 'Positive Δ', value: formatDelta(score.positive2025 - score.positive2024) },
    { label: 'Negative Δ', value: formatDelta(score.negative2025 - score.negative2024) },
    { label: '2024 Score', value: `${score.score2024}`, suffix: '%' },
    { label: '2025 Score', value: `${score.score2025}`, suffix: '%', delta: score.yoyChange },
  ];
}

function formatAverageIncome(value: number): string {
  return `AED ${Math.round(value).toLocaleString('en-US')}`;
}

export function buildIncomeKpis(
  data: SurveyData,
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const avgIncome2024 = getAverageMonthlyIncome(data, '2024');
  const avgIncome2025 = getAverageMonthlyIncome(data, '2025');
  const avgIncome = pickYearValue(avgIncome2024, avgIncome2025, year);
  const topExpense = getTopMultiSelectCategory(section.questions, 'Q102', year);
  const topDebt = getTopMultiSelectCategory(section.questions, 'Q103', year, INCOME_DEBT_EXCLUSIONS);

  const expenseDelta = topExpense ? topExpense.value2025 - topExpense.value2024 : 0;
  const debtDelta = topDebt ? topDebt.value2025 - topDebt.value2024 : 0;
  const incomePctChange =
    avgIncome2024 > 0 ? ((avgIncome2025 - avgIncome2024) / avgIncome2024) * 100 : 0;

  const cards: KpiItem[] = [
    {
      label: 'Income & Living Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getIncomeKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Avg Monthly Income',
      icon: 'wallet',
      value: formatAverageIncome(avgIncome),
      valueCaption: 'per month',
      subtext: getIncomeKpiSentence('income', avgIncome),
      delta: incomePctChange,
    },
    {
      label: 'Top Living Expense',
      icon: 'receipt',
      value: topExpense ? `${topExpense.value.toFixed(1)}` : '—',
      suffix: topExpense ? '%' : undefined,
      valueCaption: topExpense ? 'report spending on' : undefined,
      // valueIcon: topExpense ? getCategoryIcon(topExpense.categoryEn) : undefined,
      subtext: getIncomeKpiSentence('expense', topExpense?.value ?? 0, topExpense?.categoryEn, topExpense?.name),
      delta: topExpense ? expenseDelta : undefined,
    },
    {
      label: 'Top Debt Obligation',
      icon: 'credit-card',
      value: topDebt ? `${topDebt.value.toFixed(1)}` : '—',
      suffix: topDebt ? '%' : undefined,
      valueCaption: topDebt ? 'report this debt' : undefined,
      // valueIcon: topDebt ? getCategoryIcon(topDebt.categoryEn) : undefined,
      subtext: getIncomeKpiSentence('debt', topDebt?.value ?? 0, topDebt?.categoryEn, topDebt?.name),
      delta: topDebt ? debtDelta : undefined,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getMonthlyIncomeTone(avgIncome),
    topExpense ? getPercentTone(topExpense.value) : undefined,
    topDebt ? getPercentTone(topDebt.value, true) : undefined,
  ]);
}

export function buildWorkKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const avgHours2024 = getAverageWeeklyHours(questions, '2024');
  const avgHours2025 = getAverageWeeklyHours(questions, '2025');
  const avgHours = pickYearValue(avgHours2024, avgHours2025, year);
  const balance2024 = getWorkLifeBalancePercent(questions, '2024');
  const balance2025 = getWorkLifeBalancePercent(questions, '2025');
  const balance = pickYearValue(balance2024, balance2025, year);
  const assistance2024 = getGovernmentAssistancePercent(questions, '2024');
  const assistance2025 = getGovernmentAssistancePercent(questions, '2025');
  const assistance = pickYearValue(assistance2024, assistance2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Employment Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getWorkKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Avg Weekly Working Hours',
      icon: 'briefcase',
      value: `${avgHours.toFixed(1)}`,
      suffix: ' hrs',
      valueCaption: 'per week',
      subtext: getWorkKpiSentence('hours', avgHours),
      delta: avgHours2025 - avgHours2024,
    },
    {
      label: 'Work-Life Balance Security',
      icon: 'shield',
      value: `${balance.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel secure',
      subtext: getWorkKpiSentence('balance', balance),
      delta: balance2025 - balance2024,
    },
    {
      label: 'Government Assistance Recipients',
      icon: 'wallet',
      value: `${assistance.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'receive assistance',
      subtext: getWorkKpiSentence('assistance', assistance),
      delta: assistance2025 - assistance2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getWeeklyHoursTone(avgHours),
    getPercentTone(balance),
    getPercentTone(assistance),
  ]);
}

export function buildEducationKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const safety2024 = getEducationChildSafetyPercent(questions, '2024');
  const safety2025 = getEducationChildSafetyPercent(questions, '2025');
  const safety = pickYearValue(safety2024, safety2025, year);
  const lifeSkills2024 = getEducationLifeSkillsPercent(questions, '2024');
  const lifeSkills2025 = getEducationLifeSkillsPercent(questions, '2025');
  const lifeSkills = pickYearValue(lifeSkills2024, lifeSkills2025, year);
  const university2024 = getEducationUniversitySatisfactionPercent(questions, '2024');
  const university2025 = getEducationUniversitySatisfactionPercent(questions, '2025');
  const university = pickYearValue(university2024, university2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Education Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEducationKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Kids\' Physical Safety at School',
      icon: 'shield',
      value: `${safety.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel kids are safe',
      subtext: getEducationKpiSentence('safety', safety),
      delta: safety2025 - safety2024,
    },
    {
      label: 'Life Skills & Creativity',
      icon: 'spark',
      value: `${lifeSkills.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'value life skills',
      subtext: getEducationKpiSentence('lifeSkills', lifeSkills),
      delta: lifeSkills2025 - lifeSkills2024,
    },
    {
      label: 'University Education Satisfaction',
      icon: 'education',
      value: `${university.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEducationKpiSentence('university', university),
      delta: university2025 - university2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(safety),
    getPercentTone(lifeSkills),
    getPercentTone(university),
  ]);
}

export function buildSecurityKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const movingSafe2024 = getSecurityMovingSafePercent(questions, '2024');
  const movingSafe2025 = getSecurityMovingSafePercent(questions, '2025');
  const movingSafe = pickYearValue(movingSafe2024, movingSafe2025, year);
  const policeTrust2024 = getSecurityPoliceTrustPercent(questions, '2024');
  const policeTrust2025 = getSecurityPoliceTrustPercent(questions, '2025');
  const policeTrust = pickYearValue(policeTrust2024, policeTrust2025, year);
  const jobSecurity2024 = getSecurityJobSecurityPercent(questions, '2024');
  const jobSecurity2025 = getSecurityJobSecurityPercent(questions, '2025');
  const jobSecurity = pickYearValue(jobSecurity2024, jobSecurity2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Security & Safety Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getSecurityKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Safe Moving Around Day & Night',
      icon: 'shield',
      value: `${movingSafe.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel safe',
      subtext: getSecurityKpiSentence('movingSafe', movingSafe),
      delta: movingSafe2025 - movingSafe2024,
    },
    {
      label: 'Trust in Abu Dhabi Police',
      icon: 'shield',
      value: `${policeTrust.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'trust police ability',
      subtext: getSecurityKpiSentence('policeTrust', policeTrust),
      delta: policeTrust2025 - policeTrust2024,
    },
    {
      label: 'Job Security in Abu Dhabi',
      icon: 'briefcase',
      value: `${jobSecurity.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel job security',
      subtext: getSecurityKpiSentence('jobSecurity', jobSecurity),
      delta: jobSecurity2025 - jobSecurity2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(movingSafe),
    getPercentTone(policeTrust),
    getPercentTone(jobSecurity),
  ]);
}

export function buildHealthKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const currentHealth2024 = getHealthCurrentHealthGoodPercent(questions, '2024');
  const currentHealth2025 = getHealthCurrentHealthGoodPercent(questions, '2025');
  const currentHealth = pickYearValue(currentHealth2024, currentHealth2025, year);
  const activity2024 = getHealthPhysicalActivityHours(questions, '2024');
  const activity2025 = getHealthPhysicalActivityHours(questions, '2025');
  const activity = pickYearValue(activity2024, activity2025, year);
  const sleep2024 = getHealthSleepQualityGoodPercent(questions, '2024');
  const sleep2025 = getHealthSleepQualityGoodPercent(questions, '2025');
  const sleep = pickYearValue(sleep2024, sleep2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Health Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getHealthKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Current Health Rated Good',
      icon: 'shield',
      value: `${currentHealth.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'rate health as good',
      subtext: getHealthKpiSentence('currentHealth', currentHealth),
      delta: currentHealth2025 - currentHealth2024,
    },
    {
      label: 'Avg Daily Physical Activity',
      icon: 'spark',
      value: `${activity.toFixed(1)}`,
      suffix: ' hrs',
      valueCaption: 'per day',
      subtext: getHealthKpiSentence('activity', activity),
      delta: activity2025 - activity2024,
    },
    {
      label: 'Sleep Quality Rated Good',
      icon: 'shield',
      value: `${sleep.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'rate sleep as good',
      subtext: getHealthKpiSentence('sleep', sleep),
      delta: sleep2025 - sleep2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(currentHealth),
    getPhysicalActivityTone(activity),
    getPercentTone(sleep),
  ]);
}

export function buildEnvironmentKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const cleanliness2024 = getEnvironmentCleanlinessPercent(questions, '2024');
  const cleanliness2025 = getEnvironmentCleanlinessPercent(questions, '2025');
  const cleanliness = pickYearValue(cleanliness2024, cleanliness2025, year);
  const airQuality2024 = getEnvironmentAirQualityPercent(questions, '2024');
  const airQuality2025 = getEnvironmentAirQualityPercent(questions, '2025');
  const airQuality = pickYearValue(airQuality2024, airQuality2025, year);
  const noiseLevel2024 = getEnvironmentNoiseLevelPercent(questions, '2024');
  const noiseLevel2025 = getEnvironmentNoiseLevelPercent(questions, '2025');
  const noiseLevel = pickYearValue(noiseLevel2024, noiseLevel2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Environment Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Neighborhood Cleanliness Satisfaction',
      icon: 'shield',
      value: `${cleanliness.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('cleanliness', cleanliness),
      delta: cleanliness2025 - cleanliness2024,
    },
    {
      label: 'Satisfaction with Air Quality',
      icon: 'spark',
      value: `${airQuality.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('airQuality', airQuality),
      delta: airQuality2025 - airQuality2024,
    },
    {
      label: 'Satisfaction with Neighborhood Noise Level',
      icon: 'shield',
      value: `${noiseLevel.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('noiseLevel', noiseLevel),
      delta: noiseLevel2025 - noiseLevel2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(cleanliness),
    getPercentTone(airQuality),
    getPercentTone(noiseLevel),
  ]);
}

export function buildInfrastructureKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const waterElectricity2024 = getInfrastructureWaterElectricityPercent(questions, '2024');
  const waterElectricity2025 = getInfrastructureWaterElectricityPercent(questions, '2025');
  const waterElectricity = pickYearValue(waterElectricity2024, waterElectricity2025, year);
  const gasStations2024 = getInfrastructureGasStationsPercent(questions, '2024');
  const gasStations2025 = getInfrastructureGasStationsPercent(questions, '2025');
  const gasStations = pickYearValue(gasStations2024, gasStations2025, year);
  const shopping2024 = getInfrastructureShoppingPercent(questions, '2024');
  const shopping2025 = getInfrastructureShoppingPercent(questions, '2025');
  const shopping = pickYearValue(shopping2024, shopping2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Infrastructure Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('score', sectionScore),
      delta: score.yoyChange,
    },
    {
      label: 'Water and Electricity Services Satisfaction',
      icon: 'shield',
      value: `${waterElectricity.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('waterElectricity', waterElectricity),
      delta: waterElectricity2025 - waterElectricity2024,
    },
    {
      label: 'Satisfaction on Gas Stations Availability',
      icon: 'spark',
      value: `${gasStations.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('gasStations', gasStations),
      delta: gasStations2025 - gasStations2024,
    },
    {
      label: 'Shops & Shopping Centers Satisfaction',
      icon: 'shield',
      value: `${shopping.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('shopping', shopping),
      delta: shopping2025 - shopping2024,
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(waterElectricity),
    getPercentTone(gasStations),
    getPercentTone(shopping),
  ]);
}
