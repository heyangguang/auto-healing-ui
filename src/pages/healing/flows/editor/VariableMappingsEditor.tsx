import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Typography, Popconfirm, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined, SwapRightOutlined } from '@ant-design/icons';
import ExpressionGuide from './ExpressionGuide';

const { Text } = Typography;

interface VariableMapping {
    id?: string;       // 稳定唯一标识符
    key: string;       // Ansible 变量名
    expression: string;  // 表达式
}

interface VariableMappingsEditorProps {
    value?: Record<string, string>;  // { ansible_var: expression }
    onChange?: (value: Record<string, string>) => void;
    contextFields?: string[];  // 可选的上下文字段提示
}

// 生成唯一 ID
const generateId = () => `vm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 常用的上下文字段建议
const DEFAULT_CONTEXT_SUGGESTIONS = [
    'incident.title',
    'incident.description',
    'incident.severity',
    'incident.affected_ci',
    'incident.affected_service',
    'incident.raw_data',
    'hosts',
    'validated_hosts',
    'validated_hosts[0].ip_address',
    'validated_hosts[0].hostname',
    'execution_result.status',
    'join(validated_hosts, \',\')',
    'len(validated_hosts)',
    'first(validated_hosts).ip_address',
];

const VariableMappingsEditor: React.FC<VariableMappingsEditorProps> = ({
    value = {},
    onChange,
    contextFields = DEFAULT_CONTEXT_SUGGESTIONS
}) => {
    // 智能合并 ID：基于索引复用 ID，确保修改 Key 时不丢失焦点
    const mergeIds = useCallback((externalValue: Record<string, string>, currentMappings: VariableMapping[]) => {
        const entries = Object.entries(externalValue || {});
        return entries.map(([key, expression], index) => {
            // 尝试复用本地对应位置的 ID
            if (currentMappings && index < currentMappings.length && currentMappings[index].id) {
                return { id: currentMappings[index].id, key, expression: String(expression) };
            }
            return { id: generateId(), key, expression: String(expression) };
        });
    }, []);

    const [mappings, setMappings] = useState<VariableMapping[]>(() => mergeIds(value, []));

    // 用于防抖的 timer
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        // 当外部 value 变化时，合并 ID 并更新本地状态
        setMappings(prev => {
            const newMappings = mergeIds(value || {}, prev);

            // 深度比较：如果 ID 和内容都一样，直接返回旧对象，阻止 re-render
            if (JSON.stringify(newMappings) === JSON.stringify(prev)) {
                return prev;
            }

            return newMappings;
        });
    }, [value, mergeIds]);

    const notifyParent = useCallback((newMappings: VariableMapping[]) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const result: Record<string, string> = {};
            newMappings.forEach(m => {
                if (m.key) { // 允许空表达式，但 Key 必须有
                    result[m.key] = m.expression;
                }
            });
            onChange?.(result);
            debounceTimerRef.current = null;
        }, 300); // 300ms 防抖
    }, [onChange]);

    // 组件卸载时清理 timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleAdd = () => {
        setMappings(prev => {
            const newMappings = [...prev, { id: generateId(), key: '', expression: '' }];
            // 添加时不需要防抖，但也无妨
            notifyParent(newMappings);
            return newMappings;
        });
    };

    const handleRemove = (index: number) => {
        setMappings(prev => {
            const newMappings = prev.filter((_, i) => i !== index);
            notifyParent(newMappings);
            return newMappings;
        });
    };

    const handleChange = (index: number, field: 'key' | 'expression', val: string) => {
        setMappings(prev => {
            const newMappings = [...prev];
            newMappings[index] = { ...newMappings[index], [field]: val };
            notifyParent(newMappings);
            return newMappings;
        });
    };

    // 构建 AutoComplete 选项
    const expressionOptions = contextFields.map(f => ({ value: f }));

    return (
        <div>
            {mappings.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    padding: '0 4px',
                    fontSize: 12,
                    color: '#8c8c8c'
                }}>
                    <span style={{ flex: 1 }}>Ansible 变量</span>
                    <span style={{ width: 24 }} />
                    <span style={{ flex: 2 }}>来源 (Context 表达式)</span>
                    <span style={{ width: 32 }} />
                </div>
            )}
            {mappings.map((mapping, index) => (
                <div
                    key={mapping.id} // 使用稳定的 ID 而不是 index
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                    }}
                >
                    <Input
                        placeholder="变量名"
                        value={mapping.key}
                        onChange={(e) => handleChange(index, 'key', e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <SwapRightOutlined style={{ color: '#8c8c8c' }} />
                    <AutoComplete
                        options={expressionOptions}
                        placeholder="表达式或字段"
                        value={mapping.expression}
                        onChange={(val) => handleChange(index, 'expression', val)}
                        style={{ flex: 2 }}
                        filterOption={(inputValue, option) =>
                            option?.value?.toLowerCase().includes(inputValue.toLowerCase()) || false
                        }
                    />
                    <Popconfirm
                        title="删除此映射？"
                        onConfirm={() => handleRemove(index)}
                        okText="删除"
                        cancelText="取消"
                    >
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Button
                    type="dashed"
                    style={{ flex: 1 }}
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    添加变量映射
                </Button>
            </div>

            <ExpressionGuide buttonText="查看表达式语法指南" />

            {mappings.length === 0 && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    将上下文数据映射为 Ansible Playbook 的 extra_vars
                </Text>
            )}
        </div>
    );
};

export default VariableMappingsEditor;
