import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Drawer, Alert, Space, Divider, Typography, Button, Input, Tabs, Empty, List, Badge, Tree, Collapse } from 'antd';
import { ProForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea, ProFormDependency } from '@ant-design/pro-components';
import { SelectOutlined, SettingOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, StopOutlined, CodeOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Node, Edge } from 'reactflow';
import { getExecutionTasks as getTaskTemplates } from '@/services/auto-healing/execution';
import { getTemplates as getNotificationTemplates } from '@/services/auto-healing/notification';
import { getChannels } from '@/services/auto-healing/notification';
import { getUsers } from '@/services/auto-healing/users';
import { getRoles } from '@/services/auto-healing/roles';
import TaskTemplateSelector from './TaskTemplateSelector';
import ExtraVarsEditor from './ExtraVarsEditor';
import ComputeOperationsEditor from './ComputeOperationsEditor';
import NotificationChannelTemplateSelector from './NotificationChannelTemplateSelector';
import { STATUS_CONFIG } from './CustomNode';

const { Text } = Typography;

interface NodeDetailPanelProps {
    node: Node | null;
    allNodes: Node[];  // 所有节点
    allEdges: Edge[];  // 所有边（用于计算拓扑顺序）
    open: boolean;
    onClose: () => void;
    onChange: (nodeId: string, values: any) => void;
    onNodeSelect: (nodeId: string) => void;
    onRetry?: () => void;
}

// 节点类型配置（用于图标和颜色）
const nodeTypeConfig: Record<string, { color: string; label: string }> = {
    start: { color: '#52c41a', label: '开始' },
    end: { color: '#ff4d4f', label: '结束' },
    host_extractor: { color: '#1890ff', label: '主机提取' },
    cmdb_validator: { color: '#13c2c2', label: 'CMDB验证' },
    execution: { color: '#fa8c16', label: '任务执行' },
    approval: { color: '#faad14', label: '人工审批' },
    notification: { color: '#52c41a', label: '发送通知' },
    condition: { color: '#722ed1', label: '条件分支' },
    set_variable: { color: '#eb2f96', label: '设置变量' },
};

// 获取节点状态图标
const getStatusIcon = (status?: string) => {
    if (!status) return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    const config = STATUS_CONFIG[status];
    if (!config) return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    return <span style={{ color: config.color }}>{config.icon}</span>;
};

const VariableHint: React.FC<{ inputs?: string[]; outputs?: string[] }> = ({ inputs, outputs }) => {
    if ((!inputs || inputs.length === 0) && (!outputs || outputs.length === 0)) return null;
    return (
        <div style={{ marginTop: -8, marginBottom: 16, padding: '8px 12px', background: '#fafafa', borderRadius: 4, border: '1px dashed #d9d9d9', fontSize: 12 }}>
            {inputs && inputs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: outputs?.length ? 4 : 0 }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4 }}>输入依赖:</span>
                    <Space size={4} wrap>
                        {inputs.map(i => <code key={i} style={{ color: '#13c2c2', background: '#e6fffb', border: '1px solid #87e8de', borderRadius: 2, padding: '0 4px' }}>{i}</code>)}
                    </Space>
                </div>
            )}
            {outputs && outputs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4 }}>产生变量:</span>
                    <Space size={4} wrap>
                        {outputs.map(o => <code key={o} style={{ color: '#389e0d', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 2, padding: '0 4px' }}>{o}</code>)}
                    </Space>
                </div>
            )}
        </div>
    );
};

// 日志面板组件 - 专业日志样式
const LogsPanel: React.FC<{ node: Node | null; onRetry?: () => void }> = ({ node, onRetry }) => {
    const data = node?.data;
    const hasStatus = data?.status;
    const isError = data?.status === 'error' || data?.status === 'failed';
    const isSkipped = data?.status === 'skipped';
    const isSuccess = ['ok', 'success', 'simulated', 'would_execute', 'would_send', 'partial'].includes(data?.status);
    const isRunning = data?.status === 'running';

    if (!hasStatus) {
        return (
            <div style={{
                padding: 40,
                textAlign: 'center',
                color: '#8c8c8c',
                background: '#1e1e1e',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                运行 Dry-Run 后查看日志
            </div>
        );
    }

    const getStatusConfig = () => {
        if (isSkipped) return { color: '#8c8c8c', bg: '#3a3a3a', text: 'SKIPPED', icon: <StopOutlined /> };
        if (isError) return { color: '#ff4d4f', bg: '#2a1215', text: 'FAILED', icon: <CloseCircleOutlined /> };
        if (isSuccess) return { color: '#52c41a', bg: '#162312', text: 'SUCCESS', icon: <CheckCircleOutlined /> };
        return { color: '#1890ff', bg: '#111d2c', text: 'RUNNING', icon: <LoadingOutlined spin /> };
    };

    const statusConfig = getStatusConfig();
    const inputData = data?.dryRunInput || data?.input;
    const processData = data?.dryRunProcess || data?.process;
    const outputData = data?.dryRunOutput || data?.output;

    // 专业的 JSON 渲染
    const renderJson = (obj: any, label: string) => {
        if (!obj || Object.keys(obj).length === 0) return null;
        const jsonStr = JSON.stringify(obj, null, 2);
        return (
            <div>
                <div style={{
                    padding: '6px 12px',
                    background: '#2d2d2d',
                    borderBottom: '1px solid #404040',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{label}</Text>
                </div>
                <pre style={{
                    margin: 0,
                    padding: 12,
                    background: '#1e1e1e',
                    color: '#d4d4d4',
                    fontSize: 12,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {jsonStr}
                </pre>
            </div>
        );
    };

    // 专业的执行步骤渲染
    const renderProcess = (steps: string[]) => {
        if (!steps || steps.length === 0) return null;
        return (
            <div>
                <div style={{
                    padding: '6px 12px',
                    background: '#2d2d2d',
                    borderBottom: '1px solid #404040',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <CodeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                    <Text style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>EXECUTION LOG</Text>
                    <Text style={{ color: '#666', fontSize: 11, marginLeft: 'auto' }}>{steps.length} steps</Text>
                </div>
                <div style={{ background: '#1e1e1e', padding: '8px 0' }}>
                    {steps.map((step, idx) => {
                        const isOk = step.includes('成功') || step.includes('通过') || step.includes('完成');
                        const isFail = step.includes('失败') || step.includes('错误');
                        const lineColor = isFail ? '#ff4d4f' : (isOk ? '#52c41a' : '#d4d4d4');
                        return (
                            <div key={idx} style={{
                                padding: '4px 12px',
                                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                fontSize: 12,
                                lineHeight: 1.6,
                                display: 'flex',
                                alignItems: 'flex-start',
                                background: isFail ? 'rgba(255,77,79,0.1)' : 'transparent'
                            }}>
                                <span style={{
                                    color: '#666',
                                    marginRight: 12,
                                    minWidth: 28,
                                    textAlign: 'right',
                                    userSelect: 'none'
                                }}>
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span style={{ color: lineColor }}>{step}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            {/* 状态栏 */}
            <div style={{
                padding: '12px 16px',
                background: statusConfig.bg,
                borderBottom: '1px solid #404040',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: statusConfig.color, fontSize: 16 }}>{statusConfig.icon}</span>
                    <div>
                        <Text strong style={{ color: statusConfig.color, fontSize: 13 }}>{statusConfig.text}</Text>
                        {data?.dryRunMessage && (
                            <Text style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 12 }}>{data.dryRunMessage}</Text>
                        )}
                    </div>
                </div>
                {isError && onRetry && (
                    <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={onRetry}>
                        重试
                    </Button>
                )}
            </div>

            {/* 日志内容 */}
            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
                {/* 执行过程 */}
                {renderProcess(processData)}

                {/* 输出 */}
                {renderJson(outputData, 'Output')}

                {/* 输入 */}
                {renderJson(inputData, 'Input')}

                {/* 无数据 */}
                {!processData?.length && !inputData && !outputData && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                        该节点暂无详细日志
                    </div>
                )}
            </div>
        </div>
    );
};

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
    node,
    allNodes,
    allEdges,
    open,
    onClose,
    onChange,
    onNodeSelect,
    onRetry
}) => {
    const formRef = useRef<any>();
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [selectedTaskName, setSelectedTaskName] = useState<string>('');
    const [currentTaskTemplateId, setCurrentTaskTemplateId] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<string>('settings');
    const prevNodeIdRef = useRef<string | null>(null);

    // 构建节点树结构
    // 规则：线性路径不缩进，分叉点开始缩进，分叉后的继续嵌套
    interface NodeTreeItem {
        node: Node;
        children: NodeTreeItem[];
        branchLabel?: string;  // 分支标签
        depth: number;
        isForkChild: boolean;  // 是否是分叉的子节点
    }

    const nodeTree = useMemo((): NodeTreeItem[] => {
        // 构建邻接表，包含边信息
        const adjacencyMap = new Map<string, { targetId: string; handle?: string }[]>();
        allEdges.forEach(edge => {
            const sources = adjacencyMap.get(edge.source) || [];
            sources.push({ targetId: edge.target, handle: edge.sourceHandle || undefined });
            adjacencyMap.set(edge.source, sources);
        });

        // 从 start 节点开始构建树
        const startNode = allNodes.find(n => n.data?.type === 'start');
        if (!startNode) {
            return allNodes.map(n => ({ node: n, children: [], depth: 0, isForkChild: false }));
        }

        const visited = new Set<string>();

        // inForkBranch: 是否在分叉的分支中（一旦进入分叉，后续都保持缩进）
        const buildTree = (nodeId: string, currentDepth: number, branchLabel?: string, inForkBranch: boolean = false): NodeTreeItem | null => {
            if (visited.has(nodeId)) return null;
            visited.add(nodeId);

            const nodeData = allNodes.find(n => n.id === nodeId);
            if (!nodeData) return null;

            const children: NodeTreeItem[] = [];

            // 针对同一目标节点的去重逻辑：优先保留语义明确的 Handle
            // 必须在判断 isFork 之前进行去重，否则 phantom edge 会导致错误的 isFork 判断
            const uniqueTargets = new Map<string, string | undefined>();
            const rawTargets = adjacencyMap.get(nodeId) || [];

            rawTargets.forEach(({ targetId, handle }) => {
                const existingHandle = uniqueTargets.get(targetId);
                const isWeak = (h: string | undefined) => !h || ['right', 'left', 'top', 'bottom', 'default', 'source', 'target', 'true', 'false'].includes(h);

                // 如果还没有这个目标的记录，或者当前记录是弱语义而新的是强语义，则覆盖
                if (!uniqueTargets.has(targetId) || (isWeak(existingHandle) && !isWeak(handle))) {
                    uniqueTargets.set(targetId, handle);
                }
            });

            const processedTargets = Array.from(uniqueTargets.entries()).map(([targetId, handle]) => ({ targetId, handle }));

            // 只有去重后目标数 > 1 才是真正的分叉
            const isFork = processedTargets.length > 1;

            processedTargets.forEach(({ targetId, handle }) => {
                // 确定分支标签 - 只有分叉时才显示
                // 确定分支标签 - 只要有特定语义句柄就显示，不限制于分叉
                let label: string | undefined;
                if (nodeData.data?.type === 'condition') {
                    label = handle === 'true' ? '✓ 是' : handle === 'false' ? '✗ 否' : undefined;
                } else if (nodeData.data?.type === 'execution') {
                    const text = handle || '';
                    const map: Record<string, string> = {
                        'success': '✓ 成功',
                        'failed': '✗ 失败',
                        'partial': '⚠ 部分',
                        'true': '✓ 成功',
                        'false': '✗ 失败',
                        // 将技术性方位词映射为中性语义
                        'right': '➔ 继续',
                        'left': '➔ 继续',
                        'top': '➔ 继续',
                        'bottom': '➔ 继续',
                        'default': '➔ 继续',
                        'source': '➔ 继续',
                        'target': '➔ 继续'
                    };

                    label = map[text] || text;
                } else if (nodeData.data?.type === 'approval') {
                    label = handle === 'approved' ? '✓ 通过' : handle === 'rejected' ? '✗ 拒绝' : undefined;
                }

                // 深度计算：只有分叉节点的子节点才需要缩进
                // 线性连接（单出口）的节点保持同级
                const childDepth = isFork ? currentDepth + 1 : currentDepth;
                const childTree = buildTree(targetId, childDepth, isFork ? label : undefined, isFork || inForkBranch); // 保持 inForkBranch 传递
                if (childTree) children.push(childTree);
            });

            return {
                node: nodeData,
                children,
                branchLabel,
                depth: currentDepth,
                isForkChild: inForkBranch
            };
        };

        const rootTree = buildTree(startNode.id, 0, undefined, false);
        const result: NodeTreeItem[] = rootTree ? [rootTree] : [];

        // 添加未访问的节点（断开的节点）
        allNodes.forEach(n => {
            if (!visited.has(n.id)) {
                result.push({ node: n, children: [], depth: 0, isForkChild: false });
            }
        });

        return result;
    }, [allNodes, allEdges]);

    useEffect(() => {
        if (node && open) {
            // 只有当节点ID真正变化时才重置表单，避免在编辑过程中因父组件更新导致的重置（这会引起焦点丢失）
            if (prevNodeIdRef.current !== node.id) {
                prevNodeIdRef.current = node.id;
                formRef.current?.resetFields();
                formRef.current?.setFieldsValue(node.data);

                // 初始化已选任务名称和任务模板ID
                if (node.data?.task_template_name) {
                    setSelectedTaskName(node.data.task_template_name);
                } else {
                    setSelectedTaskName('');
                }
                if (node.data?.task_template_id) {
                    setCurrentTaskTemplateId(node.data.task_template_id);
                } else {
                    setCurrentTaskTemplateId(undefined);
                }
            }
        } else if (!open) {
            prevNodeIdRef.current = null;
        }
    }, [node, open]);

    const handleValuesChange = (_: any, allValues: any) => {
        if (node) {
            onChange(node.id, allValues);
        }
    };

    const renderSettingsContent = () => {
        if (!node) return null;

        const nodeType = node.data?.type || node.type;

        switch (nodeType) {
            case 'start':
                return (
                    <>
                        <VariableHint outputs={['incident', 'incident.raw_data', 'incident.title']} />
                        <Alert message="流程开始节点，无需配置" type="info" showIcon />
                    </>
                );
            case 'end':
                return <Alert message="流程结束节点" type="info" showIcon />;
            case 'host_extractor':
                return (
                    <>
                        <ProFormDependency name={['source_field', 'output_key']}>
                            {({ source_field, output_key }) => (
                                <VariableHint
                                    inputs={[source_field || 'raw_data.cmdb_ci']}
                                    outputs={[output_key || 'hosts']}
                                />
                            )}
                        </ProFormDependency>
                        <ProFormText
                            name="source_field"
                            label="源字段路径"
                            placeholder="例如: raw_data.cmdb_ci"
                            rules={[{ required: true }]}
                            tooltip="从告警数据或上一节点输出中提取的主机信息的字段路径"
                        />
                        <ProFormSelect
                            name="extract_mode"
                            label="提取模式"
                            valueEnum={{ split: '分隔符拆分', regex: '正则表达式' }}
                            rules={[{ required: true }]}
                            initialValue="split"
                        />
                        <ProFormDependency name={['extract_mode']}>
                            {({ extract_mode }) => {
                                if (extract_mode === 'regex') {
                                    return (
                                        <ProFormText
                                            name="regex_pattern"
                                            label="正则表达式"
                                            placeholder="例如: (\\d+\\.\\d+\\.\\d+\\.\\d+)"
                                            rules={[{ required: true, message: '请输入正则表达式' }]}
                                        />
                                    );
                                }
                                return (
                                    <ProFormText
                                        name="split_by"
                                        label="分隔符"
                                        placeholder=","
                                        initialValue=","
                                        rules={[{ required: true, message: '请输入分隔符' }]}
                                    />
                                );
                            }}
                        </ProFormDependency>
                        <ProFormText
                            name="output_key"
                            label="输出变量名"
                            rules={[{ required: true }]}
                            initialValue="hosts"
                        />
                    </>
                );
            case 'cmdb_validator':
                return (
                    <>
                        <ProFormDependency name={['input_key', 'output_key']}>
                            {({ input_key, output_key }) => (
                                <VariableHint
                                    inputs={[input_key || 'hosts']}
                                    outputs={[output_key || 'validated_hosts']}
                                />
                            )}
                        </ProFormDependency>
                        <ProFormText name="input_key" label="输入变量名" initialValue="hosts" rules={[{ required: true }]} />
                        <ProFormText name="output_key" label="输出变量名" initialValue="validated_hosts" rules={[{ required: true }]} />
                    </>
                );
            case 'approval':
                return (
                    <>
                        <VariableHint inputs={['incident']} outputs={['approval_result (通过/拒绝)']} />
                        <ProFormText name="title" label="审批标题" rules={[{ required: true }]} />
                        <ProFormText name="description" label="审批描述" />
                        <ProFormSelect
                            name="approvers"
                            label="审批人 (用户)"
                            mode="multiple"
                            request={async () => {
                                const res = await getUsers({ page_size: 100 });
                                return (res.data || []).map(u => ({ label: u.display_name, value: u.username }));
                            }}
                        />
                        <ProFormSelect
                            name="approver_roles"
                            label="审批人 (角色)"
                            mode="multiple"
                            request={async () => {
                                const res = await getRoles({ page_size: 100 });
                                return (res.data || []).map(r => ({ label: r.display_name, value: r.name }));
                            }}
                        />
                        <ProFormDigit name="timeout_hours" label="超时时间 (小时)" min={1} initialValue={24} />
                    </>
                );
            case 'execution':
                return (
                    <>
                        <ProFormDependency name={['hosts_key']}>
                            {({ hosts_key }) => (
                                <VariableHint
                                    inputs={[hosts_key || 'validated_hosts', 'task_template']}
                                    outputs={['execution.result', 'execution.status']}
                                />
                            )}
                        </ProFormDependency>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                <Typography.Text>作业模板 <span style={{ color: '#ff4d4f' }}>*</span></Typography.Text>
                            </div>
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    readOnly
                                    value={selectedTaskName || formRef.current?.getFieldValue('task_template_name') || ''}
                                    placeholder="请选择作业模板"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    icon={<SelectOutlined />}
                                    onClick={() => setTaskSelectorOpen(true)}
                                >
                                    选择
                                </Button>
                            </Space.Compact>
                            <ProFormText name="task_template_id" hidden rules={[{ required: true, message: '请选择作业模板' }]} />
                            <ProFormText name="task_template_name" hidden />
                        </div>
                        <TaskTemplateSelector
                            open={taskSelectorOpen}
                            value={currentTaskTemplateId}
                            onSelect={(id, template) => {
                                formRef.current?.setFieldsValue({
                                    task_template_id: id,
                                    task_template_name: template.name
                                });
                                setSelectedTaskName(template.name);
                                setCurrentTaskTemplateId(id);  // 立即更新本地state
                                setTaskSelectorOpen(false);
                                if (node) {
                                    onChange(node.id, {
                                        ...formRef.current?.getFieldsValue(),
                                        task_template_id: id,
                                        task_template_name: template.name,
                                        extra_vars: template.extra_vars || {}  // 使用新模板的默认变量
                                    });
                                }
                            }}
                            onCancel={() => setTaskSelectorOpen(false)}
                        />
                        <ProFormText name="hosts_key" label="目标主机变量" initialValue="validated_hosts" rules={[{ required: true }]} />
                        <ProFormSelect
                            name="executor_type"
                            label="执行方式"
                            valueEnum={{ local: '本地执行', docker: 'Docker容器' }}
                            initialValue="local"
                        />
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                <Typography.Text>变量配置</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    支持静态值或表达式
                                </Typography.Text>
                            </div>
                            <ExtraVarsEditor
                                taskTemplateId={currentTaskTemplateId}
                                value={node?.data?.extra_vars || {}}
                                variableMappings={node?.data?.variable_mappings || {}}
                                onChange={(vars) => {
                                    formRef.current?.setFieldValue('extra_vars', vars);
                                    if (node) {
                                        onChange(node.id, {
                                            ...node.data,
                                            extra_vars: vars
                                        });
                                    }
                                }}
                                onMappingsChange={(mappings) => {
                                    formRef.current?.setFieldValue('variable_mappings', mappings);
                                    if (node) {
                                        onChange(node.id, {
                                            ...node.data,
                                            variable_mappings: mappings
                                        });
                                    }
                                }}
                                onBatchChange={(vars, mappings) => {
                                    formRef.current?.setFieldsValue({
                                        'extra_vars': vars,
                                        'variable_mappings': mappings
                                    });
                                    if (node) {
                                        onChange(node.id, {
                                            ...node.data,
                                            extra_vars: vars,
                                            variable_mappings: mappings
                                        });
                                    }
                                }}
                            />
                        </div>
                    </>
                );
            case 'notification':
                return (
                    <>
                        <VariableHint inputs={['incident', 'execution.result']} />
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                <Typography.Text>通知配置 <span style={{ color: '#ff4d4f' }}>*</span></Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    先选渠道，再选该渠道支持的模板
                                </Typography.Text>
                            </div>
                            <NotificationChannelTemplateSelector
                                value={node?.data?.notification_configs || []}
                                onChange={(configs) => {
                                    if (node) {
                                        onChange(node.id, {
                                            ...node.data,
                                            notification_configs: configs,
                                            // 兼容旧字段
                                            channel_ids: configs.map(c => c.channel_id),
                                            template_id: configs.length > 0 ? configs[0].template_id : undefined
                                        });
                                    }
                                }}
                            />
                        </div>
                    </>
                );
            case 'condition':
                return (
                    <>
                        <VariableHint inputs={['Any Variable (e.g. result.status == "success")']} />
                        <Alert message="条件分支节点需要连接 True 和 False 两个出口。" type="warning" style={{ marginBottom: 16 }} />
                        <ProFormText
                            name="condition"
                            label="条件表达式"
                            placeholder="例如: result.stats.failed == 0"
                            rules={[{ required: true }]}
                        />
                    </>
                );
            case 'set_variable':
                return (
                    <>
                        <ProFormDependency name={['key']}>
                            {({ key }) => (
                                <VariableHint outputs={[key || 'new_variable']} />
                            )}
                        </ProFormDependency>
                        <ProFormText name="key" label="变量名" rules={[{ required: true }]} />
                        <ProFormText name="value" label="变量值" rules={[{ required: true }]} />
                    </>
                )
            case 'compute':
                return (
                    <>
                        <Alert
                            message="计算节点用于执行表达式计算，将结果存入上下文供后续节点使用"
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <div style={{ marginBottom: 16 }}>
                            <Typography.Text strong>计算操作</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                添加多个表达式计算
                            </Typography.Text>
                        </div>
                        <ComputeOperationsEditor
                            value={node?.data?.operations || []}
                            onChange={(ops) => {
                                // 直接通知父组件更新，不通过 ProForm
                                if (node) {
                                    onChange(node.id, {
                                        ...node.data,
                                        operations: ops
                                    });
                                }
                            }}
                        />
                    </>
                );
            default:
                return <Alert message={`未知的节点类型: ${nodeType}`} type="error" />;
        }
    };

    const nodeTypeLabel = node?.data?.type ? (nodeTypeConfig[node.data.type]?.label || node.data.type) : '';
    const nodeTypeColor = node?.data?.type ? (nodeTypeConfig[node.data.type]?.color || '#8c8c8c') : '#8c8c8c';

    return (
        <Drawer
            title={
                <Space>
                    {nodeTypeConfig[node?.data?.type]?.label || '节点详情'}
                    {getStatusIcon(node?.data?.status)}
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={open}
            width={activeTab === 'logs' ? 720 : 640}
            mask={false}
            bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* 左侧节点树列表 */}
                <div style={{ width: 200, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>节点列表</Text>
                    </div>
                    <div style={{ overflow: 'auto', flex: 1, padding: '16px 0' }}>
                        {(() => {
                            // 扁平化树结构，计算每行的缩进线
                            const rows: any[] = [];
                            const flatten = (items: typeof nodeTree, parentLines: boolean[] = [], parentDepth: number = 0) => {
                                items.forEach((item, index) => {
                                    const isLast = index === items.length - 1;
                                    const { node, depth, branchLabel } = item;

                                    // 只有当深度大于父级深度时，才是分叉出来的子节点（需要画拐弯线）
                                    const isForkChild = depth > parentDepth;
                                    const hasLinearChild = item.children.length > 0 && item.children[0].depth === depth;

                                    rows.push({
                                        node,
                                        depth,
                                        branchLabel,
                                        isLast,
                                        parentLines,
                                        isForkChild,
                                        hasLinearChild
                                    });

                                    if (item.children.length > 0) {
                                        // 如果子节点深度增加了，说明发生了缩进，当前层级状态(!isLast)需要记录
                                        // 如果没增加(线性)，则继承当前状态
                                        const isIndent = item.children[0].depth > depth;
                                        const nextLines = isIndent ? [...parentLines, !isLast] : parentLines;
                                        flatten(item.children, nextLines, depth);
                                    }
                                });
                            };
                            flatten(nodeTree);

                            return (
                                <div style={{ padding: '4px 0' }}>
                                    {rows.map((item) => {
                                        const INDENT_UNIT = 16;
                                        const isSelected = node?.id === item.node.id;

                                        // 分支标签颜色
                                        const labelColor = !item.branchLabel ? '#8c8c8c' :
                                            (item.branchLabel.includes('✓') || item.branchLabel.includes('成功') || item.branchLabel.includes('通过')) ? '#52c41a' :
                                                (item.branchLabel.includes('✗') || item.branchLabel.includes('失败') || item.branchLabel.includes('拒绝')) ? '#ff4d4f' :
                                                    (item.branchLabel.includes('⚠') || item.branchLabel.includes('部分')) ? '#faad14' : '#1890ff';

                                        return (
                                            <div
                                                key={item.node.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '5px 8px',
                                                    paddingLeft: item.depth * INDENT_UNIT + 8,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#e6f7ff' : 'transparent',
                                                    borderRadius: 4,
                                                    marginBottom: 2
                                                }}
                                                onClick={() => onNodeSelect(item.node.id)}
                                            >
                                                {/* 节点状态图标 */}
                                                {getStatusIcon(item.node.data?.status)}
                                                {/* 节点名称 */}
                                                <Text style={{
                                                    marginLeft: 6,
                                                    fontSize: 14,
                                                    fontWeight: isSelected ? 500 : 400,
                                                    color: isSelected ? (nodeTypeConfig[item.node.data?.type]?.color || '#333') : '#333',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.node.data?.label || (nodeTypeConfig[item.node.data?.type]?.label || '节点')}
                                                </Text>
                                                {/* 分支标签放在后面 */}
                                                {item.branchLabel && (
                                                    <span style={{
                                                        fontSize: 11,
                                                        marginLeft: 6,
                                                        color: labelColor
                                                    }}>
                                                        ({item.branchLabel})
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 右侧内容区 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        tabBarStyle={{ padding: '0 16px', margin: 0, flexShrink: 0 }}
                        items={[
                            {
                                key: 'settings',
                                label: <span><SettingOutlined /> 设置</span>,
                                children: (
                                    <div style={{ padding: 16, overflowY: 'auto', overflowX: 'hidden', height: 'calc(100vh - 160px)' }}>
                                        {node && (
                                            <ProForm
                                                formRef={formRef}
                                                submitter={false}
                                                onValuesChange={handleValuesChange}
                                                layout="vertical"
                                            >
                                                <ProFormText name="label" label="节点名称" />
                                                <Divider orientation="left" style={{ margin: '12px 0' }}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>参数配置</Text>
                                                </Divider>
                                                {renderSettingsContent()}
                                            </ProForm>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'logs',
                                label: <span><FileTextOutlined /> 日志</span>,
                                children: (
                                    <div style={{ height: 'calc(100vh - 105px)', overflow: 'auto', background: '#1e1e1e' }}>
                                        <LogsPanel node={node} onRetry={onRetry} />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        </Drawer>
    );
};

export default NodeDetailPanel;
