import React from 'react';
import { RcdoTreeRallyCry } from '../../api/types';
import { StrategyNodeRow } from './StrategyNodeRow';
import type { EditingNode } from './useStrategyManagementModel';

interface StrategyTreeProps {
  tree: RcdoTreeRallyCry[];
  expandedRCs: Set<string>;
  expandedDOs: Set<string>;
  selectedRallyCryId: string | null;
  editingNode: EditingNode;
  saving: boolean;
  onSelectRallyCry: (id: string) => void;
  onToggleRC: (id: string) => void;
  onToggleDO: (id: string) => void;
  onOpenCreateDefiningObjective: (rallyCryId: string) => void;
  onOpenCreateOutcome: (definingObjectiveId: string) => void;
  onStartEdit: (
    id: string,
    type: 'rally-cry' | 'defining-objective' | 'outcome',
    currentName: string,
    currentDescription: string,
  ) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onArchive: (id: string, type: 'rally-cry' | 'defining-objective' | 'outcome', name: string) => void;
  onUnarchive: (id: string, type: 'rally-cry' | 'defining-objective' | 'outcome') => void;
}

export const StrategyTree: React.FC<StrategyTreeProps> = ({
  tree,
  expandedRCs,
  expandedDOs,
  selectedRallyCryId,
  editingNode,
  saving,
  onSelectRallyCry,
  onToggleRC,
  onToggleDO,
  onOpenCreateDefiningObjective,
  onOpenCreateOutcome,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onEditDescriptionChange,
  onArchive,
  onUnarchive,
}) => {
  return (
    <>
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
              onSelectRallyCry={() => onSelectRallyCry(rc.id)}
              onToggleExpand={() => onToggleRC(rc.id)}
              onAddChild={() => onOpenCreateDefiningObjective(rc.id)}
              addChildLabel="Add Objective"
              editing={isEditingRc}
              editName={isEditingRc ? editingNode!.name : undefined}
              editDescription={isEditingRc ? editingNode!.description : undefined}
              onEditNameChange={onEditNameChange}
              onEditDescriptionChange={onEditDescriptionChange}
              onStartEdit={() => onStartEdit(rc.id, 'rally-cry', rc.name, rc.description)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              editSaving={saving}
              archived={rc.archived}
              onArchive={() => onArchive(rc.id, 'rally-cry', rc.name)}
              onUnarchive={() => onUnarchive(rc.id, 'rally-cry')}
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
                        onToggleExpand={() => onToggleDO(d.id)}
                        onAddChild={() => onOpenCreateOutcome(d.id)}
                        addChildLabel="Add Outcome"
                        editing={isEditingDo}
                        editName={isEditingDo ? editingNode!.name : undefined}
                        editDescription={isEditingDo ? editingNode!.description : undefined}
                        onEditNameChange={onEditNameChange}
                        onEditDescriptionChange={onEditDescriptionChange}
                        onStartEdit={() => onStartEdit(d.id, 'defining-objective', d.name, d.description)}
                        onSaveEdit={onSaveEdit}
                        onCancelEdit={onCancelEdit}
                        editSaving={saving}
                        archived={d.archived}
                        onArchive={() => onArchive(d.id, 'defining-objective', d.name)}
                        onUnarchive={() => onUnarchive(d.id, 'defining-objective')}
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
                                  onEditNameChange={onEditNameChange}
                                  onEditDescriptionChange={onEditDescriptionChange}
                                  onStartEdit={() => onStartEdit(o.id, 'outcome', o.name, o.description)}
                                  onSaveEdit={onSaveEdit}
                                  onCancelEdit={onCancelEdit}
                                  editSaving={saving}
                                  archived={o.archived}
                                  onArchive={() => onArchive(o.id, 'outcome', o.name)}
                                  onUnarchive={() => onUnarchive(o.id, 'outcome')}
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
    </>
  );
};
