import type { SurveyData } from '../../types';
import { getDefaultSurveyBrief } from '../../utils';

interface SurveyBriefSectionProps {
  data: SurveyData;
}

function SurveyBriefIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function SurveyBriefSection({ data }: SurveyBriefSectionProps) {
  const brief = data.surveyBrief ?? getDefaultSurveyBrief(data);
  const responses = brief.achievedResponses.toLocaleString();
  const fieldworkPeriod = brief.fieldworkPeriod;

  return (
    <section className="survey-brief-section" aria-label="Survey brief">
      <div className="survey-brief-section-header">
        <span className="survey-brief-section-icon">
          <SurveyBriefIcon />
        </span>
        <h2 className="survey-brief-section-title">Survey brief</h2>
      </div>
      <p className="survey-brief-section-text">
        This Survey was conducted to measure{' '}
        <strong>resident satisfaction and quality of life outcomes</strong> across the{' '}
        <strong>key pillars of Al Falah District in Abu Dhabi</strong>. The survey fieldwork was
        carried out during the <strong>{fieldworkPeriod}</strong> period. A total of{' '}
        <strong>{responses} responses</strong> were successfully collected. The findings are intended
        to provide insights into <strong>residents&apos; experiences and perceptions</strong>,
        supporting the ongoing assessment and enhancement of{' '}
        <strong>quality of life within the district</strong>.
      </p>
    </section>
  );
}
