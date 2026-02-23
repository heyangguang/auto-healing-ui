import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusOutlined, ApiOutlined, KeyOutlined, LockOutlined, CloudOutlined,
    DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
    StarOutlined, StarFilled, EyeOutlined, EditOutlined,
    SafetyCertificateOutlined, GlobalOutlined, FileOutlined,
    InfoCircleOutlined, LinkOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import {
    Space, Tooltip, message, Typography, Modal, Tag, Button,
    Drawer, Badge, Switch, Popconfirm, Alert, Card, Row, Col,
    Statistic, Spin, Form, Input, Select, Checkbox,
} from 'antd';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import HostSelector from '@/components/HostSelector';

import {
    getSecretsSources, updateSecretsSource,
    deleteSecretsSource, testSecretsQuery,
    enableSecretsSource, disableSecretsSource,
    getSecretsSourcesStats,
} from '@/services/auto-healing/secrets';
import './index.css';

const { Text } = Typography;

/* ========== 配置常量 ========== */
const SOURCE_TYPES = [
    { value: 'file', label: '本地密钥文件', icon: <FileOutlined />, color: '#1890ff', bgColor: '#e6f7ff', desc: '从本地密钥文件读取凭据（仅支持SSH Key）', supportPassword: false },
    { value: 'vault', label: 'HashiCorp Vault', icon: <SafetyCertificateOutlined />, color: '#722ed1', bgColor: '#f9f0ff', desc: '从 Vault 安全存储获取凭据', supportPassword: true },
    { value: 'webhook', label: 'Webhook', icon: <GlobalOutlined />, color: '#52c41a', bgColor: '#f6ffed', desc: '通过外部 HTTP 服务获取凭据', supportPassword: true },
];

const AUTH_TYPES = [
    { value: 'ssh_key', label: 'SSH 密钥', icon: <KeyOutlined />, color: '#1890ff' },
    { value: 'password', label: '密码认证', icon: <LockOutlined />, color: '#fa8c16' },
];



const getSourceTypeConfig = (type: string) => SOURCE_TYPES.find(t => t.value === type) || SOURCE_TYPES[0];
const getAuthTypeConfig = (authType: string) => AUTH_TYPES.find(t => t.value === authType) || AUTH_TYPES[0];

/* ========== 搜索字段 ========== */
const searchFields: SearchField[] = [
    { key: 'keyword', label: '名称' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'keyword', label: '名称', type: 'input', placeholder: '密钥源名称' },
    {
        key: 'type', label: '类型', type: 'select', placeholder: '全部类型',
        options: [
            { label: '本地文件', value: 'file' },
            { label: 'Vault', value: 'vault' },
            { label: 'Webhook', value: 'webhook' },
        ],
    },
    {
        key: 'auth_type', label: '认证方式', type: 'select', placeholder: '全部认证',
        options: [
            { label: 'SSH 密钥', value: 'ssh_key' },
            { label: '密码', value: 'password' },
        ],
    },
    {
        key: 'status', label: '状态', type: 'select', placeholder: '全部状态',
        options: [
            { label: '已启用', value: 'active' },
            { label: '已禁用', value: 'inactive' },
        ],
    },
];

/* ========== Header Icon ========== */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="20" width="36" height="22" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M16 20V14a8 8 0 0116 0v6" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="24" cy="31" r="3" fill="currentColor" opacity="0.6" />
        <line x1="24" y1="34" x2="24" y2="37" stroke="currentColor" strokeWidth="2" />
    </svg>
);

/* ========== 主组件 ========== */
const SecretsSourceList: React.FC = () => {
    const access = useAccess();
    const canManage = !!access.canManageSecrets;

    /* ---- 数据加载 (API 返回全量，前端分页) ---- */
    const [allSources, setAllSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshTrigger(n => n + 1), []);

    const loadSources = useCallback(async () => {
        try {
            const res = await getSecretsSources();
            setAllSources(res.data || []);
        } catch { /* ignore */ }
    }, []);
    useEffect(() => { loadSources(); }, [loadSources]);

    /* ---- 统计（来自后端 stats API）---- */
    const [stats, setStats] = useState({ total: 0, active: 0, file: 0, vault: 0, webhook: 0 });
    useEffect(() => {
        getSecretsSourcesStats().then(res => {
            if (res?.data) {
                const byStatus = res.data.by_status || [];
                const byType = res.data.by_type || [];
                const getStatusCount = (s: string) => byStatus.find((x: any) => x.status === s)?.count || 0;
                const getTypeCount = (t: string) => byType.find((x: any) => x.type === t)?.count || 0;
                setStats({
                    total: res.data.total || 0,
                    active: getStatusCount('active'),
                    file: getTypeCount('file'),
                    vault: getTypeCount('vault'),
                    webhook: getTypeCount('webhook'),
                });
            }
        }).catch(() => { });
    }, [allSources]); // 数据变更时重新加载统计

    /* ---- 详情 Drawer ---- */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentSource, setCurrentSource] = useState<AutoHealing.SecretsSource | null>(null);

    /* ---- 测试凭据 ---- */
    const [testingId, setTestingId] = useState<string>();
    const [testQueryModalOpen, setTestQueryModalOpen] = useState(false);
    const [testQuerySource, setTestQuerySource] = useState<AutoHealing.SecretsSource | null>(null);
    const [selectedTestHostIps, setSelectedTestHostIps] = useState<string[]>([]);
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);
    const [testResults, setTestResults] = useState<{
        success_count: number;
        fail_count: number;
        results: AutoHealing.TestQueryBatchResult[];
    } | null>(null);

    /* ======= 操作回调 ======= */
    const openDetail = useCallback((source: AutoHealing.SecretsSource) => {
        setCurrentSource(source);
        setDrawerOpen(true);
    }, []);

    const openCreate = useCallback(() => {
        history.push('/resources/secrets/create');
    }, []);

    const openEdit = useCallback((source: AutoHealing.SecretsSource) => {
        history.push(`/resources/secrets/${source.id}/edit`);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteSecretsSource(id);
            message.success('已删除');
            loadSources();
        } catch { /* global */ }
    }, [loadSources]);

    const handleSetDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: true });
            message.success('已设为默认');
            loadSources();
        } catch { /* global */ }
    }, [loadSources]);

    const handleCancelDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: false });
            message.success('已取消默认');
            loadSources();
        } catch { /* global */ }
    }, [loadSources]);

    const handleToggleStatus = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            if (source.status === 'active') {
                await disableSecretsSource(source.id);
                message.success('已禁用');
            } else {
                await enableSecretsSource(source.id);
                message.success('已启用');
            }
            loadSources();
        } catch { /* global */ }
    }, [loadSources]);

    const handleOpenTestQuery = useCallback((source: AutoHealing.SecretsSource) => {
        setTestQuerySource(source);
        setSelectedTestHostIps([]);
        setTestQueryModalOpen(true);
    }, []);

    const handleTestQuery = useCallback(async () => {
        if (!testQuerySource) return;
        if (selectedTestHostIps.length === 0) {
            message.error('请先选择要测试的主机');
            return;
        }
        setTestingId(testQuerySource.id);
        try {
            const hosts = selectedTestHostIps.map(ip => ({ hostname: ip, ip_address: ip }));
            const res = await testSecretsQuery(testQuerySource.id, { hosts });
            const data = res.data as { success_count: number; fail_count: number; results: AutoHealing.TestQueryBatchResult[] };
            setTestQueryModalOpen(false);
            setTestResults(data);
            setTestResultModalOpen(true);
            loadSources();
        } catch { message.error('测试请求失败'); }
        finally { setTestingId(undefined); }
    }, [testQuerySource, selectedTestHostIps, loadSources]);



    /* ========== 列定义 ========== */
    const columns = useMemo<StandardColumnDef<AutoHealing.SecretsSource>[]>(() => [
        {
            columnKey: 'name',
            columnTitle: '名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 200,
            sorter: true,
            render: (_: any, record: AutoHealing.SecretsSource) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <a
                        style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); openDetail(record); }}
                    >
                        {record.name}
                    </a>
                    {record.is_default && (
                        <Tooltip title="默认密钥源">
                            <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            columnKey: 'type',
            columnTitle: '类型',
            dataIndex: 'type',
            width: 120,
            sorter: true,
            headerFilters: [
                { label: '本地文件', value: 'file' },
                { label: 'Vault', value: 'vault' },
                { label: 'Webhook', value: 'webhook' },
            ],
            render: (_: any, record: AutoHealing.SecretsSource) => {
                const cfg = getSourceTypeConfig(record.type);
                return (
                    <Tag icon={cfg.icon} color={cfg.color} style={{ margin: 0 }}>
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            columnKey: 'auth_type',
            columnTitle: '认证方式',
            dataIndex: 'auth_type',
            width: 110,
            sorter: true,
            headerFilters: [
                { label: 'SSH 密钥', value: 'ssh_key' },
                { label: '密码', value: 'password' },
            ],
            render: (_: any, record: AutoHealing.SecretsSource) => {
                const cfg = getAuthTypeConfig(record.auth_type);
                return <Tag icon={cfg.icon} color={cfg.color} style={{ margin: 0 }}>{cfg.label}</Tag>;
            },
        },
        {
            columnKey: 'priority',
            columnTitle: '优先级',
            dataIndex: 'priority',
            width: 80,
            sorter: true,
            render: (_: any, record: AutoHealing.SecretsSource) => (
                <Text strong style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    {record.priority}
                </Text>
            ),
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 80,
            sorter: true,
            headerFilters: [
                { label: '已启用', value: 'active' },
                { label: '已禁用', value: 'inactive' },
            ],
            render: (_: any, record: AutoHealing.SecretsSource) => (
                <Badge
                    status={record.status === 'active' ? 'success' : 'default'}
                    text={record.status === 'active' ? '启用' : '禁用'}
                />
            ),
        },
        {
            columnKey: 'query_key',
            columnTitle: '查询键',
            width: 100,
            defaultVisible: false,
            render: (_: any, record: AutoHealing.SecretsSource) => {
                const qk = record.config?.query_key;
                return qk
                    ? <Tag color="blue">按 {qk === 'ip' ? 'IP' : '主机名'}</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            },
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            sorter: true,
            render: (_: any, record: AutoHealing.SecretsSource) =>
                record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 200,
            render: (_: any, record: AutoHealing.SecretsSource) => {
                const isActive = record.status === 'active';
                return (
                    <Space size="small" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={isActive ? '测试凭据' : '需先启用'}>
                            <Button
                                type="link" size="small"
                                icon={testingId === record.id ? <Spin size="small" /> : <ApiOutlined />}
                                onClick={() => handleOpenTestQuery(record)}
                                disabled={!!testingId || !isActive || !canManage}
                            />
                        </Tooltip>
                        <Tooltip title="查看">
                            <Button type="link" size="small" icon={<EyeOutlined />}
                                onClick={() => openDetail(record)} />
                        </Tooltip>
                        <Tooltip title="编辑">
                            <Button type="link" size="small" icon={<EditOutlined />}
                                onClick={() => openEdit(record)} disabled={!canManage} />
                        </Tooltip>
                        {record.is_default ? (
                            <Tooltip title="取消默认">
                                <Button type="link" size="small"
                                    icon={<StarFilled style={{ color: '#faad14' }} />}
                                    onClick={() => handleCancelDefault(record)} />
                            </Tooltip>
                        ) : (
                            <Tooltip title={isActive ? '设为默认' : '需先启用'}>
                                <Button type="link" size="small"
                                    icon={<StarOutlined />}
                                    onClick={() => handleSetDefault(record)}
                                    disabled={!isActive || !canManage} />
                            </Tooltip>
                        )}
                        <Switch
                            size="small"
                            checked={isActive}
                            onChange={() => handleToggleStatus(record)}
                            disabled={!canManage}
                        />
                        <Popconfirm title="确定删除？" description="删除后不可恢复"
                            onConfirm={() => handleDelete(record.id)}>
                            <Button type="link" size="small" danger
                                icon={<DeleteOutlined />} disabled={!canManage} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ], [openDetail, openEdit, handleDelete, handleSetDefault, handleCancelDefault, handleToggleStatus, handleOpenTestQuery, testingId, canManage]);

    /* ========== 数据请求 (前端分页：API 返回全量) ========== */
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        // 刷新数据
        const res = await getSecretsSources();
        let items = res.data || [];
        setAllSources(items);

        // 搜索筛选
        if (params.searchValue) {
            const keyword = params.searchValue.toLowerCase();
            items = items.filter(s => s.name.toLowerCase().includes(keyword));
        }

        // 高级搜索
        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.keyword) {
                const kw = adv.keyword.toLowerCase();
                items = items.filter(s => s.name.toLowerCase().includes(kw));
            }
            if (adv.type) items = items.filter(s => s.type === adv.type);
            if (adv.auth_type) items = items.filter(s => s.auth_type === adv.auth_type);
            if (adv.status) items = items.filter(s => s.status === adv.status);
        }

        // 排序
        if (params.sorter?.field) {
            const { field, order } = params.sorter;
            const dir = order === 'ascend' ? 1 : -1;
            items = [...items].sort((a: any, b: any) => {
                const va = a[field]; const vb = b[field];
                if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
                return String(va || '').localeCompare(String(vb || '')) * dir;
            });
        } else {
            // 默认排序：默认的优先，其次按优先级降序
            items = [...items].sort((a, b) => {
                if (a.is_default && !b.is_default) return -1;
                if (!a.is_default && b.is_default) return 1;
                return (b.priority || 0) - (a.priority || 0);
            });
        }

        // 前端分页
        const total = items.length;
        const start = (params.page - 1) * params.pageSize;
        const paged = items.slice(start, start + params.pageSize);
        return { data: paged, total };
    }, []);

    /* ========== 统计栏 ========== */
    const statsBar = useMemo(() => (
        <div className="secrets-stats-bar">
            <div className="secrets-stat-item">
                <CloudOutlined className="secrets-stat-icon secrets-stat-icon-total" />
                <div className="secrets-stat-content">
                    <div className="secrets-stat-value">{stats.total}</div>
                    <div className="secrets-stat-label">总密钥源</div>
                </div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <CheckCircleOutlined className="secrets-stat-icon secrets-stat-icon-active" />
                <div className="secrets-stat-content">
                    <div className="secrets-stat-value">{stats.active}</div>
                    <div className="secrets-stat-label">已启用</div>
                </div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <FileOutlined className="secrets-stat-icon secrets-stat-icon-file" />
                <div className="secrets-stat-content">
                    <div className="secrets-stat-value">{stats.file}</div>
                    <div className="secrets-stat-label">本地文件</div>
                </div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <SafetyCertificateOutlined className="secrets-stat-icon secrets-stat-icon-vault" />
                <div className="secrets-stat-content">
                    <div className="secrets-stat-value">{stats.vault}</div>
                    <div className="secrets-stat-label">Vault</div>
                </div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <GlobalOutlined className="secrets-stat-icon secrets-stat-icon-webhook" />
                <div className="secrets-stat-content">
                    <div className="secrets-stat-value">{stats.webhook}</div>
                    <div className="secrets-stat-label">Webhook</div>
                </div>
            </div>
        </div>
    ), [stats]);

    /* ========== 工具栏额外按钮 ========== */


    return (
        <>
            <StandardTable<AutoHealing.SecretsSource>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '密钥源列表' }]}
                title="密钥管理"
                description="管理 SSH 凭据来源，支持本地文件、HashiCorp Vault、Webhook 等多种方式获取凭据。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                primaryActionLabel="添加密钥源"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!canManage}
                onPrimaryAction={openCreate}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="secrets_v2"
            />

            {/* ====== 详情 Drawer ====== */}
            <Drawer
                title={null}
                size={560}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setCurrentSource(null); }}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
                destroyOnHidden
            >
                {currentSource && (() => {
                    const typeConfig = getSourceTypeConfig(currentSource.type);
                    const authConfig = getAuthTypeConfig(currentSource.auth_type);
                    return (
                        <>
                            <div className="secrets-detail-header">
                                <div className="secrets-detail-header-top">
                                    <div className="secrets-detail-header-icon"
                                        style={{ background: typeConfig.bgColor, color: typeConfig.color }}>
                                        {typeConfig.icon}
                                    </div>
                                    <div className="secrets-detail-header-info">
                                        <div className="secrets-detail-title">{currentSource.name}</div>
                                        <div className="secrets-detail-sub">{typeConfig.label}</div>
                                    </div>
                                    <Badge
                                        status={currentSource.status === 'active' ? 'success' : 'default'}
                                        text={currentSource.status === 'active' ? '已启用' : '已禁用'}
                                    />
                                </div>
                                <Space size="small">
                                    <Button size="small" icon={<ApiOutlined />}
                                        onClick={() => handleOpenTestQuery(currentSource)}
                                        disabled={currentSource.status !== 'active' || !canManage}>
                                        测试凭据
                                    </Button>
                                    <Button size="small" icon={<EditOutlined />}
                                        onClick={() => { setDrawerOpen(false); history.push(`/resources/secrets/${currentSource.id}/edit`); }}
                                        disabled={!canManage}>
                                        编辑配置
                                    </Button>
                                </Space>
                            </div>

                            <div className="secrets-detail-body">
                                {/* 基本信息 */}
                                <div className="secrets-detail-card">
                                    <div className="secrets-detail-card-header">
                                        <InfoCircleOutlined className="secrets-detail-card-header-icon" />
                                        <span className="secrets-detail-card-header-title">基本信息</span>
                                    </div>
                                    <div className="secrets-detail-card-body">
                                        <div className="secrets-detail-grid">
                                            <div className="secrets-detail-field">
                                                <span className="secrets-detail-field-label">认证方式</span>
                                                <div className="secrets-detail-field-value">
                                                    <Tag icon={authConfig.icon} color={authConfig.color}>{authConfig.label}</Tag>
                                                </div>
                                            </div>
                                            <div className="secrets-detail-field">
                                                <span className="secrets-detail-field-label">优先级</span>
                                                <div className="secrets-detail-field-value">{currentSource.priority}</div>
                                            </div>
                                            <div className="secrets-detail-field">
                                                <span className="secrets-detail-field-label">默认</span>
                                                <div className="secrets-detail-field-value">
                                                    {currentSource.is_default
                                                        ? <><StarFilled style={{ color: '#faad14', marginRight: 4 }} />是</>
                                                        : '否'
                                                    }
                                                </div>
                                            </div>
                                            <div className="secrets-detail-field">
                                                <span className="secrets-detail-field-label">查询键</span>
                                                <div className="secrets-detail-field-value">
                                                    {currentSource.config?.query_key
                                                        ? <Tag color="blue">按 {currentSource.config.query_key === 'ip' ? 'IP' : '主机名'}</Tag>
                                                        : '-'
                                                    }
                                                </div>
                                            </div>
                                            <div className="secrets-detail-field">
                                                <span className="secrets-detail-field-label">创建时间</span>
                                                <div className="secrets-detail-field-value">
                                                    {dayjs(currentSource.created_at).format('YYYY-MM-DD HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 连接配置 */}
                                <div className="secrets-detail-card">
                                    <div className="secrets-detail-card-header">
                                        <LinkOutlined className="secrets-detail-card-header-icon" />
                                        <span className="secrets-detail-card-header-title">连接配置</span>
                                    </div>
                                    <div className="secrets-detail-card-body">
                                        <div className="secrets-detail-grid">
                                            {currentSource.type === 'file' && (
                                                <>
                                                    <div className="secrets-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                        <span className="secrets-detail-field-label">文件路径</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Text code copyable>{currentSource.config?.path || currentSource.config?.key_path || '-'}</Text>
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">默认用户名</span>
                                                        <div className="secrets-detail-field-value">{currentSource.config?.username || '-'}</div>
                                                    </div>
                                                </>
                                            )}
                                            {currentSource.type === 'vault' && (
                                                <>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">Vault 地址</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Text code copyable>{currentSource.config?.address || '-'}</Text>
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">Secret 路径</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Text code>{currentSource.config?.secret_path || currentSource.config?.path_template || '-'}</Text>
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">认证</span>
                                                        <div className="secrets-detail-field-value">
                                                            {currentSource.config?.auth?.type || 'token'}
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">Token</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Text type="secondary">••••••••</Text>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {currentSource.type === 'webhook' && (
                                                <>
                                                    <div className="secrets-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                        <span className="secrets-detail-field-label">URL</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Text code copyable style={{ wordBreak: 'break-all' }}>{currentSource.config?.url || '-'}</Text>
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">请求方法</span>
                                                        <div className="secrets-detail-field-value">
                                                            <Tag>{currentSource.config?.method || 'POST'}</Tag>
                                                        </div>
                                                    </div>
                                                    <div className="secrets-detail-field">
                                                        <span className="secrets-detail-field-label">认证方式</span>
                                                        <div className="secrets-detail-field-value">
                                                            {currentSource.config?.auth?.type || '无认证'}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 原始配置 */}
                                <div className="secrets-detail-card">
                                    <div className="secrets-detail-card-header">
                                        <SettingOutlined className="secrets-detail-card-header-icon" />
                                        <span className="secrets-detail-card-header-title">原始配置 (JSON)</span>
                                    </div>
                                    <div className="secrets-detail-card-body" style={{ padding: 0 }}>
                                        <pre className="secrets-raw-config">
                                            {JSON.stringify(currentSource.config, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </Drawer>



            {/* ====== 测试凭据弹窗 ====== */}
            <Modal
                title={`测试凭据 - ${testQuerySource?.name || ''}`}
                open={testQueryModalOpen}
                onCancel={() => setTestQueryModalOpen(false)}
                onOk={handleTestQuery}
                okText="测试"
                cancelText="取消"
                confirmLoading={!!testingId}
                width={800}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <Alert
                        type="info" showIcon
                        message={testQuerySource?.config?.query_key
                            ? `当前密钥源按 ${testQuerySource.config.query_key === 'ip' ? 'IP' : '主机名'} 查询凭据`
                            : '当前密钥源所有主机共用同一凭据'}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>选择要测试的主机：</Text>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            请选择一到多台主机进行凭据有效性测试。测试过程将尝试使用该密钥源的配置连接到目标主机。
                        </div>
                    </div>
                    <HostSelector value={selectedTestHostIps} onChange={setSelectedTestHostIps} />
                </div>
            </Modal>

            {/* ====== 测试结果弹窗 ====== */}
            <Modal
                title="测试结果"
                open={testResultModalOpen}
                onCancel={() => setTestResultModalOpen(false)}
                footer={[<Button key="close" type="primary" onClick={() => setTestResultModalOpen(false)}>关闭</Button>]}
                width={600}
            >
                {testResults && (
                    <>
                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={8}><Card size="small"><Statistic title="总数" value={testResults.success_count + testResults.fail_count} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="成功" value={testResults.success_count} styles={{ content: { color: '#52c41a' } }} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="失败" value={testResults.fail_count} styles={{ content: { color: '#ff4d4f' } }} /></Card></Col>
                        </Row>
                        <div style={{ maxHeight: 350, overflow: 'auto' }}>
                            {testResults.results.map((r, i) => (
                                <div key={i} style={{
                                    padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
                                    background: r.success ? '#f6ffed' : '#fff2f0', marginBottom: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.success ? 0 : 6 }}>
                                        {r.success
                                            ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                                            : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />}
                                        <Text strong>{r.hostname || r.ip_address}</Text>
                                        {r.hostname && <Text type="secondary" style={{ fontSize: 12 }}>({r.ip_address})</Text>}
                                        {r.success && (
                                            <Tag color="green" style={{ marginLeft: 'auto' }}>
                                                {r.auth_type === 'ssh_key' ? 'SSH密钥' : '密码'}
                                            </Tag>
                                        )}
                                    </div>
                                    {!r.success && (
                                        <div style={{ marginLeft: 24 }}>
                                            <Text type="danger" style={{ fontSize: 12, wordBreak: 'break-all' }}>{r.message}</Text>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};



export default SecretsSourceList;
