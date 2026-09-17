export type ViewMode = 'current' | 'yoy';
export type SurveyYear = '2024' | '2025';
export type CompareYears = readonly [SurveyYear, SurveyYear];

export const SURVEY_YEARS: SurveyYear[] = ['2024', '2025'];
export const DEFAULT_COMPARE_YEARS: CompareYears = ['2024', '2025'];

export type ScoreStatus = 'approved' | 'pending' | 'unavailable';

export interface PillarScoreCoverage {
  sectionId: string;
  sectionNameEn: string;
  status: ScoreStatus;
}

export interface SectionScore {
  sectionId: string;
  sectionNameEn: string;
  sectionNameAr: string;
  score2024: number;
  score2025: number;
  yoyChange: number;
  positive2024: number;
  positive2025: number;
  negative2024: number;
  negative2025: number;
}

export type IndicatorPolarity = 'positive' | 'negative';

export interface LikertQuestion {
  code: string;
  type: 'likert' | 'rating';
  labelAr: string;
  labelEn?: string;
  statementAr: string;
  statementEn?: string;
  polarity?: IndicatorPolarity;
  data: Record<string, { agreement: number | null; breakdown: Record<string, number> }>;
}

export interface CategoryQuestion {
  code: string;
  type: 'categorical' | 'multi_select';
  labelAr: string;
  labelEn?: string;
  categoryAr: string;
  categoryEn?: string;
  data: Record<string, number>;
}

export interface MeanQuestion {
  code: string;
  type: 'mean';
  labelAr: string;
  labelEn?: string;
  dimensionAr: string;
  dimensionEn?: string;
  data: Record<string, number>;
}

export type Question = LikertQuestion | CategoryQuestion | MeanQuestion;

export interface DataReadiness {
  status: ScoreStatus;
  expectedGroups: string[];
  sourceOwner: string;
  targetDate: string;
}

export interface Section {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  score: SectionScore | null;
  scoreStatus?: ScoreStatus;
  dataReadiness?: DataReadiness;
  questions: Question[];
}

export interface SurveyBrief {
  objective: string;
  scope: string;
  fieldworkPeriod: string;
  plannedSample: number | null;
  achievedResponses: number;
  responseRate: number | null;
}

export interface SurveyData {
  district: string;
  districtAr: string;
  years: number[];
  updatedAt: string;
  surveyPeriod?: string;
  interfaceReleaseDate?: string;
  sampleBase?: Partial<Record<SurveyYear, number>>;
  pillarScoreCoverage?: PillarScoreCoverage[];
  surveyBrief?: SurveyBrief;
  isDemoData: boolean;
  overview: {
    overallScore2024: number;
    overallScore2025: number;
    overallYoyChange: number;
    bestImproved: { section: string; change: number };
    mostDeclined: { section: string; change: number };
    highestScore: { section: string; score: number };
    lowestScore: { section: string; score: number };
  };
  sectionScores: Record<string, SectionScore>;
  sections: Record<string, Section>;
}

export type TabStatus = 'RR' | 'DEV' | 'AP' | 'PSA';

export const TAB_STATUS_TOOLTIPS: Record<TabStatus, string> = {
  RR: 'RR: Review Ready',
  DEV: 'DEV: Under Development',
  AP: 'AP: Approved',
  PSA: 'PSA: Pending Score Approval',
};

export const PILLAR_TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid', status: 'RR' },
  { id: 'income', label: 'Income & Living', icon: 'wallet', status: 'PSA' },
  { id: 'work-education', label: 'Work & Education', icon: 'briefcase', status: 'RR' },
  { id: 'security', label: 'Security & Safety', icon: 'shield', status: 'RR' },
  { id: 'health', label: 'Health', icon: 'heart', status: 'RR' },
  { id: 'environment', label: 'Environment', icon: 'leaf', status: 'RR' },
  { id: 'housing-infrastructure', label: 'Housing & Infrastructure', icon: 'home', status: 'RR' },
] as const;

export type TabId = (typeof PILLAR_TABS)[number]['id'];

/** Tabs blocked until score approval or other release criteria are met. */
export const DISABLED_TABS: readonly TabId[] = ['income'];

export function isTabAccessible(tabId: TabId): boolean {
  return !DISABLED_TABS.includes(tabId);
}

/** Design tokens matched to Foreign Trade Dashboard reference */
export const DESIGN = {
  kpi: {
    purple: '#6B46C1',
    blue: '#2563EB',
    teal: '#0D9488',
    green: '#059669',
    greenLight: '#10B981',
  },
  chart: {
    export: '#10B981',
    import: '#F59E0B',
    bar: '#14B8A6',
    barAlt: '#10B981',
    barMuted: '#94a3b8',
    yearPrevious: '#cbd5e1',
    yearCurrent: '#3b82f6',
    grid: '#E5E7EB',
    axis: '#9CA3AF',
  },
  partner: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'],
  accent: '#2563EB',
  positive: '#059669',
  negative: '#DC2626',
} as const;

/** Gradient backgrounds for KPI cards (reference design) */
export const KPI_GRADIENTS = [
  'linear-gradient(135deg, #7C3AED 0%, #6B46C1 50%, #5B21B6 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
  'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)',
  'linear-gradient(135deg, #34D399 0%, #059669 50%, #047857 100%)',
  'linear-gradient(135deg, #6EE7B7 0%, #10B981 50%, #059669 100%)',
] as const;

export const CHART_COLORS = DESIGN.partner;
