import React from 'react';
import { Alert, Typography } from 'antd';
import {
    ProFormDependency,
    ProFormDigit,
    ProFormSelect,
    ProFormText,
} from '@ant-design/pro-components';
import { getRoles } from '@/services/auto-healing/roles';
import { getUsers } from '@/services/auto-healing/users';
import { fetchAllPages } from '@/utils/fetchAllPages';
import ComputeOperationsEditor from './ComputeOperationsEditor';
import { VariableHint } from './NodeDetailPanelShared';
import type { NodeDetailSettingsProps } from './NodeDetailPanel.types';

const loadUserOptions = async () => {
    const users = await fetchAllPages<AutoHealing.User>((page, pageSize) => getUsers({ page, page_size: pageSize }));
    return users.map((user) => ({ label: user.display_name, value: user.username }));
};

const loadRoleOptions = async () => {
    const roles = await getRoles();
    return roles.map((role) => ({ label: role.display_name, value: role.name }));
};

const StartSettings: React.FC<NodeDetailSettingsProps> = () => (
    <>
        <VariableHint outputs={['incident', 'incident.raw_data', 'incident.title']} />
        <Alert message="流程开始节点，无需配置" type="info" showIcon />
    </>
);

const EndSettings: React.FC<NodeDetailSettingsProps> = () => (
    <Alert message="流程结束节点" type="info" showIcon />
);

const HostExtractorSettings: React.FC<NodeDetailSettingsProps> = () => (
    <>
        <ProFormDependency name={['source_field', 'output_key']}>
            {({ output_key, source_field }) => (
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
            {({ extract_mode }) => (
                extract_mode === 'regex'
                    ? (
                        <ProFormText
                            name="regex_pattern"
                            label="正则表达式"
                            placeholder="例如: (\\d+\\.\\d+\\.\\d+\\.\\d+)"
                            rules={[{ required: true, message: '请输入正则表达式' }]}
                        />
                    )
                    : (
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
        <ProFormText
            name="output_key"
            label="输出变量名"
            rules={[{ required: true }]}
            initialValue="hosts"
        />
    </>
);

const CmdbValidatorSettings: React.FC<NodeDetailSettingsProps> = () => (
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

const ApprovalSettings: React.FC<NodeDetailSettingsProps> = () => (
    <>
        <VariableHint inputs={['incident']} outputs={['approval_result (通过/拒绝)']} />
        <ProFormText name="title" label="审批标题" rules={[{ required: true }]} />
        <ProFormText name="description" label="审批描述" />
        <ProFormSelect
            name="approvers"
            label="审批人 (用户)"
            mode="multiple"
            request={loadUserOptions}
        />
        <ProFormSelect
            name="approver_roles"
            label="审批人 (角色)"
            mode="multiple"
            request={loadRoleOptions}
        />
        <ProFormDigit name="timeout_hours" label="超时时间 (小时)" min={1} initialValue={24} />
    </>
);

const ConditionSettings: React.FC<NodeDetailSettingsProps> = () => (
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

const SetVariableSettings: React.FC<NodeDetailSettingsProps> = () => (
    <>
        <ProFormDependency name={['key']}>
            {({ key }) => <VariableHint outputs={[key || 'new_variable']} />}
        </ProFormDependency>
        <ProFormText name="key" label="变量名" rules={[{ required: true }]} />
        <ProFormText name="value" label="变量值" rules={[{ required: true }]} />
    </>
);

const ComputeSettings: React.FC<NodeDetailSettingsProps> = ({ node, onChange }) => (
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
            value={Array.isArray(node.data?.operations) ? node.data.operations : []}
            onChange={(operations) => {
                onChange(node.id, {
                    ...node.data,
                    operations,
                });
            }}
        />
    </>
);

const BASIC_SETTINGS_COMPONENTS: Partial<Record<string, React.FC<NodeDetailSettingsProps>>> = {
    start: StartSettings,
    end: EndSettings,
    host_extractor: HostExtractorSettings,
    cmdb_validator: CmdbValidatorSettings,
    approval: ApprovalSettings,
    condition: ConditionSettings,
    set_variable: SetVariableSettings,
    compute: ComputeSettings,
};

export const NodeDetailPanelBasicSettings: React.FC<NodeDetailSettingsProps> = (props) => {
    const nodeType = typeof props.node.data?.type === 'string'
        ? props.node.data.type
        : typeof props.node.type === 'string'
            ? props.node.type
            : '';
    const SettingsComponent = BASIC_SETTINGS_COMPONENTS[nodeType];

    if (!SettingsComponent) {
        return <Alert message={`未知的节点类型: ${nodeType}`} type="error" />;
    }

    return <SettingsComponent {...props} />;
};
