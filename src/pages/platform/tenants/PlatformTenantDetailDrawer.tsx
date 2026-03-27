import React, { useMemo } from 'react';
import { Avatar, Badge, Button, Drawer, Empty, Popconfirm, Spin, Table, Tag, Typography } from 'antd';
import {
  BankOutlined,
  CodeOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import type { PlatformTenantMember, PlatformTenantRecord } from '@/services/auto-healing/platform/tenants';
import { getTenantMemberRowKey } from './tenantMembersTableConfig';
import { ICON_MAP } from './platformTenantsShared';

const { Text } = Typography;

const ROLE_COLOR: Record<string, string> = {
  admin: 'purple',
  operator: 'cyan',
  viewer: 'default',
};

type AccessLike = {
  canManagePlatformTenants?: boolean;
};

type PlatformTenantDetailDrawerProps = {
  access: AccessLike;
  drawerLoading: boolean;
  members: PlatformTenantMember[];
  membersLoadFailed: boolean;
  membersLoading: boolean;
  onClose: () => void;
  onDelete: (event: React.MouseEvent | undefined, tenant: PlatformTenantRecord) => Promise<void>;
  open: boolean;
  tenant: PlatformTenantRecord | null;
};

const PlatformTenantDetailDrawer: React.FC<PlatformTenantDetailDrawerProps> = ({
  access,
  drawerLoading,
  members,
  membersLoadFailed,
  membersLoading,
  onClose,
  onDelete,
  open,
  tenant,
}) => {
  const memberColumns = useMemo(
    () => [
      {
        title: '成员',
        dataIndex: 'user',
        key: 'user',
        render: (_: unknown, record: PlatformTenantMember) => {
          const name = record.user?.display_name || record.user?.username || record.user_id?.substring(0, 8);
          const isAdmin = record.role?.name === 'admin';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                size={26}
                style={{
                  background: isAdmin ? '#f0f5ff' : '#f5f5f5',
                  color: isAdmin ? '#597ef7' : '#8c8c8c',
                  border: `1px solid ${isAdmin ? '#adc6ff' : '#e8e8e8'}`,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {name?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
                {record.user?.username && record.user?.username !== name && (
                  <div style={{ fontSize: 10, color: '#a0a0a0' }}>@{record.user.username}</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 90,
        render: (_: unknown, record: PlatformTenantMember) => (
          <Tag color={ROLE_COLOR[record.role?.name ?? ''] || 'default'} style={{ margin: 0, fontSize: 11 }}>
            {record.role?.display_name || record.role?.name || '-'}
          </Tag>
        ),
      },
      {
        title: '加入时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 100,
        render: (value: string) => (
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>{value ? dayjs(value).format('MM-DD HH:mm') : '-'}</span>
        ),
      },
    ],
    [],
  );

  if (!tenant) {
    return null;
  }

  const drawerIcon = ICON_MAP[tenant.icon ?? ''] ?? <BankOutlined />;
  const drawerIsActive = tenant.status === 'active' || !tenant.status;
  const adminCount = members.filter((member) => member.role?.name === 'admin').length;
  const operatorCount = members.filter((member) => member.role?.name === 'operator').length;
  const otherRoleCount = Math.max(0, members.length - adminCount - operatorCount);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={560}
      closable
      destroyOnHidden
      styles={{ header: { display: 'none' }, body: { padding: 0 } }}
    >
      <Spin spinning={drawerLoading}>
        <div className="tenant-drawer-header">
          <div className="tenant-drawer-header-top">
            <div className="tenant-drawer-header-icon">{drawerIcon}</div>
            <div className="tenant-drawer-header-info">
              <div className="tenant-drawer-title">{tenant.name}</div>
              <div className="tenant-drawer-sub">
                <Badge
                  status={drawerIsActive ? 'success' : 'default'}
                  text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>{drawerIsActive ? '已启用' : '已禁用'}</span>}
                />
                <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{tenant.code}</span>
              </div>
            </div>
          </div>
          <div className="tenant-drawer-actions">
            {access.canManagePlatformTenants && (
              <Button size="small" icon={<EditOutlined />} onClick={() => { onClose(); history.push(`/platform/tenants/${tenant.id}/edit`); }}>
                编辑
              </Button>
            )}
            <Button size="small" icon={<TeamOutlined />} onClick={() => { onClose(); history.push(`/platform/tenants/${tenant.id}/members`); }}>
              管理成员
            </Button>
            {access.canManagePlatformTenants && (
              <Popconfirm title="确认删除此租户？" description="删除后无法恢复" onConfirm={() => onDelete(undefined, tenant)}>
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            )}
          </div>
        </div>

        <div className="tenant-drawer-body">
          <div className="tenant-drawer-card">
            <div className="tenant-drawer-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CodeOutlined className="tenant-drawer-card-header-icon" />
                <span className="tenant-drawer-card-header-title">基础信息</span>
              </div>
            </div>
            <div className="tenant-drawer-card-body">
              <div className="tenant-drawer-grid">
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">租户 ID</span>
                  <Text copyable={{ tooltips: ['复制', '已复制'] }} className="tenant-drawer-field-value" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {tenant.id}
                  </Text>
                </div>
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">租户编码</span>
                  <span className="tenant-drawer-field-value" style={{ fontFamily: 'monospace' }}>{tenant.code}</span>
                </div>
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">状态</span>
                  <Tag color={drawerIsActive ? 'success' : 'default'} style={{ margin: 0 }}>
                    {drawerIsActive ? '已启用' : '已禁用'}
                  </Tag>
                </div>
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">图标</span>
                  <span className="tenant-drawer-field-value">{tenant.icon || '默认'}</span>
                </div>
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">创建时间</span>
                  <span className="tenant-drawer-field-value" style={{ fontSize: 12 }}>
                    {tenant.created_at ? dayjs(tenant.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </span>
                </div>
                <div className="tenant-drawer-field">
                  <span className="tenant-drawer-field-label">更新时间</span>
                  <span className="tenant-drawer-field-value" style={{ fontSize: 12 }}>
                    {tenant.updated_at ? dayjs(tenant.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </span>
                </div>
              </div>
              {tenant.description && (
                <div style={{ paddingTop: 8, borderTop: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>描述</span>
                  <span style={{ fontSize: 13, color: '#595959', lineHeight: 1.6 }}>{tenant.description}</span>
                </div>
              )}
            </div>
          </div>

          <div className="tenant-drawer-card">
            <div className="tenant-drawer-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CrownOutlined className="tenant-drawer-card-header-icon" />
                <span className="tenant-drawer-card-header-title">成员统计</span>
              </div>
              <span className="tenant-drawer-card-header-count">
                {membersLoadFailed ? '加载失败' : `${members.length} 人`}
              </span>
            </div>
            <div className="tenant-drawer-card-body">
              {membersLoadFailed ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="成员统计加载失败，请稍后重试" style={{ padding: '12px 0' }} />
              ) : (
                <div className="tenant-drawer-stat-grid">
                  <div className="tenant-drawer-stat-item">
                    <div className="tenant-drawer-stat-value" style={{ color: '#597ef7' }}>{adminCount}</div>
                    <div className="tenant-drawer-stat-label">管理员</div>
                  </div>
                  <div className="tenant-drawer-stat-item">
                    <div className="tenant-drawer-stat-value" style={{ color: '#85a5ff' }}>{operatorCount}</div>
                    <div className="tenant-drawer-stat-label">操作员</div>
                  </div>
                  <div className="tenant-drawer-stat-item">
                    <div className="tenant-drawer-stat-value" style={{ color: '#8c8c8c' }}>{otherRoleCount}</div>
                    <div className="tenant-drawer-stat-label">其他角色</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="tenant-drawer-card">
            <div className="tenant-drawer-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TeamOutlined className="tenant-drawer-card-header-icon" />
                <span className="tenant-drawer-card-header-title">成员列表</span>
              </div>
              <Button size="small" type="primary" icon={<SettingOutlined />} onClick={() => { onClose(); history.push(`/platform/tenants/${tenant.id}/members`); }}>
                管理
              </Button>
            </div>
            <Spin spinning={membersLoading}>
              {membersLoadFailed && !membersLoading ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="成员加载失败，请稍后重试" style={{ padding: '24px 0' }} />
              ) : members.length === 0 && !membersLoading ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无成员" style={{ padding: '24px 0' }} />
              ) : (
                <Table
                  dataSource={members}
                  columns={memberColumns}
                  rowKey={getTenantMemberRowKey}
                  pagination={false}
                  size="small"
                  virtual
                  scroll={{ x: 480, y: 300 }}
                  className="tenant-drawer-member-table"
                />
              )}
            </Spin>
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

export default PlatformTenantDetailDrawer;
