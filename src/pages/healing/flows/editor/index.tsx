import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Spin, message } from 'antd';
import { useParams, useAccess, history } from '@umijs/max';
import { addEdge, Connection, ReactFlowProvider, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { getFlow, createFlow, updateFlow } from '@/services/auto-healing/healing';
import {
    createConnectedEdge,
    createDefaultFlowGraph,
    createDroppedNode,
    getNodeDeleteError,
    mapFlowResponseToGraph,
    applyAutoLayout,
    buildContextMenuState,
} from './flowEditorGraph';
import { buildFlowPayload, validateExecutionNodes, validateFlowStructure } from './flowEditorPersistence';
import { flowEditorNodeTypes } from './flowEditorConstants';
import { FlowEditorHeader } from './FlowEditorHeader';
import { FlowEditorWorkspace } from './FlowEditorWorkspace';
import { useFlowDryRun } from './useFlowDryRun';
import type { ContextMenuState, FlowEditorEdge, FlowEditorNode, FlowEditorNodeData } from './flowEditorTypes';

const Sidebar = lazy(() => import('./Sidebar'));
const { Sider } = Layout;

const FlowEditorInner: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowEditorNodeData>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEditorEdge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<{ fitView: (options?: { padding?: number }) => void; project: (position: { x: number; y: number }) => { x: number; y: number } } | null>(null);
    const [flowName, setFlowName] = useState('未命名流程');
    const [flowIsActive, setFlowIsActive] = useState(true);
    const [selectedNode, setSelectedNode] = useState<FlowEditorNode | null>(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [dryRunOpen, setDryRunOpen] = useState(false);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);
    const [loading, setLoading] = useState(false);

    const activeSelectedNode = useMemo(
        () => (selectedNode ? nodes.find((node) => node.id === selectedNode.id) || null : null),
        [nodes, selectedNode],
    );

    const {
        approvalNodes,
        handleNodeLog,
        handleNodeResult,
        handleResetState,
        handleRunComplete,
        handleStartRun,
    } = useFlowDryRun({
        nodes,
        setDryRunOpen,
        setEdges,
        setNodes,
    });

    const fetchFlow = useCallback(async (flowId: string) => {
        setLoading(true);
        try {
            const response = await getFlow(flowId);
            if (!response.data) {
                return;
            }
            const mapped = mapFlowResponseToGraph(response.data, () => setDryRunOpen(true));
            setFlowName(mapped.flowName);
            setFlowIsActive(mapped.flowIsActive);
            setNodes(mapped.nodes);
            setEdges(mapped.edges);
        } finally {
            setLoading(false);
        }
    }, [setEdges, setNodes]);

    useEffect(() => {
        if (id) {
            void fetchFlow(id);
            return;
        }
        const initialState = createDefaultFlowGraph(() => setDryRunOpen(true));
        setNodes(initialState.nodes);
        setEdges(initialState.edges);
        setFlowName(initialState.flowName);
        setFlowIsActive(initialState.flowIsActive);
    }, [fetchFlow, id, setEdges, setNodes]);

    useEffect(() => {
        if (!selectedNode || activeSelectedNode) {
            return;
        }
        setSelectedNode(null);
        setConfigOpen(false);
    }, [activeSelectedNode, selectedNode]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((currentEdges) => addEdge(createConnectedEdge(params), currentEdges)),
        [setEdges],
    );

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        const label = event.dataTransfer.getData('application/label');
        if (!type || !reactFlowInstance) {
            return;
        }
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        const position = reactFlowInstance.project({
            x: event.clientX - (bounds?.left || 0),
            y: event.clientY - (bounds?.top || 0),
        });
        setNodes((currentNodes) => currentNodes.concat(createDroppedNode(type, label, position, () => setDryRunOpen(true))));
    }, [reactFlowInstance, setNodes]);

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: FlowEditorNode) => {
        event.preventDefault();
        const deleteError = getNodeDeleteError(node, nodes);
        if (deleteError) {
            message.warning(deleteError);
            return;
        }
        setMenu(buildContextMenuState(event, reactFlowWrapper.current, node.id, 'node'));
    }, [nodes]);

    const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: FlowEditorEdge) => {
        event.preventDefault();
        setMenu(buildContextMenuState(event, reactFlowWrapper.current, edge.id, 'edge'));
    }, []);

    const onMenuClick = useCallback(() => {
        if (!menu) return;
        if (menu.type === 'edge') {
            setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== menu.id));
            message.success('连线已删除');
            setMenu(null);
            return;
        }

        const nodeToDelete = nodes.find((node) => node.id === menu.id);
        const deleteError = getNodeDeleteError(nodeToDelete, nodes);
        if (deleteError) {
            message.warning(deleteError);
            setMenu(null);
            return;
        }
        if (selectedNode?.id === menu.id) {
            setSelectedNode(null);
            setConfigOpen(false);
        }
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== menu.id));
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== menu.id && edge.target !== menu.id));
        message.success('节点已删除');
        setMenu(null);
    }, [menu, nodes, selectedNode?.id, setEdges, setNodes]);

    const onNodeConfigChange = useCallback((nodeId: string, values: Record<string, unknown>) => {
        setNodes((currentNodes) => currentNodes.map((node) => (
            node.id === nodeId ? { ...node, data: { ...node.data, ...values } } : node
        )));
    }, [setNodes]);

    const handleSave = useCallback(async () => {
        if (!flowName) {
            message.error('请输入流程名称');
            return;
        }

        const structureValidation = validateFlowStructure(nodes, edges);
        if (!structureValidation.ok) {
            if (structureValidation.reason === 'dead-end') {
                message.error(`节点 "${structureValidation.deadEndNodeLabels.join('", "')}" 没有连接到结束节点`);
            } else {
                message.error('流程存在无法到达结束节点的分支，请检查连线');
            }
            return;
        }

        const executionValidation = await validateExecutionNodes(nodes);
        if (executionValidation.issue) {
            const nodeName = String(executionValidation.issue.node.data?.label || '任务执行');
            if (executionValidation.issue.missingVars[0] === 'task_template_id') {
                message.error(`节点 "${nodeName}" 未选择作业模板`);
            } else {
                message.error(`节点 "${nodeName}" 的必填变量未填写: ${executionValidation.issue.missingVars.join(', ')}`);
            }
            setSelectedNode(executionValidation.issue.node);
            setConfigOpen(true);
            return;
        }
        if (executionValidation.unavailableNodeLabels.length > 0) {
            message.warning(`节点 "${executionValidation.unavailableNodeLabels.join('", "')}" 的远程模板校验暂不可用，已继续保存`);
        }

        const payload = buildFlowPayload(edges, flowIsActive, flowName, nodes);
        if (id) {
            await updateFlow(id, payload);
            message.success('保存成功');
            return;
        }
        const response = await createFlow(payload);
        message.success('创建成功');
        history.push(`/healing/flows/editor/${response.data.id}`);
    }, [edges, flowIsActive, flowName, id, nodes]);

    const handleLayout = useCallback(() => {
        const layoutedNodes = applyAutoLayout(nodes, edges);
        setNodes(layoutedNodes);
        setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, type: 'smoothstep' })));
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.15 }), 100);
    }, [edges, nodes, reactFlowInstance, setEdges, setNodes]);

    return (
        <div
            className="dndflow"
            style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: 0, overflow: 'hidden' }}
        >
            <Layout style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
                <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
                    <Suspense fallback={<div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}><Spin /></div>}>
                        <Sidebar />
                    </Suspense>
                </Sider>
                <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
                    <FlowEditorHeader
                        canSave={id ? access.canUpdateFlow : access.canCreateFlow}
                        flowName={flowName}
                        hasFlowId={Boolean(id)}
                        onBack={() => history.push('/healing/flows')}
                        onLayout={handleLayout}
                        onNameChange={setFlowName}
                        onResetState={handleResetState}
                        onRunDryRun={() => setDryRunOpen(true)}
                        onSave={() => void handleSave()}
                    />

                    <FlowEditorWorkspace
                        activeSelectedNode={activeSelectedNode}
                        approvalNodes={approvalNodes}
                        configOpen={configOpen}
                        dryRunOpen={dryRunOpen}
                        edges={edges}
                        flowId={id}
                        menu={menu}
                        nodeTypes={flowEditorNodeTypes}
                        nodes={nodes}
                        onCloseConfig={() => setConfigOpen(false)}
                        onCloseDryRun={() => setDryRunOpen(false)}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onEdgeContextMenu={onEdgeContextMenu}
                        onEdgesChange={onEdgesChange}
                        onInit={(instance) => setReactFlowInstance(instance as typeof reactFlowInstance)}
                        onMenuClick={onMenuClick}
                        onNodeClick={(_, node) => {
                            setSelectedNode(node);
                            setConfigOpen(true);
                        }}
                        onNodeConfigChange={onNodeConfigChange}
                        onNodeContextMenu={onNodeContextMenu}
                        onNodeLog={handleNodeLog}
                        onNodeResult={handleNodeResult}
                        onNodeSelect={(nodeId) => {
                            const targetNode = nodes.find((node) => node.id === nodeId);
                            if (targetNode) {
                                setSelectedNode(targetNode);
                            }
                        }}
                        onNodesChange={onNodesChange}
                        onPaneClick={() => setMenu(null)}
                        onRetry={() => setDryRunOpen(true)}
                        onRunComplete={handleRunComplete}
                        onStartRun={handleStartRun}
                        reactFlowWrapper={reactFlowWrapper}
                    />
                </div>
            </Layout>
        </div>
    );
};

const FlowEditor: React.FC = () => (
    <ReactFlowProvider>
        <FlowEditorInner />
    </ReactFlowProvider>
);

export default FlowEditor;
