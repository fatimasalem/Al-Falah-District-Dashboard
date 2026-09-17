import type { CompareYears, Section, SurveyYear, ViewMode } from '../../types';
import { DumbbellChart } from './DumbbellChart';
import {
  formatCompareYearsLabel,
  formatDelta,
  getSectionDumbbellItem,
  getYearDelta,
  pickYearValue,
} from '../../utils';

interface PillarSectionHeroProps {
  section: Section;
  compareYears: CompareYears;
  year: SurveyYear;
  viewMode: ViewMode;
  subtitle?: string;
}

export function PillarSectionHero({
  section,
  compareYears,
  year,
  viewMode,
  subtitle,
}: PillarSectionHeroProps) {
  const score = section.score;
  const dumbbellItem = getSectionDumbbellItem(section);
  const sectionScore = score ? pickYearValue(score.score2024, score.score2025, year) : null;
  const delta = score ? getYearDelta(score.score2024, score.score2025, compareYears) : null;

  return (
    <section className="pillar-section-hero" aria-label={`${section.nameEn} score overview`}>
      <div className="pillar-score-beacon">
        <div className="pillar-score-beacon-value-wrap">
          <div className="pillar-score-beacon-value">
            {sectionScore != null ? `${sectionScore.toFixed(1)}%` : '—'}
          </div>
          {delta != null && viewMode === 'yoy' && (
            <div className={`pillar-score-beacon-delta${delta >= 0 ? ' positive' : ' negative'}`}>
              {formatDelta(delta)} vs {formatCompareYearsLabel(compareYears)}
            </div>
          )}
        </div>
        <div className="pillar-score-beacon-copy">
          <h2 className="pillar-score-beacon-title">{section.nameEn} overall score</h2>
          <p className="pillar-score-beacon-subtitle">
            {subtitle ?? `Approved section score for ${year}. Statement views below are split by indicator polarity.`}
          </p>
        </div>
      </div>
      <DumbbellChart
        items={[dumbbellItem]}
        compareYears={compareYears}
        mode={viewMode}
        selectedYear={year}
        title="Section score movement"
        subtitle={`${formatCompareYearsLabel(compareYears)} approved section score`}
        compact
      />
    </section>
  );
}
