import type { DataReadiness } from '../../types';

interface DataReadinessCardProps {
  sectionName: string;
  readiness: DataReadiness;
}

export function DataReadinessCard({ sectionName, readiness }: DataReadinessCardProps) {
  const statusLabel = readiness.status === 'pending'
    ? 'Score pending approval'
    : readiness.status === 'unavailable'
      ? 'Score unavailable'
      : 'Approved';

  return (
    <section className="data-readiness-card" aria-label={`${sectionName} data readiness`}>
      <div className="data-readiness-card-header">
        <h2 className="data-readiness-card-title">{sectionName} score readiness</h2>
        <span className="data-readiness-card-status">{statusLabel}</span>
      </div>
      <p className="data-readiness-card-lead">
        Overall pillar scores and satisfaction charts are hidden until approved evidence is available.
        Indicator summaries below will appear once source approval is complete.
      </p>
      <dl className="data-readiness-card-grid">
        <div className="data-readiness-card-item">
          <dt>Expected question groups</dt>
          <dd>{readiness.expectedGroups.join(', ')}</dd>
        </div>
        <div className="data-readiness-card-item">
          <dt>Source owner</dt>
          <dd>{readiness.sourceOwner}</dd>
        </div>
        <div className="data-readiness-card-item">
          <dt>Target approval date</dt>
          <dd>{readiness.targetDate}</dd>
        </div>
        <div className="data-readiness-card-item">
          <dt>Coverage note</dt>
          <dd>Excluded from cross-pillar averages until an approved SCORE_1 is published.</dd>
        </div>
      </dl>
    </section>
  );
}
