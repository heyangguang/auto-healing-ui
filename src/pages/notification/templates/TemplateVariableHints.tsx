import React, { useMemo } from 'react';
import { Alert, Empty, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

type TemplateVariableHintsProps = {
    variables: AutoHealing.TemplateVariable[];
};

const buildVariableGroups = (variables: AutoHealing.TemplateVariable[]) =>
    variables.reduce<Record<string, AutoHealing.TemplateVariable[]>>((groups, variable) => {
        const category = variable.category || 'other';
        const current = groups[category] || [];
        return {
            ...groups,
            [category]: [...current, variable],
        };
    }, {});

const copyVariableToken = async (variableName: string) => {
    try {
        await navigator.clipboard.writeText(`{{${variableName}}}`);
        message.success(`已复制 {{${variableName}}}`);
    } catch {
        message.error('复制变量失败，请手动复制');
    }
};

const TemplateVariableHints: React.FC<TemplateVariableHintsProps> = ({ variables }) => {
    const groupedVariables = useMemo(() => buildVariableGroups(variables), [variables]);

    if (variables.length === 0) {
        return (
            <div style={{ padding: 12, textAlign: 'center' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用变量" />
            </div>
        );
    }

    return (
        <div>
            <Alert
                description="点击变量名可复制到剪贴板，然后粘贴到模板中。变量会在发送时自动替换为实际值。"
                title="使用说明"
                showIcon
                style={{ marginBottom: 16, fontSize: 12 }}
                type="info"
            />

            {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
                <div key={category} style={{ marginBottom: 20 }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#8c8c8c',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 8,
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: 4,
                        }}
                    >
                        {category}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {categoryVariables.map((variable) => (
                            <div
                                key={variable.name}
                                onClick={() => void copyVariableToken(variable.name)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    background: '#fff',
                                    borderRadius: 4,
                                    border: '1px solid #e8e8e8',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <code
                                        style={{
                                            fontSize: 13,
                                            color: '#1890ff',
                                            fontFamily: "'SF Mono', 'Menlo', monospace",
                                        }}
                                    >
                                        {`{{${variable.name}}}`}
                                    </code>
                                    <CopyOutlined style={{ fontSize: 12, color: '#bfbfbf' }} />
                                </div>
                                {variable.description && (
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                        {variable.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TemplateVariableHints;
