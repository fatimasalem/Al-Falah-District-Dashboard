import type { ReactElement, ReactNode } from 'react';
import type { ViewMode, SurveyData, SurveyYear, Section, CompareYears } from '../types';
import { DEFAULT_COMPARE_YEARS } from '../types';
import {
  formatDelta,
  formatCompareYearsLabel,
  getYearDelta,
  getIncomeComfortPercent,
  getEmploymentPercent,
  getSafetyPercent,
  getOverviewKpiSentence,
  getIncomeKpiSentence,
  pickYearValue,
  getAverageMonthlyIncome,
  getTopMultiSelectCategory,
  getKpiCategoryShortLabel,
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
  getHousingSpaceAdequacySentiment,
  getHousingMaintenanceSentiment,
  getHousingHomeownershipSentiment,
  getHousingDominantSentimentDelta,
  getHousingKpiSentence,
  HOUSING_KPI_STATEMENT,
  HOUSING_SPACE_ADEQUACY_LABELS,
  HOUSING_MAINTENANCE_LABELS,
  HOUSING_HOMEOWNERSHIP_LABELS,
  type HousingDominantSentiment,
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
  | 'spark'
  | 'money-bill'
  | 'clock'
  | 'government-building'
  | 'police-building'
  | 'health'
  | 'running'
  | 'sleep'
  | 'wind'
  | 'noise'
  | 'utilities'
  | 'gas-station'
  | 'shopping-bag'
  | 'family'
  | 'community'
  | 'house'
  | 'repair'
  | 'home-purchase';

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
    'money-bill': (
      <svg {...props}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
    clock: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    'government-building': (
      <svg {...props}>
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9v0M9 12v0M9 15v0M9 18v0" />
      </svg>
    ),
    'police-building': (
      <svg {...props}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-4h6v4" />
        <path d="M12 7v3" />
        <circle cx="12" cy="5" r="1" />
      </svg>
    ),
    health: (
      <svg {...props}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    running: (
      <svg {...props}>
        <circle cx="14" cy="4" r="2" />
        <path d="M18 11l-3-2-2 4-3-1-4 5" />
        <path d="M8 21l2-6" />
        <path d="M16 21l-1-5" />
      </svg>
    ),
    sleep: (
      <svg {...props} fill="currentColor" stroke="none">
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fontStyle="italic">
          Zz
        </text>
      </svg>
    ),
    wind: (
      <svg {...props}>
        <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
      </svg>
    ),
    noise: (
      <svg {...props}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
      </svg>
    ),
    utilities: (
      <svg {...props}>
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />
        <path d="M17 14l-3 6h-2l-3-6" />
        <path d="M14 20h2" />
      </svg>
    ),
    'gas-station': (
      <svg {...props}>
        <path d="M3 21V5a2 2 0 012-2h6a2 2 0 012 2v16" />
        <path d="M3 21h10" />
        <path d="M15 7h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
        <path d="M15 11h4" />
        <path d="M7 9v0M7 13v0" />
      </svg>
    ),
    'shopping-bag': (
      <svg {...props}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    family: (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    community: (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    house: (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    repair: (
      <svg {...props}>
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    'home-purchase': (
      <svg {...props}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5" />
        <path d="M9 21V12h6v9" />
        <path d="M16 19h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
        <path d="M19 16v3" />
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
  compareYears?: CompareYears;
}

export function KpiCards({ items, viewMode = 'current', compareYears = DEFAULT_COMPARE_YEARS }: KpiCardsProps) {
  const deltaLabel = formatCompareYearsLabel(compareYears);
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
                {formatDelta(Math.abs(item.delta))} {item.deltaLabel ?? deltaLabel}
              </div>
            )}
            {item.subtext && <div className="kpi-subtext">{item.subtext}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function buildOverviewKpis(
  data: SurveyData,
  mode: ViewMode,
  year: SurveyYear = '2025',
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
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
      delta: getYearDelta(overview.overallScore2024, overview.overallScore2025, compareYears),
    },
    {
      label: 'Income Comfort',
      icon: 'wallet',
      value: `${incomeComfort.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are comfortable',
      subtext: getOverviewKpiSentence('income', incomeComfort),
      delta: getIncomeComfortPercent(data, compareYears[1]) - getIncomeComfortPercent(data, compareYears[0]),
    },
    {
      label: 'Employment',
      icon: 'briefcase',
      value: `${employment.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are employed',
      subtext: getOverviewKpiSentence('employment', employment),
      delta: getEmploymentPercent(data, compareYears[1]) - getEmploymentPercent(data, compareYears[0]),
    },
    {
      label: 'Safety',
      icon: 'shield',
      value: `${safety.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel safe',
      subtext: getOverviewKpiSentence('safety', safety),
      delta: getSafetyPercent(data, compareYears[1]) - getSafetyPercent(data, compareYears[0]),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
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
      icon: 'family',
      value: `${familySize.toFixed(1)}`,
      suffix: ' members',
      valueCaption: 'per household',
      subtext: getDemographicsKpiSentence('familySize', familySize),
      delta: getYearDelta(familySize2024, familySize2025, compareYears),
    },
    {
      label: 'Largest Age Group',
      icon: 'community',
      value: topAge ? `${topAge.name} —` : '—',
      suffix: topAge ? `${topAge.value.toFixed(1)}%` : undefined,
      valueCaption: topAge ? 'in this age group' : undefined,
      subtext: topAge
        ? getDemographicsKpiSentence('ageGroup', topAge.value)
        : 'No age group data available.',
      delta: topAge ? getYearDelta(topAge.value2024, topAge.value2025, compareYears) : undefined,
    },
    {
      label: 'Highest-Represented Education Level',
      icon: 'education',
      value: topEducation ? `${topEducation.name} —` : '—',
      suffix: topEducation ? `${topEducation.value.toFixed(1)}%` : undefined,
      valueCaption: topEducation ? 'hold this qualification' : undefined,
      subtext: topEducation
        ? getDemographicsKpiSentence('education', topEducation.value)
        : 'No education level data available.',
      delta: topEducation ? getYearDelta(topEducation.value2024, topEducation.value2025, compareYears) : undefined,
    },
    {
      label: 'Avg Number of Working Family Members',
      icon: 'briefcase',
      value: `${workingMembers.toFixed(1)}`,
      suffix: ' members',
      valueCaption: 'per household',
      subtext: getDemographicsKpiSentence('workingMembers', workingMembers),
      delta: getYearDelta(workingMembers2024, workingMembers2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  if (!score) return [];
  const scoreDelta = getYearDelta(score.score2024, score.score2025, compareYears);
  const positiveDelta = getYearDelta(score.positive2024, score.positive2025, compareYears);
  const negativeDelta = getYearDelta(score.negative2024, score.negative2025, compareYears);
  if (mode === 'current') {
    const sectionScore = pickYearValue(score.score2024, score.score2025, year);
    const positiveSentiment = pickYearValue(score.positive2024, score.positive2025, year);
    const negativeSentiment = pickYearValue(score.negative2024, score.negative2025, year);
    const comparisonScore = year === compareYears[1] ? pickYearValue(score.score2024, score.score2025, compareYears[0]) : pickYearValue(score.score2024, score.score2025, compareYears[1]);
    return finalizeKpiCards(
      [
        { label: 'Section Score', value: `${sectionScore}`, suffix: '%', delta: scoreDelta },
        { label: 'Positive Sentiment', value: `${positiveSentiment}`, suffix: '%', delta: positiveDelta },
        { label: 'Negative Sentiment', value: `${negativeSentiment}`, suffix: '%', delta: negativeDelta },
        { label: year === compareYears[1] ? `${compareYears[0]} Baseline` : `${compareYears[1]} Score`, value: `${comparisonScore}`, suffix: '%' },
        { label: 'Top Partner', value: score.sectionNameEn, subtext: 'Current pillar', delta: scoreDelta },
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
    { label: 'Score Change', value: formatDelta(scoreDelta) },
    { label: 'Positive Δ', value: formatDelta(positiveDelta) },
    { label: 'Negative Δ', value: formatDelta(negativeDelta) },
    { label: `${compareYears[0]} Score`, value: `${pickYearValue(score.score2024, score.score2025, compareYears[0])}`, suffix: '%' },
    { label: `${compareYears[1]} Score`, value: `${pickYearValue(score.score2024, score.score2025, compareYears[1])}`, suffix: '%', delta: scoreDelta },
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const avgIncome2024 = getAverageMonthlyIncome(data, compareYears[0]);
  const avgIncome2025 = getAverageMonthlyIncome(data, compareYears[1]);
  const avgIncome = pickYearValue(avgIncome2024, avgIncome2025, year);
  const topExpense = getTopMultiSelectCategory(section.questions, 'Q102', year);
  const topDebt = getTopMultiSelectCategory(section.questions, 'Q103', year, INCOME_DEBT_EXCLUSIONS);

  const expenseDelta = topExpense ? getYearDelta(topExpense.value2024, topExpense.value2025, compareYears) : 0;
  const debtDelta = topDebt ? getYearDelta(topDebt.value2024, topDebt.value2025, compareYears) : 0;
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
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Avg Monthly Income',
      icon: 'money-bill',
      value: formatAverageIncome(avgIncome),
      valueCaption: 'per month',
      subtext: getIncomeKpiSentence('income', avgIncome),
      delta: incomePctChange,
    },
    {
      label: 'Top Living Expense',
      icon: 'receipt',
      value: topExpense
        ? `${getKpiCategoryShortLabel(topExpense.categoryEn, topExpense.name)} —`
        : '—',
      suffix: topExpense ? `${topExpense.value.toFixed(1)}%` : undefined,
      valueCaption: topExpense ? 'report this expense' : undefined,
      subtext: getIncomeKpiSentence(
        'expense',
        topExpense?.value ?? 0,
        topExpense?.categoryEn,
      ),
      delta: topExpense ? expenseDelta : undefined,
    },
    {
      label: 'Top Debt Obligation',
      icon: 'credit-card',
      value: topDebt
        ? `${getKpiCategoryShortLabel(topDebt.categoryEn, topDebt.name)} —`
        : '—',
      suffix: topDebt ? `${topDebt.value.toFixed(1)}%` : undefined,
      valueCaption: topDebt ? 'report this debt' : undefined,
      subtext: getIncomeKpiSentence('debt', topDebt?.value ?? 0, topDebt?.categoryEn),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const avgHours2024 = getAverageWeeklyHours(questions, compareYears[0]);
  const avgHours2025 = getAverageWeeklyHours(questions, compareYears[1]);
  const avgHours = pickYearValue(avgHours2024, avgHours2025, year);
  const balance2024 = getWorkLifeBalancePercent(questions, compareYears[0]);
  const balance2025 = getWorkLifeBalancePercent(questions, compareYears[1]);
  const balance = pickYearValue(balance2024, balance2025, year);
  const assistance2024 = getGovernmentAssistancePercent(questions, compareYears[0]);
  const assistance2025 = getGovernmentAssistancePercent(questions, compareYears[1]);
  const assistance = pickYearValue(assistance2024, assistance2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Employment Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getWorkKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Avg Weekly Working Hours',
      icon: 'clock',
      value: `${avgHours.toFixed(1)}`,
      suffix: ' hrs',
      valueCaption: 'per week',
      subtext: getWorkKpiSentence('hours', avgHours),
      delta: getYearDelta(avgHours2024, avgHours2025, compareYears),
    },
    {
      label: 'Work-Life Balance Security',
      icon: 'shield',
      value: `${balance.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel secure',
      subtext: getWorkKpiSentence('balance', balance),
      delta: getYearDelta(balance2024, balance2025, compareYears),
    },
    {
      label: 'Government Assistance Recipients',
      icon: 'government-building',
      value: `${assistance.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'receive assistance',
      subtext: getWorkKpiSentence('assistance', assistance),
      delta: getYearDelta(assistance2024, assistance2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const safety2024 = getEducationChildSafetyPercent(questions, compareYears[0]);
  const safety2025 = getEducationChildSafetyPercent(questions, compareYears[1]);
  const safety = pickYearValue(safety2024, safety2025, year);
  const lifeSkills2024 = getEducationLifeSkillsPercent(questions, compareYears[0]);
  const lifeSkills2025 = getEducationLifeSkillsPercent(questions, compareYears[1]);
  const lifeSkills = pickYearValue(lifeSkills2024, lifeSkills2025, year);
  const university2024 = getEducationUniversitySatisfactionPercent(questions, compareYears[0]);
  const university2025 = getEducationUniversitySatisfactionPercent(questions, compareYears[1]);
  const university = pickYearValue(university2024, university2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Education Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEducationKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Kids\' Physical Safety at School',
      icon: 'shield',
      value: `${safety.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel kids are safe',
      subtext: getEducationKpiSentence('safety', safety),
      delta: getYearDelta(safety2024, safety2025, compareYears),
    },
    {
      label: 'Life Skills & Creativity',
      icon: 'spark',
      value: `${lifeSkills.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'value life skills',
      subtext: getEducationKpiSentence('lifeSkills', lifeSkills),
      delta: getYearDelta(lifeSkills2024, lifeSkills2025, compareYears),
    },
    {
      label: 'University Education Satisfaction',
      icon: 'education',
      value: `${university.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEducationKpiSentence('university', university),
      delta: getYearDelta(university2024, university2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const movingSafe2024 = getSecurityMovingSafePercent(questions, compareYears[0]);
  const movingSafe2025 = getSecurityMovingSafePercent(questions, compareYears[1]);
  const movingSafe = pickYearValue(movingSafe2024, movingSafe2025, year);
  const policeTrust2024 = getSecurityPoliceTrustPercent(questions, compareYears[0]);
  const policeTrust2025 = getSecurityPoliceTrustPercent(questions, compareYears[1]);
  const policeTrust = pickYearValue(policeTrust2024, policeTrust2025, year);
  const jobSecurity2024 = getSecurityJobSecurityPercent(questions, compareYears[0]);
  const jobSecurity2025 = getSecurityJobSecurityPercent(questions, compareYears[1]);
  const jobSecurity = pickYearValue(jobSecurity2024, jobSecurity2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Security & Safety Overall Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getSecurityKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Safe Moving Around Day & Night',
      icon: 'shield',
      value: `${movingSafe.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel safe',
      subtext: getSecurityKpiSentence('movingSafe', movingSafe),
      delta: getYearDelta(movingSafe2024, movingSafe2025, compareYears),
    },
    {
      label: 'Trust in Abu Dhabi Police',
      icon: 'police-building',
      value: `${policeTrust.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'trust police ability',
      subtext: getSecurityKpiSentence('policeTrust', policeTrust),
      delta: getYearDelta(policeTrust2024, policeTrust2025, compareYears),
    },
    {
      label: 'Job Security in Abu Dhabi',
      icon: 'briefcase',
      value: `${jobSecurity.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'feel job security',
      subtext: getSecurityKpiSentence('jobSecurity', jobSecurity),
      delta: getYearDelta(jobSecurity2024, jobSecurity2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const currentHealth2024 = getHealthCurrentHealthGoodPercent(questions, compareYears[0]);
  const currentHealth2025 = getHealthCurrentHealthGoodPercent(questions, compareYears[1]);
  const currentHealth = pickYearValue(currentHealth2024, currentHealth2025, year);
  const activity2024 = getHealthPhysicalActivityHours(questions, compareYears[0]);
  const activity2025 = getHealthPhysicalActivityHours(questions, compareYears[1]);
  const activity = pickYearValue(activity2024, activity2025, year);
  const sleep2024 = getHealthSleepQualityGoodPercent(questions, compareYears[0]);
  const sleep2025 = getHealthSleepQualityGoodPercent(questions, compareYears[1]);
  const sleep = pickYearValue(sleep2024, sleep2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Health Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getHealthKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Current Health Rated Good',
      icon: 'health',
      value: `${currentHealth.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'rate health as good',
      subtext: getHealthKpiSentence('currentHealth', currentHealth),
      delta: getYearDelta(currentHealth2024, currentHealth2025, compareYears),
    },
    {
      label: 'Avg Daily Physical Activity',
      icon: 'running',
      value: `${activity.toFixed(1)}`,
      suffix: ' hrs',
      valueCaption: 'per day',
      subtext: getHealthKpiSentence('activity', activity),
      delta: getYearDelta(activity2024, activity2025, compareYears),
    },
    {
      label: 'Sleep Quality Rated Good',
      icon: 'sleep',
      value: `${sleep.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'rate sleep as good',
      subtext: getHealthKpiSentence('sleep', sleep),
      delta: getYearDelta(sleep2024, sleep2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const cleanliness2024 = getEnvironmentCleanlinessPercent(questions, compareYears[0]);
  const cleanliness2025 = getEnvironmentCleanlinessPercent(questions, compareYears[1]);
  const cleanliness = pickYearValue(cleanliness2024, cleanliness2025, year);
  const airQuality2024 = getEnvironmentAirQualityPercent(questions, compareYears[0]);
  const airQuality2025 = getEnvironmentAirQualityPercent(questions, compareYears[1]);
  const airQuality = pickYearValue(airQuality2024, airQuality2025, year);
  const noiseLevel2024 = getEnvironmentNoiseLevelPercent(questions, compareYears[0]);
  const noiseLevel2025 = getEnvironmentNoiseLevelPercent(questions, compareYears[1]);
  const noiseLevel = pickYearValue(noiseLevel2024, noiseLevel2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Environment Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Neighborhood Cleanliness Satisfaction',
      icon: 'spark',
      value: `${cleanliness.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('cleanliness', cleanliness),
      delta: getYearDelta(cleanliness2024, cleanliness2025, compareYears),
    },
    {
      label: 'Satisfaction with Air Quality',
      icon: 'wind',
      value: `${airQuality.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('airQuality', airQuality),
      delta: getYearDelta(airQuality2024, airQuality2025, compareYears),
    },
    {
      label: 'Satisfaction with Neighborhood Noise Level',
      icon: 'noise',
      value: `${noiseLevel.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getEnvironmentKpiSentence('noiseLevel', noiseLevel),
      delta: getYearDelta(noiseLevel2024, noiseLevel2025, compareYears),
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
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const waterElectricity2024 = getInfrastructureWaterElectricityPercent(questions, compareYears[0]);
  const waterElectricity2025 = getInfrastructureWaterElectricityPercent(questions, compareYears[1]);
  const waterElectricity = pickYearValue(waterElectricity2024, waterElectricity2025, year);
  const gasStations2024 = getInfrastructureGasStationsPercent(questions, compareYears[0]);
  const gasStations2025 = getInfrastructureGasStationsPercent(questions, compareYears[1]);
  const gasStations = pickYearValue(gasStations2024, gasStations2025, year);
  const shopping2024 = getInfrastructureShoppingPercent(questions, compareYears[0]);
  const shopping2025 = getInfrastructureShoppingPercent(questions, compareYears[1]);
  const shopping = pickYearValue(shopping2024, shopping2025, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Infrastructure Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Water and Electricity Services Satisfaction',
      icon: 'utilities',
      value: `${waterElectricity.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('waterElectricity', waterElectricity),
      delta: getYearDelta(waterElectricity2024, waterElectricity2025, compareYears),
    },
    {
      label: 'Satisfaction on Gas Stations Availability',
      icon: 'gas-station',
      value: `${gasStations.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('gasStations', gasStations),
      delta: getYearDelta(gasStations2024, gasStations2025, compareYears),
    },
    {
      label: 'Shops & Shopping Centers Satisfaction',
      icon: 'shopping-bag',
      value: `${shopping.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getInfrastructureKpiSentence('shopping', shopping),
      delta: getYearDelta(shopping2024, shopping2025, compareYears),
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getPercentTone(waterElectricity),
    getPercentTone(gasStations),
    getPercentTone(shopping),
  ]);
}

function getHousingSpaceTone(sentiment: HousingDominantSentiment): 'positive' | 'negative' {
  if (sentiment.displayLabel === 'Adequate') return 'positive';
  if (sentiment.displayLabel === 'Inadequate') return 'negative';
  return 'negative';
}

function getHousingMaintenanceTone(sentiment: HousingDominantSentiment): 'positive' | 'negative' {
  if (sentiment.displayLabel === 'Well maintained') return 'positive';
  if (sentiment.displayLabel === 'Needs maintenance') return 'negative';
  return 'negative';
}

function getHousingHomeownershipTone(sentiment: HousingDominantSentiment): 'positive' | 'negative' {
  if (sentiment.displayLabel === 'Planning to own') return 'positive';
  if (sentiment.displayLabel === 'Not planning') return 'negative';
  return 'negative';
}

function getHousingSpaceValueCaption(sentiment: HousingDominantSentiment): string {
  if (sentiment.displayLabel === 'Adequate') return 'thinks space is adequate';
  if (sentiment.displayLabel === 'Inadequate') return 'think space is inadequate';
  return 'have mixed views on space';
}

function getHousingMaintenanceValueCaption(sentiment: HousingDominantSentiment): string {
  if (sentiment.displayLabel === 'Needs maintenance') return 'need maintenance';
  if (sentiment.displayLabel === 'Well maintained') return 'feel home is well maintained';
  return 'have mixed views on maintenance';
}

function getHousingHomeownershipValueCaption(sentiment: HousingDominantSentiment): string {
  if (sentiment.displayLabel === 'Not planning') return 'are not planning';
  if (sentiment.displayLabel === 'Planning to own') return 'are planning to own';
  return 'are undecided';
}

export function buildHousingKpis(
  section: Section,
  mode: ViewMode,
  year: SurveyYear = '2025',
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): KpiItem[] {
  const score = section.score;
  if (!score) return [];

  const questions = section.questions;
  const sectionScore = pickYearValue(score.score2024, score.score2025, year);
  const space = getHousingSpaceAdequacySentiment(questions, year);
  const maintenance = getHousingMaintenanceSentiment(questions, year);
  const homeownership = getHousingHomeownershipSentiment(questions, year);

  const cards: KpiItem[] = [
    {
      label: 'Overall Housing Satisfaction',
      icon: 'satisfaction',
      value: `${sectionScore.toFixed(1)}`,
      suffix: '%',
      valueCaption: 'are satisfied',
      subtext: getHousingKpiSentence('score', sectionScore),
      delta: getYearDelta(score.score2024, score.score2025, compareYears),
    },
    {
      label: 'Housing Space Adequacy',
      icon: 'house',
      value: `${space.value.toFixed(1)}`,
      suffix: '%',
      valueCaption: getHousingSpaceValueCaption(space),
      subtext: getHousingKpiSentence('spaceAdequacy', space),
      delta: getHousingDominantSentimentDelta(
        questions,
        HOUSING_KPI_STATEMENT.spaceAdequacy,
        HOUSING_SPACE_ADEQUACY_LABELS,
        compareYears,
      ),
    },
    {
      label: 'Housing Maintenance Needs',
      icon: 'repair',
      value: `${maintenance.value.toFixed(1)}`,
      suffix: '%',
      valueCaption: getHousingMaintenanceValueCaption(maintenance),
      subtext: getHousingKpiSentence('maintenance', maintenance),
      delta: getHousingDominantSentimentDelta(
        questions,
        HOUSING_KPI_STATEMENT.maintenance,
        HOUSING_MAINTENANCE_LABELS,
        compareYears,
      ),
    },
    {
      label: 'Homeownership Intention',
      icon: 'home-purchase',
      value: `${homeownership.value.toFixed(1)}`,
      suffix: '%',
      valueCaption: getHousingHomeownershipValueCaption(homeownership),
      subtext: getHousingKpiSentence('homeownership', homeownership),
      delta: getHousingDominantSentimentDelta(
        questions,
        HOUSING_KPI_STATEMENT.homeownership,
        HOUSING_HOMEOWNERSHIP_LABELS,
        compareYears,
      ),
    },
  ];

  return finalizeKpiCards(cards, mode, [
    getPercentTone(sectionScore),
    getHousingSpaceTone(space),
    getHousingMaintenanceTone(maintenance),
    getHousingHomeownershipTone(homeownership),
  ]);
}
