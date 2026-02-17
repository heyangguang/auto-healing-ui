import React, { useEffect, useState } from 'react';
import { Drawer, Spin, Empty, Space, Tag, Typography, Button, Descriptions, message } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, PauseCircleOutlined, StopOutlined, FullscreenOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { useRequest } from '@umijs/max';
import ReactFlow, { Background, Controls, Edge, Node, useNodesState, useEdgesState, ProOptions } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { getLayoutedElements } from '../utils/layoutUtils';
import AutoLayoutButton from './AutoLayoutButton';
import { getHealingInstanceDetail } from '@/services/auto-healing/instances';
import dayjs from 'dayjs';

// Import node types from the editor
import ApprovalNode from '../../flows/editor/ApprovalNode';
import ConditionNode from '../../flows/editor/ConditionNode';
import CustomNode from '../../flows/editor/CustomNode';
import EndNode from '../../flows/editor/EndNode';
import ExecutionNode from '../../flows/editor/ExecutionNode';
import StartNode from '../../flows/editor/StartNode';

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

/** 将 node_states 的值统一为对象格式（兼容字符串和对象两种后端格式） */
function normalizeNodeState(raw: any): Record<string, any> | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return { status: raw };
    return raw;
}

const STATUS_EDGE_COLOR: Record<string, string> = {
    success: '#52c41a', completed: '#52c41a', approved: '#52c41a',
    failed: '#ff4d4f', rejected: '#ff4d4f', partial: '#faad14',
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

// Status config
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactElement; label: string }> = {
    pending: { color: '#d9d9d9', icon: <ClockCircleOutlined />, label: '等待中' },
    running: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '执行中' },
    waiting_approval: { color: '#fa8c16', icon: <PauseCircleOutlined />, label: '待审批' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已完成' },
    failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
    cancelled: { color: '#8c8c8c', icon: <StopOutlined />, label: '已取消' },
};

interface InstanceCanvasDrawerProps {
    open: boolean;
    instanceId?: string;
    onClose: () => void;
}

const InstanceCanvasDrawer: React.FC<InstanceCanvasDrawerProps> = ({ open, instanceId, onClose }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Auto layout handler
    const handleAutoLayout = () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes.map(n => ({ ...n })), edges.map(e => ({ ...e })), 'TB', true,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    };

    const { data: instance, loading, refresh } = useRequest(
        async () => {
            if (!instanceId) return null;
            return getHealingInstanceDetail(instanceId);
        },
        {
            ready: !!instanceId && open,
            refreshDeps: [instanceId],
            onSuccess: (data) => {
                if (data && data.flow_nodes && data.flow_edges) {
                    const executedNodes = inferExecutedNodes(
                        data.flow_nodes, data.flow_edges,
                        data.node_states || {}, data.current_node_id, data.status,
                    );

                    let flowNodes = data.flow_nodes.map((node) => {
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
                                isCurrent: node.id === data.current_node_id,
                            },
                        } as Node;
                    });

                    let flowEdges = data.flow_edges.map((edge: any) => {
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

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                }
            },
        }
    );

    const statusConfig = instance ? STATUS_CONFIG[instance.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending;

    return (
        <Drawer
            title={
                <Space>
                    <span>{instance?.flow_name || '实例详情'}</span>
                    {instance && (
                        <Tag color={statusConfig.color} style={{ border: 'none' }}>
                            <Space size={4}>
                                {statusConfig.icon}
                                {statusConfig.label}
                            </Space>
                        </Tag>
                    )}
                </Space>
            }
            placement="right"
            width={800}
            open={open}
            onClose={onClose}
            extra={
                <Button
                    icon={<FullscreenOutlined />}
                    onClick={() => {
                        if (instanceId) {
                            history.push(`/healing/instances/${instanceId}`);
                        }
                    }}
                >
                    全屏查看
                </Button>
            }
            bodyStyle={{ padding: 0 }}
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                </div>
            ) : !instance ? (
                <Empty description="未找到实例数据" style={{ marginTop: 100 }} />
            ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Instance Info */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                        <Descriptions size="small" column={2}>
                            <Descriptions.Item label="关联工单">
                                {instance.incident ? (
                                    <Text style={{ color: '#1890ff' }}>{instance.incident.title}</Text>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="触发规则">
                                {instance.rule ? (
                                    <Text style={{ color: '#1890ff' }}>{instance.rule.name}</Text>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="开始时间">
                                {instance.started_at ? dayjs(instance.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="当前节点">
                                {instance.current_node_id || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    {/* Canvas */}
                    <div style={{ flex: 1, minHeight: 400 }}>
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
                        >
                            <Background color="#f5f5f5" gap={20} />
                            <Controls />
                            <AutoLayoutButton onAutoLayout={handleAutoLayout} />
                        </ReactFlow>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default InstanceCanvasDrawer;
