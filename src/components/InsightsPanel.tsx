import { useEffect, useRef } from 'react';
import { useInsights } from '../context/InsightsContext';
import { generateInsights } from '../utils';
import type { SurveyData } from '../types';

interface InsightsPanelProps {
  data: SurveyData;
  activeTab: string;
}

function InsightsSparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 4.4L17 8l-3.8 1.2L12 14l-1.2-4.8L7 8l3.8-1.6L12 2z"
        fill="currentColor"
      />
      <path
        d="M5 18l.6 1.8L7.4 20l-1.8.6L5 22.4l-.6-1.8L2.6 20l1.8-.6L5 18zM19 16l.4 1.2L20.6 17l-1.2.4L19 18.6l-.4-1.2L17.4 17l1.2-.4L19 16z"
        fill="currentColor"
      />
    </svg>
  );
}

function InsightsChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function InsightsPanel({ data, activeTab }: InsightsPanelProps) {
  const insights = generateInsights(activeTab, data);
  const { followUp, clearFollowUp } = useInsights();
  const followUpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearFollowUp();
  }, [activeTab, clearFollowUp]);

  useEffect(() => {
    if (followUp && followUpRef.current) {
      followUpRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [followUp]);

  return (
    <aside className="insights-panel">
      <div className="insights-header">
        <div className="insights-title-row">
          <h2 className="insights-title">AI Insights</h2>
        </div>
        <span className="insights-ai-sparkle" aria-label="Bayaan AI">
          <InsightsSparkleIcon />
        </span>
      </div>
      <p className="insights-text">
        Al Falah district resident survey data for {data.years.join(' and ')} shows overall satisfaction
        at {data.overview.overallScore2025}%, with notable movement across key quality-of-life pillars.
      </p>
      <div className="insights-takeaways">
        <div className="insights-section-title">Key Takeaways</div>
        <ul className="insights-list">
          {insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {followUp && (
        <div className="insights-follow-up" ref={followUpRef}>
          <div className="insights-follow-up-question">
            <InsightsChatIcon />
            <p>{followUp.question}</p>
          </div>
          <div className="insights-follow-up-answer">
            <span className="insights-ai-sparkle" aria-label="Bayaan AI">
              <InsightsSparkleIcon />
            </span>
            <p>{followUp.answer}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
