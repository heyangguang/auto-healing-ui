import React from 'react';
import { Alert, Col, Divider, Row, Tooltip, Typography } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import VariableInput from '@/components/VariableInput';
import type {
    TemplateVariableRecord,
    VariableValueMap,
} from '../../templates/templateVariableHelpers';

const { Text } = Typography;

interface ExecutionMissionControlVariablesSectionProps {
    loadingPlaybook: boolean;
    optionalVariables: TemplateVariableRecord[];
    playbookLoadFailed: boolean;
    requiredVariables: TemplateVariableRecord[];
    variableValues: VariableValueMap;
    onVariableChange: (name: string, value: unknown) => void;
}

const VariableLabel: React.FC<{
    description?: string;
    name: string;
    required?: boolean;
}> = ({ description, name, required = false }) => (
    <div style={{ marginBottom: 4 }}>
        <Text strong={required}>{name}</Text>
        {required && <Text type="danger"> *</Text>}
        {description && (
            <Tooltip title={description}>
                <span style={{ marginLeft: 6, color: '#8c8c8c', cursor: 'help' }}>?</span>
            </Tooltip>
        )}
    </div>
);

const VariableField: React.FC<{
    value: unknown;
    variable: TemplateVariableRecord;
    onVariableChange: (name: string, value: unknown) => void;
}> = ({ value, variable, onVariableChange }) => (
    <Col key={variable.name} span={12}>
        <div className="variable-form-item">
            <VariableLabel
                description={variable.description}
                name={variable.name}
                required={variable.required}
            />
            <VariableInput
                variable={variable}
                value={value}
                onChange={(nextValue) => onVariableChange(variable.name, nextValue)}
            />
        </div>
    </Col>
);

const VariableGroup: React.FC<{
    title: string;
    titleType: 'danger' | 'secondary';
    variables: TemplateVariableRecord[];
    variableValues: VariableValueMap;
    onVariableChange: (name: string, value: unknown) => void;
}> = ({ title, titleType, variables, variableValues, onVariableChange }) => {
    if (variables.length === 0) {
        return null;
    }

    return (
        <div style={{ marginBottom: titleType === 'danger' ? 24 : 0 }}>
            <Text type={titleType} strong style={{ marginBottom: 12, display: 'block' }}>
                {title}
            </Text>
            <Row gutter={[24, 0]}>
                {variables.map((variable) => (
                    <VariableField
                        key={variable.name}
                        variable={variable}
                        value={variableValues[variable.name]}
                        onVariableChange={onVariableChange}
                    />
                ))}
            </Row>
        </div>
    );
};

const ExecutionMissionControlVariablesSection: React.FC<ExecutionMissionControlVariablesSectionProps> = ({
    loadingPlaybook,
    optionalVariables,
    playbookLoadFailed,
    requiredVariables,
    variableValues,
    onVariableChange,
}) => {
    if (loadingPlaybook) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">加载变量中...</Text>
            </div>
        );
    }

    if (playbookLoadFailed) {
        return (
            <Alert
                message="Playbook 元数据加载失败，当前无法确认变量要求"
                type="warning"
                showIcon
                banner
            />
        );
    }

    if (requiredVariables.length === 0 && optionalVariables.length === 0) {
        return <Alert message="此任务无需额外变量配置，可直接执行。" type="success" showIcon banner />;
    }

    return (
        <>
            <Divider orientationMargin={0} style={{ margin: '24px 0 16px' }} plain>
                <span><CodeOutlined /> 变量参数 (Variables)</span>
            </Divider>
            <VariableGroup
                title="必填参数 / REQUIRED"
                titleType="danger"
                variables={requiredVariables}
                variableValues={variableValues}
                onVariableChange={onVariableChange}
            />
            <VariableGroup
                title="可选参数 / OPTIONAL"
                titleType="secondary"
                variables={optionalVariables}
                variableValues={variableValues}
                onVariableChange={onVariableChange}
            />
        </>
    );
};

export default ExecutionMissionControlVariablesSection;
