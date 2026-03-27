import React from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { ProFormDependency, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { SelectOutlined } from '@ant-design/icons';
import ExtraVarsEditor from './ExtraVarsEditor';
import TaskTemplateSelector from './TaskTemplateSelector';
import { VariableHint } from './NodeConfigPanelShared';
import type {
    NodeConfigExecutionSectionProps,
    NodeConfigFormRef,
    NodeConfigFormValues,
    NodeConfigPanelChangeHandler,
} from './nodeConfigPanelTypes';

function updateExecutionValues(
    formRef: NodeConfigFormRef,
    nodeId: string,
    onChange: NodeConfigPanelChangeHandler,
    patch: Partial<NodeConfigFormValues>,
) {
    const nextValues = { ...(formRef.current?.getFieldsValue() || {}), ...patch };
    type FormValuesArg = Parameters<NonNullable<NodeConfigFormRef['current']>['setFieldsValue']>[0];
    formRef.current?.setFieldsValue(nextValues as FormValuesArg);
    onChange(nodeId, nextValues);
}

function getRecordValue(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as AutoHealing.JsonObject) : {};
}

function getVariableMappings(value: unknown) {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, mapping]) => {
        if (typeof mapping === 'string') {
            acc[key] = mapping;
        }
        return acc;
    }, {});
}

const ExecutionTemplateField: React.FC<{
    open: boolean;
    selectedTaskName: string;
    taskTemplateId?: string;
    taskTemplateName?: string;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: string, template: AutoHealing.ExecutionTask) => void;
}> = ({ open, selectedTaskName, taskTemplateId, taskTemplateName, onOpenChange, onSelect }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
            <Typography.Text>
                作业模板 <span style={{ color: '#ff4d4f' }}>*</span>
            </Typography.Text>
        </div>
        <Space.Compact style={{ width: '100%' }}>
            <Input readOnly value={selectedTaskName || taskTemplateName || ''} placeholder="请选择作业模板" style={{ flex: 1 }} />
            <Button icon={<SelectOutlined />} onClick={() => onOpenChange(true)}>
                选择
            </Button>
        </Space.Compact>
        <ProFormText name="task_template_id" hidden rules={[{ required: true, message: '请选择作业模板' }]} />
        <ProFormText name="task_template_name" hidden />
        <TaskTemplateSelector
            open={open}
            value={taskTemplateId}
            onSelect={onSelect}
            onCancel={() => onOpenChange(false)}
        />
    </div>
);

const ExecutionVariablesField: React.FC<{
    formRef: NodeConfigFormRef;
    nodeId: string;
    onChange: NodeConfigPanelChangeHandler;
    taskTemplateId?: string;
    extraVars: AutoHealing.JsonObject;
    variableMappings: Record<string, string>;
}> = ({ extraVars, formRef, nodeId, onChange, taskTemplateId, variableMappings }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
            <Typography.Text>变量配置</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                支持静态值或表达式
            </Typography.Text>
        </div>
        <ExtraVarsEditor
            taskTemplateId={taskTemplateId}
            value={extraVars}
            variableMappings={variableMappings}
            onChange={(nextExtraVars) => updateExecutionValues(formRef, nodeId, onChange, { extra_vars: nextExtraVars })}
            onMappingsChange={(nextMappings) => updateExecutionValues(formRef, nodeId, onChange, { variable_mappings: nextMappings })}
        />
        <ProFormText name="extra_vars" hidden />
        <ProFormText name="variable_mappings" hidden />
    </div>
);

export const NodeConfigExecutionSection: React.FC<NodeConfigExecutionSectionProps> = ({
    formRef,
    node,
    onChange,
    onSelectedTaskNameChange,
    onTaskSelectorOpenChange,
    selectedTaskName,
    taskSelectorOpen,
}) => {
    const taskTemplateId = typeof node.data?.task_template_id === 'string' ? node.data.task_template_id : undefined;
    const taskTemplateName = typeof node.data?.task_template_name === 'string' ? node.data.task_template_name : undefined;

    const handleTemplateSelect = (id: string, template: AutoHealing.ExecutionTask) => {
        updateExecutionValues(formRef, node.id, onChange, {
            task_template_id: id,
            task_template_name: template.name,
            extra_vars: template.extra_vars || {},
            variable_mappings: {},
        });
        onSelectedTaskNameChange(template.name);
        onTaskSelectorOpenChange(false);
    };

    return (
        <>
            <ProFormDependency name={['hosts_key']}>
                {({ hosts_key }: { hosts_key?: string }) => (
                    <VariableHint inputs={[hosts_key || 'validated_hosts', 'task_template']} outputs={['execution.result', 'execution.status']} />
                )}
            </ProFormDependency>
            <ExecutionTemplateField
                open={taskSelectorOpen}
                selectedTaskName={selectedTaskName}
                taskTemplateId={taskTemplateId}
                taskTemplateName={taskTemplateName}
                onOpenChange={onTaskSelectorOpenChange}
                onSelect={handleTemplateSelect}
            />
            <ProFormText name="hosts_key" label="目标主机变量" initialValue="validated_hosts" rules={[{ required: true }]} />
            <ProFormSelect
                name="executor_type"
                label="执行方式"
                valueEnum={{ local: '本地执行', docker: 'Docker容器' }}
                initialValue="local"
            />
            <ExecutionVariablesField
                extraVars={getRecordValue(node.data?.extra_vars)}
                formRef={formRef}
                nodeId={node.id}
                onChange={onChange}
                taskTemplateId={taskTemplateId}
                variableMappings={getVariableMappings(node.data?.variable_mappings)}
            />
        </>
    );
};
