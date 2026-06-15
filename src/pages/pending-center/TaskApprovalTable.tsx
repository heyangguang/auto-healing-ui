import React, { useCallback, useMemo } from 'react';
import type { AdvancedSearchField } from '@/components/StandardTable';
import StandardTable from '@/components/StandardTable';
import {
  getApprovalHistory,
  getPendingApprovals,
} from '@/services/auto-healing/healing';
import type { ApprovalActorResolver } from './approvalTableColumns';
import {
  createApprovalHistoryColumns,
  createPendingApprovalColumns,
} from './approvalTableColumns';
import {
  type ApprovalTableRequestParams,
  approvalSearchFields,
  buildPendingApprovalParams,
  pendingCenterHeaderIcon,
} from './shared';
import {
  approvalHistorySearchFields,
  buildApprovalHistoryParams,
} from './taskApprovalShared';
import type { PendingApprovalRecord } from './types';

const pendingAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

type TaskApprovalTab = 'pending' | 'history';

export interface TaskApprovalTableProps {
  activeTab: TaskApprovalTab;
  canApprove: boolean;
  refreshTrigger: number;
  resolveActor: ApprovalActorResolver;
  resolveApprovers: (record: PendingApprovalRecord) => string;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  onRowClick: (record: PendingApprovalRecord) => void;
  onTabChange: (key: string) => void;
}

export default function TaskApprovalTable({
  activeTab,
  canApprove,
  refreshTrigger,
  resolveActor,
  resolveApprovers,
  onApprove,
  onReject,
  onRowClick,
  onTabChange,
}: TaskApprovalTableProps) {
  const pendingColumns = useMemo(
    () =>
      createPendingApprovalColumns({
        canApprove,
        resolveApprovers,
        onApprove,
        onReject,
      }),
    [canApprove, onApprove, onReject, resolveApprovers],
  );
  const historyColumns = useMemo(
    () => createApprovalHistoryColumns(resolveActor),
    [resolveActor],
  );
  const handlePendingRequest = useCallback(
    async (params: ApprovalTableRequestParams) => {
      const response = await getPendingApprovals(
        buildPendingApprovalParams(params),
      );
      return { data: response.data || [], total: Number(response.total ?? 0) };
    },
    [],
  );
  const handleHistoryRequest = useCallback(
    async (params: ApprovalTableRequestParams) => {
      const response = await getApprovalHistory(
        buildApprovalHistoryParams(params),
      );
      return { data: response.data || [], total: Number(response.total ?? 0) };
    },
    [],
  );

  return (
    <StandardTable<PendingApprovalRecord>
      key={activeTab}
      tabs={[
        { key: 'pending', label: '待审批任务' },
        { key: 'history', label: '审批记录' },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title="自愈审批"
      description="查看自愈流程的待审批任务与已处理审批记录，支持直接批准或拒绝操作。"
      headerIcon={pendingCenterHeaderIcon}
      searchFields={
        activeTab === 'history'
          ? approvalHistorySearchFields
          : approvalSearchFields
      }
      advancedSearchFields={
        activeTab === 'history' ? [] : pendingAdvancedSearchFields
      }
      columns={activeTab === 'history' ? historyColumns : pendingColumns}
      rowKey="id"
      onRowClick={onRowClick}
      request={
        activeTab === 'history' ? handleHistoryRequest : handlePendingRequest
      }
      defaultPageSize={20}
      preferenceKey={`task_approvals_${activeTab}`}
      refreshTrigger={refreshTrigger}
    />
  );
}
