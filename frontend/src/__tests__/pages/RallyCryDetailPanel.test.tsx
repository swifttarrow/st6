import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RallyCryDetailPanel } from '../../pages/StrategyManagement/RallyCryDetailPanel';
import type { RcdoTreeRallyCry } from '../../api/types';

const sampleRc: RcdoTreeRallyCry = {
  id: 'rc-1',
  name: 'North Star',
  description: 'Grow revenue',
  definingObjectives: [
    {
      id: 'do-1',
      name: 'Pipeline',
      description: '',
      archived: false,
      outcomes: [{ id: 'o-1', name: 'Win deals', description: '', archived: false }],
    },
  ],
};

describe('RallyCryDetailPanel', () => {
  it('shows empty state when no rally cry is selected', () => {
    render(
      <RallyCryDetailPanel
        rallyCry={null}
        saving={false}
        archiving={false}
        onSave={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.getByText('Select a Rally Cry to view details.')).toBeDefined();
  });

  it('calls onSave with edited values', () => {
    const onSave = vi.fn();
    render(
      <RallyCryDetailPanel
        rallyCry={sampleRc}
        saving={false}
        archiving={false}
        onSave={onSave}
        onArchive={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByTestId('rc-detail-save'));

    expect(onSave).toHaveBeenCalledWith('Renamed', 'Grow revenue');
  });

  it('calls onArchive after confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onArchive = vi.fn();
    render(
      <RallyCryDetailPanel
        rallyCry={sampleRc}
        saving={false}
        archiving={false}
        onSave={vi.fn()}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByTestId('rc-detail-archive'));
    expect(onArchive).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });
});
