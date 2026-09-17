import { useMemo } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  formatDelta,
  generatePillarCompositionInsight,
  getYearDelta,
  type PillarDumbbellItem,
} from '../../utils';
import { ChartInsightFooter } from '../charts/ChartInsightFooter';
import { ChartSectionHeader, ChartSectionIcon } from '../charts/ChartSectionHeader';
import { PillarCompositionBarChart } from '../charts/PillarCompositionBarChart';

interface OverallDistrictScoreCardProps {
  score: number | null;
  score2024: number | null;
  score2025: number | null;
  approvedCount: number;
  totalCount: number;
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears: CompareYears;
  pillarItems: PillarDumbbellItem[];
  selectedYear: SurveyYear;
}

export function OverallDistrictScoreCard({
  score,
  score2024,
  score2025,
  approvedCount,
  totalCount,
  year,
  viewMode,
  compareYears,
  pillarItems,
  selectedYear,
}: OverallDistrictScoreCardProps) {
  const isYoY = viewMode === 'yoy';
  const delta = isYoY && score2024 != null && score2025 != null
    ? getYearDelta(score2024, score2025, compareYears)
    : null;
  const allApproved = approvedCount >= totalCount;
  const averageNote = allApproved
    ? `Unweighted average of all ${approvedCount} section scores`
    : `Unweighted average of ${approvedCount} approved section scores`;
  const compositionSubtitle = isYoY
    ? `${formatCompareYearsLabel(compareYears)} approved section scores`
    : `Approved section scores for ${year}`;
  const compositionInsight = useMemo(
    () => generatePillarCompositionInsight(pillarItems, viewMode, selectedYear),
    [pillarItems, selectedYear, viewMode],
  );

  return (
    <section className="overall-district-score-card" aria-label="Overall district score and pillar composition">
      <header className="overall-district-score-card-header">
        <div className="overall-district-score-card-heading">
          <span className="overall-district-score-card-icon" aria-hidden="true">
            <ChartSectionIcon name="overall-score" />
          </span>
          <div className="overall-district-score-card-heading-text">
          <h2 className="overall-district-score-card-title">Overall district score</h2>
          <p className="overall-district-score-card-subtitle">
            {isYoY
              ? `${averageNote} (${formatCompareYearsLabel(compareYears)}).`
              : `${averageNote} for ${year}.`}
          </p>
          </div>
        </div>
        <div className="overall-district-score-card-metric">
          <div className="overall-district-score-card-value">
            {score != null ? `${score.toFixed(1)}%` : '—'}
          </div>
          {delta != null && (
            <div className={`overall-district-score-card-delta${delta >= 0 ? ' positive' : ' negative'}`}>
              {formatDelta(delta)} vs {formatCompareYearsLabel(compareYears)}
            </div>
          )}
        </div>
      </header>

      <div className="overall-district-score-card-inner">
        <div className="overall-district-score-card-inner-header">
          <ChartSectionHeader
            icon="compare"
            title="Pillar score composition"
            titleClassName="pillar-composition-title"
            subtitleClassName="pillar-composition-subtitle"
            subtitle={compositionSubtitle}
          />
          <div className="pillar-composition-legend" aria-hidden="true">
            {isYoY ? (
              <>
                <span><i className="pillar-composition-legend-dot previous" /> {compareYears[0]}</span>
                <span><i className="pillar-composition-legend-dot current" /> {compareYears[1]}</span>
              </>
            ) : (
              <span><i className="pillar-composition-legend-dot current" /> {year}</span>
            )}
          </div>
        </div>
        <PillarCompositionBarChart
          items={pillarItems}
          compareYears={compareYears}
          mode={viewMode}
          selectedYear={selectedYear}
        />
        <ChartInsightFooter chartTitle="Pillar score composition" insight={compositionInsight} />
      </div>
    </section>
  );
}
