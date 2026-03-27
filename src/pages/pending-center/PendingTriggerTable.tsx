import React, { useCallback, useMemo } from 'react';
import { Button, Space } from 'antd';
import { StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import StandardTable, { type StandardColumnDef } from '@/components/StandardTable';
import { getPendingTriggers } from '@/services/auto-healing/healing';
import type { PendingTriggerRecord } from './types';
import {
  buildPendingTriggerParams,
  formatPendingCenterTime,
  getSeverityTag,
  pendingCenterHeaderIcon,
  triggerSearchFields,
  type TriggerTableRequestParams,
} from './shared';

export interface PendingTriggerTableProps {
  tableKey: string;
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  canTriggerHealing: boolean;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
  onRowClick: (record: PendingTriggerRecord) => void;
}

const triggerDescription = '查看待触发的自愈工单，确认后启动自愈流程。';

function createTitleColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'title',
    columnTitle: '工单标题',
    dataIndex: 'title',
    ellipsis: true,
    fixedColumn: true,
  };
}

function createExternalIdColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'external_id',
    columnTitle: '工单ID',
    dataIndex: 'external_id',
    width: 200,
  };
}

function createSeverityColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'severity',
    columnTitle: '等级',
    dataIndex: 'severity',
    width: 100,
    render: (_, record) => getSeverityTag(record.severity),
    headerFilters: [
      { label: '严重', value: 'critical' },
      { label: '高', value: 'high' },
      { label: '中', value: 'medium' },
      { label: '低', value: 'low' },
    ],
  };
}

function createAffectedCiColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'affected_ci',
    columnTitle: '影响CI',
    dataIndex: 'affected_ci',
    width: 150,
    ellipsis: true,
  };
}

function createAffectedServiceColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'affected_service',
    columnTitle: '影响服务',
    dataIndex: 'affected_service',
    width: 150,
    ellipsis: true,
  };
}

function createCreatedAtColumn(): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'created_at',
    columnTitle: '创建时间',
    dataIndex: 'created_at',
    width: 180,
    sorter: true,
    render: (_, record) => formatPendingCenterTime(record.created_at),
  };
}

function createActionColumn(
  canTriggerHealing: boolean,
  onTrigger: (record: PendingTriggerRecord) => void,
  onDismiss: (record: PendingTriggerRecord) => void,
): StandardColumnDef<PendingTriggerRecord> {
  return {
    columnKey: 'actions',
    columnTitle: '操作',
    width: 150,
    fixedColumn: true,
    fixed: 'right',
    render: (_, record) => (
      <Space size={4}>
        <Button type="primary" size="small" icon={<ThunderboltOutlined />} disabled={!canTriggerHealing} onClick={() => onTrigger(record)}>
          启动
        </Button>
        <Button danger size="small" icon={<StopOutlined />} disabled={!canTriggerHealing} onClick={() => onDismiss(record)}>
          忽略
        </Button>
      </Space>
    ),
  };
}

function createPendingTriggerColumns(
  canTriggerHealing: boolean,
  onTrigger: (record: PendingTriggerRecord) => void,
  onDismiss: (record: PendingTriggerRecord) => void,
): StandardColumnDef<PendingTriggerRecord>[] {
  return [
    createTitleColumn(),
    createExternalIdColumn(),
    createSeverityColumn(),
    createAffectedCiColumn(),
    createAffectedServiceColumn(),
    createCreatedAtColumn(),
    createActionColumn(canTriggerHealing, onTrigger, onDismiss),
  ];
}

export default function PendingTriggerTable({
  tableKey,
  tabs,
  activeTab,
  onTabChange,
  canTriggerHealing,
  onTrigger,
  onDismiss,
  onRowClick,
}: PendingTriggerTableProps) {
  const columns = useMemo(
    () => createPendingTriggerColumns(canTriggerHealing, onTrigger, onDismiss),
    [canTriggerHealing, onDismiss, onTrigger],
  );

  const handleRequest = useCallback(async (params: TriggerTableRequestParams) => {
    const response = await getPendingTriggers(buildPendingTriggerParams(params));
    return {
      data: response.data || [],
      total: Number(response.total ?? 0),
    };
  }, []);

  return (
    <StandardTable<PendingTriggerRecord>
      key={tableKey}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      title="待办中心"
      description={triggerDescription}
      headerIcon={pendingCenterHeaderIcon}
      searchFields={triggerSearchFields}
      columns={columns}
      rowKey="id"
      onRowClick={onRowClick}
      request={handleRequest}
      defaultPageSize={10}
      preferenceKey="pending_triggers"
    />
  );
}
