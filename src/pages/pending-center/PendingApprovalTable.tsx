import React, { useCallback, useMemo } from 'react';
import StandardTable, { type AdvancedSearchField } from '@/components/StandardTable';
import { getPendingApprovals } from '@/services/auto-healing/healing';
import type { PendingApprovalRecord } from './types';
import { createPendingApprovalColumns } from './approvalTableColumns';
import {
  approvalSearchFields,
  buildPendingApprovalParams,
  pendingCenterHeaderIcon,
  type ApprovalTableRequestParams,
} from './shared';

const approvalAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export interface PendingApprovalTableProps {
  tableKey?: string;
  tabs?: { key: string; label: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  title: string;
  description: string;
  canApprove: boolean;
  resolveApprovers: (record: PendingApprovalRecord) => string;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  onRowClick: (record: PendingApprovalRecord) => void;
  preferenceKey: string;
  refreshTrigger?: number;
}

export default function PendingApprovalTable({
  tableKey,
  tabs,
  activeTab,
  onTabChange,
  title,
  description,
  canApprove,
  resolveApprovers,
  onApprove,
  onReject,
  onRowClick,
  preferenceKey,
  refreshTrigger,
}: PendingApprovalTableProps) {
  const columns = useMemo(
    () => createPendingApprovalColumns({ canApprove, resolveApprovers, onApprove, onReject }),
    [canApprove, onApprove, onReject, resolveApprovers],
  );

  const handleRequest = useCallback(async (params: ApprovalTableRequestParams) => {
    const response = await getPendingApprovals(buildPendingApprovalParams(params));
    return {
      data: response.data || [],
      total: Number(response.total ?? 0),
    };
  }, []);

  return (
    <StandardTable<PendingApprovalRecord>
      key={tableKey}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title={title}
      description={description}
      headerIcon={pendingCenterHeaderIcon}
      searchFields={approvalSearchFields}
      advancedSearchFields={approvalAdvancedSearchFields}
      columns={columns}
      rowKey="id"
      onRowClick={onRowClick}
      request={handleRequest}
      defaultPageSize={10}
      preferenceKey={preferenceKey}
      refreshTrigger={refreshTrigger}
    />
  );
}
