import React, { useEffect, useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import {
    ProFormDependency,
    ProFormSelect,
    ProFormText,
} from '@ant-design/pro-components';
import { SelectOutlined } from '@ant-design/icons';
import ExtraVarsEditor from './ExtraVarsEditor';
import NotificationChannelTemplateSelector from './NotificationChannelTemplateSelector';
import TaskTemplateSelector from './TaskTemplateSelector';
import type { ExtraVarsMappings, ExtraVarsValueMap } from './extraVarsTypes';
import { VariableHint } from './NodeDetailPanelShared';
import type { NodeDetailSettingsProps } from './NodeDetailPanel.types';

type NotificationConfig = {
    channel_id: string;
    template_id: string;
    channel_name?: string;
    template_name?: string;
};

const applyNodeUpdate = (
    node: NodeDetailSettingsProps['node'],
    onChange: NodeDetailSettingsProps['onChange'],
    values: Record<string, unknown>,
) => {
    onChange(node.id, {
        ...node.data,
        ...values,
    });
};

const getStringFieldValue = (formRef: NodeDetailSettingsProps['formRef'], name: string) => {
    const value = formRef.current?.getFieldValue?.(name);
    return typeof value === 'string' ? value : '';
};

const getExtraVarsValue = (value: unknown): ExtraVarsValueMap => {
    return value && typeof value === 'object' ? (value as ExtraVarsValueMap) : {};
};

const getVariableMappings = (value: unknown): ExtraVarsMappings => {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<ExtraVarsMappings>((accumulator, [key, item]) => {
        if (typeof item === 'string') {
            accumulator[key] = item;
        }
        return accumulator;
    }, {});
};

const ExecutionSettings: React.FC<NodeDetailSettingsProps> = ({ formRef, node, onChange }) => {
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [selectedTaskName, setSelectedTaskName] = useState('');
    const [currentTaskTemplateId, setCurrentTaskTemplateId] = useState<string | undefined>();

    useEffect(() => {
        setTaskSelectorOpen(false);
        setSelectedTaskName(typeof node.data?.task_template_name === 'string' ? node.data.task_template_name : '');
        setCurrentTaskTemplateId(typeof node.data?.task_template_id === 'string' ? node.data.task_template_id : undefined);
    }, [node.id, node.data?.task_template_id, node.data?.task_template_name]);

    const handleExecutionTemplateSelect = (id: string, template: AutoHealing.ExecutionTask) => {
        const nextValues = {
            ...formRef.current?.getFieldsValue(),
            task_template_id: id,
            task_template_name: template.name,
            extra_vars: template.extra_vars || {},
            variable_mappings: {},
        };

        formRef.current?.setFieldsValue(nextValues);
        setSelectedTaskName(template.name);
        setCurrentTaskTemplateId(id);
        setTaskSelectorOpen(false);
        applyNodeUpdate(node, onChange, nextValues);
    };

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
                        value={selectedTaskName || getStringFieldValue(formRef, 'task_template_name')}
                        placeholder="请选择作业模板"
                        style={{ flex: 1 }}
                    />
                    <Button icon={<SelectOutlined />} onClick={() => setTaskSelectorOpen(true)}>
                        选择
                    </Button>
                </Space.Compact>
                <ProFormText name="task_template_id" hidden rules={[{ required: true, message: '请选择作业模板' }]} />
                <ProFormText name="task_template_name" hidden />
            </div>
            <TaskTemplateSelector
                open={taskSelectorOpen}
                value={currentTaskTemplateId}
                onSelect={handleExecutionTemplateSelect}
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
                    value={getExtraVarsValue(node.data?.extra_vars)}
                    variableMappings={getVariableMappings(node.data?.variable_mappings)}
                    onChange={(extra_vars) => {
                        formRef.current?.setFieldValue('extra_vars', extra_vars);
                        applyNodeUpdate(node, onChange, { extra_vars });
                    }}
                    onMappingsChange={(variable_mappings) => {
                        formRef.current?.setFieldValue('variable_mappings', variable_mappings);
                        applyNodeUpdate(node, onChange, { variable_mappings });
                    }}
                    onBatchChange={(extra_vars, variable_mappings) => {
                        formRef.current?.setFieldsValue({ extra_vars, variable_mappings });
                        applyNodeUpdate(node, onChange, { extra_vars, variable_mappings });
                    }}
                />
            </div>
        </>
    );
};

const NotificationSettings: React.FC<NodeDetailSettingsProps> = ({ node, onChange }) => (
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
                value={(node.data?.notification_configs as NotificationConfig[]) || []}
                onChange={(notification_configs) => {
                    applyNodeUpdate(node, onChange, {
                        notification_configs,
                        channel_ids: notification_configs.map((config) => config.channel_id),
                        template_id: notification_configs.length > 0 ? notification_configs[0].template_id : undefined,
                    });
                }}
            />
        </div>
    </>
);

export const NodeDetailPanelAutomationSettings: React.FC<NodeDetailSettingsProps> = (props) => {
    const nodeType = props.node.data?.type || props.node.type;
    if (nodeType === 'execution') {
        return <ExecutionSettings {...props} />;
    }
    if (nodeType === 'notification') {
        return <NotificationSettings {...props} />;
    }
    return null;
};
