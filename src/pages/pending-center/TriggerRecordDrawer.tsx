import React from 'react';
import { Button, Drawer, Space } from 'antd';
import { StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { PendingTriggerRecord } from './types';
import TriggerDetailPanel from './TriggerDetailPanel';

export interface TriggerRecordDrawerProps {
  open: boolean;
  detail: PendingTriggerRecord | null;
  showActions: boolean;
  canTriggerHealing: boolean;
  onClose: () => void;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
}

export default function TriggerRecordDrawer({
  open,
  detail,
  showActions,
  canTriggerHealing,
  onClose,
  onTrigger,
  onDismiss,
}: TriggerRecordDrawerProps) {
  return (
    <Drawer
      title="工单详情"
      open={open}
      onClose={onClose}
      size={600}
      extra={detail && showActions ? (
        <Space>
          <Button type="primary" icon={<ThunderboltOutlined />} disabled={!canTriggerHealing} onClick={() => { onClose(); onTrigger(detail); }}>
            启动自愈
          </Button>
          <Button danger icon={<StopOutlined />} disabled={!canTriggerHealing} onClick={() => { onClose(); onDismiss(detail); }}>
            忽略
          </Button>
        </Space>
      ) : undefined}
    >
      {detail ? <TriggerDetailPanel detail={detail} /> : null}
    </Drawer>
  );
}
