import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Typography } from 'antd';
import type {
  AdvancedSearchField,
  SearchField,
  StandardColumnDef,
} from '@/components/StandardTable';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import dayjs from 'dayjs';
import {
  formatImpersonationDuration,
  impersonationStatusOptions,
  renderImpersonationStatusTag,
} from './impersonationShared';
import { getImpersonationStatusMeta } from '@/constants/accessDicts';

const { Text } = Typography;

export const impersonationApprovalSearchFields: SearchField[] = [
  { key: 'requester_name', label: '申请人', placeholder: '搜索申请人名称' },
  { key: 'reason', label: '申请原因', placeholder: '搜索申请原因' },
  {
    key: '__enum__status',
    label: '审批状态',
    description: '筛选审批请求状态',
    options: impersonationStatusOptions,
  },
];

export const impersonationApprovalAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'requester_name', label: '申请人', type: 'input', placeholder: '申请人名称' },
  { key: 'reason', label: '申请原因', type: 'input', placeholder: '申请原因关键字' },
  {
    key: 'status',
    label: '审批状态',
    type: 'select',
    placeholder: '全部状态',
    options: impersonationStatusOptions,
  },
];

export const impersonationApprovalHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <title>会话代登审批图标</title>
    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M36 24l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export interface ImpersonationApprovalStatsBarProps {
  total: number | null;
  pending: number | null;
  errorMessage?: string | null;
}

function renderStatValue(value: number | null) {
  return value === null ? '—' : value;
}

export function ImpersonationApprovalStatsBar({
  total,
  pending,
  errorMessage,
}: ImpersonationApprovalStatsBarProps) {
  const pendingStatus = getImpersonationStatusMeta('pending');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
        <SafetyOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(total)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部请求</div>
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        <ClockCircleOutlined style={{ fontSize: 22, color: pendingStatus.color, opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(pending)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{pendingStatus.label}</div>
        </div>
      </div>
      {errorMessage ? <Text type="danger" style={{ marginLeft: 20, fontSize: 12 }}>{errorMessage}</Text> : null}
    </div>
  );
}

export interface ImpersonationPendingColumnsOptions {
  actionLoading: string | null;
  canApproveImpersonation: boolean;
  onApprove: (record: ImpersonationRequest) => void;
  onReject: (record: ImpersonationRequest) => void;
}

type PendingActionCellOptions = ImpersonationPendingColumnsOptions & {
  record: ImpersonationRequest;
};

function createRequesterColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'requester_name',
    columnTitle: '申请人',
    dataIndex: 'requester_name',
    width: 120,
    render: (_, record) => (
      <Space size={4}>
        <UserSwitchOutlined style={{ color: '#1677ff' }} />
        <Text strong>{record.requester_name}</Text>
      </Space>
    ),
  };
}

function createReasonColumn(width: number): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'reason',
    columnTitle: '申请原因',
    dataIndex: 'reason',
    width,
    ellipsis: true,
    render: (_, record) => record.reason || <Text type="secondary">—</Text>,
  };
}

function createDurationColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'duration_minutes',
    columnTitle: '时长',
    dataIndex: 'duration_minutes',
    width: 70,
    render: (_, record) => formatImpersonationDuration(record.duration_minutes),
  };
}

function createStatusColumn(withHeaderFilters: boolean): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 90,
    ...(withHeaderFilters ? { headerFilters: impersonationStatusOptions } : {}),
    render: (_, record) => renderImpersonationStatusTag(record.status),
  };
}

function createCreatedAtColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'created_at',
    columnTitle: '申请时间',
    dataIndex: 'created_at',
    width: 150,
    render: (_, record) => (
      record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-'
    ),
  };
}

function createApprovedAtColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'approved_at',
    columnTitle: '审批时间',
    dataIndex: 'approved_at',
    width: 150,
    render: (_, record) => (
      record.approved_at
        ? dayjs(record.approved_at).format('YYYY-MM-DD HH:mm')
        : <Text type="secondary">—</Text>
    ),
  };
}

function createApproverColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'approver_name',
    columnTitle: '审批人',
    dataIndex: 'approver_name',
    width: 120,
    render: (_, record) => record.approver_name || <Text type="secondary">—</Text>,
  };
}

function renderPendingActionCell({
  record,
  actionLoading,
  canApproveImpersonation,
  onApprove,
  onReject,
}: PendingActionCellOptions) {
  if (record.status !== 'pending') {
    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  }
  if (!canApproveImpersonation) {
    return (
      <Space size={4}>
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} disabled>批准</Button>
        <Button size="small" danger icon={<CloseCircleOutlined />} disabled>拒绝</Button>
      </Space>
    );
  }

  const isLoading = actionLoading === record.id;
  const durationText = record.duration_minutes >= 60
    ? `${record.duration_minutes / 60} 小时`
    : `${record.duration_minutes} 分钟`;
  return (
    <Space size={4}>
      <Popconfirm
        title="确定批准此访问请求？"
        description={`${record.requester_name} 将获得 ${durationText}的访问权限`}
        onConfirm={() => onApprove(record)}
      >
        <Button type="primary" size="small" icon={<CheckCircleOutlined />} loading={isLoading} onClick={(event) => event.stopPropagation()}>
          批准
        </Button>
      </Popconfirm>
      <Button
        size="small"
        danger
        icon={<CloseCircleOutlined />}
        loading={isLoading}
        onClick={(event) => {
          event.stopPropagation();
          onReject(record);
        }}
      >
        拒绝
      </Button>
    </Space>
  );
}

function createActionColumn(
  options: ImpersonationPendingColumnsOptions,
): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'action',
    columnTitle: '操作',
    dataIndex: 'id',
    width: 140,
    fixedColumn: true,
    fixed: 'right',
    render: (_, record) => renderPendingActionCell({ ...options, record }),
  };
}

export function createImpersonationPendingColumns(
  options: ImpersonationPendingColumnsOptions,
): StandardColumnDef<ImpersonationRequest>[] {
  return [
    createRequesterColumn(),
    createReasonColumn(180),
    createDurationColumn(),
    createStatusColumn(false),
    createCreatedAtColumn(),
    createActionColumn(options),
  ];
}

export function createImpersonationHistoryColumns(): StandardColumnDef<ImpersonationRequest>[] {
  return [
    createRequesterColumn(),
    createReasonColumn(150),
    createDurationColumn(),
    createStatusColumn(true),
    createApproverColumn(),
    createApprovedAtColumn(),
    createCreatedAtColumn(),
  ];
}
