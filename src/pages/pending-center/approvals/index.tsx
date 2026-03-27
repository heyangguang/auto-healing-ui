import React, { useCallback, useState } from 'react';
import { useAccess } from '@umijs/max';
import type { PendingApprovalRecord } from '../types';
import PendingApprovalTable from '../PendingApprovalTable';
import PendingApprovalDrawer from '../PendingApprovalDrawer';
import { resolveApprovalApprovers } from '../shared';
import usePendingCenterUsers from '../usePendingCenterUsers';
import useRefreshTrigger from '../useRefreshTrigger';
import usePendingTaskActions from '../usePendingTaskActions';

export default function PendingApprovals() {
  const access = useAccess();
  const { refreshTrigger: refreshKey, triggerRefresh } = useRefreshTrigger();
  const userMap = usePendingCenterUsers();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<PendingApprovalRecord | null>(null);
  const { handleApprove, handleReject } = usePendingTaskActions(triggerRefresh);

  const resolvedApprovers = useCallback((record: PendingApprovalRecord) => (
    resolveApprovalApprovers(record, userMap)
  ), [userMap]);

  const openDetail = useCallback((record: PendingApprovalRecord) => {
    setDetail(record);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDetail(null);
  }, []);

  return (
    <>
      <PendingApprovalTable
        tableKey={`approvals-${refreshKey}`}
        title="待审批任务"
        description="查看待审批任务，执行批准或拒绝操作。"
        canApprove={access.canApprove}
        resolveApprovers={resolvedApprovers}
        onApprove={handleApprove}
        onReject={handleReject}
        onRowClick={openDetail}
        preferenceKey="pending_approvals_only"
      />

      <PendingApprovalDrawer
        open={drawerOpen}
        detail={detail}
        canApprove={access.canApprove}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={handleReject}
        resolveApprovers={resolvedApprovers}
      />
    </>
  );
}
