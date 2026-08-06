import type { ViewMode, CategoryQuestion, MeanQuestion, SurveyData } from '../types';
import { KPI_GRADIENTS } from '../types';
import {
  formatDelta,
  isCategory,
  isMean,
  getIncomeComfortPercent,
  getEmploymentPercent,
  getSafetyPercent,
  getOverviewKpiSentence,
} from '../utils';

export interface KpiItem {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  subtext?: string;
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
          <div className="kpi-label">{item.label}</div>
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

export function buildOverviewKpis(data: SurveyData, mode: ViewMode): KpiItem[] {
  const { overview } = data;
  const satisfaction = overview.overallScore2025;
  const incomeComfort = getIncomeComfortPercent(data, '2025');
  const employment = getEmploymentPercent(data, '2025');
  const safety = getSafetyPercent(data, '2025');

  const cards: KpiItem[] = [
    {
      label: 'Overall Satisfaction',
      value: `${satisfaction.toFixed(1)}`,
      suffix: '%',
      subtext: getOverviewKpiSentence('satisfaction', satisfaction),
      delta: overview.overallYoyChange,
    },
    {
      label: 'Income Comfort',
      value: `${incomeComfort.toFixed(1)}`,
      suffix: '%',
      subtext: getOverviewKpiSentence('income', incomeComfort),
      delta: incomeComfort - getIncomeComfortPercent(data, '2024'),
    },
    {
      label: 'Employment',
      value: `${employment.toFixed(1)}`,
      suffix: '%',
      subtext: getOverviewKpiSentence('employment', employment),
      delta: employment - getEmploymentPercent(data, '2024'),
    },
    {
      label: 'Safety',
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
): KpiItem[] {
  const catValue = (code: string, category: string): number => {
    const q = section.questions.find(
      (item): item is CategoryQuestion =>
        isCategory(item) && item.code === code && item.categoryAr === category,
    );
    if (!q) return 0;
    const v2025 = q.data['2025'] ?? 0;
    const v2024 = q.data['2024'] ?? 0;
    return mode === 'current' ? v2025 : v2025 - v2024;
  };

  const meanValue = (code: string): number => {
    const q = section.questions.find(
      (item): item is MeanQuestion =>
        isMean(item) && item.code === code && item.dimensionAr === 'الإجمالي',
    );
    if (!q) return 0;
    const v2025 = q.data['2025'] ?? 0;
    const v2024 = q.data['2024'] ?? 0;
    return mode === 'current' ? v2025 : v2025 - v2024;
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
): KpiItem[] {
  if (!score) return [];
  if (mode === 'current') {
    return [
      { label: 'Section Score', value: `${score.score2025}`, suffix: '%', delta: score.yoyChange },
      { label: 'Positive Sentiment', value: `${score.positive2025}`, suffix: '%', delta: score.positive2025 - score.positive2024 },
      { label: 'Negative Sentiment', value: `${score.negative2025}`, suffix: '%', delta: score.negative2025 - score.negative2024 },
      { label: '2024 Baseline', value: `${score.score2024}`, suffix: '%' },
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
