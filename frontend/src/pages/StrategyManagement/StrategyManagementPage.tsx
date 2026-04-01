import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useApi } from '../../context/ApiContext';
import { useUserContext } from '../../context/UserContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import { RcdoTreeRallyCry } from '../../api/types';
import { StrategyNodeRow } from './StrategyNodeRow';
import { RallyCryDetailPanel } from './RallyCryDetailPanel';
import { StrategyCreateModals, type StrategyModalState } from './StrategyCreateModals';
import styles from './StrategyManagementPage.module.css';

type EditingNode = {
  id: string;
  type: 'rally-cry' | 'defining-objective' | 'outcome';
  name: string;
  description: string;
} | null;

export const StrategyManagementPage: React.FC = () => {
  const api = useApi();
  const userContext = useUserContext();

  const [tree, setTree] = useState<RcdoTreeRallyCry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const [expandedRCs, setExpandedRCs] = useState<Set<string>>(new Set());
  const [expandedDOs, setExpandedDOs] = useState<Set<string>>(new Set());

  const [selectedRallyCryId, setSelectedRallyCryId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<StrategyModalState>(null);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [modalDoRallyCryId, setModalDoRallyCryId] = useState('');
  const [modalOutcomeDoId, setModalOutcomeDoId] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingNode, setEditingNode] = useState<EditingNode>(null);
  const [saving, setSaving] = useState(false);
  const [panelArchiving, setPanelArchiving] = useState(false);

  const [showArchived, setShowArchived] = useState(false);

  const resetModalForm = useCallback(() => {
    setActiveModal(null);
    setCreateName('');
    setCreateDescription('');
    setModalDoRallyCryId('');
    setModalOutcomeDoId('');
  }, []);

  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.rcdo.getTree(showArchived);
      setTree(result);
      setExpandedRCs(new Set(result.map(rc => rc.id)));
      const doIds = new Set<string>();
      result.forEach(rc => rc.definingObjectives.forEach(d => doIds.add(d.id)));
      setExpandedDOs(doIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  }, [api, showArchived]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (!activeModal) return;
    if (activeModal.type === 'defining-objective') {
      setModalDoRallyCryId(activeModal.rallyCryId);
    } else if (activeModal.type === 'outcome') {
      setModalOutcomeDoId(activeModal.definingObjectiveId);
    }
  }, [activeModal]);

  useEffect(() => {
    if (tree.length === 0) {
      setSelectedRallyCryId(null);
      return;
    }
    setSelectedRallyCryId(prev => {
      if (prev && tree.some(rc => rc.id === prev)) return prev;
      return tree[0].id;
    });
  }, [tree]);

  const selectedRallyCry = selectedRallyCryId
    ? tree.find(rc => rc.id === selectedRallyCryId) ?? null
    : null;

  const toggleRC = useCallback((id: string) => {
    setExpandedRCs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleDO = useCallback((id: string) => {
    setExpandedDOs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleCreateRallyCry = useCallback(async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      await api.rcdo.createRallyCry({ name: createName.trim(), description: createDescription });
      await loadTree();
      resetModalForm();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to create Rally Cry');
    } finally {
      setCreating(false);
    }
  }, [api, createName, createDescription, loadTree, resetModalForm]);

  const handleCreateDefiningObjective = useCallback(async () => {
    const rallyCryId =
      modalDoRallyCryId ||
      (activeModal?.type === 'defining-objective' ? activeModal.rallyCryId : '');
    if (!createName.trim() || !rallyCryId) return;
    try {
      setCreating(true);
      await api.rcdo.createDefiningObjective({
        rallyCryId,
        name: createName.trim(),
        description: createDescription,
      });
      await loadTree();
      resetModalForm();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to create Defining Objective');
    } finally {
      setCreating(false);
    }
  }, [api, createName, createDescription, modalDoRallyCryId, activeModal, loadTree, resetModalForm]);

  const handleCreateOutcome = useCallback(async () => {
    const definingObjectiveId =
      modalOutcomeDoId ||
      (activeModal?.type === 'outcome' ? activeModal.definingObjectiveId : '');
    if (!createName.trim() || !definingObjectiveId) return;
    try {
      setCreating(true);
      await api.rcdo.createOutcome({
        definingObjectiveId,
        name: createName.trim(),
        description: createDescription,
      });
      await loadTree();
      resetModalForm();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to create Outcome');
    } finally {
      setCreating(false);
    }
  }, [api, createName, createDescription, modalOutcomeDoId, activeModal, loadTree, resetModalForm]);

  const handleStartEdit = useCallback((id: string, type: 'rally-cry' | 'defining-objective' | 'outcome', currentName: string, currentDescription: string) => {
    resetModalForm();
    setEditingNode({ id, type, name: currentName, description: currentDescription });
  }, [resetModalForm]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNode || !editingNode.name.trim()) return;
    try {
      setSaving(true);
      const payload = { name: editingNode.name.trim(), description: editingNode.description };
      if (editingNode.type === 'rally-cry') {
        await api.rcdo.updateRallyCry(editingNode.id, payload);
      } else if (editingNode.type === 'defining-objective') {
        await api.rcdo.updateDefiningObjective(editingNode.id, payload);
      } else {
        await api.rcdo.updateOutcome(editingNode.id, payload);
      }
      await loadTree();
      setEditingNode(null);
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [api, editingNode, loadTree]);

  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
  }, []);

  const handleArchive = useCallback(async (id: string, type: 'rally-cry' | 'defining-objective' | 'outcome', name: string) => {
    if (!window.confirm(`Archive "${name}"? This will hide it from IC views.`)) return;
    try {
      if (type === 'rally-cry') await api.rcdo.archiveRallyCry(id);
      else if (type === 'defining-objective') await api.rcdo.archiveDefiningObjective(id);
      else await api.rcdo.archiveOutcome(id);
      await loadTree();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }, [api, loadTree]);

  const handleUnarchive = useCallback(async (id: string, type: 'rally-cry' | 'defining-objective' | 'outcome') => {
    try {
      if (type === 'rally-cry') await api.rcdo.unarchiveRallyCry(id);
      else if (type === 'defining-objective') await api.rcdo.unarchiveDefiningObjective(id);
      else await api.rcdo.unarchiveOutcome(id);
      await loadTree();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to unarchive');
    }
  }, [api, loadTree]);

  const handleDetailSave = useCallback(async (name: string, description: string) => {
    if (!selectedRallyCryId) return;
    try {
      setSaving(true);
      await api.rcdo.updateRallyCry(selectedRallyCryId, { name, description });
      await loadTree();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [api, selectedRallyCryId, loadTree]);

  const handleDetailArchive = useCallback(async () => {
    if (!selectedRallyCry) return;
    if (!window.confirm(`Archive "${selectedRallyCry.name}"? This will hide it from IC views.`)) return;
    try {
      setPanelArchiving(true);
      await api.rcdo.archiveRallyCry(selectedRallyCry.id);
      await loadTree();
    } catch (err) {
      setToastError(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setPanelArchiving(false);
    }
  }, [api, selectedRallyCry, loadTree]);

  if (userContext.role === 'IC') {
    return <Navigate to="/my-week" replace />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error && tree.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page} data-testid="strategy-management">
      <PageHeader
        title="RCDO Management"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label className={styles.toggleLabel} data-testid="show-archived-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
            <button
              className={styles.newRcBtn}
              onClick={() => {
                resetModalForm();
                setEditingNode(null);
                setActiveModal({ type: 'rally-cry' });
              }}
              data-testid="create-rally-cry-btn"
              type="button"
            >
              <Plus size={14} />
              New Rally Cry
            </button>
          </div>
        }
      />

      <div className={styles.mainRow}>
        <div className={styles.treeColumn}>
          <div className={styles.treeColumnHeader}>
            <h2 className={styles.treeColumnTitle}>Strategic Hierarchy</h2>
            <p className={styles.treeColumnSubtitle}>
              Manage Rally Cries, Defining Objectives &amp; Outcomes
            </p>
          </div>
          <div className={styles.treeScroll}>
            <div className={styles.treeContainer}>
              {tree.map(rc => {
                const isEditingRc = editingNode?.id === rc.id;
                return (
                  <div key={rc.id}>
                    <StrategyNodeRow
                      name={rc.name}
                      description={rc.description}
                      level="rally-cry"
                      expanded={expandedRCs.has(rc.id)}
                      selected={rc.id === selectedRallyCryId}
                      onSelectRallyCry={() => setSelectedRallyCryId(rc.id)}
                      onToggleExpand={() => toggleRC(rc.id)}
                      onAddChild={() => {
                        resetModalForm();
                        setEditingNode(null);
                        setActiveModal({ type: 'defining-objective', rallyCryId: rc.id });
                        setExpandedRCs(prev => new Set(prev).add(rc.id));
                      }}
                      addChildLabel="Add Objective"
                      editing={isEditingRc}
                      editName={isEditingRc ? editingNode!.name : undefined}
                      editDescription={isEditingRc ? editingNode!.description : undefined}
                      onEditNameChange={v => setEditingNode(prev => prev ? { ...prev, name: v } : null)}
                      onEditDescriptionChange={v => setEditingNode(prev => prev ? { ...prev, description: v } : null)}
                      onStartEdit={() => handleStartEdit(rc.id, 'rally-cry', rc.name, rc.description)}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      editSaving={saving}
                      archived={rc.archived}
                      onArchive={() => handleArchive(rc.id, 'rally-cry', rc.name)}
                      onUnarchive={() => handleUnarchive(rc.id, 'rally-cry')}
                    >
                      {expandedRCs.has(rc.id) && (
                        <>
                          {rc.definingObjectives.map(d => {
                            const isEditingDo = editingNode?.id === d.id;
                            return (
                              <StrategyNodeRow
                                key={d.id}
                                name={d.name}
                                description={d.description}
                                level="defining-objective"
                                expanded={expandedDOs.has(d.id)}
                                onToggleExpand={() => toggleDO(d.id)}
                                onAddChild={() => {
                                  resetModalForm();
                                  setEditingNode(null);
                                  setActiveModal({ type: 'outcome', definingObjectiveId: d.id });
                                  setExpandedDOs(prev => new Set(prev).add(d.id));
                                }}
                                addChildLabel="Add Outcome"
                                editing={isEditingDo}
                                editName={isEditingDo ? editingNode!.name : undefined}
                                editDescription={isEditingDo ? editingNode!.description : undefined}
                                onEditNameChange={v => setEditingNode(prev => prev ? { ...prev, name: v } : null)}
                                onEditDescriptionChange={v => setEditingNode(prev => prev ? { ...prev, description: v } : null)}
                                onStartEdit={() => handleStartEdit(d.id, 'defining-objective', d.name, d.description)}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                editSaving={saving}
                                archived={d.archived}
                                onArchive={() => handleArchive(d.id, 'defining-objective', d.name)}
                                onUnarchive={() => handleUnarchive(d.id, 'defining-objective')}
                              >
                                {expandedDOs.has(d.id) && (
                                  <>
                                    {d.outcomes.map(o => {
                                      const isEditingOc = editingNode?.id === o.id;
                                      return (
                                        <StrategyNodeRow
                                          key={o.id}
                                          name={o.name}
                                          description={o.description}
                                          level="outcome"
                                          editing={isEditingOc}
                                          editName={isEditingOc ? editingNode!.name : undefined}
                                          editDescription={isEditingOc ? editingNode!.description : undefined}
                                          onEditNameChange={v => setEditingNode(prev => prev ? { ...prev, name: v } : null)}
                                          onEditDescriptionChange={v => setEditingNode(prev => prev ? { ...prev, description: v } : null)}
                                          onStartEdit={() => handleStartEdit(o.id, 'outcome', o.name, o.description)}
                                          onSaveEdit={handleSaveEdit}
                                          onCancelEdit={handleCancelEdit}
                                          editSaving={saving}
                                          archived={o.archived}
                                          onArchive={() => handleArchive(o.id, 'outcome', o.name)}
                                          onUnarchive={() => handleUnarchive(o.id, 'outcome')}
                                        />
                                      );
                                    })}
                                  </>
                                )}
                              </StrategyNodeRow>
                            );
                          })}
                        </>
                      )}
                    </StrategyNodeRow>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <RallyCryDetailPanel
          rallyCry={selectedRallyCry}
          saving={saving}
          archiving={panelArchiving}
          onSave={handleDetailSave}
          onArchive={handleDetailArchive}
        />
      </div>

      <StrategyCreateModals
        modal={activeModal}
        tree={tree}
        createName={createName}
        createDescription={createDescription}
        modalDoRallyCryId={modalDoRallyCryId}
        modalOutcomeDoId={modalOutcomeDoId}
        creating={creating}
        onClose={resetModalForm}
        onCreateNameChange={setCreateName}
        onCreateDescriptionChange={setCreateDescription}
        onModalDoRallyCryIdChange={setModalDoRallyCryId}
        onModalOutcomeDoIdChange={setModalOutcomeDoId}
        onSubmitRallyCry={handleCreateRallyCry}
        onSubmitDo={handleCreateDefiningObjective}
        onSubmitOutcome={handleCreateOutcome}
      />

      {toastError && (
        <ErrorToast message={toastError} onDismiss={() => setToastError(null)} />
      )}
    </div>
  );
};
