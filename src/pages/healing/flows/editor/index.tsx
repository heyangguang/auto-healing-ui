import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    MarkerType,
    useReactFlow,
    Panel,
    NodeTypes,
    MiniMap,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PageContainer } from '@ant-design/pro-components';
import { Layout, Button, Input, message, Spin, Card, Descriptions, Empty } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, AppstoreOutlined, ExperimentOutlined, ClearOutlined } from '@ant-design/icons';
import dagre from 'dagre';
import { history, useParams, useAccess } from '@umijs/max';
import { getFlow, createFlow, updateFlow } from '@/services/auto-healing/healing';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import Sidebar from './Sidebar';
import NodeDetailPanel from './NodeDetailPanel';
import ConditionNode from './ConditionNode';
import CustomNode from './CustomNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import ApprovalNode from './ApprovalNode';
import ExecutionNode from './ExecutionNode';
import DryRunModal from './DryRunModal';
import ContextMenu from './ContextMenu';

const { Content, Sider } = Layout;

const getId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

const FlowEditorInner: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [flowName, setFlowName] = useState('未命名流程');
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [dryRunOpen, setDryRunOpen] = useState(false);
    const [menu, setMenu] = useState<{ id: string; top: number; left: number; right: number; bottom: number; type: 'node' | 'edge' } | null>(null);
    const { project } = useReactFlow();

    const nodeTypes = useMemo<NodeTypes>(() => ({
        condition: ConditionNode,
        custom: CustomNode,
        start: StartNode,
        end: EndNode,
        approval: ApprovalNode,
        execution: ExecutionNode,
        compute: CustomNode, // 计算节点使用通用节点组件
    }), []);

    // Initialize
    useEffect(() => {
        if (id) {
            fetchFlow(id);
        } else {
            // Default start/end
            const startId = 'start_1';
            const endId = 'end_1';
            setNodes([
                { id: startId, type: 'start', data: { label: '开始', type: 'start' }, position: { x: 200, y: 50 } },
                { id: endId, type: 'end', data: { label: '结束', type: 'end' }, position: { x: 200, y: 300 } }
            ]);
            setEdges([]);
            setFlowName('新建自愈流程');
        }
    }, [id]);

    const fetchFlow = async (flowId: string) => {
        setLoading(true);
        try {
            const res = await getFlow(flowId);
            if (res.data) {
                setFlowName(res.data.name);

                const initialNodes = (res.data.nodes || []).map((n: any) => {
                    let rfType = 'custom';
                    if (n.type === 'start') rfType = 'start';
                    else if (n.type === 'end') rfType = 'end';
                    else if (n.type === 'condition') rfType = 'condition';
                    else if (n.type === 'approval') rfType = 'approval';
                    else if (n.type === 'execution') rfType = 'execution';
                    else if (n.type === 'compute') rfType = 'compute';

                    return {
                        id: n.id,
                        type: rfType,
                        position: n.position || { x: 100, y: 100 },
                        data: {
                            ...n.config,
                            label: n.name || n.type,
                            type: n.type,
                            onRetry: () => setDryRunOpen(true) // Open DryRunModal on retry
                        }
                    };
                });

                // Transform Edges
                // If edges have sourceHandle/targetHandle (saved in DB JSONB), restore them.
                const initialEdges = (res.data.edges || []).map((e: any, index: number) => ({
                    id: e.id || `e${index}`,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                    label: e.label,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                }));

                setNodes(initialNodes);
                setEdges(initialEdges);
            }
        } catch (error) {
            message.error('加载流程失败');
        } finally {
            setLoading(false);
        }
    };

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
                y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0),
            });

            const newNodeId = getId();

            let rfType = 'custom';
            if (type === 'condition') rfType = 'condition';
            if (type === 'approval') rfType = 'approval';
            if (type === 'execution') rfType = 'execution';
            if (type === 'compute') rfType = 'compute';
            if (type === 'end') rfType = 'end';

            const newNode: Node = {
                id: newNodeId,
                type: rfType,
                position,
                data: {
                    label,
                    type,
                    onRetry: () => setDryRunOpen(true)
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setConfigOpen(true);
    };

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();

            // 开始节点不能删除
            if (node.data?.type === 'start') {
                message.warning('开始节点不能删除');
                return;
            }

            // 结束节点：只有最后一个不能删除
            if (node.data?.type === 'end') {
                const endNodeCount = nodes.filter(n => n.data?.type === 'end').length;
                if (endNodeCount <= 1) {
                    message.warning('至少需要保留一个结束节点');
                    return;
                }
            }

            const pane = reactFlowWrapper.current?.getBoundingClientRect();
            setMenu({
                id: node.id,
                top: event.clientY - (pane?.top || 0),
                left: event.clientX - (pane?.left || 0),
                type: 'node',
            } as any);
        },
        [nodes, setMenu],
    );

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            event.preventDefault();
            const pane = reactFlowWrapper.current?.getBoundingClientRect();
            setMenu({
                id: edge.id,
                top: event.clientY - (pane?.top || 0),
                left: event.clientX - (pane?.left || 0),
                type: 'edge',
            } as any);
        },
        [setMenu],
    );

    const onMenuClick = useCallback(() => {
        if (!menu) return;
        if (menu.type === 'node') {
            // 找到要删除的节点
            const nodeToDelete = nodes.find(n => n.id === menu.id);

            // 保护开始节点
            if (nodeToDelete?.data?.type === 'start') {
                message.warning('开始节点不能删除');
                setMenu(null);
                return;
            }

            // 保护最后一个结束节点
            if (nodeToDelete?.data?.type === 'end') {
                const endNodeCount = nodes.filter(n => n.data?.type === 'end').length;
                if (endNodeCount <= 1) {
                    message.warning('至少需要保留一个结束节点');
                    setMenu(null);
                    return;
                }
            }

            setNodes((nodes) => nodes.filter((n) => n.id !== menu.id));
            setEdges((edges) => edges.filter((e) => e.source !== menu.id && e.target !== menu.id));
            message.success('节点已删除');
        } else if (menu.type === 'edge') {
            setEdges((edges) => edges.filter((e) => e.id !== menu.id));
            message.success('连线已删除');
        }
        setMenu(null);
    }, [menu, nodes, setNodes, setEdges]);

    const onNodeConfigChange = (nodeId: string, values: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...values } };
            }
            return node;
        }));
    };

    const handleSave = async () => {
        if (!flowName) {
            message.error('请输入流程名称');
            return;
        }

        // 验证流程连通性
        const startNode = nodes.find(n => n.data.type === 'start');
        const endNodes = nodes.filter(n => n.data.type === 'end');

        if (!startNode) {
            message.error('流程必须包含开始节点');
            return;
        }

        if (endNodes.length === 0) {
            message.error('流程必须包含至少一个结束节点');
            return;
        }

        // 构建邻接表
        const adjacencyMap = new Map<string, string[]>();
        edges.forEach(edge => {
            const targets = adjacencyMap.get(edge.source) || [];
            targets.push(edge.target);
            adjacencyMap.set(edge.source, targets);
        });

        // 检查节点是否能到达某个结束节点
        const endNodeIds = new Set(endNodes.map(n => n.id));
        const canReachEndCache = new Map<string, boolean>();

        const canReachEnd = (nodeId: string, path: Set<string> = new Set()): boolean => {
            if (endNodeIds.has(nodeId)) return true;
            if (path.has(nodeId)) return false;
            if (canReachEndCache.has(nodeId)) return canReachEndCache.get(nodeId)!;

            path.add(nodeId);
            const targets = adjacencyMap.get(nodeId) || [];

            if (targets.length === 0) {
                canReachEndCache.set(nodeId, false);
                return false;
            }

            const result = targets.every(t => canReachEnd(t, new Set(path)));
            canReachEndCache.set(nodeId, result);
            return result;
        };

        if (!canReachEnd(startNode.id)) {
            const deadEndNodes = nodes.filter(n => {
                if (n.data.type === 'end') return false;
                const targets = adjacencyMap.get(n.id) || [];
                return targets.length === 0 && n.data.type !== 'start';
            });

            if (deadEndNodes.length > 0) {
                const names = deadEndNodes.map(n => n.data.label || n.data.type).slice(0, 3);
                message.error(`节点 "${names.join('", "')}" 没有连接到结束节点`);
            } else {
                message.error('流程存在无法到达结束节点的分支，请检查连线');
            }
            return;
        }

        // 验证执行节点的必填变量
        const executionNodes = nodes.filter(n => n.data.type === 'execution');
        for (const execNode of executionNodes) {
            const nodeName = execNode.data?.label || '任务执行';
            const taskTemplateId = execNode.data?.task_template_id;

            if (!taskTemplateId) {
                message.error(`节点 "${nodeName}" 未选择作业模板`);
                return;
            }

            try {
                // 获取任务模板和关联的 Playbook 变量定义
                const taskRes = await getExecutionTask(taskTemplateId);
                const task = taskRes.data;

                if (task?.playbook?.id) {
                    const playbookRes = await getPlaybook(task.playbook.id);
                    const playbook = playbookRes.data;
                    const variables = playbook?.variables || [];
                    const requiredVars = variables.filter((v: any) => v.required);

                    if (requiredVars.length > 0) {
                        const extraVars = execNode.data?.extra_vars || {};
                        const variableMappings = execNode.data?.variable_mappings || {};
                        const templateVars = task.extra_vars || {};
                        const missingVars: string[] = [];

                        for (const reqVar of requiredVars) {
                            // 1. 检查是否有表达式映射
                            if (variableMappings[reqVar.name]) continue;

                            // 2. 检查是否有节点级配置的静态值
                            const nodeVal = extraVars[reqVar.name];
                            if (nodeVal !== undefined && nodeVal !== '' && nodeVal !== null) continue;

                            // 3. 检查是否有任务模板级的默认值
                            const templateVal = templateVars[reqVar.name];
                            if (templateVal !== undefined && templateVal !== '' && templateVal !== null) continue;

                            // 4. 检查是否有变量定义的默认值
                            // 注意：根据后端逻辑，如果模板里没填，Playbook 里的 default 也会生效
                            if (reqVar.default !== undefined && reqVar.default !== '' && reqVar.default !== null) continue;

                            missingVars.push(reqVar.name);
                        }

                        if (missingVars.length > 0) {
                            message.error(`节点 "${nodeName}" 的必填变量未填写: ${missingVars.join(', ')}`);
                            // 自动选中该节点并打开配置面板
                            setSelectedNode(execNode);
                            setConfigOpen(true);
                            return;
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to validate execution node:', error);
                // 验证失败时不阻止保存，只记录警告
            }
        }

        // Transform ReactFlow Nodes to Backend
        // 清理临时执行状态，不保存到后端
        const apiNodes = nodes.map(n => {
            const { status, dryRunMessage, dryRunOutput, logs, onRetry, ...cleanData } = n.data;
            return {
                id: n.id,
                type: n.data.type,
                name: n.data.label,
                position: n.position,
                config: cleanData
            };
        });

        // Update Condition Configs based on Edges
        edges.forEach(edge => {
            const sourceNode = apiNodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.type === 'condition') {
                if (edge.sourceHandle === 'true') {
                    sourceNode.config.true_target = edge.target;
                } else if (edge.sourceHandle === 'false') {
                    sourceNode.config.false_target = edge.target;
                }
            }
        });

        const apiEdges = edges.map(e => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || undefined,
            targetHandle: e.targetHandle || undefined,
            id: e.id // persist ID if needed
        }));

        const payload = {
            name: flowName,
            nodes: apiNodes,
            edges: apiEdges,
            is_active: true
        };

        try {
            if (id) {
                await updateFlow(id, payload);
                message.success('保存成功');
            } else {
                const res = await createFlow(payload);
                message.success('创建成功');
                history.push(`/healing/flows/editor/${res.data.id}`);
            }
        } catch (error) {
            message.error('保存失败');
        }
    };

    const onLayout = useCallback(
        (direction: string) => {
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));

            const nodeWidth = 200;
            const nodeHeight = 80;

            dagreGraph.setGraph({
                rankdir: 'TB',
                nodesep: 60,
                ranksep: 80,
                edgesep: 20,
                marginx: 40,
                marginy: 40,
            });

            nodes.forEach((node) => {
                dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
            });

            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            dagre.layout(dagreGraph);

            const layoutedNodes = nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);

                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - nodeWidth / 2 + 50,
                        y: nodeWithPosition.y - nodeHeight / 2 + 30,
                    },
                };
            });

            setNodes(layoutedNodes);
            setEdges((eds) => eds.map(edge => ({
                ...edge,
                type: 'smoothstep',
            })));

            setTimeout(() => {
                reactFlowInstance?.fitView({ padding: 0.15 });
            }, 100);
        },
        [nodes, edges, reactFlowInstance, setNodes, setEdges]
    );

    const onRunSimulation = useCallback(() => {
        // Reset state
        setEdges((eds) => eds.map(e => ({ ...e, animated: false, style: { stroke: '#b1b1b7' } })));
        setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: undefined } })));

        // Simple BFS simulation
        let activeNodes: string[] = [];
        const startNode = nodes.find(n => n.data.type === 'start');
        if (startNode) activeNodes.push(startNode.id);

        const simulateStep = (currentNodes: string[]) => {
            if (currentNodes.length === 0) return;

            // Mark current nodes as running
            setNodes((nds) => nds.map(n => {
                if (currentNodes.includes(n.id)) {
                    return { ...n, data: { ...n.data, status: 'running' } };
                }
                return n;
            }));

            setTimeout(() => {
                // Mark current as success
                setNodes((nds) => nds.map(n => {
                    if (currentNodes.includes(n.id)) {
                        return { ...n, data: { ...n.data, status: 'success' } };
                    }
                    return n;
                }));

                const nextNodes: string[] = [];
                const nextEdges: string[] = [];

                currentNodes.forEach(nodeId => {
                    const outgoingEdges = edges.filter(e => e.source === nodeId);
                    outgoingEdges.forEach(e => {
                        nextEdges.push(e.id);
                        nextNodes.push(e.target);
                    });
                });

                // Animate edges
                setEdges((eds) => eds.map(e => {
                    if (nextEdges.includes(e.id)) {
                        return { ...e, animated: true, style: { stroke: '#52c41a', strokeWidth: 2 } };
                    }
                    return e;
                }));

                if (nextNodes.length > 0) {
                    simulateStep([...new Set(nextNodes)]); // dedupe
                }
            }, 1000);
        };

        simulateStep(activeNodes);

    }, [nodes, edges, setNodes, setEdges]);

    return (
        <div className="dndflow" style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: 'calc(100vh - 140px)',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid #f0f0f0',
        }}>
            <ReactFlowProvider>
                <Layout style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
                    <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
                        <Sidebar />
                    </Sider>
                    <Content style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: 8,
                            backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/healing/flows')} />
                                <Input
                                    value={flowName}
                                    onChange={e => setFlowName(e.target.value)}
                                    style={{ width: 300, fontSize: 16, fontWeight: 500 }}
                                    bordered={false}
                                    placeholder="流程名称"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button icon={<ExperimentOutlined />} onClick={() => setDryRunOpen(true)} disabled={!id}>Dry-Run</Button>
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        setNodes((nds) => nds.map(n => ({
                                            ...n,
                                            data: {
                                                ...n.data,
                                                status: undefined,
                                                dryRunMessage: undefined,
                                                dryRunOutput: undefined,
                                                logs: []
                                            }
                                        })));
                                        setEdges((eds) => eds.map(e => ({
                                            ...e,
                                            animated: false,
                                            style: { stroke: '#b1b1b7' }
                                        })));
                                        message.success('状态已重置');
                                    }}
                                >
                                    重置状态
                                </Button>
                                <Button icon={<AppstoreOutlined />} onClick={() => onLayout('TB')}>一键整理</Button>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={id ? !access.canUpdateFlow : !access.canCreateFlow}>保存流程</Button>
                            </div>
                        </div>

                        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onInit={setReactFlowInstance}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onNodeClick={onNodeClick}
                                onNodeContextMenu={onNodeContextMenu}
                                onEdgeContextMenu={onEdgeContextMenu}
                                onPaneClick={onPaneClick}
                                nodeTypes={nodeTypes}
                                fitView
                                fitViewOptions={{ padding: 0.3, maxZoom: 0.8 }}
                                defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
                                minZoom={0.3}
                                maxZoom={1.5}
                            >
                                <Controls style={{ bottom: 100 }} />
                                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#999" />
                                <MiniMap nodeStrokeWidth={3} zoomable pannable style={{ bottom: 100 }} />
                                {menu && <ContextMenu {...menu} onClick={onMenuClick} onClose={onPaneClick} />}
                            </ReactFlow>
                        </div>
                    </Content>

                    <NodeDetailPanel
                        node={selectedNode ? nodes.find(n => n.id === selectedNode.id) || selectedNode : null}
                        allNodes={nodes}
                        allEdges={edges}
                        open={configOpen}
                        onClose={() => setConfigOpen(false)}
                        onChange={onNodeConfigChange}
                        onNodeSelect={(nodeId) => {
                            const targetNode = nodes.find(n => n.id === nodeId);
                            if (targetNode) {
                                setSelectedNode(targetNode);
                            }
                        }}
                        onRetry={() => setDryRunOpen(true)}
                    />

                    {id && (
                        <DryRunModal
                            open={dryRunOpen}
                            flowId={id}
                            approvalNodes={nodes
                                .filter(n => n.data?.type === 'approval')
                                .map(n => ({ id: n.id, label: n.data?.label || '审批节点' }))
                            }
                            onClose={() => setDryRunOpen(false)}
                            onStartRun={() => {
                                setDryRunOpen(false); // Close modal to show canvas animation
                                // Reset all node statuses and logs before running
                                setNodes((nds) => nds.map(n => ({
                                    ...n,
                                    data: {
                                        ...n.data,
                                        status: undefined,
                                        dryRunMessage: undefined,
                                        dryRunInput: undefined,
                                        dryRunProcess: undefined,
                                        dryRunOutput: undefined,
                                        logs: [], // Clear logs
                                        onRetry: () => setDryRunOpen(true)
                                    }
                                })));
                                setEdges((eds) => eds.map(e => ({ ...e, animated: false, style: { stroke: '#b1b1b7' } })));
                            }}
                            onNodeLog={(nodeId, level, message, details) => {
                                // Accumulate logs in node data
                                setNodes((nds) => nds.map(n => {
                                    if (n.id === nodeId) {
                                        const currentLogs = n.data.logs || [];
                                        return {
                                            ...n,
                                            data: {
                                                ...n.data,
                                                logs: [...currentLogs, {
                                                    timestamp: new Date().toISOString(),
                                                    level,
                                                    message,
                                                    details
                                                }]
                                            }
                                        };
                                    }
                                    return n;
                                }));
                            }}
                            onNodeResult={(data) => {
                                const { node_id: nodeId, status, message: msg, input, process, output, output_handle: outputHandle } = data;
                                setNodes((nds) => nds.map(n => {
                                    if (n.id === nodeId) {
                                        return {
                                            ...n,
                                            data: {
                                                ...n.data,
                                                status,
                                                dryRunMessage: msg,
                                                dryRunInput: input,
                                                dryRunProcess: process,
                                                dryRunOutput: output
                                            }
                                        };
                                    }
                                    return n;
                                }));
                                // Animate edge - 支持新旧状态值（向后兼容）
                                const isError = status === 'error' || status === 'failed';
                                const isRunning = status === 'running';
                                const isSkipped = status === 'skipped';
                                // 新状态: success, partial; 旧状态: ok, simulated, would_execute, would_send
                                const isSuccess = ['success', 'partial', 'ok', 'simulated', 'would_execute', 'would_send'].includes(status);

                                if (isRunning || isError || isSuccess || isSkipped) {
                                    setEdges((eds) => eds.map(e => {
                                        // 1. 高亮入边（指向当前节点的边）
                                        if (e.target === nodeId) {
                                            return {
                                                ...e,
                                                animated: isRunning,
                                                style: {
                                                    stroke: isSkipped ? '#bfbfbf' : (isError ? '#ff4d4f' : (isRunning ? '#1890ff' : '#52c41a')),
                                                    strokeWidth: isSkipped ? 1 : 2
                                                }
                                            };
                                        }
                                        // 2. 如果有 output_handle，高亮对应的出边（从当前节点出发、且 sourceHandle 匹配的边）
                                        //    这对于分支节点（如 approval、execution、condition）非常重要
                                        if (outputHandle && e.source === nodeId && e.sourceHandle === outputHandle) {
                                            return {
                                                ...e,
                                                animated: false,
                                                style: {
                                                    stroke: isError ? '#ff4d4f' : '#52c41a',
                                                    strokeWidth: 2
                                                }
                                            };
                                        }
                                        return e;
                                    }));
                                }
                            }}
                            onRunComplete={(success, msg) => {
                                message.open({
                                    type: success ? 'success' : 'error',
                                    content: msg,
                                    duration: 3,
                                });
                            }}
                        />
                    )}
                </Layout>
            </ReactFlowProvider>
        </div>
    );
};

const FlowEditor: React.FC = () => (
    <ReactFlowProvider>
        <FlowEditorInner />
    </ReactFlowProvider>
);

export default FlowEditor;
