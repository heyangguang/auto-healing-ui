import React, { useMemo } from 'react';
import { SafetyOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import {
  listMyImpersonationRequests,
  type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import { buildImpersonationListParams, type ImpersonationTableRequestParams } from '@/pages/pending-center/impersonationShared';
import {
  createPlatformImpersonationColumns,
  platformImpersonationAdvancedSearchFields,
  platformImpersonationHeaderIcon,
  platformImpersonationSearchFields,
  PlatformImpersonationStatsBar,
} from './pageShared';

export interface ImpersonationRequestsTableProps {
  actionLoading: string | null;
  refreshTrigger: number;
  statsData: { total: number | null; pending: number | null; active: number | null };
  statsError: string | null;
  onEnter: (record: ImpersonationRequest) => void;
  onExit: (record: ImpersonationRequest) => void;
  onTerminate: (record: ImpersonationRequest) => void;
  onCancel: (record: ImpersonationRequest) => void;
  onPrimaryAction: () => void;
}

export default function ImpersonationRequestsTable({
  actionLoading,
  refreshTrigger,
  statsData,
  statsError,
  onEnter,
  onExit,
  onTerminate,
  onCancel,
  onPrimaryAction,
}: ImpersonationRequestsTableProps) {
  const columns = useMemo(() => createPlatformImpersonationColumns({
    actionLoading,
    onEnter,
    onExit,
    onTerminate,
    onCancel,
  }), [actionLoading, onCancel, onEnter, onExit, onTerminate]);
  const handleRequest = async (params: ImpersonationTableRequestParams) => {
    const response = await listMyImpersonationRequests(buildImpersonationListParams(params));
    return { data: response.data || [], total: Number(response.total ?? 0) };
  };

  return (
    <StandardTable<ImpersonationRequest>
      tabs={[{ key: 'list', label: '我的申请' }]}
      title="租户访问管理"
      description="通过 Impersonation 审批机制安全访问租户数据。所有操作均被审计记录。"
      headerIcon={platformImpersonationHeaderIcon}
      headerExtra={<PlatformImpersonationStatsBar {...statsData} errorMessage={statsError} />}
      searchFields={platformImpersonationSearchFields}
      advancedSearchFields={platformImpersonationAdvancedSearchFields}
      columns={columns}
      rowKey="id"
      request={handleRequest}
      defaultPageSize={20}
      preferenceKey="platform_impersonation"
      refreshTrigger={refreshTrigger}
      primaryActionLabel="申请访问"
      primaryActionIcon={<SafetyOutlined />}
      onPrimaryAction={onPrimaryAction}
    />
  );
}
