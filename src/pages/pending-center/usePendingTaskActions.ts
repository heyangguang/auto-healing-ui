import { useCallback } from 'react';
import { message } from 'antd';
import { approveTask, rejectTask } from '@/services/auto-healing/healing';
import type { PendingApprovalRecord } from './types';
import { openApprovalDecisionModal } from './shared';

export default function usePendingTaskActions(triggerRefresh: () => void) {
  const handleApprove = useCallback((record: PendingApprovalRecord) => {
    openApprovalDecisionModal({
      title: `批准任务: ${record.node_name || record.node_id || '节点'}`,
      placeholder: '请输入审批意见（可选）',
      okText: '批准',
      onSubmit: async (comment) => {
        await approveTask(record.id, { comment });
        message.success('已批准');
        triggerRefresh();
      },
    });
  }, [triggerRefresh]);

  const handleReject = useCallback((record: PendingApprovalRecord) => {
    openApprovalDecisionModal({
      title: `拒绝任务: ${record.node_name || record.node_id || '节点'}`,
      placeholder: '请输入拒绝原因（必填）',
      okText: '拒绝',
      danger: true,
      requireComment: true,
      onSubmit: async (comment) => {
        await rejectTask(record.id, { comment });
        message.success('已拒绝');
        triggerRefresh();
      },
    });
  }, [triggerRefresh]);

  return { handleApprove, handleReject };
}
