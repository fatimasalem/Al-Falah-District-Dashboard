import type { CompareYears, SurveyYear, ViewMode } from '../../types';
import type { MomentumMatrixItem, RiskRegisterItem } from '../../utils';
import { ChartSectionHeader } from '../charts/ChartSectionHeader';
import { MomentumMatrix } from '../charts/MomentumMatrix';
import { RiskRegister } from '../charts/RiskRegister';

interface ExecutiveDecisionLensProps {
  momentumItems: MomentumMatrixItem[];
  riskItems: RiskRegisterItem[];
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

export function ExecutiveDecisionLens({
  momentumItems,
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
          subtitle="Relate 2025 performance, year-on-year momentum, and unresolved risk in one management view."
        />
      </header>

      <div className="executive-decision-lens-grid">
        <MomentumMatrix items={momentumItems} viewMode={viewMode} compareYears={compareYears} embedded />
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
