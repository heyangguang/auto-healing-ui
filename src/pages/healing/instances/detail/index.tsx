import {
    cancelHealingInstance,
    getHealingInstanceDetail,
    retryHealingInstance,
} from '@/services/auto-healing/instances';
import { getExecutionLogs } from '@/services/auto-healing/execution';
import { createInstanceEventStream, NodeStatus } from '@/services/auto-healing/sse';

import { history, useParams, useRequest } from '@umijs/max';
import { Button, Card, Drawer, Empty, Space, Spin, Steps, Tabs, Tag, Typography, message, Descriptions, Result, Timeline, Alert } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, EyeOutlined, ClockCircleOutlined, BugOutlined, FileTextOutlined, WarningOutlined, ThunderboltOutlined, AimOutlined, AppstoreOutlined, TagOutlined, DashboardOutlined, AlertOutlined, NodeIndexOutlined, PlayCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    Node,
    ProOptions,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { getLayoutedElements } from '../utils/layoutUtils';
import AutoLayoutButton from '../components/AutoLayoutButton';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';

// Import node types from the editor
import ApprovalNode from '../../flows/editor/ApprovalNode';
import ConditionNode from '../../flows/editor/ConditionNode';
import CustomNode from '../../flows/editor/CustomNode';
import EndNode from '../../flows/editor/EndNode';
import ExecutionNode from '../../flows/editor/ExecutionNode';
import StartNode from '../../flows/editor/StartNode';
import JsonPrettyView from '../components/JsonPrettyView';
import SubPageHeader from '@/components/SubPageHeader';

// Define node types
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

/** 将 node_states 的值统一为对象格式（兼容字符串和对象两种后端格式） */
function normalizeNodeState(raw: any): Record<string, any> | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return { status: raw };
    return raw;
}

// 节点状态对应的边颜色
const STATUS_EDGE_COLOR: Record<string, string> = {
    success: '#52c41a', completed: '#52c41a', approved: '#52c41a',
    failed: '#ff4d4f', rejected: '#ff4d4f', partial: '#faad14',
    running: '#1890ff', waiting_approval: '#fa8c16',
};

// 节点类型中文标签
const NODE_TYPE_LABELS: Record<string, string> = {
    start: '开始', end: '结束', execution: '执行', approval: '审批',
    condition: '条件分支', notification: '通知', host_extractor: '主机提取',
    cmdb_validator: 'CMDB 校验', set_variable: '变量设置',
    compute: '计算', trigger: '触发器', custom: '自定义',
};

// 状态中文标签
const STATUS_LABELS: Record<string, string> = {
    pending: '等待中', running: '执行中', waiting_approval: '待审批',
    completed: '已完成', success: '成功', approved: '已通过',
    failed: '失败', rejected: '已拒绝', error: '错误',
    partial: '部分成功', cancelled: '已取消', skipped: '已跳过',
    simulated: '模拟通过', triggered: '已触发',
};

// 配置参数中文标签
const CONFIG_LABELS: Record<string, string> = {
    label: '节点名称', type: '节点类型', description: '描述',
    task_template_id: '任务模板 ID', task_template_name: '任务模板',
    playbook_id: 'Playbook ID', playbook_name: 'Playbook',
    extra_vars: '额外变量', hosts: '目标主机',
    timeout: '超时', timeout_seconds: '超时(秒)',
    condition: '条件表达式', expression: '表达式',
    title: '审批标题', approval_title: '审批标题',
    notification_template_id: '通知模板 ID',
    notification_channel_id: '通知渠道 ID',
    on_success: '成功时', on_failure: '失败时',
    retry_count: '重试次数', retry_interval: '重试间隔',
};

/**
 * 根据节点类型和状态，返回实际走过的 sourceHandle 名称
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

/** 根据 node_states + current_node_id 推算所有已执行节点 */
function inferExecutedNodes(
    nodes: any[], edges: any[],
    nodeStates: Record<string, any>,
    currentNodeId: string | null,
    instanceStatus: string,
): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [nodeId, state] of Object.entries(nodeStates)) {
        const ns = normalizeNodeState(state);
        if (ns?.status) result[nodeId] = ns.status;
    }
    if (currentNodeId && !result[currentNodeId]) {
        if (instanceStatus === 'completed') result[currentNodeId] = 'success';
        else if (instanceStatus === 'failed') result[currentNodeId] = 'failed';
        else if (instanceStatus === 'running') result[currentNodeId] = 'running';
    }
    const executedSet = new Set(Object.keys(result));
    const reverseEdges: Record<string, string[]> = {};
    for (const edge of edges) {
        if (!reverseEdges[edge.target]) reverseEdges[edge.target] = [];
        reverseEdges[edge.target].push(edge.source);
    }
    const queue = [...executedSet];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        for (const parent of (reverseEdges[nodeId] || [])) {
            if (!executedSet.has(parent)) {
                executedSet.add(parent);
                result[parent] = 'success';
                queue.push(parent);
            }
        }
    }
    return result;
}

// 执行日志 Tab - 异步加载 API 日志
const ExecutionLogTab: React.FC<{ runId?: string; fallbackLogs: LogEntry[] }> = ({ runId, fallbackLogs }) => {
    const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!runId || loaded) return;
        setLoading(true);
        getExecutionLogs(runId, { page: 1, page_size: 500 })
            .then((res: any) => {
                const logs = res?.data || [];
                if (logs.length > 0) {
                    setApiLogs(logs.map((l: any) => ({
                        id: l.id,
                        sequence: l.sequence,
                        log_level: l.log_level || 'info',
                        message: l.message,
                        created_at: l.created_at,
                    })));
                }
            })
            .catch(() => {/* 静默回退到 fallbackLogs */ })
            .finally(() => { setLoading(false); setLoaded(true); });
    }, [runId, loaded]);

    const displayLogs = apiLogs.length > 0 ? apiLogs : fallbackLogs;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 160px)' }}>
                <Spin tip="加载执行日志中..." />
            </div>
        );
    }

    if (displayLogs.length === 0) {
        return <Empty description="暂无执行日志" style={{ marginTop: 60 }} />;
    }

    return (
        <div style={{ height: 'calc(100vh - 160px)', background: '#1e1e1e' }}>
            <LogConsole
                logs={displayLogs}
                height="100%"
                theme="dark"
            />
        </div>
    );
};

const HealingInstanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [contextDrawerVisible, setContextDrawerVisible] = useState(false);
    const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    const [contextData, setContextData] = useState<any>({});
    const [instanceStatus, setInstanceStatus] = useState<string>('pending');

    // Store logs per node for the LogConsole
    // Map<NodeID, LogEntry[]>
    const [nodeLogs, setNodeLogs] = useState<Record<string, LogEntry[]>>({});

    // Auto layout handler
    const handleAutoLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes.map(n => ({ ...n })), edges.map(e => ({ ...e })), 'TB', true,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    };

    // Helper to update node status in the graph locally
    const updateNodeStatus = (nodeId: string, status: string, errorMessage?: string, description?: string) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            status: status,
                            dryRunMessage: errorMessage || description,
                        },
                    };
                }
                return node;
            })
        );
    };

    const [ruleDrawerVisible, setRuleDrawerVisible] = useState(false);
    const [incidentDrawerVisible, setIncidentDrawerVisible] = useState(false);

    // Fetch initial instance data
    const { data: instance, loading, refresh } = useRequest(
        async () => {
            if (!id) return null;
            return getHealingInstanceDetail(id);
        },
        {
            ready: !!id,
            refreshDeps: [id],
            onSuccess: (data) => {
                if (data && data.flow_nodes && data.flow_edges) {
                    setInstanceStatus(data.status);
                    setContextData(data.context || {});

                    // 推算所有已执行节点的状态
                    const executedNodes = inferExecutedNodes(
                        data.flow_nodes, data.flow_edges,
                        data.node_states || {}, data.current_node_id, data.status,
                    );

                    // Transform nodes with status
                    let flowNodes = data.flow_nodes.map((node: any) => {
                        const nodeState = normalizeNodeState(data.node_states?.[node.id]);
                        const effectiveStatus = nodeState?.status || executedNodes[node.id];
                        return {
                            ...node,
                            draggable: false,
                            connectable: false,
                            selectable: true,
                            data: {
                                ...node.config,
                                label: node.name || node.config?.label || NODE_TYPE_LABELS[node.type] || node.type,
                                type: node.type,
                                status: effectiveStatus,
                                dryRunMessage: nodeState?.error_message || nodeState?.message || nodeState?.description,
                                _nodeState: nodeState, // Full state for detail drawer
                                isCurrent: node.id === data.current_node_id,
                            },
                        } as Node;
                    });

                    // 边着色：分支感知 — 只高亮实际走过的分支
                    const nodeTypeMap: Record<string, string> = {};
                    for (const node of data.flow_nodes as any[]) {
                        nodeTypeMap[node.id] = node.type;
                    }

                    let flowEdges = data.flow_edges.map((edge: any) => {
                        const sourceStatus = executedNodes[edge.source];
                        const targetStatus = executedNodes[edge.target];
                        const bothExecuted = !!sourceStatus && !!targetStatus;

                        // 分支判断：有 sourceHandle 的边需要匹配实际走过的分支
                        let isActiveBranch = true;
                        if (edge.sourceHandle) {
                            const srcType = nodeTypeMap[edge.source] || '';
                            const nodeState = normalizeNodeState(data.node_states?.[edge.source]);
                            const activeHandle = getActiveBranchHandle(srcType, nodeState?.status || sourceStatus);
                            isActiveBranch = activeHandle === edge.sourceHandle;
                        }

                        const isExecutedEdge = bothExecuted && isActiveBranch;
                        const inactiveBranchColor = edge.sourceHandle
                            ? (edge.sourceHandle === 'rejected' || edge.sourceHandle === 'failed' || edge.sourceHandle === 'false'
                                ? '#ff4d4f' : edge.sourceHandle === 'partial' ? '#faad14' : '#52c41a')
                            : '#d9d9d9';

                        return {
                            ...edge,
                            animated: isExecutedEdge,
                            style: {
                                stroke: isExecutedEdge
                                    ? (STATUS_EDGE_COLOR[targetStatus] || '#52c41a')
                                    : (edge.sourceHandle && bothExecuted ? inactiveBranchColor : '#d9d9d9'),
                                strokeWidth: isExecutedEdge ? 2 : 1,
                                opacity: isExecutedEdge ? 1 : (edge.sourceHandle && bothExecuted ? 0.2 : 0.4),
                                strokeDasharray: (!isExecutedEdge && edge.sourceHandle && bothExecuted) ? '5 3' : undefined,
                            },
                        };
                    }) as Edge[];

                    // Inject Virtual Rule Node if Rule exists
                    if (data.rule) {
                        const ruleNodeId = 'virtual-rule-trigger';
                        const startNode = flowNodes.find((n: any) => n.type === 'start') || flowNodes[0];

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
                    flowNodes = flowNodes.map((node: any) => ({
                        ...node,
                        data: { ...node.data, activeHandles: activeHandlesMap[node.id] || [] },
                    }));

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        flowNodes,
                        flowEdges
                    );

                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                }
            },
        },
    );

    // SSE Integration
    useEffect(() => {
        if (!id || !instanceStatus) return;

        // Only connect if running/pending
        if (['completed', 'failed', 'cancelled'].includes(instanceStatus)) {
            return;
        }

        const eventSource = createInstanceEventStream(id, {
            onFlowStart: () => {
                setInstanceStatus('running');
                message.info('流程开始执行');
            },
            onNodeStart: (data) => {
                updateNodeStatus(data.node_id, 'running');
            },
            onNodeLog: (data) => {
                // Append log to nodeLogs
                const entry: LogEntry = {
                    id: `${Date.now()}-${Math.random()}`,
                    sequence: Date.now(),
                    log_level: data.level,
                    message: data.message,
                    created_at: new Date().toISOString(),
                    details: data.details,
                };

                setNodeLogs((prev) => ({
                    ...prev,
                    [data.node_id]: [...(prev[data.node_id] || []), entry]
                }));
            },
            onNodeComplete: (data) => {
                updateNodeStatus(data.node_id, data.status, undefined, data.message);

                // Update node state in selectedNodeData if detailed view is open
                if (selectedNodeData?.id === data.node_id) {
                    setSelectedNodeData((prev: any) => ({
                        ...prev,
                        status: data.status,
                        state: {
                            ...prev?.state,
                            status: data.status,
                            description: data.message,
                            input: data.input,
                            output: data.output,
                        }
                    }));
                }
            },
            onFlowComplete: (data) => {
                setInstanceStatus(data.success ? 'completed' : 'failed');
                if (data.success) {
                    message.success(data.message || '流程执行完成');
                } else {
                    message.error(data.message || '流程执行失败');
                }
                refresh(); // One final refresh to ensure consistency
            },
            onError: (err) => {
                console.error('SSE Error:', err);
                // Optionally stop retrying or show a warning
            }
        });

        return () => {
            eventSource.close();
        };
    }, [id, instanceStatus, selectedNodeData]); // Re-subscribe if ID changes, but status check logic handles unwanted reconnections

    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        // Handle virtual rule node click
        if (node.id === 'virtual-rule-trigger') {
            setRuleDrawerVisible(true);
            return;
        }

        // Hydrate logs if any exist in the local state
        const currentLogs = nodeLogs[node.id] || [];

        setSelectedNodeData({
            id: node.id,
            name: node.data.label,
            type: node.data.type,
            status: node.data.status,
            config: node.data, // Original config
            state: node.data._nodeState, // Execution state
            logs: currentLogs,
        });
        setNodeDetailVisible(true);
    };

    const handleCancel = async () => {
        if (!id) return;
        try {
            await cancelHealingInstance(id);
            message.success('已发送取消请求');
            refresh();
        } catch (error) {
            message.error('取消失败');
        }
    };

    const handleRetry = async () => {
        if (!id) return;
        try {
            await retryHealingInstance(id);
            message.success('已开始重试');
            refresh();
        } catch (error) {
            message.error('重试失败');
        }
    };

    return (
        <div style={{ padding: 0, minHeight: 'calc(100vh - 120px)', background: '#f5f5f5' }}>
            {/* ==================== SubPageHeader（跟添加代码仓库页面对齐）==================== */}
            <SubPageHeader
                title={instance?.flow_name || '自愈实例详情'}
                titleExtra={
                    <>
                        <Tag color={
                            instanceStatus === 'completed' ? 'success' :
                                instanceStatus === 'failed' ? 'error' :
                                    instanceStatus === 'running' ? 'processing' :
                                        instanceStatus === 'waiting_approval' ? 'warning' : 'default'
                        }>
                            {STATUS_LABELS[instanceStatus] || instanceStatus}
                        </Tag>
                        {instanceStatus === 'completed' && instance?.node_states && (() => {
                            const hasFailed = Object.values(instance.node_states).some((state: any) => {
                                const ns = normalizeNodeState(state);
                                return ns?.status === 'failed' || ns?.status === 'error';
                            });
                            return hasFailed ? <Tag color="warning" icon={<WarningOutlined />}>执行异常</Tag> : null;
                        })()}
                        <Typography.Text type="secondary" copyable style={{ fontFamily: 'monospace', fontSize: 11 }}>#{id?.substring(0, 8)}</Typography.Text>
                        {instance?.created_at && <span style={{ fontSize: 12, color: '#8c8c8c' }}><ClockCircleOutlined style={{ marginRight: 4 }} />{new Date(instance.created_at).toLocaleString('zh-CN')}</span>}
                        {instance?.incident && (
                            <a onClick={() => setIncidentDrawerVisible(true)} style={{ color: '#1890ff', fontSize: 12 }}>
                                <WarningOutlined style={{ marginRight: 4 }} />{instance.incident.title}
                            </a>
                        )}
                        {instance?.rule && (
                            <a onClick={() => setRuleDrawerVisible(true)} style={{ color: '#722ed1', fontSize: 12 }}>
                                <ThunderboltOutlined style={{ marginRight: 4 }} />{instance.rule.name}
                            </a>
                        )}
                    </>
                }
                onBack={() => history.push('/healing/instances')}
                actions={
                    <Space>
                        <Button icon={<EyeOutlined />} onClick={() => setContextDrawerVisible(true)}>执行概况</Button>
                        {(instanceStatus === 'running' || instanceStatus === 'waiting_approval' || instanceStatus === 'pending') && (
                            <Button danger onClick={handleCancel}>取消执行</Button>
                        )}
                        {instanceStatus === 'failed' && (
                            <Button type="primary" onClick={handleRetry}>重试</Button>
                        )}
                    </Space>
                }
            />

            {/* ========== 醒目错误横幅：一进来就能看到失败原因 ========== */}
            {instanceStatus === 'failed' && (
                <div style={{ margin: '0 24px' }}>
                    <Alert
                        type="error"
                        showIcon
                        message={<span style={{ fontSize: 15, fontWeight: 600 }}>流程执行失败</span>}
                        description={
                            <div style={{ marginTop: 4 }}>
                                {instance?.error_message && (
                                    <div style={{ fontSize: 14, color: '#434343', marginBottom: 8 }}>{instance.error_message}</div>
                                )}
                                {instance?.node_states && (() => {
                                    const failedEntries = Object.entries(instance.node_states)
                                        .filter(([, state]: [string, any]) => {
                                            const ns = normalizeNodeState(state);
                                            return ns?.status === 'failed' || ns?.status === 'error' || ns?.status === 'rejected';
                                        });
                                    if (failedEntries.length > 0) {
                                        return failedEntries.map(([nodeId, state]: [string, any]) => {
                                            const ns = normalizeNodeState(state);
                                            const nodeName = instance.flow_nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
                                            const errMsg = ns?.message || ns?.error_message || ns?.error || '执行失败';
                                            return (
                                                <div key={nodeId} style={{ fontSize: 13, color: '#595959', padding: '2px 0' }}>
                                                    <span style={{ color: '#ff4d4f', marginRight: 6 }}>●</span>
                                                    <strong>{nodeName}</strong>：{errMsg}
                                                </div>
                                            );
                                        });
                                    }
                                    return null;
                                })()}
                            </div>
                        }
                        style={{ borderRadius: 0, borderLeft: '4px solid #ff4d4f' }}
                    />
                </div>
            )}
            {instanceStatus === 'completed' && instance?.node_states && (() => {
                const failedEntries = Object.entries(instance.node_states)
                    .filter(([, state]: [string, any]) => {
                        const ns = normalizeNodeState(state);
                        return ns?.status === 'failed' || ns?.status === 'error';
                    });
                if (failedEntries.length > 0) {
                    return (
                        <div style={{ margin: '0 24px' }}>
                            <Alert
                                type="warning"
                                showIcon
                                message={<span>流程已完成，但有 <strong>{failedEntries.length}</strong> 个节点执行异常</span>}
                                description={failedEntries.map(([nodeId, state]: [string, any]) => {
                                    const ns = normalizeNodeState(state);
                                    const nodeName = instance.flow_nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
                                    return (
                                        <div key={nodeId} style={{ fontSize: 12, color: '#8c8c8c', padding: '1px 0' }}>
                                            • {nodeName}: {ns?.message || ns?.error_message || '执行失败'}
                                        </div>
                                    );
                                })}
                                style={{ borderRadius: 0, borderLeft: '4px solid #faad14' }}
                                closable
                            />
                        </div>
                    );
                }
                return null;
            })()}

            {/* ==================== 流程画布卡（对齐 git-form-card）==================== */}
            <div style={{ background: '#fff', margin: '16px 24px 24px', border: '1px solid #f0f0f0', height: 'calc(100vh - 200px)' }}>
                {loading && !instance ? (
                    <div style={{ padding: 50, textAlign: 'center' }}><Spin /></div>
                ) : instance ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        proOptions={proOptions}
                        fitView
                        fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
                        attributionPosition="bottom-right"
                        onNodeClick={handleNodeClick}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#bfbfbf" />
                        <Controls />
                        <AutoLayoutButton onAutoLayout={handleAutoLayout} />
                    </ReactFlow>
                ) : (
                    <Empty description="未找到实例数据" />
                )}
            </div>

            <Drawer
                title={null}
                placement="right"
                width={600}
                onClose={() => setContextDrawerVisible(false)}
                open={contextDrawerVisible}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                {/* 动态颜色头部 - 若隐若现渐变 */}
                {(() => {
                    const statusColor = instanceStatus === 'failed' ? '#ff4d4f'
                        : instanceStatus === 'completed' ? '#52c41a'
                            : instanceStatus === 'running' ? '#1890ff'
                                : '#faad14';
                    return (
                        <div style={{
                            background: `linear-gradient(135deg, ${statusColor}12 0%, #ffffff 100%)`,
                            padding: '24px 24px 20px',
                            color: '#262626',
                            borderBottom: `2px solid ${statusColor}30`,
                        }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: `${statusColor}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: statusColor,
                                }}>
                                    <DashboardOutlined />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{instance?.flow_name || '未知流程'}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                        {instance?.created_at ? new Date(instance.created_at).toLocaleString('zh-CN') : ''}
                                        {instance?.completed_at ? ` → ${new Date(instance.completed_at).toLocaleString('zh-CN')}` : ''}
                                    </div>
                                </div>
                                <Tag color={
                                    instanceStatus === 'completed' ? 'success' :
                                        instanceStatus === 'failed' ? 'error' :
                                            instanceStatus === 'running' ? 'processing' : 'warning'
                                } style={{ borderRadius: 12, fontSize: 12 }}>
                                    {STATUS_LABELS[instanceStatus] || instanceStatus}
                                </Tag>
                            </div>
                        </div>
                    );
                })()}
                <Tabs
                    defaultActiveKey="result"
                    tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
                    items={[
                        {
                            key: 'result',
                            label: <span><FileTextOutlined /> 执行结果</span>,
                            children: (() => {
                                const execResult = contextData?.execution_result;
                                const isFailed = execResult?.status === 'failed' || instanceStatus === 'failed';
                                const isSuccess = instanceStatus === 'completed' && !isFailed;
                                return (
                                    <div style={{ padding: 24 }}>
                                        {isFailed && execResult?.message && (
                                            <Alert
                                                type="error"
                                                showIcon
                                                icon={<BugOutlined />}
                                                message="执行失败"
                                                description={execResult.message}
                                                style={{ marginBottom: 20 }}
                                            />
                                        )}
                                        {isSuccess && (
                                            <Alert
                                                type="success"
                                                showIcon
                                                message="执行成功"
                                                description={execResult?.message || '流程已成功完成'}
                                                style={{ marginBottom: 20 }}
                                            />
                                        )}
                                        <Descriptions column={2} bordered size="small">
                                            <Descriptions.Item label="实例状态">
                                                <Tag color={
                                                    instanceStatus === 'completed' ? 'success' :
                                                        instanceStatus === 'failed' ? 'error' :
                                                            instanceStatus === 'running' ? 'processing' : 'default'
                                                }>{instanceStatus}</Tag>
                                            </Descriptions.Item>
                                            {execResult?.status && (
                                                <Descriptions.Item label="执行结果状态">
                                                    <Tag color={execResult.status === 'failed' ? 'error' : 'success'}>{execResult.status}</Tag>
                                                </Descriptions.Item>
                                            )}
                                            {instance?.created_at && (
                                                <Descriptions.Item label="触发时间">{instance.created_at}</Descriptions.Item>
                                            )}
                                            {instance?.completed_at && (
                                                <Descriptions.Item label="完成时间">{instance.completed_at}</Descriptions.Item>
                                            )}
                                            {execResult?.started_at && (
                                                <Descriptions.Item label="执行开始">{execResult.started_at}</Descriptions.Item>
                                            )}
                                            {execResult?.finished_at && (
                                                <Descriptions.Item label="执行结束">{execResult.finished_at}</Descriptions.Item>
                                            )}
                                            {execResult?.duration_ms != null && (
                                                <Descriptions.Item label="执行耗时">
                                                    {execResult.duration_ms >= 1000 ? `${(execResult.duration_ms / 1000).toFixed(1)}s` : `${execResult.duration_ms}ms`}
                                                </Descriptions.Item>
                                            )}
                                            {execResult?.task_id && (
                                                <Descriptions.Item label="关联任务 ID">
                                                    <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{execResult.task_id}</Typography.Text>
                                                </Descriptions.Item>
                                            )}
                                            {execResult?.target_hosts && (
                                                <Descriptions.Item label="目标主机" span={2}>{execResult.target_hosts || '-'}</Descriptions.Item>
                                            )}
                                        </Descriptions>
                                        {/* Node execution timeline */}
                                        {instance?.node_states && Object.keys(instance.node_states).length > 0 && (
                                            <div style={{ marginTop: 24 }}>
                                                <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>节点执行记录</Typography.Text>
                                                <Timeline items={Object.entries(instance.node_states).map(([nodeId, rawState]) => {
                                                    const ns = normalizeNodeState(rawState);
                                                    const nodeName = instance.flow_nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
                                                    const isFail = ns?.status === 'failed' || ns?.status === 'error';
                                                    return {
                                                        color: isFail ? 'red' : ns?.status === 'success' ? 'green' : 'blue',
                                                        dot: isFail ? <CloseCircleOutlined /> : ns?.status === 'success' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                                                        children: (
                                                            <div>
                                                                <Typography.Text strong>{nodeName}</Typography.Text>
                                                                <Tag style={{ marginLeft: 8 }} color={isFail ? 'error' : 'success'}>{ns?.status}</Tag>
                                                                {ns?.error_message && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{ns.error_message}</div>}
                                                                {ns?.message && !ns?.error_message && <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>{ns.message}</div>}
                                                            </div>
                                                        ),
                                                    };
                                                })} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })(),
                        },
                        ...(contextData?.incident ? [{
                            key: 'incident',
                            label: <span><BugOutlined /> 关联告警</span>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Descriptions column={2} bordered size="small">
                                        <Descriptions.Item label="告警标题" span={2}>
                                            <Typography.Text strong>{contextData.incident.title}</Typography.Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="严重等级">
                                            <Tag color={contextData.incident.severity === 'critical' ? 'red' : contextData.incident.severity === 'high' ? 'orange' : 'blue'}>
                                                {contextData.incident.severity}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="状态">{contextData.incident.status}</Descriptions.Item>
                                        <Descriptions.Item label="影响 CI">{contextData.incident.affected_ci || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="影响服务">{contextData.incident.affected_service || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="分类">{contextData.incident.category || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="优先级">{contextData.incident.priority || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="报告人">{contextData.incident.reporter || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="处理人">{contextData.incident.assignee || '-'}</Descriptions.Item>
                                        {contextData.incident.description && (
                                            <Descriptions.Item label="描述" span={2}>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{contextData.incident.description}</div>
                                            </Descriptions.Item>
                                        )}
                                        {contextData.incident.raw_data && (
                                            <Descriptions.Item label="原始数据" span={2}>
                                                <pre style={{ background: '#fafafa', padding: 12, borderRadius: 6, fontSize: 12, margin: 0, fontFamily: 'Menlo, Monaco, Consolas, monospace' }}>
                                                    {JSON.stringify(contextData.incident.raw_data, null, 2)}
                                                </pre>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            ),
                        }] : []),
                        {
                            key: 'context',
                            label: <span><InfoCircleOutlined /> 全局上下文</span>,
                            children: (
                                <div style={{ padding: 24, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                    {Object.keys(contextData || {}).length > 0 ? (
                                        <JsonPrettyView data={contextData} />
                                    ) : (
                                        <Empty description="暂无上下文数据" style={{ marginTop: 80 }} />
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />
            </Drawer>

            <Drawer
                title={null}
                placement="right"
                width={600}
                onClose={() => setIncidentDrawerVisible(false)}
                open={incidentDrawerVisible}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                {instance?.incident ? (
                    <div>
                        {/* 若隐若现工单头部 */}
                        {(() => {
                            const sColor = instance.incident.severity === 'critical' ? '#ff4d4f'
                                : instance.incident.severity === 'high' ? '#ff7a45' : '#faad14';
                            return (
                                <div style={{
                                    background: `linear-gradient(135deg, ${sColor}12 0%, #ffffff 100%)`,
                                    padding: '24px 24px 20px',
                                    color: '#262626',
                                    borderBottom: `2px solid ${sColor}30`,
                                }}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: `${sColor}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 20, color: sColor,
                                        }}>
                                            <AlertOutlined />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{instance.incident.title}</div>
                                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{instance.incident.id || '无 ID'}</div>
                                        </div>
                                        <Tag color={
                                            instance.incident.severity === 'critical' ? 'red'
                                                : instance.incident.severity === 'high' ? 'orange' : 'gold'
                                        } style={{ borderRadius: 12, fontSize: 12 }}>
                                            {instance.incident.severity || 'Unknown'}
                                        </Tag>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 工单信息卡片 */}
                        <div style={{ padding: '16px 24px' }}>
                            <Descriptions
                                column={2}
                                size="small"
                                bordered
                                labelStyle={{ background: '#fafafa', fontWeight: 500, width: 100 }}
                            >
                                <Descriptions.Item label="工单 ID" span={2}>
                                    <Typography.Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {instance.incident.id}
                                    </Typography.Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="严重等级">
                                    <Tag color={
                                        instance.incident.severity === 'critical' ? 'red'
                                            : instance.incident.severity === 'high' ? 'orange'
                                                : instance.incident.severity === 'medium' ? 'gold' : 'blue'
                                    }>
                                        {instance.incident.severity || '-'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="状态">
                                    <Tag color={instance.incident.status === 'Active' ? 'processing' : 'default'}>
                                        {instance.incident.status || '-'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="创建时间">
                                    {instance.incident.created_at ? new Date(instance.incident.created_at).toLocaleString('zh-CN') : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="分类">
                                    {instance.incident.category || '-'}
                                </Descriptions.Item>
                                {instance.incident.affected_ci && (
                                    <Descriptions.Item label="影响 CI">
                                        {instance.incident.affected_ci}
                                    </Descriptions.Item>
                                )}
                                {instance.incident.assignee && (
                                    <Descriptions.Item label="处理人">
                                        {instance.incident.assignee}
                                    </Descriptions.Item>
                                )}
                                {instance.incident.description && (
                                    <Descriptions.Item label="描述" span={2}>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: '#595959' }}>
                                            {instance.incident.description}
                                        </div>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>
                    </div>
                ) : <Empty description="无工单信息" />}
            </Drawer>

            <Drawer
                title={null}
                placement="right"
                width={600}
                onClose={() => setRuleDrawerVisible(false)}
                open={ruleDrawerVisible}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                {instance?.rule ? (
                    <div>
                        {/* 若隐若现规则头部 */}
                        <div style={{
                            background: 'linear-gradient(135deg, #722ed112 0%, #ffffff 100%)',
                            padding: '24px 24px 20px',
                            color: '#262626',
                            borderBottom: '2px solid #722ed130',
                        }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: '#722ed115',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: '#722ed1',
                                }}>
                                    <ThunderboltOutlined />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{instance.rule.name}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{instance.rule.description || '暂无描述'}</div>
                                </div>
                                <Tag color={instance.rule.is_active !== false ? 'success' : 'default'}
                                    style={{ borderRadius: 12, fontSize: 12 }}>
                                    {instance.rule.is_active !== false ? '已启用' : '已禁用'}
                                </Tag>
                            </div>
                        </div>

                        {/* 规则信息卡片 */}
                        <div style={{ padding: '16px 24px' }}>
                            <Descriptions
                                column={2}
                                size="small"
                                bordered
                                labelStyle={{ background: '#fafafa', fontWeight: 500, width: 100 }}
                            >
                                <Descriptions.Item label="规则 ID" span={2}>
                                    <Typography.Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {instance.rule.id}
                                    </Typography.Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="优先级">
                                    <Tag color={instance.rule.priority <= 10 ? 'red' : instance.rule.priority <= 20 ? 'orange' : 'blue'}>
                                        {instance.rule.priority}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="触发模式">
                                    <Tag color={instance.rule.trigger_mode === 'auto' ? 'green' : 'purple'}
                                        icon={instance.rule.trigger_mode === 'auto' ? <CheckCircleOutlined /> : <EyeOutlined />}>
                                        {instance.rule.trigger_mode === 'auto' ? '自动触发' : '手动确认'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="匹配模式">
                                    {instance.rule.match_mode === 'all' ? '满足所有条件 (AND)' : '满足任一条件 (OR)'}
                                </Descriptions.Item>
                                <Descriptions.Item label="创建时间">
                                    {instance.rule.created_at ? new Date(instance.rule.created_at).toLocaleString('zh-CN') : '-'}
                                </Descriptions.Item>
                            </Descriptions>

                            {/* 触发条件可视化 */}
                            <div style={{ marginTop: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
                                    <AimOutlined style={{ color: '#722ed1' }} />
                                    触发条件
                                    <Tag style={{ fontSize: 11, borderRadius: 8 }}>
                                        {instance.rule.match_mode === 'all' ? 'AND' : 'OR'}
                                    </Tag>
                                </div>
                                {(() => {
                                    const renderConditionNode = (item: any, depth: number = 0): React.ReactNode => {
                                        if (item.type === 'group') {
                                            return (
                                                <div key={Math.random()} style={{
                                                    marginLeft: depth * 16,
                                                    padding: '8px 12px',
                                                    background: depth === 0 ? '#fafafa' : '#fff',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: 6,
                                                    marginBottom: 8,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                        <AppstoreOutlined style={{ fontSize: 12, color: '#722ed1' }} />
                                                        <Tag color="purple" style={{ fontSize: 11, borderRadius: 8, margin: 0 }}>
                                                            {item.logic || 'AND'}
                                                        </Tag>
                                                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                                            {item.conditions?.length || 0} 个条件
                                                        </Typography.Text>
                                                    </div>
                                                    {item.conditions?.map((sub: any, i: number) => (
                                                        <React.Fragment key={i}>
                                                            {renderConditionNode(sub, depth + 1)}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        // 单条件
                                        return (
                                            <div key={Math.random()} style={{
                                                marginLeft: depth * 16,
                                                padding: '6px 10px',
                                                background: '#fff',
                                                border: '1px dashed #d9d9d9',
                                                borderRadius: 4,
                                                marginBottom: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: 12,
                                            }}>
                                                <TagOutlined style={{ color: '#1890ff', fontSize: 11 }} />
                                                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{item.field}</Tag>
                                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.operator}</Typography.Text>
                                                <Tag style={{ margin: 0, fontSize: 11, background: '#f6ffed', borderColor: '#b7eb8f' }}>{item.value}</Tag>
                                            </div>
                                        );
                                    };
                                    const conditions = instance.rule.conditions;
                                    if (!conditions || conditions.length === 0) {
                                        return <Empty description="暂无触发条件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                                    }
                                    return conditions.map((c: any, i: number) => (
                                        <React.Fragment key={i}>
                                            {renderConditionNode(c, 0)}
                                            {i < conditions.length - 1 && (
                                                <div style={{ textAlign: 'center', margin: '4px 0' }}>
                                                    <Tag color="orange" style={{ fontSize: 10, borderRadius: 8 }}>
                                                        {instance.rule.match_mode === 'all' ? 'AND' : 'OR'}
                                                    </Tag>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                ) : <Empty description="无规则信息" />}
            </Drawer>

            <Drawer // Professional Node Detail Drawer
                title={null}
                placement="right"
                width={600}
                onClose={() => setNodeDetailVisible(false)}
                open={nodeDetailVisible}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                {/* 若隐若现节点头部 */}
                {(() => {
                    const s = selectedNodeData?.state?.status || selectedNodeData?.status;
                    const nodeType = selectedNodeData?.type;
                    const statusColor = s === 'success' || s === 'completed' || s === 'approved'
                        ? '#52c41a'
                        : s === 'failed' || s === 'error' || s === 'rejected'
                            ? '#ff4d4f'
                            : s === 'running'
                                ? '#1890ff'
                                : s === 'waiting_approval'
                                    ? '#faad14'
                                    : s === 'skipped'
                                        ? '#8c8c8c'
                                        : s === 'triggered'
                                            ? '#722ed1'
                                            : '#faad14';
                    const nodeIcon = nodeType === 'execution' ? <PlayCircleOutlined />
                        : nodeType === 'approval' ? <EyeOutlined />
                            : nodeType === 'condition' ? <NodeIndexOutlined />
                                : nodeType === 'trigger' ? <ThunderboltOutlined />
                                    : <InfoCircleOutlined />;
                    return (
                        <div style={{
                            background: `linear-gradient(135deg, ${statusColor}12 0%, #ffffff 100%)`,
                            padding: '20px 24px',
                            borderBottom: `2px solid ${statusColor}30`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: `${statusColor}12`,
                                    border: `1px solid ${statusColor}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18, color: statusColor,
                                }}>
                                    {nodeIcon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>{selectedNodeData?.name || selectedNodeData?.id || '-'}</span>
                                        {s && (
                                            <Tag color={
                                                s === 'success' || s === 'completed' || s === 'approved' ? 'success'
                                                    : s === 'failed' || s === 'error' || s === 'rejected' ? 'error'
                                                        : s === 'running' ? 'processing'
                                                            : s === 'waiting_approval' ? 'warning' : 'default'
                                            } style={{ borderRadius: 4, fontSize: 12 }}>
                                                {STATUS_LABELS[s] || s}
                                            </Tag>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                        {NODE_TYPE_LABELS[nodeType] || nodeType || '未知'} · {selectedNodeData?.id || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                {selectedNodeData && (() => {
                    const ns = selectedNodeData.state;
                    const effectiveStatus = ns?.status || selectedNodeData.status;
                    const nodeType = selectedNodeData.type;
                    const isExecution = nodeType === 'execution';
                    const isApproval = nodeType === 'approval';
                    const runId = ns?.run?.run_id;

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

                    // 用于「配置参数」Tab 的过滤和格式化
                    const configData = selectedNodeData.config || {};
                    const filteredConfig = Object.fromEntries(
                        Object.entries(configData).filter(([k]) => !['nodeState', 'dryRunMessage', '_nodeState', 'isCurrent', 'status'].includes(k))
                    );
                    const configEntries = Object.entries(filteredConfig);

                    // 用于「节点上下文」Tab 的数据（从运行时状态中提取，排除大段文本）
                    const contextEntries = ns
                        ? Object.entries(ns).filter(([k]) => !['stdout', 'stderr', 'status', 'error_message', 'message'].includes(k))
                        : [];

                    // Descriptions 统一样式
                    const descLabelStyle = { background: '#fafafa', fontWeight: 500, fontSize: 12, width: 80 };
                    const descContentStyle = { fontSize: 12 };

                    return (
                        <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: '0 16px' }} items={[
                            {
                                key: 'overview',
                                label: '概览',
                                children: (
                                    <div style={{ padding: '16px 20px' }}>
                                        <Descriptions column={1} size="small" bordered
                                            labelStyle={descLabelStyle}
                                            contentStyle={descContentStyle}
                                        >
                                            <Descriptions.Item label="节点 ID">
                                                <Typography.Text copyable={{ text: selectedNodeData.id }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>{selectedNodeData.id}</span></Typography.Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="类型">
                                                <Tag style={{ margin: 0 }}>{NODE_TYPE_LABELS[nodeType] || nodeType}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="状态">
                                                {effectiveStatus ? (
                                                    <Tag color={
                                                        effectiveStatus === 'completed' || effectiveStatus === 'success' || effectiveStatus === 'approved' ? 'success' :
                                                            effectiveStatus === 'failed' || effectiveStatus === 'error' || effectiveStatus === 'rejected' ? 'error' :
                                                                effectiveStatus === 'running' ? 'processing' :
                                                                    effectiveStatus === 'skipped' ? 'default' : 'warning'
                                                    } style={{ margin: 0 }}>
                                                        {STATUS_LABELS[effectiveStatus] || effectiveStatus}
                                                    </Tag>
                                                ) : <Typography.Text type="secondary">未执行</Typography.Text>}
                                            </Descriptions.Item>
                                            {ns?.started_at && (
                                                <Descriptions.Item label="开始">
                                                    {new Date(ns.started_at).toLocaleString('zh-CN')}
                                                </Descriptions.Item>
                                            )}
                                            {(ns?.finished_at || ns?.updated_at) && (
                                                <Descriptions.Item label="结束">
                                                    {new Date(ns.finished_at || ns.updated_at).toLocaleString('zh-CN')}
                                                </Descriptions.Item>
                                            )}
                                            {ns?.duration_ms != null && (
                                                <Descriptions.Item label="耗时">
                                                    <span style={{ fontWeight: 600, color: '#595959' }}>
                                                        {ns.duration_ms >= 1000 ? `${(ns.duration_ms / 1000).toFixed(1)}s` : `${ns.duration_ms}ms`}
                                                    </span>
                                                </Descriptions.Item>
                                            )}
                                        </Descriptions>

                                        {/* 执行关键信息 - run_id / exit_code / task_id */}
                                        {isExecution && runId && (
                                            <div style={{ marginTop: 12 }}>
                                                <Typography.Text strong style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 8 }}>执行信息</Typography.Text>
                                                <Descriptions column={1} size="small" bordered
                                                    labelStyle={descLabelStyle}
                                                    contentStyle={descContentStyle}
                                                >
                                                    <Descriptions.Item label="Run ID">
                                                        <Typography.Text copyable={{ text: runId }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>{runId}</span></Typography.Text>
                                                    </Descriptions.Item>
                                                    {ns?.run?.exit_code != null && (
                                                        <Descriptions.Item label="退出码">
                                                            <Tag color={ns.run.exit_code === 0 ? 'success' : 'error'} style={{ margin: 0 }}>{ns.run.exit_code}</Tag>
                                                        </Descriptions.Item>
                                                    )}
                                                    {ns?.task_id && (
                                                        <Descriptions.Item label="任务 ID">
                                                            <Typography.Text copyable={{ text: ns.task_id }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>{ns.task_id}</span></Typography.Text>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                            </div>
                                        )}

                                        {/* 错误/消息 */}
                                        {(ns?.error_message || ns?.message) && (
                                            <div style={{
                                                marginTop: 12, padding: '8px 12px', borderRadius: 4,
                                                background: ns?.status === 'failed' || ns?.status === 'rejected' ? '#fff2f0' : '#f6ffed',
                                                border: `1px solid ${ns?.status === 'failed' || ns?.status === 'rejected' ? '#ffccc7' : '#b7eb8f'}`,
                                                fontSize: 12,
                                            }}>
                                                <Typography.Text type={ns?.status === 'failed' || ns?.status === 'rejected' ? 'danger' : undefined} style={{ fontSize: 12 }}>
                                                    {ns.error_message || ns.message}
                                                </Typography.Text>
                                            </div>
                                        )}

                                        {/* 审批通过/拒绝提示 */}
                                        {isApproval && effectiveStatus === 'rejected' && (
                                            <Alert type="error" showIcon message="审批被拒绝" description={ns?.error_message} style={{ marginTop: 12 }} />
                                        )}
                                        {isApproval && effectiveStatus === 'approved' && (
                                            <Alert type="success" showIcon message="审批已通过" style={{ marginTop: 12 }} />
                                        )}

                                        {/* 执行统计 - 指标卡片网格 */}
                                        {isExecution && (ns?.run?.stats || ns?.stats) && (() => {
                                            const stats = ns.run?.stats || ns.stats;
                                            const total = (stats.ok || 0) + (stats.changed || 0) + (stats.unreachable || 0) + (stats.failed || 0) + (stats.skipped || 0);
                                            const statItems = [
                                                { key: 'ok', label: '成功', value: stats.ok || 0, color: '#52c41a' },
                                                { key: 'changed', label: '已变更', value: stats.changed || 0, color: '#faad14' },
                                                { key: 'unreachable', label: '不可达', value: stats.unreachable || 0, color: '#ff4d4f' },
                                                { key: 'failed', label: '失败', value: stats.failed || 0, color: '#cf1322' },
                                                { key: 'skipped', label: '跳过', value: stats.skipped || 0, color: '#8c8c8c' },
                                            ];
                                            const okRate = total > 0 ? Math.round(((stats.ok || 0) / total) * 100) : 0;
                                            return (
                                                <div style={{ marginTop: 12 }}>
                                                    <Typography.Text strong style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 8 }}>执行统计</Typography.Text>
                                                    {/* 汇总条 */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        padding: '6px 10px', background: '#fafafa', border: '1px solid #f0f0f0', marginBottom: 8,
                                                    }}>
                                                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>共 <b style={{ color: '#262626' }}>{total}</b> 台</span>
                                                        <div style={{ flex: 1, height: 4, background: '#f0f0f0', overflow: 'hidden' }}>
                                                            <div style={{ width: `${okRate}%`, height: '100%', background: '#52c41a', transition: 'width 0.3s' }} />
                                                        </div>
                                                        <span style={{ fontSize: 11, color: okRate === 100 ? '#52c41a' : '#8c8c8c', fontWeight: 500 }}>{okRate}%</span>
                                                    </div>
                                                    {/* 指标卡片网格 */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                                        {statItems.map(item => (
                                                            <Card key={item.key} size="small" style={{
                                                                borderLeft: `3px solid ${item.value > 0 ? item.color : '#e8e8e8'}`,
                                                                background: item.value > 0 ? `${item.color}08` : undefined,
                                                            }} styles={{ body: { padding: '6px 8px' } }}>
                                                                <div style={{
                                                                    fontSize: 18, fontWeight: 600, lineHeight: 1.2,
                                                                    color: item.value > 0 ? item.color : '#bfbfbf',
                                                                }}>{item.value}</div>
                                                                <div style={{
                                                                    fontSize: 10, color: '#8c8c8c', marginTop: 2,
                                                                }}>{item.label}</div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 目标主机 */}
                                        {isExecution && (ns?.target_hosts || ns?.hosts) && (() => {
                                            const hostsStr = ns.target_hosts || '';
                                            const hostsArr = ns.hosts || (hostsStr ? hostsStr.split(',').map((h: string) => h.trim()).filter(Boolean) : []);
                                            return hostsArr.length > 0 ? (
                                                <div style={{ marginTop: 12 }}>
                                                    <Typography.Text strong style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 8 }}>目标主机</Typography.Text>
                                                    <Space size={4} wrap>{hostsArr.map((h: string) => <Tag key={h} style={{ margin: 0 }}>{h}</Tag>)}</Space>
                                                </div>
                                            ) : null;
                                        })()}

                                        {/* 审批信息 */}
                                        {isApproval && ns && (
                                            <div style={{ marginTop: 12 }}>
                                                <Typography.Text strong style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 8 }}>审批信息</Typography.Text>
                                                <Descriptions column={1} size="small" bordered
                                                    labelStyle={descLabelStyle}
                                                    contentStyle={descContentStyle}
                                                >
                                                    {ns.title && <Descriptions.Item label="标题">{ns.title}</Descriptions.Item>}
                                                    {ns.description && <Descriptions.Item label="说明">{ns.description}</Descriptions.Item>}
                                                    {ns.timeout_at && <Descriptions.Item label="超时">{new Date(ns.timeout_at).toLocaleString('zh-CN')}</Descriptions.Item>}
                                                    {ns.task_id && (
                                                        <Descriptions.Item label="任务 ID">
                                                            <Typography.Text copyable={{ text: ns.task_id }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#595959' }}>{ns.task_id}</span></Typography.Text>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            // 执行日志 tab - 优先用 API 日志，否则用 stdout
                            ...(isExecution && (runId || stdoutLogs.length > 0) ? [{
                                key: 'execution_log',
                                label: '执行日志',
                                children: (
                                    <ExecutionLogTab runId={runId} fallbackLogs={stdoutLogs} />
                                )
                            }] : []),
                            // 实时日志 tab
                            ...(selectedNodeData.logs && selectedNodeData.logs.length > 0 ? [{
                                key: 'live_logs',
                                label: '实时日志',
                                children: (
                                    <LogConsole
                                        logs={nodeLogs[selectedNodeData.id] || selectedNodeData.logs || []}
                                        height="calc(100vh - 160px)"
                                        streaming={selectedNodeData.status === 'running'}
                                    />
                                )
                            }] : []),
                            // 节点上下文 tab（仅显示当前节点的运行时数据）
                            ...(contextEntries.length > 0 ? [{
                                key: 'context',
                                label: '节点上下文',
                                children: (
                                    <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        <Descriptions column={1} size="small" bordered
                                            labelStyle={{ ...descLabelStyle, width: 130 }}
                                            contentStyle={descContentStyle}
                                        >
                                            {contextEntries.map(([key, value]) => (
                                                <Descriptions.Item key={key} label={key}>
                                                    {typeof value === 'object' && value !== null ? (
                                                        <pre style={{ background: '#f6f8fa', padding: 8, borderRadius: 4, fontSize: 11, fontFamily: 'Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                                                            {JSON.stringify(value, null, 2)}
                                                        </pre>
                                                    ) : typeof value === 'boolean' ? (
                                                        <Tag color={value ? 'success' : 'default'} style={{ margin: 0 }}>{String(value)}</Tag>
                                                    ) : (
                                                        <span>{String(value)}</span>
                                                    )}
                                                </Descriptions.Item>
                                            ))}
                                        </Descriptions>
                                    </div>
                                )
                            }] : []),
                            // 配置参数 tab
                            {
                                key: 'config',
                                label: '配置参数',
                                children: (
                                    <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        {configEntries.length === 0 ? <Empty description="暂无配置参数" style={{ marginTop: 40 }} /> : (
                                            <Descriptions column={1} size="small" bordered
                                                labelStyle={{ ...descLabelStyle, width: 110 }}
                                                contentStyle={descContentStyle}
                                            >
                                                {configEntries.map(([k, v]) => (
                                                    <Descriptions.Item key={k} label={CONFIG_LABELS[k] || k}>
                                                        {typeof v === 'object' && v !== null
                                                            ? <pre style={{ background: '#f6f8fa', padding: 8, borderRadius: 4, fontSize: 11, fontFamily: 'Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, maxHeight: 150, overflow: 'auto' }}>{JSON.stringify(v, null, 2)}</pre>
                                                            : typeof v === 'boolean'
                                                                ? <Tag color={v ? 'success' : 'default'} style={{ margin: 0 }}>{String(v)}</Tag>
                                                                : <span>{String(v)}</span>
                                                        }
                                                    </Descriptions.Item>
                                                ))}
                                            </Descriptions>
                                        )}
                                    </div>
                                )
                            },
                            // 原始状态 tab
                            ...(ns ? [{
                                key: 'state',
                                label: '原始状态',
                                children: (
                                    <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        <JsonPrettyView data={ns} />
                                    </div>
                                )
                            }] : [])
                        ]} />
                    );
                })()}
            </Drawer>
        </div>
    );
};

export default HealingInstanceDetail;
