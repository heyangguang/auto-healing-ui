import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SafetyOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
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
} from '@/pages/pending-center/impersonationShared';

const { Text } = Typography;

export const platformImpersonationSearchFields: SearchField[] = [
  { key: 'requester_name', label: '申请人' },
];

export const platformImpersonationAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'tenant_name', label: '租户名', type: 'input', placeholder: '租户名称' },
  { key: 'reason', label: '申请原因', type: 'input', placeholder: '申请原因' },
  {
    key: 'status',
    label: '会话状态',
    type: 'select',
    placeholder: '全部状态',
    options: impersonationStatusOptions,
  },
];

export const platformImpersonationHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M32 10l6-6m0 0h-5m5 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface PlatformImpersonationStatsBarProps {
  total: number | null;
  pending: number | null;
  active: number | null;
  errorMessage?: string | null;
}

function renderStatValue(value: number | null) {
  return value === null ? '—' : value;
}

export function PlatformImpersonationStatsBar({
  total,
  pending,
  active,
  errorMessage,
}: PlatformImpersonationStatsBarProps) {
  return (
    <div
      className="audit-stats-bar"
      style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}
    >
      <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
        <FileTextOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(total)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部</div>
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
      <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        <ClockCircleOutlined style={{ fontSize: 22, color: '#1890ff', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(pending)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>待审批</div>
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
      <div className="audit-stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        <SyncOutlined style={{ fontSize: 22, color: '#52c41a', opacity: 0.75 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{renderStatValue(active)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>进行中</div>
        </div>
      </div>
      {errorMessage ? <Text type="danger" style={{ marginLeft: 20, fontSize: 12 }}>{errorMessage}</Text> : null}
    </div>
  );
}

export interface PlatformImpersonationColumnsOptions {
  actionLoading: string | null;
  onEnter: (record: ImpersonationRequest) => void;
  onExit: (record: ImpersonationRequest) => void;
  onTerminate: (record: ImpersonationRequest) => void;
  onCancel: (record: ImpersonationRequest) => void;
}

type ActionButtonOptions = PlatformImpersonationColumnsOptions & {
  record: ImpersonationRequest;
};

function createTenantColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'tenant_name',
    columnTitle: '目标租户',
    dataIndex: 'tenant_name',
    width: 120,
    ellipsis: true,
    render: (_, record) => <Text strong>{record.tenant_name}</Text>,
  };
}

function createStatusColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 90,
    headerFilters: impersonationStatusOptions,
    render: (_, record) => renderImpersonationStatusTag(record.status),
  };
}

function createReasonColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'reason',
    columnTitle: '申请原因',
    dataIndex: 'reason',
    width: 150,
    ellipsis: { showTitle: false },
    render: (_, record) => (
      record.reason
        ? <Tooltip title={record.reason}><span>{record.reason}</span></Tooltip>
        : <Text type="secondary">—</Text>
    ),
  };
}

function createSessionExpiresColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'session_expires_at',
    columnTitle: '会话到期',
    dataIndex: 'session_expires_at',
    width: 110,
    sorter: true,
    render: (_, record) => {
      if (!record.session_expires_at) {
        return <Text type="secondary">—</Text>;
      }
      if (record.status === 'active') {
        return (
          <Tooltip title={dayjs(record.session_expires_at).format('YYYY-MM-DD HH:mm:ss')}>
            <span style={{ color: '#52c41a' }}>{dayjs(record.session_expires_at).fromNow()}</span>
          </Tooltip>
        );
      }
      return dayjs(record.session_expires_at).format('MM-DD HH:mm');
    },
  };
}

function createDurationColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'duration_minutes',
    columnTitle: '时长',
    dataIndex: 'duration_minutes',
    width: 60,
    render: (_, record) => formatImpersonationDuration(record.duration_minutes),
  };
}

function createApproverColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'approver_name',
    columnTitle: '审批人',
    dataIndex: 'approver_name',
    width: 130,
    render: (_, record) => record.approver_name || <Text type="secondary">—</Text>,
  };
}

function createCreatedAtColumn(): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'created_at',
    columnTitle: '申请时间',
    dataIndex: 'created_at',
    width: 140,
    sorter: true,
    render: (_, record) => (
      record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-'
    ),
  };
}

function renderActionButtons({
  record,
  actionLoading,
  onEnter,
  onExit,
  onTerminate,
  onCancel,
}: ActionButtonOptions) {
  const isLoading = actionLoading === record.id;
  const isApprovedButExpired = record.status === 'approved'
    && Boolean(record.session_expires_at)
    && dayjs(record.session_expires_at).isBefore(dayjs());
  const hasAction = ['approved', 'active', 'pending'].includes(record.status) && !isApprovedButExpired;

  if (!hasAction) {
    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  }

  return (
    <Space size={4}>
      {record.status === 'approved' ? (
        <Button type="primary" size="small" icon={<EyeOutlined />} loading={isLoading} onClick={(event) => { event.stopPropagation(); onEnter(record); }}>
          进入
        </Button>
      ) : null}
      {record.status === 'active' ? (
        <Button size="small" icon={<LogoutOutlined />} loading={isLoading} onClick={(event) => { event.stopPropagation(); onExit(record); }}>
          暂离
        </Button>
      ) : null}
      {(record.status === 'active' || (record.status === 'approved' && record.session_expires_at)) ? (
        <Popconfirm title="确定终止会话？终止后将无法再次进入。" onConfirm={() => onTerminate(record)}>
          <Button size="small" danger icon={<StopOutlined />} loading={isLoading} onClick={(event) => event.stopPropagation()}>
            终止
          </Button>
        </Popconfirm>
      ) : null}
      {record.status === 'pending' ? (
        <Popconfirm title="确定撤销此申请？" onConfirm={() => onCancel(record)}>
          <Button size="small" loading={isLoading} onClick={(event) => event.stopPropagation()}>
            撤销
          </Button>
        </Popconfirm>
      ) : null}
    </Space>
  );
}

function createActionColumn(
  options: PlatformImpersonationColumnsOptions,
): StandardColumnDef<ImpersonationRequest> {
  return {
    columnKey: 'action',
    columnTitle: '操作',
    dataIndex: 'id',
    width: 130,
    fixedColumn: true,
    fixed: 'right',
    render: (_, record) => renderActionButtons({ ...options, record }),
  };
}

export function createPlatformImpersonationColumns({
  actionLoading,
  onEnter,
  onExit,
  onTerminate,
  onCancel,
}: PlatformImpersonationColumnsOptions): StandardColumnDef<ImpersonationRequest>[] {
  return [
    createTenantColumn(),
    createStatusColumn(),
    createReasonColumn(),
    createDurationColumn(),
    createApproverColumn(),
    createSessionExpiresColumn(),
    createCreatedAtColumn(),
    createActionColumn({ actionLoading, onEnter, onExit, onTerminate, onCancel }),
  ];
}
