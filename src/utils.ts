import type { SectionScore, ViewMode } from './types';
import { translateLabel } from './translations';

export function formatDelta(value: number, suffix = 'pp'): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix === 'pp' ? '' : ''}${suffix === 'pp' ? ' pp' : suffix === '%' ? '%' : ''}`;
}

export function getScoreValue(score: SectionScore, mode: ViewMode): number {
  return mode === 'current' ? score.score2025 : score.yoyChange;
}

export function getPositiveValue(score: SectionScore, mode: ViewMode): number {
  return mode === 'current' ? score.positive2025 : score.positive2025 - score.positive2024;
}

export function getNegativeValue(score: SectionScore, mode: ViewMode): number {
  return mode === 'current' ? score.negative2025 : score.negative2025 - score.negative2024;
}

export function isLikert(q: { type: string }): q is import('./types').LikertQuestion {
  return q.type === 'likert' || q.type === 'rating';
}

export function isCategory(q: { type: string }): q is import('./types').CategoryQuestion {
  return q.type === 'categorical' || q.type === 'multi_select';
}

export function isMean(q: { type: string }): q is import('./types').MeanQuestion {
  return q.type === 'mean';
}

export function getLikertStatements(questions: import('./types').Question[]) {
  const seen = new Set<string>();
  return questions.filter(isLikert).filter((q) => {
    if (seen.has(q.statementAr)) return false;
    seen.add(q.statementAr);
    return true;
  });
}

export function getCategoryByQuestion(questions: import('./types').Question[], code: string) {
  return questions.filter(isCategory).filter((q) => q.code === code);
}

export function getTopCategories(
  items: import('./types').CategoryQuestion[],
  mode: ViewMode,
  limit = 8,
) {
  return items
    .map((q) => ({
      name: translateLabel(q.categoryEn ?? q.categoryAr),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
      value: mode === 'current' ? (q.data['2025'] ?? 0) : (q.data['2025'] ?? 0) - (q.data['2024'] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, limit);
}

export function generateInsights(
  tabId: string,
  data: import('./types').SurveyData,
): string[] {
  const { overview, sectionScores } = data;

  if (tabId === 'overview') {
    return [
      `Overall resident satisfaction in Al Falah improved from ${overview.overallScore2024}% to ${overview.overallScore2025}% (${formatDelta(overview.overallYoyChange)}).`,
      `${overview.bestImproved.section} showed the strongest improvement at ${formatDelta(overview.bestImproved.change)}.`,
      `${overview.mostDeclined.section} requires attention with a change of ${formatDelta(overview.mostDeclined.change)}.`,
      `Highest performing pillar is ${overview.highestScore.section} at ${overview.highestScore.score}%, while ${overview.lowestScore.section} has the lowest score at ${overview.lowestScore.score}%.`,
    ];
  }

  if (tabId === 'demographics') {
    const section = data.sections.demographics;
    if (!section) return ['Demographic profile data for Al Falah district residents.'];
    return [
      'Demographics provides the resident profile breakdown — gender, nationality, age, and household composition.',
      'Use this tab to understand who lives in Al Falah and how the population mix changed between 2024 and 2025.',
      'Compare categorical distributions and household metrics to align services with the district\'s resident base.',
    ];
  }

  const section = sectionScores[tabId];
  if (!section) return ['No insights available for this section.'];

  const direction = section.yoyChange >= 0 ? 'improved' : 'declined';
  return [
    `${section.sectionNameEn} satisfaction ${direction} from ${section.score2024}% to ${section.score2025}% (${formatDelta(section.yoyChange)}).`,
    `Positive sentiment is at ${section.positive2025}%, while negative sentiment stands at ${section.negative2025}%.`,
    section.yoyChange >= 0
      ? 'Residents report progress in this area — continue current initiatives.'
      : 'This pillar shows declining satisfaction — targeted interventions are recommended.',
  ];
}
