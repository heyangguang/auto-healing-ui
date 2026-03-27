import React from 'react';
import { Tag, Typography } from 'antd';
import { ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const DEFAULT_TRIGGER_MODE = {
    label: '-',
    color: 'default',
    icon: null,
};

export const TRIGGER_MODE_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    auto: { label: '自动', color: 'blue', icon: <ThunderboltOutlined /> },
    manual: { label: '人工', color: 'orange', icon: <UserOutlined /> },
};

export const getTriggerModeConfig = (triggerMode?: string) =>
    (triggerMode ? TRIGGER_MODE_MAP[triggerMode] : null) || {
        ...DEFAULT_TRIGGER_MODE,
        label: triggerMode || DEFAULT_TRIGGER_MODE.label,
    };

export const priorityClass = (priority: number) =>
    priority >= 90 ? 'high' : priority >= 50 ? 'medium' : 'low';

export const countRuleConditions = (
    conditions: AutoHealing.HealingRuleCondition[] = [],
): number => conditions.reduce((total, condition) => {
    if (condition.type === 'group' && condition.conditions) {
        return total + countRuleConditions(condition.conditions);
    }
    return total + 1;
}, 0);

export const formatRuleLastRunRelative = (lastRunAt?: string | null) =>
    lastRunAt ? dayjs(lastRunAt).fromNow() : '从未';

export const formatRuleTimestamp = (value: string) =>
    dayjs(value).format('YYYY-MM-DD HH:mm:ss');

export const formatRuleUpdatedDate = (updatedAt?: string | null) =>
    updatedAt ? new Date(updatedAt).toLocaleDateString() : '-';

interface RuleConditionNodeProps {
    condition: AutoHealing.HealingRuleCondition;
    level: number;
    nodeKey: string;
}

const RuleConditionNode: React.FC<RuleConditionNodeProps> = ({ condition, level, nodeKey }) => {
    if (condition.type === 'group' && condition.conditions) {
        return (
            <div className="rule-condition-group" style={{ marginLeft: level * 12 }}>
                <div className="rule-condition-group-header">{condition.logic || 'AND'} 组</div>
                <RuleConditionsTree conditions={condition.conditions} level={level + 1} />
            </div>
        );
    }

    return (
        <div key={nodeKey} className="rule-condition-item" style={{ marginLeft: level * 12 }}>
            <Tag color="blue" style={{ margin: 0 }}>{condition.field}</Tag>
            <Tag style={{ margin: 0 }}>{condition.operator}</Tag>
            <Text style={{ fontSize: 12 }} ellipsis>{String(condition.value ?? '')}</Text>
        </div>
    );
};

interface RuleConditionsTreeProps {
    conditions?: AutoHealing.HealingRuleCondition[];
    level?: number;
}

export const RuleConditionsTree: React.FC<RuleConditionsTreeProps> = ({
    conditions = [],
    level = 0,
}) => {
    if (conditions.length === 0) {
        return <Text type="secondary" style={{ fontSize: 12 }}>无触发条件</Text>;
    }

    return (
        <>
            {conditions.map((condition, index) => (
                <RuleConditionNode
                    key={`${level}-${index}-${condition.type}`}
                    condition={condition}
                    level={level}
                    nodeKey={`${level}-${index}-${condition.type}`}
                />
            ))}
        </>
    );
};
