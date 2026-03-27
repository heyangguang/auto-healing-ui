import React, { useMemo } from 'react';
import StandardTable from '@/components/StandardTable';
import {
  getBlacklistExemptions,
  getPendingExemptions,
  type ExemptionRecord,
} from '@/services/auto-healing/blacklistExemption';
import { createExemptionHistoryColumns, createPendingExemptionColumns, ExemptionStatsBar } from './ExemptionColumns';
import {
  buildExemptionHistoryApiParams,
  exemptionAdvancedSearchFields,
  exemptionHeaderIcon,
  exemptionSearchFields,
  type ExemptionHistoryRequestParams,
} from './exemptionApprovalShared';

export interface ExemptionApprovalsTableProps {
  activeTab: 'pending' | 'history';
  canApproveExemption: boolean;
  actionLoading: string | null;
  refreshTrigger: number;
  statsData: { total: number | null; pending: number | null };
  statsError: string | null;
  onTabChange: (key: string) => void;
  onRowClick: (record: ExemptionRecord) => void;
  onApprove: (record: ExemptionRecord) => void;
  onReject: (record: ExemptionRecord) => void;
}

function buildExemptionRequest(
  loader: typeof getPendingExemptions | typeof getBlacklistExemptions,
) {
  return async (params: ExemptionHistoryRequestParams) => {
    const response = await loader(buildExemptionHistoryApiParams(params));
    const items = response.data || [];
    return { data: items, total: Number(response.total ?? items.length) };
  };
}

export default function ExemptionApprovalsTable({
  activeTab,
  canApproveExemption,
  actionLoading,
  refreshTrigger,
  statsData,
  statsError,
  onTabChange,
  onRowClick,
  onApprove,
  onReject,
}: ExemptionApprovalsTableProps) {
  const pendingColumns = useMemo(() => createPendingExemptionColumns({
    actionLoading,
    canApproveExemption,
    onApprove,
    onReject,
  }), [actionLoading, canApproveExemption, onApprove, onReject]);
  const historyColumns = useMemo(() => createExemptionHistoryColumns(), []);

  return (
    <StandardTable<ExemptionRecord>
      key={activeTab}
      tabs={[
        { key: 'pending', label: '豁免审批' },
        { key: 'history', label: '审批记录' },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title="豁免审批"
      description="审批安全豁免申请。批准后对应任务模板执行时将跳过已豁免的高危指令规则。"
      headerIcon={exemptionHeaderIcon}
      headerExtra={<ExemptionStatsBar {...statsData} errorMessage={statsError} />}
      searchFields={exemptionSearchFields}
      advancedSearchFields={exemptionAdvancedSearchFields}
      columns={activeTab === 'history' ? historyColumns : pendingColumns}
      rowKey="id"
      onRowClick={onRowClick}
      request={activeTab === 'history' ? buildExemptionRequest(getBlacklistExemptions) : buildExemptionRequest(getPendingExemptions)}
      defaultPageSize={20}
      preferenceKey={`security_exemption_${activeTab}`}
      refreshTrigger={refreshTrigger}
    />
  );
}
