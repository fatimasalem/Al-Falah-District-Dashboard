import { generateInsights } from '../utils';
import type { SurveyData } from '../types';

interface InsightsPanelProps {
  data: SurveyData;
  activeTab: string;
}

export function InsightsPanel({ data, activeTab }: InsightsPanelProps) {
  const insights = generateInsights(activeTab, data);

  return (
    <aside className="insights-panel">
      <div className="insights-header">
        <h2 className="insights-title">AI Insights</h2>
        <span className="insights-badge">Powered by SCAD AI</span>
      </div>
      <p className="insights-text">
        Al Falah district resident survey data for {data.years.join(' and ')} shows overall satisfaction
        at {data.overview.overallScore2025}%, with notable movement across key quality-of-life pillars.
      </p>
      <div>
        <div className="insights-section-title">Key Takeaways</div>
        <ul className="insights-list">
          {insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="insights-cta">
        Ask a follow-up
      </button>
    </aside>
  );
}
