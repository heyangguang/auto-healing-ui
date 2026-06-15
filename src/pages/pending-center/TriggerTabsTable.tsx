import React from 'react';
import StandardTable, {
  type StandardColumnDef,
} from '@/components/StandardTable';
import {
  getPendingTriggers,
  getTriggerRecords,
} from '@/services/auto-healing/healing';
import {
  buildTriggerApiParams,
  createPendingTriggerColumns,
  createTriggerRecordColumns,
  type TriggerTableRequestParams,
  triggerAdvancedSearchFields,
  triggerHeaderIcon,
  triggerSearchFields,
} from './triggerShared';
import type { PendingTriggerRecord } from './types';
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

function buildTriggerRequest(
  loader: typeof getPendingTriggers | typeof getTriggerRecords,
) {
  return async (params: TriggerTableRequestParams) => {
    const response = await loader(buildTriggerApiParams(params));
    return { data: response.data || [], total: Number(response.total ?? 0) };
  };
}

function getTriggerTableMeta(isPending: boolean) {
  return {
    title: isPending ? '自愈触发' : '触发记录',
    description: isPending
      ? '查看待人工确认触发的自愈工单，确认后启动自愈流程。'
      : '查看已确认触发或已忽略的工单处理记录。',
    preferenceKey: isPending
      ? 'pending_triggers_compact'
      : 'trigger_records_compact',
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
  const pendingColumns: StandardColumnDef<PendingTriggerRecord>[] =
    createPendingTriggerColumns({
      canTriggerHealing,
      onTrigger,
      onDismiss,
      onResetScan,
    });
  const recordColumns: StandardColumnDef<PendingTriggerRecord>[] =
    createTriggerRecordColumns({
      canTriggerHealing,
      onTrigger,
      onDismiss,
      onResetScan,
    });

  return (
    <StandardTable<PendingTriggerRecord>
      key={`triggers-${activeTab}-${refreshCount}`}
      tabs={[
        { key: 'pending', label: '待触发工单' },
        { key: 'records', label: '触发记录' },
      ]}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title={tableMeta.title}
      description={tableMeta.description}
      headerIcon={triggerHeaderIcon}
      searchFields={triggerSearchFields}
      advancedSearchFields={triggerAdvancedSearchFields}
      columns={isPending ? pendingColumns : recordColumns}
      rowKey="id"
      onRowClick={onRowClick}
      request={
        isPending
          ? buildTriggerRequest(getPendingTriggers)
          : buildTriggerRequest(getTriggerRecords)
      }
      defaultPageSize={10}
      preferenceKey={tableMeta.preferenceKey}
    />
  );
}
