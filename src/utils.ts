import type { SectionScore, SurveyData, ViewMode } from './types';
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

function getKpiCategoryShortLabel(categoryEn: string, fallbackName?: string): string {
  return KPI_CATEGORY_SHORT_LABELS[categoryEn] ?? fallbackName ?? categoryEn;
}

export function getIncomeKpiSentence(
  metric: 'score' | 'income' | 'expense' | 'debt',
  value: number,
  categoryEn?: string,
  categoryName?: string,
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
        ? `Top expense: ${getKpiCategoryShortLabel(categoryEn, categoryName)}`
        : 'No living expense data available.';
    case 'debt':
      return categoryEn
        ? `Top debt: ${getKpiCategoryShortLabel(categoryEn, categoryName)}`
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
        name: formatStatementAxisLabel(fullName),
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

export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function pickYearValue<T>(value2024: T, value2025: T, year: import('./types').SurveyYear): T {
  return year === '2025' ? value2025 : value2024;
}

export function getScoreValue(
  score: SectionScore,
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  if (mode === 'yoy') return score.yoyChange;
  return pickYearValue(score.score2024, score.score2025, year);
}

export function getPositiveValue(
  score: SectionScore,
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  if (mode === 'yoy') return score.positive2025 - score.positive2024;
  return pickYearValue(score.positive2024, score.positive2025, year);
}

export function getNegativeValue(
  score: SectionScore,
  mode: ViewMode,
  year: import('./types').SurveyYear = '2025',
): number {
  if (mode === 'yoy') return score.negative2025 - score.negative2024;
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
