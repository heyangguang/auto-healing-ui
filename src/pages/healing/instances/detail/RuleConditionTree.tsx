import React from 'react';
import {
    Empty,
    Tag,
    Typography,
} from 'antd';
import {
    AppstoreOutlined,
    TagOutlined,
} from '@ant-design/icons';

type RuleConditionTreeProps = {
    conditions: unknown[];
    matchMode?: string;
};

type ConditionGroup = {
    conditions?: unknown[];
    logic?: string;
    type?: string;
};

type RuleCondition = {
    field?: string;
    operator?: string;
    value?: unknown;
};

const isGroup = (value: unknown): value is ConditionGroup => (
    Boolean(value) && typeof value === 'object' && (value as ConditionGroup).type === 'group'
);

const RuleConditionTreeNode: React.FC<{ depth: number; item: unknown }> = ({ depth, item }) => {
    if (isGroup(item)) {
        return (
            <div style={{ marginLeft: depth * 16, padding: '8px 12px', background: depth === 0 ? '#fafafa' : '#fff', border: '1px solid #f0f0f0', borderRadius: 6, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <AppstoreOutlined style={{ fontSize: 12, color: '#722ed1' }} />
                    <Tag color="purple" style={{ fontSize: 11, borderRadius: 8, margin: 0 }}>{item.logic || 'AND'}</Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.conditions?.length || 0} 个条件</Typography.Text>
                </div>
                {item.conditions?.map((subCondition, index) => (
                    <RuleConditionTreeNode key={`${depth}-${index}`} depth={depth + 1} item={subCondition} />
                ))}
            </div>
        );
    }

    const condition = item as RuleCondition;
    const displayValue = typeof condition.value === 'object' ? JSON.stringify(condition.value) : String(condition.value ?? '');

    return (
        <div style={{ marginLeft: depth * 16, padding: '6px 10px', background: '#fff', border: '1px dashed #d9d9d9', borderRadius: 4, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <TagOutlined style={{ color: '#1890ff', fontSize: 11 }} />
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{condition.field}</Tag>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{condition.operator}</Typography.Text>
            <Tag style={{ margin: 0, fontSize: 11, background: '#f6ffed', borderColor: '#b7eb8f' }}>{displayValue}</Tag>
        </div>
    );
};

const RuleConditionTree: React.FC<RuleConditionTreeProps> = ({
    conditions,
    matchMode,
}) => {
    if (conditions.length === 0) {
        return <Empty description="暂无触发条件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <>
            {conditions.map((condition, index) => (
                <React.Fragment key={index}>
                    <RuleConditionTreeNode depth={0} item={condition} />
                    {index < conditions.length - 1 && (
                        <div style={{ textAlign: 'center', margin: '4px 0' }}>
                            <Tag color="orange" style={{ fontSize: 10, borderRadius: 8 }}>
                                {matchMode === 'all' ? 'AND' : 'OR'}
                            </Tag>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </>
    );
};

export default RuleConditionTree;
