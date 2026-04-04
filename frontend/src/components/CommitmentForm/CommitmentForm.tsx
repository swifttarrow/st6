import React, { useState, useMemo, useEffect } from 'react';
import { Commitment, RcdoTreeRallyCry, OutcomeSearchResult } from '../../api/types';
import styles from './CommitmentForm.module.css';

interface OutcomeOption {
  id: string;
  title: string;
  path: string;
}

interface CommitmentFormProps {
  mode: 'create' | 'edit';
  commitment?: Commitment;
  tree: RcdoTreeRallyCry[];
  onSubmit: (data: { description: string; outcomeId: string }) => void;
  onCancel: () => void;
  /** When set, non-empty search text uses the API (debounced) in addition to the local tree filter. */
  searchOutcomes?: (query: string) => Promise<OutcomeSearchResult[]>;
}

function outcomeResultsToOptions(results: OutcomeSearchResult[]): OutcomeOption[] {
  return results.map((r) => ({
    id: r.outcomeId,
    title: r.outcomeName,
    path: `${r.rallyCryName} > ${r.definingObjectiveName}`,
  }));
}

function mergeSelectedOption(
  options: OutcomeOption[],
  selectedId: string,
  fallback: OutcomeOption[],
): OutcomeOption[] {
  if (!selectedId || options.some((o) => o.id === selectedId)) {
    return options;
  }
  const sel = fallback.find((o) => o.id === selectedId);
  return sel ? [sel, ...options] : options;
}

export const CommitmentForm: React.FC<CommitmentFormProps> = ({
  mode,
  commitment,
  tree,
  onSubmit,
  onCancel,
  searchOutcomes,
}) => {
  const [description, setDescription] = useState(commitment?.description ?? '');
  const [outcomeId, setOutcomeId] = useState(commitment?.outcomeId ?? '');
  const [outcomeSearch, setOutcomeSearch] = useState('');
  const [errors, setErrors] = useState<{ description?: string; outcome?: string }>({});
  const [remoteOptions, setRemoteOptions] = useState<OutcomeOption[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const allOutcomes = useMemo<OutcomeOption[]>(() => {
    const results: OutcomeOption[] = [];
    tree.forEach((rc) => {
      rc.definingObjectives.forEach((d) => {
        d.outcomes.forEach((o) => {
          results.push({
            id: o.id,
            title: o.name,
            path: `${rc.name} > ${d.name}`,
          });
        });
      });
    });
    return results;
  }, [tree]);

  const filteredLocal = useMemo(() => {
    if (!outcomeSearch.trim()) return allOutcomes;
    const query = outcomeSearch.toLowerCase();
    return allOutcomes.filter(
      (o) => o.title.toLowerCase().includes(query) || o.path.toLowerCase().includes(query),
    );
  }, [allOutcomes, outcomeSearch]);

  useEffect(() => {
    if (!searchOutcomes) {
      setRemoteOptions(null);
      setRemoteLoading(false);
      return;
    }

    const q = outcomeSearch.trim();
    if (q.length === 0) {
      setRemoteOptions(null);
      setRemoteLoading(false);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      setRemoteLoading(true);
      searchOutcomes(q)
        .then((results) => {
          if (!cancelled) {
            setRemoteOptions(outcomeResultsToOptions(results));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRemoteOptions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setRemoteLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [outcomeSearch, searchOutcomes]);

  const useRemoteList = Boolean(searchOutcomes) && outcomeSearch.trim().length > 0;

  const displayOutcomes = useMemo(() => {
    if (!useRemoteList) {
      return filteredLocal;
    }
    const base = remoteOptions ?? [];
    return mergeSelectedOption(base, outcomeId, allOutcomes);
  }, [useRemoteList, filteredLocal, remoteOptions, outcomeId, allOutcomes]);

  const showRemoteLoading = useRemoteList && remoteLoading && remoteOptions === null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { description?: string; outcome?: string } = {};
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!outcomeId) newErrors.outcome = 'Linked outcome is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({ description: description.trim(), outcomeId });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <h2 className={styles.title}>
          {mode === 'create' ? 'Add Commitment' : 'Edit Commitment'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.textInput}
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="What will you accomplish this week?"
            />
            {errors.description && <div className={styles.errorText}>{errors.description}</div>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Linked Outcome <span className={styles.required}>*</span>
            </label>
            <div className={styles.outcomeSelector}>
              <input
                className={styles.outcomeSearch}
                type="text"
                placeholder="Search outcomes..."
                value={outcomeSearch}
                onChange={(e) => setOutcomeSearch(e.target.value)}
              />
              {showRemoteLoading && (
                <div className={styles.noOutcomes} data-testid="outcome-search-loading">
                  Searching…
                </div>
              )}
              {!showRemoteLoading && displayOutcomes.length === 0 && (
                <div className={styles.noOutcomes}>No outcomes found</div>
              )}
              {!showRemoteLoading
                && displayOutcomes.map((o) => (
                  <div
                    key={o.id}
                    className={`${styles.outcomeOption} ${outcomeId === o.id ? styles.outcomeOptionSelected : ''}`}
                    onClick={() => {
                      setOutcomeId(o.id);
                      setErrors((prev) => ({ ...prev, outcome: undefined }));
                    }}
                  >
                    <div>{o.title}</div>
                    <div className={styles.outcomePath}>{o.path}</div>
                  </div>
                ))}
            </div>
            {errors.outcome && <div className={styles.errorText}>{errors.outcome}</div>}
          </div>

          <div className={styles.buttonRow}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {mode === 'create' ? 'Add Commitment' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
