
import React from 'react';
import { Space, Select, Input, Button, Row, Col, Card, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined, UngroupOutlined, GroupOutlined } from '@ant-design/icons';

const FIELD_SUGGESTIONS = [
    { value: 'title', label: '工单标题 (title)' },
    { value: 'description', label: '工单描述 (description)' },
    { value: 'severity', label: '严重程度 (severity)' },
    { value: 'priority', label: '优先级 (priority)' },
    { value: 'status', label: '状态 (status)' },
    { value: 'category', label: '类别 (category)' },
    { value: 'affected_ci', label: '受影响的配置项 (affected_ci)' },
    { value: 'affected_service', label: '受影响的服务 (affected_service)' },
    { value: 'assignee', label: '处理人 (assignee)' },
    { value: 'reporter', label: '上报人 (reporter)' },
    { value: 'source_plugin_name', label: '来源插件名称 (source_plugin_name)' },
];

interface ConditionBuilderProps {
    value?: AutoHealing.HealingRuleCondition[];
    onChange?: (value: AutoHealing.HealingRuleCondition[]) => void;
    depth?: number;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ value = [], onChange, depth = 0 }) => {
    const keyedConditions = React.useMemo(() => {
        const counts = new Map<string, number>();
        return value.map((item) => {
            const baseKey = item.type === 'group'
                ? `group-${item.logic}-${item.conditions?.length || 0}`
                : `condition-${item.field}-${item.operator}-${String(item.value)}`;
            const count = (counts.get(baseKey) || 0) + 1;
            counts.set(baseKey, count);
            return { item, key: `${baseKey}-${count}` };
        });
    }, [value]);
    const handleChange = (index: number, changes: Partial<AutoHealing.HealingRuleCondition>) => {
        const newValue = [...value];
        newValue[index] = { ...newValue[index], ...changes };
        onChange?.(newValue);
    };

    const handleAdd = () => {
        onChange?.([...value, { type: 'condition', field: '', operator: 'contains', value: '' }]);
    };

    const handleAddGroup = () => {
        onChange?.([...value, { type: 'group', logic: 'AND', conditions: [{ type: 'condition', field: '', operator: 'contains', value: '' }] }]);
    };

    const handleRemove = (index: number) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange?.(newValue);
    };

    // Limit nesting depth to prevent UI chaos
    const MAX_DEPTH = 3;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keyedConditions.map(({ item, key }, index) => (
                <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {/* Logic Connector for items > 0 */}
                    {/* Actually logic is defined by parent's match_mode or group logic. 
                        Here we just render the list. The parent container handles the visual grouping. 
                    */}

                    <div style={{ flex: 1 }}>
                        {item.type === 'group' ? (
                            <Card
                                size="small"
                                style={{ background: '#f9f9f9', border: '1px dashed #d9d9d9' }}
                                styles={{ body: { padding: 8 } }}
                            >
                                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <GroupOutlined />
                                    <span>组合逻辑:</span>
                                    <Select
                                        value={item.logic}
                                        onChange={v => handleChange(index, { logic: v })}
                                        options={[
                                            { label: '必须满足所有 (AND)', value: 'AND' },
                                            { label: '满足任一即可 (OR)', value: 'OR' },
                                        ]}
                                        style={{ width: 160 }}
                                        size="small"
                                    />
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(index)} size="small">移除组合</Button>
                                </div>
                                <ConditionBuilder
                                    value={item.conditions}
                                    onChange={v => handleChange(index, { conditions: v })}
                                    depth={depth + 1}
                                />
                            </Card>
                        ) : (
                            <Row gutter={8}>
                                <Col span={8}>
                                    <AutoComplete
                                        options={FIELD_SUGGESTIONS}
                                        placeholder="字段 (支持 raw_data 自定义字段)"
                                        value={item.field}
                                        onChange={v => handleChange(index, { field: v })}
                                        filterOption={(inputValue, option) =>
                                            option?.value?.toUpperCase().includes(inputValue.toUpperCase()) ?? false
                                        }
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Select
                                        value={item.operator}
                                        onChange={v => handleChange(index, { operator: v })}
                                        style={{ width: '100%' }}
                                        options={[
                                            { value: 'equals', label: '等于 (=)' },
                                            { value: 'contains', label: '包含 (contains)' },
                                            { value: 'regex', label: '正则 (Regex)' },
                                            { value: 'gt', label: '大于 (>)' },
                                            { value: 'lt', label: '小于 (<)' },
                                            { value: 'in', label: '在列表中 (In)' },
                                        ]}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Input
                                        placeholder="值"
                                        value={item.value}
                                        onChange={e => handleChange(index, { value: e.target.value })}
                                    />
                                </Col>
                                <Col span={2}>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(index)} />
                                </Col>
                            </Row>
                        )}
                    </div>
                </div>
            ))}

            <Space>
                <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />} size="small">
                    添加条件
                </Button>
                {depth < MAX_DEPTH && (
                    <Button type="dashed" onClick={handleAddGroup} icon={<UngroupOutlined />} size="small">
                        添加条件组
                    </Button>
                )}
            </Space>
        </div>
    );
};
