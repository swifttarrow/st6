import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { RcdoTreeRallyCry } from '../../api/types';
import styles from './StrategyBrowser.module.css';

interface StrategyBrowserProps {
  tree: RcdoTreeRallyCry[];
  onSelectOutcome?: (outcomeId: string) => void;
  selectedOutcomeId?: string;
  interactive?: boolean;
}

export const StrategyBrowser: React.FC<StrategyBrowserProps> = ({
  tree,
  onSelectOutcome,
  selectedOutcomeId,
  interactive = false,
}) => {
  const [expandedRCs, setExpandedRCs] = useState<Set<string>>(() => new Set(tree.map(rc => rc.id)));
  const [expandedDOs, setExpandedDOs] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    tree.forEach(rc => rc.definingObjectives.forEach(d => ids.add(d.id)));
    return ids;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchTerm]);

  const toggleRC = useCallback((id: string) => {
    setExpandedRCs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDO = useCallback((id: string) => {
    setExpandedDOs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredTree = useMemo(() => {
    if (!debouncedSearch.trim()) return tree;
    const query = debouncedSearch.toLowerCase();
    return tree
      .map(rc => ({
        ...rc,
        definingObjectives: rc.definingObjectives
          .map(d => ({
            ...d,
            outcomes: d.outcomes.filter(o => o.title.toLowerCase().includes(query)),
          }))
          .filter(d => d.outcomes.length > 0),
      }))
      .filter(rc => rc.definingObjectives.length > 0);
  }, [tree, debouncedSearch]);

  const hasResults = filteredTree.length > 0;

  return (
    <div className={styles.browser}>
      <h2 className={styles.heading}>Strategy Hierarchy</h2>
      <p className={styles.subtext}>Link commitments to outcomes</p>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search outcomes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {!hasResults && <div className={styles.noResults}>No outcomes found</div>}
      <ul className={styles.tree}>
        {filteredTree.map(rc => (
          <li key={rc.id} className={styles.rcNode}>
            <div className={styles.rcHeader} onClick={() => toggleRC(rc.id)}>
              <ChevronIcon expanded={expandedRCs.has(rc.id)} />
              <span className={styles.rcTitle}>{rc.title}</span>
            </div>
            {expandedRCs.has(rc.id) && (
              <ul className={styles.doList}>
                {rc.definingObjectives.map(d => (
                  <li key={d.id} className={styles.doNode}>
                    <div className={styles.doHeader} onClick={() => toggleDO(d.id)}>
                      <ChevronIcon expanded={expandedDOs.has(d.id)} />
                      <span className={styles.doTitle}>{d.title}</span>
                    </div>
                    {expandedDOs.has(d.id) && (
                      <ul className={styles.outcomeList}>
                        {d.outcomes.map(o => {
                          const isSelected = selectedOutcomeId === o.id;
                          const className = [
                            styles.outcomeItem,
                            interactive ? styles.outcomeItemInteractive : '',
                            isSelected ? styles.outcomeItemSelected : '',
                          ].filter(Boolean).join(' ');
                          return (
                            <li
                              key={o.id}
                              className={className}
                              onClick={interactive && onSelectOutcome ? () => onSelectOutcome(o.id) : undefined}
                            >
                              {o.title}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
