import React, { useRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { usePlaybookLifecycleActions } from './usePlaybookLifecycleActions';
import { getPlaybookFiles, scanPlaybook, setPlaybookReady, updatePlaybook } from '@/services/auto-healing/playbooks';

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybookFiles: jest.fn(),
  getPlaybookScanLogs: jest.fn(),
  scanPlaybook: jest.fn(),
  setPlaybookOffline: jest.fn(),
  setPlaybookReady: jest.fn(),
  updatePlaybook: jest.fn(),
}));

const selectedPlaybook = {
  id: 'playbook-1',
  repository_id: 'repo-1',
  name: 'deploy',
  file_path: 'site.yml',
  description: 'deploy app',
  status: 'pending',
  config_mode: 'enhanced',
  variables: [],
  last_scanned_at: null,
  created_at: '2026-03-27T00:00:00Z',
  updated_at: '2026-03-27T00:00:00Z',
} as AutoHealing.Playbook;

describe('usePlaybookLifecycleActions', () => {
  beforeEach(() => {
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function Harness(props: {
    loadPlaybooks: () => Promise<void>;
    mergePlaybookInInventory?: (playbook: AutoHealing.Playbook) => void;
    refreshSelectedPlaybook: (playbookId: string, options?: { requestId?: number; syncEditedVariables?: boolean }) => Promise<AutoHealing.Playbook>;
  }) {
    const detailRequestIdRef = useRef(1);
    const [selected, setSelected] = React.useState<AutoHealing.Playbook | undefined>(selectedPlaybook);
    const state = usePlaybookLifecycleActions({
      detailRequestIdRef,
      loadPlaybooks: props.loadPlaybooks,
      mergePlaybookInInventory: props.mergePlaybookInInventory,
      refreshSelectedPlaybook: props.refreshSelectedPlaybook,
      selectedPlaybook: selected,
      setPlaybookFiles: jest.fn() as any,
      setScanLogs: jest.fn() as any,
      setSelectedPlaybook: setSelected,
    });

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        { type: 'button', onClick: () => void state.handleSetReady() },
        'set-ready',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => void state.handleEditPlaybook({ name: 'deploy-v2', description: 'updated' }) },
        'edit',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => void state.handleScan() },
        'scan',
      ),
      React.createElement('div', { 'data-testid': 'selected-name' }, selected?.name || ''),
      React.createElement('div', { 'data-testid': 'selected-status' }, selected?.status || ''),
    );
  }

  it('still refreshes selected playbook detail when list refresh fails after setting ready', async () => {
    (setPlaybookReady as jest.Mock).mockResolvedValue(undefined);
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockResolvedValue(selectedPlaybook);

    render(React.createElement(Harness, { loadPlaybooks, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('set-ready'));
    });

    await waitFor(() => {
      expect(refreshSelectedPlaybook).toHaveBeenCalledWith('playbook-1', {
        requestId: 1,
        syncEditedVariables: undefined,
      });
      expect(message.success).toHaveBeenCalledWith('已设为就绪状态');
      expect(message.error).toHaveBeenCalledWith('刷新列表失败');
    });
  });

  it('uses update response data to sync current playbook even when subsequent refresh fails', async () => {
    (updatePlaybook as jest.Mock).mockResolvedValue({
      data: {
        ...selectedPlaybook,
        description: 'updated',
        name: 'deploy-v2',
      },
    });
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockRejectedValue(new Error('刷新详情失败'));

    render(React.createElement(Harness, { loadPlaybooks, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('edit'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-name').textContent).toBe('deploy-v2');
      expect(message.success).toHaveBeenCalledWith('更新成功');
      expect(message.error).toHaveBeenCalledWith('刷新列表失败');
      expect(message.error).toHaveBeenCalledWith('刷新详情失败');
    });
  });

  it('does not apply fresh files or logs when scan detail refresh fails', async () => {
    (scanPlaybook as jest.Mock).mockResolvedValue({
      data: {
        created_at: '2026-03-27T10:00:00Z',
        variables_found: 3,
      },
    });
    (getPlaybookFiles as jest.Mock).mockResolvedValue({ data: { files: [] } });
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockRejectedValue(new Error('刷新详情失败'));

    render(React.createElement(Harness, { loadPlaybooks, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('scan'));
    });

    await waitFor(() => {
      expect(refreshSelectedPlaybook).toHaveBeenCalledWith('playbook-1', {
        requestId: 1,
        syncEditedVariables: true,
      });
      expect(getPlaybookFiles).not.toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledWith('刷新详情失败');
      expect(screen.getByTestId('selected-status').textContent).toBe('pending');
    });
  });

  it('merges refreshed detail back into inventory when list refresh fails but detail refresh succeeds', async () => {
    const mergePlaybookInInventory = jest.fn();
    const scannedDetail = {
      ...selectedPlaybook,
      status: 'scanned',
      variables: [{ name: 'deploy_mode', type: 'string', required: false, default: 'normalized', description: 'mode' }],
    } as AutoHealing.Playbook;
    (scanPlaybook as jest.Mock).mockResolvedValue({
      data: {
        created_at: '2026-03-27T10:00:00Z',
        variables_found: 3,
      },
    });
    (getPlaybookFiles as jest.Mock).mockResolvedValue({ data: { files: [] } });
    const loadPlaybooks = jest.fn().mockRejectedValue(new Error('刷新列表失败'));
    const refreshSelectedPlaybook = jest.fn().mockResolvedValue(scannedDetail);

    render(React.createElement(Harness, { loadPlaybooks, mergePlaybookInInventory, refreshSelectedPlaybook }));

    await act(async () => {
      fireEvent.click(screen.getByText('scan'));
    });

    await waitFor(() => {
      expect(mergePlaybookInInventory).toHaveBeenCalledWith(scannedDetail);
      expect(message.error).toHaveBeenCalledWith('刷新列表失败');
    });
  });
});
