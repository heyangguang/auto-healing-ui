import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    Button, message, Spin, Empty, Pagination, Row, Typography,
} from 'antd';
import {
    PlusOutlined, DeploymentUnitOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import {
    deleteFlow,
    getFlowSearchSchema,
    getFlowStats,
    getFlows,
    updateFlow,
} from '@/services/auto-healing/healing';
import {
    advancedSearchFields,
    buildFlowQueryParams,
    mergeFlowSearchParams,
    searchFields,
    SORT_OPTIONS,
    type FlowSearchParams,
    type FlowSearchRequest,
} from './flowQueryConfig';
import { FlowCard } from './FlowCard';
import { FlowDetailDrawer } from './FlowDetailDrawer';
import { FlowStatsBar } from './FlowStatsBar';
import './flows.css';
import '../../../pages/execution/git-repos/index.css';

const { Text } = Typography;

// ==================== Main Page ====================
const HealingFlowsPage: React.FC = () => {
    const access = useAccess();

    // Data
    const [flows, setFlows] = useState<AutoHealing.HealingFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState<{
        total: number; active_count: number; inactive_count: number;
    } | null>(null);

    // Sort
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Search/Filter
    const searchParamsRef = useRef<FlowSearchParams>({});

    // Detail Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [selectedFlow, setSelectedFlow] = useState<AutoHealing.HealingFlow | null>(null);

    // ==================== Stats ====================
    const loadStats = useCallback(async () => {
        try {
            const res = await getFlowStats();
            setStats(res?.data || null);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const applyFlowResults = useCallback((data: AutoHealing.HealingFlow[]) => {
        setFlows(data);
        setSelectedFlow((prev) => {
            if (!prev) {
                return prev;
            }
            const nextSelected = data.find((flow) => flow.id === prev.id) || null;
            if (!nextSelected) {
                setDrawerOpen(false);
            }
            return nextSelected;
        });
    }, []);

    // ==================== Param Builder ====================
    const buildApiParams = useCallback((searchParams: FlowSearchParams, p: number, ps: number) => {
        return buildFlowQueryParams(searchParams, p, ps, sortBy, sortOrder);
    }, [sortBy, sortOrder]);

    // ==================== Data Loading ====================
    const loadFlows = useCallback(async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const params = buildApiParams(searchParamsRef.current, p, ps);
            const res = await getFlows(params);
            applyFlowResults(res.data || []);
            setTotal(res.total || 0);
        } catch {
            // handled by global handler
        } finally {
            setLoading(false);
        }
    }, [applyFlowResults, page, pageSize, buildApiParams]);

    useEffect(() => { loadFlows(); }, [loadFlows]);

    // ==================== Search callback ====================
    const handleSearch = useCallback((params: FlowSearchRequest) => {
        const merged = mergeFlowSearchParams(params);
        searchParamsRef.current = merged;
        setPage(1);
        (async () => {
            setLoading(true);
            try {
                const apiParams = buildApiParams(merged, 1, pageSize);
                const res = await getFlows(apiParams);
                applyFlowResults(res.data || []);
                setTotal(res.total || 0);
            } catch { /* */ } finally { setLoading(false); }
        })();
    }, [applyFlowResults, pageSize, buildApiParams]);

    // ==================== Actions ====================
    const handleToggle = async (flow: AutoHealing.HealingFlow, checked: boolean) => {
        const originalActive = flow.is_active;
        setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, is_active: checked } : f));
        setActionLoading(flow.id);
        try {
            await updateFlow(flow.id, { is_active: checked });
            message.success(checked ? '流程已启用' : '流程已停用');
        } catch {
            setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, is_active: originalActive } : f));
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    const handleDelete = async (e: React.MouseEvent<HTMLElement> | undefined, flow: AutoHealing.HealingFlow) => {
        e?.stopPropagation();
        const prevFlows = flows;
        const prevTotal = total;
        const nextFlows = prevFlows.filter((item) => item.id !== flow.id);
        const nextTotal = prevTotal - 1;
        const shouldLoadPreviousPage = nextFlows.length === 0 && page > 1 && nextTotal > 0;
        setFlows(nextFlows);
        setTotal(nextTotal);
        if (selectedFlow?.id === flow.id) {
            setDrawerOpen(false);
            setSelectedFlow(null);
        }
        setActionLoading(flow.id);
        try {
            await deleteFlow(flow.id);
            message.success('流程已删除');
            if (shouldLoadPreviousPage) {
                setLoading(true);
                setPage(page - 1);
            }
        } catch {
            setFlows(prevFlows);
            setTotal(prevTotal);
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    // ==================== Card Click → Detail Drawer ====================
    const handleCardClick = (flow: AutoHealing.HealingFlow) => {
        setSelectedFlow(flow);
        setDrawerOpen(true);
    };
    // ==================== Sort Toolbar ====================
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
            <StandardTable<AutoHealing.HealingFlow>
                tabs={[{ key: 'list', label: '流程列表' }]}
                title="自愈流程"
                description="可视化编排自动化修复流程，使用 DAG 引擎驱动执行节点、条件分支、审批和通知"
                headerIcon={
                    <DeploymentUnitOutlined style={{ fontSize: 28 }} />
                }
                headerExtra={<FlowStatsBar stats={stats} />}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                searchSchemaRequest={getFlowSearchSchema}
                onSearch={handleSearch}
                primaryActionLabel="新建流程"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateFlow}
                onPrimaryAction={() => history.push('/healing/flows/editor')}
                extraToolbarActions={sortToolbar}
            >
                {/* ===== Card Grid ===== */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="加载自愈流程..."><div /></Spin>
                    </div>
                ) : flows.length === 0 && total === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无自愈流程</Text>}
                    >
                        <Button type="dashed" disabled={!access.canCreateFlow} onClick={() => history.push('/healing/flows/editor')}>
                            创建第一个流程
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[20, 20]} className="flows-grid">
                            {flows.map((flow) => (
                                <FlowCard
                                    key={flow.id}
                                    actionLoading={actionLoading}
                                    canDeleteFlow={access.canDeleteFlow}
                                    canUpdateFlow={access.canUpdateFlow}
                                    flow={flow}
                                    onDelete={handleDelete}
                                    onEdit={(flowId) => history.push(`/healing/flows/editor/${flowId}`)}
                                    onOpen={handleCardClick}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </Row>

                        {/* ===== Pagination ===== */}
                        <div className="flows-pagination">
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
            <FlowDetailDrawer
                canUpdateFlow={access.canUpdateFlow}
                flow={selectedFlow}
                onClose={() => { setDrawerOpen(false); setSelectedFlow(null); }}
                onEdit={(flowId) => {
                    setDrawerOpen(false);
                    history.push(`/healing/flows/editor/${flowId}`);
                }}
                onOpenExecutionTemplate={(taskTemplateId) => history.push(`/execution/templates/${taskTemplateId}`)}
                onOpenNotificationTemplates={() => history.push('/notification/templates')}
                open={drawerOpen}
            />
        </>
    );
};

export default HealingFlowsPage;
