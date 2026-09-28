import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import type { RiskRegisterItem } from '../../utils';
import { ChartSectionHeader } from '../charts/ChartSectionHeader';
import { RiskRegister } from '../charts/RiskRegister';

interface ExecutiveDecisionLensProps {
  riskItems: RiskRegisterItem[];
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

export function ExecutiveDecisionLens({
  riskItems,
  viewMode,
  selectedYear,
  compareYears,
}: ExecutiveDecisionLensProps) {
  return (
    <section className="executive-decision-lens" aria-label="Executive decision lens">
      <header className="executive-decision-lens-header">
        <ChartSectionHeader
          icon="executive-lens"
          title="Executive decision lens"
          titleClassName="executive-decision-lens-title"
          subtitleClassName="executive-decision-lens-subtitle"
          subtitle="Surface unresolved residual risk across approved pillars in one management view."
        />
      </header>

      <div className="executive-decision-lens-grid executive-decision-lens-grid-single">
        <RiskRegister
          items={riskItems}
          viewMode={viewMode}
          selectedYear={selectedYear}
          compareYears={compareYears}
          embedded
        />
      </div>
    </section>
  );
}
