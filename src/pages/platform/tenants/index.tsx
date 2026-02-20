import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Button, Space, Tooltip, message,
    Popconfirm, Spin, Empty, Pagination, Switch, Row, Col, Typography,
    Drawer, Tag, Badge, Table, Avatar,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    CrownOutlined, TeamOutlined,
    BankOutlined, AppstoreOutlined,
    CheckCircleOutlined, ClockCircleOutlined, TagOutlined,
    ShopOutlined, CloudOutlined, ApartmentOutlined, ToolOutlined, GlobalOutlined, RocketOutlined,
    HomeOutlined, BulbOutlined, SafetyOutlined, ThunderboltOutlined, ClusterOutlined, DashboardOutlined,
    ExperimentOutlined, MonitorOutlined, CodeOutlined, BuildOutlined, FundOutlined, TrophyOutlined,
    StarOutlined, ProductOutlined, AlertOutlined, AuditOutlined, FireOutlined, CustomerServiceOutlined,
    ControlOutlined, SendOutlined, FolderOpenOutlined,
    DeploymentUnitOutlined, ApiOutlined, DatabaseOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import type { SearchField } from '@/components/StandardTable';
import {
    getTenants, deleteTenant, updateTenant, getTenant, getTenantMembers,
} from '@/services/auto-healing/platform/tenants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './index.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ==================== Constants ====================
const ICON_MAP: Record<string, React.ReactNode> = {
    bank: <BankOutlined />, shop: <ShopOutlined />, team: <TeamOutlined />,
    cloud: <CloudOutlined />, apartment: <ApartmentOutlined />, tool: <ToolOutlined />,
    global: <GlobalOutlined />, rocket: <RocketOutlined />, home: <HomeOutlined />,
    bulb: <BulbOutlined />, safety: <SafetyOutlined />, thunder: <ThunderboltOutlined />,
    database: <DatabaseOutlined />, api: <ApiOutlined />, deployment: <DeploymentUnitOutlined />,
    cluster: <ClusterOutlined />, dashboard: <DashboardOutlined />, experiment: <ExperimentOutlined />,
    monitor: <MonitorOutlined />, code: <CodeOutlined />, build: <BuildOutlined />,
    fund: <FundOutlined />, trophy: <TrophyOutlined />, star: <StarOutlined />,
    product: <ProductOutlined />, alert: <AlertOutlined />, audit: <AuditOutlined />,
    fire: <FireOutlined />, service: <CustomerServiceOutlined />, control: <ControlOutlined />,
    send: <SendOutlined />, folder: <FolderOpenOutlined />,
};

const ROLE_COLOR: Record<string, string> = { admin: 'purple', operator: 'cyan', viewer: 'default' };

const searchFields: SearchField[] = [
    { key: 'name', label: '名称' },
    { key: 'code', label: '代码' },
];

const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="20" width="40" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 20V14a12 12 0 0 1 24 0v6" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="18" y="28" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

/* ===================================================
   主页面
   =================================================== */
const TenantsPage: React.FC = () => {
    const access = useAccess();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [total, setTotal] = useState(0);
    const [searchField, setSearchField] = useState('name');
    const [searchValue, setSearchValue] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTenant, setDrawerTenant] = useState<any>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const loadData = useCallback(async (p: number, ps: number, field?: string, value?: string) => {
        setLoading(true);
        try {
            const apiParams: any = { page: p, page_size: ps };
            if (value?.trim()) {
                if (field === 'code') apiParams.code = value.trim();
                else apiParams.name = value.trim();
            }
            const res = await getTenants(apiParams);
            const list = (res as any)?.data || [];
            const tot = (res as any)?.total || list.length;
            setData(list);
            setTotal(tot);
            if (p === 1 && !value?.trim()) {
                const activeCount = list.filter((t: any) => t.status === 'active' || !t.status).length;
                setStats({ total: tot, active: activeCount, inactive: tot - activeCount });
            }
        } catch {
            message.error('加载租户列表失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(1, pageSize);
    }, []);

    const handleSearch = useCallback((params: { searchField?: string; searchValue?: string }) => {
        const field = params.searchField || 'name';
        const value = params.searchValue || '';
        setSearchField(field);
        setSearchValue(value);
        setPage(1);
        loadData(1, pageSize, field, value);
    }, [pageSize, loadData]);

    // ==================== Drawer ====================
    const openDrawer = useCallback(async (tenant: any) => {
        setDrawerOpen(true);
        setDrawerTenant(tenant);
        setDrawerLoading(true);
        setMembersLoading(true);
        try {
            const res = await getTenant(tenant.id);
            setDrawerTenant((res as any)?.data || res);
        } catch { /* keep basic data */ }
        finally { setDrawerLoading(false); }
        try {
            const res = await getTenantMembers(tenant.id);
            setMembers((res as any)?.data || []);
        } catch { setMembers([]); }
        finally { setMembersLoading(false); }
    }, []);

    const closeDrawer = () => { setDrawerOpen(false); setDrawerTenant(null); setMembers([]); };

    // ==================== Actions ====================
    const handleToggle = async (tenant: any, checked: boolean) => {
        const originalStatus = tenant.status;
        const newStatus = checked ? 'active' : 'inactive';
        setData(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
        setActionLoading(tenant.id);
        try {
            await updateTenant(tenant.id, { status: newStatus });
            message.success(checked ? `已启用「${tenant.name}」` : `已禁用「${tenant.name}」`);
            setStats(prev => ({
                ...prev,
                active: checked ? prev.active + 1 : prev.active - 1,
                inactive: checked ? prev.inactive - 1 : prev.inactive + 1,
            }));
        } catch {
            setData(prev => prev.map(t => t.id === tenant.id ? { ...t, status: originalStatus } : t));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent | undefined, tenant: any) => {
        e?.stopPropagation();
        setActionLoading(tenant.id);
        try {
            await deleteTenant(tenant.id);
            message.success('租户删除成功');
            setDrawerOpen(false);
            // 乐观更新：直接从列表移除，不重新加载
            setData(prev => prev.filter(t => t.id !== tenant.id));
            setTotal(prev => prev - 1);
            setStats(prev => ({
                ...prev,
                total: prev.total - 1,
                ...(tenant.status === 'active'
                    ? { active: prev.active - 1 }
                    : { inactive: prev.inactive - 1 }),
            }));
        } catch {
            message.error('租户删除失败');
        } finally {
            setActionLoading(null);
        }
    };

    // ==================== Tenant Card ====================
    const renderTenantCard = (tenant: any) => {
        const isActive = tenant.status === 'active' || !tenant.status;
        const icon = ICON_MAP[tenant.icon] ?? <BankOutlined />;

        return (
            <Col key={tenant.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                <div
                    className={`tenant-card ${isActive ? 'tenant-card-active' : 'tenant-card-inactive'}`}
                    onClick={() => openDrawer(tenant)}
                >
                    <div className="tenant-card-body">
                        <div className="tenant-card-header">
                            <div className="tenant-card-title-area">
                                <div className="tenant-card-icon">{icon}</div>
                                <div className="tenant-card-title">{tenant.name || '未命名租户'}</div>
                            </div>
                            <Space size={4}>
                                {isActive ? (
                                    <span className="tenant-card-status-active">
                                        <CheckCircleOutlined /> 启用
                                    </span>
                                ) : (
                                    <span className="tenant-card-status-inactive">已停用</span>
                                )}
                            </Space>
                        </div>

                        <div className="tenant-card-desc">
                            {tenant.description || '暂无描述'}
                        </div>

                        <div className="tenant-card-preview">
                            <div className="tenant-card-admin-avatar">{icon}</div>
                            <span style={{ fontSize: 11, color: '#595959', fontFamily: '"SFMono-Regular", Consolas, monospace' }}>
                                {tenant.code}
                            </span>
                            <span className="tenant-card-preview-label">租户编码</span>
                        </div>

                        <div className="tenant-card-info-grid">
                            <span className="tenant-card-info-item">
                                <TagOutlined />
                                <span className="info-value">{tenant.code}</span>
                            </span>
                            <span className="tenant-card-info-item">
                                <TeamOutlined />
                                <span className="info-value">{tenant.member_count ?? '—'}</span> 成员
                            </span>
                            <span className="tenant-card-info-item">
                                <ClockCircleOutlined />
                                创建 {tenant.created_at ? dayjs(tenant.created_at).format('MM/DD') : '-'}
                            </span>
                            <span className="tenant-card-info-item">
                                <ClockCircleOutlined />
                                更新 {tenant.updated_at ? dayjs(tenant.updated_at).fromNow() : '-'}
                            </span>
                        </div>

                        <div className="tenant-card-footer">
                            <span className="tenant-card-footer-left">
                                {tenant.id?.substring(0, 8)}
                            </span>
                            <Space size={0} onClick={e => e.stopPropagation()}>
                                {access.canManagePlatformTenants && (
                                    <Tooltip title={isActive ? '停用' : '启用'}>
                                        <Switch
                                            size="small"
                                            checked={isActive}
                                            loading={actionLoading === tenant.id}
                                            onChange={(c) => handleToggle(tenant, c)}
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title="成员管理">
                                    <Button type="text" size="small" icon={<CrownOutlined />}
                                        onClick={() => history.push(`/platform/tenants/${tenant.id}/members`)}
                                    />
                                </Tooltip>
                                {access.canManagePlatformTenants && (
                                    <>
                                        <Tooltip title="编辑">
                                            <Button type="text" size="small" icon={<EditOutlined />}
                                                onClick={() => history.push(`/platform/tenants/${tenant.id}/edit`)}
                                            />
                                        </Tooltip>
                                        <Popconfirm title="确定删除此租户？" description="删除后无法恢复"
                                            onConfirm={(e) => handleDelete(e as any, tenant)}>
                                            <Button type="text" danger size="small" icon={<DeleteOutlined />}
                                                loading={actionLoading === tenant.id}
                                            />
                                        </Popconfirm>
                                    </>
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
            { icon: <BankOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '启用' },
            { icon: <AppstoreOutlined />, cls: 'error', val: stats.inactive, lbl: '停用' },
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
    const drawerIcon = drawerTenant ? (ICON_MAP[drawerTenant.icon] ?? <BankOutlined />) : <BankOutlined />;
    const drawerIsActive = drawerTenant?.status === 'active' || !drawerTenant?.status;
    const adminCount = members.filter(m => m.role?.name === 'admin').length;
    const operatorCount = members.filter(m => m.role?.name === 'operator').length;
    const viewerCount = members.length - adminCount - operatorCount;

    const memberColumns = [
        {
            title: '成员', dataIndex: 'user', key: 'user',
            render: (_: any, record: any) => {
                const name = record.user?.display_name || record.user?.username || record.user_id?.substring(0, 8);
                const isAdmin = record.role?.name === 'admin';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={26}
                            style={{
                                background: isAdmin ? '#f0f5ff' : '#f5f5f5',
                                color: isAdmin ? '#597ef7' : '#8c8c8c',
                                border: `1px solid ${isAdmin ? '#adc6ff' : '#e8e8e8'}`,
                                fontSize: 11, fontWeight: 600,
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
            title: '角色', dataIndex: 'role', key: 'role', width: 90,
            render: (_: any, record: any) => (
                <Tag color={ROLE_COLOR[record.role?.name] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                    {record.role?.display_name || record.role?.name || '-'}
                </Tag>
            ),
        },
        {
            title: '加入时间', dataIndex: 'created_at', key: 'created_at', width: 100,
            render: (v: string) => (
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {v ? dayjs(v).format('MM-DD HH:mm') : '-'}
                </span>
            ),
        },
    ];

    // ==================== Render ====================
    return (
        <>
            <StandardTable<any>
                tabs={[{ key: 'list', label: '租户列表' }]}
                title="租户管理"
                description="管理平台下的所有租户，支持创建、编辑、禁用以及分配租户管理员。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                onSearch={handleSearch}
                primaryActionLabel="创建租户"
                primaryActionIcon={<PlusOutlined />}
                onPrimaryAction={access.canManagePlatformTenants ? () => history.push('/platform/tenants/create') : undefined}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="加载租户..."><div /></Spin>
                    </div>
                ) : data.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无租户数据</Text>}>
                        <Button type="dashed" onClick={() => history.push('/platform/tenants/create')}>
                            创建第一个租户
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[20, 20]} className="tenants-grid">
                            {data.map(renderTenantCard)}
                        </Row>
                        <div className="tenants-pagination">
                            <Pagination
                                current={page} total={total} pageSize={pageSize}
                                onChange={(p, size) => { setPage(p); setPageSize(size); loadData(p, size, searchField, searchValue); }}
                                showSizeChanger pageSizeOptions={['16', '24', '48']}
                                showQuickJumper showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </StandardTable>

            {/* ===== 租户详情 Drawer ===== */}
            <Drawer
                open={drawerOpen}
                onClose={closeDrawer}
                size={560}
                closable
                destroyOnHidden
                styles={{
                    header: { display: 'none' },
                    body: { padding: 0 },
                }}
            >
                {drawerTenant && (
                    <Spin spinning={drawerLoading}>
                        {/* Header */}
                        <div className="tenant-drawer-header">
                            <div className="tenant-drawer-header-top">
                                <div className="tenant-drawer-header-icon">{drawerIcon}</div>
                                <div className="tenant-drawer-header-info">
                                    <div className="tenant-drawer-title">{drawerTenant.name}</div>
                                    <div className="tenant-drawer-sub">
                                        <Badge
                                            status={drawerIsActive ? 'success' : 'default'}
                                            text={<span style={{ fontSize: 12, color: '#8c8c8c' }}>{drawerIsActive ? '已启用' : '已禁用'}</span>}
                                        />
                                        <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{drawerTenant.code}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="tenant-drawer-actions">
                                {access.canManagePlatformTenants && (
                                    <Button size="small" icon={<EditOutlined />}
                                        onClick={() => { closeDrawer(); history.push(`/platform/tenants/${drawerTenant.id}/edit`); }}>
                                        编辑
                                    </Button>
                                )}
                                <Button size="small" icon={<TeamOutlined />}
                                    onClick={() => { closeDrawer(); history.push(`/platform/tenants/${drawerTenant.id}/members`); }}>
                                    管理成员
                                </Button>
                                {access.canManagePlatformTenants && (
                                    <Popconfirm title="确认删除此租户？" description="删除后无法恢复"
                                        onConfirm={(e) => handleDelete(e as any, drawerTenant)}>
                                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                                    </Popconfirm>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="tenant-drawer-body">
                            {/* 基础信息 */}
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
                                            <Text copyable={{ tooltips: ['复制', '已复制'] }}
                                                className="tenant-drawer-field-value"
                                                style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                {drawerTenant.id}
                                            </Text>
                                        </div>
                                        <div className="tenant-drawer-field">
                                            <span className="tenant-drawer-field-label">租户编码</span>
                                            <span className="tenant-drawer-field-value" style={{ fontFamily: 'monospace' }}>
                                                {drawerTenant.code}
                                            </span>
                                        </div>
                                        <div className="tenant-drawer-field">
                                            <span className="tenant-drawer-field-label">状态</span>
                                            <Tag color={drawerIsActive ? 'success' : 'default'} style={{ margin: 0 }}>
                                                {drawerIsActive ? '已启用' : '已禁用'}
                                            </Tag>
                                        </div>
                                        <div className="tenant-drawer-field">
                                            <span className="tenant-drawer-field-label">图标</span>
                                            <span className="tenant-drawer-field-value">
                                                {drawerTenant.icon || '默认'}
                                            </span>
                                        </div>
                                        <div className="tenant-drawer-field">
                                            <span className="tenant-drawer-field-label">创建时间</span>
                                            <span className="tenant-drawer-field-value" style={{ fontSize: 12 }}>
                                                {drawerTenant.created_at ? dayjs(drawerTenant.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </span>
                                        </div>
                                        <div className="tenant-drawer-field">
                                            <span className="tenant-drawer-field-label">更新时间</span>
                                            <span className="tenant-drawer-field-value" style={{ fontSize: 12 }}>
                                                {drawerTenant.updated_at ? dayjs(drawerTenant.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    {drawerTenant.description && (
                                        <div style={{ paddingTop: 8, borderTop: '1px solid #f5f5f5' }}>
                                            <span style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>描述</span>
                                            <span style={{ fontSize: 13, color: '#595959', lineHeight: 1.6 }}>{drawerTenant.description}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 成员统计 */}
                            <div className="tenant-drawer-card">
                                <div className="tenant-drawer-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CrownOutlined className="tenant-drawer-card-header-icon" />
                                        <span className="tenant-drawer-card-header-title">成员统计</span>
                                    </div>
                                    <span className="tenant-drawer-card-header-count">{members.length} 人</span>
                                </div>
                                <div className="tenant-drawer-card-body">
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
                                            <div className="tenant-drawer-stat-value" style={{ color: '#8c8c8c' }}>{viewerCount}</div>
                                            <div className="tenant-drawer-stat-label">只读</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 成员列表 */}
                            <div className="tenant-drawer-card">
                                <div className="tenant-drawer-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <TeamOutlined className="tenant-drawer-card-header-icon" />
                                        <span className="tenant-drawer-card-header-title">成员列表</span>
                                    </div>
                                    <Button size="small" type="primary" icon={<SettingOutlined />}
                                        onClick={() => { closeDrawer(); history.push(`/platform/tenants/${drawerTenant.id}/members`); }}>
                                        管理
                                    </Button>
                                </div>
                                <Spin spinning={membersLoading}>
                                    {members.length === 0 && !membersLoading ? (
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无成员" style={{ padding: '24px 0' }} />
                                    ) : (
                                        <Table
                                            dataSource={members}
                                            columns={memberColumns}
                                            rowKey="id"
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
                )}
            </Drawer>
        </>
    );
};

export default TenantsPage;
