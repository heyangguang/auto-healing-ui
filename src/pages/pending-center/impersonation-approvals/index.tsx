import React from 'react';
import { useAccess } from '@umijs/max';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import ImpersonationApprovalDrawer from '../ImpersonationApprovalDrawer';
import ImpersonationApprovalsTable from '../ImpersonationApprovalsTable';
import ImpersonationRejectModal from '../ImpersonationRejectModal';
import useImpersonationApprovalActions from '../useImpersonationApprovalActions';
import useImpersonationApprovalStats from '../useImpersonationApprovalStats';
import useRefreshTrigger from '../useRefreshTrigger';
import useTabbedDetailState from '../useTabbedDetailState';

type ApprovalTab = 'pending' | 'history';

export default function ImpersonationApprovalsPage() {
  const access = useAccess();
  const { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange } = useTabbedDetailState<ImpersonationRequest, ApprovalTab>('pending');
  const { refreshTrigger, triggerRefresh } = useRefreshTrigger();
  const { statsData, statsError } = useImpersonationApprovalStats(refreshTrigger);
  const { actionLoading, handleApprove, handleReject, rejectState } = useImpersonationApprovalActions(triggerRefresh, closeDrawer);

  return (
    <>
      <ImpersonationApprovalsTable
        activeTab={activeTab}
        actionLoading={actionLoading}
        canApproveImpersonation={access.canApproveImpersonation}
        refreshTrigger={refreshTrigger}
        statsData={statsData}
        statsError={statsError}
        onTabChange={handleTabChange}
        onRowClick={openDetail}
        onApprove={handleApprove}
        onReject={rejectState.openReject}
      />
      <ImpersonationApprovalDrawer
        open={drawerOpen}
        detail={detail}
        canApproveImpersonation={access.canApproveImpersonation}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={rejectState.openReject}
      />
      <ImpersonationRejectModal
        open={rejectState.rejectModalOpen}
        target={rejectState.rejectTarget}
        reason={rejectState.rejectReason}
        confirmLoading={actionLoading === rejectState.rejectTarget?.id}
        onCancel={rejectState.closeRejectModal}
        onChangeReason={rejectState.setRejectReason}
        onConfirm={handleReject}
      />
    </>
  );
}
