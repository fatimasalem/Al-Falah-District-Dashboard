import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { generateChartFollowUpDetails, type InsightPart } from '../utils';

export interface ChartFollowUp {
  chartTitle: string;
  question: string;
  answer: string;
}

interface InsightsContextValue {
  followUp: ChartFollowUp | null;
  isPanelOpen: boolean;
  askChartFollowUp: (chartTitle: string, insight: InsightPart[]) => void;
  clearFollowUp: () => void;
  closePanel: () => void;
}

const InsightsContext = createContext<InsightsContextValue | null>(null);

export function InsightsProvider({ children }: { children: ReactNode }) {
  const [followUp, setFollowUp] = useState<ChartFollowUp | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const askChartFollowUp = useCallback((chartTitle: string, insight: InsightPart[]) => {
    setFollowUp(generateChartFollowUpDetails(chartTitle, insight));
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setFollowUp(null);
  }, []);

  const clearFollowUp = useCallback(() => {
    setFollowUp(null);
    setIsPanelOpen(false);
  }, []);

  const value = useMemo(
    () => ({ followUp, isPanelOpen, askChartFollowUp, clearFollowUp, closePanel }),
    [followUp, isPanelOpen, askChartFollowUp, clearFollowUp, closePanel],
  );

  return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
}

export function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error('useInsights must be used within an InsightsProvider');
  }
  return context;
}
