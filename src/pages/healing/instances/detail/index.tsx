import {
    cancelHealingInstance,
    getHealingInstanceDetail,
    retryHealingInstance,
} from '@/services/auto-healing/instances';
import { getExecutionLogs } from '@/services/auto-healing/execution';
import { createInstanceEventStream, NodeStatus } from '@/services/auto-healing/sse';

import { history, useParams, useRequest, request, useAccess } from '@umijs/max';
import { Button, Card, Drawer, Empty, Space, Spin, Steps, Tabs, Tag, Typography, message, Descriptions, Result, Timeline, Alert, Collapse, Badge, Row, Col, Statistic, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, EyeOutlined, ClockCircleOutlined, BugOutlined, FileTextOutlined, WarningOutlined, ThunderboltOutlined, AimOutlined, AppstoreOutlined, TagOutlined, DashboardOutlined, AlertOutlined, NodeIndexOutlined, PlayCircleOutlined, CodeOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { buildCanvasElements, normalizeNodeState, getActiveBranchHandle, STATUS_EDGE_COLOR, NODE_TYPE_LABELS } from '../utils/canvasBuilder';
import AutoLayoutButton from '../components/AutoLayoutButton';
import LogConsole, { LogEntry } from '@/components/execution/LogConsole';
import '../instances.css';

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

// 节点类型中文标签
import { NODE_TYPE_COLORS, getNodeTypeColor } from '../../nodeConfig';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';

// 配置参数中文标签
const CONFIG_LABELS: Record<string, string> = {
    label: '节点名称', type: '节点类型', description: '描述',
    task_template_id: '任务模板', task_template_name: '任务模板',
    task_id: '任务模板', run_id: '执行记录',
    playbook_id: 'Playbook ID', playbook_name: 'Playbook',
    extra_vars: '额外变量', hosts: '目标主机', target_hosts: '目标主机',
    timeout: '超时', timeout_seconds: '超时(秒)',
    condition: '条件表达式', expression: '表达式',
    title: '审批标题', approval_title: '审批标题',
    notification_template_id: '通知模板', notification_channel_id: '通知渠道',
    template_id: '通知模板', channel_id: '通知渠道',
    notification_template_name: '通知模板', notification_channel_name: '通知渠道',
    on_success: '成功时', on_failure: '失败时',
    retry_count: '重试次数', retry_interval: '重试间隔',
    activeHandles: '激活分支', active_handles: '激活分支',
    variable_name: '变量名称', variable_value: '变量值',
    set_variable: '设置变量', compute: '计算逻辑',
    cmdb_query: 'CMDB 查询', cmdb_filter: 'CMDB 过滤条件',
    host_pattern: '主机匹配', host_group: '主机分组',
    script: '脚本内容', command: '执行命令',
    approvers: '审批人', approval_type: '审批类型',
    max_retries: '最大重试', interval: '间隔(秒)',
    tags: '标签', priority: '优先级', enabled: '是否启用',
    extracted_hosts: '提取主机', target: '目标',
    playbook: 'Playbook 剧本', inventory: '主机清单',
    become: '提权执行', become_method: '提权方式',
    forks: '并发数', verbosity: '详细级别',
    limit: '主机限制', check_mode: '检查模式',
    diff_mode: '差异模式', connection: '连接方式',
    credentials: '凭证', secret_id: '凭证 ID',
    template_name: '模板名称', channel_name: '渠道名称',
    // 主机提取节点
    extract_mode: '提取方式', source_field: '来源字段',
    output_key: '输出变量名', input_key: '输入变量名',
    result_key: '结果变量名', hosts_key: '主机变量名',
    // 条件/计算节点
    true_branch: '真分支', false_branch: '假分支',
    default_branch: '默认分支', branches: '分支列表',
    // CMDB 验证
    validation_rules: '验证规则', cmdb_host_field: 'CMDB 主机字段',
    cmdb_status_field: 'CMDB 状态字段', expected_status: '期望状态',
};

const CONTEXT_LABELS: Record<string, string> = {
    output: '输出结果', result: '执行结果', status: '状态',
    hosts: '主机列表', extracted_hosts: '提取的主机',
    target_hosts: '目标主机', host_count: '主机数量',
    stdout: '标准输出', stderr: '错误输出',
    exit_code: '退出码', return_code: '返回码',
    error_message: '错误信息', message: '消息', errors: '错误列表',
    duration_ms: '耗时(ms)', started_at: '开始时间',
    finished_at: '结束时间', updated_at: '更新时间',
    run_id: '执行记录 ID', task_id: '任务模板 ID',
    stats: '执行统计', run: '执行详情',
    variables: '变量', context: '上下文',
    computed_value: '计算结果', computed_results: '计算结果',
    variable_name: '变量名', variable_value: '变量值',
    set_variables: '已设变量', variables_set: '已设置变量',
    matched_hosts: '匹配主机', cmdb_results: 'CMDB 结果',
    // 审批
    decision: '审批决策', decision_comment: '审批意见',
    approved_by: '审批人', approved_at: '审批时间',
    // 通知
    notification_sent: '通知已发送', notification_result: '通知结果',
    // 条件/分支
    activeHandles: '激活分支', activated_branch: '激活分支',
    condition_result: '条件结果', matched_expression: '匹配表达式',
    expression_result: '表达式结果', branch: '分支',
    output_handle: '输出分支',
    // 主机提取
    source_field: '来源字段', extract_mode: '提取方式',
    // CMDB 验证
    validated_hosts: '验证通过主机', invalid_hosts: '无效主机',
    validation_summary: '验证摘要',
};

// 执行日志 Tab - 异步加载 API 日志
const ExecutionLogTab: React.FC<{ runId?: string; fallbackLogs: LogEntry[] }> = ({ runId, fallbackLogs }) => {
    const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!runId || loaded) return;
        setLoading(true);
        getExecutionLogs(runId)
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
                <Spin tip="加载执行日志中..."><div /></Spin>
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
    const access = useAccess();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [contextDrawerVisible, setContextDrawerVisible] = useState(false);
    const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    const selectedNodeDataRef = useRef<any>(null);
    const [contextData, setContextData] = useState<any>({});
    const [instanceStatus, setInstanceStatus] = useState<string>('pending');

    // ID → 名称映射（通知渠道/模板 + 执行任务模板）
    const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

    // 选中节点时，异步获取关联实体名称
    useEffect(() => {
        if (!selectedNodeData?.config) return;
        const cfg = selectedNodeData.config;
        const ns = selectedNodeData.state;
        const nodeType = cfg.type;

        const fetchNames = async () => {
            const newNames: Record<string, string> = {};

            // ——— 通知节点：解析渠道和模板名称 ———
            if (nodeType === 'notification' || nodeType === 'send_notification') {
                const channelId = cfg.channel_id || cfg.notification_channel_id;
                const templateId = cfg.template_id || cfg.notification_template_id;
                if (channelId && !resolvedNames[channelId]) {
                    try {
                        const res = await request<any>(`/api/v1/tenant/channels/${channelId}`);
                        const data = res?.data || res;
                        if (data?.name) newNames[channelId] = data.name;
                    } catch (e) { /* ignore */ }
                }
                if (templateId && !resolvedNames[templateId]) {
                    try {
                        const res = await request<any>(`/api/v1/tenant/templates/${templateId}`);
                        const data = res?.data || res;
                        if (data?.name) newNames[templateId] = data.name;
                    } catch (e) { /* ignore */ }
                }
            }

            // ——— 执行节点：解析任务模板名称 ———
            if (nodeType === 'execution') {
                const taskId = cfg.task_id || cfg.task_template_id || ns?.task_id || ns?.run?.task_id;
                if (taskId && !resolvedNames[taskId]) {
                    try {
                        const res = await request<any>(`/api/v1/tenant/execution-tasks/${taskId}`);
                        const data = res?.data || res;
                        if (data?.name) newNames[taskId] = data.name;
                    } catch (e) { /* ignore */ }
                }
                // 如果有 run_id，获取执行记录详情（含 task 名称）
                const runId = ns?.run?.run_id || cfg.run_id;
                if (runId && !resolvedNames[`run:${runId}`]) {
                    try {
                        const res = await request<any>(`/api/v1/tenant/execution-runs/${runId}`);
                        const data = res?.data || res;
                        if (data?.task?.name) newNames[`task:${data.task_id || taskId}`] = data.task.name;
                        if (data?.task?.target_hosts) newNames[`hosts:${runId}`] = data.task.target_hosts;
                        newNames[`run:${runId}`] = data?.status || 'unknown';
                    } catch (e) { /* ignore */ }
                }
            }

            if (Object.keys(newNames).length > 0) {
                setResolvedNames(prev => ({ ...prev, ...newNames }));
            }
        };
        fetchNames();
    }, [selectedNodeData]);

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
            onSuccess: (response) => {
                const data = response?.data || response;
                if (data && data.flow_nodes && data.flow_edges) {
                    setInstanceStatus(data.status);
                    setContextData(data.context || {});

                    // 使用共享画布构建函数 — 与列表页逻辑完全一致
                    const { nodes: builtNodes, edges: builtEdges } = buildCanvasElements({
                        flowNodes: data.flow_nodes,
                        flowEdges: data.flow_edges,
                        nodeStates: data.node_states || {},
                        currentNodeId: data.current_node_id,
                        rule: data.rule,
                    });

                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        builtNodes,
                        builtEdges
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
                if (selectedNodeDataRef.current?.id === data.node_id) {
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
                const finalStatus = data.status || (data.success ? 'completed' : 'failed');
                setInstanceStatus(finalStatus);
                const completedWithIssues = finalStatus === 'completed' && data.success === false;
                if (finalStatus === 'completed' && !completedWithIssues) {
                    message.success(data.message || '流程执行完成');
                } else if (completedWithIssues) {
                    message.warning(data.message || '流程已完成，但存在异常节点');
                } else if (finalStatus === 'cancelled') {
                    message.info(data.message || '流程已取消');
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
    }, [id, instanceStatus]); // Re-subscribe if ID changes, but status check logic handles unwanted reconnections

    // Keep ref in sync with selectedNodeData state
    useEffect(() => {
        selectedNodeDataRef.current = selectedNodeData;
    }, [selectedNodeData]);

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
            /* global error handler */
        }
    };

    const handleRetry = async () => {
        if (!id) return;
        try {
            await retryHealingInstance(id);
            message.success('已开始重试');
            refresh();
        } catch (error) {
            /* global error handler */
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
                            {INSTANCE_STATUS_LABELS[instanceStatus] || instanceStatus}
                        </Tag>
                        {instanceStatus === 'completed' && instance?.node_states && (() => {
                            const hasFailed = Object.values(instance.node_states).some((state: any) => {
                                const ns = normalizeNodeState(state);
                                return ns?.status === 'failed' || ns?.status === 'error' || ns?.status === 'rejected';
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
                            <Button danger onClick={handleCancel} disabled={!access.canUpdateFlow}>取消执行</Button>
                        )}
                        {instanceStatus === 'failed' && (
                            <Button type="primary" onClick={handleRetry} disabled={!access.canUpdateFlow}>重试</Button>
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
                        return ns?.status === 'failed' || ns?.status === 'error' || ns?.status === 'rejected';
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
                size={600}
                onClose={() => setContextDrawerVisible(false)}
                open={contextDrawerVisible}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
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
                                    {INSTANCE_STATUS_LABELS[instanceStatus] || instanceStatus}
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
                                        {/* 节点执行时间线 */}
                                        {instance?.node_states && Object.keys(instance.node_states).length > 0 && (
                                            <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                                    执行时间线
                                                </div>
                                                <Timeline items={Object.entries(instance.node_states)
                                                    .map(([nodeId, rawState]) => {
                                                        const ns = normalizeNodeState(rawState);
                                                        const nodeName = instance.flow_nodes?.find((n: any) => n.id === nodeId)?.name || nodeId;
                                                        const isFail = ns?.status === 'failed' || ns?.status === 'error' || ns?.status === 'rejected';
                                                        const isSuccess = ns?.status === 'success' || ns?.status === 'completed' || ns?.status === 'approved';
                                                        const isSkipped = ns?.status === 'skipped';
                                                        const statusKey = ns?.status || 'unknown';
                                                        const timeVal = new Date(ns?.started_at || ns?.updated_at || 0).getTime();
                                                        const timeStr = ns?.started_at || ns?.updated_at
                                                            ? new Date(ns?.started_at || ns?.updated_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                            : '';
                                                        const durationStr = ns?.duration_ms != null
                                                            ? (ns.duration_ms >= 1000 ? `${(ns.duration_ms / 1000).toFixed(1)}s` : `${ns.duration_ms}ms`)
                                                            : '';
                                                        return { nodeId, ns, nodeName, isFail, isSuccess, isSkipped, statusKey, timeVal, timeStr, durationStr };
                                                    })
                                                    .sort((a, b) => a.timeVal - b.timeVal)
                                                    .map(({ ns, nodeName, isFail, isSuccess, isSkipped, statusKey, timeStr, durationStr }) => ({
                                                        color: isFail ? 'red' : isSuccess ? 'green' : isSkipped ? 'gray' : 'blue',
                                                        dot: isFail
                                                            ? <CloseCircleOutlined style={{ fontSize: 14 }} />
                                                            : isSuccess
                                                                ? <CheckCircleOutlined style={{ fontSize: 14 }} />
                                                                : <ClockCircleOutlined style={{ fontSize: 14 }} />,
                                                        children: (
                                                            <div style={{ paddingBottom: 4 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                    <Typography.Text strong style={{ fontSize: 13, color: '#262626' }}>{nodeName}</Typography.Text>
                                                                    <Tag style={{
                                                                        margin: 0, border: 'none', fontSize: 11,
                                                                        background: isFail ? '#fff1f0' : isSuccess ? '#f6ffed' : isSkipped ? '#f5f5f5' : '#e6f7ff',
                                                                        color: isFail ? '#ff4d4f' : isSuccess ? '#52c41a' : isSkipped ? '#999' : '#1890ff',
                                                                    }}>
                                                                        {INSTANCE_STATUS_LABELS[statusKey] || statusKey}
                                                                    </Tag>
                                                                    {timeStr && <Typography.Text type="secondary" style={{ fontSize: 11 }}>{timeStr}</Typography.Text>}
                                                                    {durationStr && <Typography.Text type="secondary" style={{ fontSize: 11 }}>耗时 {durationStr}</Typography.Text>}
                                                                </div>
                                                                {(ns?.error_message || ns?.message) && (
                                                                    <div style={{
                                                                        marginTop: 6,
                                                                        color: isFail ? '#ff4d4f' : '#8c8c8c',
                                                                        fontSize: 12,
                                                                        background: isFail ? '#fff1f0' : '#fafafa',
                                                                        padding: '4px 10px',
                                                                        borderRadius: 4,
                                                                        borderLeft: `2px solid ${isFail ? '#ff4d4f' : '#d9d9d9'}`,
                                                                    }}>
                                                                        {ns.error_message || ns.message}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    }))} />
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
                size={600}
                onClose={() => setIncidentDrawerVisible(false)}
                open={incidentDrawerVisible}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
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
                size={600}
                onClose={() => setRuleDrawerVisible(false)}
                open={ruleDrawerVisible}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
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
                                                <Tag style={{ margin: 0, fontSize: 11, background: '#f6ffed', borderColor: '#b7eb8f' }}>{typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? '')}</Tag>
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
                size={600}
                onClose={() => setNodeDetailVisible(false)}
                open={nodeDetailVisible}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            >
                {/* 若隐若现节点头部 */}
                {(() => {
                    const s = selectedNodeData?.state?.status || selectedNodeData?.status;
                    const nodeType = selectedNodeData?.type;
                    const nodeTypeColor = NODE_TYPE_COLORS[nodeType] || '#8c8c8c';
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
                                            : nodeTypeColor;
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
                                                {INSTANCE_STATUS_LABELS[s] || s}
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

                    // 用于「运行输出」的数据：排除已在专属卡片展示的字段和大段文本
                    const contextExcludeKeys = [
                        'stdout', 'stderr', 'error_message', 'message',
                        // run 对象已拆解为执行统计 + 基本信息
                        'run',
                        // 已在基本信息卡展示
                        'status',
                    ];
                    const contextEntries = ns
                        ? Object.entries(ns).filter(([k]) => !contextExcludeKeys.includes(k))
                        : [];

                    // Descriptions 统一样式
                    const descLabelStyle = { background: '#fafafa', fontWeight: 500, fontSize: 12, width: 80 };
                    const descContentStyle = { fontSize: 12 };

                    return (
                        <Tabs defaultActiveKey="overview" tabBarStyle={{ padding: '0 16px' }} items={[
                            {
                                key: 'overview',
                                label: '执行详情',
                                children: (
                                    <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        {/* ═══════ Card 1: 基本信息 ═══════ */}
                                        <Card size="small" bordered={false} style={{ marginBottom: 16, background: '#fafafa' }}
                                            bodyStyle={{ padding: '16px 20px' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f' }}>
                                                    {selectedNodeData.name || selectedNodeData.id}
                                                </span>
                                                <Badge
                                                    status={
                                                        effectiveStatus === 'failed' || effectiveStatus === 'error' || effectiveStatus === 'rejected' ? 'error' :
                                                            effectiveStatus === 'completed' || effectiveStatus === 'success' || effectiveStatus === 'approved' ? 'success' :
                                                                effectiveStatus === 'running' ? 'processing' :
                                                                    effectiveStatus === 'skipped' ? 'default' : 'warning'
                                                    }
                                                    text={<span style={{ fontWeight: 500 }}>{INSTANCE_STATUS_LABELS[effectiveStatus] || effectiveStatus || '未执行'}</span>}
                                                />
                                            </div>
                                            <Descriptions column={2} size="small"
                                                labelStyle={{ color: '#8c8c8c', fontSize: 12, paddingBottom: 4, width: 80 }}
                                                contentStyle={{ color: '#262626', fontSize: 13, paddingBottom: 4 }}
                                            >
                                                <Descriptions.Item label="节点类型">{NODE_TYPE_LABELS[nodeType] || nodeType}</Descriptions.Item>
                                                {ns?.duration_ms != null && (
                                                    <Descriptions.Item label="执行耗时">
                                                        {ns.duration_ms >= 1000 ? `${(ns.duration_ms / 1000).toFixed(1)}s` : `${ns.duration_ms}ms`}
                                                    </Descriptions.Item>
                                                )}
                                                {ns?.started_at && (
                                                    <Descriptions.Item label="开始时间">{new Date(ns.started_at).toLocaleString('zh-CN')}</Descriptions.Item>
                                                )}
                                                {(ns?.finished_at || ns?.updated_at) && (
                                                    <Descriptions.Item label="结束时间">{new Date(ns.finished_at || ns.updated_at).toLocaleString('zh-CN')}</Descriptions.Item>
                                                )}
                                                {runId && (
                                                    <Descriptions.Item label="执行记录">
                                                        {resolvedNames[`run:${runId}`]
                                                            ? <Tag color={resolvedNames[`run:${runId}`] === 'completed' ? 'success' : resolvedNames[`run:${runId}`] === 'failed' ? 'error' : 'processing'} style={{ margin: 0 }}>{resolvedNames[`run:${runId}`]}</Tag>
                                                            : <Typography.Text copyable style={{ fontSize: 12 }}>{runId}</Typography.Text>
                                                        }
                                                    </Descriptions.Item>
                                                )}
                                                {ns?.task_id && (
                                                    <Descriptions.Item label="任务模板">
                                                        {resolvedNames[ns.task_id] || resolvedNames[`task:${ns.task_id}`]
                                                            ? <Tag color="blue" style={{ margin: 0 }}>{resolvedNames[ns.task_id] || resolvedNames[`task:${ns.task_id}`]}</Tag>
                                                            : <Typography.Text copyable style={{ fontSize: 12 }}>{ns.task_id}</Typography.Text>
                                                        }
                                                    </Descriptions.Item>
                                                )}
                                                {isExecution && ns?.run?.exit_code != null && (
                                                    <Descriptions.Item label="退出码">{ns.run.exit_code}</Descriptions.Item>
                                                )}
                                            </Descriptions>
                                        </Card>

                                        {/* ═══════ Card 2: 错误 / 输出信息 ═══════ */}
                                        {!isApproval && (ns?.error_message || ns?.message) && (
                                            <Card size="small" style={{ marginBottom: 16 }}
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}>
                                                    {effectiveStatus === 'failed' || effectiveStatus === 'error'
                                                        ? <><CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />错误输出</>
                                                        : <><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />节点输出</>}
                                                </span>}
                                                bodyStyle={{ padding: 0 }}
                                            >
                                                <div style={{
                                                    background: '#1e1e1e',
                                                    color: effectiveStatus === 'failed' || effectiveStatus === 'error' ? '#ff6b6b' : '#d4d4d4',
                                                    padding: '14px 18px',
                                                    fontFamily: "'SF Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                                                    fontSize: 12.5,
                                                    lineHeight: 1.7,
                                                    maxHeight: 200,
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-all'
                                                }}>
                                                    {ns.error_message || ns.message}
                                                </div>
                                            </Card>
                                        )}

                                        {/* ═══════ Card 3: 审批详情 ═══════ */}
                                        {isApproval && ns && (
                                            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CheckCircleOutlined style={{ marginRight: 6 }} />审批详情</span>}
                                                style={{ marginBottom: 16 }}
                                            >
                                                <Descriptions column={2} size="small" bordered
                                                    labelStyle={{ background: '#fafafa', color: '#595959', width: 100, fontSize: 12 }}
                                                    contentStyle={{ color: '#262626', fontSize: 13 }}
                                                >
                                                    {ns.title && <Descriptions.Item label="审批标题">{ns.title}</Descriptions.Item>}
                                                    {ns.timeout_at && <Descriptions.Item label="超时期限">{new Date(ns.timeout_at).toLocaleString('zh-CN')}</Descriptions.Item>}
                                                    {ns.description && <Descriptions.Item label="说明备注" span={2}>{ns.description}</Descriptions.Item>}
                                                    {(ns.decision_comment || effectiveStatus === 'rejected') && (
                                                        <Descriptions.Item label="决策意见" span={2}>
                                                            <Tag color={effectiveStatus === 'rejected' ? 'error' : 'success'} style={{ fontSize: 13, padding: '2px 10px' }}>
                                                                {ns.decision_comment || (effectiveStatus === 'rejected' ? '无意见直接拒绝' : '无意见直接通过')}
                                                            </Tag>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                            </Card>
                                        )}

                                        {/* ═══════ Card 4: 执行统计 ═══════ */}
                                        {isExecution && (ns?.run?.stats || ns?.stats) && (() => {
                                            const stats = ns.run?.stats || ns.stats;
                                            const total = (stats.ok || 0) + (stats.changed || 0) + (stats.unreachable || 0) + (stats.failed || 0) + (stats.skipped || 0);
                                            return (
                                                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><DashboardOutlined style={{ marginRight: 6 }} />执行统计</span>}
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    <Row gutter={0}>
                                                        {[
                                                            { label: '总计', value: total, color: '#262626' },
                                                            { label: '成功', value: stats.ok || 0, color: '#52c41a' },
                                                            { label: '失败', value: stats.failed || 0, color: '#ff4d4f' },
                                                            { label: '变更', value: stats.changed || 0, color: '#faad14' },
                                                            { label: '失联', value: stats.unreachable || 0, color: '#ff7a45' },
                                                            { label: '跳过', value: stats.skipped || 0, color: '#8c8c8c' },
                                                        ].map(item => (
                                                            <Col span={4} key={item.label} style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
                                                                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{item.label}</div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </Card>
                                            );
                                        })()}

                                        {/* ═══════ 执行日志摘要 ═══════ */}
                                        {isExecution && stdoutLogs.length > 0 && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><CodeOutlined style={{ marginRight: 6 }} />执行日志 ({stdoutLogs.length} 行)</span>}
                                                style={{ marginBottom: 16 }}
                                                bodyStyle={{ padding: 0 }}
                                            >
                                                <div style={{
                                                    background: '#0d1117',
                                                    padding: '12px 16px',
                                                    maxHeight: 250,
                                                    overflow: 'auto',
                                                    fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
                                                    fontSize: 11.5,
                                                    lineHeight: 1.6,
                                                }}>
                                                    {stdoutLogs.slice(-30).map((log, i) => (
                                                        <div key={i} style={{
                                                            color: log.log_level === 'error' ? '#ff6b6b'
                                                                : log.log_level === 'changed' ? '#faad14'
                                                                    : log.log_level === 'ok' ? '#52c41a'
                                                                        : log.log_level === 'skipping' ? '#8c8c8c'
                                                                            : '#c9d1d9',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-all',
                                                        }}>
                                                            {log.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        )}

                                        {(() => {
                                            const hostsStr = ns?.target_hosts || '';
                                            const hostsArr = ns?.hosts || (hostsStr ? hostsStr.split(',').map((h: string) => h.trim()).filter(Boolean) : []);
                                            return hostsArr.length > 0 ? (
                                                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><AimOutlined style={{ marginRight: 6 }} />目标主机 ({hostsArr.length})</span>}
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    <Space size={[6, 6]} wrap>
                                                        {hostsArr.map((h: string) => <Tag key={h} style={{ margin: 0 }}>{h}</Tag>)}
                                                    </Space>
                                                </Card>
                                            ) : null;
                                        })()}

                                        {/* ═══════ 节点结果卡（按节点类型）═══════ */}

                                        {/* 主机提取结果 */}
                                        {nodeType === 'host_extractor' && ns?.extracted_hosts && (() => {
                                            const extracted = Array.isArray(ns.extracted_hosts)
                                                ? ns.extracted_hosts
                                                : typeof ns.extracted_hosts === 'string'
                                                    ? ns.extracted_hosts.split(',').map((h: string) => h.trim()).filter(Boolean)
                                                    : [];
                                            return extracted.length > 0 ? (
                                                <Card size="small"
                                                    title={<span style={{ fontSize: 13, fontWeight: 600 }}><AimOutlined style={{ color: '#52c41a', marginRight: 6 }} />提取结果 ({extracted.length} 台主机)</span>}
                                                    style={{ marginBottom: 16, borderLeft: '3px solid #52c41a' }}
                                                >
                                                    <Space size={[6, 6]} wrap>
                                                        {extracted.map((h: string, i: number) => (
                                                            <Tag key={i} color="green" style={{ margin: 0 }}>{h}</Tag>
                                                        ))}
                                                    </Space>
                                                    {ns.extract_mode && (
                                                        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                                                            提取方式: {ns.extract_mode} {ns.source_field ? `| 来源: ${ns.source_field}` : ''}
                                                        </div>
                                                    )}
                                                </Card>
                                            ) : null;
                                        })()}

                                        {/* CMDB 验证结果 */}
                                        {nodeType === 'cmdb_validator' && (ns?.validated_hosts || ns?.invalid_hosts) && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><CheckCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />CMDB 验证结果</span>}
                                                style={{ marginBottom: 16, borderLeft: '3px solid #1890ff' }}
                                            >
                                                {ns.validation_summary && (
                                                    <div style={{ marginBottom: 10, fontSize: 13 }}>{ns.validation_summary}</div>
                                                )}
                                                {ns.validated_hosts && (() => {
                                                    const valid = Array.isArray(ns.validated_hosts) ? ns.validated_hosts : [];
                                                    return valid.length > 0 ? (
                                                        <div style={{ marginBottom: 8 }}>
                                                            <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>✓ 验证通过 ({valid.length})</span>
                                                            <div style={{ marginTop: 4 }}>
                                                                <Space size={[4, 4]} wrap>
                                                                    {valid.map((h: string, i: number) => <Tag key={i} color="success" style={{ margin: 0 }}>{h}</Tag>)}
                                                                </Space>
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                })()}
                                                {ns.invalid_hosts && (() => {
                                                    const invalid = Array.isArray(ns.invalid_hosts) ? ns.invalid_hosts : [];
                                                    return invalid.length > 0 ? (
                                                        <div>
                                                            <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>✗ 未通过 ({invalid.length})</span>
                                                            <div style={{ marginTop: 4 }}>
                                                                <Space size={[4, 4]} wrap>
                                                                    {invalid.map((h: string, i: number) => <Tag key={i} color="error" style={{ margin: 0 }}>{h}</Tag>)}
                                                                </Space>
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </Card>
                                        )}

                                        {/* 条件/分支结果 */}
                                        {(nodeType === 'condition' || nodeType === 'compute') && ns?.activated_branch && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ color: '#722ed1', marginRight: 6 }} />分支决策</span>}
                                                style={{ marginBottom: 16, borderLeft: '3px solid #722ed1' }}
                                            >
                                                <Descriptions column={1} size="small" bordered
                                                    labelStyle={{ background: '#fafafa', color: '#595959', width: 100, fontSize: 12 }}
                                                    contentStyle={{ color: '#262626', fontSize: 13 }}
                                                >
                                                    <Descriptions.Item label="激活分支">
                                                        <Tag color="purple" style={{ margin: 0, fontSize: 13 }}>{ns.activated_branch}</Tag>
                                                    </Descriptions.Item>
                                                    {ns.matched_expression && (
                                                        <Descriptions.Item label="匹配表达式">
                                                            <Typography.Text code style={{ fontSize: 12 }}>{ns.matched_expression}</Typography.Text>
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>
                                            </Card>
                                        )}

                                        {/* 设置变量结果 */}
                                        {nodeType === 'set_variable' && ns?.variables_set && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ color: '#13c2c2', marginRight: 6 }} />已设置变量</span>}
                                                style={{ marginBottom: 16, borderLeft: '3px solid #13c2c2' }}
                                            >
                                                {typeof ns.variables_set === 'object' && !Array.isArray(ns.variables_set) ? (
                                                    <Descriptions column={1} size="small" bordered
                                                        labelStyle={{ background: '#fafafa', color: '#595959', width: 120, fontSize: 12 }}
                                                        contentStyle={{ color: '#262626', fontSize: 13 }}
                                                    >
                                                        {Object.entries(ns.variables_set).map(([k, v]) => (
                                                            <Descriptions.Item key={k} label={k}>
                                                                <Typography.Text code style={{ fontSize: 12 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Typography.Text>
                                                            </Descriptions.Item>
                                                        ))}
                                                    </Descriptions>
                                                ) : (
                                                    <JsonPrettyView data={ns.variables_set} />
                                                )}
                                            </Card>
                                        )}

                                        {/* 计算节点结果 */}
                                        {nodeType === 'compute' && ns?.computed_results && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><DashboardOutlined style={{ color: '#fa8c16', marginRight: 6 }} />计算结果</span>}
                                                style={{ marginBottom: 16, borderLeft: '3px solid #fa8c16' }}
                                            >
                                                <JsonPrettyView data={ns.computed_results} />
                                            </Card>
                                        )}

                                        {/* ═══════ 输入配置 ═══════ */}
                                        {!isApproval && configEntries.length > 0 && (
                                            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ marginRight: 6 }} />输入配置</span>}
                                                style={{ marginBottom: 16 }}
                                            >
                                                <Descriptions column={2} size="small" bordered
                                                    labelStyle={{ background: '#fafafa', color: '#595959', width: 120, fontSize: 12 }}
                                                    contentStyle={{ color: '#262626', fontSize: 13 }}
                                                >
                                                    {configEntries.map(([k, v]) => {
                                                        // 值翻译：节点类型用 NODE_TYPE_LABELS；ID 字段用已解析的名称
                                                        const isIdField = ['channel_id', 'template_id', 'notification_channel_id', 'notification_template_id', 'task_id', 'task_template_id'].includes(k);
                                                        const displayValue = k === 'type'
                                                            ? (NODE_TYPE_LABELS[v as string] || v)
                                                            : (isIdField && typeof v === 'string' && resolvedNames[v])
                                                                ? resolvedNames[v]
                                                                : v;
                                                        const isArr = Array.isArray(displayValue);
                                                        const isSimpleArr = isArr && (displayValue as any[]).every((item: any) => typeof item !== 'object');
                                                        const isLongStr = typeof displayValue === 'string' && String(displayValue).length > 40;
                                                        const isObj = typeof displayValue === 'object' && displayValue !== null && !isArr;

                                                        return (
                                                            <Descriptions.Item key={k} label={CONFIG_LABELS[k] || k}
                                                                span={isLongStr || isObj || (isArr && !isSimpleArr) ? 2 : 1}
                                                            >
                                                                {isSimpleArr ? (
                                                                    <Space size={[4, 4]} wrap>
                                                                        {(displayValue as any[]).map((item: any, idx: number) => (
                                                                            <Tag key={idx} style={{ margin: 0 }}>{String(item)}</Tag>
                                                                        ))}
                                                                    </Space>
                                                                ) : isArr ? (
                                                                    <Space size={[4, 4]} wrap>
                                                                        {(displayValue as any[]).map((item: any, idx: number) => (
                                                                            <Tag key={idx} style={{ margin: 0 }}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</Tag>
                                                                        ))}
                                                                    </Space>
                                                                ) : isObj ? (
                                                                    <Typography.Paragraph copyable code style={{ fontSize: 11, margin: 0, maxWidth: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                                        {JSON.stringify(displayValue, null, 2)}
                                                                    </Typography.Paragraph>
                                                                ) : typeof displayValue === 'boolean' ? (
                                                                    <Tag color={displayValue ? 'success' : 'default'} style={{ margin: 0 }}>{String(displayValue)}</Tag>
                                                                ) : (
                                                                    <span>{String(displayValue)}</span>
                                                                )}
                                                            </Descriptions.Item>
                                                        );
                                                    })}
                                                </Descriptions>
                                            </Card>
                                        )}

                                        {/* ═══════ 通知发送记录（内联展示）═══════ */}
                                        {(nodeType === 'notification' || nodeType === 'send_notification') && (() => {
                                            // 从节点运行输出中提取通知结果
                                            const notifStatus = ns?.status;
                                            const notifResponse = ns?.response || ns?.result;
                                            const notifError = ns?.error_message || ns?.error;
                                            const channelId = configData?.channel_id || configData?.notification_channel_id;
                                            const templateId = configData?.template_id || configData?.notification_template_id;
                                            const channelName = channelId ? resolvedNames[channelId] : null;
                                            const templateName = templateId ? resolvedNames[templateId] : null;

                                            return (
                                                <Card size="small"
                                                    title={<span style={{ fontSize: 13, fontWeight: 600 }}><FileTextOutlined style={{ marginRight: 6 }} />通知发送记录</span>}
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    <Descriptions column={2} size="small" bordered
                                                        labelStyle={{ background: '#fafafa', color: '#595959', width: 100, fontSize: 12 }}
                                                        contentStyle={{ color: '#262626', fontSize: 13 }}
                                                    >
                                                        {channelName && (
                                                            <Descriptions.Item label="通知渠道">
                                                                <Tag color="blue" style={{ margin: 0 }}>{channelName}</Tag>
                                                            </Descriptions.Item>
                                                        )}
                                                        {templateName && (
                                                            <Descriptions.Item label="通知模板">
                                                                <Tag color="purple" style={{ margin: 0 }}>{templateName}</Tag>
                                                            </Descriptions.Item>
                                                        )}
                                                        <Descriptions.Item label="发送状态">
                                                            <Tag color={notifStatus === 'completed' || notifStatus === 'success' ? 'success'
                                                                : notifStatus === 'failed' ? 'error'
                                                                    : notifStatus === 'skipped' ? 'default'
                                                                        : 'processing'}
                                                                style={{ margin: 0 }}
                                                            >
                                                                {notifStatus === 'completed' || notifStatus === 'success' ? '✓ 发送成功'
                                                                    : notifStatus === 'failed' ? '✗ 发送失败'
                                                                        : notifStatus === 'skipped' ? '已跳过'
                                                                            : notifStatus === 'running' ? '发送中...'
                                                                                : notifStatus || '未知'}
                                                            </Tag>
                                                        </Descriptions.Item>
                                                        {ns?.sent_at && (
                                                            <Descriptions.Item label="发送时间">
                                                                {new Date(ns.sent_at).toLocaleString('zh-CN')}
                                                            </Descriptions.Item>
                                                        )}
                                                        {ns?.duration_ms != null && (
                                                            <Descriptions.Item label="耗时">
                                                                {ns.duration_ms}ms
                                                            </Descriptions.Item>
                                                        )}
                                                    </Descriptions>

                                                    {/* 响应详情 */}
                                                    {notifResponse && typeof notifResponse === 'object' && (
                                                        <div style={{ marginTop: 10 }}>
                                                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>响应详情</div>
                                                            <Typography.Paragraph code copyable
                                                                style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}
                                                            >
                                                                {JSON.stringify(notifResponse, null, 2)}
                                                            </Typography.Paragraph>
                                                        </div>
                                                    )}

                                                    {/* 错误信息 */}
                                                    {notifError && (
                                                        <Alert type="error" showIcon message={notifError}
                                                            style={{ marginTop: 10, fontSize: 12 }}
                                                        />
                                                    )}
                                                </Card>
                                            );
                                        })()}

                                        {/* ═══════ 运行输出 ═══════ */}
                                        {!isApproval && contextEntries.length > 0 && (
                                            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ marginRight: 6 }} />运行输出</span>}
                                                style={{ marginBottom: 16 }}
                                            >
                                                <Descriptions column={1} size="small" bordered
                                                    labelStyle={{ background: '#fafafa', color: '#595959', width: 130, fontSize: 12 }}
                                                    contentStyle={{ color: '#262626', fontSize: 13 }}
                                                >
                                                    {contextEntries.map(([k, v]) => {
                                                        const ctxLabel = CONTEXT_LABELS[k] || k;
                                                        // 时间字段格式化
                                                        const isTimeField = k.endsWith('_at') || k.endsWith('_time');
                                                        if (isTimeField && typeof v === 'string') {
                                                            return (
                                                                <Descriptions.Item key={k} label={ctxLabel}>
                                                                    {new Date(v).toLocaleString('zh-CN')}
                                                                </Descriptions.Item>
                                                            );
                                                        }
                                                        // ID 字段：尝试用解析名称
                                                        const isIdField = k.endsWith('_id') && typeof v === 'string';
                                                        if (isIdField && resolvedNames[v]) {
                                                            return (
                                                                <Descriptions.Item key={k} label={ctxLabel}>
                                                                    <Tag color="blue" style={{ margin: 0 }}>{resolvedNames[v]}</Tag>
                                                                </Descriptions.Item>
                                                            );
                                                        }
                                                        return (
                                                            <Descriptions.Item key={k} label={ctxLabel}>
                                                                {typeof v === 'string' ? (
                                                                    v.length > 120
                                                                        ? <Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ margin: 0, fontSize: 13 }}>{v}</Typography.Paragraph>
                                                                        : v
                                                                ) :
                                                                    typeof v === 'number' || typeof v === 'boolean' ? (
                                                                        typeof v === 'boolean'
                                                                            ? <Tag color={v ? 'success' : 'default'} style={{ margin: 0 }}>{String(v)}</Tag>
                                                                            : String(v)
                                                                    ) :
                                                                        Array.isArray(v) && v.every((item: any) => typeof item !== 'object') ? (
                                                                            <Space size={[4, 4]} wrap>
                                                                                {v.map((item: any, idx: number) => <Tag key={idx} style={{ margin: 0 }}>{String(item)}</Tag>)}
                                                                            </Space>
                                                                        ) : (
                                                                            <JsonPrettyView data={v} />
                                                                        )}
                                                            </Descriptions.Item>
                                                        );
                                                    })}
                                                </Descriptions>
                                            </Card>
                                        )}
                                    </div>
                                )
                            },
                            // 执行日志 tab
                            ...((runId || stdoutLogs.length > 0) ? [{
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
                            // 开发者排错
                            {
                                key: 'developer',
                                label: <span><CodeOutlined /> 开发者排错</span>,
                                children: (
                                    <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
                                        {/* 配置参数 */}
                                        <Card size="small"
                                            title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ marginRight: 6 }} />配置参数</span>}
                                            style={{ marginBottom: 16 }}
                                        >
                                            {Object.keys(filteredConfig).length === 0
                                                ? <Empty description="暂无配置参数" style={{ padding: '20px 0' }} />
                                                : <JsonPrettyView data={filteredConfig} />}
                                        </Card>

                                        {/* 运行时上下文 */}
                                        <Card size="small"
                                            title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ marginRight: 6 }} />运行时上下文</span>}
                                            style={{ marginBottom: 16 }}
                                        >
                                            {contextEntries.length === 0
                                                ? <Empty description="暂无上下文数据" style={{ padding: '20px 0' }} />
                                                : <JsonPrettyView data={Object.fromEntries(contextEntries)} />}
                                        </Card>

                                        {/* 原始状态快照 */}
                                        {ns && (
                                            <Card size="small"
                                                title={<span style={{ fontSize: 13, fontWeight: 600 }}><CodeOutlined style={{ marginRight: 6 }} />原始状态快照</span>}
                                                style={{ marginBottom: 16 }}
                                            >
                                                <JsonPrettyView data={ns} />
                                            </Card>
                                        )}
                                    </div>
                                )
                            }
                        ]} />
                    );
                })()}
            </Drawer>
        </div>
    );
};

export default HealingInstanceDetail;
