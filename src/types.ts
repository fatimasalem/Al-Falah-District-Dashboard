export type ViewMode = 'current' | 'yoy';
export type SurveyYear = '2024' | '2025';

export const SURVEY_YEARS: SurveyYear[] = ['2024', '2025'];

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

export interface LikertQuestion {
  code: string;
  type: 'likert' | 'rating';
  labelAr: string;
  labelEn?: string;
  statementAr: string;
  statementEn?: string;
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

export interface Section {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  score: SectionScore | null;
  questions: Question[];
}

export interface SurveyData {
  district: string;
  districtAr: string;
  years: number[];
  updatedAt: string;
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

export const PILLAR_TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'income', label: 'Income & Living', icon: 'wallet' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'education', label: 'Education', icon: 'book' },
  { id: 'security', label: 'Security & Safety', icon: 'shield' },
  { id: 'health', label: 'Health', icon: 'heart' },
  { id: 'environment', label: 'Environment', icon: 'leaf' },
  { id: 'infrastructure', label: 'Infrastructure', icon: 'building' },
  { id: 'demographics', label: 'Demographics', icon: 'users' },
  { id: 'housing', label: 'Housing', icon: 'home' },
] as const;

export type TabId = (typeof PILLAR_TABS)[number]['id'];

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
