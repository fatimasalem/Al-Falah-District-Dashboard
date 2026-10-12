import { useMemo, useState } from 'react';
import type { CompareYears, Section, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  getEducationPositiveStatements,
  getEducationRiskStatements,
  getWorkStatementsByPolarity,
  pickYearValue,
} from '../../utils';
import { ChartSectionIcon } from './ChartSectionHeader';
import { EducationStatementsCard } from './EducationStatementsCard';
import { QuestionCodeSelect, type WorkEducationQuestionCode } from './QuestionCodeSelect';
import { WorkStatementsCard } from './WorkStatementsCard';

interface WorkEducationStatementsSectionProps {
  workSection: Section;
  educationSection: Section;
  viewMode: ViewMode;
  selectedYear: SurveyYear;
  compareYears: CompareYears;
}

export function WorkEducationStatementsSection({
  workSection,
  educationSection,
  viewMode,
  selectedYear,
  compareYears,
}: WorkEducationStatementsSectionProps) {
  const [questionCode, setQuestionCode] = useState<WorkEducationQuestionCode>('Q210');
  const chartYear = viewMode === 'current' ? selectedYear : compareYears[1];
  const isYoY = viewMode === 'yoy';

  const workPositiveItems = useMemo(
    () =>
      getWorkStatementsByPolarity(workSection.questions, compareYears, 'positive').sort(
        (a, b) =>
          pickYearValue(b.value2024, b.value2025, chartYear) -
          pickYearValue(a.value2024, a.value2025, chartYear),
      ),
    [chartYear, compareYears, workSection.questions],
  );
  const workRiskItems = useMemo(
    () =>
      getWorkStatementsByPolarity(workSection.questions, compareYears, 'negative').sort(
        (a, b) =>
          pickYearValue(b.value2024, b.value2025, chartYear) -
          pickYearValue(a.value2024, a.value2025, chartYear),
      ),
    [chartYear, compareYears, workSection.questions],
  );
  const educationPositiveItems = useMemo(
    () =>
      getEducationPositiveStatements(educationSection.questions, compareYears).sort(
        (a, b) =>
          pickYearValue(b.value2024, b.value2025, chartYear) -
          pickYearValue(a.value2024, a.value2025, chartYear),
      ),
    [chartYear, compareYears, educationSection.questions],
  );
  const educationRiskItems = useMemo(
    () =>
      getEducationRiskStatements(educationSection.questions, compareYears).sort(
        (a, b) =>
          pickYearValue(b.value2024, b.value2025, chartYear) -
          pickYearValue(a.value2024, a.value2025, chartYear),
      ),
    [chartYear, compareYears, educationSection.questions],
  );

  const shellSubtitle = isYoY
    ? `Employment satisfaction and education quality statements with reported risk indicators (${formatCompareYearsLabel(compareYears)}).`
    : `Employment satisfaction and education quality statements with reported risk indicators for ${chartYear}.`;

  return (
    <section className="education-statements-shell-card" aria-label="Employment and education statements">
      <header className="education-statements-shell-header">
        <div className="education-statements-shell-heading">
          <span className="education-statements-shell-icon" aria-hidden="true">
            <ChartSectionIcon name="statement-register" />
          </span>
          <div className="education-statements-shell-heading-text">
            <h2 className="education-statements-shell-title">Employment &amp; education statements</h2>
            <p className="education-statements-shell-subtitle">{shellSubtitle}</p>
          </div>
        </div>
        <QuestionCodeSelect
          value={questionCode}
          onChange={setQuestionCode}
          ariaLabel="Choose statement question group"
        />
      </header>

      {questionCode === 'Q210' ? (
        <WorkStatementsCard
          positiveItems={workPositiveItems}
          riskItems={workRiskItems}
          year={chartYear}
          viewMode={viewMode}
          compareYears={compareYears}
          hideShellHeader
        />
      ) : (
        <EducationStatementsCard
          positiveItems={educationPositiveItems}
          riskItems={educationRiskItems}
          year={chartYear}
          viewMode={viewMode}
          compareYears={compareYears}
          hideShellHeader
        />
      )}
    </section>
  );
}
