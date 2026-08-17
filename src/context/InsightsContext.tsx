import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { generateChartFollowUpDetails, type InsightPart } from '../utils';

export interface ChartFollowUp {
  chartTitle: string;
  question: string;
  answer: string;
}

interface InsightsContextValue {
  followUp: ChartFollowUp | null;
  askChartFollowUp: (chartTitle: string, insight: InsightPart[]) => void;
  clearFollowUp: () => void;
}

const InsightsContext = createContext<InsightsContextValue | null>(null);

export function InsightsProvider({ children }: { children: ReactNode }) {
  const [followUp, setFollowUp] = useState<ChartFollowUp | null>(null);

  const askChartFollowUp = useCallback((chartTitle: string, insight: InsightPart[]) => {
    setFollowUp(generateChartFollowUpDetails(chartTitle, insight));
  }, []);

  const clearFollowUp = useCallback(() => {
    setFollowUp(null);
  }, []);

  const value = useMemo(
    () => ({ followUp, askChartFollowUp, clearFollowUp }),
    [followUp, askChartFollowUp, clearFollowUp],
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
