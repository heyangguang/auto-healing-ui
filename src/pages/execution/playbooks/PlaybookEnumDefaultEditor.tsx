import React from 'react';
import { Button, Input, Popover, Tooltip, Typography } from 'antd';
import {
    CheckOutlined,
    DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { replaceVariable } from './playbookVariableHelpers';

const { Text } = Typography;

type PlaybookEnumDefaultEditorProps = {
    canManage: boolean;
    currentDefault: string;
    editedVariables: AutoHealing.PlaybookVariable[];
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    saveDefault: (nextValue: unknown) => void;
    variable: AutoHealing.PlaybookVariable;
};

const buildNextEnumPatch = (
    enumValues: string[],
    index: number,
    nextValue: string,
    isDefault: boolean,
): Partial<AutoHealing.PlaybookVariable> => {
    const nextEnum = [...enumValues];
    nextEnum[index] = nextValue;
    if (!isDefault) {
        return { enum: nextEnum };
    }
    return { enum: nextEnum, default: nextValue };
};

const PlaybookEnumDefaultEditor: React.FC<PlaybookEnumDefaultEditorProps> = ({
    canManage,
    currentDefault,
    editedVariables,
    onAutoSave,
    saveDefault,
    variable,
}) => {
    const enumValues = variable.enum || [];

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            destroyOnHidden
            title={<span style={{ fontWeight: 500 }}>编辑枚举值</span>}
            content={
                <div style={{ width: 280 }}>
                    {enumValues.length > 0 ? enumValues.map((enumValue, index) => {
                        const isDefault = enumValue === currentDefault;
                        return (
                            <div key={`${variable.name}-${index}-${enumValue}`} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <Input
                                    key={`${variable.name}-${index}-${enumValue}`}
                                    defaultValue={enumValue}
                                    style={{ flex: 1 }}
                                    onBlur={(event) => {
                                        const nextValue = event.target.value;
                                        if (nextValue === enumValue) return;
                                        const patch = buildNextEnumPatch(enumValues, index, nextValue, isDefault);
                                        onAutoSave(replaceVariable(editedVariables, variable.name, patch));
                                    }}
                                />
                                <Tooltip title={isDefault ? '当前默认值' : '设为默认'}>
                                    <Button
                                        size="small"
                                        type={isDefault ? 'primary' : 'default'}
                                        icon={<CheckOutlined />}
                                        style={{ opacity: isDefault ? 1 : 0.5 }}
                                        onClick={() => {
                                            if (!isDefault) saveDefault(enumValue);
                                        }}
                                    />
                                </Tooltip>
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        const nextEnum = enumValues.filter((_, enumIndex) => enumIndex !== index);
                                        const patch: Partial<AutoHealing.PlaybookVariable> = { enum: nextEnum };
                                        if (isDefault) patch.default = undefined;
                                        onAutoSave(replaceVariable(editedVariables, variable.name, patch));
                                    }}
                                />
                            </div>
                        );
                    }) : <Text type="secondary">暂无枚举值</Text>}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={!canManage}
                        onClick={() => {
                            onAutoSave(replaceVariable(editedVariables, variable.name, {
                                enum: [...enumValues, `选项${enumValues.length + 1}`],
                            }));
                        }}
                    >
                        添加枚举值
                    </Button>
                </div>
            }
        >
            <Button type="link" style={{ padding: 0 }} disabled={!canManage}>
                {enumValues.length > 0 ? (
                    <span>
                        {enumValues.join(' / ')}
                        {currentDefault && <span style={{ color: '#52c41a', marginLeft: 8 }}>(默认: {currentDefault})</span>}
                    </span>
                ) : '点击编辑'}
            </Button>
        </Popover>
    );
};

export default PlaybookEnumDefaultEditor;
