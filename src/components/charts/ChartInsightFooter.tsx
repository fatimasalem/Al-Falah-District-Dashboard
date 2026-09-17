import { useInsights } from '../../context/InsightsContext';
import { type InsightPart } from '../../utils';

const INSIGHT_NUMERIC_PATTERN = /(\d+(?:\.\d+)?%|\d+(?:\.\d+)?)/g;

function getInsightNumericTone(text: string): 'positive' | 'negative' | undefined {
  if (!text.endsWith('%')) return undefined;
  const value = Number.parseFloat(text);
  if (Number.isNaN(value)) return undefined;
  return value >= 70 ? 'positive' : value <= 40 ? 'negative' : undefined;
}

function getInsightEmphasisClass(tone?: 'positive' | 'negative', text?: string): string {
  const resolvedTone = tone ?? (text ? getInsightNumericTone(text) : undefined);
  return resolvedTone ? `chart-insight-emphasis ${resolvedTone}` : 'chart-insight-emphasis';
}

function renderInsightTextWithNumericTone(text: string, keyPrefix: string) {
  const segments = text.split(INSIGHT_NUMERIC_PATTERN);
  return segments.map((segment, index) => {
    if (!segment) return null;
    const tone = getInsightNumericTone(segment);
    if (tone) {
      return (
        <strong key={`${keyPrefix}-${index}`} className={`chart-insight-emphasis ${tone}`}>
          {segment}
        </strong>
      );
    }
    return segment;
  });
}

function renderInsight(parts: InsightPart[]) {
  return parts.map((part, index) =>
    typeof part === 'string' ? (
      <span key={index}>{renderInsightTextWithNumericTone(part, `insight-text-${index}`)}</span>
    ) : (
      <strong key={index} className={getInsightEmphasisClass(part.tone, part.bold)}>
        {part.bold}
      </strong>
    ),
  );
}

function ChartInsightChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function ChartInsightSparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

interface ChartInsightFooterProps {
  chartTitle: string;
  insight: InsightPart[];
  singleLine?: boolean;
}

export function ChartInsightFooter({
  chartTitle,
  insight,
  singleLine = false,
}: ChartInsightFooterProps) {
  const { askChartFollowUp } = useInsights();

  return (
    <div className="chart-insight-footer">
      <hr className="chart-insight-separator" />
      <div className="chart-insight-row">
        <p className={`chart-insight-text${singleLine ? ' chart-insight-text-single-line' : ''}`.trim()}>
          <span className="chart-insight-icon" aria-label="AI Insight">
            <span className="insights-ai-sparkle">
              <ChartInsightSparkleIcon />
            </span>
          </span>
          <span className="chart-insight-copy">{renderInsight(insight)}</span>
        </p>
        <button
          type="button"
          className="chart-insight-chat-btn"
          aria-label={`Ask for more details about ${chartTitle}`}
          title="Ask for more details"
          onClick={() => askChartFollowUp(chartTitle, insight)}
        >
          <ChartInsightChatIcon />
        </button>
      </div>
    </div>
  );
}
