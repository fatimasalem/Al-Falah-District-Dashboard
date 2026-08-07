import type { ReactElement } from 'react';
import type { ViewMode, CategoryQuestion, MeanQuestion, SurveyData, SurveyYear } from '../types';
import { KPI_GRADIENTS } from '../types';
import {
  formatDelta,
  isCategory,
  isMean,
  getIncomeComfortPercent,
  getEmploymentPercent,
  getSafetyPercent,
  getOverviewKpiSentence,
  pickYearValue,
} from '../utils';

export type KpiIconName = 'satisfaction' | 'wallet' | 'briefcase' | 'shield';

export interface KpiItem {
  label: string;
  value: string;
  icon?: KpiIconName;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  subtext?: string;
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
            {item.value}
            {item.suffix && <span className="kpi-suffix">{item.suffix}</span>}
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
      subtext: getOverviewKpiSentence('satisfaction', satisfaction),
      delta: overview.overallYoyChange,
    },
    {
      label: 'Income Comfort',
      icon: 'wallet',
      value: `${incomeComfort.toFixed(1)}`,
      suffix: '%',
      subtext: getOverviewKpiSentence('income', incomeComfort),
      delta: incomeComfort - getIncomeComfortPercent(data, '2024'),
    },
    {
      label: 'Employment',
      icon: 'briefcase',
      value: `${employment.toFixed(1)}`,
      suffix: '%',
      subtext: getOverviewKpiSentence('employment', employment),
      delta: employment - getEmploymentPercent(data, '2024'),
    },
    {
      label: 'Safety',
      icon: 'shield',
      value: `${safety.toFixed(1)}`,
      suffix: '%',
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
    { label: 'Male Δ', value: formatDelta(catValue('Q902', 'ذكر')), suffix: ' pp' },
    { label: 'Female Δ', value: formatDelta(catValue('Q902', 'أنثى')), suffix: ' pp' },
    { label: 'Emirati Δ', value: formatDelta(catValue('Q905', 'إماراتي')), suffix: ' pp' },
    { label: 'Non-Emirati Δ', value: formatDelta(catValue('Q905', 'غير إماراتي')), suffix: ' pp' },
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
    { label: 'Score Change', value: formatDelta(score.yoyChange), suffix: ' pp' },
    { label: 'Positive Δ', value: formatDelta(score.positive2025 - score.positive2024), suffix: ' pp' },
    { label: 'Negative Δ', value: formatDelta(score.negative2025 - score.negative2024), suffix: ' pp' },
    { label: '2024 Score', value: `${score.score2024}`, suffix: '%' },
    { label: '2025 Score', value: `${score.score2025}`, suffix: '%', delta: score.yoyChange },
  ];
}
