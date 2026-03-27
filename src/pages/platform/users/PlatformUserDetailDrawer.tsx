import React from 'react';
import { Badge, Button, Drawer, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import type { BadgeProps } from 'antd';
import {
  CheckCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  IdcardOutlined,
  LockOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPlatformUserName, getPlatformUserStatusInfo, getUserRoles } from './platformUserHelpers';
import type { PlatformUserRecord } from './platformUserManagementTypes';

const { Text } = Typography;

type PlatformUserDetailDrawerProps = {
  canDeletePlatformUser: boolean;
  canResetPlatformPassword: boolean;
  canUpdatePlatformUser: boolean;
  loading: boolean;
  onClose: () => void;
  onDelete: (user: PlatformUserRecord) => Promise<void> | void;
  onEdit: (user: PlatformUserRecord) => void;
  onResetPassword: (user: PlatformUserRecord) => void;
  onToggleStatus: (user: PlatformUserRecord) => Promise<void> | void;
  open: boolean;
  protectLastAdmin: (user: PlatformUserRecord) => boolean;
  user: PlatformUserRecord | null;
};

const DrawerHeader: React.FC<
  Pick<PlatformUserDetailDrawerProps, 'canDeletePlatformUser' | 'canResetPlatformPassword' | 'canUpdatePlatformUser' | 'onDelete' | 'onEdit' | 'onResetPassword' | 'protectLastAdmin'>
  & { user: PlatformUserRecord }
> = ({
  canDeletePlatformUser,
  canResetPlatformPassword,
  canUpdatePlatformUser,
  onDelete,
  onEdit,
  onResetPassword,
  protectLastAdmin,
  user,
}) => {
  const statusInfo = getPlatformUserStatusInfo(user.status);
  return (
    <div className="user-drawer-header">
      <div className="user-drawer-header-top">
        <div className="user-drawer-header-avatar">{getPlatformUserName(user)[0]?.toUpperCase() || 'U'}</div>
        <div className="user-drawer-header-info">
          <div className="user-drawer-title">{getPlatformUserName(user)}</div>
          <div className="user-drawer-sub">
            <Badge
              status={statusInfo.badge as BadgeProps['status']}
              text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>{statusInfo.label}</span>}
            />
            <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>@{user.username}</span>
          </div>
        </div>
      </div>
      <div className="user-drawer-actions">
        {canUpdatePlatformUser && (
          protectLastAdmin(user) ? (
            <Tooltip title="最后一个平台管理员，无法编辑">
              <Button size="small" icon={<EditOutlined />} disabled>编辑</Button>
            </Tooltip>
          ) : (
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(user)}>编辑</Button>
          )
        )}
        {canResetPlatformPassword && (
          <Button size="small" icon={<LockOutlined />} onClick={() => onResetPassword(user)}>
            重置密码
          </Button>
        )}
        {canDeletePlatformUser && (
          protectLastAdmin(user) ? (
            <Tooltip title="最后一个平台管理员，无法删除">
              <Button size="small" danger icon={<DeleteOutlined />} disabled>删除</Button>
            </Tooltip>
          ) : (
            <Popconfirm title="确认删除该平台用户？" description="删除后不可恢复" onConfirm={() => onDelete(user)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )
        )}
      </div>
    </div>
  );
};

const BasicInfoSection: React.FC<{ user: PlatformUserRecord }> = ({ user }) => {
  const statusInfo = getPlatformUserStatusInfo(user.status);
  return (
    <div className="user-drawer-card">
      <div className="user-drawer-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IdcardOutlined className="user-drawer-card-header-icon" />
          <span className="user-drawer-card-header-title">基本信息</span>
        </div>
      </div>
      <div className="user-drawer-card-body">
        <div className="user-drawer-grid">
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">用户 ID</span>
            <Text copyable={{ tooltips: ['复制', '已复制'] }} className="user-drawer-field-value" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {user.id}
            </Text>
          </div>
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">用户名</span>
            <span className="user-drawer-field-value" style={{ fontFamily: 'monospace' }}>@{user.username}</span>
          </div>
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">显示名</span>
            <span className="user-drawer-field-value">{user.display_name || '-'}</span>
          </div>
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">邮箱</span>
            <span className="user-drawer-field-value">{user.email || '-'}</span>
          </div>
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">状态</span>
            <Tag color={statusInfo.tagColor} style={{ margin: 0 }}>{statusInfo.label}</Tag>
          </div>
          <div className="user-drawer-field">
            <span className="user-drawer-field-label">创建时间</span>
            <span className="user-drawer-field-value" style={{ fontSize: 12 }}>
              {user.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleSection: React.FC<{ user: PlatformUserRecord }> = ({ user }) => {
  const roles = getUserRoles(user);
  return (
    <div className="user-drawer-card">
      <div className="user-drawer-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CrownOutlined className="user-drawer-card-header-icon" />
          <span className="user-drawer-card-header-title">角色与权限</span>
        </div>
      </div>
      <div className="user-drawer-card-body">
        {roles.length > 0 ? (
          <Space wrap size={6}>
            {roles.map((role) => (
              <Tag
                key={role.id}
                color={role.name === 'platform_admin' ? 'gold' : 'cyan'}
                icon={role.name === 'platform_admin' ? <CrownOutlined /> : undefined}
                style={{ fontSize: 12 }}
              >
                {role.display_name || role.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>暂无角色分配</Text>
        )}
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#f6f8fa',
            border: '1px solid #e8e8e8',
            fontSize: 12,
            color: '#8c8c8c',
            lineHeight: 1.7,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <b style={{ color: '#1a1a1a' }}>平台用户权限</b>
          </div>
          该账号持有平台级角色，可根据角色权限访问平台管理功能。
          <br />
          <StopOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
          租户内部用户管理由租户 admin 自治。
        </div>
      </div>
    </div>
  );
};

const PlatformUserDetailDrawer: React.FC<PlatformUserDetailDrawerProps> = (props) => (
  <Drawer
    open={props.open}
    onClose={props.onClose}
    size={520}
    closable
    destroyOnHidden
    styles={{ header: { display: 'none' }, body: { padding: 0 } }}
  >
    {props.user && (
      <Spin spinning={props.loading}>
        <DrawerHeader {...props} user={props.user} />
        <div className="user-drawer-body">
          <BasicInfoSection user={props.user} />
          <RoleSection user={props.user} />
        </div>
      </Spin>
    )}
  </Drawer>
);

export default PlatformUserDetailDrawer;
