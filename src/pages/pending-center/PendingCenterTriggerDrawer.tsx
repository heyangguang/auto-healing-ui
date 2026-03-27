import React from 'react';
import { Button, Drawer, Space } from 'antd';
import { StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { PendingTriggerRecord } from './types';
import { PendingTriggerDetailPanel } from './PendingCenterDetailPanels';

export interface PendingCenterTriggerDrawerProps {
  open: boolean;
  detail: PendingTriggerRecord | null;
  canTriggerHealing: boolean;
  onClose: () => void;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
}

export default function PendingCenterTriggerDrawer({
  open,
  detail,
  canTriggerHealing,
  onClose,
  onTrigger,
  onDismiss,
}: PendingCenterTriggerDrawerProps) {
  return (
    <Drawer
      title="工单详情"
      open={open}
      onClose={onClose}
      size={600}
      extra={detail ? (
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
      {detail ? <PendingTriggerDetailPanel detail={detail} /> : null}
    </Drawer>
  );
}
