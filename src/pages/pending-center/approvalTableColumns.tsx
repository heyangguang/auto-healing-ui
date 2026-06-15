import { Button, Space, Tag, Typography } from 'antd';
import React from 'react';
import type { StandardColumnDef } from '@/components/StandardTable';
import { getApprovalStatusConfig } from '@/constants/instanceDicts';
import { formatPendingCenterTime } from './shared';
import type { PendingApprovalRecord } from './types';

const { Text } = Typography;

export type ApprovalActorResolver = (actorId?: string | null) => string;

type PendingApprovalColumnsOptions = {
  canApprove: boolean;
  onApprove: (record: PendingApprovalRecord) => void;
  onReject: (record: PendingApprovalRecord) => void;
  resolveApprovers: (record: PendingApprovalRecord) => string;
};

function renderApprovalStatus(status?: string) {
  const statusConfig = getApprovalStatusConfig(status);
  return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
}

function isJsonObject(
  value: AutoHealing.JsonValue | undefined,
): value is AutoHealing.JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getIncidentIdFromContext(
  context?: AutoHealing.JsonObject,
): string | undefined {
  const incident = context?.incident;

  if (!isJsonObject(incident)) {
    return undefined;
  }

  return getStringValue(incident.external_id) || getStringValue(incident.id);
}

function getApprovalIncidentId(
  record: PendingApprovalRecord,
): string | undefined {
  return (
    getStringValue(record.flow_instance?.incident?.external_id) ||
    getIncidentIdFromContext(record.flow_instance?.context) ||
    getIncidentIdFromContext(record.context) ||
    getStringValue(record.flow_instance?.incident_id)
  );
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

function createIncidentIdColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'incident_id',
    columnTitle: '工单ID',
    width: 130,
    render: (_, record) => {
      const incidentId = getApprovalIncidentId(record);

      return incidentId ? (
        <Tag color="blue">{incidentId}</Tag>
      ) : (
        <Text type="secondary">—</Text>
      );
    },
  };
}

function createFlowInstanceColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'flow_instance_id',
    columnTitle: '流程实例',
    dataIndex: 'flow_instance_id',
    width: 180,
    render: (_, record) =>
      record.flow_instance_id ? (
        <Tag>FLOW-{record.flow_instance_id.substring(0, 8)}</Tag>
      ) : (
        <Text type="secondary">—</Text>
      ),
  };
}

function createStatusColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 110,
    render: (_, record) => renderApprovalStatus(record.status),
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

function createDecidedAtColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'decided_at',
    columnTitle: '审批时间',
    dataIndex: 'decided_at',
    width: 180,
    sorter: true,
    render: (_, record) => formatPendingCenterTime(record.decided_at),
  };
}

function createDecisionCommentColumn(): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'decision_comment',
    columnTitle: '审批意见',
    dataIndex: 'decision_comment',
    width: 220,
    ellipsis: true,
    render: (_, record) =>
      record.decision_comment || <Text type="secondary">—</Text>,
  };
}

function createDecidedByColumn(
  resolveActor: ApprovalActorResolver,
): StandardColumnDef<PendingApprovalRecord> {
  return {
    columnKey: 'decided_by',
    columnTitle: '审批人',
    dataIndex: 'decided_by',
    width: 140,
    render: (_, record) => resolveActor(record.decided_by),
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
        <Button
          type="primary"
          size="small"
          disabled={!canApprove}
          onClick={() => onApprove(record)}
        >
          批准
        </Button>
        <Button
          danger
          size="small"
          disabled={!canApprove}
          onClick={() => onReject(record)}
        >
          拒绝
        </Button>
      </Space>
    ),
  };
}

export function createPendingApprovalColumns(
  options: PendingApprovalColumnsOptions,
): StandardColumnDef<PendingApprovalRecord>[] {
  return [
    createNodeNameColumn(),
    createIncidentIdColumn(),
    createFlowInstanceColumn(),
    createStatusColumn(),
    createApproversColumn(options.resolveApprovers),
    createCreatedAtColumn(),
    createActionColumn(options.canApprove, options.onApprove, options.onReject),
  ];
}

export function createApprovalHistoryColumns(
  resolveActor: ApprovalActorResolver,
): StandardColumnDef<PendingApprovalRecord>[] {
  return [
    createNodeNameColumn(),
    createIncidentIdColumn(),
    createFlowInstanceColumn(),
    createStatusColumn(),
    createCreatedAtColumn(),
    createDecidedAtColumn(),
    createDecidedByColumn(resolveActor),
    createDecisionCommentColumn(),
  ];
}
