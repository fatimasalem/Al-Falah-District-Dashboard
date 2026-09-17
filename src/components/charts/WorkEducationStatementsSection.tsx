import { useMemo, useState } from 'react';
import type { CompareYears, Section, SurveyYear, ViewMode } from '../../types';
import {
  formatCompareYearsLabel,
  getEducationDivergingLikertRows,
  getWorkDivergingLikertRows,
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

  const workPositiveRows = getWorkDivergingLikertRows(
    workSection.questions,
    chartYear,
    'positive',
    viewMode,
    compareYears,
  );
  const workRiskRows = getWorkDivergingLikertRows(
    workSection.questions,
    chartYear,
    'negative',
    viewMode,
    compareYears,
  );
  const educationPositiveRows = getEducationDivergingLikertRows(
    educationSection.questions,
    chartYear,
    'positive',
    viewMode,
    compareYears,
  );
  const educationRiskRows = getEducationDivergingLikertRows(
    educationSection.questions,
    chartYear,
    'negative',
    viewMode,
    compareYears,
  );

  const shellSubtitle = useMemo(() => {
    if (questionCode === 'Q210') {
      return isYoY
        ? `${workPositiveRows.length} positive and ${workRiskRows.length} risk Q210 statements (${formatCompareYearsLabel(compareYears)}).`
        : `${workPositiveRows.length} positive and ${workRiskRows.length} risk Q210 statements for ${chartYear}.`;
    }

    return isYoY
      ? `${educationPositiveRows.length} positive and ${educationRiskRows.length} risk Q301 statements (${formatCompareYearsLabel(compareYears)}).`
      : `${educationPositiveRows.length} positive and ${educationRiskRows.length} risk Q301 statements for ${chartYear}.`;
  }, [
    chartYear,
    compareYears,
    educationPositiveRows.length,
    educationRiskRows.length,
    isYoY,
    questionCode,
    workPositiveRows.length,
    workRiskRows.length,
  ]);

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
          positiveRows={workPositiveRows}
          riskRows={workRiskRows}
          year={chartYear}
          viewMode={viewMode}
          compareYears={compareYears}
          hideShellHeader
        />
      ) : (
        <EducationStatementsCard
          positiveRows={educationPositiveRows}
          riskRows={educationRiskRows}
          year={chartYear}
          viewMode={viewMode}
          compareYears={compareYears}
          hideShellHeader
        />
      )}
    </section>
  );
}
