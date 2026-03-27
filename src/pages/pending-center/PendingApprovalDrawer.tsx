import React from 'react';
import { Button, Drawer, Space } from 'antd';
import type { PendingApprovalRecord } from './types';
import { PendingApprovalDetailPanel } from './PendingCenterDetailPanels';

export interface PendingApprovalDrawerProps {
  open: boolean;
  detail: PendingApprovalRecord | null;
  canApprove: boolean;
  onClose: () => void;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  resolveApprovers: (record: PendingApprovalRecord) => string;
}

export default function PendingApprovalDrawer({
  open,
  detail,
  canApprove,
  onClose,
  onApprove,
  onReject,
  resolveApprovers,
}: PendingApprovalDrawerProps) {
  return (
    <Drawer
      title="审批任务详情"
      open={open}
      onClose={onClose}
      size={600}
      extra={detail ? (
        <Space>
          <Button type="primary" disabled={!canApprove} onClick={() => { onClose(); onApprove(detail); }}>
            批准
          </Button>
          <Button danger disabled={!canApprove} onClick={() => { onClose(); onReject(detail); }}>
            拒绝
          </Button>
        </Space>
      ) : undefined}
    >
      {detail ? <PendingApprovalDetailPanel detail={detail} resolveApprovers={resolveApprovers} /> : null}
    </Drawer>
  );
}
