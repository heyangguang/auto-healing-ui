import { useCallback, useState } from 'react';
import { message } from 'antd';
import {
  approveBlacklistExemption,
  rejectBlacklistExemption,
  type ExemptionRecord,
} from '@/services/auto-healing/blacklistExemption';
import useRejectModalState from './useRejectModalState';

export default function useExemptionApprovalActions(
  triggerRefresh: () => void,
  closeDrawer: () => void,
) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const rejectState = useRejectModalState<ExemptionRecord>();

  const handleApprove = useCallback(async (record: ExemptionRecord) => {
    setActionLoading(record.id);
    try {
      await approveBlacklistExemption(record.id);
      message.success('已批准该豁免申请');
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
    if (!rejectState.rejectReason.trim()) {
      message.error('请输入拒绝原因');
      return;
    }

    setActionLoading(rejectState.rejectTarget.id);
    try {
      await rejectBlacklistExemption(rejectState.rejectTarget.id, rejectState.rejectReason.trim());
      message.success('已拒绝该豁免申请');
      rejectState.closeRejectModal();
      closeDrawer();
      triggerRefresh();
    } finally {
      setActionLoading(null);
    }
  }, [closeDrawer, rejectState, triggerRefresh]);

  return { actionLoading, handleApprove, handleReject, rejectState };
}
