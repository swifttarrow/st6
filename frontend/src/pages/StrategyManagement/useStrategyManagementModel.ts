import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { RcdoTreeRallyCry } from '../../api/types';
import type { StrategyModalState } from './StrategyCreateModals';

export type EditingNode = {
  id: string;
  type: 'rally-cry' | 'defining-objective' | 'outcome';
  name: string;
  description: string;
} | null;

export function useStrategyManagementModel() {
  const api = useApi();

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

  const selectedRallyCry = useMemo(
    () => (selectedRallyCryId ? tree.find(rc => rc.id === selectedRallyCryId) ?? null : null),
    [selectedRallyCryId, tree],
  );

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

  const openCreateRallyCry = useCallback(() => {
    resetModalForm();
    setEditingNode(null);
    setActiveModal({ type: 'rally-cry' });
  }, [resetModalForm]);

  const openCreateDefiningObjective = useCallback((rallyCryId: string) => {
    resetModalForm();
    setEditingNode(null);
    setActiveModal({ type: 'defining-objective', rallyCryId });
    setExpandedRCs(prev => new Set(prev).add(rallyCryId));
  }, [resetModalForm]);

  const openCreateOutcome = useCallback((definingObjectiveId: string) => {
    resetModalForm();
    setEditingNode(null);
    setActiveModal({ type: 'outcome', definingObjectiveId });
    setExpandedDOs(prev => new Set(prev).add(definingObjectiveId));
  }, [resetModalForm]);

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
  }, [api, createDescription, createName, loadTree, resetModalForm]);

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
  }, [activeModal, api, createDescription, createName, loadTree, modalDoRallyCryId, resetModalForm]);

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
  }, [activeModal, api, createDescription, createName, loadTree, modalOutcomeDoId, resetModalForm]);

  const handleStartEdit = useCallback((
    id: string,
    type: 'rally-cry' | 'defining-objective' | 'outcome',
    currentName: string,
    currentDescription: string,
  ) => {
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

  const updateEditingNodeName = useCallback((name: string) => {
    setEditingNode(prev => (prev ? { ...prev, name } : null));
  }, []);

  const updateEditingNodeDescription = useCallback((description: string) => {
    setEditingNode(prev => (prev ? { ...prev, description } : null));
  }, []);

  const handleArchive = useCallback(async (
    id: string,
    type: 'rally-cry' | 'defining-objective' | 'outcome',
    name: string,
  ) => {
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

  const handleUnarchive = useCallback(async (
    id: string,
    type: 'rally-cry' | 'defining-objective' | 'outcome',
  ) => {
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
  }, [api, loadTree, selectedRallyCryId]);

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
  }, [api, loadTree, selectedRallyCry]);

  const dismissToastError = useCallback(() => {
    setToastError(null);
  }, []);

  return {
    tree,
    loading,
    error,
    toastError,
    expandedRCs,
    expandedDOs,
    selectedRallyCryId,
    selectedRallyCry,
    activeModal,
    createName,
    createDescription,
    modalDoRallyCryId,
    modalOutcomeDoId,
    creating,
    editingNode,
    saving,
    panelArchiving,
    showArchived,
    setShowArchived,
    setSelectedRallyCryId,
    setCreateName,
    setCreateDescription,
    setModalDoRallyCryId,
    setModalOutcomeDoId,
    resetModalForm,
    toggleRC,
    toggleDO,
    openCreateRallyCry,
    openCreateDefiningObjective,
    openCreateOutcome,
    handleCreateRallyCry,
    handleCreateDefiningObjective,
    handleCreateOutcome,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    updateEditingNodeName,
    updateEditingNodeDescription,
    handleArchive,
    handleUnarchive,
    handleDetailSave,
    handleDetailArchive,
    dismissToastError,
  };
}
