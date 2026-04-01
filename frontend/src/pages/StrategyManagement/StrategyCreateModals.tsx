import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Shield } from 'lucide-react';
import { RcdoTreeRallyCry } from '../../api/types';
import styles from './StrategyCreateModals.module.css';

export type StrategyModalState =
  | null
  | { type: 'rally-cry' }
  | { type: 'defining-objective'; rallyCryId: string }
  | { type: 'outcome'; definingObjectiveId: string };

interface StrategyCreateModalsProps {
  modal: StrategyModalState;
  tree: RcdoTreeRallyCry[];
  createName: string;
  createDescription: string;
  modalDoRallyCryId: string;
  modalOutcomeDoId: string;
  creating: boolean;
  onClose: () => void;
  onCreateNameChange: (v: string) => void;
  onCreateDescriptionChange: (v: string) => void;
  onModalDoRallyCryIdChange: (v: string) => void;
  onModalOutcomeDoIdChange: (v: string) => void;
  onSubmitRallyCry: () => void;
  onSubmitDo: () => void;
  onSubmitOutcome: () => void;
}

function findRallyCry(tree: RcdoTreeRallyCry[], id: string): RcdoTreeRallyCry | undefined {
  return tree.find(rc => rc.id === id);
}

function findDoContext(tree: RcdoTreeRallyCry[], doId: string) {
  for (const rc of tree) {
    const d = rc.definingObjectives.find(x => x.id === doId);
    if (d) return { rc, d };
  }
  return null;
}

const RoleNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={styles.roleNote}>
    <Shield size={14} aria-hidden />
    <span>{children}</span>
  </div>
);

export const StrategyCreateModals: React.FC<StrategyCreateModalsProps> = ({
  modal,
  tree,
  createName,
  createDescription,
  modalDoRallyCryId,
  modalOutcomeDoId,
  creating,
  onClose,
  onCreateNameChange,
  onCreateDescriptionChange,
  onModalDoRallyCryIdChange,
  onModalOutcomeDoIdChange,
  onSubmitRallyCry,
  onSubmitDo,
  onSubmitOutcome,
}) => {
  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!modal) return null;

  const content = (() => {
    if (modal.type === 'rally-cry') {
      return (
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-rc-title"
          data-testid="create-rally-cry-modal"
        >
          <div className={styles.header}>
            <h2 id="modal-rc-title" className={styles.title}>
              Create Rally Cry
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className={styles.body}>
            <p className={styles.intro}>
              Add a new Rally Cry to the strategic hierarchy. Rally Cries are the top-level strategic priorities for
              the organization.
            </p>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="modal-rc-name">
                Name
              </label>
              <input
                id="modal-rc-name"
                className={styles.input}
                value={createName}
                onChange={e => onCreateNameChange(e.target.value)}
                placeholder="e.g. Revenue Growth"
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="modal-rc-desc">
                Description
              </label>
              <textarea
                id="modal-rc-desc"
                className={styles.textarea}
                value={createDescription}
                onChange={e => onCreateDescriptionChange(e.target.value)}
                placeholder="Describe the strategic intent behind this Rally Cry..."
              />
            </div>
            <RoleNote>Only Managers and Leadership can create Rally Cries</RoleNote>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSubmitRallyCry}
              disabled={!createName.trim() || creating}
              data-testid="create-rally-cry-submit"
            >
              <Plus size={14} />
              {creating ? 'Creating...' : 'Create Rally Cry'}
            </button>
          </div>
        </div>
      );
    }

    if (modal.type === 'defining-objective') {
      const effectiveRcId = modalDoRallyCryId || modal.rallyCryId;
      const rc = findRallyCry(tree, effectiveRcId);
      const pathTail = createName.trim() || '…';
      return (
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-do-title"
          data-testid="create-do-modal"
        >
          <div className={styles.header}>
            <h2 id="modal-do-title" className={styles.title}>
              Create Defining Objective
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className={styles.body}>
            <p className={styles.intro}>
              Add a Defining Objective under a Rally Cry. DOs break down a Rally Cry into actionable focus areas.
            </p>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="modal-do-parent-rc">
                Parent Rally Cry
              </label>
              <select
                id="modal-do-parent-rc"
                className={styles.select}
                value={effectiveRcId}
                onChange={e => onModalDoRallyCryIdChange(e.target.value)}
              >
                {tree.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="modal-do-name">
                Name
              </label>
              <input
                id="modal-do-name"
                className={styles.input}
                value={createName}
                onChange={e => onCreateNameChange(e.target.value)}
                placeholder="e.g. Increase enterprise pipeline"
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="modal-do-desc">
                Description
              </label>
              <textarea
                id="modal-do-desc"
                className={styles.textarea}
                value={createDescription}
                onChange={e => onCreateDescriptionChange(e.target.value)}
                placeholder="Optional details for this objective..."
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Hierarchy Path</span>
              <div className={styles.pathRow}>
                <span className={styles.pathRc}>{rc?.name ?? '—'}</span>
                <span className={styles.pathSep} aria-hidden>
                  ›
                </span>
                <span className={styles.pathRest}>{pathTail}</span>
              </div>
            </div>
            <RoleNote>Only Managers and Leadership can create Defining Objectives</RoleNote>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSubmitDo}
              disabled={!createName.trim() || !effectiveRcId || creating}
              data-testid="create-do-submit"
            >
              <Plus size={14} />
              {creating ? 'Creating...' : 'Create Objective'}
            </button>
          </div>
        </div>
      );
    }

    const effectiveDoId = modalOutcomeDoId || modal.definingObjectiveId;
    const ctx = findDoContext(tree, effectiveDoId);
    const outcomeRc = ctx?.rc;
    const outcomeDo = ctx?.d;
    const rcForOutcome = outcomeRc;
    const dosInRc = rcForOutcome?.definingObjectives ?? [];
    const pathOc = createName.trim() || '…';

    return (
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-oc-title"
        data-testid="create-outcome-modal"
      >
        <div className={styles.header}>
          <h2 id="modal-oc-title" className={styles.title}>
            Create Outcome
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.intro}>
            Add an Outcome under a Defining Objective. Outcomes are the specific results that ICs link their weekly
            commitments to.
          </p>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rally Cry</span>
            <div className={styles.readOnlyBox}>{rcForOutcome?.name ?? '—'}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="modal-oc-do">
              Defining Objective
            </label>
            <select
              id="modal-oc-do"
              className={styles.select}
              value={effectiveDoId}
              onChange={e => onModalOutcomeDoIdChange(e.target.value)}
              disabled={!rcForOutcome}
            >
              {dosInRc.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="modal-oc-name">
              Outcome Name
            </label>
            <input
              id="modal-oc-name"
              className={styles.input}
              value={createName}
              onChange={e => onCreateNameChange(e.target.value)}
              placeholder="e.g. Close 5 enterprise deals by Q2"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="modal-oc-desc">
              Description
            </label>
            <textarea
              id="modal-oc-desc"
              className={styles.textarea}
              value={createDescription}
              onChange={e => onCreateDescriptionChange(e.target.value)}
              placeholder="Optional details..."
              style={{ minHeight: 80 }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Hierarchy Path</span>
            <div className={styles.pathRow}>
              <span className={styles.pathRc}>{rcForOutcome?.name ?? '—'}</span>
              <span className={styles.pathSep} aria-hidden>
                ›
              </span>
              <span className={styles.pathRest}>{outcomeDo?.name ?? '—'}</span>
              <span className={styles.pathSep} aria-hidden>
                ›
              </span>
              <span className={styles.pathRest}>{pathOc}</span>
            </div>
          </div>
          <RoleNote>Only Managers and Leadership can create Outcomes</RoleNote>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onSubmitOutcome}
            disabled={!createName.trim() || !effectiveDoId || creating}
            data-testid="create-outcome-submit"
          >
            <Plus size={14} />
            {creating ? 'Creating...' : 'Create Outcome'}
          </button>
        </div>
      </div>
    );
  })();

  return createPortal(
    <div className={styles.backdrop} onClick={onBackdropClick} data-testid="strategy-modal-backdrop">
      {content}
    </div>,
    document.body,
  );
};
