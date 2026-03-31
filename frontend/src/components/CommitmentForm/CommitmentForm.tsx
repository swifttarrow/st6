import React, { useState, useMemo } from 'react';
import { Commitment, RcdoTreeRallyCry } from '../../api/types';
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
  onSubmit: (data: { title: string; outcomeId: string }) => void;
  onCancel: () => void;
}

export const CommitmentForm: React.FC<CommitmentFormProps> = ({
  mode,
  commitment,
  tree,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(commitment?.title ?? '');
  const [outcomeId, setOutcomeId] = useState(commitment?.outcomeId ?? '');
  const [outcomeSearch, setOutcomeSearch] = useState('');
  const [errors, setErrors] = useState<{ title?: string; outcome?: string }>({});

  const allOutcomes = useMemo<OutcomeOption[]>(() => {
    const results: OutcomeOption[] = [];
    tree.forEach(rc => {
      rc.definingObjectives.forEach(d => {
        d.outcomes.forEach(o => {
          results.push({
            id: o.id,
            title: o.title,
            path: `${rc.title} > ${d.title}`,
          });
        });
      });
    });
    return results;
  }, [tree]);

  const filteredOutcomes = useMemo(() => {
    if (!outcomeSearch.trim()) return allOutcomes;
    const query = outcomeSearch.toLowerCase();
    return allOutcomes.filter(
      o => o.title.toLowerCase().includes(query) || o.path.toLowerCase().includes(query),
    );
  }, [allOutcomes, outcomeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; outcome?: string } = {};
    if (!title.trim()) newErrors.title = 'Description is required';
    if (!outcomeId) newErrors.outcome = 'Linked outcome is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({ title: title.trim(), outcomeId });
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
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }}
              placeholder="What will you accomplish this week?"
            />
            {errors.title && <div className={styles.errorText}>{errors.title}</div>}
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
                onChange={e => setOutcomeSearch(e.target.value)}
              />
              {filteredOutcomes.length === 0 && (
                <div className={styles.noOutcomes}>No outcomes found</div>
              )}
              {filteredOutcomes.map(o => (
                <div
                  key={o.id}
                  className={`${styles.outcomeOption} ${outcomeId === o.id ? styles.outcomeOptionSelected : ''}`}
                  onClick={() => { setOutcomeId(o.id); setErrors(prev => ({ ...prev, outcome: undefined })); }}
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
