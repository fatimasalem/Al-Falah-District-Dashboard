import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInsights } from '../context/InsightsContext';
import { generateInsights, generateOverviewInsightIntro } from '../utils';
import type { SurveyData } from '../types';

const INSIGHTS_WIDGET_POSITION_KEY = 'insights-widget-position';
const DRAG_THRESHOLD_PX = 4;
const VIEWPORT_PADDING_PX = 8;

interface WidgetPosition {
  x: number;
  y: number;
}

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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function InsightsPanel({ data, activeTab }: InsightsPanelProps) {
  const insights = generateInsights(activeTab, data);
  const { followUp, isPanelOpen, clearFollowUp, closePanel } = useInsights();
  const followUpRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [suppressHover, setSuppressHover] = useState(false);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const clampPosition = useCallback((x: number, y: number): WidgetPosition => {
    const widget = widgetRef.current;
    if (!widget) {
      return { x, y };
    }

    const { width, height } = widget.getBoundingClientRect();
    return {
      x: Math.max(VIEWPORT_PADDING_PX, Math.min(x, window.innerWidth - width - VIEWPORT_PADDING_PX)),
      y: Math.max(VIEWPORT_PADDING_PX, Math.min(y, window.innerHeight - height - VIEWPORT_PADDING_PX)),
    };
  }, []);

  useLayoutEffect(() => {
    const savedPosition = localStorage.getItem(INSIGHTS_WIDGET_POSITION_KEY);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as WidgetPosition;
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      } catch {
        localStorage.removeItem(INSIGHTS_WIDGET_POSITION_KEY);
      }
    }

    const widget = widgetRef.current;
    if (!widget) {
      return;
    }

    const rect = widget.getBoundingClientRect();
    setPosition(clampPosition(rect.left, rect.top));
  }, [clampPosition]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => (current ? clampPosition(current.x, current.y) : current));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  const handleTriggerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!position) {
      return;
    }

    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTriggerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || !position) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved && (Math.abs(deltaX) > DRAG_THRESHOLD_PX || Math.abs(deltaY) > DRAG_THRESHOLD_PX)) {
      dragState.moved = true;
    }

    setPosition(clampPosition(dragState.startPosX + deltaX, dragState.startPosY + deltaY));
  };

  const finishTriggerDrag = (target: HTMLDivElement, pointerId: number, clientX: number, clientY: number) => {
    const dragState = dragStateRef.current;
    if (!dragState.active) {
      return;
    }

    dragState.active = false;
    setIsDragging(false);

    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }

    if (dragState.moved) {
      const finalPosition = clampPosition(
        dragState.startPosX + (clientX - dragState.startX),
        dragState.startPosY + (clientY - dragState.startY),
      );
      setPosition(finalPosition);
      localStorage.setItem(INSIGHTS_WIDGET_POSITION_KEY, JSON.stringify(finalPosition));
      setSuppressHover(true);
      window.setTimeout(() => setSuppressHover(false), 250);
    }

    dragState.moved = false;
  };

  const handleTriggerPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    finishTriggerDrag(event.currentTarget, event.pointerId, event.clientX, event.clientY);
  };

  const handleTriggerPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    finishTriggerDrag(event.currentTarget, event.pointerId, event.clientX, event.clientY);
  };

  useEffect(() => {
    clearFollowUp();
  }, [activeTab, clearFollowUp]);

  useEffect(() => {
    if (followUp && followUpRef.current) {
      followUpRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [followUp]);

  const introText = activeTab === 'overview'
    ? generateOverviewInsightIntro(data)
    : `Al Falah district resident survey data for ${data.years.join(' and ')} shows overall satisfaction at ${data.overview.overallScore2025}%, with notable movement across key quality-of-life pillars.`;

  const widgetClassName = [
    'insights-floating-widget',
    isPanelOpen ? 'is-open' : '',
    position ? 'is-positioned' : '',
    isDragging ? 'is-dragging' : '',
    suppressHover ? 'suppress-hover' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={widgetRef}
      className={widgetClassName}
      style={position ? { left: position.x, top: position.y } : undefined}
      tabIndex={0}
    >
      <div
        className="insights-floating-trigger"
        aria-hidden="true"
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={handleTriggerPointerUp}
        onPointerCancel={handleTriggerPointerCancel}
      >
        <span className="insights-ai-sparkle" aria-hidden="true">
          <InsightsSparkleIcon />
        </span>
        <span className="insights-floating-trigger-label">AI Insights</span>
      </div>

      <aside className="insights-panel" aria-label="AI Insights">
        <div className="insights-header">
          <div className="insights-title-row">
            <h2 className="insights-title">AI Insights</h2>
          </div>
          <div className="insights-header-actions">
            <span className="insights-ai-sparkle" aria-label="Bayaan AI">
              <InsightsSparkleIcon />
            </span>
            {isPanelOpen && (
              <button
                type="button"
                className="insights-panel-close"
                aria-label="Close AI Insights"
                onClick={closePanel}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
        <div className="insights-panel-body">
          {followUp ? (
            <div className="insights-follow-up insights-follow-up-prominent" ref={followUpRef}>
              <p className="insights-follow-up-chart-title">{followUp.chartTitle}</p>
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
          ) : (
            <>
              <p className="insights-text">{introText}</p>
              <div className="insights-takeaways">
                <div className="insights-section-title">Key Takeaways</div>
                <ul className="insights-list">
                  {insights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
