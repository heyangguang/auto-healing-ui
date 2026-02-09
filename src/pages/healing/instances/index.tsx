import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
    Button, message, Typography, Space, Input, Select, List, Tag, Badge, Drawer,
    Spin, Empty, Descriptions, Tabs, Statistic, Row, Col
} from 'antd';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';
import {
    SearchOutlined, ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined,
    CloseCircleOutlined, LoadingOutlined, PauseCircleOutlined, StopOutlined,
    ThunderboltOutlined, HistoryOutlined, FullscreenOutlined, WarningOutlined,
    PlayCircleOutlined, NodeIndexOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { useRequest } from '@umijs/max';
import ReactFlow, { Background, Controls, Edge, Node, useNodesState, useEdgesState, ProOptions } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { getHealingInstances, getHealingInstanceDetail } from '@/services/auto-healing/instances';
import dayjs from 'dayjs';
import JsonPrettyView from './components/JsonPrettyView';

// Import node types
import ApprovalNode from '../flows/editor/ApprovalNode';
import ConditionNode from '../flows/editor/ConditionNode';
import CustomNode from '../flows/editor/CustomNode';
import EndNode from '../flows/editor/EndNode';
import ExecutionNode from '../flows/editor/ExecutionNode';
import StartNode from '../flows/editor/StartNode';

const { Text } = Typography;
const { Option } = Select;

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

// Status configuration
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactElement; label: string }> = {
    pending: { color: '#d9d9d9', icon: <ClockCircleOutlined />, label: '等待中' },
    running: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '执行中' },
    waiting_approval: { color: '#fa8c16', icon: <PauseCircleOutlined />, label: '待审批' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已完成' },
    success: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '成功' },
    failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
    partial: { color: '#faad14', icon: <ClockCircleOutlined />, label: '部分成功' },
    cancelled: { color: '#8c8c8c', icon: <StopOutlined />, label: '已取消' },
    skipped: { color: '#d9d9d9', icon: <StopOutlined />, label: '已跳过' },
    simulated: { color: '#13c2c2', icon: <CheckCircleOutlined />, label: '模拟通过' },
};

// 节点状态对应的边颜色
const STATUS_EDGE_COLOR: Record<string, string> = {
    success: '#52c41a',
    completed: '#52c41a',
    failed: '#ff4d4f',
    partial: '#faad14',
    running: '#1890ff',
    waiting_approval: '#fa8c16',
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

/** 检测实例是否有失败节点 (completed 但有 failed/error 的 node_states) */
function hasFailedNodes(instance: AutoHealing.FlowInstance): boolean {
    if (instance.status !== 'completed') return false;
    const nodeStates = instance.node_states;
    if (!nodeStates || typeof nodeStates !== 'object') return false;
    return Object.values(nodeStates).some((raw: any) => {
        const ns = normalizeNodeState(raw);
        return ns?.status === 'failed' || ns?.status === 'error';
    });
}

/** 将 node_states 的值统一为对象格式（兼容字符串和对象两种后端格式） */
function normalizeNodeState(raw: any): Record<string, any> | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return { status: raw };
    return raw;
}

/**
 * 根据 node_states + current_node_id 推算所有已执行节点的集合及其状态。
 * 后端只在 node_states 中记录有实际处理的节点（如 execution/approval），
 * start 等简单节点可能没有记录，需要根据执行路径推断。
 */
function inferExecutedNodes(
    nodes: any[],
    edges: any[],
    nodeStates: Record<string, any>,
    currentNodeId: string | null,
    instanceStatus: string,
): Record<string, string> {
    const result: Record<string, string> = {};

    // 1. 所有在 node_states 中的节点直接用其状态
    for (const [nodeId, state] of Object.entries(nodeStates)) {
        const ns = normalizeNodeState(state);
        if (ns?.status) result[nodeId] = ns.status;
    }

    // 2. 如果有 current_node_id 且不在 nodeStates 中，根据实例状态推断
    if (currentNodeId && !result[currentNodeId]) {
        if (instanceStatus === 'completed') {
            result[currentNodeId] = 'success';
        } else if (instanceStatus === 'failed') {
            result[currentNodeId] = 'failed';
        } else if (instanceStatus === 'running') {
            result[currentNodeId] = 'running';
        }
    }

    // 3. 沿着边反向追溯：已执行节点的前置节点也一定执行过
    const executedSet = new Set(Object.keys(result));
    // 构建 target → source 反向映射
    const reverseEdges: Record<string, string[]> = {};
    for (const edge of edges) {
        const target = edge.target;
        const source = edge.source;
        if (!reverseEdges[target]) reverseEdges[target] = [];
        reverseEdges[target].push(source);
    }
    // BFS 反向追溯
    const queue = [...executedSet];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const parents = reverseEdges[nodeId] || [];
        for (const parent of parents) {
            if (!executedSet.has(parent)) {
                executedSet.add(parent);
                result[parent] = 'success'; // 前置节点一定是成功的
                queue.push(parent);
            }
        }
    }

    return result;
}

// Auto layout using dagre
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        // 规则触发节点需要更宽
        const isRuleNode = node.data?.type === 'trigger';
        dagreGraph.setNode(node.id, { width: isRuleNode ? 240 : 180, height: 60 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isMissingPosition = !node.position || (node.position.x === 0 && node.position.y === 0);

        if (isMissingPosition) {
            node.position = {
                x: nodeWithPosition.x - 90,
                y: nodeWithPosition.y - 30,
            };
        }
        return node;
    });

    return { nodes: layoutedNodes, edges };
};

const InstanceList: React.FC = () => {
    const [instances, setInstances] = useState<AutoHealing.FlowInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 50;

    // Selected instance
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(undefined);
    const [instanceDetail, setInstanceDetail] = useState<AutoHealing.FlowInstance | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Canvas state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Node detail drawer
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);

    const loadInstances = useCallback(async (currentPage: number, isReset: boolean) => {
        setLoading(true);
        try {
            const res = await getHealingInstances({
                page: currentPage,
                page_size: PAGE_SIZE,
                status: (filterStatus === 'completed_with_errors' || filterStatus === 'completed') ? 'completed' : filterStatus,
            });
            let data = res.data || [];

            // 前端过滤：完成(有异常) / 已完成(正常)
            if (filterStatus === 'completed_with_errors') {
                data = data.filter((inst: any) => hasFailedNodes(inst));
            } else if (filterStatus === 'completed') {
                data = data.filter((inst: any) => !hasFailedNodes(inst));
            }

            if (searchText) {
                const lower = searchText.toLowerCase();
                data = data.filter(inst =>
                    inst.id.toLowerCase().includes(lower) ||
                    inst.flow?.name?.toLowerCase().includes(lower) ||
                    inst.rule?.name?.toLowerCase().includes(lower) ||
                    inst.incident?.title?.toLowerCase().includes(lower)
                );
            }

            if (isReset) {
                setInstances(data);
                // Auto-select first instance on initial load
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
    }, [searchText, filterStatus]);

    useEffect(() => {
        loadInstances(1, true);
    }, [loadInstances]);

    // Load instance detail when selected
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
                // API returns {code, message, data: {...}} format
                const data = response?.data || response;
                setInstanceDetail(data);
                if (data && data.flow) {
                    // 推算所有已执行节点的状态
                    const executedNodes = inferExecutedNodes(
                        data.flow.nodes,
                        data.flow.edges,
                        data.node_states || {},
                        data.current_node_id,
                        data.status,
                    );

                    let flowNodes = data.flow.nodes.map((node: any) => {
                        const nodeState = normalizeNodeState(data.node_states?.[node.id]);
                        // 优先用 node_states 的状态，其次用推断的状态
                        const effectiveStatus = nodeState?.status || executedNodes[node.id];
                        return {
                            ...node,
                            draggable: false,
                            connectable: false,
                            selectable: true,
                            data: {
                                ...node.config,
                                label: node.name,
                                type: node.type,
                                status: effectiveStatus,
                                dryRunMessage: nodeState?.error_message || nodeState?.message || nodeState?.description,
                                nodeState: nodeState,
                                isCurrent: node.id === data.current_node_id,
                            },
                        } as Node;
                    });

                    // 边着色：已执行路径用绿色/状态色，未执行路径用灰色
                    let flowEdges = data.flow.edges.map((edge: any) => {
                        const sourceStatus = executedNodes[edge.source];
                        const targetStatus = executedNodes[edge.target];
                        const isExecutedEdge = sourceStatus && targetStatus;
                        // 边颜色取目标节点的状态色
                        const edgeColor = isExecutedEdge
                            ? (STATUS_EDGE_COLOR[targetStatus] || '#52c41a')
                            : '#d9d9d9';
                        return {
                            ...edge,
                            animated: isExecutedEdge,
                            style: {
                                stroke: edgeColor,
                                strokeWidth: isExecutedEdge ? 2 : 1,
                                opacity: isExecutedEdge ? 1 : 0.4,
                            },
                        };
                    }) as Edge[];

                    // Inject Virtual Rule Node
                    if (data.rule) {
                        const ruleNodeId = 'virtual-rule-trigger';
                        const startNode = flowNodes.find(n => n.type === 'start') || flowNodes[0];

                        const ruleNode: Node = {
                            id: ruleNodeId,
                            type: 'custom',
                            position: { x: 0, y: 0 },
                            data: {
                                label: `自愈规则: ${data.rule.name}`,
                                type: 'trigger',
                                status: 'triggered', // 外部触发源，使用紫色主题区别于标准流程节点
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

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
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

    // Handle node click
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setNodeDrawerOpen(true);
    }, []);

    const selectedStatusConfig = instanceDetail ? getStatusConfig(instanceDetail.status) : null;

    return (
        <PageContainer
            header={{
                title: <><HistoryOutlined /> 流程实例 / INSTANCES</>,
                subTitle: '自愈流程执行时间轴',
                breadcrumb: {}
            }}
            style={{ width: '100%', height: 'calc(100vh - 56px)' }}
        >
            <div style={{ height: 'calc(100vh - 180px)', border: '1px solid #f0f0f0', display: 'flex', background: '#fff' }}>
                {/* Left Pane: Instance List (30%) */}
                <div style={{ width: '30%', minWidth: 320, maxWidth: 420, height: '100%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Input.Search
                                placeholder="搜索流程名称 / 规则名称..."
                                allowClear
                                onSearch={(v) => setSearchText(v)}
                                style={{ flex: 1 }}
                            />
                            <Button icon={<ReloadOutlined />} size="small" onClick={handleRefresh} />
                        </div>
                        <Select
                            placeholder="按状态筛选"
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(v) => setFilterStatus(v)}
                        >
                            <Option value="running">执行中</Option>
                            <Option value="waiting_approval">待审批</Option>
                            <Option value="completed">
                                <Space size={4}><CheckCircleOutlined style={{ color: '#52c41a' }} />已完成(正常)</Space>
                            </Option>
                            <Option value="completed_with_errors">
                                <Space size={4}><WarningOutlined style={{ color: '#fa8c16' }} />完成(有异常)</Space>
                            </Option>
                            <Option value="failed">失败</Option>
                        </Select>
                    </div>

                    {/* Instance List */}
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
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedInstanceId(item.id)}
                                        style={{
                                            padding: '10px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            paddingLeft: 20,
                                            background: isSelected ? '#e6f7ff' : '#fff',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                                    >
                                        {/* Status Strip */}
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 3,
                                            background: isAnomalous ? '#fa8c16' : statusConfig.color
                                        }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 13 }} ellipsis>
                                                    {item.flow?.name || '未知流程'}
                                                </Text>
                                                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                                                    <Space size={8}>
                                                        <span>{dayjs(item.started_at).format('MM-DD HH:mm')}</span>
                                                        <span>{formatDuration(item.started_at, item.completed_at)}</span>
                                                    </Space>
                                                </div>
                                            </div>
                                            <Space size={4}>
                                                {isAnomalous && (
                                                    <Tag color="warning" style={{ margin: 0, border: 'none', fontSize: 11 }}>
                                                        <WarningOutlined /> 异常
                                                    </Tag>
                                                )}
                                                <Tag color={statusConfig.color} style={{ margin: 0, border: 'none', fontSize: 11 }}>
                                                    {statusConfig.label}
                                                </Tag>
                                            </Space>
                                        </div>
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

                {/* Right Pane: Canvas (70%) */}
                <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Canvas Header */}
                    {instanceDetail && (
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <Text strong>{instanceDetail.flow?.name}</Text>
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

                    {/* Canvas Area */}
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
                                <Background color="#f0f2f5" gap={16} />
                                <Controls />
                            </ReactFlow>
                        )}
                    </div>
                </div>
            </div>

            {/* Node Detail Drawer - Forensic Tabs */}
            <Drawer
                title={null}
                placement="right"
                width={600}
                open={nodeDrawerOpen}
                onClose={() => setNodeDrawerOpen(false)}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
                destroyOnClose
            >
                {selectedNode && (() => {
                    const ns = selectedNode.data?.nodeState;
                    const effectiveStatus = ns?.status || selectedNode.data?.status;
                    const nodeType = selectedNode.data?.type;
                    const isExecution = nodeType === 'execution';
                    const isApproval = nodeType === 'approval';

                    // Gradient header color by status
                    const headerGradient = effectiveStatus === 'completed' || effectiveStatus === 'success'
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                        : effectiveStatus === 'failed' || effectiveStatus === 'error'
                            ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                            : effectiveStatus === 'running'
                                ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                                : effectiveStatus === 'skipped'
                                    ? 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)'
                                    : 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)';

                    // Icon by node type
                    const nodeIcon = isExecution ? <PlayCircleOutlined style={{ fontSize: 24 }} />
                        : isApproval ? <PauseCircleOutlined style={{ fontSize: 24 }} />
                            : nodeType === 'start' ? <PlayCircleOutlined style={{ fontSize: 24 }} />
                                : nodeType === 'end' ? <StopOutlined style={{ fontSize: 24 }} />
                                    : nodeType === 'condition' ? <NodeIndexOutlined style={{ fontSize: 24 }} />
                                        : <AppstoreOutlined style={{ fontSize: 24 }} />;

                    // Build stdout logs for LogConsole
                    const stdoutLogs: LogEntry[] = ns?.stdout
                        ? ns.stdout.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => ({
                            id: `stdout-${i}`,
                            sequence: i,
                            log_level: line.includes('fatal:') || line.includes('UNREACHABLE') ? 'error'
                                : line.includes('changed:') ? 'changed'
                                    : line.includes('ok:') ? 'ok'
                                        : line.includes('skipping:') ? 'skipping'
                                            : 'info',
                            message: line,
                            created_at: ns?.started_at || new Date().toISOString(),
                        }))
                        : [];

                    const tabs = [
                        {
                            key: 'overview',
                            label: '概览',
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Descriptions column={2} size="small" bordered>
                                        <Descriptions.Item label="节点 ID">
                                            <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedNode.id}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="节点类型">
                                            <Tag>{nodeType}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="状态">
                                            {effectiveStatus ? (
                                                <Tag color={STATUS_CONFIG[effectiveStatus]?.color}>
                                                    {STATUS_CONFIG[effectiveStatus]?.label || effectiveStatus}
                                                </Tag>
                                            ) : <Text type="secondary">未开始</Text>}
                                        </Descriptions.Item>
                                        {ns?.started_at && (
                                            <Descriptions.Item label="开始时间">
                                                {dayjs(ns.started_at).format('YYYY-MM-DD HH:mm:ss')}
                                            </Descriptions.Item>
                                        )}
                                        {(ns?.finished_at || ns?.completed_at) && (
                                            <Descriptions.Item label="结束时间">
                                                {dayjs(ns.finished_at || ns.completed_at).format('YYYY-MM-DD HH:mm:ss')}
                                            </Descriptions.Item>
                                        )}
                                        {ns?.duration_ms != null && (
                                            <Descriptions.Item label="耗时">
                                                {ns.duration_ms >= 1000 ? `${(ns.duration_ms / 1000).toFixed(1)}s` : `${ns.duration_ms}ms`}
                                            </Descriptions.Item>
                                        )}
                                        {(ns?.error_message || ns?.message) && (
                                            <Descriptions.Item label="消息" span={2}>
                                                <Text type={ns?.status === 'failed' ? 'danger' : undefined}>
                                                    {ns.error_message || ns.message}
                                                </Text>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>

                                    {/* Execution stats */}
                                    {isExecution && ns?.stats && (
                                        <div style={{ marginTop: 16 }}>
                                            <Text strong style={{ marginBottom: 8, display: 'block' }}>执行统计</Text>
                                            <Row gutter={16}>
                                                <Col span={4}><Statistic title="OK" value={ns.stats.ok || 0} valueStyle={{ color: '#52c41a', fontSize: 20 }} /></Col>
                                                <Col span={4}><Statistic title="Changed" value={ns.stats.changed || 0} valueStyle={{ color: '#faad14', fontSize: 20 }} /></Col>
                                                <Col span={5}><Statistic title="Unreachable" value={ns.stats.unreachable || 0} valueStyle={{ color: '#ff4d4f', fontSize: 20 }} /></Col>
                                                <Col span={4}><Statistic title="Failed" value={ns.stats.failed || 0} valueStyle={{ color: '#ff4d4f', fontSize: 20 }} /></Col>
                                                <Col span={4}><Statistic title="Skipped" value={ns.stats.skipped || 0} valueStyle={{ color: '#8c8c8c', fontSize: 20 }} /></Col>
                                            </Row>
                                        </div>
                                    )}

                                    {/* Execution hosts */}
                                    {isExecution && ns?.hosts && ns.hosts.length > 0 && (
                                        <div style={{ marginTop: 16 }}>
                                            <Text strong style={{ marginBottom: 8, display: 'block' }}>目标主机</Text>
                                            <Space wrap>{ns.hosts.map((h: string) => <Tag key={h}>{h}</Tag>)}</Space>
                                        </div>
                                    )}

                                    {/* Approval info */}
                                    {isApproval && (
                                        <div style={{ marginTop: 16 }}>
                                            <Text strong style={{ marginBottom: 8, display: 'block' }}>审批信息</Text>
                                            <Descriptions column={1} size="small" bordered>
                                                {ns?.title && <Descriptions.Item label="审批标题">{ns.title}</Descriptions.Item>}
                                                {ns?.description && <Descriptions.Item label="审批说明">{ns.description}</Descriptions.Item>}
                                                {ns?.timeout_at && (
                                                    <Descriptions.Item label="超时时间">
                                                        {dayjs(ns.timeout_at).format('YYYY-MM-DD HH:mm:ss')}
                                                    </Descriptions.Item>
                                                )}
                                                {ns?.task_id && (
                                                    <Descriptions.Item label="审批任务 ID">
                                                        <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{ns.task_id}</Text>
                                                    </Descriptions.Item>
                                                )}
                                            </Descriptions>
                                        </div>
                                    )}
                                </div>
                            )
                        },
                        // Execution log tab (only for execution nodes with stdout)
                        ...(isExecution && stdoutLogs.length > 0 ? [{
                            key: 'execution_log',
                            label: '执行日志',
                            children: (
                                <div style={{ height: 'calc(100vh - 120px)', background: '#1e1e1e' }}>
                                    <LogConsole
                                        logs={stdoutLogs}
                                        height="100%"
                                        theme="dark"
                                    />
                                </div>
                            )
                        }] : []),
                        // Context tab
                        {
                            key: 'context',
                            label: '全局上下文',
                            children: (
                                <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                    <JsonPrettyView data={instanceDetail?.context || {}} />
                                </div>
                            )
                        },
                        // Config tab
                        {
                            key: 'config',
                            label: '配置参数',
                            children: (
                                <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                    <JsonPrettyView data={selectedNode.data || {}} />
                                </div>
                            )
                        },
                        // Raw state tab
                        ...(ns ? [{
                            key: 'raw',
                            label: '原始状态',
                            children: (
                                <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                    <JsonPrettyView data={ns} />
                                </div>
                            )
                        }] : [])
                    ];

                    return (
                        <>
                            {/* Gradient Header */}
                            <div style={{ background: headerGradient, padding: '16px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {nodeIcon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedNode.data?.label || selectedNode.id}</div>
                                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>类型: {nodeType} · ID: {selectedNode.id}</div>
                                </div>
                                {effectiveStatus && (
                                    <Tag color="#fff" style={{ color: headerGradient.includes('52c41a') ? '#52c41a' : headerGradient.includes('ff4d4f') ? '#ff4d4f' : headerGradient.includes('1890ff') ? '#1890ff' : '#722ed1', fontWeight: 600, border: 'none' }}>
                                        {STATUS_CONFIG[effectiveStatus]?.label || effectiveStatus}
                                    </Tag>
                                )}
                            </div>
                            <Tabs items={tabs} tabBarStyle={{ padding: '0 16px' }} />
                        </>
                    );
                })()}
            </Drawer>
        </PageContainer>
    );
};

export default InstanceList;
