import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined, BulbOutlined } from '@ant-design/icons';
import ExpressionGuide from './ExpressionGuide';

const { Text } = Typography;

interface ComputeOperation {
    id?: string; // 稳定唯一标识符
    output_key: string;
    expression: string;
}

interface ComputeOperationsEditorProps {
    value?: ComputeOperation[];
    onChange?: (value: ComputeOperation[]) => void;
}

// 生成唯一 ID
const generateId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ComputeOperationsEditor: React.FC<ComputeOperationsEditorProps> = ({
    value = [],
    onChange
}) => {
    // 智能合并 ID：优先使用外部 ID，其次复用本地对应位置 ID，最后生成新 ID
    const mergeIds = useCallback((externalOps: ComputeOperation[], currentOps: ComputeOperation[]) => {
        return externalOps.map((op, index) => {
            if (op.id) return op; // 外部已有 ID，直接使用
            // 外部无 ID，尝试复用本地对应位置的 ID (假设顺序未变)
            if (currentOps && index < currentOps.length && currentOps[index].id) {
                return { ...op, id: currentOps[index].id };
            }
            return { ...op, id: generateId() };
        });
    }, []);

    const [operations, setOperations] = useState<ComputeOperation[]>(() => mergeIds(value, []));

    // 用于防抖的 timer
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        // 当外部 value 变化时，合并 ID 并更新本地状态
        setOperations(prev => {
            const newOps = mergeIds(value || [], prev);

            // 深度比较：如果 ID 和内容都一样，直接返回旧对象，阻止 re-render
            if (JSON.stringify(newOps) === JSON.stringify(prev)) {
                return prev;
            }

            return newOps;
        });
    }, [value, mergeIds]);

    // 防抖通知父组件
    const notifyParent = useCallback((newOps: ComputeOperation[]) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            onChange?.(newOps);
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
        setOperations(prev => {
            const newOps = [...prev, { id: generateId(), output_key: '', expression: '' }];
            // 添加操作不需要防抖，立即响应 UI，可以只有在编辑内容时才通知
            // 但为了数据一致性，这里也通知
            notifyParent(newOps);
            return newOps;
        });
    };

    const handleRemove = (index: number) => {
        setOperations(prev => {
            const newOps = prev.filter((_, i) => i !== index);
            notifyParent(newOps);
            return newOps;
        });
    };

    const handleChange = (index: number, field: 'output_key' | 'expression', val: string) => {
        setOperations(prev => {
            const newOps = [...prev];
            newOps[index] = { ...newOps[index], [field]: val };
            notifyParent(newOps); // 触发防抖更新
            return newOps;
        });
    };

    return (
        <div>
            {/* 帮助文档 */}
            <div style={{ marginBottom: 12 }}>
                <ExpressionGuide />
            </div>

            {/* 操作列表 */}
            {operations.map((op, index) => (
                <div
                    key={op.id} // 使用稳定的 ID 而不是 index
                    style={{
                        padding: 16,
                        marginBottom: 12,
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #f0f0f0',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text type="secondary">
                            <HolderOutlined style={{ marginRight: 6 }} />
                            操作 {index + 1}
                        </Text>
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(index)}
                        />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, color: '#333', marginBottom: 4, display: 'block' }}>
                            输出变量名 <Text type="danger">*</Text>
                        </Text>
                        <Input
                            placeholder="例如: target_ips"
                            value={op.output_key}
                            onChange={(e) => handleChange(index, 'output_key', e.target.value)}
                        />
                    </div>
                    <div>
                        <Text style={{ fontSize: 13, color: '#333', marginBottom: 4, display: 'block' }}>
                            表达式 <Text type="danger">*</Text>
                        </Text>
                        <Input.TextArea
                            placeholder="例如: incident.title 或 join(hosts, ',')"
                            value={op.expression}
                            onChange={(e) => handleChange(index, 'expression', e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 3 }}
                        />
                    </div>
                </div>
            ))}

            <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={handleAdd}
            >
                添加计算操作
            </Button>

            {/* 空状态提示 */}
            {operations.length === 0 && (
                <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#e6f7ff',
                    borderRadius: 6,
                    border: '1px solid #91d5ff',
                    fontSize: 12
                }}>
                    <BulbOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                    <Text>
                        计算节点用于从上下文提取数据并生成新变量。点击上方按钮查看语法指南。
                    </Text>
                </div>
            )}
        </div>
    );
};

export default ComputeOperationsEditor;
