import React from 'react';
import { history } from '@umijs/max';
import { AppstoreOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, SafetyCertificateOutlined, SecurityScanOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Drawer, Popconfirm, Space, Spin, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { deleteRole } from '@/services/auto-healing/roles';
import { PERMISSION_MODULE_LABELS as MODULE_LABELS } from '@/constants/permissionDicts';
import { groupRolePermissions } from './rolePageTypes';
import type { RoleDrawerDetail } from './rolePageTypes';

const { Text } = Typography;

type RoleAccess = {
    canUpdateRole: boolean;
    canDeleteRole: boolean;
};

type RoleDetailDrawerProps = {
    open: boolean;
    role: RoleDrawerDetail | null;
    loading: boolean;
    access: RoleAccess;
    onClose: () => void;
    onDeleted: () => void;
};

const RoleDetailDrawer: React.FC<RoleDetailDrawerProps> = ({ open, role, loading, access, onClose, onDeleted }) => {
    return (
        <Drawer
            title={null}
            size={560}
            open={open}
            onClose={onClose}
            styles={{ header: { display: 'none' }, body: { padding: 0 } }}
        >
            <Spin spinning={loading}>
                {role && (
                    <>
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Avatar size={44} icon={<SafetyCertificateOutlined />} style={{ backgroundColor: '#13c2c2' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{role.display_name || role.name}</div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>@{role.name}</Text>
                                </div>
                                <Tag color={role.is_system ? 'blue' : 'default'}>
                                    {role.is_system ? '系统角色' : '自定义角色'}
                                </Tag>
                            </div>
                            <Space size={8}>
                                <Button
                                    size="small"
                                    icon={<UsergroupAddOutlined />}
                                    disabled={!access.canUpdateRole}
                                    onClick={() => {
                                        onClose();
                                        history.push(`/system/roles/${role.id}/edit`);
                                    }}
                                >
                                    分配用户
                                </Button>
                                <Button
                                    size="small"
                                    icon={<AppstoreOutlined />}
                                    disabled={!access.canUpdateRole}
                                    onClick={() => {
                                        onClose();
                                        history.push(`/system/roles/${role.id}/edit`);
                                    }}
                                >
                                    分配工作区
                                </Button>
                                {!role.is_system && (
                                    <>
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            disabled={!access.canUpdateRole}
                                            onClick={() => {
                                                onClose();
                                                history.push(`/system/roles/${role.id}/edit`);
                                            }}
                                        >
                                            编辑
                                        </Button>
                                        <Popconfirm
                                            title="确定要删除此角色吗？"
                                            onConfirm={async () => {
                                                try {
                                                    await deleteRole(role.id);
                                                    message.success('删除成功');
                                                    onClose();
                                                    onDeleted();
                                                } catch {
                                                    /* global error handler */
                                                }
                                            }}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeleteRole}>
                                                删除
                                            </Button>
                                        </Popconfirm>
                                    </>
                                )}
                            </Space>
                        </div>

                        <div style={{ padding: '16px 24px' }}>
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>基本信息</Text>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色标识</Text>
                                    <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                        {role.name}
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色名称</Text>
                                    <Text strong>{role.display_name || '—'}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户数</Text>
                                    <Text strong>{role.user_count ?? 0} 人</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色 ID</Text>
                                    <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                        {role.id}
                                    </Text>
                                </div>
                                {role.description && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>描述</Text>
                                        <Text>{role.description}</Text>
                                    </div>
                                )}
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <SecurityScanOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    权限分配 ({role.permissions?.length || 0})
                                </Text>
                            </div>
                            {role.permissions && role.permissions.length > 0 ? (
                                Object.entries(groupRolePermissions(role.permissions)).map(([moduleName, permissions]) => (
                                    <div
                                        key={moduleName}
                                        style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', border: '1px solid #f0f0f0' }}
                                    >
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                            {MODULE_LABELS[moduleName] || moduleName} ({permissions.length})
                                        </Text>
                                        <Space size={[4, 4]} wrap>
                                            {permissions.map((permission) => (
                                                <Tag key={permission.id} style={{ fontSize: 12, margin: 0, padding: '1px 8px' }}>
                                                    {permission.name}
                                                </Tag>
                                            ))}
                                        </Space>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary" style={{ fontStyle: 'italic' }}>未分配任何权限</Text>
                            )}

                            <Divider style={{ margin: '12px 0' }} />

                            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AppstoreOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    工作区分配 ({role._workspaceNames?.length || 0})
                                </Text>
                            </div>
                            {role._workspaceNames && role._workspaceNames.length > 0 ? (
                                <Space size={[4, 4]} wrap>
                                    {(() => {
                                        const workspaceNameCounts = new Map<string, number>();
                                        return role._workspaceNames.map((name) => {
                                            const count = (workspaceNameCounts.get(name) || 0) + 1;
                                            workspaceNameCounts.set(name, count);
                                            return (
                                                <Tag key={`${role.id}-${name}-${count}`} style={{ fontSize: 12, margin: 0, padding: '1px 8px' }}>
                                                    {name}
                                                </Tag>
                                            );
                                        });
                                    })()}
                                </Space>
                            ) : (
                                <Text type="secondary" style={{ fontStyle: 'italic' }}>未分配工作区</Text>
                            )}

                            <Divider style={{ margin: '12px 0' }} />

                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />时间信息
                                </Text>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>创建时间</Text>
                                    <Text style={{ fontSize: 13 }}>
                                        {role.created_at ? dayjs(role.created_at).format('YYYY-MM-DD HH:mm') : '—'}
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>更新时间</Text>
                                    <Text style={{ fontSize: 13 }}>
                                        {role.updated_at ? dayjs(role.updated_at).format('YYYY-MM-DD HH:mm') : '—'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Spin>
        </Drawer>
    );
};

export default RoleDetailDrawer;
