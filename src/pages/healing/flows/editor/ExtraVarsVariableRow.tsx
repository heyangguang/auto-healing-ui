import React from 'react';
import { AutoComplete, Button, Form, Input, InputNumber, Segmented, Select, Switch, Tooltip, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { FunctionOutlined, InfoCircleOutlined } from '@ant-design/icons';
import ExtraVarsExpressionHelpButton, { EXTRA_VARS_EXPRESSION_OPTIONS, filterExpressionOption } from './ExtraVarsExpressionHelp';
import type {
    ExtraVarsFormValuesChange,
    ExtraVarsMappings,
    ExtraVarsValueMap,
    ExtraVarsVariable,
    VariableInputMode,
} from './extraVarsTypes';

const { Text } = Typography;

interface ExtraVarsVariableRowProps {
    expressionMappings: ExtraVarsMappings;
    form?: FormInstance<ExtraVarsValueMap>;
    isRequired: boolean;
    mode: VariableInputMode;
    onExpressionChange: (varName: string, expression: string) => void;
    onFormValuesChange?: ExtraVarsFormValuesChange;
    onModeChange: (varName: string, mode: VariableInputMode) => void;
    onStaticChange?: (varName: string, value: unknown) => void;
    staticValue?: unknown;
    variable: ExtraVarsVariable;
}

const getTextInputValue = (value: unknown) => (value ? String(value) : '');

const getVariableOptions = (variable: ExtraVarsVariable): string[] => (
    variable.options && variable.options.length > 0 ? variable.options : (variable.enum || [])
);

const renderStaticField = (
    variable: ExtraVarsVariable,
    staticValue: unknown,
    onStaticChange?: (varName: string, value: unknown) => void,
) => {
    const options = getVariableOptions(variable);
    const placeholder = variable.type === 'choice' ? `请选择 ${variable.name}` : `请输入 ${variable.name}`;

    if (variable.type === 'number') {
        return (
            <InputNumber
                style={{ width: '100%' }}
                placeholder={placeholder}
                value={staticValue as number | null | undefined}
                onChange={(value) => onStaticChange?.(variable.name, value)}
            />
        );
    }

    if (variable.type === 'boolean') {
        return (
            <Switch
                checkedChildren="是"
                unCheckedChildren="否"
                checked={Boolean(staticValue)}
                onChange={(value) => onStaticChange?.(variable.name, value)}
            />
        );
    }

    if (variable.type === 'choice' && options.length > 0) {
        return (
            <Select
                placeholder={placeholder}
                allowClear
                style={{ width: '100%' }}
                value={staticValue as string | undefined}
                onChange={(value) => onStaticChange?.(variable.name, value)}
            >
                {options.map((option) => (
                    <Select.Option key={option} value={option}>
                        {option}
                    </Select.Option>
                ))}
            </Select>
        );
    }

    return (
        <Input
            placeholder={placeholder}
            value={getTextInputValue(staticValue)}
            onChange={(event) => onStaticChange?.(variable.name, event.target.value)}
        />
    );
};

const ExtraVarsVariableRow: React.FC<ExtraVarsVariableRowProps> = ({
    expressionMappings,
    form,
    isRequired,
    mode,
    onExpressionChange,
    onFormValuesChange,
    onModeChange,
    onStaticChange,
    staticValue,
    variable,
}) => (
    <div
        style={{
            padding: '12px',
            marginBottom: 8,
            background: isRequired ? '#fffbf0' : '#fafafa',
            border: isRequired ? '1px dashed #ff4d4f' : '1px solid #f0f0f0',
            borderRadius: 4,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text strong style={{ fontSize: 13 }}>{variable.name}</Text>
                {isRequired && <Text type="danger">*</Text>}
                {variable.description && (
                    <Tooltip title={variable.description}>
                        <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                    </Tooltip>
                )}
            </div>
            <Segmented
                size="small"
                options={[
                    { label: '静态值', value: 'static' },
                    { label: <><FunctionOutlined /> 表达式</>, value: 'expression' },
                ]}
                value={mode}
                onChange={(value) => onModeChange(variable.name, value as VariableInputMode)}
            />
        </div>

        {mode === 'static' ? (
            form && onFormValuesChange ? (
                <Form form={form} layout="vertical" onValuesChange={onFormValuesChange}>
                    <Form.Item name={variable.name} style={{ margin: 0 }}>
                        {renderStaticField(variable, staticValue)}
                    </Form.Item>
                </Form>
            ) : (
                renderStaticField(variable, staticValue, onStaticChange)
            )
        ) : (
            <div style={{ display: 'flex', gap: 8 }}>
                <AutoComplete
                    placeholder="选择常用表达式或直接输入"
                    value={expressionMappings[variable.name] || ''}
                    onChange={(value) => onExpressionChange(variable.name, value || '')}
                    style={{ flex: 1 }}
                    allowClear
                    options={EXTRA_VARS_EXPRESSION_OPTIONS}
                    filterOption={filterExpressionOption}
                />
                <ExtraVarsExpressionHelpButton />
            </div>
        )}
    </div>
);

export default ExtraVarsVariableRow;
