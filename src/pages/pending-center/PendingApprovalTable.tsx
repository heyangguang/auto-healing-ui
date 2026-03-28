import React, { useCallback, useMemo } from 'react';
import { Button, Space, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import StandardTable, { type AdvancedSearchField, type StandardColumnDef } from '@/components/StandardTable';
import { getApprovalStatusConfig } from '@/constants/instanceDicts';
import { getPendingApprovals } from '@/services/auto-healing/healing';
import type { PendingApprovalRecord } from './types';
import {
  approvalSearchFields,
  buildPendingApprovalParams,
  formatPendingCenterTime,
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
}

function createNodeNameColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'node_name',
    columnTitle: '节点名称',
    dataIndex: 'node_name',
    ellipsis: true,
    fixedColumn: true,
    render: (_, record) => record.node_name || record.node_id || '审批节点',
  };
}

function createFlowInstanceColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'flow_instance_id',
    columnTitle: '流程实例',
    dataIndex: 'flow_instance_id',
    width: 200,
    render: (_, record) => <Tag>FLOW-{record.flow_instance_id?.substring(0, 8)}</Tag>,
  };
}

function createStatusColumn(): StandardColumnDef<PendingApprovalRecord> {
  const status = getApprovalStatusConfig('pending');
  return {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 100,
    render: () => <Tag color={status.color} icon={<ClockCircleOutlined />}>{status.text}</Tag>,
  };
}

function createApproversColumn(
  resolveApprovers: (record: PendingApprovalRecord) => string,
): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'approvers',
    columnTitle: '审批人',
    dataIndex: 'approvers',
    width: 200,
    render: (_, record) => resolveApprovers(record),
  };
}

function createCreatedAtColumn(): StandardColumnDef<PendingApprovalRecord> {
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
  canApprove: boolean,
  onApprove: (record: PendingApprovalRecord) => void,
  onReject: (record: PendingApprovalRecord) => void,
): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'actions',
    columnTitle: '操作',
    width: 160,
    fixedColumn: true,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button type="primary" size="small" disabled={!canApprove} onClick={() => onApprove(record)}>
          批准
        </Button>
        <Button danger size="small" disabled={!canApprove} onClick={() => onReject(record)}>
          拒绝
        </Button>
      </Space>
    ),
  };
}

type PendingApprovalColumnsOptions = {
  canApprove: boolean;
  resolveApprovers: (record: PendingApprovalRecord) => string;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
};

function createPendingApprovalColumns(
  options: PendingApprovalColumnsOptions,
): StandardColumnDef<PendingApprovalRecord>[] {
  return [
    createNodeNameColumn(),
    createFlowInstanceColumn(),
    createStatusColumn(),
    createApproversColumn(options.resolveApprovers),
    createCreatedAtColumn(),
    createActionColumn(options.canApprove, options.onApprove, options.onReject),
  ];
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
    />
  );
}
