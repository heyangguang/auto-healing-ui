import React, { useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { usePlaybookVariableAutosave } from './usePlaybookVariableAutosave';
import { updatePlaybookVariables } from '@/services/auto-healing/playbooks';

jest.mock('@/services/auto-healing/playbooks', () => ({
  updatePlaybookVariables: jest.fn(),
}));

const selectedPlaybook = {
  id: 'playbook-1',
  repository_id: 'repo-1',
  name: 'deploy',
  file_path: 'site.yml',
  description: 'deploy app',
  status: 'ready',
  config_mode: 'enhanced',
  variables: [],
  last_scanned_at: null,
  created_at: '2026-03-27T00:00:00Z',
  updated_at: '2026-03-27T00:00:00Z',
} as AutoHealing.Playbook;

const variable = {
  name: 'deploy_mode',
  type: 'string',
  required: false,
  default: 'rolling',
  description: 'mode',
} as AutoHealing.PlaybookVariable;

const normalizedVariable = {
  ...variable,
  default: 'normalized',
} as AutoHealing.PlaybookVariable;

const persistedVariable = {
  ...variable,
  default: 'persisted',
} as AutoHealing.PlaybookVariable;

describe('usePlaybookVariableAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function Harness(props: {
    loadPlaybooks: () => Promise<void>;
    mergePlaybookInInventory?: (playbook: AutoHealing.Playbook) => void;
    refreshSelectedPlaybook: (playbookId: string, options?: { requestId?: number; syncEditedVariables?: boolean }) => Promise<AutoHealing.Playbook>;
  }) {
    const detailRequestIdRef = useRef(1);
    const [editedVariables, setEditedVariables] = useState<AutoHealing.PlaybookVariable[]>([]);
    const [selected, setSelected] = useState<AutoHealing.Playbook | undefined>({
      ...selectedPlaybook,
      variables: [persistedVariable],
    });
    const state = usePlaybookVariableAutosave({
      detailRequestIdRef,
      loadPlaybooks: props.loadPlaybooks,
      mergePlaybookInInventory: props.mergePlaybookInInventory,
      refreshSelectedPlaybook: props.refreshSelectedPlaybook,
      selectedPlaybook: selected,
      setEditedVariables,
      setSelectedPlaybook: setSelected,
    });

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => state.autoSaveVariables([variable]),
        },
        'autosave',
      ),
      React.createElement('div', { 'data-testid': 'edited-count' }, String(editedVariables.length)),
      React.createElement('div', { 'data-testid': 'edited-default' }, String(editedVariables[0]?.default || '')),
      React.createElement('div', { 'data-testid': 'selected-default' }, String(selected?.variables?.[0]?.default || '')),
    );
  }

  it('syncs returned playbook truth locally and still refreshes detail when list refresh fails after autosave success', async () => {
    const mergePlaybookInInventory = jest.fn();
    (updatePlaybookVariables as jest.Mock).mockResolvedValue({
      data: {
        ...selectedPlaybook,
        variables: [normalizedVariable],
      },
    });
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockResolvedValue(selectedPlaybook);

    render(React.createElement(Harness, { loadPlaybooks, mergePlaybookInInventory, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('autosave'));
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(refreshSelectedPlaybook).toHaveBeenCalledWith('playbook-1', {
        requestId: 1,
        syncEditedVariables: true,
      });
      expect(mergePlaybookInInventory).toHaveBeenCalledWith({
        ...selectedPlaybook,
        variables: [normalizedVariable],
      });
      expect(message.success).toHaveBeenCalledWith('已自动保存');
      expect(message.error).toHaveBeenCalledWith('刷新列表失败');
      expect(screen.getByTestId('edited-count').textContent).toBe('1');
      expect(screen.getByTestId('edited-default').textContent).toBe('normalized');
      expect(screen.getByTestId('selected-default').textContent).toBe('normalized');
    });
  });

  it('rolls back edited variables to the last committed value when save and detail refresh both fail', async () => {
    (updatePlaybookVariables as jest.Mock).mockRejectedValue(new Error('保存失败'));
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockRejectedValue(new Error('刷新详情失败'));

    render(React.createElement(Harness, { loadPlaybooks, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('autosave'));
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('保存失败');
      expect(message.error).toHaveBeenCalledWith('刷新详情失败');
      expect(screen.getByTestId('edited-default').textContent).toBe('persisted');
      expect(screen.getByTestId('selected-default').textContent).toBe('persisted');
    });
  });

  it('rolls back to the latest committed snapshot instead of an older closure copy', async () => {
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockRejectedValue(new Error('刷新详情失败'));
    (updatePlaybookVariables as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          ...selectedPlaybook,
          variables: [normalizedVariable],
        },
      })
      .mockRejectedValueOnce(new Error('保存失败'));

    render(React.createElement(Harness, { loadPlaybooks, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('autosave'));
      jest.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-default').textContent).toBe('normalized');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('autosave'));
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('edited-default').textContent).toBe('normalized');
      expect(screen.getByTestId('selected-default').textContent).toBe('normalized');
    });
  });
});
