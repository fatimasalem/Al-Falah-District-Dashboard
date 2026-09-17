export type WorkEducationQuestionCode = 'Q210' | 'Q301';

const OPTIONS: { value: WorkEducationQuestionCode; label: string }[] = [
  { value: 'Q210', label: 'Q210 — Employment' },
  { value: 'Q301', label: 'Q301 — Education' },
];

interface QuestionCodeSelectProps {
  value: WorkEducationQuestionCode;
  onChange: (value: WorkEducationQuestionCode) => void;
  ariaLabel: string;
}

export function QuestionCodeSelect({ value, onChange, ariaLabel }: QuestionCodeSelectProps) {
  return (
    <label className="question-code-select">
      <span className="visually-hidden">{ariaLabel}</span>
      <select
        className="question-code-select-input"
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value as WorkEducationQuestionCode)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
