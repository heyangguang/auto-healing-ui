import React, { useCallback, useRef, useState } from 'react';
import { useAccess, history } from '@umijs/max';
import { Tag, Space, message, Popconfirm, Tooltip, Typography, Button, Badge, Drawer, Descriptions, Spin, Avatar, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, ClockCircleOutlined, SecurityScanOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField } from '@/components/StandardTable';
import { getRoles, deleteRole, getRole } from '@/services/auto-healing/roles';
import dayjs from 'dayjs';

const { Text } = Typography;

const MODULE_LABELS: Record<string, string> = {
    system: '系统管理', user: '用户管理', role: '角色管理',
    plugin: '插件管理', execution: '执行管理', notification: '通知管理',
    healing: '自愈引擎', workflow: '工作流', dashboard: '仪表盘',
};

/* ========== 搜索字段配置 ========== */
const searchFields: SearchField[] = [
    { key: 'display_name', label: '角色名称' },
    { key: 'name', label: '角色标识' },
];

/* ========== 角色管理页面 ========== */
const RolesPage: React.FC = () => {
    const access = useAccess();

    /* ---- 刷新 ---- */
    const refreshCountRef = useRef(0);
    const [, forceUpdate] = useState(0);
    const triggerRefresh = useCallback(() => {
        refreshCountRef.current += 1;
        forceUpdate(n => n + 1);
    }, []);

    /* ---- 详情 Drawer ---- */
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailRole, setDetailRole] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const openDetailDrawer = useCallback(async (record: any) => {
        setDetailRole(record);
        setDetailDrawerOpen(true);
        setDetailLoading(true);
        try {
            const res = await getRole(record.id);
            setDetailRole((res as any)?.data || res);
        } catch {
            message.error('加载角色详情失败');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    /* ========== 列定义 ========== */
    const columns: StandardColumnDef<any>[] = [
        {
            columnKey: 'display_name',
            columnTitle: '角色名称 / 标识',
            fixedColumn: true,
            dataIndex: 'display_name',
            width: 200,
            sorter: true,
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <a
                            style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }}
                        >
                            {record.display_name || record.name}
                        </a>
                        {record.is_system && (
                            <Tag color="blue" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>系统</Tag>
                        )}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                        {record.name}
                    </span>
                </div>
            ),
        },
        {
            columnKey: 'description',
            columnTitle: '描述',
            dataIndex: 'description',
            width: 240,
            ellipsis: true,
            render: (_: any, record: any) => record.description || <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'user_count',
            columnTitle: '用户数',
            dataIndex: 'user_count',
            width: 90,
            sorter: true,
            render: (_: any, record: any) => (
                <Badge
                    count={record.user_count ?? 0}
                    showZero
                    color={record.user_count > 0 ? '#1677ff' : '#d9d9d9'}
                    overflowCount={999}
                    style={{ fontSize: 12 }}
                />
            ),
        },
        {
            columnKey: 'permission_count',
            columnTitle: '权限数',
            dataIndex: 'permission_count',
            width: 90,
            sorter: true,
            render: (_: any, record: any) => (
                <Badge
                    count={record.permission_count ?? 0}
                    showZero
                    color={record.permission_count > 0 ? '#52c41a' : '#d9d9d9'}
                    overflowCount={999}
                    style={{ fontSize: 12 }}
                />
            ),
        },
        {
            columnKey: 'is_system',
            columnTitle: '类型',
            dataIndex: 'is_system',
            width: 90,
            headerFilters: [
                { label: '系统角色', value: 'true' },
                { label: '自定义角色', value: 'false' },
            ],
            render: (_: any, record: any) => (
                <Tag color={record.is_system ? 'blue' : 'default'}>
                    {record.is_system ? '系统' : '自定义'}
                </Tag>
            ),
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: any) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 80,
            render: (_: any, record: any) => (
                <Space size="small">
                    {!record.is_system && (
                        <>
                            <Tooltip title="编辑">
                                <Button
                                    type="link" size="small"
                                    icon={<EditOutlined />}
                                    disabled={!access.canUpdateRole}
                                    onClick={(e) => { e.stopPropagation(); history.push(`/system/roles/${record.id}/edit`); }}
                                />
                            </Tooltip>
                            <Popconfirm
                                title="确定要删除此角色吗？"
                                description="删除后不可恢复，已分配该角色的用户将失去相应权限。"
                                onConfirm={async () => {
                                    try {
                                        await deleteRole(record.id);
                                        message.success('删除成功');
                                        triggerRefresh();
                                    } catch {
                                        message.error('删除失败');
                                    }
                                }}
                            >
                                <Tooltip title="删除">
                                    <Button
                                        type="link" size="small" danger
                                        disabled={!access.canDeleteRole}
                                        icon={<DeleteOutlined />}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    /* ========== 数据请求（前端搜索 + 假分页） ========== */
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const res = await getRoles();
        let items: any[] = res?.data || [];

        // 搜索过滤
        const searchVal = params.searchValue?.trim().toLowerCase();
        if (searchVal) {
            items = items.filter((item) => {
                if (params.searchField === 'display_name') {
                    return (item.display_name || '').toLowerCase().includes(searchVal);
                }
                if (params.searchField === 'name') {
                    return (item.name || '').toLowerCase().includes(searchVal);
                }
                // 全局搜索
                return (
                    (item.display_name || '').toLowerCase().includes(searchVal) ||
                    (item.name || '').toLowerCase().includes(searchVal) ||
                    (item.description || '').toLowerCase().includes(searchVal)
                );
            });
        }

        // 高级搜索/筛选标签
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.display_name) {
                items = items.filter(i => (i.display_name || '').toLowerCase().includes(adv.display_name.toLowerCase()));
            }
            if (adv.name) {
                items = items.filter(i => (i.name || '').toLowerCase().includes(adv.name.toLowerCase()));
            }
            if (adv.is_system !== undefined && adv.is_system !== '') {
                const isSystem = adv.is_system === 'true';
                items = items.filter(i => i.is_system === isSystem);
            }
        }

        // 排序
        if (params.sorter) {
            const { field, order } = params.sorter;
            items.sort((a, b) => {
                const va = a[field] ?? '';
                const vb = b[field] ?? '';
                const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
                return order === 'ascend' ? cmp : -cmp;
            });
        }

        // 假分页
        const total = items.length;
        const start = (params.page - 1) * params.pageSize;
        const paged = items.slice(start, start + params.pageSize);

        return { data: paged, total };
    }, []);

    /* ========== 头部图标 ========== */
    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 6L6 14v8c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24v-8L24 6z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            <StandardTable<any>
                key={refreshCountRef.current}
                tabs={[{ key: 'list', label: '角色列表' }]}
                title="角色管理"
                description="管理系统角色、权限分配。支持创建自定义角色、分配权限，系统角色不可删除。"
                headerIcon={headerIcon}
                searchFields={searchFields}
                primaryActionLabel="创建角色"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateRole}
                onPrimaryAction={() => history.push('/system/roles/create')}
                columns={columns}
                rowKey="id"
                onRowClick={(record) => openDetailDrawer(record)}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="role_list"
            />

            {/* 详情 Drawer */}
            <Drawer
                title={null}
                width={560}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            >
                <Spin spinning={detailLoading}>
                    {detailRole && (
                        <>
                            {/* 头部 */}
                            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <Avatar size={44} icon={<SafetyCertificateOutlined />} style={{ backgroundColor: '#13c2c2' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                                            {detailRole.display_name || detailRole.name}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>@{detailRole.name}</Text>
                                    </div>
                                    <Tag color={detailRole.is_system ? 'blue' : 'default'}>
                                        {detailRole.is_system ? '系统角色' : '自定义角色'}
                                    </Tag>
                                </div>
                                <Space size={8}>
                                    <Button
                                        size="small"
                                        icon={<UsergroupAddOutlined />}
                                        disabled={!access.canUpdateRole}
                                        onClick={() => { setDetailDrawerOpen(false); history.push(`/system/roles/${detailRole.id}/edit`); }}
                                    >
                                        分配用户
                                    </Button>
                                    {!detailRole.is_system && (
                                        <>
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                disabled={!access.canUpdateRole}
                                                onClick={() => { setDetailDrawerOpen(false); history.push(`/system/roles/${detailRole.id}/edit`); }}
                                            >
                                                编辑
                                            </Button>
                                            <Popconfirm
                                                title="确定要删除此角色吗？"
                                                onConfirm={async () => {
                                                    try {
                                                        await deleteRole(detailRole.id);
                                                        message.success('删除成功');
                                                        setDetailDrawerOpen(false);
                                                        refreshCountRef.current += 1;
                                                        forceUpdate(n => n + 1);
                                                    } catch { message.error('删除失败'); }
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

                            {/* 详细信息 */}
                            <div style={{ padding: '16px 24px' }}>
                                {/* 基本信息 */}
                                <div style={{ marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>基本信息</Text>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色标识</Text>
                                        <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                            {detailRole.name}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色名称</Text>
                                        <Text strong>{detailRole.display_name || '—'}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>用户数</Text>
                                        <Text strong>{detailRole.user_count ?? 0} 人</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>角色 ID</Text>
                                        <Text copyable style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 12 }}>
                                            {detailRole.id}
                                        </Text>
                                    </div>
                                    {detailRole.description && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>描述</Text>
                                            <Text>{detailRole.description}</Text>
                                        </div>
                                    )}
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* 权限分组 */}
                                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <SecurityScanOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        权限分配 ({detailRole.permissions?.length || 0})
                                    </Text>
                                </div>
                                {detailRole.permissions && detailRole.permissions.length > 0 ? (
                                    Object.entries(
                                        (detailRole.permissions || []).reduce((acc: Record<string, any[]>, p: any) => {
                                            const mod = p.module || 'other';
                                            if (!acc[mod]) acc[mod] = [];
                                            acc[mod].push(p);
                                            return acc;
                                        }, {})
                                    ).map(([mod, perms]) => (
                                        <div key={mod} style={{
                                            marginBottom: 12,
                                            padding: '8px 12px',
                                            background: '#fafafa',
                                            border: '1px solid #f0f0f0',
                                        }}>
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                                {MODULE_LABELS[mod] || mod} ({(perms as any[]).length})
                                            </Text>
                                            <Space size={[4, 4]} wrap>
                                                {(perms as any[]).map((p: any) => (
                                                    <Tag
                                                        key={p.id}
                                                        style={{ fontSize: 12, margin: 0, padding: '1px 8px' }}
                                                    >
                                                        {p.display_name || p.name}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="secondary" style={{ fontStyle: 'italic' }}>未分配任何权限</Text>
                                )}

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
                                            {detailRole.created_at ? dayjs(detailRole.created_at).format('YYYY-MM-DD HH:mm') : '—'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>更新时间</Text>
                                        <Text style={{ fontSize: 13 }}>
                                            {detailRole.updated_at ? dayjs(detailRole.updated_at).format('YYYY-MM-DD HH:mm') : '—'}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Spin>
            </Drawer>
        </>
    );
};

export default RolesPage;
