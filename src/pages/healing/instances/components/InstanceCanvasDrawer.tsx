import React from 'react';
import { Drawer, Spin, Empty, Space, Tag, Typography, Button, Descriptions, } from 'antd';
import { FullscreenOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { useRequest } from '@umijs/max';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, type ProOptions } from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElements } from '../utils/layoutUtils';
import { buildCanvasElements } from '../utils/canvasBuilder';
import { getInstanceStatusConfig } from '../instanceStatus';
import AutoLayoutButton from './AutoLayoutButton';
import { getHealingInstanceDetail } from '@/services/auto-healing/instances';
import dayjs from 'dayjs';
import '../instances.css';

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

    const { data: instance, loading } = useRequest(
        async () => {
            if (!instanceId) return null;
            return getHealingInstanceDetail(instanceId);
        },
        {
            ready: !!instanceId && open,
            refreshDeps: [instanceId],
            onSuccess: (response) => {
                const data = response?.data || response;
                if (data?.flow_nodes && data.flow_edges) {
                    // 使用共享画布构建函数 — 与列表页/详情页逻辑完全一致
                    const { nodes: builtNodes, edges: builtEdges } = buildCanvasElements({
                        flowNodes: data.flow_nodes,
                        flowEdges: data.flow_edges,
                        nodeStates: data.node_states || {},
                        currentNodeId: data.current_node_id,
                        rule: data.rule,
                    });

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(builtNodes, builtEdges);
                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                }
            },
        }
    );

    const instanceData = instance
        ? (((instance as { data?: AutoHealing.FlowInstance }).data || instance) as AutoHealing.FlowInstance)
        : null;
    const statusConfig = getInstanceStatusConfig(instanceData?.status || 'pending');

    return (
        <Drawer
            title={
                <Space>
                    <span>{instanceData?.flow_name || '实例详情'}</span>
                    {instanceData && (
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
            size={800}
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
            styles={{ body: { padding: 0 } }}
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                </div>
            ) : !instanceData ? (
                <Empty description="未找到实例数据" style={{ marginTop: 100 }} />
            ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Instance Info */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                        <Descriptions size="small" column={2}>
                            <Descriptions.Item label="关联工单">
                                {instanceData.incident ? (
                                    <Text style={{ color: '#1890ff' }}>{instanceData.incident.title}</Text>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="触发规则">
                                {instanceData.rule ? (
                                    <Text style={{ color: '#1890ff' }}>{instanceData.rule.name}</Text>
                                ) : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="开始时间">
                                {instanceData.started_at ? dayjs(instanceData.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="当前节点">
                                {instanceData.current_node_id || '-'}
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
