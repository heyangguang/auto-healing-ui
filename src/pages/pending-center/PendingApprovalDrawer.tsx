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
  resolveActor?: (actorId?: string | null) => string;
  resolveApprovers: (record: PendingApprovalRecord) => string;
}

export default function PendingApprovalDrawer({
  open,
  detail,
  canApprove,
  onClose,
  onApprove,
  onReject,
  resolveActor,
  resolveApprovers,
}: PendingApprovalDrawerProps) {
  const actionableDetail = detail && detail.status === 'pending' ? detail : null;

  return (
    <Drawer
      title="审批任务详情"
      open={open}
      onClose={onClose}
      size={600}
      extra={actionableDetail ? (
        <Space>
          <Button type="primary" disabled={!canApprove} onClick={() => { onClose(); onApprove(actionableDetail); }}>
            批准
          </Button>
          <Button danger disabled={!canApprove} onClick={() => { onClose(); onReject(actionableDetail); }}>
            拒绝
          </Button>
        </Space>
      ) : undefined}
    >
      {detail ? <PendingApprovalDetailPanel detail={detail} resolveActor={resolveActor} resolveApprovers={resolveApprovers} /> : null}
    </Drawer>
  );
}
