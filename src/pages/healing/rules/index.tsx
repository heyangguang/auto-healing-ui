import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    Button, message, Space, Tag, Typography, Switch, Popconfirm, Drawer, Badge, Tooltip,
    Row, Col, Spin, Empty, Pagination, Select,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, ThunderboltOutlined,
    CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined, BranchesOutlined, AimOutlined,
    ClockCircleOutlined, ExclamationCircleOutlined, UserOutlined, FireOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import {
    getHealingRules, deleteHealingRule, activateHealingRule, deactivateHealingRule,
} from '@/services/auto-healing/healing-rules';
import { getRuleStats } from '@/services/auto-healing/healing';
import './rules.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ==================== Constants ====================
const TRIGGER_MODE_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    auto: { label: '自动', color: 'blue', icon: <ThunderboltOutlined /> },
    manual: { label: '人工', color: 'orange', icon: <UserOutlined /> },
};

const priorityClass = (p: number) =>
    p >= 90 ? 'high' : p >= 50 ? 'medium' : 'low';

// ==================== Search Fields ====================
const searchFields: SearchField[] = [
    { key: 'name', label: '名称', placeholder: '输入规则名称搜索' },
    {
        key: '__enum__is_active', label: '启用状态',
        options: [
            { label: '已启用', value: 'true' },
            { label: '已停用', value: 'false' },
        ],
    },
    {
        key: '__enum__trigger_mode', label: '触发模式',
        options: [
            { label: '自动触发', value: 'auto' },
            { label: '人工触发', value: 'manual' },
        ],
    },
];

// ==================== Advanced Search Fields ====================
const advancedSearchFields: AdvancedSearchField[] = [
    {
        key: 'priority', label: '优先级', type: 'select',
        description: '按规则优先级过滤（0-100）',
        options: [
            { label: '高优先级 (90+)', value: '90' },
            { label: '中优先级 (50+)', value: '50' },
            { label: '低优先级 (<50)', value: '10' },
        ],
    },
    {
        key: 'match_mode', label: '匹配模式', type: 'select',
        description: '按条件匹配模式过滤',
        options: [
            { label: 'AND（全部匹配）', value: 'all' },
            { label: 'OR（任一匹配）', value: 'any' },
        ],
    },
    {
        key: 'has_flow', label: '流程关联', type: 'select',
        description: '筛选是否已关联自愈流程',
        options: [
            { label: '已关联流程', value: 'true' },
            { label: '未关联流程', value: 'false' },
        ],
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

// ==================== Sort Options ====================
const SORT_OPTIONS = [
    { value: 'priority', label: '优先级' },
    { value: 'created_at', label: '创建时间' },
    { value: 'updated_at', label: '更新时间' },
    { value: 'name', label: '名称' },
    { value: 'conditions_count', label: '条件数量' },
];

// ==================== Condition Helpers ====================
const flatConditionCount = (conds: AutoHealing.HealingRuleCondition[]): number => {
    let count = 0;
    for (const c of conds) {
        if (c.type === 'group' && c.conditions) count += flatConditionCount(c.conditions);
        else count++;
    }
    return count;
};

const renderConditionsDetail = (conditions: AutoHealing.HealingRuleCondition[], level = 0): React.ReactNode => {
    if (!conditions || conditions.length === 0) {
        return <Text type="secondary" style={{ fontSize: 12 }}>无触发条件</Text>;
    }
    return conditions.map((cond, idx) => {
        if (cond.type === 'group' && cond.conditions) {
            return (
                <div key={idx} className="rule-condition-group" style={{ marginLeft: level * 12 }}>
                    <div className="rule-condition-group-header">{cond.logic || 'AND'} 组</div>
                    {renderConditionsDetail(cond.conditions, level + 1)}
                </div>
            );
        }
        return (
            <div key={idx} className="rule-condition-item" style={{ marginLeft: level * 12 }}>
                <Tag color="blue" style={{ margin: 0 }}>{cond.field}</Tag>
                <Tag style={{ margin: 0 }}>{cond.operator}</Tag>
                <Text style={{ fontSize: 12 }} ellipsis>{String(cond.value ?? '')}</Text>
            </div>
        );
    });
};

// ==================== Main Page ====================
const HealingRulesPage: React.FC = () => {
    const access = useAccess();

    // Data
    const [rules, setRules] = useState<AutoHealing.HealingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState<{
        total: number; active_count: number; inactive_count: number;
        by_trigger_mode: Array<{ trigger_mode: string; count: number }>;
    } | null>(null);

    // Sort
    const [sortBy, setSortBy] = useState('priority');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Search/Filter
    const searchParamsRef = useRef<Record<string, any>>({});

    // Detail Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<AutoHealing.HealingRule | null>(null);

    // ==================== Data Loading ====================
    // ==================== Stats ====================
    const loadStats = useCallback(async () => {
        try {
            const res = await getRuleStats();
            setStats(res?.data || null);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const loadRules = useCallback(async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const params: any = { page: p, page_size: ps, sort_by: sortBy, sort_order: sortOrder };
            const sp = searchParamsRef.current;
            if (sp.name) params.name = sp.name;
            if (sp.name__exact) params.name__exact = sp.name__exact;
            if (sp.description) params.description = sp.description;
            if (sp.description__exact) params.description__exact = sp.description__exact;
            if (sp.is_active !== undefined && sp.is_active !== '') {
                params.is_active = sp.is_active === 'true';
            }
            if (sp.trigger_mode) params.trigger_mode = sp.trigger_mode;
            if (sp.priority) params.priority = Number(sp.priority);
            if (sp.match_mode) params.match_mode = sp.match_mode;
            if (sp.has_flow !== undefined && sp.has_flow !== '') {
                params.has_flow = sp.has_flow === 'true';
            }
            if (sp.created_at) {
                const [from, to] = sp.created_at;
                if (from) params.created_from = from;
                if (to) params.created_to = to;
            }
            const res = await getHealingRules(params);
            setRules(res.data || []);
            setTotal(res.total || 0);
        } catch {
            // handled by global handler
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortBy, sortOrder]);

    useEffect(() => { loadRules(); }, [loadRules]);

    // ==================== Search callback from StandardTable children mode ====================
    const handleSearch = useCallback((params: any) => {
        const merged: Record<string, any> = {};
        if (params.advancedSearch) {
            Object.assign(merged, params.advancedSearch);
        }
        if (params.filters) {
            for (const f of params.filters) {
                const key = f.field.replace(/^__enum__/, '');
                merged[key] = f.value;
            }
        }
        searchParamsRef.current = merged;
        setPage(1);
        (async () => {
            setLoading(true);
            try {
                const apiParams: any = { page: 1, page_size: pageSize, sort_by: sortBy, sort_order: sortOrder };
                if (merged.name) apiParams.name = merged.name;
                if (merged.name__exact) apiParams.name__exact = merged.name__exact;
                if (merged.description) apiParams.description = merged.description;
                if (merged.description__exact) apiParams.description__exact = merged.description__exact;
                if (merged.is_active !== undefined && merged.is_active !== '') {
                    apiParams.is_active = merged.is_active === 'true';
                }
                if (merged.trigger_mode) apiParams.trigger_mode = merged.trigger_mode;
                if (merged.priority) apiParams.priority = Number(merged.priority);
                if (merged.match_mode) apiParams.match_mode = merged.match_mode;
                if (merged.has_flow !== undefined && merged.has_flow !== '') {
                    apiParams.has_flow = merged.has_flow === 'true';
                }
                if (merged.created_at) {
                    const [from, to] = merged.created_at;
                    if (from) apiParams.created_from = from;
                    if (to) apiParams.created_to = to;
                }
                const res = await getHealingRules(apiParams);
                setRules(res.data || []);
                setTotal(res.total || 0);
            } catch { /* */ } finally { setLoading(false); }
        })();
    }, [pageSize, sortBy, sortOrder]);

    // ==================== Actions ====================
    const handleToggle = async (rule: AutoHealing.HealingRule, checked: boolean) => {
        if (checked && !rule.flow_id) {
            message.error('启用规则前必须关联自愈流程');
            return;
        }
        // 乐观更新：先本地更新 UI，API 失败再回滚
        const originalActive = rule.is_active;
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: checked } : r));
        setActionLoading(rule.id);
        try {
            if (checked) {
                await activateHealingRule(rule.id);
                message.success('规则已启用');
            } else {
                await deactivateHealingRule(rule.id);
                message.success('规则已停用');
            }
        } catch {
            // 失败回滚
            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: originalActive } : r));
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    const handleDelete = async (e: React.MouseEvent | undefined, rule: AutoHealing.HealingRule) => {
        e?.stopPropagation();
        // 乐观更新：先从列表移除
        const prevRules = rules;
        const prevTotal = total;
        setRules(prev => prev.filter(r => r.id !== rule.id));
        setTotal(prev => prev - 1);
        if (selectedRule?.id === rule.id) {
            setDrawerOpen(false);
            setSelectedRule(null);
        }
        setActionLoading(rule.id);
        try {
            await deleteHealingRule(rule.id);
            message.success('规则已删除');
        } catch {
            // 失败回滚
            setRules(prevRules);
            setTotal(prevTotal);
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    // ==================== Card Click → Detail Drawer ====================
    const handleCardClick = (rule: AutoHealing.HealingRule) => {
        setSelectedRule(rule);
        setDrawerOpen(true);
    };

    // ==================== Rule Card (Launchpad Style) ====================
    const renderRuleCard = (rule: AutoHealing.HealingRule) => {
        const modeCfg = TRIGGER_MODE_MAP[rule.trigger_mode] || { label: rule.trigger_mode, color: 'default', icon: null };
        const condCount = flatConditionCount(rule.conditions || []);
        const pCls = priorityClass(rule.priority);

        const cardClass = [
            'rule-card',
            `rule-card-priority-${pCls}`,
            !rule.is_active ? 'rule-card-inactive' : '',
        ].filter(Boolean).join(' ');

        return (
            <Col key={rule.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                <div className={cardClass} onClick={() => handleCardClick(rule)}>

                    {/* 右侧内容 — 高密度紧凑 */}
                    <div className="rule-card-body">
                        {/* 标题 + 触发模式 + 状态 */}
                        <div className="rule-card-header">
                            <div className="rule-card-title">
                                {rule.name || '未命名规则'}
                            </div>
                            <Space size={4}>
                                <span className={`rule-trigger-tag rule-trigger-tag-${rule.trigger_mode || 'auto'}`}>
                                    {rule.trigger_mode === 'manual' ? <><UserOutlined /> 人工</> : <><ThunderboltOutlined /> 自动</>}
                                </span>
                                {rule.is_active ? (
                                    <span className="rule-card-status-active">
                                        <CheckCircleOutlined /> 启用
                                    </span>
                                ) : (
                                    <span className="rule-card-status-inactive">已停用</span>
                                )}
                            </Space>
                        </div>



                        {/* 描述 */}
                        <div className="rule-card-desc">
                            {rule.description || '未添加描述'}
                        </div>

                        {/* 流程引用条 */}
                        {rule.flow ? (
                            <div className="rule-card-flow">
                                <BranchesOutlined style={{ fontSize: 10, flexShrink: 0 }} />
                                <span className="rule-card-flow-text">
                                    {rule.flow.name}
                                </span>
                            </div>
                        ) : (
                            <div className="rule-card-flow-warning">
                                <ExclamationCircleOutlined style={{ fontSize: 10 }} />
                                <span>未关联流程</span>
                            </div>
                        )}

                        {/* 2x2 信息网格 */}
                        <div className="rule-card-info-grid">
                            <span className="rule-card-info-item">
                                <span className={`rule-priority-badge rule-priority-badge-${pCls}`}>
                                    {pCls === 'high' ? <FireOutlined /> : <SafetyCertificateOutlined />}
                                    P{rule.priority}
                                </span>
                            </span>
                            <span className="rule-card-info-item">
                                <AimOutlined />
                                <span className="info-value">{condCount}</span> 条件
                            </span>
                            <span className="rule-card-info-item">
                                <Tag color={rule.match_mode === 'all' ? 'blue' : 'purple'}
                                    style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 4px' }}>
                                    {rule.match_mode === 'all' ? 'AND' : 'OR'}
                                </Tag>
                                {rule.match_mode === 'all' ? '全部' : '任一'}
                            </span>
                            <span className="rule-card-info-item">
                                <ClockCircleOutlined />
                                {rule.last_run_at
                                    ? dayjs(rule.last_run_at).fromNow()
                                    : '从未'}
                            </span>
                        </div>

                        {/* 底部 */}
                        <div className="rule-card-footer">
                            <span className="rule-card-footer-left">
                                <ClockCircleOutlined /> {rule.updated_at ? new Date(rule.updated_at).toLocaleDateString() : '-'}
                            </span>
                            <Space size={0} onClick={e => e.stopPropagation()}>
                                <Tooltip title={rule.is_active ? '停用' : '启用'}>
                                    <Switch
                                        size="small"
                                        checked={rule.is_active}
                                        loading={actionLoading === rule.id}
                                        onChange={(c) => handleToggle(rule, c)}
                                        disabled={!access.canUpdateRule}
                                    />
                                </Tooltip>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    disabled={!access.canUpdateRule}
                                    onClick={() => history.push(`/healing/rules/${rule.id}/edit`)}
                                />
                                <Popconfirm
                                    title="确定删除此规则？"
                                    description="删除后无法恢复"
                                    onConfirm={(e) => handleDelete(e as any, rule)}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        loading={actionLoading === rule.id}
                                        disabled={!access.canDeleteRule}
                                    />
                                </Popconfirm>
                            </Space>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    // ==================== Detail Drawer ====================
    const renderDetailDrawer = () => {
        if (!selectedRule) return null;
        const modeCfg = TRIGGER_MODE_MAP[selectedRule.trigger_mode] || { label: selectedRule.trigger_mode, color: 'default', icon: null };

        return (
            <Drawer
                title={
                    <Space>
                        <SafetyCertificateOutlined />
                        {selectedRule.name}
                        {selectedRule.is_active
                            ? <Badge status="processing" text={<Text style={{ fontSize: 12 }}>运行中</Text>} />
                            : <Tag>已停用</Tag>
                        }
                    </Space>
                }
                size={600}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelectedRule(null); }}
                destroyOnHidden
                extra={
                    <Button
                        icon={<EditOutlined />}
                        disabled={!access.canUpdateRule}
                        onClick={() => {
                            setDrawerOpen(false);
                            history.push(`/healing/rules/${selectedRule.id}/edit`);
                        }}
                    >
                        编辑
                    </Button>
                }
            >
                {/* 基础信息 */}
                <div className="rule-detail-card">
                    <h4><SafetyCertificateOutlined />基础信息</h4>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">规则名称</span>
                        <span className="rule-detail-value">{selectedRule.name}</span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">描述</span>
                        <span className="rule-detail-value">{selectedRule.description || '-'}</span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">优先级</span>
                        <span className="rule-detail-value">
                            <span className={`rule-priority-badge rule-priority-badge-${priorityClass(selectedRule.priority)}`}>
                                P{selectedRule.priority}
                            </span>
                        </span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">触发模式</span>
                        <span className="rule-detail-value">
                            <Tag icon={modeCfg.icon} color={modeCfg.color}>{modeCfg.label}</Tag>
                        </span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">匹配逻辑</span>
                        <span className="rule-detail-value">
                            <Tag color={selectedRule.match_mode === 'all' ? 'blue' : 'purple'}>
                                {selectedRule.match_mode === 'all' ? 'AND 全部满足' : 'OR 满足任一'}
                            </Tag>
                        </span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">最后运行</span>
                        <span className="rule-detail-value">
                            {selectedRule.last_run_at
                                ? dayjs(selectedRule.last_run_at).format('YYYY-MM-DD HH:mm:ss')
                                : '从未运行'}
                        </span>
                    </div>
                    <div className="rule-detail-row">
                        <span className="rule-detail-label">创建时间</span>
                        <span className="rule-detail-value">{dayjs(selectedRule.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                </div>

                {/* 匹配条件 */}
                <div className="rule-detail-card">
                    <h4><AimOutlined />匹配条件</h4>
                    {renderConditionsDetail(selectedRule.conditions)}
                </div>

                {/* 关联流程 */}
                <div className="rule-detail-card">
                    <h4><BranchesOutlined />关联流程</h4>
                    {selectedRule.flow ? (
                        <>
                            <div className="rule-detail-row">
                                <span className="rule-detail-label">流程名称</span>
                                <span className="rule-detail-value">{selectedRule.flow.name}</span>
                            </div>
                            {selectedRule.flow.description && (
                                <div className="rule-detail-row">
                                    <span className="rule-detail-label">流程描述</span>
                                    <span className="rule-detail-value">{selectedRule.flow.description}</span>
                                </div>
                            )}
                            <div className="rule-detail-row">
                                <span className="rule-detail-label">流程状态</span>
                                <span className="rule-detail-value">
                                    {selectedRule.flow.is_active
                                        ? <Badge status="success" text="启用" />
                                        : <Badge status="default" text="停用" />}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '12px 0', textAlign: 'center' }}>
                            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16, marginRight: 8 }} />
                            <Text type="warning">尚未关联自愈流程</Text>
                        </div>
                    )}
                </div>
            </Drawer>
        );
    };

    // ==================== Stats Bar ====================
    const statsBar = useMemo(() => {
        if (!stats) return null;
        const autoCount = stats.by_trigger_mode?.find(m => m.trigger_mode === 'auto')?.count ?? 0;
        const manualCount = stats.by_trigger_mode?.find(m => m.trigger_mode === 'manual')?.count ?? 0;
        const items = [
            { icon: <SafetyCertificateOutlined />, cls: 'total', val: stats.total, lbl: '总规则' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active_count, lbl: '启用' },
            { icon: <ThunderboltOutlined />, cls: 'total', val: autoCount, lbl: '自动' },
            { icon: <UserOutlined />, cls: 'pending', val: manualCount, lbl: '人工' },
            { icon: <CloseCircleOutlined />, cls: 'error', val: stats.inactive_count, lbl: '停用' },
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

    // ==================== Sort Toolbar (extraToolbarActions) ====================
    const sortToolbar = useMemo(() => (
        <SortToolbar
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            options={SORT_OPTIONS}
        />
    ), [sortBy, sortOrder]);

    // ==================== Render ====================
    return (
        <>
            <StandardTable<AutoHealing.HealingRule>
                tabs={[{ key: 'list', label: '规则列表' }]}
                title="自愈规则"
                description="定义事件驱动的自愈触发条件和关联流程，当 ITSM 工单匹配规则条件时自动触发自愈流程执行"
                headerIcon={
                    <SafetyCertificateOutlined style={{ fontSize: 28 }} />
                }
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                searchSchemaUrl="/api/v1/tenant/healing/rules/search-schema"
                onSearch={handleSearch}
                primaryActionLabel="新建规则"
                primaryActionIcon={<PlusOutlined />}
                onPrimaryAction={() => history.push('/healing/rules/create')}
                primaryActionDisabled={!access.canCreateRule}
                extraToolbarActions={sortToolbar}
            >
                {/* ===== Card Grid ===== */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="加载自愈规则..."><div /></Spin>
                    </div>
                ) : rules.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无自愈规则</Text>}
                    >
                        <Button type="dashed" onClick={() => history.push('/healing/rules/create')}>
                            新建规则
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[20, 20]} className="rules-grid">
                            {rules.map(renderRuleCard)}
                        </Row>

                        {/* ===== Pagination ===== */}
                        <div className="rules-pagination">
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={pageSize}
                                onChange={(p, size) => {
                                    setPage(p);
                                    setPageSize(size);
                                }}
                                showSizeChanger={{ showSearch: false }}
                                pageSizeOptions={['16', '24', '48']}
                                showQuickJumper
                                showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </StandardTable>
            {renderDetailDrawer()}
        </>
    );
};

export default HealingRulesPage;
