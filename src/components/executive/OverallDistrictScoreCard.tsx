import { useMemo, useState } from 'react';
import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  formatDelta,
  generateMomentumMatrixInsight,
  getYearDelta,
  type MomentumMatrixItem,
  type PillarDumbbellItem,
} from '../../utils';
import { ChartInsightFooter } from '../charts/ChartInsightFooter';
import {
  ChartSectionHeader,
  ChartSectionIcon,
  type ChartSectionIconName,
} from '../charts/ChartSectionHeader';
import { MomentumMatrix, SCORE_BAND_LEGEND } from '../charts/MomentumMatrix';
import { PillarCompositionBarChart } from '../charts/PillarCompositionBarChart';

type PillarViewId = 'composition' | 'momentum';

const PILLAR_VIEWS: Array<{
  id: PillarViewId;
  label: string;
  icon: ChartSectionIconName;
}> = [
  { id: 'composition', label: 'Pillar score composition', icon: 'bar-composition' },
  { id: 'momentum', label: 'Performance & momentum matrix', icon: 'momentum-matrix' },
];

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
  momentumItems: MomentumMatrixItem[];
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
  momentumItems,
  selectedYear,
}: OverallDistrictScoreCardProps) {
  const [activeView, setActiveView] = useState<PillarViewId>('composition');
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
  const momentumSubtitle = isYoY
    ? `2025 section score share vs ${formatCompareYearsLabel(compareYears)} movement for approved pillars`
    : 'Section score share for approved pillars in the selected year';
  const isComposition = activeView === 'composition';
  const sharedInsight = useMemo(
    () => generateMomentumMatrixInsight(momentumItems, viewMode),
    [momentumItems, viewMode],
  );
  const chartTitle = isComposition
    ? 'Pillar score composition'
    : 'Performance & momentum matrix';

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
            icon={isComposition ? 'bar-composition' : 'momentum-matrix'}
            title={chartTitle}
            titleClassName="pillar-composition-title"
            subtitleClassName="pillar-composition-subtitle"
            subtitle={isComposition ? compositionSubtitle : momentumSubtitle}
          />
          <div className="pillar-view-toggle" role="tablist" aria-label="Pillar score views">
            {PILLAR_VIEWS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-label={tab.label}
                aria-selected={activeView === tab.id}
                title={tab.label}
                className={`pillar-view-toggle-btn${activeView === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveView(tab.id)}
              >
                <ChartSectionIcon name={tab.icon} />
              </button>
            ))}
          </div>
        </div>

        <div
          className="pillar-view-panel"
          role="tabpanel"
          aria-label={chartTitle}
        >
          {isComposition ? (
            <PillarCompositionBarChart
              items={pillarItems}
              compareYears={compareYears}
              mode={viewMode}
              selectedYear={selectedYear}
            />
          ) : (
            <MomentumMatrix
              items={momentumItems}
              viewMode={viewMode}
              compareYears={compareYears}
              chartOnly
            />
          )}
          <ul className="momentum-treemap-legend" aria-label="Score band legend">
            {SCORE_BAND_LEGEND.map((entry) => (
              <li key={entry.key}>
                <span
                  className="momentum-treemap-legend-swatch"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.label}
              </li>
            ))}
          </ul>
        </div>

        <ChartInsightFooter chartTitle="Pillar score views" insight={sharedInsight} />
      </div>
    </section>
  );
}
