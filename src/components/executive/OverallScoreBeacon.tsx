import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import { formatCompareYearsLabel, formatDelta, getYearDelta } from '../../utils';

interface OverallScoreBeaconProps {
  score: number | null;
  score2024: number | null;
  score2025: number | null;
  approvedCount: number;
  totalCount: number;
  year: SurveyYear;
  viewMode: ViewMode;
  compareYears: CompareYears;
}

export function OverallScoreBeacon({
  score,
  score2024,
  score2025,
  approvedCount,
  totalCount,
  year,
  viewMode,
  compareYears,
}: OverallScoreBeaconProps) {
  const delta = viewMode === 'yoy' && score2024 != null && score2025 != null
    ? getYearDelta(score2024, score2025, compareYears)
    : null;
  const allApproved = approvedCount >= totalCount;
  const averageNote = allApproved
    ? `Unweighted average of all ${approvedCount} section scores`
    : `Unweighted average of ${approvedCount} approved section scores`;

  return (
    <section className="overall-score-beacon" aria-label="Overall district score">
      <div className="overall-score-beacon-inner">
        <div className="overall-score-beacon-value-wrap">
          <div className="overall-score-beacon-value">
            {score != null ? `${score.toFixed(1)}%` : '—'}
          </div>
          {delta != null && (
            <div className={`overall-score-beacon-delta${delta >= 0 ? ' positive' : ' negative'}`}>
              {formatDelta(delta)} vs {formatCompareYearsLabel(compareYears)}
            </div>
          )}
        </div>
        <div className="overall-score-beacon-copy">
          <h2 className="overall-score-beacon-title">Overall district score</h2>
          <p className="overall-score-beacon-subtitle">
            {viewMode === 'yoy'
              ? `${averageNote} (${formatCompareYearsLabel(compareYears)}).`
              : `${averageNote} for ${year}.`}
          </p>
        </div>
      </div>
    </section>
  );
}
