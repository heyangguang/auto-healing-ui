import React, { useEffect, useRef, useState } from 'react';
import { Drawer, Alert, Space, Divider, Typography, Button, Input } from 'antd';
import { ProForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea, ProFormDependency } from '@ant-design/pro-components';
import { SelectOutlined } from '@ant-design/icons';
import { Node } from 'reactflow';
import { getExecutionTasks as getTaskTemplates } from '@/services/auto-healing/execution';
import { getTemplates as getNotificationTemplates } from '@/services/auto-healing/notification';
import { getChannels } from '@/services/auto-healing/notification';
import { getUsers } from '@/services/auto-healing/users';
import { getRoles } from '@/services/auto-healing/roles';
import { fetchAllPages } from '@/utils/fetchAllPages';
import TaskTemplateSelector from './TaskTemplateSelector';
import ExtraVarsEditor from './ExtraVarsEditor';
import ComputeOperationsEditor from './ComputeOperationsEditor';
import ExpressionHelpButton from './ExpressionHelpButton';

interface NodeConfigPanelProps {
    node: Node | null;
    open: boolean;
    onClose: () => void;
    onChange: (nodeId: string, values: any) => void;
}

// Store channel info for template filtering
interface ChannelInfo {
    id: string;
    name: string;
    type: string;
}

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

const RunResultView: React.FC<{ data: any }> = ({ data }) => {
    if (!data?.status && !data?.dryRunMessage) return null;

    const isError = data.status === 'error';
    const isSuccess = data.status === 'ok' || data.status === 'simulated';
    const color = isError ? '#cf1322' : (isSuccess ? '#389e0d' : '#096dd9');
    const bg = isError ? '#fff1f0' : (isSuccess ? '#f6ffed' : '#e6f7ff');
    const border = isError ? '#ffa39e' : (isSuccess ? '#b7eb8f' : '#91d5ff');

    return (
        <div style={{ marginBottom: 24, padding: 12, background: bg, border: `1px solid ${border}`, borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color }}>
                {isError ? '执行失败' : (isSuccess ? '执行成功' : '正在执行...')}
            </div>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>
                {data.dryRunMessage}
            </div>
            {data.dryRunOutput && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Output Payload:</div>
                    <pre style={{ background: 'rgba(255,255,255,0.6)', padding: 8, borderRadius: 4, margin: 0, maxHeight: 200, overflow: 'auto', fontSize: 11, fontFamily: 'Menlo, Monaco, monospace' }}>
                        {JSON.stringify(data.dryRunOutput, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, open, onClose, onChange }) => {
    const formRef = useRef<any>(null);
    const [channelList, setChannelList] = useState<ChannelInfo[]>([]);
    const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>([]);
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [selectedTaskName, setSelectedTaskName] = useState<string>('');

    // 只有当切换到不同节点时才重置表单，避免输入时因状态更新导致焦点丢失
    const prevNodeIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (node && open) {
            // 只有节点 ID 变化时才重置表单
            if (prevNodeIdRef.current !== node.id) {
                prevNodeIdRef.current = node.id;
                formRef.current?.resetFields();
                formRef.current?.setFieldsValue(node.data);
            }
            // 初始化已选任务名称
            if (node.data?.task_template_name) {
                setSelectedTaskName(node.data.task_template_name);
            } else {
                setSelectedTaskName('');
            }
        }
        // 当 drawer 关闭时，清除 prevNodeIdRef
        if (!open) {
            prevNodeIdRef.current = null;
        }
    }, [node, open]);

    const handleValuesChange = (_: any, allValues: any) => {
        if (node) {
            onChange(node.id, allValues);
        }
    };

    const renderContent = () => {
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
                            fieldProps={{
                                onChange: () => {
                                    // Clear the other field when mode changes
                                    const mode = formRef.current?.getFieldValue('extract_mode');
                                    if (mode === 'regex') {
                                        formRef.current?.setFieldValue('split_by', undefined);
                                    } else {
                                        formRef.current?.setFieldValue('regex_pattern', undefined);
                                    }
                                }
                            }}
                        />
                        <ProFormDependency name={['extract_mode']}>
                            {({ extract_mode }) => {
                                if (extract_mode === 'regex') {
                                    return (
                                        <ProFormText
                                            name="regex_pattern"
                                            label="正则表达式"
                                            placeholder="例如: (\d+\.\d+\.\d+\.\d+)"
                                            rules={[{ required: true, message: '请输入正则表达式' }]}
                                            tooltip="用于从字段中提取主机的正则表达式，使用捕获组"
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
                            tooltip="提取后的主机列表将存储在此变量中，供后续节点使用"
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
                        <ProFormText name="output_key" label="输出变量名" initialValue="validated_hosts" rules={[{ required: true }]} tooltip="验证通过的主机列表变量" />
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
                                const users = await fetchAllPages<any>((page, pageSize) => getUsers({ page, page_size: pageSize }));
                                return users.map(u => ({ label: u.display_name, value: u.username }));
                            }}
                        />
                        <ProFormSelect
                            name="approver_roles"
                            label="审批人 (角色)"
                            mode="multiple"
                            request={async () => {
                                const res = await getRoles();
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
                            value={node?.data?.task_template_id}
                            onSelect={(id, template) => {
                                formRef.current?.setFieldsValue({
                                    task_template_id: id,
                                    task_template_name: template.name
                                });
                                setSelectedTaskName(template.name);
                                setTaskSelectorOpen(false);
                                // Trigger form change
                                if (node) {
                                    onChange(node.id, {
                                        ...formRef.current?.getFieldsValue(),
                                        task_template_id: id,
                                        task_template_name: template.name
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
                                taskTemplateId={node?.data?.task_template_id}
                                value={node?.data?.extra_vars || {}}
                                variableMappings={node?.data?.variable_mappings || {}}
                                onChange={(vars) => {
                                    formRef.current?.setFieldValue('extra_vars', vars);
                                    if (node) {
                                        onChange(node.id, {
                                            ...formRef.current?.getFieldsValue(),
                                            extra_vars: vars
                                        });
                                    }
                                }}
                                onMappingsChange={(mappings) => {
                                    formRef.current?.setFieldValue('variable_mappings', mappings);
                                    if (node) {
                                        onChange(node.id, {
                                            ...formRef.current?.getFieldsValue(),
                                            variable_mappings: mappings
                                        });
                                    }
                                }}
                            />
                            <ProFormText name="extra_vars" hidden />
                            <ProFormText name="variable_mappings" hidden />
                        </div>
                    </>
                );
            case 'notification':
                return (
                    <>
                        <VariableHint inputs={['incident', 'execution.result']} />
                        <ProFormSelect
                            name="channel_ids"
                            label="通知渠道"
                            mode="multiple"
                            rules={[{ required: true, message: '请选择通知渠道' }]}
                            request={async () => {
                                const fetchedChannels = await fetchAllPages<any>((page, pageSize) => getChannels({ page, page_size: pageSize }));
                                const channels = fetchedChannels.map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    type: c.type
                                }));
                                setChannelList(channels);
                                return channels.map(c => ({
                                    label: `${c.name} (${c.type})`,
                                    value: c.id,
                                }));
                            }}
                            fieldProps={{
                                onChange: (selectedIds: string[]) => {
                                    // Get types of selected channels
                                    const types = channelList
                                        .filter(c => selectedIds?.includes(c.id))
                                        .map(c => c.type);
                                    // Unique types
                                    const uniqueTypes = [...new Set(types)];
                                    setSelectedChannelTypes(uniqueTypes);
                                    // Clear template when channels change
                                    formRef.current?.setFieldValue('template_id', undefined);
                                }
                            }}
                            tooltip="先选择渠道，模板会根据渠道类型自动筛选"
                        />
                        <ProFormSelect
                            name="template_id"
                            label="通知模板"
                            rules={[{ required: true, message: '请选择通知模板' }]}
                            dependencies={['channel_ids']}
                            request={async () => {
                                const templates = await fetchAllPages<any>((page, pageSize) => getNotificationTemplates({ page, page_size: pageSize }));
                                return templates.map(t => ({
                                    label: `${t.name}${t.supported_channels?.length ? ` (${t.supported_channels.join('/')})` : ''}`,
                                    value: t.id,
                                    supported_channels: t.supported_channels || []
                                }));
                            }}
                            fieldProps={{
                                showSearch: true,
                                filterOption: (input: string, option: any) => {
                                    // If no channels selected, show all templates
                                    if (selectedChannelTypes.length === 0) {
                                        return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
                                    }

                                    // Template must support ALL selected channel types
                                    const supportedChannels: string[] = option?.supported_channels || [];

                                    // If template has no channel restrictions, it supports all types
                                    if (supportedChannels.length === 0) {
                                        return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
                                    }

                                    // Check if template supports all selected channel types
                                    const supportsAll = selectedChannelTypes.every(type =>
                                        supportedChannels.includes(type)
                                    );

                                    if (!supportsAll) return false;

                                    // Also apply text search
                                    return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
                                }
                            }}
                            tooltip={selectedChannelTypes.length > 0
                                ? `已筛选支持 ${selectedChannelTypes.join('+')} 的模板`
                                : "请先选择渠道以筛选模板"}
                        />
                    </>
                );
            case 'condition':
                return (
                    <>
                        <VariableHint inputs={['Any Variable (e.g. result.status == "success")']} />
                        <Alert message="条件分支节点需要连接 True 和 False 两个出口。请在下方填入条件表达式。" type="warning" style={{ marginBottom: 16 }} />
                        <ProFormText
                            name="condition"
                            label="条件表达式"
                            placeholder="例如: result.stats.failed == 0"
                            rules={[{ required: true }]}
                            tooltip="支持简单的比较运算"
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
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <Typography.Text strong>计算操作</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    添加多个表达式计算
                                </Typography.Text>
                            </div>
                            <ExpressionHelpButton />
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

    return (
        <Drawer
            title={
                <Space>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1890ff' }} />
                    <Typography.Text strong>{node?.data?.label || '节点配置'}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>({node?.data?.type || node?.type})</Typography.Text>
                </Space>
            }
            size={820}
            onClose={onClose}
            open={open}
            mask={false}
            style={{ top: 64 }}
            styles={{ body: { paddingBottom: 80 } }}
            maskClosable={false}
        >
            {node && (
                <>
                    <RunResultView data={node.data} />
                    <ProForm
                        formRef={formRef}
                        submitter={false}
                        onValuesChange={handleValuesChange}
                        layout="vertical"
                    >
                        <ProFormText name="label" label="节点名称" />
                        <Divider style={{ margin: '12px 0' }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>参数配置</Typography.Text></Divider>
                        {renderContent()}
                    </ProForm>
                </>
            )}
        </Drawer>
    );
};

export default NodeConfigPanel;
