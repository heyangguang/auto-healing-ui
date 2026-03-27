import React from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DiffOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip, Typography } from 'antd';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
  ACTION_COLORS,
  ACTION_LABELS,
  HTTP_METHOD_COLORS as METHOD_COLORS,
  TENANT_RESOURCE_LABELS as RESOURCE_LABELS,
} from '@/constants/auditDicts';
import dayjs from 'dayjs';
import { AUDIT_RISK_LEVEL_OPTIONS } from './auditLogSearchConfig';
import type { AuditLogRecord } from './types';

const { Text } = Typography;

const LOGIN_ACTIONS = ['login', 'logout', 'impersonation_enter', 'impersonation_exit'];
const LOGIN_RESOURCES = ['auth', 'auth-logout', 'impersonation'];
const AUDIT_RESULT_OPTIONS = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

const riskMap: Record<string, { color: string; label: string }> = {
  critical: { color: 'red', label: '极高' },
  high: { color: 'orange', label: '高危' },
  medium: { color: 'blue', label: '中' },
  normal: { color: 'default', label: '普通' },
};

export function createAuditLogColumns(): {
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
    width: 120,
    sorter: true,
    render: (_, record) => (
      <span className="audit-user-cell">
        <span className="audit-user-name">{record.user?.display_name || record.username}</span>
        <span className="audit-user-sub">{record.username}</span>
      </span>
    ),
  };
  const statusColumn: StandardColumnDef<AuditLogRecord> = {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 80,
    headerFilters: AUDIT_RESULT_OPTIONS,
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
        .filter(([value]) => !LOGIN_ACTIONS.includes(value))
        .map(([value, label]) => ({ label, value })),
      render: (_, record) => {
        const action = record.action || '';
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
        .filter(([value]) => !LOGIN_RESOURCES.includes(value))
        .map(([value, label]) => ({ label, value })),
      render: (_, record) => {
        const resourceType = record.resource_type || '';
        return <span className="audit-resource-cell">{RESOURCE_LABELS[resourceType] || resourceType}</span>;
      },
    },
    {
      columnKey: 'request_path',
      columnTitle: '请求',
      dataIndex: 'request_path',
      width: 280,
      ellipsis: true,
      render: (_, record) => {
        const requestMethod = record.request_method || '';
        return (
          <span className="audit-request-cell">
            <span className="audit-method-badge" style={{ color: METHOD_COLORS[requestMethod] || '#999' }}>
              {requestMethod}
            </span>
            <span className="audit-path">{record.request_path}</span>
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
      headerFilters: AUDIT_RISK_LEVEL_OPTIONS,
      render: (_, record) => {
        const riskLevel = record.risk_level || '';
        const risk = riskMap[riskLevel];
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
              icon={riskLevel === 'critical' ? <WarningOutlined /> : undefined}
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
      width: 100,
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
    {
      columnKey: 'response_status',
      columnTitle: 'HTTP',
      dataIndex: 'response_status',
      width: 70,
      defaultVisible: false,
      render: (_, record) => {
        const responseStatus = record.response_status;
        const color =
          responseStatus == null
            ? '#999'
            : responseStatus >= 400
              ? '#f93e3e'
              : responseStatus >= 300
                ? '#fca130'
                : '#49cc90';
        return (
          <span style={{ fontFamily: 'monospace', fontSize: 12, color }}>
            {responseStatus ?? '-'}
          </span>
        );
      },
    },
    { ...ipColumn, defaultVisible: false },
  ];

  const loginColumns: StandardColumnDef<AuditLogRecord>[] = [
    timeColumn,
    userColumn,
    {
      columnKey: 'action',
      columnTitle: '操作',
      dataIndex: 'action',
      width: 90,
      render: (_, record) => {
        const action = record.action || '';
        return (
          <Tag color={ACTION_COLORS[action] || 'default'} style={{ margin: 0 }}>
            {ACTION_LABELS[action] || action}
          </Tag>
        );
      },
    },
    statusColumn,
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

  return { loginColumns, operationColumns };
}
