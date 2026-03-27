import React from 'react';
import { Button, Checkbox, Input, Popover, Typography } from 'antd';
import {
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {
    parseDefaultList,
    replaceVariable,
} from './playbookVariableHelpers';

const { Text } = Typography;

type PlaybookListDefaultEditorProps = {
    canManage: boolean;
    editedVariables: AutoHealing.PlaybookVariable[];
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    parsedDefault: string;
    saveDefault: (nextValue: unknown) => void;
    variable: AutoHealing.PlaybookVariable;
};

const PlaybookListDefaultEditor: React.FC<PlaybookListDefaultEditorProps> = ({
    canManage,
    editedVariables,
    onAutoSave,
    parsedDefault,
    saveDefault,
    variable,
}) => {
    const options = variable.enum || [];
    const defaultValues = parsedDefault ? parseDefaultList(parsedDefault) : [];
    const updateEnum = (nextEnum: string[]) => {
        onAutoSave(replaceVariable(editedVariables, variable.name, { enum: nextEnum }));
    };
    const toggleDefault = (value: string) => {
        const nextDefaults = defaultValues.includes(value)
            ? defaultValues.filter((item) => item !== value)
            : [...defaultValues, value];
        saveDefault(JSON.stringify(nextDefaults));
    };

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            title={<span style={{ fontWeight: 500 }}>编辑列表可选项</span>}
            content={
                <div style={{ width: 280 }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>勾选的项将作为默认值</div>
                    {options.length > 0 ? options.map((option, index) => {
                        const isDefault = defaultValues.includes(option);
                        return (
                            <div key={`${variable.name}-${option}-${index}`} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <Checkbox checked={isDefault} disabled={!canManage} onChange={() => toggleDefault(option)} />
                                <Input
                                    defaultValue={option}
                                    style={{ flex: 1 }}
                                    onBlur={(event) => {
                                        const nextValue = event.target.value;
                                        if (nextValue === option) return;
                                        const nextEnum = [...options];
                                        nextEnum[index] = nextValue;
                                        if (!isDefault) return updateEnum(nextEnum);
                                        const nextDefaults = defaultValues.map((item) => item === option ? nextValue : item);
                                        onAutoSave(replaceVariable(editedVariables, variable.name, {
                                            enum: nextEnum,
                                            default: JSON.stringify(nextDefaults),
                                        }));
                                    }}
                                />
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={!canManage}
                                    onClick={() => {
                                        const nextEnum = options.filter((_, optionIndex) => optionIndex !== index);
                                        const nextDefaults = defaultValues.filter((item) => item !== option);
                                        onAutoSave(replaceVariable(editedVariables, variable.name, {
                                            enum: nextEnum,
                                            default: JSON.stringify(nextDefaults),
                                        }));
                                    }}
                                />
                            </div>
                        );
                    }) : <Text type="secondary">暂无可选项</Text>}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={!canManage}
                        onClick={() => updateEnum([...options, `选项${options.length + 1}`])}
                    >
                        添加可选项
                    </Button>
                </div>
            }
        >
            <Button type="link" style={{ padding: 0 }} disabled={!canManage}>
                {options.length > 0 ? `[${options.length}可选/${defaultValues.length}默认]` : '点击编辑'}
            </Button>
        </Popover>
    );
};

export default PlaybookListDefaultEditor;
