import type { CompareYears, PillarScoreCoverage, ScoreStatus, SectionScore, SurveyData, SurveyYear, ViewMode } from './types';
import { DEFAULT_COMPARE_YEARS } from './types';
import { translateLabel } from './translations';

const INCOME_COMFORT_CATEGORIES = [
  'We live very comfortably on current income',
  'We live comfortably on current income',
];

const INCOME_BRACKET_MIDPOINTS: Record<string, number> = {
  'Less than 5000 dirhams': 2500,
  '5000-10000 dirhams': 7500,
  '10,001-20,000 dirhams': 15000,
  '20,001-30,000 dirhams': 25000,
  '30,001-50,000 dirhams': 40000,
  'More than 50,000 dirhams': 60000,
};

const INCOME_FEELING_GROUPS = [
  {
    name: 'Live comfortably',
    categories: [
      'We live very comfortably on current income',
      'We live comfortably on current income',
    ],
  },
  {
    name: 'Try to manage',
    categories: ['We manage on current income'],
  },
  {
    name: 'Find it difficult',
    categories: [
      'We find things very difficult on current income',
      'We find things difficult on current income',
    ],
  },
] as const;

const DEBT_NONE_CATEGORIES = new Set(['There is no debt', 'لا يوجد ديون']);

export const INCOME_DEBT_EXCLUSIONS = DEBT_NONE_CATEGORIES;

const INCOME_CATEGORY_LABELS: Record<string, string> = {
  higher: 'Higher',
  less: 'Lower',
  'As it is': 'Same',
  no: 'No',
  Yes: 'Yes',
};

const INCOME_BARRIER_LABELS: Record<string, string> = {
  'My income is not enough to save': 'Insufficient income',
  "I don't believe in saving": 'Skeptical of saving',
  "I don't know how to save": 'Unsure how to save',
  'I have a lot of debt': 'Heavy debt load',
  'I have a lot of expenses': 'High expenses',
};

export type IncomeChartRow = {
  name: string;
  fullName: string;
  value2024: number;
  value2025: number;
  value: number;
};

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

const EDUCATION_AXIS_LABELS: Record<string, string> = {
  'Satisfied with the government school education system in my residential area': 'Govt. schools',
  'Satisfied with the financial costs of public school education in a residential area': 'Public cost',
  'Satisfied with the private school education system in my residential area': 'Private schools',
  'Satisfied with the financial costs of private school education in a residential area': 'Private cost',
  'Satisfied with the university education system in the emirate': 'University system',
  'Satisfied with the financial costs of university education in the emirate': 'University cost',
  'Satisfied with the quality of school education in my residential area': 'School quality',
  'Satisfied with the ease of attending school education in my residential area': 'School access',
  'Satisfied with the ease of enrolling in university education in the emirate': 'Uni enrollment',
  'Satisfied with the proximity of the educational facility (schools and universities) to the residence':
    'School proximity',
  'My children are exposed to frequent verbal abuse by other students, such as ridicule, insults, or spreading rumors in schools in my residential area.':
    'Verbal abuse',
  'My children are frequently subjected to physical abuse by other students (such as hitting, kicking, or shoving) in schools in my residential area.':
    'Physical abuse',
  'I saw/heard about other students being physically harmed more than once at the school in my residential area (either by pushing, tripping, hitting, or by painful pinching).':
    'Physical harm',
  'My children are harassed, ridiculed, and called bad names more than once at school in my residential area':
    'Child harassment',
  'I saw/heard more than once about other students being harassed, ridiculed, and called names at school in my residential area.':
    'Peer harassment',
  'I feel physically safe for my son throughout the school building in my residential area': 'Physical safety',
  'The school in a residential area applies a balanced and fair system to maintain student discipline':
    'Discipline system',
  'Schools in the residential area encourage students to participate in sports competitions and enter the Abu Dhabi Sports Championship':
    'Sports programs',
  'Schools in my residential area promote life skills, innovation and sports': 'Life skills',
  'The schools provide sports facilities to students and community members in a residential area':
    'Sports facilities',
  'I have great respect for the teaching profession': 'Teaching respect',
  'The labor market does not accept the quality of university education you obtained': 'Labor market fit',
};

const EDUCATION_AXIS_LABEL_PATTERNS: [RegExp, string][] = [
  [/Abu Dhabi Sports Championship|sports competitions/i, 'Sports programs'],
  [/physical abuse by other students/i, 'Physical abuse'],
  [/harassed, ridiculed, and called names/i, 'Peer harassment'],
  [/harassed, ridiculed, and called bad names/i, 'Child harassment'],
  [/physically harmed more than once/i, 'Physical harm'],
  [/verbal abuse by other students/i, 'Verbal abuse'],
  [/physically safe for my son/i, 'Physical safety'],
  [/student discipline/i, 'Discipline system'],
  [/life skills, innovation and sports/i, 'Life skills'],
  [/sports facilities/i, 'Sports facilities'],
  [/respect for the teaching profession/i, 'Teaching respect'],
  [/government school education system/i, 'Govt. schools'],
  [/private school education system/i, 'Private schools'],
  [/university education system/i, 'University system'],
  [/financial costs of public school/i, 'Public cost'],
  [/financial costs of private school/i, 'Private cost'],
  [/financial costs of university/i, 'University cost'],
  [/quality of school education/i, 'School quality'],
  [/ease of attending school/i, 'School access'],
  [/ease of enrolling in university/i, 'Uni enrollment'],
  [/proximity of the educational facility/i, 'School proximity'],
  [/labor market does not accept/i, 'Labor market fit'],
];

export function formatEducationAxisLabel(text: string): string {
  const normalized = text.trim().replace(/\.$/, '');
  if (EDUCATION_AXIS_LABELS[normalized]) return EDUCATION_AXIS_LABELS[normalized];

  for (const [pattern, label] of EDUCATION_AXIS_LABEL_PATTERNS) {
    if (pattern.test(normalized)) return label;
  }

  return compactStatementLabel(text);
}

const HEALTH_HEATMAP_LABEL_MAX_CHARS = 28;

export function formatHealthHeatmapLabel(text: string): string {
  const normalized = text.trim().replace(/\.$/, '');

  const exactLabels: Record<string, string> = {
    'Concerned authorities in the residential area promote raising the level of physical activity and community sports':
      'Promote activity & sports',
    'The concerned authorities in the residential area provide behavioral and cultural change programs that encourage physical exercise':
      'Exercise encouragement programs',
    'Cleanliness in general': 'General cleanliness',
    'Treatment of register/counter staff': 'Counter staff treatment',
    'Treatment and services of doctors': 'Doctor treatment & services',
    'Treatment of pharmacy staff': 'Pharmacy staff treatment',
    'Waiting time (turn)': 'Waiting time',
    'Review dates': 'Review dates',
    'Specialty clinics': 'Specialty clinics',
    'Sanitary facilities (bathrooms)': 'Sanitary facilities',
    'Rapid response to emergency situations': 'Emergency response',
    'Laboratory readiness': 'Lab readiness',
    'Radiology and imaging readiness': 'Radiology readiness',
    'How close the health facility is to the place of residence': 'Facility proximity to home',
    'The health system in general in government health facilities': 'Govt. health system',
    'The health system in general in private health facilities': 'Private health system',
    'The quality of health services provided in private health facilities in general':
      'Private health service quality',
    'Prices of health services within hospitals in the residential area': 'Hospital service prices',
    'Drug prices in hospitals area of ​​residence': 'Hospital drug prices',
    'Prices of medicines in pharmacies in the area of ​​residence': 'Pharmacy medicine prices',
    'National vaccination program and distributional equity': 'Vaccination program equity',
    'Justice in the distribution of health system services to individuals': 'Fair health service access',
    'Feeling sad or depressed': 'Sadness or depression',
    'Anxiety or insomnia': 'Anxiety or insomnia',
    'Concentration or remembering': 'Concentration or memory',
    'Physical pain': 'Physical pain',
  };

  if (exactLabels[normalized]) return exactLabels[normalized];

  let label = compactStatementLabel(text);

  const healthReplacements: [RegExp, string][] = [
    [/^Concerned authorities in .+? promote raising the level of physical activity and community sports/i, 'Promote activity & sports'],
    [/^The concerned authorities in .+? provide behavioral and cultural change programs that encourage physical exercise/i, 'Exercise encouragement programs'],
    [/^Concerned authorities in .+? promote raising the level of /i, 'Promote '],
    [/^The concerned authorities in .+? provide /i, 'Provide '],
    [/behavioral and cultural change programs that encourage physical exercise/i, 'exercise programs'],
    [/physical activity and community sports/i, 'activity & sports'],
    [/how close the health facility is to the place of residence/i, 'Facility proximity to home'],
    [/the health system in general in government health facilities/i, 'Govt. health system'],
    [/the health system in general in private health facilities/i, 'Private health system'],
    [/the quality of health services provided in private health facilities in general/i, 'Private health service quality'],
    [/prices of health services within hospitals in .+/i, 'Hospital service prices'],
    [/drug prices in hospitals .+/i, 'Hospital drug prices'],
    [/prices of medicines in pharmacies in .+/i, 'Pharmacy medicine prices'],
    [/national vaccination program and distributional equity/i, 'Vaccination program equity'],
    [/justice in the distribution of health system services to individuals/i, 'Fair health service access'],
    [/treatment of register\/counter staff/i, 'Counter staff treatment'],
    [/treatment and services of doctors/i, 'Doctor treatment & services'],
    [/treatment of pharmacy staff/i, 'Pharmacy staff treatment'],
    [/waiting time \(turn\)/i, 'Waiting time'],
    [/sanitary facilities \(bathrooms\)/i, 'Sanitary facilities'],
    [/rapid response to emergency situations/i, 'Emergency response'],
    [/radiology and imaging readiness/i, 'Radiology readiness'],
    [/laboratory readiness/i, 'Lab readiness'],
    [/feeling sad or depressed/i, 'Sadness or depression'],
    [/concentration or remembering/i, 'Concentration or memory'],
  ];

  for (const [pattern, replacement] of healthReplacements) {
    label = label.replace(pattern, replacement);
  }

  label = label.replace(/\s+/g, ' ').trim();

  if (label.length <= HEALTH_HEATMAP_LABEL_MAX_CHARS) return label;

  const removableWords = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'for', 'with']);
  let words = label.split(' ');
  while (words.join(' ').length > HEALTH_HEATMAP_LABEL_MAX_CHARS && words.length > 3) {
    const removableIndex = words.findIndex(
      (word, index) => index > 0 && index < words.length - 1 && removableWords.has(word.toLowerCase()),
    );
    if (removableIndex === -1) break;
    words.splice(removableIndex, 1);
  }

  return words.join(' ');
}

export function getIncomeComfortPercent(data: SurveyData, year: '2024' | '2025'): number {
  const questions = data.sections.income?.questions ?? [];
  return questions
    .filter(isCategory)
    .filter((q) => q.code === 'Q101' && INCOME_COMFORT_CATEGORIES.includes(q.categoryEn ?? ''))
    .reduce((sum, q) => sum + (q.data[year] ?? 0), 0);
}

export function getAverageMonthlyIncome(data: SurveyData, year: '2024' | '2025'): number {
  const questions = data.sections.demographics?.questions ?? [];
  const brackets = questions.filter(isCategory).filter((q) => q.code === 'Q909');
  let weightedSum = 0;
  let totalWeight = 0;

  for (const bracket of brackets) {
    const midpoint =
      INCOME_BRACKET_MIDPOINTS[bracket.categoryEn ?? ''] ??
      INCOME_BRACKET_MIDPOINTS[translateLabel(bracket.categoryEn ?? bracket.categoryAr)] ??
      0;
    const weight = bracket.data[year] ?? 0;
    if (midpoint > 0 && weight > 0) {
      weightedSum += midpoint * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function getTopMultiSelectCategory(
  questions: import('./types').Question[],
  code: string,
  year: import('./types').SurveyYear,
  excludeCategories: Set<string> = new Set(),
): { name: string; categoryEn: string; value: number; value2024: number; value2025: number } | null {
  const items = getCategoryByQuestion(questions, code)
    .filter((q) => !excludeCategories.has(q.categoryEn ?? '') && !excludeCategories.has(q.categoryAr))
    .map((q) => ({
      name: translateLabel(q.categoryEn ?? q.categoryAr),
      categoryEn: q.categoryEn ?? q.categoryAr,
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
      value: q.data[year] ?? 0,
    }))
    .sort((a, b) => b.value - a.value);

  return items[0] ?? null;
}

export function getIncomeFeelingChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
) {
  const incomeQuestions = getCategoryByQuestion(questions, 'Q101');

  return INCOME_FEELING_GROUPS.map((group) => {
    const matching = incomeQuestions.filter((q) =>
      (group.categories as readonly string[]).includes(q.categoryEn ?? ''),
    );
    const value2024 = matching.reduce((sum, q) => sum + (q.data['2024'] ?? 0), 0);
    const value2025 = matching.reduce((sum, q) => sum + (q.data['2025'] ?? 0), 0);
    return {
      name: group.name,
      fullName: group.name,
      value2024,
      value2025,
      value: pickYearValue(value2024, value2025, year),
    };
  });
}

export function getIncomeDistributionData(
  questions: import('./types').Question[],
  code: string,
  year: import('./types').SurveyYear = '2025',
  limit = 8,
  excludeCategories: Set<string> = new Set(),
  labelMap: Record<string, string> = INCOME_CATEGORY_LABELS,
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, code)
    .filter((q) => !excludeCategories.has(q.categoryEn ?? '') && !excludeCategories.has(q.categoryAr))
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = labelMap[fullName] ?? labelMap[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function getIncomeBarrierHeatmapData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q106')
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = INCOME_BARRIER_LABELS[fullName] ?? INCOME_BARRIER_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getSpendingOutlookScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  return rows
    .filter((row) => row.name === 'Lower' || row.name === 'Same')
    .reduce((sum, row) => sum + pickYearValue(row.value2024, row.value2025, year), 0);
}

export function getSavingRateScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  const yesRow = rows.find((row) => row.name === 'Yes');
  return yesRow ? pickYearValue(yesRow.value2024, yesRow.value2025, year) : 0;
}

export function getBarrierCapacityScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  const peak = Math.max(...rows.map((row) => pickYearValue(row.value2024, row.value2025, year)));
  return 100 - peak;
}

export function getIncomeComfortGroupScore(
  rows: IncomeChartRow[],
  year: import('./types').SurveyYear,
): number {
  const comfortable = rows.find((row) => row.name === 'Live comfortably');
  return comfortable ? pickYearValue(comfortable.value2024, comfortable.value2025, year) : 0;
}

export function getIncomeChartBadgeScore(
  rows: IncomeChartRow[],
  year: import('./types').SurveyYear,
  metric: 'spending' | 'saving' | 'barriers' | 'feeling',
  mode: ViewMode,
): number {
  const score2024 =
    metric === 'spending'
      ? getSpendingOutlookScore(rows, '2024')
      : metric === 'saving'
        ? getSavingRateScore(rows, '2024')
        : metric === 'barriers'
          ? getBarrierCapacityScore(rows, '2024')
          : getIncomeComfortGroupScore(rows, '2024');
  const score2025 =
    metric === 'spending'
      ? getSpendingOutlookScore(rows, '2025')
      : metric === 'saving'
        ? getSavingRateScore(rows, '2025')
        : metric === 'barriers'
          ? getBarrierCapacityScore(rows, '2025')
          : getIncomeComfortGroupScore(rows, '2025');

  if (mode === 'yoy') return score2025 - score2024;
  return year === '2025' ? score2025 : score2024;
}

export function generateIncomeSpendingInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  if (!top) return ['Spending expectations show how residents anticipate household costs changing.'];

  if (mode === 'yoy') {
    const biggestShift = [...rows].sort(
      (a, b) => Math.abs(b.value2025 - b.value2024) - Math.abs(a.value2025 - a.value2024),
    )[0];
    const change = biggestShift.value2025 - biggestShift.value2024;
    return [
      { bold: biggestShift.name },
      ' saw the largest shift at ',
      { bold: formatDelta(change) },
      ', shaping next-quarter spending outlook.',
    ];
  }

  return [
    { bold: top.name },
    ' is the leading expectation at ',
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' for the next three months.',
  ];
}

export function generateIncomeSavingInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const savingRate = getSavingRateScore(rows, year);
  const notSaving = rows.find((row) => row.name === 'No');

  if (mode === 'yoy') {
    const change = getSavingRateScore(rows, '2025') - getSavingRateScore(rows, '2024');
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: 'Saving rate' },
      ` ${direction} `,
      { bold: formatDelta(change) },
      ' with ',
      { bold: `${getSavingRateScore(rows, '2025').toFixed(1)}%` },
      ' now saving from monthly income.',
    ];
  }

  return [
    { bold: `${savingRate.toFixed(1)}%` },
    ' of residents save from monthly income',
    notSaving
      ? `; ${pickYearValue(notSaving.value2024, notSaving.value2025, year).toFixed(1)}% do not save.`
      : '.',
  ];
}

export function generateIncomeBarrierInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  if (!top) return ['Saving barriers highlight what prevents residents from putting income aside.'];

  if (mode === 'yoy') {
    const easing = [...rows].sort(
      (a, b) => (a.value2025 - a.value2024) - (b.value2025 - b.value2024),
    )[0];
    const change = easing.value2025 - easing.value2024;
    return [
      { bold: easing.name },
      ' eased most at ',
      { bold: formatDelta(change) },
      ' while ',
      { bold: top.name },
      ' remains the top cited barrier.',
    ];
  }

  return [
    { bold: top.name },
    ' is the most cited barrier at ',
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' of responses.',
  ];
}

export function generateIncomeFeelingInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const comfortable = getIncomeComfortGroupScore(rows, year);
  const difficult = rows.find((row) => row.name === 'Find it difficult');

  if (mode === 'yoy') {
    const change = getIncomeComfortGroupScore(rows, '2025') - getIncomeComfortGroupScore(rows, '2024');
    const direction = change >= 0 ? 'improved' : 'weakened';
    return [
      { bold: 'Income comfort' },
      ` ${direction} `,
      { bold: formatDelta(change) },
      ' with ',
      { bold: `${getIncomeComfortGroupScore(rows, '2025').toFixed(1)}%` },
      ' now living comfortably.',
    ];
  }

  return [
    { bold: `${comfortable.toFixed(1)}%` },
    ' live comfortably on current income',
    difficult
      ? `; ${pickYearValue(difficult.value2024, difficult.value2025, year).toFixed(1)}% find it difficult.`
      : '.',
  ];
}

export function getCategoryChartData(
  questions: import('./types').Question[],
  code: string,
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
  limit = 8,
  excludeCategories: Set<string> = new Set(),
) {
  return getTopCategories(
    getCategoryByQuestion(questions, code).filter(
      (q) => !excludeCategories.has(q.categoryEn ?? '') && !excludeCategories.has(q.categoryAr),
    ),
    mode,
    limit,
    year,
  ).map((item) => ({
    name: (() => {
      const label = INCOME_CATEGORY_LABELS[item.name] ?? item.name;
      return label.length > 28 ? `${label.slice(0, 27)}…` : label;
    })(),
    fullName: INCOME_CATEGORY_LABELS[item.name] ?? item.name,
    value: item.value,
  }));
}

export function getEmploymentPercent(data: SurveyData, year: '2024' | '2025'): number {
  const questions = data.sections.work?.questions ?? [];
  const employed = questions
    .filter(isCategory)
    .find((q) => q.code === 'Q201' && q.categoryEn === 'Employed');
  return employed?.data[year] ?? 0;
}

const WORK_LIFE_BALANCE_STATEMENT =
  'I feel secure in my ability to balance work and social (family) life.';

const WORK_CHALLENGE_CATEGORIES = new Set([
  'The labor market does not accept the quality of university education you obtained',
  'My field of study and qualifications do not match the requirements of the labor market',
  'The job opportunities available to me are not suitable',
  'Strong competition for available job opportunities',
  "I don't have enough social connections to help",
]);

const WORK_CHALLENGE_LABELS: Record<string, string> = {
  'The labor market does not accept the quality of university education you obtained':
    'Labor market rejects education quality',
  'My field of study and qualifications do not match the requirements of the labor market':
    'Field/qualifications mismatch',
  'The job opportunities available to me are not suitable': 'Job opportunities not suitable',
  'Strong competition for available job opportunities': 'Strong competition',
  "I don't have enough social connections to help": 'Insufficient social connections',
};

const WORK_BUSINESS_LABELS: Record<string, string> = {
  'Outside the UAE': 'Outside UAE',
  'Within the Emirate of Abu Dhabi': 'Abu Dhabi',
  'Within Al Falah area': 'Al Falah',
  'In other emirates': 'Other emirates',
  'No, there is not': 'None',
};

const WORK_SUPPORT_LABELS: Record<string, string> = {
  'Financial support and promotions': 'Financial support',
  'Providing job opportunities': 'Job opportunities',
  'Social support': 'Social support',
  'Home maintenance work': 'Home maintenance',
  'Flexibility of working hours': 'Flexible hours',
  'In-kind bonuses (housing, education,...)': 'In-kind benefits',
  'Housing subsidies': 'Housing assistance',
  'Government services': 'Government services',
  'Supporting entrepreneurs and investments': 'Business owner support',
};

function normalizeYesNoCategory(categoryEn: string | undefined, categoryAr: string): 'Yes' | 'No' {
  const raw = (categoryEn ?? categoryAr).trim();
  return /^yes$/i.test(raw) || raw === 'نعم' ? 'Yes' : 'No';
}

export function getAverageWeeklyHours(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  const q = questions.find(
    (item): item is import('./types').MeanQuestion =>
      isMean(item) && item.code === 'Q209' && item.dimensionAr === 'الإجمالي',
  );
  return q?.data[year] ?? 0;
}

export function getWorkLifeBalancePercent(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  const q = questions
    .filter(isLikert)
    .find((item) => item.statementEn === WORK_LIFE_BALANCE_STATEMENT);
  return q?.data[year]?.agreement ?? 0;
}

export function getGovernmentAssistancePercent(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  const q = questions
    .filter(isCategory)
    .find((item) => item.code === 'Q212' && normalizeYesNoCategory(item.categoryEn, item.categoryAr) === 'Yes');
  return q?.data[year] ?? 0;
}

export function getWorkJobseekerChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q203')
    .map((q) => {
      const name = normalizeYesNoCategory(q.categoryEn, q.categoryAr);
      return {
        name,
        fullName: name === 'Yes' ? 'Yes — actively seeking paid work' : 'No — not seeking paid work',
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getWorkChallengeChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q205')
    .filter((q) => WORK_CHALLENGE_CATEGORIES.has(q.categoryEn ?? ''))
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = WORK_CHALLENGE_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getWorkBusinessChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q211')
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = WORK_BUSINESS_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getWorkSupportHeatmapData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q213')
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = WORK_SUPPORT_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getWorkJobseekerRate(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  const yesRow = rows.find((row) => row.name === 'Yes');
  return yesRow ? pickYearValue(yesRow.value2024, yesRow.value2025, year) : 0;
}

export function getWorkBusinessOwnershipRate(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  const noneRow = rows.find((row) => row.name === 'None');
  const noneRate = noneRow ? pickYearValue(noneRow.value2024, noneRow.value2025, year) : 0;
  return Math.max(0, 100 - noneRate);
}

export function getWorkTopChallengeScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => pickYearValue(row.value2024, row.value2025, year)));
}

export function getWorkTopSupportScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => pickYearValue(row.value2024, row.value2025, year)));
}

export function getWorkChartBadgeScore(
  rows: IncomeChartRow[],
  year: import('./types').SurveyYear,
  metric: 'jobseekers' | 'challenges' | 'business' | 'support',
  mode: ViewMode,
): number {
  const score2024 =
    metric === 'jobseekers'
      ? getWorkJobseekerRate(rows, '2024')
      : metric === 'challenges'
        ? getWorkTopChallengeScore(rows, '2024')
        : metric === 'business'
          ? getWorkBusinessOwnershipRate(rows, '2024')
          : getWorkTopSupportScore(rows, '2024');
  const score2025 =
    metric === 'jobseekers'
      ? getWorkJobseekerRate(rows, '2025')
      : metric === 'challenges'
        ? getWorkTopChallengeScore(rows, '2025')
        : metric === 'business'
          ? getWorkBusinessOwnershipRate(rows, '2025')
          : getWorkTopSupportScore(rows, '2025');

  if (mode === 'yoy') return score2025 - score2024;
  return year === '2025' ? score2025 : score2024;
}

export function generateWorkJobseekerInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const activeRate = getWorkJobseekerRate(rows, year);
  const inactive = rows.find((row) => row.name === 'No');

  if (mode === 'yoy') {
    const change = getWorkJobseekerRate(rows, '2025') - getWorkJobseekerRate(rows, '2024');
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: 'Active jobseekers' },
      ` ${direction} `,
      { bold: formatDelta(change) },
      ' with ',
      { bold: `${getWorkJobseekerRate(rows, '2025').toFixed(1)}%` },
      ' now seeking paid work.',
    ];
  }

  return [
    { bold: `${activeRate.toFixed(1)}%` },
    ' actively sought paid work in the past four weeks',
    inactive
      ? `; ${pickYearValue(inactive.value2024, inactive.value2025, year).toFixed(1)}% did not.`
      : '.',
  ];
}

export function generateWorkChallengeInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  if (!top) return ['Employment challenges highlight barriers residents face when seeking work.'];

  if (mode === 'yoy') {
    const biggestShift = [...rows].sort(
      (a, b) => Math.abs(b.value2025 - b.value2024) - Math.abs(a.value2025 - a.value2024),
    )[0];
    const change = biggestShift.value2025 - biggestShift.value2024;
    return [
      { bold: biggestShift.name },
      ' shifted most at ',
      { bold: formatDelta(change) },
      ' while ',
      { bold: top.name },
      ' remains the top cited challenge.',
    ];
  }

  return [
    { bold: top.name },
    ' is the most cited challenge at ',
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' of responses.',
  ];
}

export function generateWorkBusinessInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const top = [...rows].filter((row) => row.name !== 'None').sort((a, b) => b.value - a.value)[0];
  const ownershipRate = getWorkBusinessOwnershipRate(rows, year);

  if (mode === 'yoy') {
    const change = getWorkBusinessOwnershipRate(rows, '2025') - getWorkBusinessOwnershipRate(rows, '2024');
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: 'Business ownership' },
      ` ${direction} `,
      { bold: formatDelta(change) },
      ' with ',
      { bold: `${getWorkBusinessOwnershipRate(rows, '2025').toFixed(1)}%` },
      ' reporting a project or investment.',
    ];
  }

  return [
    { bold: `${ownershipRate.toFixed(1)}%` },
    ' report a private business or investment',
    top ? `; ${top.name} is the most common location at ${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%.` : '.',
  ];
}

export function generateWorkSupportInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  if (!top) return ['Expected government support reflects resident priorities in employment.'];

  if (mode === 'yoy') {
    const rising = [...rows].sort((a, b) => (b.value2025 - b.value2024) - (a.value2025 - a.value2024))[0];
    const change = rising.value2025 - rising.value2024;
    return [
      { bold: rising.name },
      ' demand rose most at ',
      { bold: formatDelta(change) },
      ' while ',
      { bold: top.name },
      ' remains the most expected support.',
    ];
  }

  return [
    { bold: top.name },
    ' is the most expected support at ',
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' of responses.',
  ];
}

export function getWorkKpiSentence(
  metric: 'score' | 'hours' | 'balance' | 'assistance',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong employment satisfaction overall.'
        : value >= 50
          ? 'Moderate employment satisfaction.'
          : 'Employment satisfaction needs improvement.';
    case 'hours':
      return value >= 40
        ? 'Residents work full-time hours on average.'
        : value >= 20
          ? 'Moderate weekly working hours.'
          : 'Limited weekly working hours reported.';
    case 'balance':
      return value >= 70
        ? 'Most residents feel secure balancing work and family.'
        : value >= 50
          ? 'Work-life balance perception is moderate.'
          : 'Many residents struggle with work-life balance.';
    case 'assistance':
      return value >= 30
        ? 'A notable share receive government assistance.'
        : value >= 15
          ? 'Some residents receive government assistance.'
          : 'Few residents report government assistance.';
  }
}

export function getSafetyPercent(data: SurveyData, year: '2024' | '2025'): number {
  const score = data.sectionScores.security;
  return year === '2025' ? score.score2025 : score.score2024;
}

const KPI_CATEGORY_SHORT_LABELS: Record<string, string> = {
  'Debt obligations': 'Debt',
  'Housing/household expenses (including water and electricity bills, maintenance)': 'Housing',
  'Food expenses': 'Food',
  'Miscellaneous expenses (other expenses)': 'Miscellaneous',
  "Children's expenses (excluding education)": 'Children',
  'Communications expenses': 'Communications',
  'Entertainment and vacation expenses': 'Entertainment',
  'University education expenses': 'University',
  'School education expenses': 'School fees',
  'Personal care expenses': 'Personal care',
  'Health care expenses/health insurance': 'Healthcare',
  'Transportation expenses': 'Transport',
  'Credit cards': 'Credit cards',
  'Home loans': 'Home loans',
  'Car loans': 'Car loans',
  'Personal loans': 'Personal loans',
};

export function getKpiCategoryShortLabel(categoryEn: string, fallbackName?: string): string {
  return KPI_CATEGORY_SHORT_LABELS[categoryEn] ?? fallbackName ?? categoryEn;
}

export function getIncomeKpiSentence(
  metric: 'score' | 'income' | 'expense' | 'debt',
  value: number,
  categoryEn?: string,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong income and living satisfaction.'
        : value >= 50
          ? 'Moderate living satisfaction overall.'
          : 'Income and living need improvement.';
    case 'income':
      return value >= 15000
        ? 'Comfortable household income level.'
        : value >= 8000
          ? 'Moderate household income level.'
          : 'Limited household income level.';
    case 'expense':
      return categoryEn
        ? value >= 40
          ? 'A large share of households report this cost.'
          : value >= 25
            ? 'A common expense across households.'
            : 'Reported by a notable share of households.'
        : 'No living expense data available.';
    case 'debt':
      return categoryEn
        ? value >= 40
          ? 'A large share of households carry this debt.'
          : value >= 25
            ? 'A common debt across households.'
            : 'Reported by a notable share of households.'
        : 'No debt obligation data available.';
  }
}

export function getOverviewKpiSentence(
  metric: 'satisfaction' | 'income' | 'employment' | 'safety',
  value: number,
): string {
  switch (metric) {
    case 'satisfaction':
      return value >= 70
        ? 'Residents are satisfied in Al Falah.'
        : value >= 50
          ? 'Moderate satisfaction overall.'
          : 'Satisfaction is below target.';
    case 'income':
      return value >= 50
        ? 'Most residents feel income comfort.'
        : value >= 30
          ? 'Some residents feel income comfort.'
          : 'Many residents lack income comfort.';
    case 'employment':
      return value >= 20
        ? 'Workforce participation is active.'
        : 'Employment participation is limited.';
    case 'safety':
      return value >= 70
        ? 'Residents feel secure at home.'
        : value >= 50
          ? 'Safety perception is moderate.'
          : 'Safety concerns are elevated.';
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

export function isLikert(q: { type: string }): q is import('./types').LikertQuestion {
  return q.type === 'likert' || q.type === 'rating';
}

function getTopLikertStatements(
  section: import('./types').Section,
  sortYear: '2024' | '2025',
  limit = 5,
) {
  const seen = new Set<string>();
  return section.questions
    .filter(isLikert)
    .filter((q) => {
      if (seen.has(q.statementAr)) return false;
      seen.add(q.statementAr);
      return true;
    })
    .sort(
      (a, b) =>
        (b.data[sortYear]?.agreement ?? 0) - (a.data[sortYear]?.agreement ?? 0),
    )
    .slice(0, limit);
}

export function getEducationChartData(
  section: import('./types').Section,
  year: '2024' | '2025',
  sortYear: '2024' | '2025' = year,
) {
  return getTopLikertStatements(section, sortYear)
    .map((q) => {
      const breakdown = q.data[year]?.breakdown ?? {};
      const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
      const total = dissatisfied + neutral + satisfied;
      const scale = total > 0 ? 100 / total : 0;
      const fullName = q.statementEn ?? q.statementAr;
      return {
        name: formatEducationAxisLabel(fullName),
        fullName,
        dissatisfied: dissatisfied * scale,
        neutral: neutral * scale,
        satisfied: satisfied * scale,
      };
    })
    .sort((a, b) => b.satisfied - a.satisfied);
}

export function getEnvironmentChartData(
  section: import('./types').Section,
  year: '2024' | '2025',
  sortYear: '2024' | '2025' = year,
) {
  return getTopLikertStatements(section, sortYear)
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
    })
    .sort((a, b) => b.satisfied - a.satisfied);
}

export function mergeStatementComparisonData(
  data2024: {
    name: string;
    fullName: string;
    dissatisfied: number;
    neutral: number;
    satisfied: number;
  }[],
  data2025: {
    name: string;
    fullName: string;
    dissatisfied: number;
    neutral: number;
    satisfied: number;
  }[],
) {
  return data2025.map((row2025) => {
    const row2024 = data2024.find((row) => row.fullName === row2025.fullName) ?? row2025;
    return {
      name: row2025.name,
      fullName: row2025.fullName,
      dissatisfied2024: row2024.dissatisfied,
      neutral2024: row2024.neutral,
      satisfied2024: row2024.satisfied,
      dissatisfied2025: row2025.dissatisfied,
      neutral2025: row2025.neutral,
      satisfied2025: row2025.satisfied,
    };
  });
}

export function getHealthHeatmapData(section: import('./types').Section) {
  return getTopLikertStatements(section, '2025')
    .map((q) => {
      const fullName = q.statementEn ?? q.statementAr;
      return {
        name: formatHealthHeatmapLabel(fullName),
        fullName,
        agreement2024: q.data['2024']?.agreement ?? 0,
        agreement2025: q.data['2025']?.agreement ?? 0,
      };
    })
    .sort((a, b) => b.agreement2025 - a.agreement2025);
}

export function getStatementYoYChartData(section: import('./types').Section) {
  return getTopLikertStatements(section, '2025')
    .map((q) => {
      const fullName = q.statementEn ?? q.statementAr;
      const value2024 = q.data['2024']?.agreement ?? 0;
      const value2025 = q.data['2025']?.agreement ?? 0;
      return {
        name: formatStatementAxisLabel(fullName),
        fullName,
        change: value2025 - value2024,
        value2024,
        value2025,
      };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export type InsightPart = string | { bold: string; tone?: 'positive' | 'negative' };

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
  mode: ViewMode,
  data2024: { satisfied: number }[] = [],
): InsightPart[] {
  if (mode === 'yoy' && data2024.length > 0) {
    const bestIndex = data.reduce((best, row, index) => {
      const change = row.satisfied - (data2024[index]?.satisfied ?? 0);
      const bestChange = data[best].satisfied - (data2024[best]?.satisfied ?? 0);
      return change > bestChange ? index : best;
    }, 0);
    const change = data[bestIndex].satisfied - (data2024[bestIndex]?.satisfied ?? 0);
    return [
      { bold: 'Strongest improvement' },
      ' at ',
      { bold: formatDelta(change) },
      ' on the top-rated education statement.',
    ];
  }
  if (data.length === 0) return ['Education satisfaction varies across resident survey statements.'];
  const best = [...data].sort((a, b) => b.satisfied - a.satisfied)[0];
  return [
    { bold: 'Strongest agreement' },
    ' at ',
    { bold: `${Math.abs(best.satisfied).toFixed(1)}%` },
    ' on the top-rated education statement.',
  ];
}

export type EducationSentimentRow = {
  name: string;
  fullName: string;
  dissatisfied: number;
  neutral: number;
  satisfied: number;
};

export type EducationLikertScaleKey =
  | 'stronglyDisagree'
  | 'disagree'
  | 'neutral'
  | 'agree'
  | 'stronglyAgree';

export type EducationLikertScaleRow = {
  name: string;
  fullName: string;
  stronglyDisagree: number;
  disagree: number;
  neutral: number;
  agree: number;
  stronglyAgree: number;
};

export const EDUCATION_LIKERT_SCALE_LABELS: Record<EducationLikertScaleKey, string> = {
  stronglyAgree: 'Strongly agree',
  agree: 'Agree',
  neutral: 'Neutral',
  disagree: 'Disagree',
  stronglyDisagree: 'Strongly disagree',
};

export const EDUCATION_LIKERT_SCALE_ORDER: EducationLikertScaleKey[] = [
  'stronglyDisagree',
  'disagree',
  'neutral',
  'agree',
  'stronglyAgree',
];

export function getLikertFivePointValues(
  breakdown: Record<string, number>,
): Record<EducationLikertScaleKey, number> {
  return {
    stronglyDisagree: breakdown['غير موافق إطلاقاً'] ?? 0,
    disagree: breakdown['غير موافق'] ?? 0,
    neutral: breakdown['محايد'] ?? 0,
    agree: breakdown['موافق'] ?? 0,
    stronglyAgree: breakdown['موافق بشدة'] ?? 0,
  };
}

export function getLikertScaleAgreeTotal(row: EducationLikertScaleRow): number {
  return row.agree + row.stronglyAgree;
}

const EDUCATION_KPI_STATEMENT = {
  childSafety: /feel physically safe for my son throughout the school building/i,
  lifeSkills: /promote life skills, innovation and sports/i,
  university: /university education system in the emirate/i,
} as const;

const EDUCATION_CHART_STATEMENTS = {
  sportsFacilities: {
    match: /provide sports facilities to students and community/i,
    short: 'Sports facilities for students & community',
  },
  discipline: {
    match: /balanced and fair system to maintain student discipline/i,
    short: 'Fair & balanced student discipline',
  },
  verbalAbuse: {
    match: /frequent verbal abuse by other students/i,
    short: 'Repeated verbal abuse at school',
  },
  physicalAbuse: {
    match: /frequently subjected to physical abuse by other students/i,
    short: 'Repeated physical harm at school',
  },
  harassment: {
    match: /harassed, ridiculed, and called bad names more than once/i,
    short: 'Repeated harassment & name-calling',
  },
  awarenessHarassment: {
    match: /saw\/heard more than once about other students being harassed/i,
    short: 'Heard/seen harassment & name-calling',
  },
  awarenessPhysical: {
    match: /saw\/heard about other students being physically harmed/i,
    short: 'Heard/seen physical harm at school',
  },
} as const;

function findEducationLikert(
  questions: import('./types').Question[],
  matcher: RegExp,
): import('./types').LikertQuestion | undefined {
  return getLikertStatements(questions).find((q) => matcher.test(q.statementEn ?? q.statementAr));
}

function toEducationSentimentRow(
  question: import('./types').LikertQuestion,
  year: '2024' | '2025',
  shortName: string,
): EducationSentimentRow {
  const breakdown = question.data[year]?.breakdown ?? {};
  const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
  const total = dissatisfied + neutral + satisfied;
  const scale = total > 0 ? 100 / total : 0;
  const fullName = question.statementEn ?? question.statementAr;
  return {
    name: shortName,
    fullName,
    dissatisfied: dissatisfied * scale,
    neutral: neutral * scale,
    satisfied: satisfied * scale,
  };
}

function getEducationSentimentRows(
  questions: import('./types').Question[],
  year: '2024' | '2025',
  defs: ReadonlyArray<{ match: RegExp; short: string }>,
): EducationSentimentRow[] {
  return defs
    .map((def) => {
      const question = findEducationLikert(questions, def.match);
      return question ? toEducationSentimentRow(question, year, def.short) : null;
    })
    .filter((row): row is EducationSentimentRow => row != null);
}

export function getEducationLikertAgreement(
  questions: import('./types').Question[],
  matcher: RegExp,
  year: '2024' | '2025',
): number {
  const question = findEducationLikert(questions, matcher);
  return question?.data[year]?.agreement ?? 0;
}

export function getEducationChildSafetyPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, EDUCATION_KPI_STATEMENT.childSafety, year);
}

export function getEducationLifeSkillsPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, EDUCATION_KPI_STATEMENT.lifeSkills, year);
}

export function getEducationUniversitySatisfactionPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, EDUCATION_KPI_STATEMENT.university, year);
}

function toEducationLikertScaleRow(
  question: import('./types').LikertQuestion,
  year: '2024' | '2025',
  shortName: string,
): EducationLikertScaleRow {
  const breakdown = question.data[year]?.breakdown ?? {};
  const raw = getLikertFivePointValues(breakdown);
  const total = EDUCATION_LIKERT_SCALE_ORDER.reduce((sum, key) => sum + raw[key], 0);
  const scale = total > 0 ? 100 / total : 0;
  const fullName = question.statementEn ?? question.statementAr;
  return {
    name: shortName,
    fullName,
    stronglyDisagree: raw.stronglyDisagree * scale,
    disagree: raw.disagree * scale,
    neutral: raw.neutral * scale,
    agree: raw.agree * scale,
    stronglyAgree: raw.stronglyAgree * scale,
  };
}

function getEducationLikertScaleRows(
  questions: import('./types').Question[],
  year: '2024' | '2025',
  defs: ReadonlyArray<{ match: RegExp; short: string }>,
): EducationLikertScaleRow[] {
  return defs
    .map((def) => {
      const question = findEducationLikert(questions, def.match);
      return question ? toEducationLikertScaleRow(question, year, def.short) : null;
    })
    .filter((row): row is EducationLikertScaleRow => row != null);
}

export function getEducationSportsFacilitiesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationLikertScaleRow[] {
  return getEducationLikertScaleRows(questions, year, [EDUCATION_CHART_STATEMENTS.sportsFacilities]);
}

export function getEducationBullyingExperienceData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [
    EDUCATION_CHART_STATEMENTS.verbalAbuse,
    EDUCATION_CHART_STATEMENTS.physicalAbuse,
    EDUCATION_CHART_STATEMENTS.harassment,
  ]);
}

export function getEducationBullyingAwarenessData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [
    EDUCATION_CHART_STATEMENTS.awarenessHarassment,
    EDUCATION_CHART_STATEMENTS.awarenessPhysical,
  ]);
}

export function getEducationDisciplineFairnessData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [EDUCATION_CHART_STATEMENTS.discipline]);
}

const LIKERT_GAUGE_WEIGHTS: Record<EducationLikertScaleKey, number> = {
  stronglyDisagree: 1,
  disagree: 2,
  neutral: 3,
  agree: 4,
  stronglyAgree: 5,
};

export function getLikertDominantSegmentIndex(row: EducationLikertScaleRow): number {
  let bestIndex = 0;
  let bestValue = -1;
  EDUCATION_LIKERT_SCALE_ORDER.forEach((key, index) => {
    if (row[key] > bestValue) {
      bestValue = row[key];
      bestIndex = index;
    }
  });
  return bestIndex;
}

export function getLikertWeightedScore(row: EducationLikertScaleRow): number {
  const total = EDUCATION_LIKERT_SCALE_ORDER.reduce((sum, key) => sum + row[key], 0);
  if (total <= 0) return 3;
  return (
    EDUCATION_LIKERT_SCALE_ORDER.reduce(
      (sum, key) => sum + row[key] * LIKERT_GAUGE_WEIGHTS[key],
      0,
    ) / total
  );
}

export function mergeLikertScaleComparisonData(
  data2024: EducationLikertScaleRow[],
  data2025: EducationLikertScaleRow[],
) {
  return data2025.map((row2025) => {
    const row2024 = data2024.find((row) => row.fullName === row2025.fullName) ?? row2025;
    return {
      name: row2025.name,
      fullName: row2025.fullName,
      stronglyDisagree2024: row2024.stronglyDisagree,
      disagree2024: row2024.disagree,
      neutral2024: row2024.neutral,
      agree2024: row2024.agree,
      stronglyAgree2024: row2024.stronglyAgree,
      stronglyDisagree2025: row2025.stronglyDisagree,
      disagree2025: row2025.disagree,
      neutral2025: row2025.neutral,
      agree2025: row2025.agree,
      stronglyAgree2025: row2025.stronglyAgree,
    };
  });
}

function averageEducationLikertAgree(rows: EducationLikertScaleRow[]): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + getLikertScaleAgreeTotal(row), 0) / rows.length;
}

export function getEducationLikertScaleBadgeScore(
  rows: EducationLikertScaleRow[],
  rows2024: EducationLikertScaleRow[],
  mode: ViewMode,
): number {
  const current = averageEducationLikertAgree(rows);
  if (mode === 'current') return current;
  return current - averageEducationLikertAgree(rows2024);
}

export function generateEducationLikertScaleInsight(
  data: EducationLikertScaleRow[],
  mode: ViewMode,
  data2024: EducationLikertScaleRow[] = [],
  topic: 'sports' | 'discipline' = 'sports',
  topicLabelOverride?: string,
): InsightPart[] {
  if (data.length === 0) {
    return ['Resident views on this topic vary across survey responses.'];
  }

  const topicLabel =
    topicLabelOverride ?? (topic === 'sports' ? 'sports facilities' : 'discipline fairness');

  if (mode === 'yoy' && data2024.length > 0) {
    const bestIndex = data.reduce((best, row, index) => {
      const change =
        getLikertScaleAgreeTotal(row) -
        getLikertScaleAgreeTotal(data2024.find((r) => r.fullName === row.fullName) ?? row);
      const bestRow = data[best];
      const bestChange =
        getLikertScaleAgreeTotal(bestRow) -
        getLikertScaleAgreeTotal(data2024.find((r) => r.fullName === bestRow.fullName) ?? bestRow);
      return change > bestChange ? index : best;
    }, 0);
    const best = data[bestIndex];
    const prev = getLikertScaleAgreeTotal(
      data2024.find((r) => r.fullName === best.fullName) ?? best,
    );
    return [
      { bold: 'Strongest Agree shift' },
      ' at ',
      { bold: formatDelta(getLikertScaleAgreeTotal(best) - prev) },
      ` for ${topicLabel}.`,
    ];
  }

  const best = [...data].sort((a, b) => getLikertScaleAgreeTotal(b) - getLikertScaleAgreeTotal(a))[0];
  return [
    { bold: 'Highest Agree' },
    ' at ',
    { bold: `${getLikertScaleAgreeTotal(best).toFixed(1)}%` },
    ` on ${best.name.toLowerCase()}.`,
  ];
}

function averageEducationAgree(rows: EducationSentimentRow[]): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + row.satisfied, 0) / rows.length;
}

export function getEducationTabChartBadgeScore(
  rows: EducationSentimentRow[],
  rows2024: EducationSentimentRow[],
  mode: ViewMode,
): number {
  const current = averageEducationAgree(rows);
  if (mode === 'current') return current;
  return current - averageEducationAgree(rows2024);
}

export function getEducationKpiSentence(
  metric: 'score' | 'safety' | 'lifeSkills' | 'university',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong education satisfaction overall.'
        : value >= 50
          ? 'Moderate education satisfaction.'
          : 'Education satisfaction needs improvement.';
    case 'safety':
      return value >= 70
        ? 'Most residents feel schools keep kids physically safe.'
        : value >= 50
          ? 'School physical safety perception is moderate.'
          : 'Concerns remain about kids\' physical safety at school.';
    case 'lifeSkills':
      return value >= 70
        ? 'Schools are seen as boosting life skills and creativity.'
        : value >= 50
          ? 'Views on life skills and creativity are mixed.'
          : 'Few residents see strong life-skills support in schools.';
    case 'university':
      return value >= 70
        ? 'Strong satisfaction with university education.'
        : value >= 50
          ? 'Moderate satisfaction with university education.'
          : 'University education satisfaction needs attention.';
  }
}

export function generateEducationTabChartInsight(
  data: EducationSentimentRow[],
  mode: ViewMode,
  data2024: EducationSentimentRow[] = [],
  topic: 'sports' | 'bullying' | 'awareness' | 'discipline' = 'sports',
  topicLabelOverride?: string,
): InsightPart[] {
  if (data.length === 0) {
    return ['Resident views on this topic vary across survey responses.'];
  }

  const topicLabel =
    topicLabelOverride ??
    (topic === 'sports'
      ? 'sports facilities'
      : topic === 'bullying'
        ? 'bullying experience'
        : topic === 'awareness'
          ? 'bullying awareness'
          : 'discipline fairness');

  if (mode === 'yoy' && data2024.length > 0) {
    const bestIndex = data.reduce((best, row, index) => {
      const change = row.satisfied - (data2024.find((r) => r.fullName === row.fullName)?.satisfied ?? 0);
      const bestRow = data[best];
      const bestChange =
        bestRow.satisfied - (data2024.find((r) => r.fullName === bestRow.fullName)?.satisfied ?? 0);
      return change > bestChange ? index : best;
    }, 0);
    const best = data[bestIndex];
    const prev = data2024.find((r) => r.fullName === best.fullName)?.satisfied ?? 0;
    return [
      { bold: 'Strongest Agree shift' },
      ' at ',
      { bold: formatDelta(best.satisfied - prev) },
      ` for ${topicLabel}.`,
    ];
  }

  const best = [...data].sort((a, b) => b.satisfied - a.satisfied)[0];
  return [
    { bold: 'Highest Agree' },
    ' at ',
    { bold: `${best.satisfied.toFixed(1)}%` },
    ` on ${best.name.toLowerCase()}.`,
  ];
}

const SECURITY_KPI_STATEMENT = {
  movingSafe: /feel safe while moving around during the day and night/i,
  policeTrust:
    /trust the ability of the Abu Dhabi Police General Command to deal with accidents and problems in my residential area/i,
  jobSecurity: /feel job security in the Emirate of Abu Dhabi/i,
} as const;

const SECURITY_CHART_STATEMENTS = {
  freedomExpression: {
    match: /feel safe through freedom of expression/i,
    short: 'Freedom of expression safety',
  },
  peerInfluence: {
    match: /fear for my children from bad company/i,
    short: 'Concern about negative peer influence',
  },
  powerOutages: {
    match: /feel safe from uninterrupted power services/i,
    short: 'Safety from power outages',
  },
  drugPrevention: {
    match: /combat drugs in a residential area/i,
    short: 'Confidence in drug prevention',
  },
} as const;

const SECURITY_CONCERN_MATCHERS = [
  /fear for my children/i,
  /physical violence or threats/i,
  /exposed to an incident/i,
];

const SECURITY_Q401_SHORT_LABELS: Array<{ match: RegExp; label: string }> = [
  { match: /availability of housing/i, label: 'Housing availability' },
  { match: /uninterrupted power services/i, label: 'Power reliability' },
  { match: /drinking water services/i, label: 'Drinking water supply' },
  { match: /general cleanliness/i, label: 'General cleanliness' },
  { match: /constant availability of food/i, label: 'Food availability' },
  { match: /control over the food/i, label: 'Food quality control' },
  { match: /easy access to food/i, label: 'Food access' },
  { match: /provide food/i, label: 'Ability to provide food' },
  { match: /job security in the Emirate/i, label: 'Job security' },
  { match: /freedom of expression/i, label: 'Freedom of expression' },
  { match: /communicate on social media/i, label: 'Social media freedom' },
  { match: /communication with their families/i, label: 'Family communication' },
  { match: /effective laws that apply to everyone/i, label: 'Fair laws' },
  { match: /moving around during the day and night/i, label: 'Day & night mobility' },
  { match: /practice religious rituals/i, label: 'Religious practice' },
  { match: /justice, equality between religions/i, label: 'Justice & equality' },
  { match: /safe and protected in a residential area/i, label: 'Area protection' },
  { match: /security and safety in their residential area/i, label: 'Area security level' },
  { match: /Abu Dhabi Police General Command to deal with accidents/i, label: 'Police incident response' },
  { match: /combat drugs in a residential area/i, label: 'Drug prevention confidence' },
  { match: /police preventive measures to reduce crime/i, label: 'Crime prevention measures' },
  { match: /fear for my children from bad company/i, label: 'Negative peer influence' },
  { match: /physical violence or threats/i, label: 'Violence or threats' },
];

function getSecurityQ401ShortLabel(statement: string): string {
  const match = SECURITY_Q401_SHORT_LABELS.find((entry) => entry.match.test(statement));
  return match?.label ?? truncateStatementLabel(statement, 28);
}

export function getSecurityMovingSafePercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, SECURITY_KPI_STATEMENT.movingSafe, year);
}

export function getSecurityPoliceTrustPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, SECURITY_KPI_STATEMENT.policeTrust, year);
}

export function getSecurityJobSecurityPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, SECURITY_KPI_STATEMENT.jobSecurity, year);
}

export function getSecurityFreedomExpressionData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationLikertScaleRow[] {
  return getEducationLikertScaleRows(questions, year, [SECURITY_CHART_STATEMENTS.freedomExpression]);
}

export function getSecurityPeerInfluenceData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [SECURITY_CHART_STATEMENTS.peerInfluence]);
}

export function getSecurityPowerOutagesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [SECURITY_CHART_STATEMENTS.powerOutages]);
}

export function getSecurityDrugPreventionData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [SECURITY_CHART_STATEMENTS.drugPrevention]);
}

export function getSecurityConfidenceStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q401')
    .filter((question) => resolveStatementPolarity(question, SECURITY_CONCERN_MATCHERS) === 'positive')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getSecurityQ401ShortLabel(statement), fullName: statement };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getSecurityConcernStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q401')
    .filter((question) => resolveStatementPolarity(question, SECURITY_CONCERN_MATCHERS) === 'negative')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getSecurityQ401ShortLabel(statement), fullName: statement };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getSecurityNegativeScoreDelta(
  score: import('./types').SectionScore,
  compareYears: import('./types').CompareYears,
): number {
  return getYearDelta(score.negative2024, score.negative2025, compareYears);
}

export function generateSecurityDotPlotInsight(
  confidenceItems: StatementComparisonItem[],
  concernItems: StatementComparisonItem[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  const topConcern = concernItems[0];
  const topConfidence = confidenceItems[0];

  if (topConcern && topConcern.value2025 >= 55) {
    return [
      { bold: topConcern.name },
      ' is the leading reported concern in ',
      { bold: year },
      ' at ',
      { bold: `${topConcern.value2025.toFixed(1)}%`, tone: 'negative' },
      ' agreement.',
    ];
  }

  if (topConfidence) {
    return [
      { bold: topConfidence.name },
      ' is the strongest confidence signal in ',
      { bold: year },
      ' at ',
      { bold: `${topConfidence.value2025.toFixed(1)}%`, tone: 'positive' },
      ' agreement.',
    ];
  }

  return ['No Q401 security statements are available for this view.'];
}

export function getSecurityKpiSentence(
  metric: 'score' | 'movingSafe' | 'policeTrust' | 'jobSecurity',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong security and safety satisfaction overall.'
        : value >= 50
          ? 'Moderate security and safety satisfaction.'
          : 'Security and safety satisfaction needs improvement.';
    case 'movingSafe':
      return value >= 70
        ? 'Most residents feel safe moving around day and night.'
        : value >= 50
          ? 'Day and night mobility safety perception is moderate.'
          : 'Many residents do not feel safe moving around.';
    case 'policeTrust':
      return value >= 70
        ? 'Strong trust in Abu Dhabi Police handling local incidents.'
        : value >= 50
          ? 'Moderate trust in police response capabilities.'
          : 'Trust in police incident handling needs strengthening.';
    case 'jobSecurity':
      return value >= 70
        ? 'Most residents feel job security in Abu Dhabi.'
        : value >= 50
          ? 'Job security perception is moderate.'
          : 'Job security concerns are elevated among residents.';
  }
}

type HealthAssessmentDef = { match: RegExp; short: string };

const HEALTH_SERVICE_ASSESSMENT: HealthAssessmentDef[] = [
  { match: /how close the health facility/i, short: 'Facility proximity to home' },
  { match: /health system in general in government health facilities/i, short: 'Govt. health system' },
  { match: /health system in general in private health facilities/i, short: 'Private health system' },
  { match: /treatment of pharmacy staff/i, short: 'Pharmacy staff treatment' },
  {
    match: /quality of health services provided in private health facilities/i,
    short: 'Private health service quality',
  },
  { match: /prices of health services within hospitals/i, short: 'Hospital service prices' },
  { match: /drug prices in hospitals/i, short: 'Hospital drug prices' },
  { match: /prices of medicines in pharmacies/i, short: 'Pharmacy medicine prices' },
  { match: /national vaccination program/i, short: 'Vaccination program fairness' },
  { match: /justice in the distribution of health system services/i, short: 'Fair health service access' },
];

const HEALTH_SYSTEM_ASSESSMENT: HealthAssessmentDef[] = [
  { match: /cleanliness in general/i, short: 'Cleanliness in general' },
  { match: /treatment of register\/counter staff/i, short: 'Registry/counter staff' },
  { match: /treatment and services of doctors/i, short: 'Doctors & services' },
  { match: /treatment of pharmacy staff/i, short: 'Pharmacy staff treatment' },
  { match: /waiting time/i, short: 'Waiting time (queue)' },
  { match: /review dates/i, short: 'Follow-up appointments' },
  { match: /specialty clinics/i, short: 'Specialty clinics' },
  { match: /sanitary facilities|bathrooms/i, short: 'Health facility bathrooms' },
  { match: /rapid response to emergency/i, short: 'Emergency response speed' },
  { match: /laboratory readiness/i, short: 'Laboratory readiness' },
  { match: /radiology and imaging readiness/i, short: 'Radiology & imaging readiness' },
];

function findRatingQuestion(
  questions: import('./types').Question[],
  code: string,
  matcher: RegExp,
): import('./types').LikertQuestion | undefined {
  return questions
    .filter(isLikert)
    .find((q) => q.code === code && matcher.test(q.statementEn ?? q.statementAr));
}

function getHealthAssessmentChartData(
  questions: import('./types').Question[],
  code: 'Q502' | 'Q501',
  defs: HealthAssessmentDef[],
  year: import('./types').SurveyYear,
): IncomeChartRow[] {
  return defs
    .map((def) => {
      const question = findRatingQuestion(questions, code, def.match);
      if (!question) return null;
      const fullName = question.statementEn ?? question.statementAr;
      return {
        name: def.short,
        fullName,
        value2024: question.data['2024']?.agreement ?? 0,
        value2025: question.data['2025']?.agreement ?? 0,
        value: question.data[year]?.agreement ?? 0,
      };
    })
    .filter((row): row is IncomeChartRow => row != null)
    .sort(
      (a, b) =>
        pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
    );
}

export function getHealthServiceAssessmentData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getHealthAssessmentChartData(questions, 'Q502', HEALTH_SERVICE_ASSESSMENT, year);
}

export function getHealthSystemAssessmentData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getHealthAssessmentChartData(questions, 'Q501', HEALTH_SYSTEM_ASSESSMENT, year);
}

export function classifyHealthAssessmentTier(value: number): 'good' | 'acceptable' | 'bad' {
  if (value >= 60) return 'good';
  if (value >= 50) return 'acceptable';
  return 'bad';
}

function averageHealthAssessmentScore(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + pickYearValue(row.value2024, row.value2025, year), 0) / rows.length;
}

export function getHealthAssessmentBadgeScore(
  rows: IncomeChartRow[],
  rows2024: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  const current = averageHealthAssessmentScore(rows, year);
  if (mode === 'current') return current;
  return current - averageHealthAssessmentScore(rows2024, '2024');
}

function sumCategoryValues(
  questions: import('./types').Question[],
  code: string,
  matchers: RegExp[],
  year: '2024' | '2025',
): number {
  const items = getCategoryByQuestion(questions, code);
  return matchers.reduce((sum, matcher) => {
    const item = items.find((q) => matcher.test(q.categoryEn ?? q.categoryAr));
    return sum + (item?.data[year] ?? 0);
  }, 0);
}

function toNormalizedSentimentRow(
  name: string,
  fullName: string,
  negative: number,
  neutral: number,
  positive: number,
): EducationSentimentRow {
  const total = negative + neutral + positive;
  const scale = total > 0 ? 100 / total : 0;
  return {
    name,
    fullName,
    dissatisfied: negative * scale,
    neutral: neutral * scale,
    satisfied: positive * scale,
  };
}

export function getHealthCurrentHealthGoodPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return sumCategoryValues(questions, 'Q504', [/^Good$/i, /^Very good$/i, /^Excellent$/i], year);
}

export function getHealthPhysicalActivityHours(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  const q = questions.find(
    (item): item is import('./types').MeanQuestion => isMean(item) && item.code === 'Q512',
  );
  if (!q) return 0;
  return (q.data[year] ?? 0) / 60;
}

export function getHealthSleepQualityGoodPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return sumCategoryValues(questions, 'Q505', [/^good$/i, /^very good$/i], year);
}

export function getHealthEmotionalStressData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  const low = sumCategoryValues(questions, 'Q509', [/^0$/, /^1$/, /^2$/, /^3$/], year);
  const moderate = sumCategoryValues(questions, 'Q509', [/^4$/, /^5$/, /^6$/], year);
  const high = sumCategoryValues(questions, 'Q509', [/^7$/, /^8$/, /^9$/, /^10$/], year);
  return [
    toNormalizedSentimentRow(
      'Emotional stress',
      'During the past 4 weeks, on a scale of 0-10 what was your level of emotional stress?',
      high,
      moderate,
      low,
    ),
  ];
}

export function getHealthHealthyEatingData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  const never = sumCategoryValues(questions, 'Q510', [/^never$/i, /^rarely$/i], year);
  const sometimes = sumCategoryValues(questions, 'Q510', [/^sometimes$/i], year);
  const allTheTime = sumCategoryValues(
    questions,
    'Q510',
    [/^Most of the time$/i, /^All the time$/i],
    year,
  );
  return [
    toNormalizedSentimentRow(
      'Healthy eating',
      'How often do you think you eat healthy meals?',
      never,
      sometimes,
      allTheTime,
    ),
  ];
}

export function getHealthChronicDiseaseData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  const yes = sumCategoryValues(questions, 'Q506', [/^Yes$/i], year);
  const no = sumCategoryValues(questions, 'Q506', [/^no$/i], year);
  return [
    toNormalizedSentimentRow(
      'Chronic conditions',
      'Do you suffer from any diseases or chronic health problems?',
      no,
      0,
      yes,
    ),
  ];
}

export function getHealthTabChartBadgeScore(
  rows: EducationSentimentRow[],
  rows2024: EducationSentimentRow[],
  mode: ViewMode,
): number {
  return getEducationTabChartBadgeScore(rows, rows2024, mode);
}

export function getHealthKpiSentence(
  metric: 'score' | 'currentHealth' | 'activity' | 'sleep',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong health satisfaction overall.'
        : value >= 50
          ? 'Moderate health satisfaction.'
          : 'Health satisfaction needs improvement.';
    case 'currentHealth':
      return value >= 70
        ? 'Most residents rate their current health as good.'
        : value >= 50
          ? 'Views on current personal health are mixed.'
          : 'Many residents do not feel their health is good.';
    case 'activity':
      return value >= 1
        ? 'Residents report meaningful daily physical activity.'
        : value >= 0.5
          ? 'Daily physical activity levels are moderate.'
          : 'Daily physical activity time remains low.';
    case 'sleep':
      return value >= 70
        ? 'Most residents rate their sleep quality as good.'
        : value >= 50
          ? 'Sleep quality perception is moderate.'
          : 'Many residents report poor sleep quality.';
  }
}

const ENVIRONMENT_KPI_STATEMENT = {
  cleanliness: /cleanliness of the neighborhood in my residential area/i,
  airQuality: /air quality in the residential area/i,
  noiseLevel: /noise level in my residential area/i,
} as const;

const ENVIRONMENT_CHART_STATEMENTS = {
  insectsRodents: {
    match: /insects and some rodents constantly appear/i,
    short: 'Insects and rodents in living areas',
  },
  serviceFacilities: {
    match: /quality of service facilities, such as gardens, parks, and public facilities/i,
    short: 'Service facilities quality',
  },
  internalRoadServices: {
    match: /quality of internal road services such as sidewalks, street lighting, parking lots, and walkways/i,
    short: 'Internal road services',
  },
  urbanPlanning: {
    match: /urban planning of the city/i,
    short: 'Urban planning satisfaction',
  },
} as const;

export function getEnvironmentCleanlinessPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, ENVIRONMENT_KPI_STATEMENT.cleanliness, year);
}

export function getEnvironmentAirQualityPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, ENVIRONMENT_KPI_STATEMENT.airQuality, year);
}

export function getEnvironmentNoiseLevelPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, ENVIRONMENT_KPI_STATEMENT.noiseLevel, year);
}

export function getEnvironmentInsectsRodentsData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [ENVIRONMENT_CHART_STATEMENTS.insectsRodents]);
}

export function getEnvironmentServiceFacilitiesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [ENVIRONMENT_CHART_STATEMENTS.serviceFacilities]);
}

export function getEnvironmentInternalRoadServicesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [ENVIRONMENT_CHART_STATEMENTS.internalRoadServices]);
}

export function getEnvironmentUrbanPlanningData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationLikertScaleRow[] {
  return getEducationLikertScaleRows(questions, year, [ENVIRONMENT_CHART_STATEMENTS.urbanPlanning]);
}

const INFRASTRUCTURE_KPI_STATEMENT = {
  waterElectricity: /satisfied with the level of water and electricity services/i,
  gasStations: /availability of gas stations in my residential area/i,
  shopping: /commercial stores and shopping centers are available or close/i,
} as const;

const INFRASTRUCTURE_CHART_STATEMENTS = {
  mentalHealthServices: {
    match: /availability of mental health and addiction prevention and treatment services/i,
    short: 'Mental health & addiction services',
  },
  sportsFacilities: {
    match: /playgrounds for practicing different types of sports/i,
    short: 'Sports facilities availability',
  },
} as const;

const INFRASTRUCTURE_TOP_ISSUE_EXCLUSIONS = new Set(['No issues']);

const INFRASTRUCTURE_TOP_ISSUE_LABELS: Record<string, string> = {
  'Financial problems and high cost of living': 'Financial strain & cost of living',
  'drug addiction': 'Drug addiction',
  'Narrow housing, the need for maintenance, and poor sanitation': 'Poor housing, maintenance & sanitation',
  'Fear for children from bad companions': 'Fear for children from bad influences',
  'Divorce and family disintegration': 'Divorce & family breakdown',
  'Traffic congestion and constant inconvenience': 'Traffic congestion & constant noise',
  Debts: 'Debt',
  Unemployment: 'Unemployment',
  'Lack of awareness centers, entertainment services, and Qur’an memorization centers':
    'Lack of awareness, recreation & Quran centers',
  'Bullying and physical assault': 'Bullying & physical assault',
  'There is a large presence of workers near family homes': 'Worker overcrowding near homes',
  'Long time at work and school': 'Long work & school hours',
  Smoking: 'Smoking',
  'Lack of health centers and long waiting times for appointments': 'Few health centers & long waits',
  'Lack of job opportunities': 'Lack of job opportunities',
  'Quality of education in Al Falah area': 'Education quality in Al-Falah',
  'Too many insects': 'Insect infestation',
  'Drinking alcohol': 'Alcohol consumption',
  'Internet problems/social media/harmful electronic content': 'Harmful online & social media content',
  'Problems associated with public services': 'Public service problems',
  'Breeding animals/dogs/stray animals': 'Pets, dogs & stray animals',
  'Cleanliness/waste/neighborhood infrastructure problems': 'Cleanliness, waste & infrastructure',
  'Crimes/theft/harassment/electronic crimes': 'Crime, theft & harassment',
  'Mental health': 'Mental health',
};

const INFRASTRUCTURE_NEEDED_FACILITY_EXCLUSIONS = new Set(['Everything is available']);

const INFRASTRUCTURE_NEEDED_FACILITY_LABELS: Record<string, string> = {
  'Recreational facilities (gardens, jogging path, bicycle paths, youth playgrounds, sports clubs)':
    'Recreational facilities (parks, tracks, clubs)',
  'Commercial stores and shopping centers': 'Shops & shopping centers',
  'Mosques and centers for memorizing the Qur’an': 'Mosques & Quran centers',
  'Government service centers (police station, civil defense, social support center, municipality, public transportation, gas stations, public parking, technological services)':
    'Government service centers',
  'Health facilities (specialized clinics, government and private hospitals)':
    'Health facilities (clinics & hospitals)',
  'Educational facilities and nurseries': 'Educational facilities & nurseries',
  'Community centers to support family cohesion': 'Family cohesion community centers',
  'Centers for social and professional activities': 'Social & vocational activity centers',
  'Planting and getting rid of insects': 'Afforestation & pest control',
  'Prevention and treatment centers for mental health and addiction':
    'Mental health & addiction centers',
};

export function getInfrastructureWaterElectricityPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, INFRASTRUCTURE_KPI_STATEMENT.waterElectricity, year);
}

export function getInfrastructureGasStationsPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, INFRASTRUCTURE_KPI_STATEMENT.gasStations, year);
}

export function getInfrastructureShoppingPercent(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): number {
  return getEducationLikertAgreement(questions, INFRASTRUCTURE_KPI_STATEMENT.shopping, year);
}

export function getInfrastructureTopIssuesData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q802')
    .filter((q) => !INFRASTRUCTURE_TOP_ISSUE_EXCLUSIONS.has(q.categoryEn ?? ''))
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = INFRASTRUCTURE_TOP_ISSUE_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getInfrastructureNeededFacilitiesData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  return getCategoryByQuestion(questions, 'Q803')
    .filter((q) => !INFRASTRUCTURE_NEEDED_FACILITY_EXCLUSIONS.has(q.categoryEn ?? ''))
    .map((q) => {
      const fullName = translateLabel(q.categoryEn ?? q.categoryAr);
      const shortName = INFRASTRUCTURE_NEEDED_FACILITY_LABELS[q.categoryEn ?? ''] ?? fullName;
      return {
        name: shortName,
        fullName,
        value2024: q.data['2024'] ?? 0,
        value2025: q.data['2025'] ?? 0,
        value: q.data[year] ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function getInfrastructureMentalHealthServicesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [INFRASTRUCTURE_CHART_STATEMENTS.mentalHealthServices]);
}

export function getInfrastructureSportsFacilitiesData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [INFRASTRUCTURE_CHART_STATEMENTS.sportsFacilities]);
}

export function getInfrastructureRankedBarBadgeScore(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  const top = [...rows].sort(
    (a, b) => pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
  )[0];
  if (!top) return 0;
  if (mode === 'current') return pickYearValue(top.value2024, top.value2025, year);
  return top.value2025 - top.value2024;
}

export function getInfrastructureKpiSentence(
  metric: 'score' | 'waterElectricity' | 'gasStations' | 'shopping',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong infrastructure satisfaction overall.'
        : value >= 50
          ? 'Moderate infrastructure satisfaction.'
          : 'Infrastructure satisfaction needs improvement.';
    case 'waterElectricity':
      return value >= 70
        ? 'Most residents are satisfied with water and electricity services.'
        : value >= 50
          ? 'Water and electricity satisfaction is moderate.'
          : 'Water and electricity service concerns are elevated.';
    case 'gasStations':
      return value >= 70
        ? 'Most residents are satisfied with gas station availability.'
        : value >= 50
          ? 'Gas station availability satisfaction is moderate.'
          : 'Gas station availability concerns are elevated.';
    case 'shopping':
      return value >= 70
        ? 'Most residents are satisfied with shops and shopping centers.'
        : value >= 50
          ? 'Shopping availability satisfaction is moderate.'
          : 'Shopping availability concerns are elevated.';
  }
}

export function generateInfrastructureRankedBarInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
  topic = 'issue',
): InsightPart[] {
  const top = [...rows].sort(
    (a, b) => pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
  )[0];
  if (!top) return [`Ranked ${topic} responses will appear once survey data is available.`];

  const isFacilityNeed = topic === 'facility need';

  if (mode === 'yoy') {
    const biggestShift = [...rows].sort(
      (a, b) => Math.abs(b.value2025 - b.value2024) - Math.abs(a.value2025 - a.value2024),
    )[0];
    const change = biggestShift.value2025 - biggestShift.value2024;
    if (isFacilityNeed) {
      return [
        { bold: biggestShift.name },
        ' moved most (',
        { bold: formatDelta(change) },
        '); ',
        { bold: top.name },
        ' leads.',
      ];
    }
    return [
      { bold: biggestShift.name },
      ' shifted most at ',
      { bold: formatDelta(change) },
      ' while ',
      { bold: top.name },
      ` remains the top cited ${topic}.`,
    ];
  }

  if (isFacilityNeed) {
    return [
      { bold: top.name },
      ' leads at ',
      { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
      '.',
    ];
  }

  return [
    { bold: top.name },
    ` is the top cited ${topic} at `,
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' of responses.',
  ];
}

const INFRASTRUCTURE_Q801_SHORT_LABELS: Array<{ match: RegExp; label: string }> = [
  { match: /places of worship/i, label: 'Places of worship' },
  { match: /public squares and parks/i, label: 'Parks & public squares' },
  { match: /recreational areas/i, label: 'Recreational areas' },
  { match: /security and safety standards in children/i, label: 'Playground safety standards' },
  { match: /playgrounds for practicing different types of sports/i, label: 'Sports facilities' },
  { match: /satisfied with the level of water and electricity/i, label: 'Water & electricity' },
  { match: /availability of gas stations/i, label: 'Gas stations' },
  { match: /commercial stores and shopping centers/i, label: 'Shops & shopping centers' },
  { match: /government service centers/i, label: 'Government service centers' },
  { match: /health facilities/i, label: 'Health facilities' },
  { match: /educational facilities and nurseries/i, label: 'Schools & nurseries' },
  { match: /mental health and addiction/i, label: 'Mental health services' },
  { match: /public transportation/i, label: 'Public transportation' },
  { match: /technological services/i, label: 'Technological services' },
  { match: /public parking/i, label: 'Public parking' },
  { match: /mosques and centers for memorizing/i, label: 'Mosques & Quran centers' },
  { match: /community centers to support family/i, label: 'Family community centers' },
  { match: /centers for social and professional/i, label: 'Social & vocational centers' },
  { match: /planting and getting rid of insects/i, label: 'Afforestation & pest control' },
  { match: /internal roads/i, label: 'Internal roads' },
  { match: /street lighting/i, label: 'Street lighting' },
  { match: /waste collection/i, label: 'Waste collection' },
  { match: /sewage and drainage/i, label: 'Sewage & drainage' },
];

function getInfrastructureQ801ShortLabel(statement: string): string {
  const match = INFRASTRUCTURE_Q801_SHORT_LABELS.find((entry) => entry.match.test(statement));
  return match?.label ?? truncateStatementLabel(statement, 32);
}

export function getInfrastructureStatementChanges(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q801')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getInfrastructureQ801ShortLabel(statement) };
    })
    .sort((a, b) => {
      const movementDiff = Math.abs(b.movement) - Math.abs(a.movement);
      if (movementDiff !== 0) return movementDiff;
      return b.value2025 - a.value2025;
    });
}

export function getInfrastructureServiceScorecard(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): WellbeingHeatmapRow[] {
  const services: { name: string; fullName: string; match: RegExp }[] = [
    {
      name: 'Water & electricity',
      fullName: 'Water and electricity services satisfaction',
      match: INFRASTRUCTURE_KPI_STATEMENT.waterElectricity,
    },
    {
      name: 'Gas stations',
      fullName: 'Gas station availability satisfaction',
      match: INFRASTRUCTURE_KPI_STATEMENT.gasStations,
    },
    {
      name: 'Shopping',
      fullName: 'Shops and shopping centers availability satisfaction',
      match: INFRASTRUCTURE_KPI_STATEMENT.shopping,
    },
    {
      name: 'Mental health',
      fullName: INFRASTRUCTURE_CHART_STATEMENTS.mentalHealthServices.short,
      match: INFRASTRUCTURE_CHART_STATEMENTS.mentalHealthServices.match,
    },
    {
      name: 'Sports facilities',
      fullName: INFRASTRUCTURE_CHART_STATEMENTS.sportsFacilities.short,
      match: INFRASTRUCTURE_CHART_STATEMENTS.sportsFacilities.match,
    },
  ];

  return services.map((service) => {
    const agreement2024 = getEducationLikertAgreement(questions, service.match, '2024');
    const agreement2025 = getEducationLikertAgreement(questions, service.match, '2025');
    return {
      name: service.name,
      fullName: service.fullName,
      agreement2024,
      agreement2025,
      movement: getYearDelta(agreement2024, agreement2025, compareYears),
    };
  });
}

export function generateInfrastructureStatementChangesInsight(
  items: StatementComparisonItem[],
  compareYears: import('./types').CompareYears,
): InsightPart[] {
  const topMover = items[0];
  if (!topMover) {
    return ['No Q801 infrastructure statement movement is available.'];
  }

  return [
    { bold: topMover.name },
    ' moved most at ',
    {
      bold: formatDelta(topMover.movement),
      tone: topMover.movement >= 0 ? 'positive' : 'negative',
    },
    ` between ${compareYears[0]} and ${compareYears[1]}.`,
  ];
}

export function generateInfrastructureServiceScorecardInsight(
  rows: WellbeingHeatmapRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  if (rows.length === 0) {
    return ['No infrastructure service-access data is available.'];
  }

  const ranked = [...rows].sort(
    (a, b) =>
      pickYearValue(b.agreement2024, b.agreement2025, year)
      - pickYearValue(a.agreement2024, a.agreement2025, year),
  );
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const topValue = pickYearValue(top.agreement2024, top.agreement2025, year);
  const bottomValue = pickYearValue(bottom.agreement2024, bottom.agreement2025, year);

  return [
    { bold: top.name },
    ' leads service access at ',
    { bold: `${topValue.toFixed(1)}%`, tone: 'positive' },
    '; ',
    { bold: bottom.name },
    ' is lowest at ',
    { bold: `${bottomValue.toFixed(1)}%` },
    '.',
  ];
}

export const HOUSING_KPI_STATEMENT = {
  spaceAdequacy: /size of the house is small or insufficient/i,
  maintenance: /residence needs repairs and maintenance/i,
  homeownership: /thinking of getting a private residence/i,
} as const;

const HOUSING_CHART_STATEMENTS = {
  ventilation: {
    match: /ventilation system in the residence is adequate/i,
    short: 'Ventilation adequacy',
  },
  naturalLighting: {
    match: /sun enters most parts of the residence on a daily basis/i,
    short: 'Natural lighting',
  },
  homeownershipPrice: {
    match: /Satisfied with home ownership prices in a residential area/i,
    short: 'Homeownership price satisfaction',
  },
} as const;

export type HousingDominantSentiment = {
  segment: 'agree' | 'neutral' | 'disagree';
  label: string;
  displayLabel: string;
  value: number;
};

export type HousingAccessibilityCategoryId = 'mobility' | 'bathroom' | 'safety';

const HOUSING_ACCESSIBILITY_GROUPS: Record<
  HousingAccessibilityCategoryId,
  { label: string; features: ReadonlyArray<{ match: RegExp; short: string }> }
> = {
  mobility: {
    label: 'Accessibility & Mobility',
    features: [
      { match: /bedroom on ground floor/i, short: 'Ground-Floor Bedroom' },
      { match: /floor of the house is non-slip/i, short: 'Non-Slip Flooring' },
      { match: /large corridors and entrances/i, short: 'Wide Corridors & Entrances' },
    ],
  },
  bathroom: {
    label: 'Accessible Bathroom Features',
    features: [
      { match: /iron bars.*toilet/i, short: 'Toilet Support Bars' },
      { match: /bathrooms equipped for people with special needs/i, short: 'Accessible Shower' },
      { match: /large shower room to accommodate a wheelchair/i, short: 'Wheelchair-Accessible Shower Room' },
      { match: /bathtub with a door/i, short: 'Walk-In Bathtub' },
    ],
  },
  safety: {
    label: 'Safety & Care Support',
    features: [
      { match: /personal emergency response system/i, short: 'Personal Emergency Response System' },
      { match: /private room for healthcare provider/i, short: 'Private Room for Caregiver' },
    ],
  },
};

export const HOUSING_SPACE_ADEQUACY_LABELS = {
  agree: 'Inadequate',
  neutral: 'Mixed views',
  disagree: 'Adequate',
} as const;

export const HOUSING_MAINTENANCE_LABELS = {
  agree: 'Needs maintenance',
  neutral: 'Mixed views',
  disagree: 'Well maintained',
} as const;

export const HOUSING_HOMEOWNERSHIP_LABELS = {
  agree: 'Planning to own',
  neutral: 'Undecided',
  disagree: 'Not planning',
} as const;

function getHousingLikertSentimentPercents(
  questions: import('./types').Question[],
  matcher: RegExp,
  year: '2024' | '2025',
): { agree: number; neutral: number; disagree: number } {
  const question = getLikertStatements(questions).find((q) => matcher.test(q.statementEn ?? q.statementAr));
  if (!question) return { agree: 0, neutral: 0, disagree: 0 };
  const breakdown = question.data[year]?.breakdown ?? {};
  const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
  const total = dissatisfied + neutral + satisfied;
  const scale = total > 0 ? 100 / total : 0;
  return {
    agree: satisfied * scale,
    neutral: neutral * scale,
    disagree: dissatisfied * scale,
  };
}

function getHousingDominantSentiment(
  questions: import('./types').Question[],
  matcher: RegExp,
  year: '2024' | '2025',
  displayLabels: { agree: string; neutral: string; disagree: string },
): HousingDominantSentiment {
  const { agree, neutral, disagree } = getHousingLikertSentimentPercents(questions, matcher, year);
  const segments: HousingDominantSentiment[] = [
    { segment: 'agree', label: 'Agree', displayLabel: displayLabels.agree, value: agree },
    { segment: 'neutral', label: 'Neutral', displayLabel: displayLabels.neutral, value: neutral },
    { segment: 'disagree', label: 'Disagree', displayLabel: displayLabels.disagree, value: disagree },
  ];
  return segments.sort((a, b) => b.value - a.value)[0];
}

export function getHousingSpaceAdequacySentiment(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): HousingDominantSentiment {
  return getHousingDominantSentiment(
    questions,
    HOUSING_KPI_STATEMENT.spaceAdequacy,
    year,
    HOUSING_SPACE_ADEQUACY_LABELS,
  );
}

export function getHousingMaintenanceSentiment(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): HousingDominantSentiment {
  return getHousingDominantSentiment(
    questions,
    HOUSING_KPI_STATEMENT.maintenance,
    year,
    HOUSING_MAINTENANCE_LABELS,
  );
}

export function getHousingHomeownershipSentiment(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): HousingDominantSentiment {
  return getHousingDominantSentiment(
    questions,
    HOUSING_KPI_STATEMENT.homeownership,
    year,
    HOUSING_HOMEOWNERSHIP_LABELS,
  );
}

export function getHousingDominantSentimentDelta(
  questions: import('./types').Question[],
  matcher: RegExp,
  displayLabels: { agree: string; neutral: string; disagree: string },
  compareYears: CompareYears,
): number {
  const previous = getHousingDominantSentiment(questions, matcher, compareYears[0], displayLabels);
  const current = getHousingDominantSentiment(questions, matcher, compareYears[1], displayLabels);
  if (previous.segment === current.segment) {
    return current.value - previous.value;
  }
  return current.value - previous.value;
}

export function getHousingAccessibilityData(
  questions: import('./types').Question[],
  category: HousingAccessibilityCategoryId,
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  const group = HOUSING_ACCESSIBILITY_GROUPS[category];
  const items = getCategoryByQuestion(questions, 'Q702');

  return group.features
    .map((feature) => {
      const question = items.find((q) => feature.match.test(q.categoryEn ?? q.categoryAr));
      if (!question) return null;
      const fullName = translateLabel(question.categoryEn ?? question.categoryAr);
      return {
        name: feature.short,
        fullName,
        value2024: question.data['2024'] ?? 0,
        value2025: question.data['2025'] ?? 0,
        value: question.data[year] ?? 0,
      };
    })
    .filter((row): row is IncomeChartRow => row != null)
    .sort((a, b) => b.value - a.value);
}

export function getHousingVentilationData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [HOUSING_CHART_STATEMENTS.ventilation]);
}

export function getHousingNaturalLightingData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [HOUSING_CHART_STATEMENTS.naturalLighting]);
}

export function getHousingHomeownershipPriceData(
  questions: import('./types').Question[],
  year: '2024' | '2025',
): EducationSentimentRow[] {
  return getEducationSentimentRows(questions, year, [HOUSING_CHART_STATEMENTS.homeownershipPrice]);
}

export function getHousingAccessibilityBadgeScore(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  if (rows.length === 0) return 0;
  const average =
    rows.reduce((sum, row) => sum + pickYearValue(row.value2024, row.value2025, year), 0) / rows.length;
  if (mode === 'current') return average;
  const average2024 =
    rows.reduce((sum, row) => sum + row.value2024, 0) / rows.length;
  const average2025 =
    rows.reduce((sum, row) => sum + row.value2025, 0) / rows.length;
  return average2025 - average2024;
}

export function getHousingKpiSentence(
  metric: 'score' | 'spaceAdequacy' | 'maintenance' | 'homeownership',
  value: number | HousingDominantSentiment,
): string {
  switch (metric) {
    case 'score': {
      const score = value as number;
      return score >= 70
        ? 'Strong housing satisfaction overall.'
        : score >= 50
          ? 'Moderate housing satisfaction.'
          : 'Housing satisfaction needs improvement.';
    }
    case 'spaceAdequacy': {
      const sentiment = value as HousingDominantSentiment;
      if (sentiment.displayLabel === 'Adequate') {
        return 'Most residents feel their housing space is adequate.';
      }
      if (sentiment.displayLabel === 'Inadequate') {
        return 'Many residents feel housing space is insufficient.';
      }
      return 'Resident views on housing space adequacy are mixed.';
    }
    case 'maintenance': {
      const sentiment = value as HousingDominantSentiment;
      if (sentiment.displayLabel === 'Needs maintenance') {
        return 'Many residents report their home needs repairs or maintenance.';
      }
      if (sentiment.displayLabel === 'Well maintained') {
        return 'Most residents feel their home is well maintained.';
      }
      return 'Resident views on housing maintenance needs are mixed.';
    }
    case 'homeownership': {
      const sentiment = value as HousingDominantSentiment;
      if (sentiment.displayLabel === 'Planning to own') {
        return 'Many residents are considering getting a home of their own.';
      }
      if (sentiment.displayLabel === 'Not planning') {
        return 'Most residents are not currently planning to get a private residence.';
      }
      return 'Resident views on homeownership intention are mixed.';
    }
  }
}

export function generateHousingAccessibilityInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
  categoryLabel = 'accessibility feature',
): InsightPart[] {
  if (rows.length === 0) {
    return ['Accessibility feature availability varies across survey responses.'];
  }

  const top = [...rows].sort(
    (a, b) => pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
  )[0];

  if (mode === 'yoy') {
    const change = top.value2025 - top.value2024;
    return [
      { bold: top.name },
      ` presence ${change >= 0 ? 'rose' : 'fell'} `,
      { bold: formatDelta(change) },
      ` to ${top.value2025.toFixed(1)}%.`,
    ];
  }

  return [
    { bold: top.name },
    ` is the most reported ${categoryLabel} at `,
    { bold: `${pickYearValue(top.value2024, top.value2025, year).toFixed(1)}%` },
    ' of residences.',
  ];
}

export function getEnvironmentKpiSentence(
  metric: 'score' | 'cleanliness' | 'airQuality' | 'noiseLevel',
  value: number,
): string {
  switch (metric) {
    case 'score':
      return value >= 70
        ? 'Strong environment satisfaction overall.'
        : value >= 50
          ? 'Moderate environment satisfaction.'
          : 'Environment satisfaction needs improvement.';
    case 'cleanliness':
      return value >= 70
        ? 'Most residents are satisfied with neighborhood cleanliness.'
        : value >= 50
          ? 'Neighborhood cleanliness satisfaction is moderate.'
          : 'Neighborhood cleanliness concerns are elevated.';
    case 'airQuality':
      return value >= 70
        ? 'Most residents are satisfied with local air quality.'
        : value >= 50
          ? 'Air quality satisfaction is moderate.'
          : 'Air quality concerns are elevated among residents.';
    case 'noiseLevel':
      return value >= 70
        ? 'Most residents are satisfied with neighborhood noise levels.'
        : value >= 50
          ? 'Noise level satisfaction is moderate.'
          : 'Neighborhood noise concerns are elevated.';
  }
}

export function generateHealthAssessmentInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  if (rows.length === 0) {
    return ['Healthcare ratings vary across survey items.'];
  }

  const top = rows[0];
  const topValue = pickYearValue(top.value2024, top.value2025, year);

  if (mode === 'yoy') {
    const change = top.value2025 - top.value2024;
    return [
      { bold: top.name },
      ' shows the largest ',
      { bold: formatDelta(change) },
      ' YoY shift.',
    ];
  }

  return [
    { bold: top.name },
    ' leads at ',
    { bold: `${topValue.toFixed(1)}%` },
    '.',
  ];
}

export function generateHealthChartInsight(
  sectionScore: import('./types').SectionScore,
  mode: ViewMode,
  heatmapRows: { agreement2025: number; agreement2024: number }[] = [],
): InsightPart[] {
  const satisfied = sectionScore.positive2025;
  const unsatisfied = sectionScore.negative2025;
  const score = sectionScore.score2025;

  if (mode === 'yoy' && heatmapRows.length > 0) {
    const best = [...heatmapRows].sort(
      (a, b) => (b.agreement2025 - b.agreement2024) - (a.agreement2025 - a.agreement2024),
    )[0];
    const direction = sectionScore.yoyChange >= 0 ? 'improved' : 'declined';
    return [
      { bold: 'Health satisfaction' },
      ` ${direction} `,
      { bold: formatDelta(sectionScore.yoyChange) },
      ' with agreement reaching ',
      { bold: `${best.agreement2025.toFixed(1)}%` },
      ' on the top statement.',
    ];
  }

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
  mode: ViewMode,
  data2024: { satisfied: number }[] = [],
): InsightPart[] {
  if (mode === 'yoy' && data2024.length > 0) {
    const bestIndex = data.reduce((best, row, index) => {
      const change = row.satisfied - (data2024[index]?.satisfied ?? 0);
      const bestChange = data[best].satisfied - (data2024[best]?.satisfied ?? 0);
      return change > bestChange ? index : best;
    }, 0);
    const change = data[bestIndex].satisfied - (data2024[bestIndex]?.satisfied ?? 0);
    return [
      { bold: 'Strongest improvement' },
      ' at ',
      { bold: formatDelta(change) },
      ' on the top-rated environment statement.',
    ];
  }
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

export function generatePillarCompositionInsight(
  items: PillarDumbbellItem[],
  mode: ViewMode,
  year: import('./types').SurveyYear,
): InsightPart[] {
  const approved = items.filter(
    (item) => item.status === 'approved' && item.value2024 != null && item.value2025 != null,
  );

  if (approved.length === 0) {
    return ['Approved pillar scores are not yet available for this composition view.'];
  }

  const leader = [...approved].sort((a, b) => (b.value2025 ?? 0) - (a.value2025 ?? 0))[0];
  const leaderValue = mode === 'yoy'
    ? leader.value2025!
    : (year === '2024' ? leader.value2024! : leader.value2025!);

  if (mode === 'yoy') {
    const improved = approved.filter((item) => (item.value2025 ?? 0) > (item.value2024 ?? 0)).length;
    return [
      { bold: leader.name },
      ' leads approved sections at ',
      { bold: `${leaderValue.toFixed(1)}%`, tone: leaderValue >= 70 ? 'positive' : undefined },
      '; ',
      { bold: String(improved) },
      ' of ',
      { bold: String(approved.length) },
      ' sections improved year on year.',
    ];
  }

  return [
    { bold: leader.name },
    ' leads at ',
    { bold: `${leaderValue.toFixed(1)}%`, tone: leaderValue >= 70 ? 'positive' : undefined },
    ' across ',
    { bold: String(approved.length) },
    ' approved sections.',
  ];
}

export function generateMomentumMatrixInsight(
  items: MomentumMatrixItem[],
  viewMode: ViewMode,
): InsightPart[] {
  if (items.length === 0) {
    return ['No approved pillar momentum data is available for this matrix.'];
  }

  const leader = [...items].sort((a, b) => b.score2025 - a.score2025)[0];
  const scaleCount = items.filter((item) => item.quadrant === 'scale').length;
  const investigateCount = items.filter((item) => item.quadrant === 'investigate').length;

  if (viewMode === 'yoy') {
    return [
      { bold: String(scaleCount) },
      ' pillars sit in the ',
      { bold: 'Scale' },
      ' quadrant, led by ',
      { bold: leader.pillar },
      ' at ',
      { bold: `${leader.score2025.toFixed(1)}%` },
      '; ',
      { bold: String(investigateCount) },
      ' need investigation.',
    ];
  }

  return [
    { bold: leader.pillar },
    ' holds the largest approved share at ',
    { bold: `${leader.score2025.toFixed(1)}%` },
    ' across ',
    { bold: String(items.length) },
    ' pillars.',
  ];
}

export function generateResidualRiskRegisterInsight(
  items: RiskRegisterItem[],
  year: import('./types').SurveyYear,
  isYoY: boolean,
): InsightPart[] {
  const available = items.filter((item) => item.status === 'available');
  if (available.length === 0) {
    return ['Residual risk indicators are pending for approved pillars in this register.'];
  }

  const ranked = [...available]
    .filter((item) => pickYearValue(item.negative2024, item.negative2025, year) != null)
    .sort(
      (left, right) =>
        (pickYearValue(right.negative2024, right.negative2025, year) ?? 0)
        - (pickYearValue(left.negative2024, left.negative2025, year) ?? 0),
    );
  const highest = ranked[0];

  if (!highest) {
    return [
      { bold: String(available.length) },
      ' approved pillars are tracked in the residual risk register.',
    ];
  }

  const concern = pickYearValue(highest.negative2024, highest.negative2025, year)!;
  const worsening = isYoY
    ? available.filter((item) => (item.yoyChange ?? 0) > 0).length
    : 0;

  if (isYoY && worsening > 0) {
    return [
      { bold: highest.pillar },
      ' shows the highest concern at ',
      { bold: `${concern.toFixed(1)}%`, tone: concern >= 20 ? 'negative' : undefined },
      '; ',
      { bold: String(worsening) },
      ' pillars show rising negative indicators.',
    ];
  }

  return [
    { bold: highest.pillar },
    ' shows the highest residual concern at ',
    { bold: `${concern.toFixed(1)}%`, tone: concern >= 20 ? 'negative' : undefined },
    ' across ',
    { bold: String(available.length) },
    ' tracked pillars.',
  ];
}

export function generateStatementRegisterInsight(
  rows: StatementRegisterRow[],
  questionLabel: string,
): InsightPart[] {
  if (rows.length === 0) {
    return [`No ${questionLabel} statements are available in this register.`];
  }

  const positiveRows = rows.filter((row) => row.polarity === 'positive');
  const riskRows = rows.filter((row) => row.polarity === 'negative');
  const topPositive = [...positiveRows].sort((left, right) => right.agreement2025 - left.agreement2025)[0];
  const topRisk = [...riskRows].sort((left, right) => right.agreement2025 - left.agreement2025)[0];

  if (topRisk && topRisk.agreement2025 >= 25) {
    return [
      'Highest risk signal at ',
      { bold: `${topRisk.agreement2025.toFixed(1)}%`, tone: 'negative' },
      ' agreement; ',
      { bold: String(positiveRows.length) },
      ' positive and ',
      { bold: String(riskRows.length) },
      ' risk statements tracked in ',
      { bold: questionLabel },
      '.',
    ];
  }

  if (topPositive) {
    return [
      'Strongest positive signal at ',
      { bold: `${topPositive.agreement2025.toFixed(1)}%`, tone: topPositive.agreement2025 >= 70 ? 'positive' : undefined },
      ' agreement across ',
      { bold: String(rows.length) },
      ' ',
      { bold: questionLabel },
      ' statements.',
    ];
  }

  return [
    { bold: String(rows.length) },
    ' statements are tracked in the ',
    { bold: questionLabel },
    ' register.',
  ];
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function pickYearValue<T>(value2024: T, value2025: T, year: SurveyYear): T {
  return year === '2025' ? value2025 : value2024;
}

export function normalizeCompareYears(years: SurveyYear[]): CompareYears | null {
  if (years.length !== 2) return null;
  const sorted = [...years].sort() as SurveyYear[];
  return [sorted[0], sorted[1]];
}

export function getYearDelta(
  value2024: number,
  value2025: number,
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): number {
  return pickYearValue(value2024, value2025, compareYears[1]) - pickYearValue(value2024, value2025, compareYears[0]);
}

export function formatCompareYearsLabel(compareYears: CompareYears): string {
  return `${compareYears[0]}→${compareYears[1]}`;
}

export function getScoreValue(
  score: SectionScore,
  mode: ViewMode,
  year: SurveyYear = '2025',
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): number {
  if (mode === 'yoy') return getYearDelta(score.score2024, score.score2025, compareYears);
  return pickYearValue(score.score2024, score.score2025, year);
}

export function getPositiveValue(
  score: SectionScore,
  mode: ViewMode,
  year: SurveyYear = '2025',
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): number {
  if (mode === 'yoy') return getYearDelta(score.positive2024, score.positive2025, compareYears);
  return pickYearValue(score.positive2024, score.positive2025, year);
}

export function getNegativeValue(
  score: SectionScore,
  mode: ViewMode,
  year: SurveyYear = '2025',
  compareYears: CompareYears = DEFAULT_COMPARE_YEARS,
): number {
  if (mode === 'yoy') return getYearDelta(score.negative2024, score.negative2025, compareYears);
  return pickYearValue(score.negative2024, score.negative2025, year);
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
  year: import('./types').SurveyYear = '2025',
) {
  return items
    .map((q) => ({
      name: translateLabel(q.categoryEn ?? q.categoryAr),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
      value:
        mode === 'current'
          ? (q.data[year] ?? 0)
          : (q.data['2025'] ?? 0) - (q.data['2024'] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const DEMOGRAPHICS_AGE_EXCLUSIONS = new Set(['Not mentioned', 'لم يذكر']);

const DEMOGRAPHICS_MARITAL_KEYS = ['married', 'absolute', 'A widower', 'bachelor'] as const;

const DEMOGRAPHICS_MARITAL_LABELS: Record<string, string> = {
  married: 'Married',
  absolute: 'Divorced',
  'A widower': 'Widowed',
  bachelor: 'Single',
  متزوج: 'Married',
  مطلق: 'Divorced',
  أرمل: 'Widowed',
  أعزب: 'Single',
};

const DEMOGRAPHICS_INCOME_ORDER = [
  'Less than 5000 dirhams',
  '5000-10000 dirhams',
  '10,001-20,000 dirhams',
  '20,001-30,000 dirhams',
  '30,001-50,000 dirhams',
  'More than 50,000 dirhams',
] as const;

const DEMOGRAPHICS_INCOME_LABELS: Record<string, string> = {
  '10,001-20,000 dirhams': '10,001-20,000',
  '20,001-30,000 dirhams': '20,001-30,000',
  '30,001-50,000 dirhams': '30,001-50,000',
  '5000-10000 dirhams': '5,000-10,000',
  'Less than 5000 dirhams': 'Less than 5,000',
  'More than 50,000 dirhams': 'More than 50,000',
};

export function getDemographicsMeanValue(
  questions: import('./types').Question[],
  code: 'Q914' | 'Q915',
  year: import('./types').SurveyYear,
): number {
  const q = questions.find(
    (item): item is import('./types').MeanQuestion =>
      isMean(item) && item.code === code && item.dimensionAr === 'الإجمالي',
  );
  return q?.data[year] ?? 0;
}

export function getDemographicsTopCategory(
  questions: import('./types').Question[],
  code: string,
  year: import('./types').SurveyYear,
  excludeCategories: Set<string> = DEMOGRAPHICS_AGE_EXCLUSIONS,
  formatLabel?: (categoryEn: string | undefined, categoryAr: string) => string,
): { name: string; value: number; value2024: number; value2025: number } | null {
  const items = getCategoryByQuestion(questions, code)
    .filter((q) => !excludeCategories.has(q.categoryEn ?? '') && !excludeCategories.has(q.categoryAr))
    .map((q) => ({
      name: formatLabel
        ? formatLabel(q.categoryEn, q.categoryAr)
        : translateLabel(q.categoryEn ?? q.categoryAr),
      value2024: q.data['2024'] ?? 0,
      value2025: q.data['2025'] ?? 0,
      value: q.data[year] ?? 0,
    }))
    .sort((a, b) => b.value - a.value);

  return items[0] ?? null;
}

function getDemographicsBinaryDonutData(
  questions: import('./types').Question[],
  code: string,
  year: import('./types').SurveyYear,
  positiveMatchers: RegExp[],
  negativeMatchers: RegExp[],
  name: string,
  fullName: string,
): EducationSentimentRow[] {
  const positive = sumCategoryValues(questions, code, positiveMatchers, year);
  const negative = sumCategoryValues(questions, code, negativeMatchers, year);
  return [toNormalizedSentimentRow(name, fullName, negative, 0, positive)];
}

export function getDemographicsGenderData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): EducationSentimentRow[] {
  return getDemographicsBinaryDonutData(
    questions,
    'Q902',
    year,
    [/^male$/i, /^ذكر$/],
    [/^feminine$/i, /^female$/i, /^أنثى$/],
    'Gender',
    'Sex distribution among residents',
  );
}

export function getDemographicsCitizenshipData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): EducationSentimentRow[] {
  return getDemographicsBinaryDonutData(
    questions,
    'Q905',
    year,
    [/^Emirati$/i, /^إماراتي$/],
    [/^Non-Emirati$/i, /^غير إماراتي$/],
    'Citizenship',
    'Citizenship distribution among residents',
  );
}

export function getDemographicsMaritalChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  const items = getCategoryByQuestion(questions, 'Q904');
  return DEMOGRAPHICS_MARITAL_KEYS.map((key) => {
    const item = items.find((q) => (q.categoryEn ?? q.categoryAr) === key);
    const label = DEMOGRAPHICS_MARITAL_LABELS[key] ?? key;
    return {
      name: label,
      fullName: label,
      value2024: item?.data['2024'] ?? 0,
      value2025: item?.data['2025'] ?? 0,
      value: item?.data[year] ?? 0,
    };
  });
}

export function getDemographicsIncomeChartData(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear = '2025',
): IncomeChartRow[] {
  const items = getCategoryByQuestion(questions, 'Q909');
  return DEMOGRAPHICS_INCOME_ORDER.map((key) => {
    const item = items.find((q) => (q.categoryEn ?? q.categoryAr) === key);
    const label = DEMOGRAPHICS_INCOME_LABELS[key] ?? key;
    return {
      name: label,
      fullName: label,
      value2024: item?.data['2024'] ?? 0,
      value2025: item?.data['2025'] ?? 0,
      value: item?.data[year] ?? 0,
    };
  });
}

function getDemographicsDonutDominantShare(row: EducationSentimentRow | undefined): number {
  if (!row) return 0;
  return Math.max(row.satisfied, row.dissatisfied);
}

function getDemographicsTopIncomeShare(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => pickYearValue(row.value2024, row.value2025, year)));
}

function getDemographicsTopMaritalShare(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => pickYearValue(row.value2024, row.value2025, year)));
}

export function getDemographicsChartBadgeScore(
  score2025: number,
  score2024: number,
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  if (mode === 'yoy') return score2025 - score2024;
  return year === '2025' ? score2025 : score2024;
}

export function getDemographicsDonutBadgeScore(
  rows: EducationSentimentRow[],
  rows2024: EducationSentimentRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  const share2025 = getDemographicsDonutDominantShare(rows[0]);
  const share2024 = getDemographicsDonutDominantShare(rows2024[0]);
  return getDemographicsChartBadgeScore(share2025, share2024, mode, year);
}

export function getDemographicsDistributionBadgeScore(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  const share2025 = getDemographicsTopMaritalShare(rows, '2025');
  const share2024 = getDemographicsTopMaritalShare(rows, '2024');
  return getDemographicsChartBadgeScore(share2025, share2024, mode, year);
}

export function getDemographicsIncomeBadgeScore(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  const share2025 = getDemographicsTopIncomeShare(rows, '2025');
  const share2024 = getDemographicsTopIncomeShare(rows, '2024');
  return getDemographicsChartBadgeScore(share2025, share2024, mode, year);
}

export function getDemographicsKpiSentence(
  metric: 'familySize' | 'workingMembers' | 'ageGroup' | 'education',
  value: number,
): string {
  switch (metric) {
    case 'familySize':
      return value >= 4
        ? 'Larger-than-average household size.'
        : value >= 3
          ? 'Typical household size for the district.'
          : 'Smaller household size on average.';
    case 'workingMembers':
      return value >= 2
        ? 'Multiple earners support each household.'
        : value >= 1
          ? 'At least one working member per household on average.'
          : 'Limited working members per household.';
    case 'ageGroup':
      return value >= 35
        ? 'The dominant age segment in the district.'
        : value >= 25
          ? 'A major age segment in the district.'
          : 'A notable share of residents fall in this bracket.';
    case 'education':
      return value >= 35
        ? 'The most common qualification among residents.'
        : value >= 25
          ? 'A widely held qualification in the district.'
          : 'A notable share of residents hold this level.';
  }
}

export function generateDemographicsBinaryInsight(
  row: EducationSentimentRow | undefined,
  positiveLabel: string,
  negativeLabel: string,
  mode: ViewMode,
  row2024?: EducationSentimentRow,
): InsightPart[] {
  if (!row) return ['Resident profile data varies across survey responses.'];

  if (mode === 'yoy' && row2024) {
    const change = row.satisfied - row2024.satisfied;
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: positiveLabel },
      ` share ${direction} `,
      { bold: formatDelta(change) },
      ` to ${row.satisfied.toFixed(1)}%.`,
    ];
  }

  const dominantLabel = row.satisfied >= row.dissatisfied ? positiveLabel : negativeLabel;
  const dominantValue = Math.max(row.satisfied, row.dissatisfied);
  return [
    { bold: dominantLabel },
    ' represent the largest share at ',
    { bold: `${dominantValue.toFixed(1)}%` },
    '.',
  ];
}

export function generateDemographicsMaritalInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  if (rows.length === 0) return ['Marital status distribution varies across survey responses.'];

  const top = [...rows].sort(
    (a, b) => pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
  )[0];

  if (mode === 'yoy') {
    const change = top.value2025 - top.value2024;
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: top.name },
      ` share ${direction} `,
      { bold: formatDelta(change) },
      ` to ${top.value2025.toFixed(1)}%.`,
    ];
  }

  const share = pickYearValue(top.value2024, top.value2025, year);
  return [
    { bold: top.name },
    ' is the most common status at ',
    { bold: `${share.toFixed(1)}%` },
    '.',
  ];
}

export function generateDemographicsIncomeInsight(
  rows: IncomeChartRow[],
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): InsightPart[] {
  if (rows.length === 0) return ['Household income distribution varies across survey responses.'];

  const top = [...rows].sort(
    (a, b) => pickYearValue(b.value2024, b.value2025, year) - pickYearValue(a.value2024, a.value2025, year),
  )[0];

  if (mode === 'yoy') {
    const change = top.value2025 - top.value2024;
    const direction = change >= 0 ? 'rose' : 'fell';
    return [
      { bold: top.fullName },
      ` bracket share ${direction} `,
      { bold: formatDelta(change) },
      ` to ${top.value2025.toFixed(1)}%.`,
    ];
  }

  const share = pickYearValue(top.value2024, top.value2025, year);
  return [
    { bold: top.fullName },
    ' is the largest income bracket at ',
    { bold: `${share.toFixed(1)}%` },
    '.',
  ];
}

export function formatInsightParts(parts: InsightPart[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.bold)).join('');
}

export function generateChartFollowUpDetails(
  chartTitle: string,
  insight: InsightPart[],
): { chartTitle: string; question: string; answer: string } {
  const summary = formatInsightParts(insight);
  const question = `Can you provide more details about ${chartTitle}?`;
  const answer = [
    `Looking deeper at ${chartTitle}: ${summary}`,
    'This reflects how Al Falah district residents responded in the latest survey cycle.',
    'Compare year-over-year movement in the chart above and review lower-performing segments to identify where targeted interventions may have the greatest impact.',
  ].join(' ');

  return { chartTitle, question, answer };
}

export function generateInsights(
  tabId: string,
  data: import('./types').SurveyData,
): string[] {
  const { sectionScores } = data;

  if (tabId === 'overview') {
    const overall2024 = computeUnweightedOverallScore(data, '2024');
    const overall2025 = computeUnweightedOverallScore(data, '2025');
    const coverage = getEvidenceCoverageSummary(data);
    const profile = getWhoAnsweredProfileData(data, '2025');
    const approvedDumbbell = getPillarDumbbellData(data).filter((item) => item.status === 'approved');
    const strongestMover = [...approvedDumbbell].sort(
      (a, b) => (b.value2025! - b.value2024!) - (a.value2025! - a.value2024!),
    )[0];
    const genderTop = profile.find((item) => item.id === 'gender')?.segments
      .slice()
      .sort((a, b) => b.value - a.value)[0];
    const employmentTop = profile.find((item) => item.id === 'employment')?.segments
      .slice()
      .sort((a, b) => b.value - a.value)[0];

    return [
      overall2024 != null && overall2025 != null
        ? `The overall district score moved from ${overall2024.toFixed(1)}% to ${overall2025.toFixed(1)}% (${formatDelta(overall2025 - overall2024)}), based on ${coverage.approvedCount} approved pillars.`
        : `Approved pillar coverage currently stands at ${coverage.approvedCount} of ${coverage.totalCount}.`,
      strongestMover
        ? `${strongestMover.name} recorded the largest approved score gain (${strongestMover.value2024!.toFixed(1)}% → ${strongestMover.value2025!.toFixed(1)}%).`
        : 'Use the pillar score composition chart to compare year-over-year movement across approved sections.',
      genderTop && employmentTop
        ? `Respondent profile highlights: ${genderTop.label} (${genderTop.value.toFixed(1)}%) and ${employmentTop.label} (${employmentTop.value.toFixed(1)}%) are the largest groups in the overview KPI cards.`
        : 'The overview KPI cards summarise who answered the survey across key demographic fields.',
      coverage.pendingPillars.length > 0
        ? `${coverage.pendingPillars.join(' and ')} remain pending approval and are shown as unavailable in the annual pillar table.`
        : 'All pillar scores shown on this page are drawn from approved evidence coverage.',
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

  if (tabId === 'work-education') {
    const work = sectionScores.work;
    const education = sectionScores.education;
    if (!work || !education) return ['Work and education data for Al Falah district residents.'];
    const workDirection = work.yoyChange >= 0 ? 'improved' : 'declined';
    const educationDirection = education.yoyChange >= 0 ? 'improved' : 'declined';
    return [
      `Work satisfaction ${workDirection} from ${work.score2024}% to ${work.score2025}% (${formatDelta(work.yoyChange)}), while education ${educationDirection} from ${education.score2024}% to ${education.score2025}% (${formatDelta(education.yoyChange)}).`,
      'Employment statements and work-life balance shape how residents experience jobs and household security.',
      'School safety, life skills, and education satisfaction indicate whether schooling meets family expectations.',
    ];
  }

  if (tabId === 'income') {
    const section = sectionScores.income;
    if (!section) return ['Income and living standards data for Al Falah district residents.'];
    const direction = section.yoyChange >= 0 ? 'improved' : 'declined';
    return [
      `Income & Living satisfaction ${direction} from ${section.score2024}% to ${section.score2025}% (${formatDelta(section.yoyChange)}).`,
      'Living expense areas, debt obligations, and saving behaviour shape how residents manage household budgets.',
      'Expected spending trends and income sentiment indicate whether residents feel financially secure or under pressure.',
    ];
  }

  if (tabId === 'health') {
    const section = sectionScores.health;
    if (!section) return ['Health and wellness data for Al Falah district residents.'];
    const direction = section.yoyChange >= 0 ? 'improved' : 'declined';
    return [
      `Health satisfaction ${direction} from ${section.score2024}% to ${section.score2025}% (${formatDelta(section.yoyChange)}).`,
      'Healthcare assessments, emotional stress, healthy eating, and chronic conditions shape resident wellbeing.',
      'Personal health, activity levels, and sleep quality indicate how residents experience day-to-day wellness.',
    ];
  }

  if (tabId === 'housing-infrastructure') {
    const infrastructure = sectionScores.infrastructure;
    const housing = sectionScores.housing;
    if (!infrastructure || !housing) return ['Housing and infrastructure data for Al Falah district residents.'];
    const infrastructureDirection = infrastructure.yoyChange >= 0 ? 'improved' : 'declined';
    const housingDirection = housing.yoyChange >= 0 ? 'improved' : 'declined';
    return [
      `Infrastructure satisfaction ${infrastructureDirection} from ${infrastructure.score2024}% to ${infrastructure.score2025}% (${formatDelta(infrastructure.yoyChange)}), while housing ${housingDirection} from ${housing.score2024}% to ${housing.score2025}% (${formatDelta(housing.yoyChange)}).`,
      'Service-access satisfaction and community facility gaps show how well district infrastructure supports daily life.',
      'Home space, maintenance pressure, and housing condition risk indicate whether residents feel secure in their homes.',
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

const DEFAULT_PILLAR_SCORE_COVERAGE: PillarScoreCoverage[] = [
  { sectionId: 'work', sectionNameEn: 'Work', status: 'approved' },
  { sectionId: 'education', sectionNameEn: 'Education', status: 'approved' },
  { sectionId: 'security', sectionNameEn: 'Security & Safety', status: 'approved' },
  { sectionId: 'health', sectionNameEn: 'Health', status: 'approved' },
  { sectionId: 'environment', sectionNameEn: 'Environment', status: 'approved' },
  { sectionId: 'housing', sectionNameEn: 'Housing', status: 'approved' },
  { sectionId: 'infrastructure', sectionNameEn: 'Infrastructure', status: 'approved' },
  { sectionId: 'income', sectionNameEn: 'Income & Living', status: 'approved' },
];

export function getPillarScoreCoverage(data: SurveyData): PillarScoreCoverage[] {
  return data.pillarScoreCoverage ?? DEFAULT_PILLAR_SCORE_COVERAGE;
}

export function getSectionScoreStatus(data: SurveyData, sectionId: string): ScoreStatus {
  const coverage = getPillarScoreCoverage(data);
  return coverage.find((pillar) => pillar.sectionId === sectionId)?.status ?? 'approved';
}

export interface EvidenceCoverageSummary {
  approvedCount: number;
  totalCount: number;
  pendingPillars: string[];
  summaryLabel: string;
}

export function getEvidenceCoverageSummary(data: SurveyData): EvidenceCoverageSummary {
  const coverage = getPillarScoreCoverage(data);
  const approved = coverage.filter((pillar) => pillar.status === 'approved');
  const pending = coverage.filter((pillar) => pillar.status !== 'approved');

  return {
    approvedCount: approved.length,
    totalCount: coverage.length,
    pendingPillars: pending.map((pillar) => pillar.sectionNameEn),
    summaryLabel: `${approved.length} of ${coverage.length} pillars have approved overall scores`,
  };
}

export interface ReportingContext {
  district: string;
  selectedYear: SurveyYear;
  compareLabel: string;
  viewMode: ViewMode;
  sampleBase: number | null;
  measureDefinition: string;
}

export function formatReportingContext(
  data: SurveyData,
  viewMode: ViewMode,
  selectedYear: SurveyYear,
  compareYears: CompareYears,
): ReportingContext {
  const sampleBase = viewMode === 'current'
    ? data.sampleBase?.[selectedYear] ?? null
    : data.sampleBase?.[compareYears[1]] ?? null;

  const measureDefinition = viewMode === 'yoy'
    ? `Year-over-year change (${formatCompareYearsLabel(compareYears)})`
    : `Single-year resident satisfaction (${selectedYear})`;

  return {
    district: data.district,
    selectedYear,
    compareLabel: formatCompareYearsLabel(compareYears),
    viewMode,
    sampleBase,
    measureDefinition,
  };
}

export interface MethodologySection {
  title: string;
  body: string;
}

export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    title: 'Positive vs negative indicators',
    body: 'Positive indicators measure satisfaction or agreement with favourable outcomes. Negative indicators measure reported problems or concerns — higher agreement means more residents report the issue.',
  },
  {
    title: 'Reading negative scores',
    body: 'For risk statements, higher agreement is not an improvement. Present these findings as reported concern, not satisfaction.',
  },
  {
    title: 'Score coverage',
    body: 'All eight pillars currently have approved overall scores in this demo dashboard. Cross-pillar averages include every pillar with an approved SCORE_1.',
  },
  {
    title: 'Health overall score',
    body: 'The Health section score is the calculated average of healthcare centres (Q501) and healthcare system quality (Q502). Wellbeing context (Q508) is shown separately.',
  },
  {
    title: 'Unavailable measures',
    body: 'Do not treat missing approved measures as zero. Show “Not available” or “Pending” instead of estimating proxy values.',
  },
  {
    title: 'Demo data notice',
    body: 'Figures shown in this dashboard are illustrative demo values pending formal data approval. Bind to the approved row-based cube before executive sign-off.',
  },
];

const WHO_ANSWERED_COLORS = ['#2563EB', '#0D9488', '#7C3AED', '#F59E0B', '#DC2626', '#94a3b8'];

export interface ProfileDistributionSegment {
  label: string;
  value: number;
  color: string;
}

export interface ProfileDistribution {
  id: string;
  label: string;
  sampleBase: number | null;
  segments: ProfileDistributionSegment[];
}

export interface PillarDumbbellItem {
  sectionId: string;
  name: string;
  value2024: number | null;
  value2025: number | null;
  status: import('./types').ScoreStatus;
}

export function getDefaultSurveyBrief(data: import('./types').SurveyData): import('./types').SurveyBrief {
  return {
    objective: 'Measure resident satisfaction and quality-of-life outcomes across Al Falah district pillars.',
    scope: `${data.district} District, Abu Dhabi`,
    fieldworkPeriod: data.surveyPeriod ?? data.years.join('–'),
    plannedSample: null,
    achievedResponses: data.sampleBase?.['2025'] ?? data.sampleBase?.['2024'] ?? 0,
    responseRate: null,
  };
}

export function formatSurveyBriefParagraph(data: import('./types').SurveyData): string {
  const brief = data.surveyBrief ?? getDefaultSurveyBrief(data);
  const plannedSampleText = brief.plannedSample != null && brief.plannedSample > 0
    ? brief.plannedSample.toLocaleString()
    : 'pending approval';
  const responseRateText = brief.responseRate != null
    ? `${brief.responseRate.toFixed(1)}%`
    : 'pending denominator approval';

  return [
    brief.objective,
    `Scope: ${brief.scope}.`,
    `Fieldwork period: ${brief.fieldworkPeriod}.`,
    `Planned sample: ${plannedSampleText}.`,
    `Achieved responses: ${brief.achievedResponses.toLocaleString()}.`,
    `Response rate: ${responseRateText}.`,
  ].join(' ');
}
  
function getCategoricalDistribution(
  questions: import('./types').Question[],
  code: string,
  year: import('./types').SurveyYear,
  maxSegments = 5,
  formatLabel?: (categoryEn: string | undefined, categoryAr: string) => string,
): ProfileDistributionSegment[] {
  const items = getCategoryByQuestion(questions, code)
    .map((q) => ({
      label: formatLabel
        ? formatLabel(q.categoryEn, q.categoryAr)
        : translateLabel(q.categoryEn ?? q.categoryAr),
      value: q.data[year] ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) return [];

  const topItems = items.slice(0, maxSegments);
  const otherValue = items.slice(maxSegments).reduce((sum, item) => sum + item.value, 0);
  const segments = topItems.map((item, index) => ({
    ...item,
    color: WHO_ANSWERED_COLORS[index % WHO_ANSWERED_COLORS.length],
  }));

  if (otherValue > 0) {
    segments.push({
      label: 'Other',
      value: otherValue,
      color: WHO_ANSWERED_COLORS[segments.length % WHO_ANSWERED_COLORS.length],
    });
  }

  return segments;
}

function getGenderDistribution(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): ProfileDistributionSegment[] {
  const male = sumCategoryValues(questions, 'Q902', [/^male$/i, /^ذكر$/], year);
  const female = sumCategoryValues(questions, 'Q902', [/^feminine$/i, /^female$/i, /^أنثى$/], year);

  return [
    { label: 'Male', value: male, color: WHO_ANSWERED_COLORS[0] },
    { label: 'Female', value: female, color: WHO_ANSWERED_COLORS[1] },
  ].filter((item) => item.value > 0);
}

export function getWhoAnsweredProfileData(
  data: import('./types').SurveyData,
  year: import('./types').SurveyYear,
): ProfileDistribution[] {
  const demographics = data.sections.demographics;
  const work = data.sections.work;
  const sampleBase = data.sampleBase?.[year] ?? null;

  if (!demographics) return [];

  const questions = demographics.questions;
  const distributions: ProfileDistribution[] = [
    {
      id: 'gender',
      label: 'Gender',
      sampleBase,
      segments: getGenderDistribution(questions, year),
    },
    {
      id: 'age',
      label: 'Age group',
      sampleBase,
      segments: getCategoricalDistribution(questions, 'Q903', year, 5),
    },
    {
      id: 'marital',
      label: 'Marital status',
      sampleBase,
      segments: getCategoricalDistribution(questions, 'Q904', year, 4, (categoryEn, categoryAr) => {
        const raw = categoryEn ?? categoryAr;
        return DEMOGRAPHICS_MARITAL_LABELS[raw]
          ?? DEMOGRAPHICS_MARITAL_LABELS[categoryAr]
          ?? translateLabel(raw);
      }),
    },
    {
      id: 'tenure',
      label: 'Ownership type',
      sampleBase,
      segments: getCategoricalDistribution(questions, 'Q911', year, 4),
    },
  ];

  if (work) {
    distributions.push({
      id: 'employment',
      label: 'Employment status',
      sampleBase,
      segments: getCategoricalDistribution(work.questions, 'Q201', year, 4),
    });
  }

  return distributions.filter((item) => item.segments.length > 0);
}

export function computeUnweightedOverallScore(
  data: import('./types').SurveyData,
  year: import('./types').SurveyYear,
): number | null {
  const approvedIds = getPillarScoreCoverage(data)
    .filter((pillar) => pillar.status === 'approved')
    .map((pillar) => pillar.sectionId);

  const scores = approvedIds
    .map((id) => data.sectionScores[id])
    .filter(Boolean);

  if (scores.length === 0) return null;

  const total = scores.reduce(
    (sum, score) => sum + pickYearValue(score.score2024, score.score2025, year),
    0,
  );

  return total / scores.length;
}

export function getPillarDumbbellData(data: import('./types').SurveyData): PillarDumbbellItem[] {
  const coverage = getPillarScoreCoverage(data);

  return coverage
    .map((pillar) => {
      const score = data.sectionScores[pillar.sectionId];
      const isApproved = pillar.status === 'approved' && score;

      return {
        sectionId: pillar.sectionId,
        name: pillar.sectionNameEn,
        value2024: isApproved ? score.score2024 : null,
        value2025: isApproved ? score.score2025 : null,
        status: pillar.status,
      };
    })
    .sort((a, b) => {
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      return (b.value2025 ?? 0) - (a.value2025 ?? 0);
    });
}

const SECTIONS_WITHOUT_NEGATIVE_SCORE = new Set(['infrastructure', 'income']);

export interface AnnualPillarTableRow {
  pillar: string;
  sectionId: string;
  score2024: number;
  score2025: number;
  satisfied2024: number;
  satisfied2025: number;
  unsatisfied2024: number;
  unsatisfied2025: number;
  scoresAvailable: boolean;
  unsatisfiedAvailable: boolean;
}

export function buildAnnualPillarTableRows(data: import('./types').SurveyData): AnnualPillarTableRow[] {
  return getPillarScoreCoverage(data)
    .map((pillar) => {
      const score = data.sectionScores[pillar.sectionId];
      if (!score) return null;

      const scoresAvailable = pillar.status === 'approved';
      const unsatisfiedAvailable = scoresAvailable && !SECTIONS_WITHOUT_NEGATIVE_SCORE.has(pillar.sectionId);

      return {
        pillar: pillar.sectionNameEn,
        sectionId: pillar.sectionId,
        score2024: score.score2024,
        score2025: score.score2025,
        satisfied2024: score.positive2024,
        satisfied2025: score.positive2025,
        unsatisfied2024: score.negative2024,
        unsatisfied2025: score.negative2025,
        scoresAvailable,
        unsatisfiedAvailable,
      };
    })
    .filter((row): row is AnnualPillarTableRow => row != null)
    .sort((a, b) => {
      if (a.scoresAvailable && !b.scoresAvailable) return -1;
      if (!a.scoresAvailable && b.scoresAvailable) return 1;
      return b.score2025 - a.score2025;
    });
}

export function generateOverviewInsightIntro(data: import('./types').SurveyData): string {
  const coverage = getEvidenceCoverageSummary(data);
  const overall2025 = computeUnweightedOverallScore(data, '2025');
  const sampleBase = data.sampleBase?.['2025'] ?? data.sampleBase?.['2024'];
  const responses = data.surveyBrief?.achievedResponses ?? sampleBase ?? 0;

  return [
    `The Overview page summarises the ${data.surveyPeriod ?? '2024–2025'} Al Falah resident survey`,
    `with ${responses.toLocaleString()} responses across ${coverage.approvedCount} approved pillars.`,
    overall2025 != null
      ? `The headline district score is ${overall2025.toFixed(1)}% (unweighted seven-pillar average).`
      : 'Headline district scores are shown once approved pillar coverage is complete.',
    coverage.pendingPillars.length > 0
      ? `${coverage.pendingPillars.join(' and ')} remain outside the approved average until scores are released.`
      : '',
  ].filter(Boolean).join(' ');
}

export type MomentumQuadrant = 'scale' | 'protect' | 'investigate';

export interface MomentumMatrixItem {
  sectionId: string;
  pillar: string;
  score2025: number;
  yoyChange: number;
  quadrant: MomentumQuadrant;
}

export function getMomentumQuadrant(score2025: number): MomentumQuadrant {
  if (score2025 >= 75) return 'scale';
  if (score2025 >= 70) return 'protect';
  return 'investigate';
}

export function getMomentumMatrixData(
  data: import('./types').SurveyData,
  compareYears: import('./types').CompareYears,
  year: import('./types').SurveyYear = compareYears[1],
): MomentumMatrixItem[] {
  return getPillarScoreCoverage(data)
    .filter((pillar) => pillar.status === 'approved')
    .map((pillar) => {
      const score = data.sectionScores[pillar.sectionId];
      if (!score) return null;

      const score2025 = pickYearValue(score.score2024, score.score2025, year);
      const yoyChange = getYearDelta(score.score2024, score.score2025, compareYears);

      return {
        sectionId: pillar.sectionId,
        pillar: pillar.sectionNameEn,
        score2025,
        yoyChange,
        quadrant: getMomentumQuadrant(score2025),
      };
    })
    .filter((item): item is MomentumMatrixItem => item != null);
}

export type RiskRegisterStatus = 'available' | 'not_applicable' | 'unavailable';

export interface RiskRegisterItem {
  sectionId: string;
  pillar: string;
  negative2024: number | null;
  negative2025: number | null;
  score2024: number | null;
  score2025: number | null;
  yoyChange: number | null;
  status: RiskRegisterStatus;
}

export function getResidualRiskRegister(
  data: import('./types').SurveyData,
  compareYears: import('./types').CompareYears,
  year: import('./types').SurveyYear = compareYears[1],
): RiskRegisterItem[] {
  return getPillarScoreCoverage(data)
    .map((pillar) => {
      const score = data.sectionScores[pillar.sectionId];

      if (SECTIONS_WITHOUT_NEGATIVE_SCORE.has(pillar.sectionId)) {
        return {
          sectionId: pillar.sectionId,
          pillar: pillar.sectionNameEn,
          negative2024: null,
          negative2025: null,
          score2024: score?.score2024 ?? null,
          score2025: score?.score2025 ?? null,
          yoyChange: null,
          status: pillar.status === 'approved' ? 'not_applicable' as const : 'unavailable' as const,
        };
      }

      if (pillar.status !== 'approved') {
        return {
          sectionId: pillar.sectionId,
          pillar: pillar.sectionNameEn,
          negative2024: null,
          negative2025: null,
          score2024: null,
          score2025: null,
          yoyChange: null,
          status: 'unavailable' as const,
        };
      }

      if (!score) {
        return {
          sectionId: pillar.sectionId,
          pillar: pillar.sectionNameEn,
          negative2024: null,
          negative2025: null,
          score2024: null,
          score2025: null,
          yoyChange: null,
          status: 'unavailable' as const,
        };
      }

      return {
        sectionId: pillar.sectionId,
        pillar: pillar.sectionNameEn,
        negative2024: score.negative2024,
        negative2025: score.negative2025,
        score2024: score.score2024,
        score2025: score.score2025,
        yoyChange: getYearDelta(score.negative2024, score.negative2025, compareYears),
        status: 'available' as const,
      };
    })
    .sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      const aConcern = pickYearValue(a.negative2024, a.negative2025, year) ?? -1;
      const bConcern = pickYearValue(b.negative2024, b.negative2025, year) ?? -1;
      return bConcern - aConcern;
    });
}

export type ActionPrompt = 'scale' | 'protect' | 'target' | 'close';

export interface ActionAgendaItem {
  id: string;
  prompt: ActionPrompt;
  pillar: string;
  title: string;
  summary: string;
}

const ENVIRONMENT_NEGATIVE_STATEMENT_MATCHERS = [/insects and some rodents/i];

function averageLikertChartRows(rows: IncomeChartRow[], year: import('./types').SurveyYear): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + pickYearValue(row.value2024, row.value2025, year), 0) / rows.length;
}

export function getHealthCentresOverallSatisfaction(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  return averageLikertChartRows(getHealthSystemAssessmentData(questions, year), year);
}

export function getHealthcareSystemOverallSatisfaction(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  return averageLikertChartRows(getHealthServiceAssessmentData(questions, year), year);
}

export function getHealthSubgroupDumbbellItems(
  questions: import('./types').Question[],
): PillarDumbbellItem[] {
  const centres2024 = getHealthCentresOverallSatisfaction(questions, '2024');
  const centres2025 = getHealthCentresOverallSatisfaction(questions, '2025');
  const system2024 = getHealthcareSystemOverallSatisfaction(questions, '2024');
  const system2025 = getHealthcareSystemOverallSatisfaction(questions, '2025');

  return [
    {
      sectionId: 'q501',
      name: 'Overall satisfaction of health centers',
      value2024: centres2024,
      value2025: centres2025,
      status: 'approved',
    },
    {
      sectionId: 'q502',
      name: 'Overall satisfaction with healthcare system quality',
      value2024: system2024,
      value2025: system2025,
      status: 'approved',
    },
  ];
}

export function getCalculatedHealthScore(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
): number {
  const q501 = getHealthCentresOverallSatisfaction(questions, year);
  const q502 = getHealthcareSystemOverallSatisfaction(questions, year);
  return (q501 + q502) / 2;
}

function assessmentRowsToComparisonItems(
  rows: IncomeChartRow[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return rows.map((row) => ({
    id: row.fullName,
    name: row.name,
    fullName: row.fullName,
    value2024: row.value2024,
    value2025: row.value2025,
    movement: getYearDelta(row.value2024, row.value2025, compareYears),
  }));
}

export function getHealthCentresAssessmentStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return assessmentRowsToComparisonItems(
    getHealthSystemAssessmentData(questions, compareYears[1]),
    compareYears,
  );
}

export function getHealthSystemQualityStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return assessmentRowsToComparisonItems(
    getHealthServiceAssessmentData(questions, compareYears[1]),
    compareYears,
  );
}

export interface WellbeingHeatmapRow {
  name: string;
  fullName: string;
  agreement2024: number;
  agreement2025: number;
  movement: number;
}

export function getHealthWellbeingContext(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): WellbeingHeatmapRow[] {
  return getLikertStatementsByCode(questions, 'Q508')
    .map((question) => {
      const fullName = question.statementEn ?? question.statementAr;
      const agreement2024 = question.data['2024']?.agreement ?? 0;
      const agreement2025 = question.data['2025']?.agreement ?? 0;
      return {
        name: formatHealthHeatmapLabel(fullName),
        fullName,
        agreement2024,
        agreement2025,
        movement: getYearDelta(agreement2024, agreement2025, compareYears),
      };
    })
    .sort((a, b) => b.agreement2025 - a.agreement2025);
}

export function generateHealthSubgroupInsight(
  items: StatementComparisonItem[],
  year: import('./types').SurveyYear,
  subgroup: 'q501' | 'q502',
): InsightPart[] {
  const top = items[0];
  if (!top) {
    return subgroup === 'q501'
      ? ['No Q501 health center assessment statements are available.']
      : ['No Q502 healthcare system quality statements are available.'];
  }

  const label = subgroup === 'q501' ? 'Health centers' : 'Healthcare system quality';
  const value = pickYearValue(top.value2024, top.value2025, year);

  return [
    { bold: label },
    ' is led by ',
    { bold: top.name },
    ' at ',
    { bold: `${value.toFixed(1)}%`, tone: value >= 70 ? 'positive' : undefined },
    ' agreement in ',
    { bold: year },
    '.',
  ];
}

export function generateHealthWellbeingInsight(
  rows: WellbeingHeatmapRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  const top = rows[0];
  if (!top) {
    return ['No Q508 wellbeing context statements are available.'];
  }

  const value = pickYearValue(top.agreement2024, top.agreement2025, year);

  if (value >= 60) {
    return [
      { bold: top.name },
      ' leads reported wellbeing concerns in ',
      { bold: year },
      ' at ',
      { bold: `${value.toFixed(1)}%`, tone: 'negative' },
      ' agreement.',
    ];
  }

  return [
    { bold: top.name },
    ' is the top wellbeing concern in ',
    { bold: year },
    ' at ',
    { bold: `${value.toFixed(1)}%` },
    '.',
  ];
}

export function isSectionScorePending(section: import('./types').Section): boolean {
  return section.scoreStatus === 'pending' || section.dataReadiness?.status === 'pending';
}

export interface StatementComparisonItem {
  id: string;
  name: string;
  fullName: string;
  value2024: number;
  value2025: number;
  movement: number;
}

export interface DivergingLikertStatementRow {
  id: string;
  name: string;
  fullName: string;
  dissatisfied: number;
  neutral: number;
  satisfied: number;
}

const WORK_RISK_STATEMENT_MATCHERS = [
  /busy and stressed/i,
  /afraid of losing my job/i,
  /negative physical and psychological/i,
  /barely covers family expenses/i,
];

const EDUCATION_RISK_STATEMENT_MATCHERS = [
  /verbal abuse by other students/i,
  /physical abuse by other students/i,
  /physically harmed more than once/i,
  /harassed, ridiculed, and called bad names/i,
  /harassed, ridiculed, and called names/i,
];

const WORK_Q210_SHORT_LABELS: Array<{ match: RegExp; label: string }> = [
  { match: /balance work and social/i, label: 'Work-life balance' },
  { match: /remote work techniques/i, label: 'Remote work flexibility' },
  { match: /thanking and praising/i, label: 'Job recognition' },
  { match: /benefits, benefits and compensation/i, label: 'Pay and benefits' },
  { match: /professional development/i, label: 'Career development' },
  { match: /busy and stressed/i, label: 'Job stress' },
  { match: /afraid of losing my job/i, label: 'Job loss fear' },
  { match: /negative physical and psychological/i, label: 'Work health impacts' },
  { match: /barely covers family expenses/i, label: 'Income pressure' },
];

function getWorkQ210ShortLabel(statement: string): string {
  const match = WORK_Q210_SHORT_LABELS.find((entry) => entry.match.test(statement));
  return match?.label ?? truncateStatementLabel(statement, 28);
}

function truncateStatementLabel(text: string, max = 44): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function resolveStatementPolarity(
  question: import('./types').LikertQuestion,
  riskMatchers: RegExp[],
): import('./types').IndicatorPolarity {
  if (question.polarity) return question.polarity;
  const text = `${question.statementEn ?? ''} ${question.statementAr}`;
  if (ENVIRONMENT_NEGATIVE_STATEMENT_MATCHERS.some((matcher) => matcher.test(text))) {
    return 'negative';
  }
  return riskMatchers.some((matcher) => matcher.test(text)) ? 'negative' : 'positive';
}

function toStatementComparisonItem(
  question: import('./types').LikertQuestion,
  compareYears: import('./types').CompareYears,
): StatementComparisonItem {
  const agreement2024 = question.data['2024']?.agreement ?? 0;
  const agreement2025 = question.data['2025']?.agreement ?? 0;
  const fullName = question.statementEn ?? question.statementAr;

  return {
    id: `${question.code}-${question.statementAr}`,
    name: truncateStatementLabel(fullName),
    fullName,
    value2024: agreement2024,
    value2025: agreement2025,
    movement: getYearDelta(agreement2024, agreement2025, compareYears),
  };
}

function toDivergingLikertStatementRow(
  question: import('./types').LikertQuestion,
  year: import('./types').SurveyYear,
): DivergingLikertStatementRow {
  const breakdown = question.data[year]?.breakdown ?? {};
  const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
  const total = dissatisfied + neutral + satisfied;
  const scale = total > 0 ? 100 / total : 0;
  const fullName = question.statementEn ?? question.statementAr;

  return {
    id: `${question.code}-${question.statementAr}-${year}`,
    name: truncateStatementLabel(fullName),
    fullName,
    dissatisfied: dissatisfied * scale,
    neutral: neutral * scale,
    satisfied: satisfied * scale,
  };
}

function getLikertStatementsByCode(
  questions: import('./types').Question[],
  code: string,
): import('./types').LikertQuestion[] {
  return getLikertStatements(questions).filter((question) => question.code === code);
}

const ENVIRONMENT_Q601_SHORT_LABELS: { match: RegExp; label: string }[] = [
  { match: /cleanliness of the neighborhood/i, label: 'Neighborhood cleanliness' },
  { match: /cleanliness of public facilities/i, label: 'Public facility cleanliness' },
  { match: /urban planning of the city/i, label: 'Urban planning' },
  { match: /architectural \(aesthetic\) character/i, label: 'Architectural character' },
  { match: /quality of service facilities/i, label: 'Parks & public facilities' },
  { match: /internal road services/i, label: 'Roads, sidewalks & lighting' },
  { match: /beautification and landscaping/i, label: 'Street beautification' },
  { match: /air quality in the residential area/i, label: 'Air quality' },
  { match: /noise level in my residential area/i, label: 'Noise level' },
  { match: /availability of shopping areas/i, label: 'Shopping availability' },
  { match: /transportation services within the residential area/i, label: 'Transport services' },
  { match: /sanitation services within a residential area/i, label: 'Sanitation services' },
  { match: /general appearance of the city/i, label: 'City appearance control' },
];

function getEnvironmentQ601ShortLabel(statement: string): string {
  const match = ENVIRONMENT_Q601_SHORT_LABELS.find((entry) => entry.match.test(statement));
  return match?.label ?? truncateStatementLabel(statement, 32);
}

export function getEnvironmentPositiveStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q601')
    .filter((question) => resolveStatementPolarity(question, []) === 'positive')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getEnvironmentQ601ShortLabel(statement) };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getEnvironmentInsectsRiskStatement(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem | null {
  const question = getLikertStatementsByCode(questions, 'Q601').find(
    (entry) => resolveStatementPolarity(entry, []) === 'negative',
  );
  if (!question) return null;

  const row = toStatementComparisonItem(question, compareYears);
  return { ...row, name: 'Insects & rodents' };
}

export function getEnvironmentDomainHeatmap(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): WellbeingHeatmapRow[] {
  const domains: { name: string; fullName: string; match: RegExp }[] = [
    {
      name: 'Cleanliness',
      fullName: 'Neighborhood cleanliness satisfaction',
      match: ENVIRONMENT_KPI_STATEMENT.cleanliness,
    },
    {
      name: 'Facilities',
      fullName: ENVIRONMENT_CHART_STATEMENTS.serviceFacilities.short,
      match: ENVIRONMENT_CHART_STATEMENTS.serviceFacilities.match,
    },
    {
      name: 'Planning',
      fullName: ENVIRONMENT_CHART_STATEMENTS.urbanPlanning.short,
      match: ENVIRONMENT_CHART_STATEMENTS.urbanPlanning.match,
    },
    {
      name: 'Roads',
      fullName: ENVIRONMENT_CHART_STATEMENTS.internalRoadServices.short,
      match: ENVIRONMENT_CHART_STATEMENTS.internalRoadServices.match,
    },
    {
      name: 'Air quality',
      fullName: 'Air quality satisfaction',
      match: ENVIRONMENT_KPI_STATEMENT.airQuality,
    },
    {
      name: 'Noise',
      fullName: 'Noise level satisfaction',
      match: ENVIRONMENT_KPI_STATEMENT.noiseLevel,
    },
  ];

  return domains.map((domain) => {
    const agreement2024 = getEducationLikertAgreement(questions, domain.match, '2024');
    const agreement2025 = getEducationLikertAgreement(questions, domain.match, '2025');
    return {
      name: domain.name,
      fullName: domain.fullName,
      agreement2024,
      agreement2025,
      movement: getYearDelta(agreement2024, agreement2025, compareYears),
    };
  });
}

export function generateEnvironmentPositiveStatementsInsight(
  items: StatementComparisonItem[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  const top = items[0];
  if (!top) {
    return ['No positive Q601 environment statements are available.'];
  }

  const value = pickYearValue(top.value2024, top.value2025, year);
  return [
    { bold: top.name },
    ' leads positive environment satisfaction in ',
    { bold: year },
    ' at ',
    { bold: `${value.toFixed(1)}%`, tone: 'positive' },
    ' agreement.',
  ];
}

export function generateEnvironmentDomainHeatmapInsight(
  rows: WellbeingHeatmapRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  if (rows.length === 0) {
    return ['No environment domain satisfaction data is available.'];
  }

  const ranked = [...rows].sort(
    (a, b) =>
      pickYearValue(b.agreement2024, b.agreement2025, year)
      - pickYearValue(a.agreement2024, a.agreement2025, year),
  );
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const topValue = pickYearValue(top.agreement2024, top.agreement2025, year);

  if (bottom && top.name !== bottom.name) {
    const bottomValue = pickYearValue(bottom.agreement2024, bottom.agreement2025, year);
    if (topValue - bottomValue >= 12) {
      return [
        { bold: top.name },
        ' leads at ',
        { bold: `${topValue.toFixed(1)}%` },
        ', while ',
        { bold: bottom.name },
        ' is weakest at ',
        { bold: `${bottomValue.toFixed(1)}%` },
        '.',
      ];
    }
  }

  return [
    { bold: top.name },
    ' leads environment domain satisfaction in ',
    { bold: year },
    ' at ',
    { bold: `${topValue.toFixed(1)}%` },
    '.',
  ];
}

const HOUSING_RISK_STATEMENT_MATCHERS = [
  /unpleasant odors inside the residence/i,
  /insects and some rodents appear constantly in the residence/i,
  /residence needs repairs and maintenance/i,
  /size of the house is small or insufficient/i,
  /densely populated area makes me feel unstable/i,
];

const HOUSING_Q701_SHORT_LABELS: { match: RegExp; label: string }[] = [
  { match: /family is comfortable in the residential area/i, label: 'Family comfort in area' },
  { match: /satisfied with the type of housing/i, label: 'Housing type satisfaction' },
  { match: /home ownership prices in a residential area/i, label: 'Homeownership prices' },
  { match: /fees for services for obtaining documents related to housing/i, label: 'Housing document fees' },
  { match: /ventilation system in the residence is adequate/i, label: 'Ventilation adequacy' },
  { match: /sun enters most parts of the residence/i, label: 'Natural lighting' },
  { match: /unpleasant odors inside the residence/i, label: 'Unpleasant odors' },
  { match: /insects and some rodents appear constantly/i, label: 'Insects & rodents' },
  { match: /residence needs repairs and maintenance/i, label: 'Repairs & maintenance' },
  { match: /size of the house is small or insufficient/i, label: 'Insufficient space' },
  { match: /densely populated area makes me feel unstable/i, label: 'Overcrowding concern' },
  { match: /limit the transmission of diseases/i, label: 'Disease prevention measures' },
  { match: /quality of drinking water from the tap/i, label: 'Drinking water quality' },
  { match: /housing rent value is consistent/i, label: 'Rent value vs location' },
  { match: /thinking of getting a private residence/i, label: 'Planning to own home' },
];

function getHousingQ701ShortLabel(statement: string): string {
  const match = HOUSING_Q701_SHORT_LABELS.find((entry) => entry.match.test(statement));
  return match?.label ?? truncateStatementLabel(statement, 32);
}

export interface ConditionRiskMatrixItem {
  id: string;
  name: string;
  fullName: string;
  concern2024: number;
  concern2025: number;
  movement: number;
}

export function getHousingPositiveStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q701')
    .filter((question) => resolveStatementPolarity(question, HOUSING_RISK_STATEMENT_MATCHERS) === 'positive')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getHousingQ701ShortLabel(statement) };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getHousingRiskStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q701')
    .filter((question) => resolveStatementPolarity(question, HOUSING_RISK_STATEMENT_MATCHERS) === 'negative')
    .map((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const row = toStatementComparisonItem(question, compareYears);
      return { ...row, name: getHousingQ701ShortLabel(statement) };
    })
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getHousingConditionRiskMatrix(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): ConditionRiskMatrixItem[] {
  return getHousingRiskStatements(questions, compareYears).map((item) => ({
    id: item.id,
    name: item.name,
    fullName: item.fullName,
    concern2024: item.value2024,
    concern2025: item.value2025,
    movement: item.movement,
  }));
}

export function generateHousingPositiveStatementsInsight(
  items: StatementComparisonItem[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  const top = items[0];
  if (!top) {
    return ['No positive Q701 housing statements are available.'];
  }

  const value = pickYearValue(top.value2024, top.value2025, year);
  return [
    { bold: top.name },
    ' leads positive housing satisfaction in ',
    { bold: year },
    ' at ',
    { bold: `${value.toFixed(1)}%`, tone: 'positive' },
    ' agreement.',
  ];
}

export function generateHousingConditionRiskInsight(
  items: ConditionRiskMatrixItem[],
  compareYears: import('./types').CompareYears,
): InsightPart[] {
  if (items.length === 0) {
    return ['No Q701 housing condition risk statements are available.'];
  }

  const topConcern = [...items].sort((a, b) => b.concern2025 - a.concern2025)[0];
  const rising = [...items].sort((a, b) => b.movement - a.movement)[0];

  if (rising && rising.movement >= 3) {
    return [
      { bold: topConcern.name },
      ' is the highest reported concern at ',
      { bold: `${topConcern.concern2025.toFixed(1)}%`, tone: 'negative' },
      ', while ',
      { bold: rising.name },
      ' shows the sharpest rise (',
      { bold: formatDelta(rising.movement), tone: 'negative' },
      ` vs ${compareYears[0]}).`,
    ];
  }

  return [
    { bold: topConcern.name },
    ' leads reported housing concern in ',
    { bold: compareYears[1] },
    ' at ',
    { bold: `${topConcern.concern2025.toFixed(1)}%`, tone: 'negative' },
    ' agreement.',
  ];
}

export function getSectionDumbbellItem(section: import('./types').Section): PillarDumbbellItem {
  const score = section.score;
  if (!score) {
    return {
      sectionId: section.id,
      name: section.nameEn,
      value2024: null,
      value2025: null,
      status: section.scoreStatus ?? 'unavailable',
    };
  }

  return {
    sectionId: section.id,
    name: section.nameEn,
    value2024: score.score2024,
    value2025: score.score2025,
    status: section.scoreStatus ?? 'approved',
  };
}

export function getWorkStatementsByPolarity(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
  polarity: import('./types').IndicatorPolarity,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q210')
    .filter((question) => resolveStatementPolarity(question, WORK_RISK_STATEMENT_MATCHERS) === polarity)
    .map((question) => toStatementComparisonItem(question, compareYears))
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getWorkDivergingLikertRows(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
  polarity: import('./types').IndicatorPolarity,
  viewMode: import('./types').ViewMode = 'current',
  compareYears: import('./types').CompareYears = ['2024', '2025'],
): DivergingLikertStatementRow[] {
  const filtered = getLikertStatementsByCode(questions, 'Q210')
    .filter((question) => resolveStatementPolarity(question, WORK_RISK_STATEMENT_MATCHERS) === polarity)
    .sort((a, b) => (b.data[year]?.agreement ?? 0) - (a.data[year]?.agreement ?? 0));

  if (viewMode === 'yoy') {
    const orderedYears = [compareYears[1], compareYears[0]] as const;
    return filtered.flatMap((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const baseName = getWorkQ210ShortLabel(statement);
      return orderedYears.map((entryYear) => {
        const row = toDivergingLikertStatementRow(question, entryYear);
        return {
          ...row,
          name: `${baseName} · ${entryYear}`,
          fullName: statement,
        };
      });
    });
  }

  return filtered.map((question) => {
    const statement = question.statementEn ?? question.statementAr;
    const row = toDivergingLikertStatementRow(question, year);
    return {
      ...row,
      name: getWorkQ210ShortLabel(statement),
      fullName: statement,
    };
  });
}

export function generateWorkPositiveStatementsInsight(
  rows: DivergingLikertStatementRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  if (rows.length === 0) {
    return ['No positive employment statements are available for this view.'];
  }

  const top = rows[0];

  return [
    { bold: top.name },
    ' is the strongest positive signal in ',
    { bold: year },
    ' at ',
    { bold: `${top.satisfied.toFixed(1)}%`, tone: 'positive' },
    ' satisfied.',
  ];
}

export function generateWorkRiskStatementsInsight(
  rows: DivergingLikertStatementRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  if (rows.length === 0) {
    return ['No reported employment risk statements are available for this view.'];
  }

  const top = rows[0];

  return [
    { bold: top.name },
    ' is the highest reported concern in ',
    { bold: year },
    ' at ',
    { bold: `${top.satisfied.toFixed(1)}%`, tone: 'negative' },
    ' agreement.',
  ];
}

export function getEducationPositiveStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q301')
    .filter((question) => resolveStatementPolarity(question, EDUCATION_RISK_STATEMENT_MATCHERS) === 'positive')
    .map((question) => toStatementComparisonItem(question, compareYears))
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getEducationRiskStatements(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
): StatementComparisonItem[] {
  return getLikertStatementsByCode(questions, 'Q301')
    .filter((question) => resolveStatementPolarity(question, EDUCATION_RISK_STATEMENT_MATCHERS) === 'negative')
    .map((question) => toStatementComparisonItem(question, compareYears))
    .sort((a, b) => b.value2025 - a.value2025);
}

export function getEducationDivergingLikertRows(
  questions: import('./types').Question[],
  year: import('./types').SurveyYear,
  polarity: import('./types').IndicatorPolarity,
  viewMode: import('./types').ViewMode = 'current',
  compareYears: import('./types').CompareYears = ['2024', '2025'],
): DivergingLikertStatementRow[] {
  const filtered = getLikertStatementsByCode(questions, 'Q301')
    .filter((question) => resolveStatementPolarity(question, EDUCATION_RISK_STATEMENT_MATCHERS) === polarity)
    .sort((a, b) => (b.data[year]?.agreement ?? 0) - (a.data[year]?.agreement ?? 0));

  if (viewMode === 'yoy') {
    return filtered.flatMap((question) => {
      const statement = question.statementEn ?? question.statementAr;
      const baseName = formatEducationAxisLabel(statement);
      return compareYears.map((entryYear) => {
        const row = toDivergingLikertStatementRow(question, entryYear);
        return {
          ...row,
          name: `${baseName} · ${entryYear}`,
          fullName: statement,
        };
      });
    });
  }

  return filtered.map((question) => {
    const statement = question.statementEn ?? question.statementAr;
    const row = toDivergingLikertStatementRow(question, year);
    return {
      ...row,
      name: formatEducationAxisLabel(statement),
      fullName: statement,
    };
  });
}

export function getCurrentYearDivergingLikertRows(
  rows: DivergingLikertStatementRow[],
  viewMode: import('./types').ViewMode,
  compareYears: import('./types').CompareYears,
): DivergingLikertStatementRow[] {
  if (viewMode !== 'yoy') return rows;

  const currentYear = compareYears[1];
  return rows.filter((row) => row.id.endsWith(`-${currentYear}`));
}

export type EducationPositiveCategory = 'school' | 'higher-education' | 'school-life';

export const EDUCATION_POSITIVE_CATEGORY_ORDER: EducationPositiveCategory[] = [
  'school',
  'higher-education',
  'school-life',
];

export const EDUCATION_POSITIVE_CATEGORY_LABELS: Record<EducationPositiveCategory, string> = {
  school: 'School education',
  'higher-education': 'Higher education',
  'school-life': 'School life & wellbeing',
};

const EDUCATION_POSITIVE_CATEGORY_MATCHERS: Record<EducationPositiveCategory, RegExp[]> = {
  school: [
    /government school education system/i,
    /financial costs of public school/i,
    /private school education system/i,
    /financial costs of private school/i,
    /quality of school education/i,
    /ease of attending school/i,
    /proximity of the educational facility/i,
  ],
  'higher-education': [
    /university education system/i,
    /financial costs of university/i,
    /ease of enrolling in university/i,
  ],
  'school-life': [
    /physically safe for my son/i,
    /student discipline/i,
    /sports competitions/i,
    /life skills, innovation and sports/i,
    /sports facilities/i,
    /respect for the teaching profession/i,
  ],
};

export function getEducationPositiveStatementCategory(
  statement: string,
): EducationPositiveCategory | null {
  for (const category of EDUCATION_POSITIVE_CATEGORY_ORDER) {
    if (EDUCATION_POSITIVE_CATEGORY_MATCHERS[category].some((matcher) => matcher.test(statement))) {
      return category;
    }
  }
  return null;
}

export function filterEducationPositiveRowsByCategory(
  rows: DivergingLikertStatementRow[],
  category: EducationPositiveCategory,
): DivergingLikertStatementRow[] {
  return rows.filter((row) => getEducationPositiveStatementCategory(row.fullName) === category);
}

export function generateEducationPositiveStatementsInsight(
  rows: DivergingLikertStatementRow[],
  year: import('./types').SurveyYear,
  categoryLabel?: string,
): InsightPart[] {
  if (rows.length === 0) {
    return [
      categoryLabel
        ? `No ${categoryLabel.toLowerCase()} statements are available for this view.`
        : 'No positive education statements are available for this view.',
    ];
  }

  const top = rows[0];
  const scope = categoryLabel ? `${categoryLabel.toLowerCase()} ` : 'positive education ';

  return [
    { bold: top.name },
    ` is the strongest ${scope}signal in `,
    { bold: year },
    ' at ',
    { bold: `${top.satisfied.toFixed(1)}%`, tone: 'positive' },
    ' satisfied.',
  ];
}

export function generateEducationRiskStatementsInsight(
  rows: DivergingLikertStatementRow[],
  year: import('./types').SurveyYear,
): InsightPart[] {
  if (rows.length === 0) {
    return ['No reported school safety risk statements are available for this view.'];
  }

  const top = rows[0];

  return [
    { bold: top.name },
    ' is the highest reported school safety concern in ',
    { bold: year },
    ' at ',
    { bold: `${top.satisfied.toFixed(1)}%`, tone: 'negative' },
    ' agreement.',
  ];
}

function getLikertDisagreementPercent(breakdown: Record<string, number>): number {
  const { dissatisfied, neutral, satisfied } = getLikertBreakdownValues(breakdown);
  const total = dissatisfied + neutral + satisfied;
  return total > 0 ? (dissatisfied / total) * 100 : 0;
}

function resolveQuestionPolarity(question: import('./types').LikertQuestion): import('./types').IndicatorPolarity {
  if (question.polarity) return question.polarity;
  const statement = question.statementEn ?? question.statementAr;
  if (ENVIRONMENT_NEGATIVE_STATEMENT_MATCHERS.some((matcher) => matcher.test(statement))) {
    return 'negative';
  }
  if (WORK_RISK_STATEMENT_MATCHERS.some((matcher) => matcher.test(statement))) {
    return 'negative';
  }
  if (EDUCATION_RISK_STATEMENT_MATCHERS.some((matcher) => matcher.test(statement))) {
    return 'negative';
  }
  if (HOUSING_RISK_STATEMENT_MATCHERS.some((matcher) => matcher.test(statement))) {
    return 'negative';
  }
  if (SECURITY_CONCERN_MATCHERS.some((matcher) => matcher.test(statement))) {
    return 'negative';
  }
  return 'positive';
}

function interpretStatementRow(
  polarity: import('./types').IndicatorPolarity,
  agreement: number,
  movement: number,
): string {
  if (polarity === 'negative') {
    if (agreement >= 60) {
      return movement > 0
        ? 'Elevated reported concern — agreement rose, indicating more residents report this issue.'
        : 'Elevated reported concern — higher agreement means more residents report this issue, not an improvement outcome.';
    }
    return movement < 0
      ? 'Reported concern eased versus the prior year, but this remains a risk-framed indicator.'
      : 'Moderate reported concern — lower values are more favourable for risk indicators.';
  }

  if (agreement >= 70) {
    return movement >= 0
      ? 'Strong positive signal with stable or improving agreement.'
      : 'Strong positive signal, though agreement softened year on year.';
  }

  return movement >= 0
    ? 'Mixed or moderate positive signal with slight improvement.'
    : 'Weaker positive signal — agreement declined year on year.';
}

export interface StatementRegisterRow {
  id: string;
  questionGroup: string;
  statementAr: string;
  statementEn?: string;
  polarity: import('./types').IndicatorPolarity;
  agreement2024: number;
  agreement2025: number;
  disagreement2024: number;
  disagreement2025: number;
  movement: number;
  interpretation: string;
}

export function getStatementRegisterData(
  questions: import('./types').Question[],
  compareYears: import('./types').CompareYears,
  questionCode?: string,
): StatementRegisterRow[] {
  return getLikertStatements(questions)
    .filter((question) => !questionCode || question.code === questionCode)
    .map((question) => {
      const polarity = resolveQuestionPolarity(question);
      const agreement2024 = question.data[compareYears[0]]?.agreement ?? 0;
      const agreement2025 = question.data[compareYears[1]]?.agreement ?? 0;
      const disagreement2024 = getLikertDisagreementPercent(question.data[compareYears[0]]?.breakdown ?? {});
      const disagreement2025 = getLikertDisagreementPercent(question.data[compareYears[1]]?.breakdown ?? {});

      return {
        id: `${question.code}-${question.statementAr}`,
        questionGroup: question.code,
        statementAr: question.statementAr,
        statementEn: question.statementEn,
        polarity,
        agreement2024,
        agreement2025,
        disagreement2024,
        disagreement2025,
        movement: agreement2025 - agreement2024,
        interpretation: interpretStatementRow(polarity, agreement2025, agreement2025 - agreement2024),
      };
    });
}

export function generateEnvironmentRiskInsight(
  agreement: number,
  movement: number,
  mode: ViewMode,
): string[] {
  const direction = movement > 0 ? 'rose' : movement < 0 ? 'fell' : 'held steady';
  const level = agreement >= 60 ? 'elevated' : agreement >= 40 ? 'moderate' : 'lower';

  if (mode === 'current') {
    return [
      `${agreement.toFixed(1)}% of residents report insects and rodents in living areas — a risk indicator where higher agreement means more reported concern.`,
      `Current concern level is ${level}; this is not a satisfaction outcome.`,
    ];
  }

  return [
    `Reported concern ${direction} by ${Math.abs(movement).toFixed(1)}pp to ${agreement.toFixed(1)}% in ${mode === 'yoy' ? '2025' : 'the selected year'}.`,
    'Higher agreement indicates more residents report this issue — not an improvement outcome.',
  ];
}

const AGENDA_QUESTION_CODES: Record<string, string[]> = {
  education: ['Q301'],
  work: ['Q210'],
  security: ['Q401'],
  housing: ['Q701'],
  environment: ['Q601'],
  infrastructure: ['Q801'],
  health: ['Q501', 'Q502'],
};

const AGENDA_CONCERN_CLAUSES: Array<[RegExp, string]> = [
  [/verbal abuse by other students/i, 'parents agree children face repeated verbal abuse at local schools — mockery, name-calling, or rumors'],
  [/physical abuse by other students/i, 'parents agree children face repeated physical abuse at local schools'],
  [/physically harmed more than once/i, 'parents report repeated physical harm among students at local schools'],
  [/harassed, ridiculed, and called bad names/i, 'parents agree children are harassed and called names at local schools'],
  [/harassed, ridiculed, and called names/i, 'parents report harassment and name-calling at local schools'],
  [/barely covers family expenses/i, 'workers agree pay barely covers family expenses'],
  [/afraid of losing my job/i, 'workers fear losing their job'],
  [/busy and stressed/i, 'workers agree the job leaves them busy and stressed'],
  [/negative physical and psychological/i, 'workers agree the job is harming their health'],
  [/physical violence or threats|exposed to an incident/i, 'residents report physical violence or threats in the past year'],
  [/fear for my children/i, 'parents fear negative peer influence on their children'],
  [/insects and some rodents appear constantly in the residence/i, 'residents report insects and rodents inside the home'],
  [/insects and some rodents/i, 'residents agree insects and rodents keep appearing in the area'],
  [/unpleasant odors inside the residence/i, 'residents report unpleasant odors inside the home'],
  [/residence needs repairs and maintenance/i, 'residents agree the home needs repairs'],
  [/size of the house is small or insufficient/i, 'residents agree the home is too small'],
  [/densely populated area makes me feel unstable/i, 'residents agree overcrowding makes the area feel unstable'],
];

const AGENDA_TARGET_MIN = 55;
const AGENDA_SCALE_MIN = 75;
const AGENDA_PROTECT_MIN = 70;
const AGENDA_LANE_LIMITS: Record<ActionPrompt, number> = {
  target: 6,
  close: 6,
  protect: 5,
  scale: 4,
};

interface AgendaStatementSignal {
  id: string;
  sectionId: string;
  pillar: string;
  agreement: number;
  movement: number;
  statement: string;
  shortLabel: string;
  polarity: import('./types').IndicatorPolarity;
}

function getAgendaShortLabel(sectionId: string, statement: string): string {
  switch (sectionId) {
    case 'education':
      return formatEducationAxisLabel(statement);
    case 'work':
      return getWorkQ210ShortLabel(statement);
    case 'security':
      return getSecurityQ401ShortLabel(statement);
    case 'housing':
      return getHousingQ701ShortLabel(statement);
    case 'infrastructure':
      return getInfrastructureQ801ShortLabel(statement);
    case 'health':
      return formatHealthHeatmapLabel(statement);
    case 'environment': {
      const chart = Object.values(ENVIRONMENT_CHART_STATEMENTS).find((entry) => entry.match.test(statement));
      if (chart) return chart.short;
      if (ENVIRONMENT_KPI_STATEMENT.cleanliness.test(statement)) return 'Neighborhood cleanliness';
      if (ENVIRONMENT_KPI_STATEMENT.airQuality.test(statement)) return 'Air quality';
      if (ENVIRONMENT_KPI_STATEMENT.noiseLevel.test(statement)) return 'Noise level';
      if (/availability of shopping areas/i.test(statement)) return 'Shopping areas';
      if (/general appearance of the city/i.test(statement)) return 'City appearance control';
      if (/beautification and landscaping/i.test(statement)) return 'Street landscaping';
      return compactStatementLabel(statement);
    }
    default:
      return truncateStatementLabel(statement, 32);
  }
}

function concernClause(statement: string): string {
  const match = AGENDA_CONCERN_CLAUSES.find(([pattern]) => pattern.test(statement));
  if (match) return match[1];
  return `residents report this problem: ${truncateStatementLabel(statement, 64)}`;
}

function getAllAgendaSignals(
  data: import('./types').SurveyData,
  compareYears: import('./types').CompareYears,
): AgendaStatementSignal[] {
  return Object.entries(AGENDA_QUESTION_CODES).flatMap(([sectionId, codes]) => {
    const section = data.sections[sectionId];
    if (!section) return [];

    return getLikertStatements(section.questions)
      .filter((question) => codes.includes(question.code))
      .map((question) => {
        const earlier = question.data[compareYears[0]]?.agreement ?? 0;
        const later = question.data[compareYears[1]]?.agreement ?? 0;
        const statement = question.statementEn ?? question.statementAr;
        return {
          id: `${sectionId}-${question.code}-${statement}`,
          sectionId,
          pillar: section.nameEn,
          agreement: later,
          movement: getYearDelta(earlier, later, compareYears),
          statement,
          shortLabel: getAgendaShortLabel(sectionId, statement),
          polarity: resolveQuestionPolarity(question),
        };
      })
      .filter((signal) => signal.agreement > 0);
  });
}

function classifyAgendaSignal(signal: AgendaStatementSignal): ActionPrompt | null {
  if (signal.polarity === 'negative') {
    return signal.agreement >= AGENDA_TARGET_MIN ? 'target' : null;
  }
  if (signal.agreement >= AGENDA_SCALE_MIN) return 'scale';
  if (signal.agreement >= AGENDA_PROTECT_MIN) return 'protect';
  return 'close';
}

function formatAgendaPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function joinPillarNames(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length <= 1) return unique[0] ?? '';
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`;
}

function toAgendaItem(prompt: ActionPrompt, signal: AgendaStatementSignal): ActionAgendaItem {
  if (prompt === 'target') {
    return {
      id: signal.id,
      prompt,
      pillar: signal.pillar,
      title: signal.shortLabel,
      summary: `${formatAgendaPercent(signal.agreement)} — ${concernClause(signal.statement)}.`,
    };
  }

  if (prompt === 'close') {
    return {
      id: signal.id,
      prompt,
      pillar: signal.pillar,
      title: signal.shortLabel,
      summary: `${formatAgendaPercent(signal.agreement)} satisfied — lowest enough to close the gap on this ${signal.pillar.toLowerCase()} item.`,
    };
  }

  if (prompt === 'protect') {
    const slipNote = signal.movement < 0
      ? ` Fell ${Math.abs(signal.movement).toFixed(1)}pp vs last year.`
      : '';
    return {
      id: signal.id,
      prompt,
      pillar: signal.pillar,
      title: signal.shortLabel,
      summary: `${formatAgendaPercent(signal.agreement)} satisfied — solid, but hold this ${signal.pillar.toLowerCase()} result.${slipNote}`,
    };
  }

  return {
    id: signal.id,
    prompt,
    pillar: signal.pillar,
    title: signal.shortLabel,
    summary: `${formatAgendaPercent(signal.agreement)} — residents are satisfied with ${signal.shortLabel.charAt(0).toLowerCase() + signal.shortLabel.slice(1)}.`,
  };
}

function rankAgendaSignals(prompt: ActionPrompt, signals: AgendaStatementSignal[]): AgendaStatementSignal[] {
  const ranked = [...signals].sort((left, right) => {
    if (prompt === 'close') return left.agreement - right.agreement;
    if (prompt === 'protect') return left.agreement - right.agreement;
    return right.agreement - left.agreement;
  });
  return ranked.slice(0, AGENDA_LANE_LIMITS[prompt]);
}

export function generateActionAgenda(
  data: import('./types').SurveyData,
  compareYears: import('./types').CompareYears,
): Record<ActionPrompt, ActionAgendaItem[]> {
  const buckets: Record<ActionPrompt, AgendaStatementSignal[]> = {
    target: [],
    protect: [],
    close: [],
    scale: [],
  };

  for (const signal of getAllAgendaSignals(data, compareYears)) {
    const lane = classifyAgendaSignal(signal);
    if (lane) buckets[lane].push(signal);
  }

  const pendingPillars = getEvidenceCoverageSummary(data).pendingPillars;
  const close: ActionAgendaItem[] = [
    ...rankAgendaSignals('close', buckets.close).map((signal) => toAgendaItem('close', signal)),
    ...pendingPillars.map((pillar) => ({
      id: `pending-${pillar}`,
      prompt: 'close' as const,
      pillar,
      title: 'Score pending approval',
      summary: 'Approved overall score is not yet available. Close the source gap before including this pillar in executive averages.',
    })),
  ];

  return {
    target: rankAgendaSignals('target', buckets.target).map((signal) => toAgendaItem('target', signal)),
    protect: rankAgendaSignals('protect', buckets.protect).map((signal) => toAgendaItem('protect', signal)),
    scale: rankAgendaSignals('scale', buckets.scale).map((signal) => toAgendaItem('scale', signal)),
    close,
  };
}

export function generateActionAgendaInsight(
  agenda: Record<ActionPrompt, ActionAgendaItem[]>,
): string {
  const targetTitles = agenda.target.slice(0, 3).map((item) => item.title);
  const closeTitles = agenda.close
    .filter((item) => item.title !== 'Score pending approval')
    .slice(0, 2)
    .map((item) => item.title);
  const parts: string[] = [];

  if (targetTitles.length > 0) {
    parts.push(`priority concerns are ${joinPillarNames(targetTitles).toLowerCase()}`);
  }
  if (closeTitles.length > 0) {
    parts.push(`weaker satisfaction shows up in ${joinPillarNames(closeTitles).toLowerCase()}`);
  }

  if (parts.length === 0) {
    const strong = agenda.scale.slice(0, 2).map((item) => item.title);
    if (strong.length > 0) {
      return `${joinPillarNames(strong)} lead the strong survey signals. See the cards below for the detail.`;
    }
    return 'No survey signals need immediate attention. See the cards below for the current evidence.';
  }

  const lead = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const body = parts.length > 1 ? `${lead}, and ${parts.slice(1).join(', and ')}.` : `${lead}.`;
  return `${body} See the cards below for the specific survey signals.`;
}
