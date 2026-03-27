import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePlaybookSelectionState } from './usePlaybookSelectionState';
import { getPlaybook, getPlaybookFiles, getPlaybookScanLogs } from '@/services/auto-healing/playbooks';

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybook: jest.fn(),
  getPlaybookFiles: jest.fn(),
  getPlaybookScanLogs: jest.fn(),
}));

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn().mockResolvedValue([]),
}));

const playbookStub = {
  id: 'playbook-1',
  repository_id: 'repo-1',
  name: 'deploy',
  file_path: 'site.yml',
  description: 'deploy app',
  status: 'scanned',
  config_mode: 'enhanced',
  variables: [],
  last_scanned_at: null,
  created_at: '2026-03-27T00:00:00Z',
  updated_at: '2026-03-27T00:00:00Z',
} as AutoHealing.Playbook;

const draftVariable = {
  name: 'deploy_mode',
  type: 'string',
  required: false,
  default: 'draft-default',
  description: 'draft-description',
} as AutoHealing.PlaybookVariable;

const normalizedVariable = {
  ...draftVariable,
  default: 'normalized-default',
  description: 'normalized-description',
};

function Harness() {
  const state = usePlaybookSelectionState();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => void state.handleSelectPlaybook(playbookStub),
      },
      'select',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => void state.refreshSelectedPlaybook(playbookStub.id, {
          syncEditedVariables: true,
        }),
      },
      'refresh',
    ),
    React.createElement('div', { 'data-testid': 'edited-default' }, String(state.editedVariables[0]?.default || '')),
    React.createElement('div', { 'data-testid': 'selected-default' }, String(state.selectedPlaybook?.variables?.[0]?.default || '')),
  );
}

describe('usePlaybookSelectionState', () => {
  it('syncs edited variables to the latest backend detail when refreshing the selected playbook', async () => {
    (getPlaybook as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          ...playbookStub,
          variables: [draftVariable],
        },
      })
      .mockResolvedValueOnce({
        data: {
          ...playbookStub,
          variables: [normalizedVariable],
        },
      });
    (getPlaybookFiles as jest.Mock).mockResolvedValue({ data: { files: [] } });
    (getPlaybookScanLogs as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, page_size: 100 });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByText('select'));
    await waitFor(() => {
      expect(screen.getByTestId('edited-default').textContent).toBe('draft-default');
    });

    fireEvent.click(screen.getByText('refresh'));
    await waitFor(() => {
      expect(screen.getByTestId('edited-default').textContent).toBe('normalized-default');
      expect(screen.getByTestId('selected-default').textContent).toBe('normalized-default');
    });
  });
});
