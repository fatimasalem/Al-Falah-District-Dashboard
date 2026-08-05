import type { ViewMode, CategoryQuestion, MeanQuestion } from '../types';
import { KPI_GRADIENTS } from '../types';
import { formatDelta, isCategory, isMean } from '../utils';

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
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="kpi-row">
      {items.slice(0, 5).map((item, i) => (
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
          {item.delta !== undefined && (
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

export function buildOverviewKpis(
  overview: import('../types').SurveyData['overview'],
  mode: ViewMode,
): KpiItem[] {
  if (mode === 'current') {
    return [
      {
        label: 'Overall Satisfaction',
        value: `${overview.overallScore2025}`,
        suffix: '%',
        delta: overview.overallYoyChange,
      },
      {
        label: 'Highest Pillar',
        value: overview.highestScore.section,
        subtext: `${overview.highestScore.score}% score`,
        delta: overview.highestScore.score,
        deltaLabel: 'score',
      },
      {
        label: 'Lowest Pillar',
        value: overview.lowestScore.section,
        subtext: `${overview.lowestScore.score}% score`,
      },
      {
        label: 'Best Improved',
        value: overview.bestImproved.section,
        delta: overview.bestImproved.change,
      },
      {
        label: 'Needs Attention',
        value: overview.mostDeclined.section,
        delta: overview.mostDeclined.change,
      },
    ];
  }
  return [
    { label: 'Overall Change', value: formatDelta(overview.overallYoyChange), suffix: ' pp' },
    { label: 'Best Improved', value: overview.bestImproved.section, delta: overview.bestImproved.change },
    { label: 'Most Declined', value: overview.mostDeclined.section, delta: overview.mostDeclined.change },
    { label: '2024 Baseline', value: `${overview.overallScore2024}`, suffix: '%' },
    { label: '2025 Current', value: `${overview.overallScore2025}`, suffix: '%', delta: overview.overallYoyChange },
  ];
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
