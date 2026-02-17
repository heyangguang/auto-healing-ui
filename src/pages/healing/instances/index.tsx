import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import {
    Button, message, Typography, Space, Tag, Tooltip,
    Spin, Empty
} from 'antd';

import {
    ClockCircleOutlined, CheckCircleOutlined,
    CloseCircleOutlined, LoadingOutlined, PauseCircleOutlined, StopOutlined,
    ThunderboltOutlined, HistoryOutlined, FullscreenOutlined, WarningOutlined,
    PlayCircleOutlined, NodeIndexOutlined, AppstoreOutlined,
    BranchesOutlined
} from '@ant-design/icons';
import { history } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import ReactFlow, { Background, BackgroundVariant, Controls, Edge, Node, useNodesState, useEdgesState, ProOptions } from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from './utils/layoutUtils';
import AutoLayoutButton from './components/AutoLayoutButton';
import { getHealingInstances, getHealingInstanceDetail, getHealingInstanceStats } from '@/services/auto-healing/instances';
import dayjs from 'dayjs';

import '../../../pages/execution/git-repos/index.css';
import './instances.css';

// Import node types
import ApprovalNode from '../flows/editor/ApprovalNode';
import ConditionNode from '../flows/editor/ConditionNode';
import CustomNode from '../flows/editor/CustomNode';
import EndNode from '../flows/editor/EndNode';
import ExecutionNode from '../flows/editor/ExecutionNode';
import StartNode from '../flows/editor/StartNode';

const { Text } = Typography;

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    host_extractor: CustomNode,
    cmdb_validator: CustomNode,
    approval: ApprovalNode,
    execution: ExecutionNode,
    notification: CustomNode,
    condition: ConditionNode,
    set_variable: CustomNode,
    compute: CustomNode,
    custom: CustomNode,
};

const proOptions: ProOptions = { hideAttribution: true };

// ==================== 状态配置 ====================
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactElement; label: string }> = {
    pending: { color: '#d9d9d9', icon: <ClockCircleOutlined />, label: '等待中' },
    running: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '执行中' },
    waiting_approval: { color: '#fa8c16', icon: <PauseCircleOutlined />, label: '待审批' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已完成' },
    success: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '成功' },
    approved: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已通过' },
    failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
    rejected: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '已拒绝' },
    partial: { color: '#faad14', icon: <ClockCircleOutlined />, label: '部分成功' },
    cancelled: { color: '#8c8c8c', icon: <StopOutlined />, label: '已取消' },
    skipped: { color: '#d9d9d9', icon: <StopOutlined />, label: '已跳过' },
    simulated: { color: '#13c2c2', icon: <CheckCircleOutlined />, label: '模拟通过' },
};

// 节点状态 → 边颜色
const STATUS_EDGE_COLOR: Record<string, string> = {
    success: '#52c41a',
    completed: '#52c41a',
    approved: '#52c41a',
    failed: '#ff4d4f',
    rejected: '#ff4d4f',
    partial: '#faad14',
    running: '#1890ff',
    waiting_approval: '#fa8c16',
};

/**
 * 根据节点类型和状态，返回实际走过的 sourceHandle 名称
 * - 审批节点: approved/rejected
 * - 执行节点: success/partial/failed
 * - 条件节点: true/false
 * 返回 null 表示非分支节点或状态不明
 */
function getActiveBranchHandle(
    nodeType: string,
    nodeStatus: string | undefined,
): string | null {
    if (!nodeStatus) return null;
    switch (nodeType) {
        case 'approval':
            if (['approved', 'completed', 'success', 'simulated'].includes(nodeStatus)) return 'approved';
            if (['rejected'].includes(nodeStatus)) return 'rejected';
            return null;
        case 'execution':
            if (['completed', 'success'].includes(nodeStatus)) return 'success';
            if (['partial'].includes(nodeStatus)) return 'partial';
            if (['failed'].includes(nodeStatus)) return 'failed';
            return null;
        case 'condition':
            if (['completed', 'success', 'true'].includes(nodeStatus)) return 'true';
            if (['failed', 'false'].includes(nodeStatus)) return 'false';
            return null;
        default:
            return null;
    }
}

const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

// 节点类型中文映射
const NODE_TYPE_LABELS: Record<string, string> = {
    start: '开始',
    end: '结束',
    execution: '执行',
    approval: '审批',
    condition: '条件分支',
    notification: '通知',
    host_extractor: '主机提取',
    cmdb_validator: 'CMDB 校验',
    set_variable: '变量设置',
    compute: '计算',
    trigger: '触发器',
    custom: '自定义',
};

// ==================== 搜索配置 ====================
const searchFields: SearchField[] = [
    { key: 'search', label: '搜索', placeholder: '搜索流程名称 / 规则名称...' },
    {
        key: '__enum__status', label: '状态',
        options: [
            { label: '执行中', value: 'running' },
            { label: '待审批', value: 'waiting_approval' },
            { label: '已完成', value: 'completed' },
            { label: '失败', value: 'failed' },
            { label: '已取消', value: 'cancelled' },
        ],
    },
    { key: 'flow_name', label: '流程名称', placeholder: '输入流程名称搜索' },
    { key: 'rule_name', label: '规则名称', placeholder: '输入规则名称搜索' },
    {
        key: '__enum__has_error', label: '有异常',
        description: '筛选包含错误信息的实例',
        options: [
            { label: '有异常', value: 'true' },
            { label: '无异常', value: 'false' },
        ],
    },
];

// ==================== 高级搜索 ====================
const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'flow_name', label: '流程名称', type: 'input', placeholder: '输入流程名称搜索' },
    { key: 'rule_name', label: '规则名称', type: 'input', placeholder: '输入规则名称搜索' },
    { key: 'error_message', label: '错误信息', type: 'input', placeholder: '输入错误信息关键字' },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
    { key: 'started_at', label: '开始时间', type: 'dateRange' },
    { key: 'completed_at', label: '完成时间', type: 'dateRange' },
];

// ==================== 排序选项 ====================
const SORT_OPTIONS = [
    { value: 'created_at', label: '创建时间' },
    { value: 'started_at', label: '开始时间' },
    { value: 'completed_at', label: '完成时间' },
    { value: 'flow_name', label: '流程名称' },
    { value: 'rule_name', label: '规则名称' },
];

/** 检测实例是否有失败节点 */
function hasFailedNodes(instance: AutoHealing.FlowInstance): boolean {
    if (instance.status !== 'completed') return false;
    if (typeof instance.failed_node_count === 'number') return instance.failed_node_count > 0;
    const nodeStates = instance.node_states;
    if (!nodeStates || typeof nodeStates !== 'object') return false;
    return Object.values(nodeStates).some((raw: any) => {
        const ns = typeof raw === 'string' ? { status: raw } : raw;
        return ns?.status === 'failed' || ns?.status === 'error';
    });
}

/** 将 node_states 的值统一为对象格式 */
function normalizeNodeState(raw: any): Record<string, any> | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return { status: raw };
    return raw;
}

// ==================== 主组件 ====================
const InstanceList: React.FC = () => {
    const [instances, setInstances] = useState<AutoHealing.FlowInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // Sort
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const searchParamsRef = useRef<Record<string, any>>({});

    // 统计
    const [stats, setStats] = useState<{
        total: number; by_status: { status: string; count: number }[];
    } | null>(null);

    // 选中的实例
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(undefined);
    const [instanceDetail, setInstanceDetail] = useState<AutoHealing.FlowInstance | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // 画布
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);



    // 自动布局
    const handleAutoLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes.map(n => ({ ...n })), edges.map(e => ({ ...e })), 'TB', true,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [nodes, edges, setNodes, setEdges]);

    // ==================== 加载统计 ====================
    const loadStats = useCallback(async () => {
        try {
            const res = await getHealingInstanceStats();
            setStats(res?.data || null);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    // ==================== 构建 API 参数 ====================
    const buildApiParams = useCallback((sp: Record<string, any>, p: number) => {
        const params: any = { page: p, page_size: PAGE_SIZE, sort_by: sortBy, sort_order: sortOrder };
        if (sp.search) params.search = sp.search;
        if (sp.status) params.status = sp.status;
        if (sp.has_error !== undefined && sp.has_error !== '') {
            params.has_error = sp.has_error === 'true';
        }
        if (sp.flow_name) params.flow_name = sp.flow_name;
        if (sp.rule_name) params.rule_name = sp.rule_name;
        if (sp.error_message) params.error_message = sp.error_message;
        if (sp.created_at) {
            const [from, to] = sp.created_at;
            if (from) params.created_from = from;
            if (to) params.created_to = to;
        }
        if (sp.started_at) {
            const [from, to] = sp.started_at;
            if (from) params.started_from = from;
            if (to) params.started_to = to;
        }
        if (sp.completed_at) {
            const [from, to] = sp.completed_at;
            if (from) params.completed_from = from;
            if (to) params.completed_to = to;
        }
        return params;
    }, [sortBy, sortOrder]);

    // ==================== 加载实例列表 ====================
    const loadInstances = useCallback(async (currentPage: number, isReset: boolean) => {
        setLoading(true);
        try {
            const params = buildApiParams(searchParamsRef.current, currentPage);
            const res = await getHealingInstances(params as any);
            const data = res.data || [];

            if (isReset) {
                setInstances(data);
                if (data.length > 0) {
                    setSelectedInstanceId(data[0].id);
                }
            } else {
                setInstances(prev => [...prev, ...data]);
            }

            setHasMore(data.length === PAGE_SIZE);
            setPage(currentPage);
            setTotal(res.total || data.length);
        } catch (error) {
            message.error('加载实例列表失败');
            if (isReset) setInstances([]);
        } finally {
            setLoading(false);
        }
    }, [buildApiParams]);

    useEffect(() => {
        loadInstances(1, true);
    }, [loadInstances]);

    // ==================== 搜索回调 ====================
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
                const apiParams = buildApiParams(merged, 1);
                const res = await getHealingInstances(apiParams as any);
                setInstances(res.data || []);
                setTotal(res.total || 0);
                if ((res.data || []).length > 0) {
                    setSelectedInstanceId((res.data || [])[0]?.id);
                }
                loadStats();
            } catch { /* */ } finally { setLoading(false); }
        })();
    }, [buildApiParams, loadStats]);

    // ==================== 加载实例详情 → 构建画布 ====================
    useEffect(() => {
        if (!selectedInstanceId) {
            setInstanceDetail(null);
            setNodes([]);
            setEdges([]);
            return;
        }

        setDetailLoading(true);
        getHealingInstanceDetail(selectedInstanceId)
            .then((response: any) => {
                const data = response?.data || response;
                startTransition(() => {
                    setInstanceDetail(data);
                });
                if (data && data.flow_nodes && data.flow_edges) {
                    const nodeStates: Record<string, any> = data.node_states || {};
                    const currentNodeId: string | null = data.current_node_id;

                    // ====== 从 current_node_id 回溯已执行路径 ======
                    // 构建反向邻接表：target → sources
                    const reverseAdj: Record<string, string[]> = {};
                    for (const edge of data.flow_edges) {
                        if (!reverseAdj[edge.target]) reverseAdj[edge.target] = [];
                        reverseAdj[edge.target].push(edge.source);
                    }

                    // 从 current_node_id 反向 BFS，找到所有上游已走过的节点
                    const executedNodeIds = new Set<string>();
                    if (currentNodeId) {
                        const queue = [currentNodeId];
                        executedNodeIds.add(currentNodeId);
                        while (queue.length > 0) {
                            const nodeId = queue.shift()!;
                            for (const parent of (reverseAdj[nodeId] || [])) {
                                if (!executedNodeIds.has(parent)) {
                                    executedNodeIds.add(parent);
                                    queue.push(parent);
                                }
                            }
                        }
                    }
                    // 有明确 node_states 记录的节点也算已执行
                    Object.keys(nodeStates).forEach(id => executedNodeIds.add(id));

                    // 构建正向邻接表：source → targets（用于判断节点是否已被"穿过"）
                    const forwardAdj: Record<string, string[]> = {};
                    for (const edge of data.flow_edges) {
                        if (!forwardAdj[edge.source]) forwardAdj[edge.source] = [];
                        forwardAdj[edge.source].push(edge.target);
                    }

                    // 节点映射
                    let flowNodes = data.flow_nodes.map((node: any) => {
                        const nodeState = normalizeNodeState(nodeStates[node.id]);

                        // 判断是否"已穿过"：该节点在已执行路径上，且有下游节点也已执行
                        // → 说明流程已经过了这个节点，不管 node_states 记的是什么，都应该显示 success
                        const wasPassedThrough = executedNodeIds.has(node.id)
                            && (forwardAdj[node.id] || []).some(child => executedNodeIds.has(child));

                        const nodeStatus = wasPassedThrough
                            ? 'success'   // 流程已走过 → 绿色
                            : (nodeState?.status  // 当前节点 → 用后端真实状态
                                || (executedNodeIds.has(node.id) ? undefined : undefined));

                        return {
                            ...node,
                            draggable: false,
                            connectable: false,
                            selectable: true,
                            data: {
                                ...node.config,
                                label: node.name,
                                type: node.type,
                                status: nodeStatus,
                                dryRunMessage: nodeState?.error_message || nodeState?.message || nodeState?.description,
                                nodeState: nodeState,
                                // 唯一蓝色光晕：只有 current_node_id 才高亮
                                isCurrent: node.id === currentNodeId,
                            },
                        } as Node;
                    });

                    // 边着色：分支感知 — 只高亮实际走过的分支
                    // 先构建节点类型 + 状态查找表
                    const nodeTypeMap: Record<string, string> = {};
                    const nodeEffectiveStatus: Record<string, string | undefined> = {};
                    for (const node of data.flow_nodes) {
                        nodeTypeMap[node.id] = node.type;
                        const ns = normalizeNodeState(nodeStates[node.id]);
                        nodeEffectiveStatus[node.id] = ns?.status;
                    }

                    let flowEdges = data.flow_edges.map((edge: any) => {
                        const bothExecuted = executedNodeIds.has(edge.source) && executedNodeIds.has(edge.target);

                        // 对于有 sourceHandle 的边，需要检查是否走的就是这条分支
                        let isActiveBranch = true; // 默认 true（无 handle 的线性边）
                        if (edge.sourceHandle) {
                            const srcType = nodeTypeMap[edge.source] || '';
                            const srcStatus = nodeEffectiveStatus[edge.source];
                            const activeHandle = getActiveBranchHandle(srcType, srcStatus);
                            isActiveBranch = activeHandle === edge.sourceHandle;
                        }

                        const isExecutedEdge = bothExecuted && isActiveBranch;
                        // 未走过的分支边：使用对应分支颜色但半透明
                        const inactiveBranchColor = edge.sourceHandle
                            ? (edge.sourceHandle === 'rejected' || edge.sourceHandle === 'failed' || edge.sourceHandle === 'false'
                                ? '#ff4d4f' : edge.sourceHandle === 'partial' ? '#faad14' : '#52c41a')
                            : '#d9d9d9';

                        return {
                            ...edge,
                            animated: isExecutedEdge,
                            style: {
                                stroke: isExecutedEdge
                                    ? (STATUS_EDGE_COLOR[nodeEffectiveStatus[edge.target] || ''] || '#52c41a')
                                    : (edge.sourceHandle && bothExecuted ? inactiveBranchColor : '#d9d9d9'),
                                strokeWidth: isExecutedEdge ? 2.5 : 1,
                                opacity: isExecutedEdge ? 1 : (edge.sourceHandle && bothExecuted ? 0.2 : 0.35),
                                strokeDasharray: (!isExecutedEdge && edge.sourceHandle && bothExecuted) ? '5 3' : undefined,
                            },
                        };
                    }) as Edge[];

                    // 注入虚拟触发规则节点
                    if (data.rule) {
                        const ruleNodeId = 'virtual-rule-trigger';
                        const startNode = flowNodes.find((n: Node) => n.type === 'start') || flowNodes[0];

                        const ruleNode: Node = {
                            id: ruleNodeId,
                            type: 'custom',
                            position: {
                                x: startNode?.position?.x ?? 0,
                                y: (startNode?.position?.y ?? 0) - 100,
                            },
                            data: {
                                label: `自愈规则: ${data.rule.name}`,
                                type: 'trigger',
                                status: 'triggered',
                                details: data.rule,
                            },
                            draggable: false,
                            connectable: false,
                        };

                        flowNodes = [ruleNode, ...flowNodes];

                        if (startNode) {
                            flowEdges = [{
                                id: `edge-${ruleNodeId}-${startNode.id}`,
                                source: ruleNodeId,
                                target: startNode.id,
                                type: 'smoothstep',
                                animated: true,
                                style: { stroke: '#722ed1', strokeWidth: 2 },
                            }, ...flowEdges];
                        }
                    }

                    // 计算每个节点的活跃连接点（在虚拟节点注入之后）
                    const activeHandlesMap: Record<string, string[]> = {};
                    for (const edge of flowEdges) {
                        if (edge.animated) {
                            const srcH = (edge as any).sourceHandle || 'default';
                            if (!activeHandlesMap[edge.source]) activeHandlesMap[edge.source] = [];
                            activeHandlesMap[edge.source].push(srcH);
                            if (!activeHandlesMap[edge.target]) activeHandlesMap[edge.target] = [];
                            activeHandlesMap[edge.target].push('target');
                        }
                    }
                    flowNodes = flowNodes.map((node: Node) => ({
                        ...node,
                        data: { ...node.data, activeHandles: activeHandlesMap[node.id] || [] },
                    }));

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
                    startTransition(() => {
                        setNodes(layoutedNodes);
                        setEdges(layoutedEdges);
                    });
                }
            })
            .catch(() => {
                message.error('加载实例详情失败');
            })
            .finally(() => {
                setDetailLoading(false);
            });
    }, [selectedInstanceId]);

    const handleRefresh = () => {
        loadInstances(1, true);
        loadStats();
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
            loadInstances(page + 1, false);
        }
    };

    const formatDuration = (startedAt?: string, completedAt?: string) => {
        if (!startedAt) return '-';
        const start = new Date(startedAt).getTime();
        const end = completedAt ? new Date(completedAt).getTime() : Date.now();
        const diff = Math.floor((end - start) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    };

    // 点击节点 → 跳转到详情页
    const onNodeClick = useCallback((_event: React.MouseEvent, _node: Node) => {
        if (selectedInstanceId) {
            history.push(`/healing/instances/${selectedInstanceId}`);
        }
    }, [selectedInstanceId]);

    const selectedStatusConfig = instanceDetail ? getStatusConfig(instanceDetail.status) : null;

    // ==================== 统计栏 ====================
    const statsBar = useMemo(() => {
        if (!stats) return null;
        const statusMap: Record<string, number> = {};
        (stats.by_status || []).forEach(s => { statusMap[s.status] = s.count; });

        const items = [
            { icon: <HistoryOutlined />, cls: 'total', val: stats.total, lbl: '总实例' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: statusMap['completed'] || 0, lbl: '已完成' },
            { icon: <LoadingOutlined />, cls: 'pending', val: statusMap['running'] || 0, lbl: '执行中' },
            { icon: <PauseCircleOutlined />, cls: 'warning', val: statusMap['waiting_approval'] || 0, lbl: '待审批' },
            { icon: <CloseCircleOutlined />, cls: 'error', val: statusMap['failed'] || 0, lbl: '失败' },
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

    // ==================== 渲染 ====================
    return (
        <>
            <StandardTable<AutoHealing.FlowInstance>
                tabs={[{ key: 'list', label: '实例列表' }]}
                title="流程实例"
                description="自愈流程运行实例管理，可视化查看执行路径与节点状态"
                headerIcon={<HistoryOutlined style={{ fontSize: 28 }} />}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                onSearch={handleSearch}
                extraToolbarActions={sortToolbar}
            >
                {/* ===== 左右分栏: 列表(20%) + 画布(80%) ===== */}
                <div style={{ height: 'calc(100vh - 280px)', border: '1px solid #f0f0f0', display: 'flex', background: '#fff' }}>
                    {/* 左侧：实例列表 */}
                    <div style={{ width: '20%', minWidth: 280, maxWidth: 360, height: '100%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                        <div
                            style={{ flex: 1, overflowY: 'auto' }}
                            onScroll={handleScroll}
                        >
                            {instances.length === 0 && !loading ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无实例" style={{ marginTop: 60 }} />
                            ) : (
                                instances.map((item) => {
                                    const statusConfig = getStatusConfig(item.status);
                                    const isSelected = item.id === selectedInstanceId;
                                    const isAnomalous = hasFailedNodes(item);
                                    const nodeCount = item.node_count ?? 0;
                                    const failedCount = item.failed_node_count ?? 0;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedInstanceId(item.id)}
                                            style={{
                                                padding: '8px 10px 8px 14px',
                                                borderBottom: '1px solid #f0f0f0',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                background: isSelected ? '#e6f7ff' : '#fff',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                                        >
                                            {/* 状态条 */}
                                            <div style={{
                                                position: 'absolute',
                                                left: 0, top: 0, bottom: 0, width: 3,
                                                background: isAnomalous ? '#fa8c16' : statusConfig.color
                                            }} />

                                            {/* 行1: 流程名 + 状态标签 */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong style={{ fontSize: 12, flex: 1, minWidth: 0 }} ellipsis>
                                                    {item.flow_name || '未知流程'}
                                                </Text>
                                                <Space size={4} style={{ flexShrink: 0 }}>
                                                    {isAnomalous && (
                                                        <Tag color="warning" style={{ margin: 0, border: 'none', fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                                                            <WarningOutlined />
                                                        </Tag>
                                                    )}
                                                    <Tag color={statusConfig.color} style={{ margin: 0, border: 'none', fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>
                                                        {statusConfig.icon} {statusConfig.label}
                                                    </Tag>
                                                </Space>
                                            </div>

                                            {/* 行2: 规则 + 事件 */}
                                            {(item.rule_name || item.rule?.name || item.incident_title || item.incident?.title) && (
                                                <div style={{ fontSize: 11, color: '#595959', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {(item.rule_name || item.rule?.name) && (
                                                        <Tooltip title={`规则: ${item.rule_name || item.rule?.name}`}>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, maxWidth: '50%' }}>
                                                                <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 10 }} />
                                                                <Text style={{ fontSize: 11, color: '#595959' }} ellipsis>{item.rule_name || item.rule?.name}</Text>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                    {(item.rule_name || item.rule?.name) && (item.incident_title || item.incident?.title) && <span style={{ color: '#d9d9d9' }}>·</span>}
                                                    {(item.incident_title || item.incident?.title) && (
                                                        <Tooltip title={item.incident_title || item.incident?.title}>
                                                            <Text style={{ fontSize: 11, color: '#8c8c8c', flex: 1 }} ellipsis>
                                                                {item.incident_title || item.incident?.title}
                                                            </Text>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            )}

                                            {/* 行3: 时间 + 节点统计 */}
                                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Space size={6}>
                                                    <span><ClockCircleOutlined style={{ fontSize: 10 }} /> {dayjs(item.started_at).format('MM-DD HH:mm')}</span>
                                                    <span>{formatDuration(item.started_at || undefined, item.completed_at || undefined)}</span>
                                                </Space>
                                                <Space size={6}>
                                                    {nodeCount > 0 && (
                                                        <span><BranchesOutlined style={{ fontSize: 10 }} /> {nodeCount}节点</span>
                                                    )}
                                                    {failedCount > 0 && (
                                                        <span style={{ color: '#ff4d4f' }}><CloseCircleOutlined style={{ fontSize: 10 }} /> {failedCount}失败</span>
                                                    )}
                                                </Space>
                                            </div>

                                            {/* 行4: 错误信息 */}
                                            {item.error_message && (
                                                <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2, background: '#fff2f0', padding: '1px 6px', borderRadius: 3 }}>
                                                    <Text style={{ fontSize: 11, color: '#ff4d4f' }} ellipsis>{item.error_message}</Text>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            {loading && (
                                <div style={{ textAlign: 'center', padding: '12px 0', color: '#999' }}>
                                    <Space><Spin size="small" /> 加载中...</Space>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：画布(80%) */}
                    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* 画布顶栏 */}
                        {instanceDetail && (
                            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space>
                                    <Text strong>{instanceDetail.flow_name}</Text>
                                    {selectedStatusConfig && (
                                        <Tag color={selectedStatusConfig.color} style={{ border: 'none' }}>
                                            <Space size={4}>
                                                {selectedStatusConfig.icon}
                                                {selectedStatusConfig.label}
                                            </Space>
                                        </Tag>
                                    )}
                                </Space>
                                <Space>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {instanceDetail.incident && (
                                            <><ThunderboltOutlined style={{ color: '#faad14' }} /> {instanceDetail.rule?.name}</>
                                        )}
                                    </Text>
                                    <Button
                                        size="small"
                                        icon={<FullscreenOutlined />}
                                        onClick={() => history.push(`/healing/instances/${selectedInstanceId}`)}
                                    >
                                        详情
                                    </Button>
                                </Space>
                            </div>
                        )}

                        {/* 画布区域 */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            {detailLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Spin size="large" />
                                </div>
                            ) : !instanceDetail ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Empty description="选择左侧实例查看画布" />
                                </div>
                            ) : (
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    onNodeClick={onNodeClick}
                                    nodeTypes={nodeTypes}
                                    proOptions={proOptions}
                                    fitView
                                    fitViewOptions={{ padding: 0.3, maxZoom: 0.8 }}
                                    attributionPosition="bottom-right"
                                >
                                    <Background variant={BackgroundVariant.Dots} color="#bfbfbf" gap={20} size={1.5} />
                                    <Controls />
                                    <AutoLayoutButton onAutoLayout={handleAutoLayout} />
                                </ReactFlow>
                            )}
                        </div>
                    </div>
                </div>
            </StandardTable>

        </>
    );
};

export default InstanceList;

