import React, { useMemo } from 'react';
import StandardTable from '@/components/StandardTable';
import {
  listImpersonationHistory,
  listPendingImpersonation,
  type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import type { ImpersonationTableRequestParams } from './impersonationShared';
import { applyImpersonationTableRequest, buildImpersonationListParams } from './impersonationShared';
import {
  createImpersonationHistoryColumns,
  createImpersonationPendingColumns,
  impersonationApprovalAdvancedSearchFields,
  impersonationApprovalHeaderIcon,
  impersonationApprovalSearchFields,
  ImpersonationApprovalStatsBar,
} from './impersonationApprovalsShared';

export interface ImpersonationApprovalsTableProps {
  activeTab: 'pending' | 'history';
  actionLoading: string | null;
  canApproveImpersonation: boolean;
  refreshTrigger: number;
  statsData: { total: number | null; pending: number | null };
  statsError: string | null;
  onTabChange: (key: string) => void;
  onRowClick: (record: ImpersonationRequest) => void;
  onApprove: (record: ImpersonationRequest) => void;
  onReject: (record: ImpersonationRequest) => void;
}

async function handlePendingRequest(params: ImpersonationTableRequestParams) {
  const items = await listPendingImpersonation();
  return applyImpersonationTableRequest(items, params);
}

async function handleHistoryRequest(params: ImpersonationTableRequestParams) {
  const response = await listImpersonationHistory(buildImpersonationListParams(params));
  return { data: response.data || [], total: Number(response.total ?? 0) };
}

export default function ImpersonationApprovalsTable({
  activeTab,
  actionLoading,
  canApproveImpersonation,
  refreshTrigger,
  statsData,
  statsError,
  onTabChange,
  onRowClick,
  onApprove,
  onReject,
}: ImpersonationApprovalsTableProps) {
  const pendingColumns = useMemo(() => createImpersonationPendingColumns({
    actionLoading,
    canApproveImpersonation,
    onApprove,
    onReject,
  }), [actionLoading, canApproveImpersonation, onApprove, onReject]);
  const historyColumns = useMemo(() => createImpersonationHistoryColumns(), []);

  return (
    <StandardTable<ImpersonationRequest>
      key={activeTab}
      tabs={[
        { key: 'pending', label: '访问审批' },
        { key: 'history', label: '审批记录' },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title="访问审批"
      description="审批来自平台管理员的租户访问（Impersonation）请求。批准后管理员可在有限时间内以审计模式查看租户数据。"
      headerIcon={impersonationApprovalHeaderIcon}
      headerExtra={<ImpersonationApprovalStatsBar {...statsData} errorMessage={statsError} />}
      searchFields={impersonationApprovalSearchFields}
      advancedSearchFields={impersonationApprovalAdvancedSearchFields}
      columns={activeTab === 'history' ? historyColumns : pendingColumns}
      rowKey="id"
      onRowClick={onRowClick}
      request={activeTab === 'history' ? handleHistoryRequest : handlePendingRequest}
      defaultPageSize={20}
      preferenceKey={`system_impersonation_${activeTab}`}
      refreshTrigger={refreshTrigger}
    />
  );
}
