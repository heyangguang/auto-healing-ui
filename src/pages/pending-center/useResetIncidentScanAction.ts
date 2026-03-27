import { useCallback } from 'react';
import { Modal, message } from 'antd';
import { resetIncidentScan } from '@/services/auto-healing/healing';
import type { PendingTriggerRecord } from './types';

export default function useResetIncidentScanAction(triggerRefresh: () => void) {
  return useCallback((record: PendingTriggerRecord) => {
    Modal.confirm({
      title: '确认恢复工单？',
      content: `确定要将工单 ${record.external_id} 恢复为待处理状态吗？恢复后将重新扫描匹配规则。`,
      okText: '恢复',
      cancelText: '取消',
      onOk: async () => {
        await resetIncidentScan(record.id);
        message.success('工单已恢复为待处理');
        triggerRefresh();
      },
    });
  }, [triggerRefresh]);
}
