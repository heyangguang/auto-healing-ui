import { useCallback } from 'react';
import { message } from 'antd';
import {
  cancelImpersonationRequest,
  exitTenant,
  terminateSession,
  type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import { clearImpersonationState, loadImpersonationState } from '@/store/impersonation';

function clearCurrentImpersonationState(requestId: string) {
  if (loadImpersonationState().session?.requestId === requestId) {
    clearImpersonationState();
  }
}

export default function useImpersonationSessionActions(
  runAction: (requestId: string, operation: () => Promise<void>) => Promise<void>,
  triggerRefresh: () => void,
) {
  const handleExit = useCallback(async (record: ImpersonationRequest) => {
    await runAction(record.id, async () => {
      await exitTenant(record.id);
      clearCurrentImpersonationState(record.id);
      message.success('已退出租户视角');
      setTimeout(() => window.location.reload(), 500);
    });
  }, [runAction]);

  const handleTerminate = useCallback(async (record: ImpersonationRequest) => {
    await runAction(record.id, async () => {
      await terminateSession(record.id);
      clearCurrentImpersonationState(record.id);
      message.success('会话已终止');
      triggerRefresh();
      if (record.status === 'active') {
        setTimeout(() => window.location.reload(), 500);
      }
    });
  }, [runAction, triggerRefresh]);

  const handleCancel = useCallback(async (record: ImpersonationRequest) => {
    await runAction(record.id, async () => {
      await cancelImpersonationRequest(record.id);
      message.success('申请已撤销');
      triggerRefresh();
    });
  }, [runAction, triggerRefresh]);

  return { handleExit, handleTerminate, handleCancel };
}
