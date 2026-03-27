import React from 'react';
import { Badge, Button, Divider, Drawer, Popconfirm, Space, Tag, Typography, Avatar } from 'antd';
import type { BadgeProps } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { USER_STATUS_MAP } from '@/constants/commonDicts';
import { getUserIdentifier, getUserRoles } from './userManagementHelpers';
import type { UserRecord } from './userManagementTypes';

const { Text } = Typography;

type UserDetailDrawerProps = {
  canDeleteUser: boolean;
  canUpdateUser: boolean;
  onClose: () => void;
  onDelete: (user: UserRecord) => Promise<void> | void;
  onEdit: (user: UserRecord) => void;
  open: boolean;
  user: UserRecord | null;
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ marginBottom: 8 }}>
    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </Text>
  </div>
);

const UserHeader: React.FC<
  Pick<UserDetailDrawerProps, 'canDeleteUser' | 'canUpdateUser' | 'onDelete' | 'onEdit'>
  & { user: UserRecord }
> = ({
  canDeleteUser,
  canUpdateUser,
  onDelete,
  onEdit,
  user,
}) => (
  <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <Avatar size={44} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{user.display_name || user.username}</div>
        <Text type="secondary" style={{ fontSize: 13 }}>@{user.username}</Text>
      </div>
      <Badge
        status={(USER_STATUS_MAP[user.status]?.badge || 'default') as BadgeProps['status']}
        text={USER_STATUS_MAP[user.status]?.label || user.status}
      />
    </div>
    <Space size={8}>
      <Button size="small" type="primary" icon={<EditOutlined />} disabled={!canUpdateUser} onClick={() => onEdit(user)}>
        编辑
      </Button>
      <Popconfirm title="确定要删除此用户吗？" onConfirm={() => onDelete(user)}>
        <Button size="small" danger icon={<DeleteOutlined />} disabled={!canDeleteUser}>
          删除
        </Button>
      </Popconfirm>
    </Space>
  </div>
);

const UserBasicInfo: React.FC<{ user: UserRecord }> = ({ user }) => (
  <>
    <SectionTitle>基本信息</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户名</Text>
        <Text strong>{user.username}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>显示名称</Text>
        <Text strong>{user.display_name || '—'}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
          <MailOutlined style={{ marginRight: 4 }} />邮箱
        </Text>
        <Text copyable={!!user.email}>{user.email || '—'}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户 ID</Text>
        <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
          {getUserIdentifier(user)}
        </Text>
      </div>
    </div>
  </>
);

const UserRoleSection: React.FC<{ user: UserRecord }> = ({ user }) => {
  const roles = getUserRoles(user);
  return (
    <>
      <SectionTitle>角色分配</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        {roles.length > 0 ? (
          <Space size={[6, 6]} wrap>
            {roles.map((role) => (
              <Tag key={role.id} color={role.is_system ? 'blue' : 'default'} style={{ padding: '2px 10px', fontSize: 13 }}>
                {role.display_name || role.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontStyle: 'italic' }}>未分配任何角色</Text>
        )}
      </div>
    </>
  );
};

const UserTimeSection: React.FC<{ user: UserRecord }> = ({ user }) => (
  <>
    <SectionTitle>
      <ClockCircleOutlined style={{ marginRight: 4 }} />
      时间信息
    </SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>创建时间</Text>
        <Text style={{ fontSize: 13 }}>{user.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm') : '—'}</Text>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>更新时间</Text>
        <Text style={{ fontSize: 13 }}>{user.updated_at ? dayjs(user.updated_at).format('YYYY-MM-DD HH:mm') : '—'}</Text>
      </div>
    </div>
  </>
);

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = (props) => (
  <Drawer
    title={null}
    size={520}
    open={props.open}
    onClose={props.onClose}
    styles={{ header: { display: 'none' }, body: { padding: 0 } }}
  >
    {props.user && (
      <>
        <UserHeader {...props} user={props.user} />
        <div style={{ padding: '16px 24px' }}>
          <UserBasicInfo user={props.user} />
          <Divider style={{ margin: '12px 0' }} />
          <UserRoleSection user={props.user} />
          <Divider style={{ margin: '12px 0' }} />
          <UserTimeSection user={props.user} />
        </div>
      </>
    )}
  </Drawer>
);

export default UserDetailDrawer;
