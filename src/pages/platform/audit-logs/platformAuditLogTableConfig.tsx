import React from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DiffOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Space, Tag, Tooltip, Typography } from 'antd';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
  ACTION_COLORS,
  ACTION_LABELS,
  HTTP_METHOD_COLORS as METHOD_COLORS,
  PLATFORM_RESOURCE_LABELS as RESOURCE_LABELS,
} from '@/constants/auditDicts';
import dayjs from 'dayjs';
import {
  AUTH_FAILURE_REASON_LABELS,
  AUTH_METHOD_LABELS,
  AUTH_SCOPE_LABELS,
} from '@/pages/system/audit-logs/helpers';
import type { AuditLogRecord } from '@/pages/system/audit-logs/types';

const { Text } = Typography;

const AUTH_ACTIONS = ['login', 'logout', 'register'];
const AUTH_RESOURCES = ['auth', 'auth-logout', 'auth-register'];

const riskMap: Record<string, { color: string; label: string }> = {
  critical: { color: 'red', label: '极高' },
  high: { color: 'orange', label: '高危' },
  medium: { color: 'blue', label: '中' },
};

export function createPlatformAuditLogColumns(): {
  loginColumns: StandardColumnDef<AuditLogRecord>[];
  operationColumns: StandardColumnDef<AuditLogRecord>[];
} {
  const timeColumn: StandardColumnDef<AuditLogRecord> = {
    columnKey: 'created_at',
    columnTitle: '时间',
    dataIndex: 'created_at',
    width: 170,
    sorter: true,
    render: (_, record) =>
      record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
  };
  const userColumn: StandardColumnDef<AuditLogRecord> = {
    columnKey: 'username',
    columnTitle: '用户',
    dataIndex: 'username',
    width: 130,
    render: (_, record) => (
      <Space size={4}>
        <UserOutlined style={{ color: '#722ed1' }} />
        <span>{record.username || '-'}</span>
      </Space>
    ),
  };
  const statusColumn: StandardColumnDef<AuditLogRecord> = {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 80,
    headerFilters: [
      { label: '成功', value: 'success' },
      { label: '失败', value: 'failed' },
    ],
    render: (_, record) => {
      const success = record.status === 'success';
      return (
        <Tag
          color={success ? 'green' : 'red'}
          icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ margin: 0 }}
        >
          {success ? '成功' : '失败'}
        </Tag>
      );
    },
  };
  const ipColumn: StandardColumnDef<AuditLogRecord> = {
    columnKey: 'ip_address',
    columnTitle: 'IP 地址',
    dataIndex: 'ip_address',
    width: 140,
    render: (_, record) => (
      <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.ip_address || '-'}</Text>
    ),
  };

  const operationColumns: StandardColumnDef<AuditLogRecord>[] = [
    timeColumn,
    userColumn,
    {
      columnKey: 'action',
      columnTitle: '操作',
      dataIndex: 'action',
      width: 110,
      headerFilters: Object.entries(ACTION_LABELS)
        .filter(([value]) => !AUTH_ACTIONS.includes(value))
        .map(([value, label]) => ({ label, value })),
      render: (_, record) => {
        const action = record.action ?? '';
        return (
          <Tag color={ACTION_COLORS[action] || 'default'} style={{ margin: 0 }}>
            {ACTION_LABELS[action] || action}
          </Tag>
        );
      },
    },
    {
      columnKey: 'resource_type',
      columnTitle: '资源类型',
      dataIndex: 'resource_type',
      width: 110,
      headerFilters: Object.entries(RESOURCE_LABELS)
        .filter(([value]) => !AUTH_RESOURCES.includes(value))
        .map(([value, label]) => ({ label, value })),
      render: (_, record) => {
        const resourceType = record.resource_type ?? '';
        return <span>{RESOURCE_LABELS[resourceType] || resourceType}</span>;
      },
    },
    {
      columnKey: 'request_path',
      columnTitle: '请求',
      dataIndex: 'request_path',
      width: 280,
      ellipsis: true,
      render: (_, record) => {
        const requestMethod = record.request_method ?? '';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 600,
                color: METHOD_COLORS[requestMethod] || '#999',
              }}
            >
              {requestMethod}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>
              {record.request_path}
            </span>
          </span>
        );
      },
    },
    statusColumn,
    {
      columnKey: 'risk_level',
      columnTitle: '风险',
      dataIndex: 'risk_level',
      width: 80,
      render: (_, record) => {
        const risk = record.risk_level ? riskMap[record.risk_level] : undefined;
        if (!risk) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              正常
            </Text>
          );
        }
        return (
          <Tooltip title={record.risk_reason || risk.label}>
            <Tag
              color={risk.color}
              icon={record.risk_level === 'critical' ? <WarningOutlined /> : undefined}
              style={{ margin: 0 }}
            >
              {risk.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      columnKey: 'changes',
      columnTitle: '变更',
      dataIndex: 'changes',
      width: 90,
      render: (_, record) => {
        if (!record.changes) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          );
        }
        if (record.changes.deleted) {
          return (
            <Tag color="red" icon={<DeleteOutlined />} style={{ margin: 0 }}>
              删除详情
            </Tag>
          );
        }
        return (
          <Tag color="blue" icon={<DiffOutlined />} style={{ margin: 0 }}>
            {Object.keys(record.changes).length} 项变更
          </Tag>
        );
      },
    },
    { ...ipColumn, defaultVisible: false },
  ];

  const authColumns: StandardColumnDef<AuditLogRecord>[] = [
    timeColumn,
    {
      ...userColumn,
      render: (_, record) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#722ed1' }} />
          <span>{record.principal_username || record.username || '-'}</span>
        </Space>
      ),
    },
    {
      columnKey: 'subject_scope',
      columnTitle: '主体范围',
      dataIndex: 'subject_scope',
      width: 110,
      render: (_, record) => (
        <Tag color={record.subject_scope === 'platform_admin' ? 'purple' : record.subject_scope === 'tenant_user' ? 'blue' : 'default'} style={{ margin: 0 }}>
          {AUTH_SCOPE_LABELS[record.subject_scope || ''] || record.subject_scope || '-'}
        </Tag>
      ),
    },
    {
      columnKey: 'subject_tenant_name',
      columnTitle: '租户归属',
      dataIndex: 'subject_tenant_name',
      width: 140,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.subject_tenant_name || '—'}
        </Text>
      ),
    },
    {
      columnKey: 'action',
      columnTitle: '操作',
      dataIndex: 'action',
      width: 90,
      render: (_, record) => {
        const action = record.action ?? '';
        return (
          <Tag color={ACTION_COLORS[action] || 'default'} style={{ margin: 0 }}>
            {ACTION_LABELS[action] || action}
          </Tag>
        );
      },
    },
    statusColumn,
    {
      columnKey: 'failure_reason',
      columnTitle: '失败原因',
      dataIndex: 'failure_reason',
      width: 150,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.failure_reason ? (AUTH_FAILURE_REASON_LABELS[record.failure_reason] || record.failure_reason) : '—'}
        </Text>
      ),
    },
    {
      columnKey: 'auth_method',
      columnTitle: '认证方式',
      dataIndex: 'auth_method',
      width: 110,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {AUTH_METHOD_LABELS[record.auth_method || ''] || record.auth_method || '—'}
        </Text>
      ),
    },
    ipColumn,
    {
      columnKey: 'user_agent',
      columnTitle: '客户端',
      dataIndex: 'user_agent',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.user_agent || '-'}
        </Text>
      ),
    },
  ];

  return { loginColumns: authColumns, operationColumns };
}
