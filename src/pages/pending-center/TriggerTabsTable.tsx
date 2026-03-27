import React from 'react';
import StandardTable, { type StandardColumnDef } from '@/components/StandardTable';
import { getDismissedTriggers, getPendingTriggers } from '@/services/auto-healing/healing';
import type { PendingTriggerRecord } from './types';
import {
  buildTriggerApiParams,
  createDismissedTriggerColumns,
  createPendingTriggerColumns,
  triggerAdvancedSearchFields,
  triggerHeaderIcon,
  triggerSearchFields,
  type TriggerTableRequestParams,
} from './triggerShared';
import type { TriggerPageTab } from './useTriggerPageViewState';

export interface TriggerTabsTableProps {
  activeTab: TriggerPageTab;
  refreshCount: number;
  canTriggerHealing: boolean;
  onTabChange: (key: string) => void;
  onRowClick: (record: PendingTriggerRecord) => void;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
  onResetScan: (record: PendingTriggerRecord) => void;
}

function buildTriggerRequest(loader: typeof getPendingTriggers | typeof getDismissedTriggers) {
  return async (params: TriggerTableRequestParams) => {
    const response = await loader(buildTriggerApiParams(params));
    return { data: response.data || [], total: Number(response.total ?? 0) };
  };
}

function getTriggerTableMeta(isPending: boolean) {
  return {
    title: isPending ? '自愈审批' : '已忽略工单',
    description: isPending
      ? '查看待触发的自愈工单，确认后启动自愈流程。'
      : '已忽略的自愈工单记录，这些工单不会执行自愈流程。',
    preferenceKey: isPending ? 'pending_triggers' : 'dismissed_triggers',
  };
}

export default function TriggerTabsTable({
  activeTab,
  refreshCount,
  canTriggerHealing,
  onTabChange,
  onRowClick,
  onTrigger,
  onDismiss,
  onResetScan,
}: TriggerTabsTableProps) {
  const isPending = activeTab === 'pending';
  const tableMeta = getTriggerTableMeta(isPending);
  const pendingColumns: StandardColumnDef<PendingTriggerRecord>[] = createPendingTriggerColumns({
    canTriggerHealing,
    onTrigger,
    onDismiss,
    onResetScan,
  });
  const dismissedColumns: StandardColumnDef<PendingTriggerRecord>[] = createDismissedTriggerColumns({
    canTriggerHealing,
    onTrigger,
    onDismiss,
    onResetScan,
  });

  return (
    <StandardTable<PendingTriggerRecord>
      key={`triggers-${activeTab}-${refreshCount}`}
      tabs={[
        { key: 'pending', label: '待处理' },
        { key: 'dismissed', label: '已忽略' },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title={tableMeta.title}
      description={tableMeta.description}
      headerIcon={triggerHeaderIcon}
      searchFields={triggerSearchFields}
      advancedSearchFields={triggerAdvancedSearchFields}
      columns={isPending ? pendingColumns : dismissedColumns}
      rowKey="id"
      onRowClick={onRowClick}
      request={isPending ? buildTriggerRequest(getPendingTriggers) : buildTriggerRequest(getDismissedTriggers)}
      defaultPageSize={10}
      preferenceKey={tableMeta.preferenceKey}
    />
  );
}
