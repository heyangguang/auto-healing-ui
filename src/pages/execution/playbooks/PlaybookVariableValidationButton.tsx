import React from 'react';
import { Button, Col, Form, Input, InputNumber, Popover, Row } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { normalizeVariableEditorType, updateVariableList } from './playbookVariableHelpers';

const PlaybookVariableValidationButton: React.FC<{
    canManage: boolean;
    editedVariables: AutoHealing.PlaybookVariable[];
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    variable: AutoHealing.PlaybookVariable;
}> = ({ canManage, editedVariables, onAutoSave, variable }) => {
    const editorType = normalizeVariableEditorType(variable.type);
    const hasValidation = Boolean(
        variable.pattern
        || variable.min !== undefined
        || variable.max !== undefined
        || (variable.enum && variable.enum.length > 0),
    );

    const updateVariable = (patch: Partial<AutoHealing.PlaybookVariable>) => {
        onAutoSave(updateVariableList(editedVariables, variable.name, (current) => ({
            ...current,
            ...patch,
        })));
    };

    return (
        <Popover
            trigger="click"
            placement="leftTop"
            destroyOnHidden
            title={<span style={{ fontSize: 15, fontWeight: 500 }}>验证规则配置</span>}
            content={
                <div style={{ width: 320, padding: '8px 0' }}>
                        <Form layout="vertical" size="middle">
                            <Form.Item label="正则表达式" style={{ marginBottom: 16 }}>
                                <Input
                                    key={`${variable.name}-pattern-${variable.pattern || ''}`}
                                    defaultValue={variable.pattern || ''}
                                    placeholder="如 ^[a-zA-Z0-9]+$"
                                onBlur={(event) => {
                                    const nextValue = event.target.value;
                                    if (nextValue !== (variable.pattern || '')) {
                                        updateVariable({ pattern: nextValue });
                                    }
                                }}
                            />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="最小值" style={{ marginBottom: 16 }}>
                                    <InputNumber
                                        key={`${variable.name}-min-${variable.min ?? ''}`}
                                        defaultValue={variable.min}
                                        placeholder="min"
                                        style={{ width: '100%' }}
                                        onBlur={(event) => {
                                            const nextValue = event.target.value ? Number(event.target.value) : undefined;
                                            if (nextValue !== variable.min) {
                                                updateVariable({ min: nextValue });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="最大值" style={{ marginBottom: 16 }}>
                                    <InputNumber
                                        key={`${variable.name}-max-${variable.max ?? ''}`}
                                        defaultValue={variable.max}
                                        placeholder="max"
                                        style={{ width: '100%' }}
                                        onBlur={(event) => {
                                            const nextValue = event.target.value ? Number(event.target.value) : undefined;
                                            if (nextValue !== variable.max) {
                                                updateVariable({ max: nextValue });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        {editorType === 'enum' && (
                            <Form.Item label="枚举值" style={{ marginBottom: 0 }}>
                                <Input
                                    key={`${variable.name}-enum-${(variable.enum || []).join('|')}`}
                                    defaultValue={(variable.enum || []).join(', ')}
                                    placeholder="a, b, c"
                                    onBlur={(event) => {
                                        const nextEnum = event.target.value
                                            .split(',')
                                            .map((item) => item.trim())
                                            .filter(Boolean);
                                        updateVariable({ enum: nextEnum });
                                    }}
                                />
                            </Form.Item>
                        )}
                    </Form>
                </div>
            }
        >
            <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                disabled={!canManage}
                style={{ color: hasValidation ? '#1677ff' : '#bbb' }}
            />
        </Popover>
    );
};

export default PlaybookVariableValidationButton;
