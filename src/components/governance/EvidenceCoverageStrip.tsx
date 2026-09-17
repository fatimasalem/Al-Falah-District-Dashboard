import type { SurveyData } from '../../types';
import { getEvidenceCoverageSummary } from '../../utils';

interface EvidenceCoverageStripProps {
  data: SurveyData;
}

function IconInfo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function EvidenceCoverageStrip({ data }: EvidenceCoverageStripProps) {
  const coverage = getEvidenceCoverageSummary(data);

  const missingDetail = coverage.pendingPillars.length > 0
    ? ` The missing score is ${coverage.pendingPillars.join(' and ')}.`
    : '';

  return (
    <div className="evidence-coverage-strip" role="status" aria-live="polite">
      <div className="evidence-coverage-strip-content">
        <span className="evidence-coverage-icon" aria-hidden="true">
          <IconInfo />
        </span>
        <p className="evidence-coverage-summary">
          {coverage.summaryLabel}.{missingDetail}
        </p>
      </div>
    </div>
  );
}
