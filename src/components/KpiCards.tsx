import type { ReactElement, ReactNode } from 'react';
import type { ViewMode, CategoryQuestion, MeanQuestion, SurveyData, SurveyYear, Section } from '../types';
import { KPI_GRADIENTS } from '../types';
import {
  formatDelta,
  isCategory,
  isMean,
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

function getCategoryIcon(categoryEn: string): CategoryIconName {
  const normalized = categoryEn.toLowerCase();

  if (normalized.includes('car loan')) return 'car';
  if (normalized.includes('home loan')) return 'home';
  if (normalized.includes('credit card')) return 'credit-card';
  if (normalized.includes('personal loan')) return 'loan';
  if (normalized.includes('transportation')) return 'transport';
  if (normalized.includes('housing') || normalized.includes('household')) return 'home';
  if (normalized.includes('food')) return 'food';
  if (normalized.includes('school education')) return 'school';
  if (normalized.includes('university education')) return 'education';
  if (normalized.includes('health')) return 'health';
  if (normalized.includes('communication')) return 'phone';
  if (normalized.includes('entertainment') || normalized.includes('vacation')) return 'entertainment';
  if (normalized.includes('children')) return 'children';
  if (normalized.includes('personal care')) return 'personal-care';
  if (normalized.includes('miscellaneous')) return 'misc';
  if (normalized.includes('debt obligation')) return 'debt';

  return 'misc';
}

interface KpiCardsProps {
  items: KpiItem[];
  viewMode?: ViewMode;
}

export function KpiCards({ items, viewMode = 'current' }: KpiCardsProps) {
  return (
    <div className="kpi-row">
      {items.slice(0, 4).map((item, i) => (
        <div
          key={item.label}
          className="kpi-card"
          style={{ background: KPI_GRADIENTS[i % KPI_GRADIENTS.length] }}
        >
          <div className="kpi-label">
            {item.icon && (
              <span className="kpi-label-icon">
                <KpiIcon name={item.icon} />
              </span>
            )}
            {item.label}
          </div>
          <div className="kpi-value">
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
            <div className={`kpi-delta ${item.delta >= 0 ? 'positive' : 'negative'}`}>
              <span className="kpi-delta-icon">{item.delta >= 0 ? '▲' : '▼'}</span>
              {formatDelta(Math.abs(item.delta))} {item.deltaLabel ?? 'YoY'}
            </div>
          )}
          {item.subtext && <div className="kpi-subtext">{item.subtext}</div>}
        </div>
      ))}
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

  if (mode === 'yoy') {
    return cards;
  }
  return cards.map(({ delta: _delta, deltaLabel: _deltaLabel, ...rest }) => rest);
}

export function buildDemographicsKpis(
  section: import('../types').Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  const catValue = (code: string, category: string): number => {
    const q = section.questions.find(
      (item): item is CategoryQuestion =>
        isCategory(item) && item.code === code && item.categoryAr === category,
    );
    if (!q) return 0;
    const v2025 = q.data['2025'] ?? 0;
    const v2024 = q.data['2024'] ?? 0;
    return mode === 'current' ? (q.data[year] ?? 0) : v2025 - v2024;
  };

  const meanValue = (code: string): number => {
    const q = section.questions.find(
      (item): item is MeanQuestion =>
        isMean(item) && item.code === code && item.dimensionAr === 'الإجمالي',
    );
    if (!q) return 0;
    const v2025 = q.data['2025'] ?? 0;
    const v2024 = q.data['2024'] ?? 0;
    return mode === 'current' ? (q.data[year] ?? 0) : v2025 - v2024;
  };

  if (mode === 'current') {
    return [
      { label: 'Male', value: `${catValue('Q902', 'ذكر').toFixed(1)}`, suffix: '%' },
      { label: 'Female', value: `${catValue('Q902', 'أنثى').toFixed(1)}`, suffix: '%' },
      { label: 'Emirati', value: `${catValue('Q905', 'إماراتي').toFixed(1)}`, suffix: '%' },
      { label: 'Non-Emirati', value: `${catValue('Q905', 'غير إماراتي').toFixed(1)}`, suffix: '%' },
      { label: 'Avg Household Size', value: `${meanValue('Q914').toFixed(1)}`, suffix: ' persons' },
    ];
  }

  return [
    { label: 'Male Δ', value: formatDelta(catValue('Q902', 'ذكر')) },
    { label: 'Female Δ', value: formatDelta(catValue('Q902', 'أنثى')) },
    { label: 'Emirati Δ', value: formatDelta(catValue('Q905', 'إماراتي')) },
    { label: 'Non-Emirati Δ', value: formatDelta(catValue('Q905', 'غير إماراتي')) },
    { label: 'Household Δ', value: formatDelta(meanValue('Q914')), suffix: '' },
  ];
}

export function buildPillarKpis(
  score: import('../types').SectionScore | null,
  mode: ViewMode,
  year: SurveyYear = '2025',
): KpiItem[] {
  if (!score) return [];
  if (mode === 'current') {
    return [
      { label: 'Section Score', value: `${pickYearValue(score.score2024, score.score2025, year)}`, suffix: '%', delta: score.yoyChange },
      { label: 'Positive Sentiment', value: `${pickYearValue(score.positive2024, score.positive2025, year)}`, suffix: '%', delta: score.positive2025 - score.positive2024 },
      { label: 'Negative Sentiment', value: `${pickYearValue(score.negative2024, score.negative2025, year)}`, suffix: '%', delta: score.negative2025 - score.negative2024 },
      { label: year === '2025' ? '2024 Baseline' : '2025 Score', value: `${year === '2025' ? score.score2024 : score.score2025}`, suffix: '%' },
      { label: 'Top Partner', value: score.sectionNameEn, subtext: 'Current pillar', delta: score.yoyChange },
    ];
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
      valueIcon: topExpense ? getCategoryIcon(topExpense.categoryEn) : undefined,
      subtext: getIncomeKpiSentence('expense', topExpense?.value ?? 0, topExpense?.categoryEn, topExpense?.name),
      delta: topExpense ? expenseDelta : undefined,
    },
    {
      label: 'Top Debt Obligation',
      icon: 'credit-card',
      value: topDebt ? `${topDebt.value.toFixed(1)}` : '—',
      suffix: topDebt ? '%' : undefined,
      valueCaption: topDebt ? 'report this debt' : undefined,
      valueIcon: topDebt ? getCategoryIcon(topDebt.categoryEn) : undefined,
      subtext: getIncomeKpiSentence('debt', topDebt?.value ?? 0, topDebt?.categoryEn, topDebt?.name),
      delta: topDebt ? debtDelta : undefined,
    },
  ];

  if (mode === 'yoy') {
    return cards;
  }
  return cards.map(({ delta: _delta, deltaLabel: _deltaLabel, ...rest }) => rest);
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

  if (mode === 'yoy') {
    return cards;
  }
  return cards.map(({ delta: _delta, deltaLabel: _deltaLabel, ...rest }) => rest);
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

  if (mode === 'yoy') {
    return cards;
  }
  return cards.map(({ delta: _delta, deltaLabel: _deltaLabel, ...rest }) => rest);
}
