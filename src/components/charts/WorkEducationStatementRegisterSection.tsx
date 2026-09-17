import { useMemo, useState } from 'react';
import type { CompareYears, Section } from '../../types';
import { getStatementRegisterData } from '../../utils';
import { StatementRegister } from '../registers/StatementRegister';
import { QuestionCodeSelect, type WorkEducationQuestionCode } from './QuestionCodeSelect';

interface WorkEducationStatementRegisterSectionProps {
  workSection: Section;
  educationSection: Section;
  compareYears: CompareYears;
}

export function WorkEducationStatementRegisterSection({
  workSection,
  educationSection,
  compareYears,
}: WorkEducationStatementRegisterSectionProps) {
  const [questionCode, setQuestionCode] = useState<WorkEducationQuestionCode>('Q210');

  const registerRows = useMemo(() => {
    const questions = questionCode === 'Q210' ? workSection.questions : educationSection.questions;
    return getStatementRegisterData(questions, compareYears, questionCode);
  }, [compareYears, educationSection.questions, questionCode, workSection.questions]);

  const positiveRegister = registerRows.filter((row) => row.polarity === 'positive');
  const riskRegister = registerRows.filter((row) => row.polarity === 'negative');

  const subtitle = questionCode === 'Q210'
    ? 'Review employment pillar statements with agreement, disagreement, and movement.'
    : 'Review education pillar statements with agreement, disagreement, and movement.';

  const positiveTabSubtitle = questionCode === 'Q210'
    ? 'Satisfaction and confidence statements behind the Work pillar.'
    : 'Satisfaction and confidence statements behind the Education pillar.';

  const riskTabSubtitle = questionCode === 'Q210'
    ? 'Employment risk indicators — higher agreement means more reported concern.'
    : 'Bullying and harm indicators — higher agreement means more reported concern.';

  const riskTabLabel = questionCode === 'Q210' ? 'Employment risk' : 'School safety risk';

  return (
    <StatementRegister
      title={`${questionCode} statement register`}
      subtitle={subtitle}
      headerAction={(
        <QuestionCodeSelect
          value={questionCode}
          onChange={setQuestionCode}
          ariaLabel="Choose statement register question group"
        />
      )}
      tabs={[
        {
          id: 'positive',
          label: 'Positive statements',
          rows: positiveRegister,
          subtitle: positiveTabSubtitle,
        },
        {
          id: 'risk',
          label: riskTabLabel,
          rows: riskRegister,
          subtitle: riskTabSubtitle,
        },
      ]}
    />
  );
}
