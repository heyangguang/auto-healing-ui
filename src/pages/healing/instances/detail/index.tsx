import {
    cancelHealingInstance,
    getHealingInstanceDetail,
    retryHealingInstance,
} from '@/services/auto-healing/instances';
import { createInstanceEventStream, NodeStatus } from '@/services/auto-healing/sse';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useParams, useRequest } from '@umijs/max';
import { Button, Card, Col, Drawer, Empty, Row, Space, Spin, Steps, Tabs, Tag, Typography, message, Descriptions, Statistic, Result, Timeline, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, EyeOutlined, ClockCircleOutlined, BugOutlined, FileTextOutlined, WarningOutlined, ThunderboltOutlined, AimOutlined, AppstoreOutlined, TagOutlined, DashboardOutlined, AlertOutlined, NodeIndexOutlined, PlayCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    ProOptions,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';

// Import node types from the editor
import ApprovalNode from '../../flows/editor/ApprovalNode';
import ConditionNode from '../../flows/editor/ConditionNode';
import CustomNode from '../../flows/editor/CustomNode';
import EndNode from '../../flows/editor/EndNode';
import ExecutionNode from '../../flows/editor/ExecutionNode';
import StartNode from '../../flows/editor/StartNode';
import JsonPrettyView from '../components/JsonPrettyView';

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
    success: '#52c41a', completed: '#52c41a',
    failed: '#ff4d4f', partial: '#faad14',
    running: '#1890ff', waiting_approval: '#fa8c16',
};

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

    // Auto layout using dagre
    const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        const isHorizontal = direction === 'LR';
        dagreGraph.setGraph({ rankdir: direction });

        nodes.forEach((node) => {
            const isRuleNode = node.data?.type === 'trigger';
            dagreGraph.setNode(node.id, { width: isRuleNode ? 240 : 180, height: 60 });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);

            // Only apply auto-layout if position is missing (0,0) or invalid
            const isMissingPosition = !node.position || (node.position.x === 0 && node.position.y === 0);

            if (isMissingPosition) {
                node.position = {
                    x: nodeWithPosition.x - 90, // center anchor
                    y: nodeWithPosition.y - 30,
                };
            }

            return node;
        });

        return { nodes: layoutedNodes, edges };
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
                if (data && data.flow) {
                    setInstanceStatus(data.status);
                    setContextData(data.context || {});

                    // 推算所有已执行节点的状态
                    const executedNodes = inferExecutedNodes(
                        data.flow.nodes, data.flow.edges,
                        data.node_states || {}, data.current_node_id, data.status,
                    );

                    // Transform nodes with status
                    let flowNodes = data.flow.nodes.map((node) => {
                        const nodeState = normalizeNodeState(data.node_states?.[node.id]);
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
                                _nodeState: nodeState, // Full state for detail drawer
                                isCurrent: node.id === data.current_node_id,
                            },
                        } as Node;
                    });

                    // 边着色：已执行路径用状态色
                    let flowEdges = data.flow.edges.map((edge: any) => {
                        const sourceStatus = executedNodes[edge.source];
                        const targetStatus = executedNodes[edge.target];
                        const isExecutedEdge = sourceStatus && targetStatus;
                        const edgeColor = isExecutedEdge
                            ? (STATUS_EDGE_COLOR[targetStatus] || '#52c41a') : '#d9d9d9';
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

                    // Inject Virtual Rule Node if Rule exists
                    if (data.rule) {
                        const ruleNodeId = 'virtual-rule-trigger';
                        const startNode = flowNodes.find(n => n.type === 'start') || flowNodes[0];

                        const ruleNode: Node = {
                            id: ruleNodeId,
                            type: 'custom', // Use CustomNode generic type
                            position: { x: 0, y: 0 }, // Layout will handle this
                            data: {
                                label: `自愈规则: ${data.rule.name}`,
                                type: 'trigger', // Icon selection logic in CustomNode needs to handle this or fallback
                                status: 'triggered', // 外部触发源，使用紫色主题区别于标准流程节点
                                details: data.rule, // Store rule data for click handler
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
        <PageContainer
            header={{
                title: instance?.flow?.name || '自愈实例详情',
                subTitle: <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 12, color: '#8c8c8c' }}>{id}</Typography.Text>,
                breadcrumb: {
                    items: [
                        { title: '自愈引擎' },
                        { title: '流程实例', href: '/healing/instances', onClick: (e) => { e.preventDefault(); history.push('/healing/instances'); } },
                        { title: instance?.flow?.name || '实例详情' },
                    ],
                },
                onBack: () => history.push('/healing/instances'),
                extra: [
                    <Button key="context" icon={<EyeOutlined />} onClick={() => setContextDrawerVisible(true)}>
                        执行概况
                    </Button>,
                    instanceStatus === 'running' || instanceStatus === 'waiting_approval' || instanceStatus === 'pending' ? (
                        <Button key="cancel" danger onClick={handleCancel}>
                            取消执行
                        </Button>
                    ) : null,
                    instanceStatus === 'failed' ? (
                        <Button key="retry" type="primary" onClick={handleRetry}>
                            重试
                        </Button>
                    ) : null,
                ],
                tags: (() => {
                    const tags = [
                        <Tag key="status" color={
                            instanceStatus === 'completed' ? 'success' :
                                instanceStatus === 'failed' ? 'error' :
                                    instanceStatus === 'running' ? 'processing' :
                                        instanceStatus === 'waiting_approval' ? 'warning' : 'default'
                        }>
                            {instanceStatus === 'waiting_approval' ? '待审批' :
                                instanceStatus === 'running' ? '执行中' :
                                    instanceStatus === 'completed' ? '已完成' :
                                        instanceStatus === 'failed' ? '失败' : instanceStatus}
                        </Tag>
                    ];
                    // 检测是否有失败节点（流程完成但执行异常）
                    if (instanceStatus === 'completed' && instance?.node_states) {
                        const failedEntries = Object.entries(instance.node_states)
                            .filter(([, state]: [string, any]) => {
                                const ns = normalizeNodeState(state);
                                return ns?.status === 'failed' || ns?.status === 'error';
                            });
                        if (failedEntries.length > 0) {
                            tags.push(
                                <Tag key="warning" color="warning" icon={<WarningOutlined />}>
                                    执行异常
                                </Tag>
                            );
                        }
                    }
                    return tags;
                })()
            }}
            content={
                instance ? (
                    <div>
                        {/* 异常警告横幅 */}
                        {instanceStatus === 'completed' && instance.node_states && (() => {
                            const failedEntries = Object.entries(instance.node_states)
                                .filter(([, state]: [string, any]) => {
                                    const ns = normalizeNodeState(state);
                                    return ns?.status === 'failed' || ns?.status === 'error';
                                });
                            if (failedEntries.length > 0) {
                                const failedDetails = failedEntries.map(([nodeId, state]: [string, any]) => {
                                    const ns = normalizeNodeState(state);
                                    // 查找节点名称
                                    const nodeName = instance.flow?.nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
                                    return `${nodeName}: ${ns?.message || ns?.error_message || '执行失败'}`;
                                });
                                return (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        icon={<WarningOutlined />}
                                        message={<span>流程已走完，但有 <strong>{failedEntries.length}</strong> 个节点执行异常</span>}
                                        description={failedDetails.map((d, i) => <div key={i} style={{ fontSize: 12, color: '#8c8c8c' }}>• {d}</div>)}
                                        style={{ marginBottom: 12, borderRadius: 6 }}
                                        closable
                                    />
                                );
                            }
                            return null;
                        })()}
                        <ProDescriptions column={3} size="small">
                            <ProDescriptions.Item label="关联工单">
                                {instance.incident ? (
                                    <a onClick={() => setIncidentDrawerVisible(true)} style={{ color: '#1890ff' }}>
                                        {instance.incident.title}
                                    </a>
                                ) : '-'}
                            </ProDescriptions.Item>
                            <ProDescriptions.Item label="匹配规则">
                                {instance.rule ? (
                                    <a onClick={() => setRuleDrawerVisible(true)} style={{ color: '#1890ff' }}>
                                        {instance.rule.name}
                                    </a>
                                ) : '-'}
                            </ProDescriptions.Item>
                            <ProDescriptions.Item label="触发时间">
                                {instance.created_at}
                            </ProDescriptions.Item>
                        </ProDescriptions>
                    </div>
                ) : null
            }
        >
            <Card bordered={false} bodyStyle={{ padding: 0, height: 'calc(100vh - 280px)' }}>
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
                        <Background color="#f5f5f5" gap={20} />
                        <Controls />
                    </ReactFlow>
                ) : (
                    <Empty description="未找到实例数据" />
                )}
            </Card>

            <Drawer
                title={null}
                placement="right"
                width={600}
                onClose={() => setContextDrawerVisible(false)}
                open={contextDrawerVisible}
                headerStyle={{ display: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                {/* 动态颜色头部 */}
                <div style={{
                    background: instanceStatus === 'failed'
                        ? 'linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)'
                        : instanceStatus === 'completed'
                            ? 'linear-gradient(135deg, #389e0d 0%, #52c41a 100%)'
                            : instanceStatus === 'running'
                                ? 'linear-gradient(135deg, #096dd9 0%, #1890ff 100%)'
                                : 'linear-gradient(135deg, #d48806 0%, #faad14 100%)',
                    padding: '24px 24px 20px',
                    color: '#fff',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span onClick={() => setContextDrawerVisible(false)} style={{ cursor: 'pointer', opacity: 0.8, fontSize: 16 }}>✕</span>
                        <span style={{ fontSize: 12, opacity: 0.7, letterSpacing: 1 }}>执行概况</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                        }}>
                            <DashboardOutlined />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{instance?.flow?.name || '未知流程'}</div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                                {instance?.created_at ? new Date(instance.created_at).toLocaleString('zh-CN') : ''}
                                {instance?.completed_at ? ` → ${new Date(instance.completed_at).toLocaleString('zh-CN')}` : ''}
                            </div>
                        </div>
                        <Tag
                            color={instanceStatus === 'completed' ? '#fff' : instanceStatus === 'failed' ? '#fff' : 'rgba(255,255,255,0.3)'}
                            style={{
                                borderRadius: 12, fontSize: 12, border: 'none',
                                color: instanceStatus === 'completed' ? '#389e0d' : instanceStatus === 'failed' ? '#cf1322' : '#fff',
                            }}
                        >
                            {instanceStatus === 'completed' ? '已完成' : instanceStatus === 'failed' ? '失败' : instanceStatus === 'running' ? '执行中' : instanceStatus === 'waiting_approval' ? '待审批' : instanceStatus}
                        </Tag>
                    </div>
                </div>
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
                                                    const nodeName = instance.flow?.nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
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
                        {/* 红/橙色主题头部 */}
                        <div style={{
                            background: instance.incident.severity === 'critical'
                                ? 'linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)'
                                : instance.incident.severity === 'high'
                                    ? 'linear-gradient(135deg, #d4380d 0%, #ff7a45 100%)'
                                    : 'linear-gradient(135deg, #d48806 0%, #ffc53d 100%)',
                            padding: '24px 24px 20px',
                            color: '#fff',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span onClick={() => setIncidentDrawerVisible(false)} style={{ cursor: 'pointer', opacity: 0.8, fontSize: 16 }}>✕</span>
                                <span style={{ fontSize: 12, opacity: 0.7, letterSpacing: 1 }}>关联工单详情</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20,
                                }}>
                                    <AlertOutlined />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{instance.incident.title}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{instance.incident.id || '无 ID'}</div>
                                </div>
                                <Tag color="rgba(255,255,255,0.3)" style={{ borderRadius: 12, fontSize: 12, border: 'none' }}>
                                    {instance.incident.severity || 'Unknown'}
                                </Tag>
                            </div>
                        </div>

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
                        {/* 紫色主题头部 */}
                        <div style={{
                            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                            padding: '24px 24px 20px',
                            color: '#fff',
                            position: 'relative',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span onClick={() => setRuleDrawerVisible(false)} style={{ cursor: 'pointer', opacity: 0.8, fontSize: 16 }}>✕</span>
                                <span style={{ fontSize: 12, opacity: 0.7, letterSpacing: 1 }}>匹配规则详情</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20,
                                }}>
                                    <ThunderboltOutlined />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{instance.rule.name}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{instance.rule.description || '暂无描述'}</div>
                                </div>
                                <Tag color={instance.rule.is_active !== false ? '#52c41a' : '#d9d9d9'}
                                    style={{ borderRadius: 12, fontSize: 12, border: 'none' }}>
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
                {/* 动态颜色节点头部 */}
                {(() => {
                    const s = selectedNodeData?.state?.status || selectedNodeData?.status;
                    const nodeType = selectedNodeData?.type;
                    const bgGradient = s === 'success' || s === 'completed'
                        ? 'linear-gradient(135deg, #389e0d 0%, #52c41a 100%)'
                        : s === 'failed' || s === 'error'
                            ? 'linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)'
                            : s === 'running'
                                ? 'linear-gradient(135deg, #096dd9 0%, #1890ff 100%)'
                                : s === 'skipped'
                                    ? 'linear-gradient(135deg, #595959 0%, #8c8c8c 100%)'
                                    : s === 'triggered'
                                        ? 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)'
                                        : 'linear-gradient(135deg, #d48806 0%, #faad14 100%)';
                    const nodeIcon = nodeType === 'execution' ? <PlayCircleOutlined />
                        : nodeType === 'approval' ? <EyeOutlined />
                            : nodeType === 'condition' ? <NodeIndexOutlined />
                                : nodeType === 'trigger' ? <ThunderboltOutlined />
                                    : <InfoCircleOutlined />;
                    return (
                        <div style={{ background: bgGradient, padding: '24px 24px 20px', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span onClick={() => setNodeDetailVisible(false)} style={{ cursor: 'pointer', opacity: 0.8, fontSize: 16 }}>✕</span>
                                <span style={{ fontSize: 12, opacity: 0.7, letterSpacing: 1 }}>节点详情</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20,
                                }}>
                                    {nodeIcon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedNodeData?.name || selectedNodeData?.id || '-'}</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                                        类型: {nodeType || '未知'} · ID: {selectedNodeData?.id || '-'}
                                    </div>
                                </div>
                                {s && (
                                    <Tag color="rgba(255,255,255,0.3)" style={{ borderRadius: 12, fontSize: 12, border: 'none' }}>
                                        {s}
                                    </Tag>
                                )}
                            </div>
                        </div>
                    );
                })()}
                {selectedNodeData && (() => {
                    const ns = selectedNodeData.state;
                    const effectiveStatus = ns?.status || selectedNodeData.status; // Fallback to inferred status
                    const nodeType = selectedNodeData.type;
                    const isExecution = nodeType === 'execution';
                    const isApproval = nodeType === 'approval';

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

                    return (
                        <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: '0 16px' }} items={[
                            {
                                key: 'overview',
                                label: '概览',
                                children: (
                                    <div style={{ padding: 24 }}>
                                        <Descriptions column={2} bordered size="small">
                                            <Descriptions.Item label="节点 ID">
                                                <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedNodeData.id}</Typography.Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="节点类型">
                                                <Tag>{nodeType}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="执行状态">
                                                {effectiveStatus ? (
                                                    <Tag color={
                                                        effectiveStatus === 'completed' || effectiveStatus === 'success' ? 'success' :
                                                            effectiveStatus === 'failed' || effectiveStatus === 'error' ? 'error' :
                                                                effectiveStatus === 'running' ? 'processing' :
                                                                    effectiveStatus === 'skipped' ? 'default' : 'warning'
                                                    }>
                                                        {effectiveStatus}
                                                    </Tag>
                                                ) : <Typography.Text type="secondary">未开始</Typography.Text>}
                                            </Descriptions.Item>
                                            {ns?.started_at && (
                                                <Descriptions.Item label="开始时间">
                                                    {ns.started_at}
                                                </Descriptions.Item>
                                            )}
                                            {(ns?.finished_at || ns?.completed_at) && (
                                                <Descriptions.Item label="结束时间">
                                                    {ns.finished_at || ns.completed_at}
                                                </Descriptions.Item>
                                            )}
                                            {ns?.duration_ms != null && (
                                                <Descriptions.Item label="耗时">
                                                    {ns.duration_ms >= 1000 ? `${(ns.duration_ms / 1000).toFixed(1)}s` : `${ns.duration_ms}ms`}
                                                </Descriptions.Item>
                                            )}
                                            {(ns?.error_message || ns?.message) && (
                                                <Descriptions.Item label="消息" span={2}>
                                                    <span style={{ color: ns?.status === 'failed' ? '#ff4d4f' : undefined }}>
                                                        {ns.error_message || ns.message}
                                                    </span>
                                                </Descriptions.Item>
                                            )}
                                        </Descriptions>

                                        {/* Execution stats */}
                                        {isExecution && ns?.stats && (
                                            <div style={{ marginTop: 16 }}>
                                                <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>执行统计</Typography.Text>
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
                                                <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>目标主机</Typography.Text>
                                                <Space wrap>{ns.hosts.map((h: string) => <Tag key={h}>{h}</Tag>)}</Space>
                                            </div>
                                        )}

                                        {/* Approval info */}
                                        {isApproval && ns && (
                                            <div style={{ marginTop: 16 }}>
                                                <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>审批信息</Typography.Text>
                                                <Descriptions column={1} size="small" bordered>
                                                    {ns.title && <Descriptions.Item label="审批标题">{ns.title}</Descriptions.Item>}
                                                    {ns.description && <Descriptions.Item label="审批说明">{ns.description}</Descriptions.Item>}
                                                    {ns.timeout_at && <Descriptions.Item label="超时时间">{ns.timeout_at}</Descriptions.Item>}
                                                    {ns.task_id && (
                                                        <Descriptions.Item label="审批任务 ID">
                                                            <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{ns.task_id}</Typography.Text>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            // Execution log tab
                            ...(isExecution && stdoutLogs.length > 0 ? [{
                                key: 'execution_log',
                                label: '执行日志',
                                children: (
                                    <div style={{ height: 'calc(100vh - 160px)', background: '#1e1e1e' }}>
                                        <LogConsole
                                            logs={stdoutLogs}
                                            height="100%"
                                            theme="dark"
                                        />
                                    </div>
                                )
                            }] : []),
                            // Live SSE logs tab
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
                            {
                                key: 'context',
                                label: '全局上下文',
                                children: (
                                    <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        <JsonPrettyView data={instance?.context || {}} />
                                    </div>
                                )
                            },
                            {
                                key: 'config',
                                label: '配置参数',
                                children: (
                                    <div style={{ padding: 16, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        <JsonPrettyView data={selectedNodeData.config || {}} />
                                    </div>
                                )
                            },
                            // 原始状态 tab - 仅对有运行时状态数据的节点显示
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
        </PageContainer>
    );
};

export default HealingInstanceDetail;
