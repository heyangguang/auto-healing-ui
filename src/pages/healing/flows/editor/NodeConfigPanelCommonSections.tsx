import React from 'react';
import { Alert, Typography } from 'antd';
import { ProFormDependency, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { getRoles } from '@/services/auto-healing/roles';
import { getUsers } from '@/services/auto-healing/users';
import { fetchAllPages } from '@/utils/fetchAllPages';
import ComputeOperationsEditor from './ComputeOperationsEditor';
import ExpressionHelpButton from './ExpressionHelpButton';
import { VariableHint } from './NodeConfigPanelShared';
import type { NodeConfigSectionProps } from './nodeConfigPanelTypes';

type ComputeOperation = { id?: string; output_key: string; expression: string };

async function requestApproverUsers() {
    const users = await fetchAllPages<AutoHealing.User>((page, pageSize) => getUsers({ page, page_size: pageSize }));
    return users.map((user) => ({ label: user.display_name, value: user.username }));
}

async function requestApproverRoles() {
    const roles = await getRoles();
    return roles.map((role) => ({ label: role.display_name, value: role.name }));
}

const HostExtractorModeFields: React.FC<{ formRef: NodeConfigSectionProps['formRef'] }> = ({ formRef }) => (
    <ProFormDependency name={['extract_mode']}>
        {({ extract_mode }) => (
            extract_mode === 'regex' ? (
                <ProFormText
                    name="regex_pattern"
                    label="正则表达式"
                    placeholder="例如: (\\d+\\.\\d+\\.\\d+\\.\\d+)"
                    rules={[{ required: true, message: '请输入正则表达式' }]}
                    tooltip="用于从字段中提取主机的正则表达式，使用捕获组"
                />
            ) : (
                <ProFormText
                    name="split_by"
                    label="分隔符"
                    placeholder=","
                    initialValue=","
                    rules={[{ required: true, message: '请输入分隔符' }]}
                />
            )
        )}
    </ProFormDependency>
);

export const StartNodeSection: React.FC = () => (
    <>
        <VariableHint outputs={['incident', 'incident.raw_data', 'incident.title']} />
        <Alert message="流程开始节点，无需配置" type="info" showIcon />
    </>
);

export const EndNodeSection: React.FC = () => <Alert message="流程结束节点" type="info" showIcon />;

export const HostExtractorSection: React.FC<Pick<NodeConfigSectionProps, 'formRef'>> = ({ formRef }) => (
    <>
        <ProFormDependency name={['source_field', 'output_key']}>
            {({ source_field, output_key }) => (
                <VariableHint inputs={[source_field || 'raw_data.cmdb_ci']} outputs={[output_key || 'hosts']} />
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
                onChange: (mode: string) => formRef.current?.setFieldValue(mode === 'regex' ? 'split_by' : 'regex_pattern', undefined),
            }}
        />
        <HostExtractorModeFields formRef={formRef} />
        <ProFormText
            name="output_key"
            label="输出变量名"
            initialValue="hosts"
            rules={[{ required: true }]}
            tooltip="提取后的主机列表将存储在此变量中，供后续节点使用"
        />
    </>
);

export const CmdbValidatorSection: React.FC = () => (
    <>
        <ProFormDependency name={['input_key', 'output_key']}>
            {({ input_key, output_key }) => (
                <VariableHint inputs={[input_key || 'hosts']} outputs={[output_key || 'validated_hosts']} />
            )}
        </ProFormDependency>
        <ProFormText name="input_key" label="输入变量名" initialValue="hosts" rules={[{ required: true }]} />
        <ProFormText
            name="output_key"
            label="输出变量名"
            initialValue="validated_hosts"
            rules={[{ required: true }]}
            tooltip="验证通过的主机列表变量"
        />
    </>
);

export const ApprovalNodeSection: React.FC = () => (
    <>
        <VariableHint inputs={['incident']} outputs={['approval_result (通过/拒绝)']} />
        <ProFormText name="title" label="审批标题" rules={[{ required: true }]} />
        <ProFormText name="description" label="审批描述" />
        <ProFormSelect name="approvers" label="审批人 (用户)" mode="multiple" request={requestApproverUsers} />
        <ProFormSelect name="approver_roles" label="审批人 (角色)" mode="multiple" request={requestApproverRoles} />
        <ProFormDigit name="timeout_hours" label="超时时间 (小时)" min={1} initialValue={24} />
    </>
);

export const ConditionNodeSection: React.FC = () => (
    <>
        <VariableHint inputs={['Any Variable (e.g. result.status == "success")']} />
        <Alert
            message="条件分支节点需要连接 True 和 False 两个出口。请在下方填入条件表达式。"
            type="warning"
            style={{ marginBottom: 16 }}
        />
        <ProFormText
            name="condition"
            label="条件表达式"
            placeholder="例如: result.stats.failed == 0"
            rules={[{ required: true }]}
            tooltip="支持简单的比较运算"
        />
    </>
);

export const SetVariableNodeSection: React.FC = () => (
    <>
        <ProFormDependency name={['key']}>
            {({ key }) => <VariableHint outputs={[key || 'new_variable']} />}
        </ProFormDependency>
        <ProFormText name="key" label="变量名" rules={[{ required: true }]} />
        <ProFormText name="value" label="变量值" rules={[{ required: true }]} />
    </>
);

const ComputeOperationsHeader: React.FC = () => (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <Typography.Text strong>计算操作</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                添加多个表达式计算
            </Typography.Text>
        </div>
        <ExpressionHelpButton />
    </div>
);

function getComputeOperations(node: NodeConfigSectionProps['node']) {
    return Array.isArray(node.data?.operations) ? (node.data.operations as ComputeOperation[]) : [];
}

export const ComputeNodeSection: React.FC<NodeConfigSectionProps> = ({ node, onChange }) => (
    <>
        <Alert
            message="计算节点用于执行表达式计算，将结果存入上下文供后续节点使用"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
        />
        <ComputeOperationsHeader />
        <ComputeOperationsEditor
            value={getComputeOperations(node)}
            onChange={(operations) => onChange(node.id, { ...node.data, operations })}
        />
    </>
);
