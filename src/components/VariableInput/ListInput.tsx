import React from 'react';
import { Button, Checkbox, Input, Popover, Typography } from 'antd';
import { CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { parseListValue } from './utils';
import type { ListInputProps } from './types';

const { Text } = Typography;
type CheckboxValue = string | number | boolean;

const ListInput: React.FC<ListInputProps> = ({ variable, value, onChange }) => {
    const options = variable.enum || [];
    const listVal = parseListValue(value, variable.default);
    const listEntries = React.useMemo(() => {
        const valueCounts = new Map<string, number>();
        return listVal.map((item, index) => {
            const count = (valueCounts.get(item) || 0) + 1;
            valueCounts.set(item, count);
            return {
                entryKey: `${item}-${count}`,
                index,
                value: item,
            };
        });
    }, [listVal]);

    const handleListChange = (newList: string[]) => {
        onChange(newList);
    };

    if (options.length > 0) {
        return (
            <Popover
                trigger="click"
                placement="bottomLeft"
                destroyTooltipOnHide
                title={<span style={{ fontWeight: 500 }}>选择列表项 ({listVal.length}/{options.length})</span>}
                content={
                    <div style={{ width: 280, maxHeight: 400, overflowY: 'auto' }}>
                        <Checkbox.Group
                            value={listVal}
                            onChange={(vals: CheckboxValue[]) => handleListChange(vals.map((v) => String(v)))}
                            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                            {options.map((opt) => (
                                <Checkbox key={String(opt)} value={opt}>
                                    {opt}
                                </Checkbox>
                            ))}
                        </Checkbox.Group>
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
                    <span style={{ color: listVal.length ? 'inherit' : '#bfbfbf' }}>
                        {listVal.length > 0 ? `[${listVal.length}已选] ${listVal.slice(0, 2).join(', ')}${listVal.length > 2 ? '...' : ''}` : '点击选择'}
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
            title={<span style={{ fontWeight: 500 }}>编辑列表 ({listVal.length})</span>}
            content={
                <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
                    {listEntries.length > 0 ? listEntries.map((entry) => (
                        <div key={entry.entryKey} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Input
                                value={entry.value}
                                placeholder={`Item ${entry.index + 1}`}
                                style={{ flex: 1 }}
                                onChange={(e) => {
                                    const newList = [...listVal];
                                    newList[entry.index] = e.target.value;
                                    handleListChange(newList);
                                }}
                            />
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    const newList = listVal.filter((_, idx) => idx !== entry.index);
                                    handleListChange(newList);
                                }}
                            />
                        </div>
                    )) : <Text type="secondary" style={{ display: 'block', marginBottom: 8, padding: 4 }}>暂无列表项</Text>}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{ width: '100%' }}
                        onClick={() => handleListChange([...listVal, ''])}
                    >
                        添加项
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
                <span style={{ color: listVal.length ? 'inherit' : '#bfbfbf' }}>
                    {listVal.length > 0 ? `[${listVal.length} 项] ${listVal.slice(0, 2).join(', ')}${listVal.length > 2 ? '...' : ''}` : '点击编辑列表'}
                </span>
                <PlusOutlined style={{ fontSize: 12, color: '#1890ff' }} />
            </div>
        </Popover>
    );
};

export default ListInput;
