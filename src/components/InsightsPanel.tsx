import { useEffect, useRef, useState } from 'react';
import { useInsights } from '../context/InsightsContext';
import { generateInsights } from '../utils';
import type { SurveyData } from '../types';

interface InsightsPanelProps {
  data: SurveyData;
  activeTab: string;
}

function InsightsSparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function InsightsPanel({ data, activeTab }: InsightsPanelProps) {
  const insights = generateInsights(activeTab, data);
  const { followUp, clearFollowUp, closePanel } = useInsights();
  const cardRef = useRef<HTMLElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    clearFollowUp();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    const timer = window.setTimeout(() => setIsGenerating(false), 700);
    return () => window.clearTimeout(timer);
  }, [activeTab, clearFollowUp]);

  useEffect(() => {
    if (followUp && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [followUp]);

  const showFollowUp = Boolean(followUp) && !isGenerating;

  return (
    <section
      ref={cardRef}
      className={`insights-banner-card${isGenerating ? ' is-generating' : ''}`}
      aria-label="AI Insights"
      aria-busy={isGenerating}
    >
      <div className="insights-banner-header">
        <div className="insights-banner-title-row">
          <span className="insights-banner-sparkle" aria-hidden="true">
            <InsightsSparkleIcon />
          </span>
          {isGenerating ? (
            <span className="insights-banner-title-skeleton" aria-hidden="true" />
          ) : (
            <h2 className="insights-banner-title">
              {showFollowUp ? 'Chart Insight' : 'Key Takeaways'}
            </h2>
          )}
        </div>
        {showFollowUp && (
          <button
            type="button"
            className="insights-banner-close"
            aria-label="Back to key takeaways"
            onClick={closePanel}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="insights-banner-body">
        {isGenerating ? (
          <div className="insights-banner-skeleton" aria-hidden="true">
            <span className="insights-banner-skeleton-line" style={{ width: '92%' }} />
            <span className="insights-banner-skeleton-line" style={{ width: '78%' }} />
            <span className="insights-banner-skeleton-line" style={{ width: '64%' }} />
            <span className="insights-banner-skeleton-line" style={{ width: '48%' }} />
          </div>
        ) : showFollowUp && followUp ? (
          <div className="insights-banner-follow-up">
            <p className="insights-banner-follow-up-chart">{followUp.chartTitle}</p>
            <div className="insights-banner-follow-up-question">
              <InsightsChatIcon />
              <p>{followUp.question}</p>
            </div>
            <div className="insights-banner-follow-up-answer">
              <span className="insights-banner-sparkle insights-banner-sparkle-inline" aria-label="Bayaan AI">
                <InsightsSparkleIcon />
              </span>
              <p>{followUp.answer}</p>
            </div>
          </div>
        ) : (
          <ul className="insights-banner-list">
            {insights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="insights-banner-footer">
        {isGenerating ? 'Generating insights' : 'AI Insights'}
      </div>
    </section>
  );
}
