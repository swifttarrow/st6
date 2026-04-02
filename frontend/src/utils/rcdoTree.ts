import type { RcdoTreeRallyCry } from '../api/types';

export function buildOutcomePath(tree: RcdoTreeRallyCry[], outcomeId: string): string {
  for (const rc of tree) {
    for (const d of rc.definingObjectives) {
      for (const o of d.outcomes) {
        if (o.id === outcomeId) {
          return `${rc.name} > ${d.name} > ${o.name}`;
        }
      }
    }
  }
  return '';
}

export function getOutcomeName(tree: RcdoTreeRallyCry[], outcomeId: string): string {
  for (const rc of tree) {
    for (const d of rc.definingObjectives) {
      for (const o of d.outcomes) {
        if (o.id === outcomeId) {
          return o.name;
        }
      }
    }
  }
  return 'Unknown outcome';
}
