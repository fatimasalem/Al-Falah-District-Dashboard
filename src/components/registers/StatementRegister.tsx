import { useMemo, useState, type ReactNode } from 'react';
import type { IndicatorPolarity } from '../../types';
import type { StatementRegisterRow } from '../../utils';
import { formatDelta, generateStatementRegisterInsight } from '../../utils';
import { ChartInsightFooter } from '../charts/ChartInsightFooter';
import { ChartSectionHeader } from '../charts/ChartSectionHeader';

type PolarityFilter = 'all' | IndicatorPolarity;
type SortKey = 'questionGroup' | 'agreement2025' | 'movement';

export interface StatementRegisterTab {
  id: string;
  label: string;
  rows: StatementRegisterRow[];
  subtitle?: string;
}

interface StatementRegisterProps {
  rows?: StatementRegisterRow[];
  tabs?: StatementRegisterTab[];
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
}

const FILTER_OPTIONS: { id: PolarityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'positive', label: 'Positive' },
  { id: 'negative', label: 'Risk' },
];

export function StatementRegister({
  rows: rowsProp,
  tabs,
  title = 'Statement register',
  subtitle = 'Trace pillar evidence to underlying statements with polarity, agreement, and movement.',
  headerAction,
}: StatementRegisterProps) {
  const [activeTabId, setActiveTabId] = useState(tabs?.[0]?.id ?? 'all');
  const [filter, setFilter] = useState<PolarityFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('agreement2025');
  const [sortAsc, setSortAsc] = useState(false);

  const activeTab = tabs?.find((tab) => tab.id === activeTabId) ?? tabs?.[0];
  const rows = tabs ? (activeTab?.rows ?? []) : (rowsProp ?? []);
  const activeSubtitle = tabs ? (activeTab?.subtitle ?? subtitle) : subtitle;
  const showPolarityFilter = !tabs;

  const insight = useMemo(
    () => generateStatementRegisterInsight(rows, title),
    [rows, title],
  );

  const filteredRows = useMemo(() => {
    const nextRows = !showPolarityFilter || filter === 'all'
      ? rows
      : rows.filter((row) => row.polarity === filter);

    return [...nextRows].sort((left, right) => {
      const direction = sortAsc ? 1 : -1;
      if (sortKey === 'questionGroup') {
        return direction * left.questionGroup.localeCompare(right.questionGroup);
      }
      if (sortKey === 'movement') {
        return direction * (left.movement - right.movement);
      }
      return direction * (left.agreement2025 - right.agreement2025);
    });
  }, [filter, rows, showPolarityFilter, sortAsc, sortKey]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((value) => !value);
      return;
    }
    setSortKey(key);
    setSortAsc(false);
  };

  return (
    <section className="statement-register" aria-label={title}>
      <div className="statement-register-header">
        <ChartSectionHeader
          icon="statement-register"
          title={title}
          subtitle={activeSubtitle}
          titleClassName="statement-register-title"
          subtitleClassName="statement-register-subtitle"
        />
        {(headerAction || showPolarityFilter) && (
          <div className="statement-register-header-actions">
            {headerAction}
            {showPolarityFilter && (
              <div className="statement-register-filters" role="group" aria-label="Polarity filter">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`statement-register-filter${filter === option.id ? ' is-active' : ''}`}
                    onClick={() => setFilter(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {tabs ? (
        <div className="statement-register-tabs" role="tablist" aria-label="Register views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`statement-register-tab${activeTabId === tab.id ? ' is-active' : ''}${
                tab.id === 'risk' || tab.id === 'negative' || tab.id === 'concern' ? ' is-risk' : ''
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
              <span className="statement-register-tab-count">{tab.rows.length}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="statement-register-table-wrap"
        role={tabs ? 'tabpanel' : undefined}
        aria-label={tabs ? activeTab?.label : undefined}
      >
        <table className="statement-register-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="statement-register-sort" onClick={() => handleSort('questionGroup')}>
                  Question Group
                </button>
              </th>
              <th>Statement</th>
              <th>Polarity</th>
              <th>Agreement 2024</th>
              <th>
                <button type="button" className="statement-register-sort" onClick={() => handleSort('agreement2025')}>
                  Agreement 2025
                </button>
              </th>
              <th>Disagreement 2025</th>
              <th>
                <button type="button" className="statement-register-sort" onClick={() => handleSort('movement')}>
                  Movement
                </button>
              </th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.questionGroup}</td>
                <td className="statement-register-statement" title={row.statementEn ?? row.statementAr}>
                  {row.statementEn ?? row.statementAr}
                </td>
                <td>
                  <span className={`statement-register-polarity statement-register-polarity--${row.polarity}`}>
                    {row.polarity === 'negative' ? 'Risk' : 'Positive'}
                  </span>
                </td>
                <td>{row.agreement2024.toFixed(1)}%</td>
                <td>{row.agreement2025.toFixed(1)}%</td>
                <td>{row.disagreement2025.toFixed(1)}%</td>
                <td>{formatDelta(row.movement)}</td>
                <td className="statement-register-interpretation">{row.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ChartInsightFooter chartTitle={title} insight={insight} />
    </section>
  );
}
