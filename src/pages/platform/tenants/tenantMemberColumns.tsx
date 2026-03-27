import React from 'react';
import { Avatar, Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  MailOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { PlatformTenantMember, TenantInvitation } from '@/services/auto-healing/platform/tenants';

const ROLE_COLOR: Record<string, string> = {
  admin: 'blue',
  operator: 'cyan',
  viewer: 'default',
  devops_engineer: 'geekblue',
  healing_engineer: 'green',
  auditor: 'orange',
  monitor_admin: 'purple',
  notification_manager: 'magenta',
};

const INV_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待接受', color: 'processing', icon: <ClockCircleOutlined /> },
  accepted: { label: '已接受', color: 'success', icon: <CheckCircleOutlined /> },
  expired: { label: '已过期', color: 'default', icon: <StopOutlined /> },
  cancelled: { label: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
};

export const getTenantMemberRowKey = (record: PlatformTenantMember) => `${record.user_id}:${record.role_id}`;

type AccessLike = {
  canManagePlatformTenants?: boolean;
};

type TenantMemberColumnsOptions = {
  access: AccessLike;
  isLastAdminMember: (record: PlatformTenantMember) => boolean;
  onOpenChangeRole: (member: PlatformTenantMember) => void;
};

export const createTenantMemberColumns = ({
  access,
  isLastAdminMember,
  onOpenChangeRole,
}: TenantMemberColumnsOptions): TableProps<PlatformTenantMember>['columns'] => [
  {
    title: '成员',
    dataIndex: 'user',
    key: 'user',
    render: (_: unknown, record) => {
      const name = record.user?.display_name || record.user?.username || record.user_id?.substring(0, 8);
      const username = record.user?.username || '';
      const isAdmin = record.role?.name === 'admin';
      const initial = name?.[0]?.toUpperCase() || '?';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={32}
            style={{
              background: isAdmin ? '#fff7e6' : '#e6f4ff',
              color: isAdmin ? '#fa8c16' : '#1677ff',
              border: `1px solid ${isAdmin ? '#ffd591' : '#bae0ff'}`,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {initial}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>{name}</div>
            {username && username !== name && (
              <div style={{ fontSize: 11, color: '#a0a0a0', lineHeight: 1.2 }}>@{username}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    title: '邮箱',
    key: 'email',
    width: 200,
    render: (_: unknown, record) => (
      <span style={{ fontSize: 12, color: '#595959' }}>{record.user?.email || '-'}</span>
    ),
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 110,
    render: (_: unknown, record) => {
      const roleName = record.role?.name;
      const roleDisplay = record.role?.display_name || roleName || '-';
      return <Tag color={ROLE_COLOR[roleName ?? ''] || 'default'} style={{ margin: 0 }}>{roleDisplay}</Tag>;
    },
  },
  {
    title: '加入时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150,
    render: (value: string) => (
      <span style={{ fontSize: 12, color: '#8c8c8c', fontVariantNumeric: 'tabular-nums' }}>
        {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'}
      </span>
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    render: (_: unknown, record) => {
      const protectLastAdmin = isLastAdminMember(record);
      const disabledReason = protectLastAdmin ? '最后一个租户管理员不能被降级' : '';
      return (
        <Tooltip title={disabledReason || '变更角色'}>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            disabled={!access.canManagePlatformTenants || protectLastAdmin}
            onClick={() => onOpenChangeRole(record)}
            style={{ padding: 0, fontSize: 12 }}
          >
            变更角色
          </Button>
        </Tooltip>
      );
    },
  },
];

type TenantInvitationColumnsOptions = {
  access: AccessLike;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onCopyInvitationLink: (url: string) => void;
};

export const createTenantInvitationColumns = ({
  access,
  onCancelInvitation,
  onCopyInvitationLink,
}: TenantInvitationColumnsOptions): TableProps<TenantInvitation>['columns'] => [
  {
    title: '受邀邮箱',
    dataIndex: 'email',
    key: 'email',
    render: (email: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MailOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
        <span style={{ fontSize: 13, color: '#262626' }}>{email}</span>
      </div>
    ),
  },
  {
    title: '角色',
    key: 'role',
    width: 110,
    render: (_: unknown, record) => {
      const roleName = record.role?.name;
      const roleDisplay = record.role?.display_name || roleName || '-';
      return <Tag color={ROLE_COLOR[roleName ?? ''] || 'default'} style={{ margin: 0 }}>{roleDisplay}</Tag>;
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => {
      const mapped = INV_STATUS_MAP[status] || { label: status, color: 'default', icon: null };
      return <Tag color={mapped.color} icon={mapped.icon} style={{ margin: 0 }}>{mapped.label}</Tag>;
    },
  },
  {
    title: '邀请人',
    key: 'inviter',
    width: 120,
    render: (_: unknown, record) => (
      <span style={{ fontSize: 12, color: '#595959' }}>
        {record.inviter?.display_name || record.inviter?.username || '-'}
      </span>
    ),
  },
  {
    title: '过期时间',
    dataIndex: 'expires_at',
    key: 'expires_at',
    width: 150,
    render: (value: string) => (
      <span style={{ fontSize: 12, color: '#8c8c8c', fontVariantNumeric: 'tabular-nums' }}>
        {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'}
      </span>
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    render: (_: unknown, record) => {
      const invitationUrl = record.invitation_url;
      return record.status === 'pending' ? (
        <Space size={0}>
          {invitationUrl && (
            <Tooltip title="复制邀请链接">
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }}
                disabled={!access.canManagePlatformTenants}
                onClick={() => onCopyInvitationLink(invitationUrl)}
              >
                复制
              </Button>
            </Tooltip>
          )}
          <Popconfirm title="确认取消此邀请？" onConfirm={() => onCancelInvitation(record.id)} okText="确认" cancelText="取消">
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              disabled={!access.canManagePlatformTenants}
              style={{ padding: '0 4px', fontSize: 12 }}
            >
              取消
            </Button>
          </Popconfirm>
        </Space>
      ) : <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>;
    },
  },
];
