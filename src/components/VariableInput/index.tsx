import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import ListInput from './ListInput';
import ObjectInput from './ObjectInput';
import type { VariableInputProps } from './types';
import { extractDefaultValue, inferVariableType } from './utils';

export { extractDefaultValue, inferVariableType };

const VariableInput: React.FC<VariableInputProps> = ({
    variable,
    value,
    onChange,
    disabled = false,
    size = 'middle',
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
                    value={typeof value === 'number' ? value : undefined}
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
                    value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    size={size}
                />
            );
        case 'list':
            return (
                <ListInput
                    variable={variable}
                    value={value}
                    onChange={onChange}
                />
            );
        case 'object':
        case 'dict':
            return (
                <ObjectInput
                    variable={variable}
                    value={value}
                    onChange={onChange}
                />
            );
        default:
            return (
                <Input
                    placeholder={placeholder}
                    value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    size={size}
                />
            );
    }
};

export default VariableInput;
