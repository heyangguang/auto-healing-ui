import React from 'react';
import { Button, Checkbox, Input, Popover, Typography } from 'antd';
import { CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { toJsonObject } from '@/utils/jsonValue';
import { parseObjectValue } from './utils';
import type { ObjectInputProps } from './types';

const { Text } = Typography;

const ObjectInput: React.FC<ObjectInputProps> = ({ variable, value, onChange }) => {
    const options = variable.enum || [];
    const objData = parseObjectValue(value, variable.default);
    const finalEntries = Object.entries(objData);

    const handleObjChange = (newObj: AutoHealing.JsonObject) => {
        onChange(newObj);
    };

    if (options.length > 0) {
        return (
            <Popover
                trigger="click"
                placement="bottomLeft"
                destroyTooltipOnHide
                title={<span style={{ fontWeight: 500 }}>选择对象属性 ({finalEntries.length}/{options.length})</span>}
                content={
                    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
                        {options.map((key) => {
                            const isSelected = key in objData;
                            return (
                                <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => {
                                            const newObj = { ...objData };
                                            if (isSelected) {
                                                delete newObj[key];
                                            } else {
                                                newObj[key] = '';
                                            }
                                            handleObjChange(toJsonObject(newObj as Record<string, unknown>));
                                        }}
                                    />
                                    <span style={{ width: 100, fontWeight: 500, color: isSelected ? 'inherit' : '#bfbfbf' }}>{key}</span>
                                    <Input
                                        placeholder="value"
                                        value={typeof objData[key] === 'string' ? objData[key] : objData[key] == null ? '' : JSON.stringify(objData[key])}
                                        style={{ flex: 1 }}
                                        disabled={!isSelected}
                                        onChange={(e) => {
                                            if (isSelected) {
                                                handleObjChange(toJsonObject({ ...objData, [key]: e.target.value } as Record<string, unknown>));
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                }
            >
                <div style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 2,
                    padding: '4px 11px',
                    cursor: 'pointer',
                    minHeight: 32,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ color: finalEntries.length ? 'inherit' : '#bfbfbf' }}>
                        {finalEntries.length > 0 ? `{${finalEntries.length}已选} ${finalEntries.slice(0, 2).map(([k]) => k).join(', ')}${finalEntries.length > 2 ? '...' : ''}` : '点击选择'}
                    </span>
                    <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                </div>
            </Popover>
        );
    }

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            destroyTooltipOnHide
            title={<span style={{ fontWeight: 500 }}>编辑对象属性 ({finalEntries.length})</span>}
            content={
                <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
                    {finalEntries.length > 0 ? finalEntries.map(([k, val]) => (
                        <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Input
                                placeholder="Key"
                                defaultValue={k}
                                style={{ width: 120 }}
                                onBlur={(e) => {
                                    const newKey = e.target.value;
                                    if (newKey !== k && newKey) {
                                        const newObj = { ...objData };
                                        delete newObj[k];
                                        newObj[newKey] = val;
                                        handleObjChange(toJsonObject(newObj as Record<string, unknown>));
                                    }
                                }}
                            />
                            <Input
                                placeholder="Value"
                                value={typeof val === 'string' ? val : JSON.stringify(val)}
                                style={{ flex: 1 }}
                                onChange={(e) => {
                                    handleObjChange(toJsonObject({ ...objData, [k]: e.target.value } as Record<string, unknown>));
                                }}
                            />
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    const newObj = { ...objData };
                                    delete newObj[k];
                                    handleObjChange(toJsonObject(newObj as Record<string, unknown>));
                                }}
                            />
                        </div>
                    )) : <Text type="secondary" style={{ display: 'block', marginBottom: 8, padding: 4 }}>暂无属性</Text>}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{ width: '100%' }}
                        onClick={() => {
                            const newKey = `key${finalEntries.length + 1}`;
                            handleObjChange(toJsonObject({ ...objData, [newKey]: '' } as Record<string, unknown>));
                        }}
                    >
                        添加属性
                    </Button>
                </div>
            }
        >
            <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: 2,
                padding: '4px 11px',
                cursor: 'pointer',
                minHeight: 32,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ color: finalEntries.length ? 'inherit' : '#bfbfbf' }}>
                    {finalEntries.length > 0 ? `{ ${finalEntries.length} 个属性 }` : '点击编辑对象'}
                </span>
                <PlusOutlined style={{ fontSize: 12, color: '#1890ff' }} />
            </div>
        </Popover>
    );
};

export default ObjectInput;
