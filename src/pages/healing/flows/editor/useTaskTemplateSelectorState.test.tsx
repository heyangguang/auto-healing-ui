import { act, renderHook, waitFor } from '@testing-library/react';
import {
  getExecutionTask,
  getExecutionTasks,
} from '@/services/auto-healing/execution';
import {
  getCachedExecutionTaskInventory,
  getCachedGitRepoInventory,
  getCachedPlaybookInventory,
} from '@/utils/selectorInventoryCache';
import { useTaskTemplateSelectorState } from './useTaskTemplateSelectorState';

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionTask: jest.fn(),
  getExecutionTasks: jest.fn(),
}));

jest.mock('@/utils/selectorInventoryCache', () => ({
  getCachedExecutionTaskInventory: jest.fn(),
  getCachedGitRepoInventory: jest.fn(),
  getCachedPlaybookInventory: jest.fn(),
}));

describe('useTaskTemplateSelectorState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCachedExecutionTaskInventory as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        name: '磁盘恢复',
        needs_review: false,
        playbook: {
          id: 'playbook-1',
          name: 'playbook-1',
          status: 'ready',
          variables: [],
        },
      },
    ]);
    (getCachedGitRepoInventory as jest.Mock).mockResolvedValue([
      { id: 'repo-1', name: 'repo-1' },
    ]);
    (getCachedPlaybookInventory as jest.Mock).mockResolvedValue([
      { id: 'playbook-1', name: 'playbook-1', repository_id: 'repo-1' },
      { id: 'playbook-2', name: 'playbook-2', repository_id: 'repo-1' },
    ]);
    (getExecutionTasks as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'task-1',
          name: '磁盘恢复',
          needs_review: false,
          playbook: {
            id: 'playbook-1',
            name: 'playbook-1',
            status: 'ready',
            variables: [],
          },
        },
      ],
      total: 1,
    });
    (getExecutionTask as jest.Mock).mockResolvedValue({
      data: {
        id: 'task-1',
        name: '磁盘恢复',
      },
    });
  });

  it('keeps base inventory loading stable across rerenders while selector stays open', async () => {
    const { result, rerender } = renderHook(
      ({ open, value }: { open: boolean; value?: string }) =>
        useTaskTemplateSelectorState({ open, value }),
      { initialProps: { open: true, value: 'task-1' } },
    );

    await waitFor(() => {
      expect(result.current.initLoading).toBe(false);
    });

    rerender({ open: true, value: 'task-1' });

    await waitFor(() => {
      expect(result.current.displayTasks).toHaveLength(1);
    });

    expect(getCachedGitRepoInventory).toHaveBeenCalledTimes(1);
    expect(getCachedPlaybookInventory).toHaveBeenCalledTimes(1);
    expect(getCachedExecutionTaskInventory).toHaveBeenCalledTimes(1);
  });

  it('enters loading state immediately when switching tree filters', async () => {
    const { result } = renderHook(() =>
      useTaskTemplateSelectorState({ open: true, value: 'task-1' }),
    );

    await waitFor(() => {
      expect(result.current.initLoading).toBe(false);
    });

    act(() => {
      result.current.handleTreeSelect(['playbook-playbook-2']);
    });

    expect(result.current.tasksLoading).toBe(true);
  });

  it('keeps a user-selected task when the external value is empty', async () => {
    const { result } = renderHook(() =>
      useTaskTemplateSelectorState({ open: true }),
    );

    await waitFor(() => {
      expect(result.current.displayTasks).toHaveLength(1);
    });

    act(() => {
      result.current.handleTaskSelect(result.current.displayTasks[0]);
    });

    expect(result.current.selectedTaskId).toBe('task-1');
    expect(result.current.selectedTask?.name).toBe('磁盘恢复');
    expect(result.current.canConfirm).toBe(true);
  });
});
