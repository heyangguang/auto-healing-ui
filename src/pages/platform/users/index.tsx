import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Button, Space, Tooltip, message, Switch,
    Popconfirm, Spin, Empty, Pagination, Row, Col, Typography,
    Drawer, Tag, Badge, Modal, Form, Input,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    CrownOutlined, UserOutlined,
    CheckCircleOutlined, ClockCircleOutlined, MailOutlined,
    LockOutlined, IdcardOutlined, StopOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    getPlatformUsers, deletePlatformUser, getPlatformUser, resetPlatformUserPassword, updatePlatformUser,
} from '@/services/auto-healing/platform/users';
import { USER_STATUS_MAP } from '@/constants/commonDicts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './users.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const searchFields: SearchField[] = [
    { key: 'username', label: '用户名' },
    { key: 'display_name', label: '显示名' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    {
        key: 'status', label: '状态', type: 'select',
        options: [
            { label: '活跃', value: 'active' },
            { label: '锁定', value: 'locked' },
            { label: '停用', value: 'inactive' },
        ],
    },
    { key: 'email', label: '邮箱', type: 'input', placeholder: '搜索邮箱' },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

const headerIcon = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="20" cy="18" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M34 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

/* ===================================================
   平台用户管理页 — 深青石卡片 + 详情抽屉
   =================================================== */
const PlatformUsersPage: React.FC = () => {
    const access = useAccess();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [total, setTotal] = useState(0);
    const [searchValue, setSearchValue] = useState('');

    // Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerUser, setDrawerUser] = useState<any>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    // Reset Password Modal
    const [resetPwdOpen, setResetPwdOpen] = useState(false);
    const [resetPwdForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async (p: number, ps: number, value?: string, field?: string, advanced?: Record<string, any>) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page: p, page_size: ps };
            if (value?.trim()) {
                const key = field || 'username';
                params[key] = value.trim();
            }
            if (advanced) {
                if (advanced.status) params.status = advanced.status;
                if (advanced.email) params.email = advanced.email;
                if (advanced.created_at) {
                    const [from, to] = advanced.created_at;
                    if (from) params.created_from = dayjs(from).format('YYYY-MM-DD');
                    if (to) params.created_to = dayjs(to).format('YYYY-MM-DD');
                }
            }
            const res = await getPlatformUsers(params);
            const list = (res as any)?.data || [];
            const tot = (res as any)?.total || list.length;
            setData(list);
            setTotal(tot);
            if (p === 1 && !value?.trim() && !advanced) {
                const activeCount = list.filter((u: any) => u.status === 'active').length;
                setStats({ total: tot, active: activeCount, inactive: tot - activeCount });
            }
        } catch {
            message.error('加载用户列表失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(1, pageSize);
    }, []);

    const [searchField, setSearchField] = useState('username');

    const handleSearch = useCallback((params: { searchField?: string; searchValue?: string; advancedSearch?: Record<string, any> }) => {
        const value = params.searchValue || '';
        const field = params.searchField || 'username';
        setSearchValue(value);
        setSearchField(field);
        setPage(1);
        loadData(1, pageSize, value, field, params.advancedSearch);
    }, [pageSize, loadData]);

    // ==================== Drawer ====================
    const openDrawer = useCallback(async (user: any) => {
        setDrawerOpen(true);
        setDrawerUser(user);
        setDrawerLoading(true);
        try {
            const res = await getPlatformUser(user.id);
            setDrawerUser((res as any)?.data || res);
        } catch { /* keep basic */ }
        finally { setDrawerLoading(false); }
    }, []);

    const closeDrawer = () => { setDrawerOpen(false); setDrawerUser(null); };

    // ==================== Actions ====================
    const handleDelete = async (e: React.MouseEvent | undefined, user: any) => {
        e?.stopPropagation();
        try {
            await deletePlatformUser(user.id);
            message.success('已删除平台用户');
            setDrawerOpen(false);
            // 乐观更新：直接从列表移除，不重新加载
            setData(prev => prev.filter(u => u.id !== user.id));
            setTotal(prev => prev - 1);
            setStats(prev => ({
                ...prev,
                total: prev.total - 1,
                ...(user.status === 'active'
                    ? { active: prev.active - 1 }
                    : { inactive: prev.inactive - 1 }),
            }));
        } catch (err: any) {
            message.error(err?.response?.data?.message || '删除失败');
        }
    };

    const handleResetPwd = async (values: any) => {
        if (!drawerUser) return;
        setSubmitting(true);
        try {
            await resetPlatformUserPassword(drawerUser.id, { new_password: values.new_password });
            message.success('密码重置成功');
            setResetPwdOpen(false);
            resetPwdForm.resetFields();
        } catch {
            message.error('密码重置失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (e: any, user: any) => {
        e?.stopPropagation?.();
        const originalStatus = user.status;
        const newStatus = (originalStatus === 'active') ? 'inactive' : 'active';
        // 乐观更新：立即刷新 UI
        setData(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        if (drawerUser?.id === user.id) {
            setDrawerUser((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        }
        try {
            await updatePlatformUser(user.id, { status: newStatus } as any);
            message.success(newStatus === 'active' ? '已启用' : '已禁用');
            setStats(prev => ({
                ...prev,
                active: newStatus === 'active' ? prev.active + 1 : prev.active - 1,
                inactive: newStatus === 'active' ? prev.inactive - 1 : prev.inactive + 1,
            }));
        } catch {
            // 回滚
            setData(prev => prev.map(u => u.id === user.id ? { ...u, status: originalStatus } : u));
            if (drawerUser?.id === user.id) {
                setDrawerUser((prev: any) => prev ? { ...prev, status: originalStatus } : prev);
            }
            message.error('操作失败');
        }
    };

    // ==================== User Card ====================
    const renderUserCard = (user: any) => {
        const isActive = user.status === 'active';
        const statusInfo = USER_STATUS_MAP[user.status] || USER_STATUS_MAP['inactive'];
        const displayName = user.display_name || user.username;
        const firstLetter = displayName?.[0]?.toUpperCase() || 'U';
        const roles = user.roles || [];

        return (
            <Col key={user.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                <div
                    className={`user-card ${isActive ? 'user-card-active' : 'user-card-inactive'}`}
                    onClick={() => openDrawer(user)}
                >
                    <div className="user-card-body">
                        <div className="user-card-header">
                            <div className="user-card-title-area">
                                <div className="user-card-avatar">{firstLetter}</div>
                                <div className="user-card-title">{displayName}</div>
                            </div>
                            <Space size={4}>
                                {isActive ? (
                                    <span className="user-card-status-active">
                                        <CheckCircleOutlined /> {statusInfo.label}
                                    </span>
                                ) : user.status === 'locked' ? (
                                    <span style={{ color: '#fa8c16', fontSize: 12 }}>
                                        <LockOutlined /> {statusInfo.label}
                                    </span>
                                ) : (
                                    <span className="user-card-status-inactive">{statusInfo.label}</span>
                                )}
                            </Space>
                        </div>

                        <div className="user-card-desc">
                            @{user.username} · {user.email || '未设置邮箱'}
                        </div>

                        <div className="user-card-preview">
                            {roles.length > 0 ? (
                                roles.map((role: any) => (
                                    <span
                                        key={role.id}
                                        className={[
                                            'user-card-role-tag',
                                            role.name === 'platform_admin' ? 'user-card-role-tag-admin' : '',
                                            role.is_system ? 'user-card-role-tag-system' : '',
                                        ].filter(Boolean).join(' ')}
                                    >
                                        {role.name === 'platform_admin' && <CrownOutlined style={{ fontSize: 10 }} />}
                                        {role.display_name || role.name}
                                    </span>
                                ))
                            ) : (
                                <Text type="secondary" style={{ fontSize: 11 }}>暂无角色</Text>
                            )}
                        </div>

                        <div className="user-card-info-grid">
                            <span className="user-card-info-item">
                                <UserOutlined />
                                <span className="info-value">{user.username}</span>
                            </span>
                            <span className="user-card-info-item">
                                <MailOutlined />
                                <span className="info-value">{user.email || '—'}</span>
                            </span>
                            <span className="user-card-info-item">
                                <ClockCircleOutlined />
                                创建 {user.created_at ? dayjs(user.created_at).format('MM/DD') : '-'}
                            </span>
                            <span className="user-card-info-item">
                                <ClockCircleOutlined />
                                更新 {user.updated_at ? dayjs(user.updated_at).fromNow() : '-'}
                            </span>
                        </div>

                        <div className="user-card-footer">
                            <span className="user-card-footer-left">
                                {user.id?.substring(0, 8)}
                            </span>
                            <Space size={0} onClick={e => e.stopPropagation()}>
                                <Tooltip title={isActive ? '禁用' : '启用'}>
                                    <Switch
                                        size="small"
                                        checked={isActive}
                                        onChange={(_, e) => handleToggleStatus(e, user)}
                                    />
                                </Tooltip>
                                {access.canUpdatePlatformUser && (
                                    <Tooltip title="编辑">
                                        <Button type="text" size="small" icon={<EditOutlined />}
                                            onClick={() => history.push(`/platform/users/${user.id}/edit`)}
                                        />
                                    </Tooltip>
                                )}
                                {access.canDeletePlatformUser && (
                                    <Popconfirm
                                        title="确认删除该平台用户？"
                                        description="删除后不可恢复。"
                                        onConfirm={(e) => handleDelete(e as any, user)}
                                        okText="删除" okButtonProps={{ danger: true }}
                                    >
                                        <Tooltip title="删除">
                                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                                        </Tooltip>
                                    </Popconfirm>
                                )}
                            </Space>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    // ==================== Stats Bar ====================
    const statsBar = useMemo(() => {
        const items = [
            { icon: <UserOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '启用' },
            { icon: <UserOutlined />, cls: 'error', val: stats.inactive, lbl: '禁用' },
        ];
        return (
            <div className="git-stats-bar">
                {items.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="git-stat-divider" />}
                        <div className="git-stat-item">
                            <span className={`git-stat-icon git-stat-icon-${s.cls}`}>{s.icon}</span>
                            <div className="git-stat-content">
                                <div className="git-stat-value">{s.val}</div>
                                <div className="git-stat-label">{s.lbl}</div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    }, [stats]);

    // ==================== Drawer Content ====================
    const drawerIsActive = drawerUser?.status === 'active';
    const drawerStatusInfo = USER_STATUS_MAP[drawerUser?.status] || USER_STATUS_MAP['inactive'];
    const drawerName = drawerUser?.display_name || drawerUser?.username || '-';
    const drawerRoles = drawerUser?.roles || [];

    // ==================== Render ====================
    return (
        <>
            <StandardTable<any>
                tabs={[{ key: 'list', label: '平台用户' }]}
                title="平台用户"
                description="管理平台级用户账号，可分配不同平台角色（管理员、运维、审计员等）。租户内普通用户由租户管理员自行管理。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                onSearch={handleSearch}
                primaryActionLabel="新建用户"
                primaryActionIcon={<PlusOutlined />}
                onPrimaryAction={access.canCreatePlatformUser ? () => history.push('/platform/users/create') : undefined}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="加载用户..."><div /></Spin>
                    </div>
                ) : data.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无平台用户</Text>}>
                        <Button type="dashed" onClick={() => history.push('/platform/users/create')}>
                            新建第一个用户
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[20, 20]} className="users-grid">
                            {data.map(renderUserCard)}
                        </Row>
                        <div className="users-pagination">
                            <Pagination
                                current={page} total={total} pageSize={pageSize}
                                onChange={(p, size) => { setPage(p); setPageSize(size); loadData(p, size, searchValue, searchField); }}
                                showSizeChanger pageSizeOptions={['16', '24', '48']}
                                showQuickJumper showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </StandardTable>

            {/* ===== 用户详情 Drawer ===== */}
            <Drawer
                open={drawerOpen}
                onClose={closeDrawer}
                size={520}
                closable
                destroyOnHidden
                styles={{
                    header: { display: 'none' },
                    body: { padding: 0 },
                }}
            >
                {drawerUser && (
                    <Spin spinning={drawerLoading}>
                        {/* Header */}
                        <div className="user-drawer-header">
                            <div className="user-drawer-header-top">
                                <div className="user-drawer-header-avatar">
                                    {drawerName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="user-drawer-header-info">
                                    <div className="user-drawer-title">{drawerName}</div>
                                    <div className="user-drawer-sub">
                                        <Badge
                                            status={drawerStatusInfo.badge as any}
                                            text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>{drawerStatusInfo.label}</span>}
                                        />
                                        <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>@{drawerUser.username}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="user-drawer-actions">
                                {access.canUpdatePlatformUser && (
                                    <Button size="small" icon={<EditOutlined />}
                                        onClick={() => { closeDrawer(); history.push(`/platform/users/${drawerUser.id}/edit`); }}>
                                        编辑
                                    </Button>
                                )}
                                {access.canResetPlatformPassword && (
                                    <Button size="small" icon={<LockOutlined />}
                                        onClick={() => setResetPwdOpen(true)}>
                                        重置密码
                                    </Button>
                                )}
                                {access.canDeletePlatformUser && (
                                    <Popconfirm title="确认删除该平台用户？" description="删除后不可恢复"
                                        onConfirm={(e) => handleDelete(e as any, drawerUser)}>
                                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                                    </Popconfirm>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="user-drawer-body">
                            {/* 基本信息 */}
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
                                            <Text copyable={{ tooltips: ['复制', '已复制'] }}
                                                className="user-drawer-field-value"
                                                style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                {drawerUser.id}
                                            </Text>
                                        </div>
                                        <div className="user-drawer-field">
                                            <span className="user-drawer-field-label">用户名</span>
                                            <span className="user-drawer-field-value" style={{ fontFamily: 'monospace' }}>
                                                @{drawerUser.username}
                                            </span>
                                        </div>
                                        <div className="user-drawer-field">
                                            <span className="user-drawer-field-label">显示名</span>
                                            <span className="user-drawer-field-value">
                                                {drawerUser.display_name || '-'}
                                            </span>
                                        </div>
                                        <div className="user-drawer-field">
                                            <span className="user-drawer-field-label">邮箱</span>
                                            <span className="user-drawer-field-value">
                                                {drawerUser.email || '-'}
                                            </span>
                                        </div>
                                        <div className="user-drawer-field">
                                            <span className="user-drawer-field-label">状态</span>
                                            <Tag color={drawerStatusInfo.tagColor} style={{ margin: 0 }}>
                                                {drawerStatusInfo.label}
                                            </Tag>
                                        </div>
                                        <div className="user-drawer-field">
                                            <span className="user-drawer-field-label">创建时间</span>
                                            <span className="user-drawer-field-value" style={{ fontSize: 12 }}>
                                                {drawerUser.created_at ? dayjs(drawerUser.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 角色 */}
                            <div className="user-drawer-card">
                                <div className="user-drawer-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CrownOutlined className="user-drawer-card-header-icon" />
                                        <span className="user-drawer-card-header-title">角色与权限</span>
                                    </div>
                                </div>
                                <div className="user-drawer-card-body">
                                    {drawerRoles.length > 0 ? (
                                        <Space wrap size={6}>
                                            {drawerRoles.map((role: any) => (
                                                <Tag key={role.id}
                                                    color={role.name === 'platform_admin' ? 'gold' : 'cyan'}
                                                    icon={role.name === 'platform_admin' ? <CrownOutlined /> : undefined}
                                                    style={{ fontSize: 12 }}>
                                                    {role.display_name || role.name}
                                                </Tag>
                                            ))}
                                        </Space>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 12 }}>暂无角色分配</Text>
                                    )}
                                    <div style={{
                                        marginTop: 12, padding: '10px 12px', background: '#f6f8fa',
                                        border: '1px solid #e8e8e8', fontSize: 12, color: '#8c8c8c', lineHeight: 1.7,
                                    }}>
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
                        </div>
                    </Spin>
                )}
            </Drawer>

            {/* ===== 重置密码 Modal ===== */}
            <Modal
                title={<Space><LockOutlined />重置密码 — {drawerUser?.display_name || drawerUser?.username}</Space>}
                open={resetPwdOpen}
                onCancel={() => { setResetPwdOpen(false); resetPwdForm.resetFields(); }}
                onOk={() => resetPwdForm.submit()}
                okText="重置" confirmLoading={submitting} destroyOnHidden width={420}
            >
                <Form form={resetPwdForm} layout="vertical" onFinish={handleResetPwd} style={{ marginTop: 8 }}>
                    <Form.Item name="new_password" label="新密码"
                        rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}>
                        <Input.Password placeholder="至少6位" />
                    </Form.Item>
                    <Form.Item name="confirm_password" label="确认新密码"
                        dependencies={['new_password']}
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                                    return Promise.reject(new Error('两次密码不一致'));
                                },
                            }),
                        ]}>
                        <Input.Password placeholder="再次输入新密码" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default PlatformUsersPage;
