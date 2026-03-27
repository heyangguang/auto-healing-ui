import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { StandardColumnDef } from '@/components/StandardTable';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import {
  exemptionSeverityColors,
  exemptionStatusMap,
  formatExemptionTime,
  renderExemptionStatusTag,
} from './exemptionApprovalShared';

const { Text } = Typography;

function renderStatValue(value: number | null) {
  return value === null ? '—' : value;
}

export function ExemptionStatsBar({
  total,
  pending,
  errorMessage,
}: {
  total: number | null;
  pending: number | null;
  errorMessage?: string | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
        <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(total)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部请求</div>
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        <ClockCircleOutlined style={{ fontSize: 22, color: '#fa8c16', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(pending)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>待审批</div>
        </div>
      </div>
      {errorMessage ? <Text type="danger" style={{ marginLeft: 20, fontSize: 12 }}>{errorMessage}</Text> : null}
    </div>
  );
}

type ExemptionColumnsOptions = {
  actionLoading: string | null;
  canApproveExemption: boolean;
  onApprove: (record: ExemptionRecord) => void;
  onReject: (record: ExemptionRecord) => void;
};

type PendingActionCellOptions = ExemptionColumnsOptions & {
  record: ExemptionRecord;
};

function renderSeverityTag(severity: string) {
  return (
    <Tag color={exemptionSeverityColors[severity] || 'default'} style={{ margin: 0 }}>
      {severity}
    </Tag>
  );
}

function renderPendingActionCell({
  record,
  actionLoading,
  canApproveExemption,
  onApprove,
  onReject,
}: PendingActionCellOptions) {
  if (record.status !== 'pending') {
    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  }
  if (!canApproveExemption) {
    return (
      <Space size={4}>
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} disabled>批准</Button>
        <Button size="small" danger icon={<CloseCircleOutlined />} disabled>拒绝</Button>
      </Space>
    );
  }

  const isLoading = actionLoading === record.id;
  return (
    <Space size={4}>
      <Popconfirm
        title="确定批准此豁免申请？"
        description={`${record.requester_name} 将获得 ${record.validity_days} 天的豁免权限`}
        onConfirm={() => onApprove(record)}
      >
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} loading={isLoading} onClick={(event) => event.stopPropagation()}>
          批准
        </Button>
      </Popconfirm>
      <Button size="small" danger icon={<CloseCircleOutlined />} loading={isLoading} onClick={(event) => { event.stopPropagation(); onReject(record); }}>
        拒绝
      </Button>
    </Space>
  );
}

export function createPendingExemptionColumns({
  actionLoading,
  canApproveExemption,
  onApprove,
  onReject,
}: ExemptionColumnsOptions): StandardColumnDef<ExemptionRecord>[] {
  return [
    { columnKey: 'task_name', columnTitle: '任务模板', dataIndex: 'task_name', width: 140, ellipsis: true },
    { columnKey: 'rule_name', columnTitle: '豁免规则', dataIndex: 'rule_name', width: 120, ellipsis: true },
    {
      columnKey: 'rule_severity',
      columnTitle: '级别',
      dataIndex: 'rule_severity',
      width: 68,
      render: (_, record) => renderSeverityTag(record.rule_severity),
    },
    {
      columnKey: 'requester_name',
      columnTitle: '申请人',
      dataIndex: 'requester_name',
      width: 72,
      ellipsis: true,
      render: (_, record) => <Text strong>{record.requester_name}</Text>,
    },
    { columnKey: 'validity_days', columnTitle: '有效期', dataIndex: 'validity_days', width: 65, render: (_, record) => `${record.validity_days} 天` },
    { columnKey: 'created_at', columnTitle: '申请时间', dataIndex: 'created_at', width: 140, render: (_, record) => formatExemptionTime(record.created_at) },
    {
      columnKey: 'action',
      columnTitle: '操作',
      dataIndex: 'id',
      width: 120,
      render: (_, record) => renderPendingActionCell({
        record,
        actionLoading,
        canApproveExemption,
        onApprove,
        onReject,
      }),
    },
  ];
}

export function createExemptionHistoryColumns(): StandardColumnDef<ExemptionRecord>[] {
  return [
    { columnKey: 'task_name', columnTitle: '任务模板', dataIndex: 'task_name', width: 140, ellipsis: true },
    { columnKey: 'rule_name', columnTitle: '豁免规则', dataIndex: 'rule_name', width: 120, ellipsis: true },
    {
      columnKey: 'rule_severity',
      columnTitle: '级别',
      dataIndex: 'rule_severity',
      width: 68,
      render: (_, record) => renderSeverityTag(record.rule_severity),
    },
    { columnKey: 'requester_name', columnTitle: '申请人', dataIndex: 'requester_name', width: 72, ellipsis: true },
    {
      columnKey: 'status',
      columnTitle: '状态',
      dataIndex: 'status',
      width: 80,
      headerFilters: Object.entries(exemptionStatusMap).map(([value, meta]) => ({ label: meta.label, value })),
      render: (_, record) => renderExemptionStatusTag(record.status),
    },
    {
      columnKey: 'approver_name',
      columnTitle: '审批人',
      dataIndex: 'approver_name',
      width: 90,
      ellipsis: true,
      render: (_, record) => record.approver_name || <Text type="secondary">—</Text>,
    },
    {
      columnKey: 'approved_at',
      columnTitle: '审批时间',
      dataIndex: 'approved_at',
      width: 140,
      sorter: true,
      render: (_, record) => record.approved_at ? formatExemptionTime(record.approved_at) : <Text type="secondary">—</Text>,
    },
    {
      columnKey: 'created_at',
      columnTitle: '申请时间',
      dataIndex: 'created_at',
      width: 140,
      sorter: true,
      render: (_, record) => formatExemptionTime(record.created_at),
    },
  ];
}
