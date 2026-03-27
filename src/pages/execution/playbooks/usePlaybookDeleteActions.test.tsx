import React, { useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { usePlaybookDeleteActions } from './usePlaybookDeleteActions';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import { deletePlaybook } from '@/services/auto-healing/playbooks';

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionTasks: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  deletePlaybook: jest.fn(),
}));

const playbook = {
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

describe('usePlaybookDeleteActions', () => {
  beforeEach(() => {
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function Harness(props: { loadPlaybooks: () => Promise<void> }) {
    const detailRequestIdRef = useRef(0);
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook | undefined>(playbook);
    const state = usePlaybookDeleteActions({
      clearScanning: jest.fn(),
      detailRequestIdRef,
      loadPlaybooks: props.loadPlaybooks,
      refreshSelectedPlaybook: jest.fn().mockResolvedValue(playbook),
      resetFileSelection: jest.fn(),
      selectedPlaybook,
      setEditedVariables: jest.fn() as any,
      setPlaybookFiles: jest.fn() as any,
      setScanLogs: jest.fn() as any,
      setSelectedPlaybook,
    });

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        { type: 'button', onClick: () => void state.openDeleteConfirm() },
        'open-confirm',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => void state.handleDelete() },
        'delete',
      ),
      React.createElement('div', { 'data-testid': 'confirm-open' }, String(state.deleteConfirmOpen)),
      React.createElement('div', { 'data-testid': 'selected-playbook' }, selectedPlaybook?.id || ''),
    );
  }

  it('keeps delete success semantics when only the follow-up list refresh fails', async () => {
    (getExecutionTasks as jest.Mock).mockResolvedValue({ total: 0 });
    (deletePlaybook as jest.Mock).mockResolvedValue(undefined);
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));

    render(React.createElement(Harness, { loadPlaybooks }));

    await act(async () => {
      fireEvent.click(screen.getByText('open-confirm'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('confirm-open').textContent).toBe('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('delete'));
    });

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('删除成功');
      expect(message.error).toHaveBeenCalledWith('刷新列表失败');
      expect(message.error).not.toHaveBeenCalledWith('删除 Playbook 失败');
      expect(screen.getByTestId('selected-playbook').textContent).toBe('');
    });
  });
});
