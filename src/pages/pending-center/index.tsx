import React, { useCallback } from 'react';
import { useAccess } from '@umijs/max';
import type { PendingApprovalRecord } from './types';
import PendingCenterContent from './PendingCenterContent';
import PendingCenterDrawers from './PendingCenterDrawers';
import { resolveApprovalApprovers } from './shared';
import usePendingCenterUsers from './usePendingCenterUsers';
import usePendingCenterViewState from './usePendingCenterViewState';
import useRefreshTrigger from './useRefreshTrigger';
import usePendingTaskActions from './usePendingTaskActions';
import usePendingTriggerActions from './usePendingTriggerActions';

export default function PendingCenter() {
  const access = useAccess();
  const userMap = usePendingCenterUsers();
  const { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange } = usePendingCenterViewState();
  const { refreshTrigger: refreshKey, triggerRefresh } = useRefreshTrigger();
  const { handleApprove, handleReject } = usePendingTaskActions(triggerRefresh);
  const { handleTrigger, handleDismiss } = usePendingTriggerActions(triggerRefresh);
  const resolvedApprovers = useCallback((record: PendingApprovalRecord) => resolveApprovalApprovers(record, userMap), [userMap]);

  return (
    <>
      <PendingCenterContent
        activeTab={activeTab}
        refreshKey={refreshKey}
        canApprove={access.canApprove}
        canTriggerHealing={access.canTriggerHealing}
        resolveApprovers={resolvedApprovers}
        onTabChange={handleTabChange}
        onApprove={handleApprove}
        onReject={handleReject}
        onTrigger={handleTrigger}
        onDismiss={handleDismiss}
        onRowClick={openDetail}
      />
      <PendingCenterDrawers
        activeTab={activeTab}
        open={drawerOpen}
        detail={detail}
        canApprove={access.canApprove}
        canTriggerHealing={access.canTriggerHealing}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={handleReject}
        onTrigger={handleTrigger}
        onDismiss={handleDismiss}
        resolveApprovers={resolvedApprovers}
      />
    </>
  );
}
