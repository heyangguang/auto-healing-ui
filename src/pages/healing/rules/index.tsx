import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { message } from 'antd';
import {
    PlusOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import {
    getHealingRules, deleteHealingRule, activateHealingRule, deactivateHealingRule,
} from '@/services/auto-healing/healing-rules';
import { getRuleStats } from '@/services/auto-healing/healing';
import {
    advancedSearchFields,
    buildRuleQueryParams,
    mergeRuleSearchParams,
    searchFields,
    SORT_OPTIONS,
    type RuleSearchParams,
    type RuleSearchRequest,
} from './ruleQueryConfig';
import { RuleCardGrid } from './RuleCardGrid';
import { RuleDetailDrawer } from './RuleDetailDrawer';
import './rules.css';
import '../../../pages/execution/git-repos/index.css';

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
    const searchParamsRef = useRef<RuleSearchParams>({});

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

    const applyRuleResults = useCallback((data: AutoHealing.HealingRule[]) => {
        setRules(data);
        setSelectedRule((prev) => {
            if (!prev) {
                return prev;
            }
            const nextSelected = data.find((rule) => rule.id === prev.id) || null;
            if (!nextSelected) {
                setDrawerOpen(false);
            }
            return nextSelected;
        });
    }, []);

    const loadRules = useCallback(async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const params = buildRuleQueryParams(searchParamsRef.current, p, ps, sortBy, sortOrder);
            const res = await getHealingRules(params);
            applyRuleResults(res.data || []);
            setTotal(res.total || 0);
        } catch {
            // handled by global handler
        } finally {
            setLoading(false);
        }
    }, [applyRuleResults, page, pageSize, sortBy, sortOrder]);

    useEffect(() => { loadRules(); }, [loadRules]);

    // ==================== Search callback from StandardTable children mode ====================
    const handleSearch = useCallback((params: RuleSearchRequest) => {
        const merged = mergeRuleSearchParams(params);
        searchParamsRef.current = merged;
        setPage(1);
        (async () => {
            setLoading(true);
            try {
                const apiParams = buildRuleQueryParams(merged, 1, pageSize, sortBy, sortOrder);
                const res = await getHealingRules(apiParams);
                applyRuleResults(res.data || []);
                setTotal(res.total || 0);
            } catch { /* */ } finally { setLoading(false); }
        })();
    }, [applyRuleResults, pageSize, sortBy, sortOrder]);

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

    const handleDelete = async (e: React.MouseEvent<HTMLElement> | undefined, rule: AutoHealing.HealingRule) => {
        e?.stopPropagation();
        const prevRules = rules;
        const prevTotal = total;
        const nextRules = prevRules.filter((item) => item.id !== rule.id);
        const nextTotal = prevTotal - 1;
        const shouldLoadPreviousPage = nextRules.length === 0 && page > 1 && nextTotal > 0;
        setRules(nextRules);
        setTotal(nextTotal);
        if (selectedRule?.id === rule.id) {
            setDrawerOpen(false);
            setSelectedRule(null);
        }
        setActionLoading(rule.id);
        try {
            await deleteHealingRule(rule.id);
            message.success('规则已删除');
            if (shouldLoadPreviousPage) {
                setLoading(true);
                setPage(page - 1);
            }
        } catch {
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
                <RuleCardGrid
                    rules={rules}
                    loading={loading}
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    actionLoadingRuleId={actionLoading}
                    canCreateRule={access.canCreateRule}
                    canUpdateRule={access.canUpdateRule}
                    canDeleteRule={access.canDeleteRule}
                    onCreateRule={() => history.push('/healing/rules/create')}
                    onCardClick={handleCardClick}
                    onEditRule={(rule) => history.push(`/healing/rules/${rule.id}/edit`)}
                    onDeleteRule={handleDelete}
                    onToggleRule={handleToggle}
                    onPageChange={(nextPage, nextPageSize) => {
                        setPage(nextPage);
                        setPageSize(nextPageSize);
                    }}
                />
            </StandardTable>
            <RuleDetailDrawer
                open={drawerOpen}
                rule={selectedRule}
                canUpdateRule={access.canUpdateRule}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedRule(null);
                }}
                onEditRule={(rule) => {
                    setDrawerOpen(false);
                    history.push(`/healing/rules/${rule.id}/edit`);
                }}
            />
        </>
    );
};

export default HealingRulesPage;
