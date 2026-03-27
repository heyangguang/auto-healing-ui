import React from 'react';
import type { PendingApprovalRecord, PendingTriggerRecord } from './types';
import PendingApprovalDrawer from './PendingApprovalDrawer';
import PendingCenterTriggerDrawer from './PendingCenterTriggerDrawer';
import type { PendingCenterTab } from './usePendingCenterViewState';

export interface PendingCenterDrawersProps {
  activeTab: PendingCenterTab;
  open: boolean;
  detail: PendingApprovalRecord | PendingTriggerRecord | null;
  canApprove: boolean;
  canTriggerHealing: boolean;
  onClose: () => void;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
  resolveApprovers: (record: PendingApprovalRecord) => string;
}

export default function PendingCenterDrawers({
  activeTab,
  open,
  detail,
  canApprove,
  canTriggerHealing,
  onClose,
  onApprove,
  onReject,
  onTrigger,
  onDismiss,
  resolveApprovers,
}: PendingCenterDrawersProps) {
  if (activeTab === 'triggers') {
    return (
      <PendingCenterTriggerDrawer
        open={open}
        detail={detail as PendingTriggerRecord | null}
        canTriggerHealing={canTriggerHealing}
        onClose={onClose}
        onTrigger={onTrigger}
        onDismiss={onDismiss}
      />
    );
  }

  return (
    <PendingApprovalDrawer
      open={open}
      detail={detail as PendingApprovalRecord | null}
      canApprove={canApprove}
      onClose={onClose}
      onApprove={onApprove}
      onReject={onReject}
      resolveApprovers={resolveApprovers}
    />
  );
}
