import { Modal, message } from 'antd';
import { useCallback } from 'react';
import { restorePendingTrigger } from '@/services/auto-healing/healing';
import type { PendingTriggerRecord } from './types';

export default function useResetIncidentScanAction(triggerRefresh: () => void) {
  return useCallback(
    (record: PendingTriggerRecord) => {
      Modal.confirm({
        title: '确认恢复工单？',
        content: `确定要将工单 ${record.external_id} 恢复到待触发池吗？恢复后将保留当前匹配规则，可立即再次触发自愈。`,
        okText: '恢复',
        cancelText: '取消',
        onOk: async () => {
          await restorePendingTrigger(record.id);
          message.success('工单已恢复到待触发池');
          triggerRefresh();
        },
      });
    },
    [triggerRefresh],
  );
}
