import type { SectionScore, SurveyData, ViewMode } from './types';
import { translateLabel } from './translations';

const INCOME_COMFORT_CATEGORIES = [
  'We live very comfortably on current income',
  'We live comfortably on current income',
];

const STATEMENT_COMPACT_MAX_CHARS = 46;
const AXIS_LABEL_MAX_LINES = 2;
const AXIS_LABEL_MAX_CHARS = 21;

function wrapAxisLabel(text: string, maxChars = AXIS_LABEL_MAX_CHARS): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function compactStatementLabel(text: string): string {
  let label = text.trim().replace(/\.$/, '');

  const prefixPatterns = [
    /^In general,\s*I am satisfied with the\s+/i,
    /^In general,\s*I am satisfied with\s+/i,
    /^Satisfied with the\s+/i,
    /^Satisfied with\s+/i,
    /^I am satisfied with the\s+/i,
    /^I am satisfied with\s+/i,
  ];
  for (const pattern of prefixPatterns) {
    label = label.replace(pattern, '');
  }

  const phraseReplacements: [RegExp, string][] = [
    [/financial costs of (public|private) school education/gi, 'cost of $1 school'],
    [/financial costs of university education/gi, 'university cost'],
    [/quality of school education/gi, 'school quality'],
    [/ease of attending school education/gi, 'school access'],
    [/ease of enrolling in university education/gi, 'university enrollment'],
    [/proximity of the educational facility \(schools and universities\) to the residence/gi, 'schools & universities proximity to home'],
    [/government school education system/gi, 'government school education'],
    [/private school education system/gi, 'private school education'],
    [/public school education/gi, 'public school'],
    [/private school education/gi, 'private school'],
    [/university education system/gi, 'university education'],
    [/university education/gi, 'university'],
    [/school education/gi, 'schooling'],
    [/education system/gi, 'education'],
    [/cleanliness of the neighborhood/gi, 'neighborhood cleanliness'],
    [/cleanliness of public facilities and their compliance with health requirements/gi, 'public facility hygiene standards'],
    [/urban planning of the city \(planning of residential areas, streets, parking lots, sidewalks, entrances and exits to the areas\)/gi, 'Urban planning: streets, parking, sidewalks'],
    [/architectural \(aesthetic\) character of buildings, residential neighborhoods, market facades and shops/gi, 'architectural character (buildings, shops)'],
    [/quality of service facilities, such as gardens, parks, and public facilities/gi, 'parks & public facility quality'],
    [/quality of internal road services such as sidewalks, street lighting, parking lots, and walkways/gi, 'road services (sidewalks, lighting, parking)'],
    [/in my residential area/gi, 'in area'],
    [/in a residential area/gi, 'in area'],
    [/in the emirate/gi, 'in emirate'],
    [/to the residence/gi, 'to home'],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    label = label.replace(pattern, replacement);
  }

  label = label.replace(/\s+/g, ' ').trim();
  label = label.charAt(0).toUpperCase() + label.slice(1);

  if (label.length <= STATEMENT_COMPACT_MAX_CHARS) return label;

  const removableWords = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for', 'with']);
  let words = label.split(' ');
  while (words.join(' ').length > STATEMENT_COMPACT_MAX_CHARS && words.length > 4) {
    const removableIndex = words.findIndex(
      (word, index) => index > 0 && index < words.length - 1 && removableWords.has(word.toLowerCase()),
    );
    if (removableIndex === -1) break;
    words.splice(removableIndex, 1);
  }

  return words.join(' ');
}

function fitAxisLabel(label: string): string {
  let result = label;
  const tightenings = [
    (value: string) => value.replace(/: streets, parking, sidewalks/g, ': streets & parking'),
    (value: string) => value.replace(/ \(buildings, shops\)/g, ' (buildings)'),
    (value: string) => value.replace(/ standards /g, ' '),
    (value: string) => value.replace(/ character /g, ' '),
    (value: string) => value.replace(/ facility hygiene /g, ' hygiene '),
    (value: string) => value.replace(/ neighborhood cleanliness /g, ' area cleanliness '),
    (value: string) => value.replace(/ \(sidewalks, lighting, parking\)/g, ' (roads & parking)'),
  ];

  for (const tighten of tightenings) {
    if (wrapAxisLabel(result).length <= AXIS_LABEL_MAX_LINES) return result;
    const next = tighten(result);
    if (next !== result) result = next;
  }

  const removableWords = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for', 'with']);
  let words = result.split(' ');
  while (wrapAxisLabel(words.join(' ')).length > AXIS_LABEL_MAX_LINES && words.length > 3) {
    const removableIndex = words.findIndex(
      (word, index) => index > 0 && index < words.length - 1 && removableWords.has(word.toLowerCase()),
    );
    if (removableIndex === -1) break;
    words.splice(removableIndex, 1);
  }

  return words.join(' ');
}

export function formatStatementAxisLabel(text: string): string {
  return fitAxisLabel(compactStatementLabel(text));
}

export function getIncomeComfortPercent(data: SurveyData, year: '2024' | '2025'): number {
  const questions = data.sections.income?.questions ?? [];
  return questions
    .filter(isCategory)
    .filter((q) => q.code === 'Q101' && INCOME_COMFORT_CATEGORIES.includes(q.categoryEn ?? ''))
    .reduce((sum, q) => sum + (q.data[year] ?? 0), 0);
}

export function getEmploymentPercent(data: SurveyData, year: '2024' | '2025'): number {
  const questions = data.sections.work?.questions ?? [];
  const employed = questions
    .filter(isCategory)
    .find((q) => q.code === 'Q201' && q.categoryEn === 'Employed');
  return employed?.data[year] ?? 0;
}

export function getSafetyPercent(data: SurveyData, year: '2024' | '2025'): number {
  const score = data.sectionScores.security;
  return year === '2025' ? score.score2025 : score.score2024;
}

export function getOverviewKpiSentence(
  metric: 'satisfaction' | 'income' | 'employment' | 'safety',
  value: number,
): string {
  switch (metric) {
    case 'satisfaction':
      return value >= 70
        ? 'Residents indicate they are satisfied with life in Al Falah.'
        : value >= 50
          ? 'Residents report a moderate level of overall satisfaction.'
          : 'Overall satisfaction is below target — improvement is needed.';
    case 'income':
      return value >= 50
        ? 'A majority of residents feel comfortable with their household income.'
        : value >= 30
          ? 'A notable share of residents feel comfortable with their income.'
          : 'Many residents do not feel comfortable with their current income.';
    case 'employment':
      return value >= 20
        ? 'Employment levels show active workforce participation in the district.'
        : 'Employment participation remains limited across the resident population.';
    case 'safety':
      return value >= 70
        ? 'Residents feel secure and safe within their community.'
        : value >= 50
          ? 'Residents report a moderate sense of safety in the district.'
          : 'Safety concerns are elevated among residents.';
  }
}

export function getLikertBreakdownValues(
  breakdown: Record<string, number>,
): { dissatisfied: number; neutral: number; satisfied: number; na: number } {
  return {
    dissatisfied:
      (breakdown['غير موافق إطلاقاً'] ?? 0) + (breakdown['غير موافق'] ?? 0),
    neutral: breakdown['محايد'] ?? 0,
    satisfied: (breakdown['موافق'] ?? 0) + (breakdown['موافق بشدة'] ?? 0),
    na: breakdown['لا ينطبق'] ?? 0,
  };
}

export function getEducationChartData(section: import('./types').Section, year: '2024' | '2025') {
  const seen = new Set<string>();
  return section.questions
    .filter(isLikert)
    .filter((q) => {
      if (seen.has(q.statementAr)) return false;
      seen.add(q.statementAr);
      return true;
    })
    .slice(0, 5)
    .map((q) => {
      const breakdown = q.data[year]?.breakdown ?? {};
      const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
      const fullName = q.statementEn ?? q.statementAr;
      return {
        name: formatStatementAxisLabel(fullName),
        fullName,
        dissatisfied: -dissatisfied,
        neutral,
        satisfied,
      };
    });
}

export function getEnvironmentChartData(section: import('./types').Section, year: '2024' | '2025') {
  const seen = new Set<string>();
  return section.questions
    .filter(isLikert)
    .filter((q) => {
      if (seen.has(q.statementAr)) return false;
      seen.add(q.statementAr);
      return true;
    })
    .slice(0, 5)
    .map((q) => {
      const breakdown = q.data[year]?.breakdown ?? {};
      const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
      const total = dissatisfied + neutral + satisfied;
      const scale = total > 0 ? 100 / total : 0;
      const fullName = q.statementEn ?? q.statementAr;
      return {
        name: formatStatementAxisLabel(fullName),
        fullName,
        dissatisfied: dissatisfied * scale,
        neutral: neutral * scale,
        satisfied: satisfied * scale,
      };
    });
}

export type InsightPart = string | { bold: string };

export function generatePartnerChartInsight(
  data: { name: string; fullName?: string; value: number }[],
  mode: ViewMode,
): InsightPart[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  if (!top) return ['Pillar scores summarize resident satisfaction across the district.'];
  if (mode === 'yoy') {
    return [
      { bold: top.fullName ?? top.name },
      ' leads gains at ',
      { bold: formatDelta(top.value) },
      ' across ',
      { bold: String(sorted.length) },
      ' pillars.',
    ];
  }
  return [
    { bold: top.fullName ?? top.name },
    ' leads at ',
    { bold: `${top.value.toFixed(1)}%` },
    ' across ',
    { bold: String(sorted.length) },
    ' pillars.',
  ];
}

export function generateEducationChartInsight(
  data: { fullName: string; satisfied: number }[],
): InsightPart[] {
  if (data.length === 0) return ['Education satisfaction varies across resident survey statements.'];
  const best = [...data].sort((a, b) => b.satisfied - a.satisfied)[0];
  return [
    { bold: 'Strongest agreement' },
    ' at ',
    { bold: `${Math.abs(best.satisfied).toFixed(1)}%` },
    ' on the top-rated education statement.',
  ];
}

export function generateHealthChartInsight(
  satisfied: number,
  unsatisfied: number,
  score: number,
): InsightPart[] {
  if (satisfied >= unsatisfied) {
    return [
      { bold: 'Satisfied residents' },
      ' lead at ',
      { bold: `${satisfied.toFixed(1)}%` },
      ' with a ',
      { bold: `${score.toFixed(1)}%` },
      ' overall score.',
    ];
  }
  return [
    { bold: 'Unsatisfied responses' },
    ' reach ',
    { bold: `${unsatisfied.toFixed(1)}%` },
    '; overall health score is ',
    { bold: `${score.toFixed(1)}%` },
    '.',
  ];
}

export function generateEnvironmentChartInsight(
  data: { fullName: string; satisfied: number; dissatisfied: number }[],
): InsightPart[] {
  if (data.length === 0) return ['Environment satisfaction reflects views on cleanliness and surroundings.'];
  const best = [...data].sort((a, b) => b.satisfied - a.satisfied)[0];
  return [
    { bold: 'Highest satisfaction' },
    ' at ',
    { bold: `${best.satisfied.toFixed(1)}%` },
    ' on the top-rated environment statement.',
  ];
}

export function generatePillarTableInsight(
  rows: { pillar: string; score2024: number; score2025: number }[],
  mode: ViewMode,
): InsightPart[] {
  if (rows.length === 0) return ['Annual scores summarize satisfaction across all pillars.'];
  const top = [...rows].sort((a, b) => b.score2025 - a.score2025)[0];
  if (mode === 'yoy') {
    const improved = rows.filter((r) => r.score2025 > r.score2024).length;
    return [
      { bold: top.pillar },
      ' leads at ',
      { bold: `${top.score2025.toFixed(1)}%` },
      '; ',
      { bold: String(improved) },
      ' of ',
      { bold: String(rows.length) },
      ' pillars improved.',
    ];
  }
  return [
    { bold: top.pillar },
    ' leads at ',
    { bold: `${top.score2025.toFixed(1)}%` },
    ' across ',
    { bold: String(rows.length) },
    ' pillars.',
  ];
}

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
