import React from 'react';
import { Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { STATUS_CONFIG } from './CustomNode';

const VARIABLE_HINT_STYLE = {
    marginTop: -8,
    marginBottom: 16,
    padding: '8px 12px',
    background: '#fafafa',
    borderRadius: 4,
    border: '1px dashed #d9d9d9',
    fontSize: 12,
} as const;

const getFallbackStatusIcon = () => <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;

export const getStatusIcon = (status?: string) => {
    if (!status) {
        return getFallbackStatusIcon();
    }

    const config = STATUS_CONFIG[status];
    if (!config) {
        return getFallbackStatusIcon();
    }

    return <span style={{ color: config.color }}>{config.icon}</span>;
};

interface VariableHintProps {
    inputs?: string[];
    outputs?: string[];
}

const renderVariableTags = (
    values: string[],
    foreground: string,
    background: string,
    borderColor: string,
) => (
    <Space size={4} wrap>
        {values.map((value) => (
            <code
                key={value}
                style={{
                    color: foreground,
                    background,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    padding: '0 4px',
                }}
            >
                {value}
            </code>
        ))}
    </Space>
);

export const VariableHint: React.FC<VariableHintProps> = ({ inputs, outputs }) => {
    if ((!inputs || inputs.length === 0) && (!outputs || outputs.length === 0)) {
        return null;
    }

    return (
        <div style={VARIABLE_HINT_STYLE}>
            {inputs && inputs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: outputs?.length ? 4 : 0 }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4 }}>输入依赖:</span>
                    {renderVariableTags(inputs, '#13c2c2', '#e6fffb', '#87e8de')}
                </div>
            )}
            {outputs && outputs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4 }}>产生变量:</span>
                    {renderVariableTags(outputs, '#389e0d', '#f6ffed', '#b7eb8f')}
                </div>
            )}
        </div>
    );
};
