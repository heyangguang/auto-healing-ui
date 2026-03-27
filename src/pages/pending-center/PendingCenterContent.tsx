import React from 'react';
import type { PendingApprovalRecord, PendingTriggerRecord } from './types';
import PendingApprovalTable from './PendingApprovalTable';
import PendingTriggerTable from './PendingTriggerTable';
import { PENDING_CENTER_TABS } from './shared';
import type { PendingCenterTab } from './usePendingCenterViewState';

export interface PendingCenterContentProps {
  activeTab: PendingCenterTab;
  refreshKey: number;
  canApprove: boolean;
  canTriggerHealing: boolean;
  resolveApprovers: (record: PendingApprovalRecord) => string;
  onTabChange: (key: string) => void;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
  onRowClick: (record: PendingTriggerRecord | PendingApprovalRecord) => void;
}

export default function PendingCenterContent({
  activeTab,
  refreshKey,
  canApprove,
  canTriggerHealing,
  resolveApprovers,
  onTabChange,
  onApprove,
  onReject,
  onTrigger,
  onDismiss,
  onRowClick,
}: PendingCenterContentProps) {
  if (activeTab === 'triggers') {
    return (
      <PendingTriggerTable
        tableKey={`${activeTab}-${refreshKey}`}
        tabs={PENDING_CENTER_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
        canTriggerHealing={canTriggerHealing}
        onTrigger={onTrigger}
        onDismiss={onDismiss}
        onRowClick={onRowClick as (record: PendingTriggerRecord) => void}
      />
    );
  }

  return (
    <PendingApprovalTable
      tableKey={`${activeTab}-${refreshKey}`}
      tabs={PENDING_CENTER_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title="待办中心"
      description="查看待审批的任务，执行批准或拒绝操作。"
      canApprove={canApprove}
      resolveApprovers={resolveApprovers}
      onApprove={onApprove}
      onReject={onReject}
      onRowClick={onRowClick as (record: PendingApprovalRecord) => void}
      preferenceKey="pending_approvals"
    />
  );
}
