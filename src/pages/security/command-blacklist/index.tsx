import React, { useState, useCallback, useMemo } from 'react';
import {
    PlusOutlined, StopOutlined, SafetyCertificateOutlined,
    DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
    EditOutlined, SecurityScanOutlined, BugOutlined,
    ThunderboltOutlined, CloudOutlined, DatabaseOutlined,
    DesktopOutlined, CodeOutlined, SearchOutlined,
    LockOutlined, FireOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import {
    Space, Tooltip, message, Typography, Tag, Button,
    Badge, Switch, Popconfirm, Drawer, Descriptions, Divider,
} from 'antd';
import dayjs from 'dayjs';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
    getCommandBlacklist,
    deleteCommandBlacklistRule,
    toggleCommandBlacklistRule,
    batchToggleCommandBlacklistRules,
} from '@/services/auto-healing/commandBlacklist';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import './index.css';

const { Text } = Typography;

/* ========== 配置常量 ========== */
const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    critical: { label: '严重', color: '#ff4d4f', icon: <FireOutlined />, tagColor: 'red' },
    high: { label: '高危', color: '#fa8c16', icon: <WarningOutlined />, tagColor: 'orange' },
    medium: { label: '中危', color: '#fadb14', icon: <ExclamationCircleOutlined />, tagColor: 'gold' },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    filesystem: { label: '文件系统', icon: <CodeOutlined />, color: '#1890ff' },
    network: { label: '网络', icon: <CloudOutlined />, color: '#52c41a' },
    system: { label: '系统', icon: <DesktopOutlined />, color: '#722ed1' },
    database: { label: '数据库', icon: <DatabaseOutlined />, color: '#eb2f96' },
};

const MATCH_TYPE_CONFIG: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
    contains: { label: '包含匹配', desc: '检查行中是否包含该文本', icon: <SearchOutlined /> },
    regex: { label: '正则匹配', desc: '使用正则表达式匹配', icon: <BugOutlined /> },
    exact: { label: '精确匹配', desc: '行内容去空格后完全匹配', icon: <LockOutlined /> },
};

const SEVERITY_OPTIONS = [
    { value: 'critical', label: '严重' },
    { value: 'high', label: '高危' },
    { value: 'medium', label: '中危' },
];

const CATEGORY_OPTIONS = [
    { value: 'filesystem', label: '文件系统' },
    { value: 'network', label: '网络' },
    { value: 'system', label: '系统' },
    { value: 'database', label: '数据库' },
];

const STATUS_FILTER_OPTIONS = [
    { value: 'true', label: '启用' },
    { value: 'false', label: '禁用' },
];

/* ========== Header Icon ========== */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M4 16h40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        <path d="M14 26h20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M14 32h12" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="35" cy="32" r="6" stroke="#ff4d4f" strokeWidth="2" fill="none" />
        <path d="M32 29l6 6M38 29l-6 6" stroke="#ff4d4f" strokeWidth="2" />
    </svg>
);

/* ========== 主组件 ========== */
const CommandBlacklistPage: React.FC = () => {
    const access = useAccess();
    const canManage = !!access.canManageBlacklist;
    const canDelete = !!access.canDeleteBlacklist;

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshTrigger(n => n + 1), []);

    /* ---- 统计 ---- */
    const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, high: 0, medium: 0 });

    /* ---- 详情抽屉 ---- */
    const [drawerRule, setDrawerRule] = useState<CommandBlacklistRule | null>(null);

    /* ---- 批量操作 ---- */
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    const handleBatchToggle = useCallback(async (isActive: boolean) => {
        if (selectedRowKeys.length === 0) return;
        setBatchLoading(true);
        try {
            const res = await batchToggleCommandBlacklistRules(selectedRowKeys as string[], isActive);
            message.success(res.message || `已${isActive ? '启用' : '禁用'} ${res.count} 条规则`);
            setSelectedRowKeys([]);
            triggerRefresh();
        } catch { /* global error handler */ }
        finally { setBatchLoading(false); }
    }, [selectedRowKeys, triggerRefresh]);

    /* ======= 操作回调 ======= */
    const openCreate = useCallback(() => {
        history.push('/security/command-blacklist/create');
    }, []);

    const openEdit = useCallback((rule: CommandBlacklistRule) => {
        history.push(`/security/command-blacklist/${rule.id}/edit`);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteCommandBlacklistRule(id);
            message.success('已删除');
            triggerRefresh();
        } catch { /* global error handler */ }
    }, [triggerRefresh]);

    const handleToggle = useCallback(async (rule: CommandBlacklistRule) => {
        try {
            await toggleCommandBlacklistRule(rule.id);
            message.success(rule.is_active ? '已禁用' : '已启用');
            triggerRefresh();
        } catch { /* global error handler */ }
    }, [triggerRefresh]);

    /* ========== 列定义 ========== */
    const columns = useMemo<StandardColumnDef<CommandBlacklistRule>[]>(() => [
        {
            columnKey: 'name',
            columnTitle: '规则名称',
            fixedColumn: true,
            dataIndex: 'name',
            width: 180,
            sorter: true,
            render: (_: any, record: CommandBlacklistRule) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <Tooltip title={record.name}>
                        <a
                            style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={(e) => { e.stopPropagation(); setDrawerRule(record); }}
                        >
                            {record.name}
                        </a>
                    </Tooltip>
                    {record.is_system && (
                        <span className="blacklist-system-badge" style={{ flexShrink: 0 }}>
                            <LockOutlined style={{ fontSize: 10 }} /> 内置
                        </span>
                    )}
                </div>
            ),
        },
        {
            columnKey: 'pattern',
            columnTitle: '匹配模式',
            dataIndex: 'pattern',
            width: 240,
            render: (_: any, record: CommandBlacklistRule) => {
                const matchCfg = MATCH_TYPE_CONFIG[record.match_type] || MATCH_TYPE_CONFIG.contains;
                return (
                    <div className="blacklist-pattern-cell">
                        <Tooltip title={`${matchCfg.label}: ${record.pattern}`}>
                            <code className="blacklist-pattern-code">{record.pattern}</code>
                        </Tooltip>
                        <Tag style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}>
                            {matchCfg.label}
                        </Tag>
                    </div>
                );
            },
        },
        {
            columnKey: 'severity',
            columnTitle: '级别',
            dataIndex: 'severity',
            width: 90,
            sorter: true,
            headerFilters: SEVERITY_OPTIONS,
            render: (_: any, record: CommandBlacklistRule) => {
                const cfg = SEVERITY_CONFIG[record.severity] || SEVERITY_CONFIG.medium;
                return (
                    <Tag
                        icon={cfg.icon}
                        color={cfg.tagColor}
                        className={record.severity === 'critical' ? 'blacklist-severity-critical' : ''}
                        style={{ margin: 0 }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            columnKey: 'category',
            columnTitle: '分类',
            dataIndex: 'category',
            width: 110,
            sorter: true,
            headerFilters: CATEGORY_OPTIONS,
            render: (_: any, record: CommandBlacklistRule) => {
                const cfg = CATEGORY_CONFIG[record.category];
                return cfg ? (
                    <Text style={{ fontSize: 13 }}>{cfg.label}</Text>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                );
            },
        },
        {
            columnKey: 'is_active',
            columnTitle: '状态',
            dataIndex: 'is_active',
            width: 80,
            headerFilters: STATUS_FILTER_OPTIONS,
            render: (_: any, record: CommandBlacklistRule) => (
                <Badge
                    status={record.is_active ? 'success' : 'default'}
                    text={record.is_active ? '启用' : '禁用'}
                />
            ),
        },
        {
            columnKey: 'description',
            columnTitle: '描述',
            dataIndex: 'description',
            width: 200,
            defaultVisible: false,
            render: (_: any, record: CommandBlacklistRule) => (
                <Tooltip title={record.description}>
                    <span className="blacklist-desc-cell">{record.description || '-'}</span>
                </Tooltip>
            ),
        },
        {
            columnKey: 'updated_at',
            columnTitle: '更新时间',
            dataIndex: 'updated_at',
            width: 160,
            sorter: true,
            render: (_: any, record: CommandBlacklistRule) =>
                record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-',
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 160,
            render: (_: any, record: CommandBlacklistRule) => (
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={record.is_system ? '内置规则不可编辑' : '编辑'}>
                        <Button type="link" size="small" icon={<EditOutlined />}
                            onClick={() => openEdit(record)}
                            disabled={record.is_system || !canManage}
                        />
                    </Tooltip>
                    <Switch
                        size="small"
                        checked={record.is_active}
                        onChange={() => handleToggle(record)}
                        disabled={!canManage}
                    />
                    <Tooltip title={record.is_system ? '内置规则不可删除' : '删除'}>
                        {record.is_system ? (
                            <Button type="link" size="small" danger
                                icon={<DeleteOutlined />} disabled />
                        ) : (
                            <Popconfirm title="确定删除？" description="删除后不可恢复"
                                onConfirm={() => handleDelete(record.id)}>
                                <Button type="link" size="small" danger
                                    icon={<DeleteOutlined />} disabled={!canDelete} />
                            </Popconfirm>
                        )}
                    </Tooltip>
                </Space>
            ),
        },
    ], [openEdit, handleDelete, handleToggle, canManage, canDelete]);

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

        if (params.searchValue) {
            apiParams.name = params.searchValue;
        }

        if (params.advancedSearch) {
            const adv = params.advancedSearch;
            if (adv.name) apiParams.name = adv.name;
            if (adv.name__exact) apiParams.name__exact = adv.name__exact;
            if (adv.pattern) apiParams.pattern = adv.pattern;
            if (adv.pattern__exact) apiParams.pattern__exact = adv.pattern__exact;
            if (adv.category) apiParams.category = adv.category;
            if (adv.severity) apiParams.severity = adv.severity;
            if (adv.is_active !== undefined && adv.is_active !== '') apiParams.is_active = adv.is_active;
        }

        const res = await getCommandBlacklist(apiParams);
        const data = res.data || [];

        setStats({
            total: res.total || 0,
            active: data.filter(r => r.is_active).length,
            critical: data.filter(r => r.severity === 'critical').length,
            high: data.filter(r => r.severity === 'high').length,
            medium: data.filter(r => r.severity === 'medium').length,
        });

        return { data, total: res.total || 0 };
    }, []);

    /* ========== 统计栏 ========== */
    const statsBar = useMemo(() => (
        <div className="blacklist-stats-bar">
            <div className="blacklist-stat-item">
                <SecurityScanOutlined className="blacklist-stat-icon blacklist-stat-icon-total" />
                <div className="blacklist-stat-content">
                    <div className="blacklist-stat-value">{stats.total}</div>
                    <div className="blacklist-stat-label">总规则数</div>
                </div>
            </div>
            <div className="blacklist-stat-divider" />
            <div className="blacklist-stat-item">
                <CheckCircleOutlined className="blacklist-stat-icon blacklist-stat-icon-active" />
                <div className="blacklist-stat-content">
                    <div className="blacklist-stat-value">{stats.active}</div>
                    <div className="blacklist-stat-label">已启用</div>
                </div>
            </div>
            <div className="blacklist-stat-divider" />
            <div className="blacklist-stat-item">
                <FireOutlined className="blacklist-stat-icon blacklist-stat-icon-critical" />
                <div className="blacklist-stat-content">
                    <div className="blacklist-stat-value">{stats.critical}</div>
                    <div className="blacklist-stat-label">严重</div>
                </div>
            </div>
            <div className="blacklist-stat-divider" />
            <div className="blacklist-stat-item">
                <WarningOutlined className="blacklist-stat-icon blacklist-stat-icon-high" />
                <div className="blacklist-stat-content">
                    <div className="blacklist-stat-value">{stats.high}</div>
                    <div className="blacklist-stat-label">高危</div>
                </div>
            </div>
            <div className="blacklist-stat-divider" />
            <div className="blacklist-stat-item">
                <ExclamationCircleOutlined className="blacklist-stat-icon blacklist-stat-icon-medium" />
                <div className="blacklist-stat-content">
                    <div className="blacklist-stat-value">{stats.medium}</div>
                    <div className="blacklist-stat-label">中危</div>
                </div>
            </div>
        </div>
    ), [stats]);

    const searchFields = useMemo(() => [
        { key: 'name', label: '规则名称', description: '按名称模糊搜索' },
    ], []);

    return (<>
        <StandardTable<CommandBlacklistRule>
            refreshTrigger={refreshTrigger}
            tabs={[{ key: 'list', label: '黑名单规则' }]}
            title="高危指令黑名单"
            description="Ansible 执行前自动扫描 Playbook 工作空间中的所有文件，检测并拦截高危指令，保障系统安全。"
            headerIcon={headerIcon}
            headerExtra={statsBar}
            searchFields={searchFields}
            searchSchemaUrl="/api/v1/command-blacklist/search-schema"
            primaryActionLabel="添加规则"
            primaryActionIcon={<PlusOutlined />}
            primaryActionDisabled={!canManage}
            onPrimaryAction={openCreate}
            columns={columns}
            rowKey="id"
            onRowClick={(record) => setDrawerRule(record)}
            request={handleRequest}
            defaultPageSize={20}
            preferenceKey="command_blacklist_v1"
            rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
            }}
        />

        {/* ========== 批量操作栏 ========== */}
        {selectedRowKeys.length > 0 && (
            <div style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: '#fff', padding: '12px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 16,
                zIndex: 1000, minWidth: 360,
            }}>
                <Text strong>已选 {selectedRowKeys.length} 条</Text>
                <Button
                    type="primary" size="small"
                    icon={<CheckCircleOutlined />}
                    loading={batchLoading}
                    disabled={!canManage}
                    onClick={() => handleBatchToggle(true)}
                >
                    批量启用
                </Button>
                <Button
                    size="small" danger
                    icon={<StopOutlined />}
                    loading={batchLoading}
                    disabled={!canManage}
                    onClick={() => handleBatchToggle(false)}
                >
                    批量禁用
                </Button>
                <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                </Button>
            </div>
        )}

        {/* ========== 详情抽屉 ========== */}
        <Drawer
            title={
                <Space>
                    <SecurityScanOutlined />
                    <span>规则详情</span>
                    {drawerRule && (
                        <>
                            <Tag color={SEVERITY_CONFIG[drawerRule.severity]?.tagColor || 'default'}
                                icon={SEVERITY_CONFIG[drawerRule.severity]?.icon}>
                                {SEVERITY_CONFIG[drawerRule.severity]?.label || drawerRule.severity}
                            </Tag>
                            {drawerRule.is_system && <Tag><LockOutlined /> 内置</Tag>}
                        </>
                    )}
                </Space>
            }
            open={!!drawerRule}
            onClose={() => setDrawerRule(null)}
            width={560}
            extra={
                drawerRule && !drawerRule.is_system && (
                    <Button type="primary" icon={<EditOutlined />}
                        disabled={!canManage}
                        onClick={() => { setDrawerRule(null); openEdit(drawerRule); }}>
                        编辑规则
                    </Button>
                )
            }
        >
            {drawerRule && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* 基本信息 */}
                    <Descriptions title="基本信息" column={2} bordered size="small">
                        <Descriptions.Item label="规则名称" span={2}>
                            <Text style={{ fontWeight: 500 }}>{drawerRule.name}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="严重级别">
                            <Tag color={SEVERITY_CONFIG[drawerRule.severity]?.tagColor || 'default'}
                                icon={SEVERITY_CONFIG[drawerRule.severity]?.icon}>
                                {SEVERITY_CONFIG[drawerRule.severity]?.label || drawerRule.severity}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="分类">
                            {CATEGORY_CONFIG[drawerRule.category]?.label || drawerRule.category || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="状态">
                            <Badge
                                status={drawerRule.is_active ? 'success' : 'default'}
                                text={drawerRule.is_active ? '启用' : '禁用'}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="类型">
                            {drawerRule.is_system
                                ? <Tag><LockOutlined /> 系统内置</Tag>
                                : <Text type="secondary">自定义</Text>}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider style={{ margin: 0 }} />

                    {/* 匹配配置 */}
                    <Descriptions title="匹配配置" column={1} bordered size="small">
                        <Descriptions.Item label="匹配类型">
                            <Tag>{MATCH_TYPE_CONFIG[drawerRule.match_type]?.label || drawerRule.match_type}</Tag>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                {MATCH_TYPE_CONFIG[drawerRule.match_type]?.desc}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>

                    {/* 匹配模式代码块 */}
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>匹配模式</Text>
                        <div style={{
                            padding: 16, background: '#1e1e1e', color: '#e06c75',
                            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                            fontSize: 14, lineHeight: 1.6, wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {drawerRule.pattern}
                        </div>
                    </div>

                    {/* 风险说明 */}
                    {drawerRule.description && (
                        <>
                            <Divider style={{ margin: 0 }} />
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>风险说明</Text>
                                <div style={{
                                    padding: '12px 16px', background: '#fffbe6',
                                    border: '1px solid #ffe58f', lineHeight: 1.6,
                                }}>
                                    <Space align="start">
                                        <ExclamationCircleOutlined style={{ color: '#faad14', marginTop: 3 }} />
                                        <Text>{drawerRule.description}</Text>
                                    </Space>
                                </div>
                            </div>
                        </>
                    )}

                    <Divider style={{ margin: 0 }} />

                    {/* 时间信息 */}
                    <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="创建时间">
                            {drawerRule.created_at ? dayjs(drawerRule.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="更新时间">
                            {drawerRule.updated_at ? dayjs(drawerRule.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}
        </Drawer>
    </>);
};

export default CommandBlacklistPage;
