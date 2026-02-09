import React, { useState, useEffect } from 'react';
import { Input, InputNumber, Switch, Select, Tooltip, Popover, Button, Typography, Space, Checkbox } from 'antd';
import { QuestionCircleOutlined, DeleteOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * 从 Jinja2 模板语法中提取默认值
 * 例如: "{{nginx_port | default(80)}}" => "80"
 * 例如: "{{nginx_root_path | default('/usr/share/nginx/html') }}" => "/usr/share/nginx/html"
 */
export const extractDefaultValue = (defaultVal: any): string | null => {
    if (defaultVal === undefined || defaultVal === null) return null;

    // 如果是数字或布尔值，直接返回
    if (typeof defaultVal === 'number' || typeof defaultVal === 'boolean') {
        return String(defaultVal);
    }

    // 如果是数组，返回空（列表类型不需要 placeholder）
    if (Array.isArray(defaultVal)) {
        return null;
    }

    const str = String(defaultVal).trim();

    // 检查是否是 Jinja2 模板语法 {{xxx | default(...)}}
    // 支持各种空格情况和引号情况
    const jinja2Patterns = [
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*'([^']+)'\s*\)\s*\}\}/,  // 单引号
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*"([^"]+)"\s*\)\s*\}\}/,  // 双引号
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*(\d+)\s*\)\s*\}\}/,      // 纯数字
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*([^)]+)\s*\)\s*\}\}/,    // 通用匹配
    ];

    for (const pattern of jinja2Patterns) {
        const match = str.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // 如果看起来像 Jinja2 变量但没有 default，返回 null
    if (str.includes('{{') && str.includes('}}')) {
        return null;
    }

    // 如果看起来像 JSON 数组或对象，返回 null
    if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
        return null;
    }

    // 普通字符串直接返回
    return str || null;
};

/**
 * 智能推断变量类型（基于名称、默认值等）
 */
export const inferVariableType = (variable: AutoHealing.PlaybookVariable): string => {
    const name = variable.name.toLowerCase();
    const defaultVal = variable.default;

    // 优先使用后端定义的非 string 类型
    if (variable.type && variable.type !== 'string') {
        return variable.type;
    }

    // 如果有 enum 数组，就是枚举
    if (variable.enum && variable.enum.length > 0) {
        return 'enum';
    }

    // 根据名称推断
    if (name.includes('password') || name.includes('secret') || name.includes('key') || name.includes('token')) {
        return 'password';
    }
    if (name.includes('port') || name.includes('timeout') || name.includes('count') || name.includes('size') ||
        name.includes('limit') || name.includes('max') || name.includes('min') || name.includes('num') ||
        name.includes('workers') || name.includes('connections') || name.includes('processes') || name.includes('version')) {
        return 'number';
    }
    if (name.includes('enabled') || name.includes('enable') || name.includes('disabled') ||
        name.includes('is_') || name.includes('has_') || name.includes('use_') || name.includes('allow_')) {
        return 'boolean';
    }
    if (name.includes('hosts') || name.includes('servers') || name.includes('list') ||
        name.includes('tags') || name.includes('roles') || name.includes('groups')) {
        return 'list';
    }

    // 根据默认值推断
    if (typeof defaultVal === 'number') return 'number';
    if (typeof defaultVal === 'boolean') return 'boolean';
    if (Array.isArray(defaultVal)) return 'list';

    // 检查 Jinja2 默认值中的数字
    const extracted = extractDefaultValue(defaultVal);
    if (extracted && /^\d+$/.test(extracted)) {
        return 'number';
    }

    return 'string';
};

interface VariableInputProps {
    variable: AutoHealing.PlaybookVariable;
    value: any;
    onChange: (val: any) => void;
    disabled?: boolean;
    size?: 'small' | 'middle' | 'large';
}

/**
 * 根据变量类型智能渲染表单控件
 */
const VariableInput: React.FC<VariableInputProps> = ({
    variable,
    value,
    onChange,
    disabled = false,
    size = 'middle'
}) => {
    const varType = inferVariableType(variable);
    const extractedDefault = extractDefaultValue(variable.default);
    const placeholder = extractedDefault || '';

    switch (varType) {
        case 'number':
            return (
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    min={variable.min}
                    max={variable.max}
                    disabled={disabled}
                    size={size}
                />
            );
        case 'boolean':
            return (
                <Switch
                    checked={value === true || value === 'true'}
                    onChange={onChange}
                    checkedChildren="是"
                    unCheckedChildren="否"
                    disabled={disabled}
                    size={size === 'small' ? 'small' : 'default'}
                />
            );
        case 'enum': {
            const enumOptions = (variable.enum || []).map((v: string) => ({ label: v, value: v }));
            // 当value为空时，使用variable.default作为默认值
            const enumValue = value !== undefined && value !== null && value !== '' ? value : variable.default;
            return (
                <Select
                    style={{ width: '100%' }}
                    placeholder="选择"
                    options={enumOptions}
                    value={enumValue}
                    onChange={onChange}
                    disabled={disabled}
                    size={size}
                    allowClear
                />
            );
        }
        case 'password':
            return (
                <Input.Password
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    size={size}
                />
            );

        case 'list': {
            // 列表编辑器 - 如果有enum选项则显示多选checkbox，否则自由编辑
            const options = variable.enum || [];
            let listVal: string[] = [];
            try {
                if (Array.isArray(value)) {
                    listVal = value;
                } else if (typeof value === 'string') {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) listVal = parsed;
                    else listVal = [value];
                }
            } catch {
                if (typeof value === 'string') listVal = value.split(',').filter(Boolean);
            }

            // Handle case where value is undefined/null - use variable.default if available
            if (!value && !listVal.length) {
                const defaultVal = variable.default;
                if (Array.isArray(defaultVal)) {
                    listVal = defaultVal.map(v => typeof v === 'string' ? v : JSON.stringify(v));
                } else if (typeof defaultVal === 'string') {
                    try {
                        const parsed = JSON.parse(defaultVal);
                        if (Array.isArray(parsed)) {
                            listVal = parsed.map(v => typeof v === 'string' ? v : JSON.stringify(v));
                        }
                    } catch { /* ignore */ }
                }
            }

            const handleListChange = (newList: string[]) => {
                onChange(newList);
            };

            // 如果有可选项，显示多选checkbox
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
                                    onChange={(vals) => handleListChange(vals as string[])}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                                >
                                    {options.map((opt, i) => (
                                        <Checkbox key={i} value={opt}>
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
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: listVal.length ? 'inherit' : '#bfbfbf' }}>
                                {listVal.length > 0 ? `[${listVal.length}已选] ${listVal.slice(0, 2).join(', ')}${listVal.length > 2 ? '...' : ''}` : '点击选择'}
                            </span>
                            <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                        </div>
                    </Popover>
                );
            }

            // 无可选项时，保持原有的自由编辑模式
            return (
                <Popover
                    trigger="click"
                    placement="bottomLeft"
                    destroyTooltipOnHide
                    title={<span style={{ fontWeight: 500 }}>编辑列表 ({listVal.length})</span>}
                    content={
                        <div style={{ width: 300, maxHeight: 400, overflowY: 'auto' }}>
                            {listVal.length > 0 ? listVal.map((val, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <Input
                                        value={val}
                                        placeholder={`Item ${i + 1}`}
                                        style={{ flex: 1 }}
                                        onChange={e => {
                                            const newList = [...listVal];
                                            newList[i] = e.target.value;
                                            handleListChange(newList);
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            const newList = listVal.filter((_, idx) => idx !== i);
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
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ color: listVal.length ? 'inherit' : '#bfbfbf' }}>
                            {listVal.length > 0 ? `[${listVal.length} 项] ${listVal.slice(0, 2).join(', ')}${listVal.length > 2 ? '...' : ''}` : '点击编辑列表'}
                        </span>
                        <PlusOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                    </div>
                </Popover>
            );
        }

        case 'object':
        case 'dict': {
            // KV 编辑器 - 如果有enum选项则显示多选checkbox+value，否则自由编辑
            const options = variable.enum || [];
            let objData: Record<string, any> = {};
            try {
                if (typeof value === 'object' && value !== null) {
                    objData = value;
                } else if (typeof value === 'string') {
                    objData = JSON.parse(value);
                }
            } catch { /* ignore */ }

            // If no value and objData is empty, try to use variable.default
            if (!value && (!objData || Object.keys(objData).length === 0) && variable.default) {
                const defaultVal = variable.default;
                if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
                    objData = defaultVal;
                } else if (typeof defaultVal === 'string') {
                    try {
                        const parsed = JSON.parse(defaultVal);
                        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                            objData = parsed;
                        }
                    } catch { /* ignore */ }
                }
            }

            // Ensure objData is always a valid object
            if (!objData || typeof objData !== 'object') {
                objData = {};
            }

            const finalEntries = Object.entries(objData);

            const handleObjChange = (newObj: Record<string, any>) => {
                onChange(newObj);
            };

            // 如果有可选属性（enum存储key名称），显示多选checkbox + value输入
            if (options.length > 0) {
                return (
                    <Popover
                        trigger="click"
                        placement="bottomLeft"
                        destroyTooltipOnHide
                        title={<span style={{ fontWeight: 500 }}>选择对象属性 ({finalEntries.length}/{options.length})</span>}
                        content={
                            <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
                                {options.map((key, i) => {
                                    const isSelected = key in objData;
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => {
                                                    const newObj = { ...objData };
                                                    if (isSelected) {
                                                        delete newObj[key];
                                                    } else {
                                                        newObj[key] = '';
                                                    }
                                                    handleObjChange(newObj);
                                                }}
                                            />
                                            <span style={{ width: 100, fontWeight: 500, color: isSelected ? 'inherit' : '#bfbfbf' }}>{key}</span>
                                            <Input
                                                placeholder="value"
                                                value={objData[key] || ''}
                                                style={{ flex: 1 }}
                                                disabled={!isSelected}
                                                onChange={e => {
                                                    if (isSelected) {
                                                        handleObjChange({ ...objData, [key]: e.target.value });
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
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: finalEntries.length ? 'inherit' : '#bfbfbf' }}>
                                {finalEntries.length > 0 ? `{${finalEntries.length}已选} ${finalEntries.slice(0, 2).map(([k]) => k).join(', ')}${finalEntries.length > 2 ? '...' : ''}` : '点击选择'}
                            </span>
                            <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                        </div>
                    </Popover>
                );
            }

            // 无可选项时，保持原有的自由编辑模式
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
                                        onBlur={e => {
                                            const newKey = e.target.value;
                                            if (newKey !== k && newKey) {
                                                const newObj = { ...objData };
                                                delete newObj[k];
                                                newObj[newKey] = val;
                                                handleObjChange(newObj);
                                            }
                                        }}
                                    />
                                    <Input
                                        placeholder="Value"
                                        value={typeof val === 'string' ? val : JSON.stringify(val)}
                                        style={{ flex: 1 }}
                                        onChange={e => {
                                            handleObjChange({ ...objData, [k]: e.target.value });
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            const newObj = { ...objData };
                                            delete newObj[k];
                                            handleObjChange(newObj);
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
                                    handleObjChange({ ...objData, [newKey]: '' });
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
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ color: finalEntries.length ? 'inherit' : '#bfbfbf' }}>
                            {finalEntries.length > 0 ? `{ ${finalEntries.length} 个属性 }` : '点击编辑对象'}
                        </span>
                        <PlusOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                    </div>
                </Popover>
            );
        }

        default: // string
            return (
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    size={size}
                />
            );
    }
};

export default VariableInput;
