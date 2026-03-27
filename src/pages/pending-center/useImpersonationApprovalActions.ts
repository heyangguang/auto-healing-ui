import { useCallback, useState } from 'react';
import { message } from 'antd';
import {
  approveImpersonation,
  rejectImpersonation,
  type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import useRejectModalState from './useRejectModalState';

export default function useImpersonationApprovalActions(
  triggerRefresh: () => void,
  closeDrawer: () => void,
) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const rejectState = useRejectModalState<ImpersonationRequest>();

  const handleApprove = useCallback(async (record: ImpersonationRequest) => {
    setActionLoading(record.id);
    try {
      await approveImpersonation(record.id);
      message.success('已批准该请求');
      closeDrawer();
      triggerRefresh();
    } finally {
      setActionLoading(null);
    }
  }, [closeDrawer, triggerRefresh]);

  const handleReject = useCallback(async () => {
    if (!rejectState.rejectTarget) {
      return;
    }

    setActionLoading(rejectState.rejectTarget.id);
    try {
      await rejectImpersonation(
        rejectState.rejectTarget.id,
        rejectState.rejectReason.trim() ? { comment: rejectState.rejectReason.trim() } : undefined,
      );
      message.success('已拒绝该请求');
      rejectState.closeRejectModal();
      closeDrawer();
      triggerRefresh();
    } finally {
      setActionLoading(null);
    }
  }, [closeDrawer, rejectState, triggerRefresh]);

  return { actionLoading, handleApprove, handleReject, rejectState };
}
