import { describe, it, expect } from 'vitest';
import { buildOutcomePath, getOutcomeName } from '../../utils/rcdoTree';
import type { RcdoTreeRallyCry } from '../../api/types';

const tree: RcdoTreeRallyCry[] = [
  {
    id: 'rc-1',
    name: 'Rally A',
    description: '',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'DO One',
        description: '',
        outcomes: [
          { id: 'o-1', name: 'Outcome One', description: '' },
          { id: 'o-2', name: 'Outcome Two', description: '' },
        ],
      },
    ],
  },
  {
    id: 'rc-2',
    name: 'Rally B',
    description: '',
    definingObjectives: [
      {
        id: 'do-2',
        name: 'DO Two',
        description: '',
        outcomes: [{ id: 'o-3', name: 'Outcome Three', description: '' }],
      },
    ],
  },
];

describe('rcdoTree', () => {
  it('buildOutcomePath returns nested labels for a known outcome', () => {
    expect(buildOutcomePath(tree, 'o-2')).toBe('Rally A > DO One > Outcome Two');
  });

  it('buildOutcomePath returns empty string when not found', () => {
    expect(buildOutcomePath(tree, 'missing')).toBe('');
    expect(buildOutcomePath([], 'o-1')).toBe('');
  });

  it('getOutcomeName returns name or Unknown outcome', () => {
    expect(getOutcomeName(tree, 'o-3')).toBe('Outcome Three');
    expect(getOutcomeName(tree, 'nope')).toBe('Unknown outcome');
    expect(getOutcomeName([], 'o-1')).toBe('Unknown outcome');
  });
});
