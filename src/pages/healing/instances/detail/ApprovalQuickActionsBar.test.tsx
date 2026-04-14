import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApprovalQuickActionsBar from './ApprovalQuickActionsBar';
import { openApprovalDecisionModal } from '@/pages/pending-center/shared';
import { approveTask, getApprovals } from '@/services/auto-healing/healing';

jest.mock('@/services/auto-healing/healing', () => ({
  approveTask: jest.fn(),
  getApprovals: jest.fn(),
  rejectTask: jest.fn(),
}));

jest.mock('@/pages/pending-center/shared', () => ({
  openApprovalDecisionModal: jest.fn(),
}));

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    message: {
      success: jest.fn(),
    },
  };
});

describe('ApprovalQuickActionsBar', () => {
  it('submits approval decisions from the instance detail drawer', async () => {
    const ReactLocal = require('react');
    const onActionSuccess = jest.fn();
    (getApprovals as jest.Mock).mockResolvedValue({
      data: [{ id: 'approval-1', node_id: 'approval-node', status: 'pending' }],
      total: 1,
    });

    render(
      ReactLocal.createElement(ApprovalQuickActionsBar, {
        canApprove: true,
        flowInstanceId: 'flow-1',
        onActionSuccess,
        selectedNodeData: {
          id: 'approval-node',
          name: '人工审批',
          type: 'approval',
          status: 'waiting_approval',
        },
      }),
    );

    await waitFor(() => {
      expect(getApprovals).toHaveBeenCalledWith({
        page: 1,
        page_size: 50,
        flow_instance_id: 'flow-1',
        status: 'pending',
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: /批\s*准/ }));

    const modalConfig = (openApprovalDecisionModal as jest.Mock).mock.calls.at(-1)?.[0];
    expect(modalConfig).toEqual(expect.objectContaining({
      title: '批准任务: 人工审批',
      okText: '批准',
    }));

    await act(async () => {
      await modalConfig.onSubmit('同意执行');
    });

    expect(approveTask).toHaveBeenCalledWith('approval-1', { comment: '同意执行' });
    expect(onActionSuccess).toHaveBeenCalled();
  });
});
