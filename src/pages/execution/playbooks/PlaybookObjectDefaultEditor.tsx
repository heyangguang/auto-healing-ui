import React from 'react';
import { Button, Checkbox, Input, Popover, Typography } from 'antd';
import {
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {
    parseDefaultObject,
    replaceVariable,
} from './playbookVariableHelpers';

const { Text } = Typography;

type PlaybookObjectDefaultEditorProps = {
    canManage: boolean;
    editedVariables: AutoHealing.PlaybookVariable[];
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    parsedDefault: string;
    saveDefault: (nextValue: unknown) => void;
    variable: AutoHealing.PlaybookVariable;
};

const PlaybookObjectDefaultEditor: React.FC<PlaybookObjectDefaultEditorProps> = ({
    canManage,
    editedVariables,
    onAutoSave,
    parsedDefault,
    saveDefault,
    variable,
}) => {
    const options = variable.enum || [];
    const defaultObject = parsedDefault ? parseDefaultObject(parsedDefault) : {};
    const selectedKeys = Object.keys(defaultObject);

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            title={<span style={{ fontWeight: 500 }}>编辑对象可选属性</span>}
            content={
                <div style={{ width: 360 }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>勾选的属性将包含在默认值中</div>
                    {options.length > 0 ? options.map((option, index) => {
                        const isSelected = option in defaultObject;
                        return (
                            <div key={`${variable.name}-${option}-${index}`} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <Checkbox
                                    checked={isSelected}
                                    disabled={!canManage}
                                    onChange={() => {
                                        const nextObject = { ...defaultObject };
                                        if (isSelected) delete nextObject[option];
                                        else nextObject[option] = '';
                                        saveDefault(JSON.stringify(nextObject));
                                    }}
                                />
                                <Input
                                    placeholder="key"
                                    defaultValue={option}
                                    style={{ width: 100 }}
                                    onBlur={(event) => {
                                        const nextKey = event.target.value;
                                        if (nextKey === option) return;
                                        const nextEnum = [...options];
                                        nextEnum[index] = nextKey;
                                        if (!isSelected) {
                                            onAutoSave(replaceVariable(editedVariables, variable.name, { enum: nextEnum }));
                                            return;
                                        }
                                        const nextObject = { ...defaultObject };
                                        const previousValue = nextObject[option];
                                        delete nextObject[option];
                                        nextObject[nextKey] = previousValue;
                                        onAutoSave(replaceVariable(editedVariables, variable.name, {
                                            enum: nextEnum,
                                            default: JSON.stringify(nextObject),
                                        }));
                                    }}
                                />
                                <Input
                                    placeholder="value"
                                    defaultValue={defaultObject[option] || ''}
                                    style={{ flex: 1 }}
                                    onBlur={(event) => {
                                        if (!isSelected || event.target.value === defaultObject[option]) return;
                                        saveDefault(JSON.stringify({
                                            ...defaultObject,
                                            [option]: event.target.value,
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
                                        const nextObject = { ...defaultObject };
                                        delete nextObject[option];
                                        onAutoSave(replaceVariable(editedVariables, variable.name, {
                                            enum: nextEnum,
                                            default: JSON.stringify(nextObject),
                                        }));
                                    }}
                                />
                            </div>
                        );
                    }) : <Text type="secondary">暂无可选属性</Text>}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={!canManage}
                        onClick={() => {
                            onAutoSave(replaceVariable(editedVariables, variable.name, {
                                enum: [...options, `key${options.length + 1}`],
                            }));
                        }}
                    >
                        添加可选属性
                    </Button>
                </div>
            }
        >
            <Button type="link" style={{ padding: 0 }} disabled={!canManage}>
                {options.length > 0 ? `{${options.length}可选/${selectedKeys.length}默认}` : '点击编辑'}
            </Button>
        </Popover>
    );
};

export default PlaybookObjectDefaultEditor;
