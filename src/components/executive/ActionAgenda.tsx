import type { ReactNode } from 'react';
import type { ActionAgendaItem, ActionPrompt } from '../../utils';
import { generateActionAgendaInsight } from '../../utils';
import type { ChartSectionIconName } from '../charts/ChartSectionHeader';
import { ChartSectionHeader, ChartSectionIcon } from '../charts/ChartSectionHeader';

interface ActionAgendaProps {
  agenda: Record<ActionPrompt, ActionAgendaItem[]>;
}

const PROMPT_META: Record<ActionPrompt, { title: string; description: string; icon: ChartSectionIconName }> = {
  scale: {
    title: 'Scale',
    description: 'High-performing pillars with positive momentum.',
    icon: 'scale',
  },
  protect: {
    title: 'Protect',
    description: 'Strong scores that need attention to momentum.',
    icon: 'protect',
  },
  target: {
    title: 'Target',
    description: 'Highest residual negative-indicator concerns.',
    icon: 'target',
  },
  close: {
    title: 'Close',
    description: 'Investigate weaker pillars and outstanding data gaps.',
    icon: 'close',
  },
};

const ACTION_AGENDA_COLUMNS: ActionPrompt[][] = [
  ['target', 'close'],
  ['protect', 'scale'],
];

function InsightLightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 014 12.74V17a1 1 0 01-1 1h-6a1 1 0 01-1-1v-2.26A7 7 0 0112 2z" />
    </svg>
  );
}

function stripPillarPrefix(summary: string, pillar: string): string {
  const prefix = `${pillar}: `;
  return summary.startsWith(prefix) ? summary.slice(prefix.length) : summary;
}

const AGENDA_SUMMARY_TOKEN_PATTERN =
  /\b(negative indicator|approved overall score|reporting cycle|executive averages|momentum|movement|score)\b|([+-]?\d+(?:\.\d+)?%)|\b(20\d{2})\b/gi;

function getAgendaValueTone(value: string): 'positive' | 'negative' | 'neutral' {
  if (value.startsWith('+')) return 'positive';
  if (value.startsWith('-')) return 'negative';
  if (value.endsWith('%')) {
    const numeric = Number.parseFloat(value);
    if (!Number.isNaN(numeric) && numeric >= 70) return 'positive';
    if (!Number.isNaN(numeric) && numeric <= 40) return 'negative';
    return 'neutral';
  }
  return 'neutral';
}

function renderAgendaSummary(text: string): ReactNode[] {
  const parts = text.split(AGENDA_SUMMARY_TOKEN_PATTERN);

  return parts.map((part, index) => {
    if (!part) return null;

    if (/^[+-]?\d+(?:\.\d+)?%$/.test(part)) {
      const tone = getAgendaValueTone(part);
      return (
        <strong key={`value-${index}`} className={`action-agenda-emphasis ${tone}`}>
          {part}
        </strong>
      );
    }

    if (/^20\d{2}$/.test(part)) {
      return (
        <strong key={`year-${index}`} className="action-agenda-emphasis year">
          {part}
        </strong>
      );
    }

    if (/^(negative indicator|approved overall score|reporting cycle|executive averages|momentum|movement|score)$/i.test(part)) {
      return (
        <strong key={`keyword-${index}`} className="action-agenda-emphasis keyword">
          {part}
        </strong>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

function ActionAgendaGroup({
  prompt,
  items,
}: {
  prompt: ActionPrompt;
  items: ActionAgendaItem[];
}) {
  const meta = PROMPT_META[prompt];

  return (
    <section className={`action-agenda-group action-agenda-group-${prompt}`}>
      <header className="action-agenda-group-header">
        <span className="action-agenda-group-icon">
          <ChartSectionIcon name={meta.icon} />
        </span>
        <div className="action-agenda-group-heading">
          <h3 className="action-agenda-group-title">
            {meta.title} ({items.length})
          </h3>
          <p className="action-agenda-group-description">{meta.description}</p>
        </div>
      </header>
      {items.length > 0 ? (
        <div className="action-agenda-group-cards">
          {items.map((item) => (
            <article key={`${prompt}-${item.pillar}`} className="action-agenda-pill-card">
              <div className="action-agenda-pill-card-top">
                <span className="action-agenda-pill-card-icon" aria-hidden="true">
                  <ChartSectionIcon name={meta.icon} />
                </span>
                <h4 className="action-agenda-pill-card-title">{item.pillar}</h4>
              </div>
              <p className="action-agenda-pill-card-summary">
                {renderAgendaSummary(stripPillarPrefix(item.summary, item.pillar))}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="action-agenda-empty">No items in this lane for the current demo data.</p>
      )}
    </section>
  );
}

export function ActionAgenda({ agenda }: ActionAgendaProps) {
  const insight = generateActionAgendaInsight(agenda);

  return (
    <section className="action-agenda" aria-label="Evidence-led action agenda">
      <div className="action-agenda-header">
        <ChartSectionHeader
          icon="action-agenda"
          title="Action agenda"
          titleClassName="action-agenda-title"
          subtitleClassName="action-agenda-subtitle"
          subtitle="Evidence-led discussion prompts citing pillar, score, movement, and data limitations."
        />
      </div>

      <div className="action-agenda-ai-insight">
        <div className="action-agenda-ai-insight-label">
          <InsightLightbulbIcon />
          <span>AI Insight</span>
        </div>
        <p className="action-agenda-ai-insight-text">{insight}</p>
      </div>

      <div className="action-agenda-groups">
        {ACTION_AGENDA_COLUMNS.map((column, columnIndex) => (
          <div key={columnIndex} className="action-agenda-column">
            {column.map((prompt) => (
              <ActionAgendaGroup key={prompt} prompt={prompt} items={agenda[prompt]} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
