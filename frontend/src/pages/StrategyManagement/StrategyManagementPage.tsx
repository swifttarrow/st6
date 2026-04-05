import React from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useUserContext } from '../../context/UserContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ErrorToast } from '../../components/ErrorToast/ErrorToast';
import { RallyCryDetailPanel } from './RallyCryDetailPanel';
import { StrategyCreateModals } from './StrategyCreateModals';
import { StrategyTree } from './StrategyTree';
import { useStrategyManagementModel } from './useStrategyManagementModel';
import styles from './StrategyManagementPage.module.css';

export const StrategyManagementPage: React.FC = () => {
  const userContext = useUserContext();
  const {
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
  } = useStrategyManagementModel();

  if (userContext.role === 'IC') {
    return <Navigate to="/commitments" replace />;
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
              onClick={openCreateRallyCry}
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
              <StrategyTree
                tree={tree}
                expandedRCs={expandedRCs}
                expandedDOs={expandedDOs}
                selectedRallyCryId={selectedRallyCryId}
                editingNode={editingNode}
                saving={saving}
                onSelectRallyCry={setSelectedRallyCryId}
                onToggleRC={toggleRC}
                onToggleDO={toggleDO}
                onOpenCreateDefiningObjective={openCreateDefiningObjective}
                onOpenCreateOutcome={openCreateOutcome}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onEditNameChange={updateEditingNodeName}
                onEditDescriptionChange={updateEditingNodeDescription}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
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
        <ErrorToast message={toastError} onDismiss={dismissToastError} />
      )}
    </div>
  );
};
