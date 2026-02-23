import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAccess, history } from '@umijs/max';
import {
    Tag, Space, message, Popconfirm, Tooltip, Typography, Button,
    Modal, Form, Input, Switch, Drawer, Descriptions, Avatar, Divider, Badge,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
    UserOutlined, StopOutlined, CheckCircleOutlined, MailOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import { getUsers, deleteUser, resetUserPassword, updateUser } from '@/services/auto-healing/users';
import { getRoles } from '@/services/auto-healing/roles';
import { USER_STATUS_OPTIONS, USER_STATUS_MAP } from '@/constants/commonDicts';
import dayjs from 'dayjs';

const { Text } = Typography;

/* ========== 搜索字段配置 ========== */
const searchFields: SearchField[] = [
    { key: 'username', label: '用户名' },
    { key: 'email', label: '邮箱' },
    { key: 'display_name', label: '显示名称' },
    { key: 'user_id', label: '用户 ID' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'username', label: '用户名', type: 'input', placeholder: '输入用户名' },
    { key: 'email', label: '邮箱', type: 'input', placeholder: '输入邮箱' },
    { key: 'display_name', label: '显示名称', type: 'input', placeholder: '输入显示名称' },
    { key: 'user_id', label: '用户 ID', type: 'input', placeholder: '输入用户 ID' },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

/* ========== 用户管理页面 ========== */
const UsersPage: React.FC = () => {
    const access = useAccess();

    /* ---- 动态角色列表（用于筛选） ---- */
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        getRoles().then((res: any) => {
            const items = res?.data || res?.items || [];
            setRoleOptions(items.map((r: any) => ({ label: r.display_name || r.name, value: r.id })));
        }).catch(() => { });
    }, []);

    /* ---- 详情 Drawer ---- */
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<any>(null);

    const openDetailDrawer = useCallback((record: any) => {
        setDetailUser(record);
        setDetailDrawerOpen(true);
    }, []);

    /* ---- 重置密码 Modal ---- */
    const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [resetPwdForm] = Form.useForm();

    // 触发 StandardTable 重新加载
    const refreshCountRef = useRef(0);
    const [, forceUpdate] = useState(0);

    const triggerRefresh = useCallback(() => {
        refreshCountRef.current += 1;
        forceUpdate(n => n + 1);
    }, []);

    /* ---- 切换用户启用/禁用（乐观更新，不刷整表） ---- */
    const handleToggleStatus = useCallback(async (record: any) => {
        const oldStatus = record.status;
        const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
        // 乐观更新
        record.status = newStatus;
        forceUpdate(n => n + 1);
        try {
            await updateUser(record.id, { status: newStatus });
            message.success(newStatus === 'active' ? '已启用' : '已禁用');
        } catch {
            // 回滚
            record.status = oldStatus;
            forceUpdate(n => n + 1);
            message.error('状态切换失败');
        }
    }, []);

    /* ========== 列定义 ========== */
    const columns: StandardColumnDef<any>[] = [
        {
            columnKey: 'username',
            columnTitle: '用户名 / ID',
            fixedColumn: true,
            dataIndex: 'username',
            width: 160,
            sorter: true,
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }}
                    >
                        {record.username}
                    </a>
                    <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                        {record.user_id || record.id || '-'}
                    </span>
                </div>
            ),
        },
        {
            columnKey: 'display_name',
            columnTitle: '显示名称',
            dataIndex: 'display_name',
            width: 120,
            sorter: true,
            ellipsis: true,
            render: (_: any, record: any) => record.display_name || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'email',
            columnTitle: '邮箱',
            dataIndex: 'email',
            width: 200,
            sorter: true,
            ellipsis: true,
        },
        {
            columnKey: 'roles',
            columnTitle: '角色',
            dataIndex: 'roles',
            width: 180,
            headerFilters: roleOptions,
            render: (_: any, record: any) => {
                const roles = record.roles || [];
                if (roles.length === 0) return <Text type="secondary">无角色</Text>;
                return (
                    <Space size={[4, 4]} wrap>
                        {roles.map((role: any) => (
                            <Tag key={role.id} color={role.is_system ? 'blue' : 'default'}>
                                {role.display_name || role.name}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 80,
            sorter: true,
            headerFilters: USER_STATUS_OPTIONS,
            render: (_: any, record: any) => {
                const info = USER_STATUS_MAP[record.status] || USER_STATUS_MAP['inactive'];
                return (
                    <Tag color={info.tagColor}>
                        {info.label}
                    </Tag>
                );
            },
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: any) =>
                record.created_at
                    ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')
                    : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 140,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Tooltip title={record.status === 'active' ? '禁用' : '启用'}>
                        <Switch
                            size="small"
                            checked={record.status === 'active'}
                            onChange={() => handleToggleStatus(record)}
                            disabled={!access.canUpdateUser}
                        />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button
                            type="link" size="small" icon={<EditOutlined />}
                            disabled={!access.canUpdateUser}
                            onClick={() => history.push(`/system/users/${record.id}/edit`)}
                        />
                    </Tooltip>
                    <Tooltip title="重置密码">
                        <Button
                            type="link" size="small" icon={<KeyOutlined />}
                            disabled={!access.canResetPassword}
                            onClick={() => {
                                setCurrentUser(record);
                                resetPwdForm.resetFields();
                                setResetPwdModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Popconfirm title="确定要删除此用户吗？" onConfirm={async () => {
                        try { await deleteUser(record.id); message.success('删除成功'); triggerRefresh(); }
                        catch { message.error('删除失败'); }
                    }}>
                        <Tooltip title="删除">
                            <Button type="link" size="small" danger disabled={!access.canDeleteUser} icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    /* ========== 数据请求 ========== */
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const apiParams: Record<string, any> = {
            page: params.page,
            page_size: params.pageSize,
        };

        // 简单搜索
        if (params.searchValue) {
            if (params.searchField) {
                apiParams[params.searchField] = params.searchValue;
            } else {
                apiParams.username = params.searchValue;
            }
        }

        // 高级搜索
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            // 特殊字段映射
            if (adv.user_id) apiParams.user_id = adv.user_id;
            if (adv.roles) apiParams.role_id = adv.roles;
            if (adv.created_at && adv.created_at[0] && adv.created_at[1]) {
                apiParams.created_from = adv.created_at[0].toISOString();
                apiParams.created_to = adv.created_at[1].toISOString();
            }
            // 通用字段传递（支持 __exact 后缀）
            const specialKeys = ['user_id', 'roles', 'created_at'];
            Object.entries(adv).forEach(([key, value]) => {
                if (specialKeys.includes(key) || value === undefined || value === null || value === '') return;
                apiParams[key] = value;
            });
        }

        // 排序
        if (params.sorter) {
            apiParams.sort_field = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getUsers(apiParams);
        const items = res?.data || (res as any)?.items || [];
        const total = (res as any)?.pagination?.total ?? (res as any)?.total ?? 0;
        return { data: items, total };
    }, []);

    /* ========== 头部图标 ========== */
    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="36" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M39 36c0-5-3-9-7-11" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>
    );

    return (
        <>
            <StandardTable<any>
                key={refreshCountRef.current}
                tabs={[{ key: 'list', label: '用户列表' }]}
                title="用户管理"
                description="管理系统用户、角色分配及账户状态。支持创建、编辑、禁用用户以及重置密码等操作。"
                headerIcon={headerIcon}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                primaryActionLabel="创建用户"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateUser}
                onPrimaryAction={() => history.push('/system/users/create')}
                columns={columns}
                rowKey="id"
                onRowClick={(record) => openDetailDrawer(record)}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="user_list"
            />

            {/* 详情 Drawer */}
            <Drawer
                title={null}
                size={520}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            >
                {detailUser && (
                    <>
                        {/* 头部 */}
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Avatar size={44} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                                        {detailUser.display_name || detailUser.username}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>@{detailUser.username}</Text>
                                </div>
                                <Badge
                                    status={(USER_STATUS_MAP[detailUser.status]?.badge || 'default') as any}
                                    text={USER_STATUS_MAP[detailUser.status]?.label || detailUser.status}
                                />
                            </div>
                            <Space size={8}>
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<EditOutlined />}
                                    disabled={!access.canUpdateUser}
                                    onClick={() => { setDetailDrawerOpen(false); history.push(`/system/users/${detailUser.id}/edit`); }}
                                >
                                    编辑
                                </Button>
                                <Button
                                    size="small"
                                    icon={<KeyOutlined />}
                                    disabled={!access.canResetPassword}
                                    onClick={() => { setCurrentUser(detailUser); resetPwdForm.resetFields(); setResetPwdModalOpen(true); }}
                                >
                                    重置密码
                                </Button>
                                <Button
                                    size="small"
                                    icon={detailUser.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                                    disabled={!access.canUpdateUser}
                                    onClick={async () => {
                                        await handleToggleStatus(detailUser);
                                        setDetailUser({ ...detailUser, status: detailUser.status === 'active' ? 'inactive' : 'active' });
                                    }}
                                >
                                    {detailUser.status === 'active' ? '禁用' : '启用'}
                                </Button>
                                <Popconfirm
                                    title="确定要删除此用户吗？"
                                    onConfirm={async () => {
                                        try {
                                            await deleteUser(detailUser.id);
                                            message.success('删除成功');
                                            setDetailDrawerOpen(false);
                                            triggerRefresh();
                                        } catch { message.error('删除失败'); }
                                    }}
                                >
                                    <Button size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeleteUser}>
                                        删除
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>

                        {/* 详细信息 */}
                        <div style={{ padding: '16px 24px' }}>
                            {/* 基本信息 */}
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>基本信息</Text>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户名</Text>
                                    <Text strong>{detailUser.username}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>显示名称</Text>
                                    <Text strong>{detailUser.display_name || '—'}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                        <MailOutlined style={{ marginRight: 4 }} />邮箱
                                    </Text>
                                    <Text copyable={!!detailUser.email}>{detailUser.email || '—'}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户 ID</Text>
                                    <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                        {detailUser.id}
                                    </Text>
                                </div>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* 角色分配 */}
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>角色分配</Text>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                {detailUser.roles && detailUser.roles.length > 0 ? (
                                    <Space size={[6, 6]} wrap>
                                        {detailUser.roles.map((r: any) => (
                                            <Tag
                                                key={r.id}
                                                color={r.is_system ? 'blue' : 'default'}
                                                style={{ padding: '2px 10px', fontSize: 13 }}
                                            >
                                                {r.display_name || r.name}
                                            </Tag>
                                        ))}
                                    </Space>
                                ) : (
                                    <Text type="secondary" style={{ fontStyle: 'italic' }}>未分配任何角色</Text>
                                )}
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* 时间信息 */}
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />时间信息
                                </Text>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>创建时间</Text>
                                    <Text style={{ fontSize: 13 }}>
                                        {detailUser.created_at ? dayjs(detailUser.created_at).format('YYYY-MM-DD HH:mm') : '—'}
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>更新时间</Text>
                                    <Text style={{ fontSize: 13 }}>
                                        {detailUser.updated_at ? dayjs(detailUser.updated_at).format('YYYY-MM-DD HH:mm') : '—'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Drawer>

            {/* 重置密码弹窗 — 新密码 + 确认密码 */}
            <Modal
                title={`重置密码 - ${currentUser?.username}`}
                open={resetPwdModalOpen}
                centered
                onCancel={() => setResetPwdModalOpen(false)}
                onOk={async () => {
                    if (!currentUser) return;
                    const values = await resetPwdForm.validateFields();
                    try { await resetUserPassword(currentUser.id, { new_password: values.new_password }); message.success('密码重置成功'); setResetPwdModalOpen(false); }
                    catch { message.error('重置失败'); }
                }}
                destroyOnHidden
            >
                <Form form={resetPwdForm} layout="vertical">
                    <Form.Item
                        name="new_password"
                        label="新密码"
                        rules={[{ required: true, min: 8, message: '密码至少8位' }]}
                    >
                        <Input.Password placeholder="请输入新密码（至少8位）" />
                    </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        label="确认密码"
                        dependencies={['new_password']}
                        rules={[
                            { required: true, message: '请再次输入密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('new_password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="请再次输入密码" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default UsersPage;
