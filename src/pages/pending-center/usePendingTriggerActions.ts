import { useCallback } from 'react';
import { Modal, message } from 'antd';
import { dismissIncident, triggerHealing } from '@/services/auto-healing/healing';
import type { PendingTriggerRecord } from './types';

export default function usePendingTriggerActions(triggerRefresh: () => void) {
  const handleTrigger = useCallback((record: PendingTriggerRecord) => {
    Modal.confirm({
      title: '确认启动自愈？',
      content: `确定要为工单 ${record.external_id} 启动自愈流程吗？`,
      okText: '启动',
      cancelText: '取消',
      onOk: async () => {
        await triggerHealing(record.id);
        message.success('已启动自愈流程');
        triggerRefresh();
      },
    });
  }, [triggerRefresh]);

  const handleDismiss = useCallback((record: PendingTriggerRecord) => {
    Modal.confirm({
      title: '确认忽略工单？',
      content: `确定要忽略工单 ${record.external_id} 吗？忽略后该工单将不再出现在待触发列表中。`,
      okText: '忽略',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await dismissIncident(record.id);
        message.success('工单已忽略');
        triggerRefresh();
      },
    });
  }, [triggerRefresh]);

  return { handleTrigger, handleDismiss };
}
