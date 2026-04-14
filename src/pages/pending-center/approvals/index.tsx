import React, { useCallback } from 'react';
import { useAccess } from '@umijs/max';
import type { PendingApprovalRecord } from '../types';
import PendingApprovalDrawer from '../PendingApprovalDrawer';
import { resolveApprovalApprovers } from '../shared';
import { resolveApprovalActor } from '../taskApprovalShared';
import TaskApprovalTable from '../TaskApprovalTable';
import usePendingCenterUsers from '../usePendingCenterUsers';
import useRefreshTrigger from '../useRefreshTrigger';
import usePendingTaskActions from '../usePendingTaskActions';
import useTabbedDetailState from '../useTabbedDetailState';

type ApprovalTab = 'pending' | 'history';

export default function PendingApprovals() {
  const access = useAccess();
  const userMap = usePendingCenterUsers();
  const { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange } = useTabbedDetailState<PendingApprovalRecord, ApprovalTab>('pending');
  const { refreshTrigger, triggerRefresh } = useRefreshTrigger();
  const { handleApprove, handleReject } = usePendingTaskActions(triggerRefresh);
  const resolvedApprovers = useCallback((record: PendingApprovalRecord) => (
    resolveApprovalApprovers(record, userMap)
  ), [userMap]);
  const resolvedActor = useCallback((actorId?: string | null) => (
    resolveApprovalActor(actorId, userMap)
  ), [userMap]);

  return (
    <>
      <TaskApprovalTable
        activeTab={activeTab}
        canApprove={access.canApprove}
        onTabChange={handleTabChange}
        refreshTrigger={refreshTrigger}
        resolveActor={resolvedActor}
        resolveApprovers={resolvedApprovers}
        onApprove={handleApprove}
        onReject={handleReject}
        onRowClick={openDetail}
      />

      <PendingApprovalDrawer
        open={drawerOpen}
        detail={detail}
        canApprove={access.canApprove}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={handleReject}
        resolveActor={resolvedActor}
        resolveApprovers={resolvedApprovers}
      />
    </>
  );
}
