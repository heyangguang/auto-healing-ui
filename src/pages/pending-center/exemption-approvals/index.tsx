import React from 'react';
import { useAccess } from '@umijs/max';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import ExemptionApprovalsTable from '../ExemptionApprovalsTable';
import ExemptionApprovalDrawer from '../ExemptionApprovalDrawer';
import ExemptionRejectModal from '../ExemptionRejectModal';
export { buildExemptionHistoryApiParams } from '../exemptionApprovalShared';
import useExemptionApprovalActions from '../useExemptionApprovalActions';
import useExemptionApprovalStats from '../useExemptionApprovalStats';
import useRefreshTrigger from '../useRefreshTrigger';
import useTabbedDetailState from '../useTabbedDetailState';

type ExemptionTab = 'pending' | 'history';

export default function ExemptionApprovalsPage() {
  const access = useAccess();
  const { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange } = useTabbedDetailState<ExemptionRecord, ExemptionTab>('pending');
  const { refreshTrigger, triggerRefresh } = useRefreshTrigger();
  const { statsData, statsError } = useExemptionApprovalStats(refreshTrigger);
  const { actionLoading, handleApprove, handleReject, rejectState } = useExemptionApprovalActions(triggerRefresh, closeDrawer);

  return (
    <>
      <ExemptionApprovalsTable
        activeTab={activeTab}
        canApproveExemption={access.canApproveExemption}
        actionLoading={actionLoading}
        refreshTrigger={refreshTrigger}
        statsData={statsData}
        statsError={statsError}
        onTabChange={handleTabChange}
        onRowClick={openDetail}
        onApprove={handleApprove}
        onReject={rejectState.openReject}
      />
      <ExemptionApprovalDrawer
        open={drawerOpen}
        detail={detail}
        canApproveExemption={access.canApproveExemption}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={rejectState.openReject}
      />
      <ExemptionRejectModal
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
