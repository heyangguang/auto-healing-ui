import { act, renderHook } from '@testing-library/react';
import { Modal, message } from 'antd';
import { approveTask, dismissIncident, resetIncidentScan } from '@/services/auto-healing/healing';
import usePendingTaskActions from './usePendingTaskActions';
import usePendingTriggerActions from './usePendingTriggerActions';
import useResetIncidentScanAction from './useResetIncidentScanAction';

type ConfirmConfig = {
  onOk?: () => Promise<void>;
};

type ApprovalDecisionConfig = {
  onSubmit: (comment: string) => Promise<void>;
};

jest.mock('@/services/auto-healing/healing', () => ({
  approveTask: jest.fn(),
  dismissIncident: jest.fn(),
  resetIncidentScan: jest.fn(),
}));

jest.mock('./shared', () => ({
  openApprovalDecisionModal: jest.fn(),
}));

jest.mock('antd', () => ({
  Modal: {
    confirm: jest.fn(),
  },
  message: {
    success: jest.fn(),
  },
}));

function getLatestDecisionConfig() {
  const { openApprovalDecisionModal } = jest.requireMock('./shared') as {
    openApprovalDecisionModal: jest.Mock;
  };
  return openApprovalDecisionModal.mock.calls.at(-1)?.[0] as ApprovalDecisionConfig;
}

function getLatestConfirmConfig() {
  const mock = Modal.confirm as jest.Mock;
  return mock.mock.calls.at(-1)?.[0] as ConfirmConfig;
}

describe('pending-center action hooks', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the approval confirm pending when approveTask fails', async () => {
    const triggerRefresh = jest.fn();
    (approveTask as jest.Mock).mockRejectedValueOnce(new Error('审批失败'));
    const { result } = renderHook(() => usePendingTaskActions(triggerRefresh));

    act(() => {
      result.current.handleApprove({ id: 'approval-1', node_name: '节点 A' } as never);
    });

    await expect(getLatestDecisionConfig().onSubmit('审批意见')).rejects.toThrow('审批失败');
    expect(triggerRefresh).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
  });

  it('keeps the dismiss confirm pending when dismissIncident fails', async () => {
    const triggerRefresh = jest.fn();
    (dismissIncident as jest.Mock).mockRejectedValueOnce(new Error('忽略失败'));
    const { result } = renderHook(() => usePendingTriggerActions(triggerRefresh));

    act(() => {
      result.current.handleDismiss({ id: 'trigger-1', external_id: 'INC-1' } as never);
    });

    await expect(getLatestConfirmConfig().onOk?.()).rejects.toThrow('忽略失败');
    expect(triggerRefresh).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
  });

  it('keeps the reset confirm pending when resetIncidentScan fails', async () => {
    const triggerRefresh = jest.fn();
    (resetIncidentScan as jest.Mock).mockRejectedValueOnce(new Error('恢复失败'));
    const { result } = renderHook(() => useResetIncidentScanAction(triggerRefresh));

    act(() => {
      result.current({ id: 'trigger-2', external_id: 'INC-2' } as never);
    });

    await expect(getLatestConfirmConfig().onOk?.()).rejects.toThrow('恢复失败');
    expect(triggerRefresh).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
  });
});
