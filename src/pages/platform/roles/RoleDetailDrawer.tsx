import React from 'react';
import { Avatar, Badge, Button, Drawer, Empty, Input, Space, Spin, Tag, Typography } from 'antd';
import {
    CloseOutlined,
    IdcardOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    SecurityScanOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PERMISSION_MODULE_LABELS as MODULE_LABELS } from '@/constants/permissionDicts';
import { groupPermissions } from './roleUtils';
import type { PlatformRoleRecord, PlatformRoleUser } from './types';

const { Text } = Typography;

type RoleDetailDrawerProps = {
    open: boolean;
    role: PlatformRoleRecord | null;
    roleLoading: boolean;
    users: PlatformRoleUser[];
    usersLoading: boolean;
    usersLoadFailed: boolean;
    usersTotal: number;
    userSearch: string;
    onClose: () => void;
    onUserSearch: (value: string) => void;
    onLoadMore: () => void;
};

const RoleDetailDrawer: React.FC<RoleDetailDrawerProps> = ({
    open,
    role,
    roleLoading,
    users,
    usersLoading,
    usersLoadFailed,
    usersTotal,
    userSearch,
    onClose,
    onUserSearch,
    onLoadMore,
}) => {
    if (!role) {
        return null;
    }

    const permissions = role.permissions || [];
    const groupedPermissions = groupPermissions(permissions);

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={520}
            title={null}
            closable={false}
            styles={{ body: { padding: 0, background: '#fafafa' }, header: { display: 'none' } }}
        >
            <Spin spinning={roleLoading}>
                <div className="role-drawer-header">
                    <div className="role-drawer-header-top">
                        <div className="role-drawer-header-icon">
                            <SafetyCertificateOutlined />
                        </div>
                        <div className="role-drawer-header-info">
                            <div className="role-drawer-title">{role.display_name}</div>
                            <div className="role-drawer-sub">
                                <IdcardOutlined style={{ marginRight: 4 }} />
                                {role.name}
                            </div>
                        </div>
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={onClose}
                            style={{ flexShrink: 0, color: '#8c8c8c' }}
                        />
                    </div>
                </div>

                <div className="role-drawer-body">
                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <SafetyCertificateOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">基本信息</span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            <div className="role-drawer-grid">
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">角色名称</span>
                                    <span className="role-drawer-field-value">{role.display_name}</span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">角色标识</span>
                                    <span className="role-drawer-field-value" style={{ fontFamily: 'monospace' }}>
                                        {role.name}
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">类型</span>
                                    <span className="role-drawer-field-value">
                                        <Tag color={role.is_system ? 'blue' : 'default'}>
                                            {role.is_system ? '系统角色' : '自定义角色'}
                                        </Tag>
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">作用域</span>
                                    <span className="role-drawer-field-value">
                                        <Tag color="purple">平台级</Tag>
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">用户数</span>
                                    <span className="role-drawer-field-value">
                                        <Badge
                                            count={role.user_count ?? 0}
                                            showZero
                                            color={role.user_count && role.user_count > 0 ? '#1677ff' : '#d9d9d9'}
                                        />
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">权限数</span>
                                    <span className="role-drawer-field-value">
                                        <Badge
                                            count={role.permission_count ?? 0}
                                            showZero
                                            color={role.permission_count && role.permission_count > 0 ? '#52c41a' : '#d9d9d9'}
                                        />
                                    </span>
                                </div>
                                <div className="role-drawer-field" style={{ gridColumn: '1 / -1' }}>
                                    <span className="role-drawer-field-label">描述</span>
                                    <span className="role-drawer-field-value">{role.description || '-'}</span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">创建时间</span>
                                    <span className="role-drawer-field-value">
                                        {role.created_at ? dayjs(role.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">更新时间</span>
                                    <span className="role-drawer-field-value">
                                        {role.updated_at ? dayjs(role.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <TeamOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">关联用户 ({role.user_count ?? 0})</span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            {role.user_count && role.user_count > 0 && (
                                <Input.Search
                                    placeholder="搜索用户名 / 显示名"
                                    allowClear
                                    size="small"
                                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                    onSearch={onUserSearch}
                                    style={{ marginBottom: 8 }}
                                />
                            )}

                            {usersLoading && users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 16 }}>
                                    <Spin size="small" />
                                </div>
                            ) : users.length === 0 && !usersLoading ? (
                                <Empty
                                    description={usersLoadFailed ? '关联用户加载失败，请刷新页面重试' : userSearch ? '未找到匹配用户' : '暂无关联用户'}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            ) : (
                                <>
                                    <div className="role-users-scroll">
                                        {users.map((user) => (
                                            <div className="role-user-row" key={user.id}>
                                                <Avatar
                                                    size={28}
                                                    icon={<UserOutlined />}
                                                    style={{ background: '#6B7A90', flexShrink: 0 }}
                                                />
                                                <div className="role-user-info">
                                                    <div className="role-user-name">
                                                        {user.display_name || user.username}
                                                    </div>
                                                    <div className="role-user-meta">
                                                        {user.username}
                                                        {user.email ? ` · ${user.email}` : ''}
                                                    </div>
                                                </div>
                                                <Tag
                                                    color={user.status === 'active' ? 'green' : 'default'}
                                                    style={{ fontSize: 11, margin: 0, flexShrink: 0 }}
                                                >
                                                    {user.status === 'active' ? '活跃' : '未激活'}
                                                </Tag>
                                            </div>
                                        ))}
                                    </div>
                                    {users.length < usersTotal && (
                                        <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
                                            <Button
                                                type="link"
                                                size="small"
                                                loading={usersLoading}
                                                onClick={onLoadMore}
                                            >
                                                加载更多 ({users.length}/{usersTotal})
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <SecurityScanOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">权限列表 ({permissions.length})</span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            {Object.keys(groupedPermissions).length === 0 ? (
                                <Empty description="暂无权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                                    <div key={moduleName} style={{ marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4, display: 'block' }}>
                                            {MODULE_LABELS[moduleName] || moduleName}
                                        </Text>
                                        <div className="role-perm-list">
                                            {modulePermissions.map((permission) => (
                                                <span key={permission.code} className="role-perm-tag">
                                                    {permission.name || permission.code}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Spin>
        </Drawer>
    );
};

export default RoleDetailDrawer;
