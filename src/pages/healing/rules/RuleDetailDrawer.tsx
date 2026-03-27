import React from 'react';
import { Badge, Button, Drawer, Space, Tag, Typography } from 'antd';
import {
    AimOutlined,
    BranchesOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
    formatRuleTimestamp,
    getTriggerModeConfig,
    priorityClass,
    RuleConditionsTree,
} from './ruleDisplayHelpers';

const { Text } = Typography;

interface RuleDetailDrawerProps {
    open: boolean;
    rule: AutoHealing.HealingRule | null;
    canUpdateRule: boolean;
    onClose: () => void;
    onEditRule: (rule: AutoHealing.HealingRule) => void;
}

interface RuleDetailRowProps {
    label: string;
    value: React.ReactNode;
}

const RuleDetailRow: React.FC<RuleDetailRowProps> = ({ label, value }) => (
    <div className="rule-detail-row">
        <span className="rule-detail-label">{label}</span>
        <span className="rule-detail-value">{value}</span>
    </div>
);

const RuleDrawerTitle: React.FC<{ rule: AutoHealing.HealingRule }> = ({ rule }) => (
    <Space>
        <SafetyCertificateOutlined />
        {rule.name}
        {rule.is_active ? (
            <Badge status="processing" text={<Text style={{ fontSize: 12 }}>运行中</Text>} />
        ) : <Tag>已停用</Tag>}
    </Space>
);

const RuleBasicInfoSection: React.FC<{ rule: AutoHealing.HealingRule }> = ({ rule }) => {
    const triggerMode = getTriggerModeConfig(rule.trigger_mode);

    return (
        <div className="rule-detail-card">
            <h4><SafetyCertificateOutlined />基础信息</h4>
            <RuleDetailRow label="规则名称" value={rule.name} />
            <RuleDetailRow label="描述" value={rule.description || '-'} />
            <RuleDetailRow label="优先级" value={<span className={`rule-priority-badge rule-priority-badge-${priorityClass(rule.priority)}`}>P{rule.priority}</span>} />
            <RuleDetailRow label="触发模式" value={<Tag icon={triggerMode.icon} color={triggerMode.color}>{triggerMode.label}</Tag>} />
            <RuleDetailRow label="匹配逻辑" value={<Tag color={rule.match_mode === 'all' ? 'blue' : 'purple'}>{rule.match_mode === 'all' ? 'AND 全部满足' : 'OR 满足任一'}</Tag>} />
            <RuleDetailRow label="最后运行" value={rule.last_run_at ? formatRuleTimestamp(rule.last_run_at) : '从未运行'} />
            <RuleDetailRow label="创建时间" value={formatRuleTimestamp(rule.created_at)} />
        </div>
    );
};

const RuleConditionsSection: React.FC<{ rule: AutoHealing.HealingRule }> = ({ rule }) => (
    <div className="rule-detail-card">
        <h4><AimOutlined />匹配条件</h4>
        <RuleConditionsTree conditions={rule.conditions} />
    </div>
);

const RuleFlowSection: React.FC<{ rule: AutoHealing.HealingRule }> = ({ rule }) => {
    if (!rule.flow) {
        return (
            <div className="rule-detail-card">
                <h4><BranchesOutlined />关联流程</h4>
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                    <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16, marginRight: 8 }} />
                    <Text type="warning">尚未关联自愈流程</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="rule-detail-card">
            <h4><BranchesOutlined />关联流程</h4>
            <RuleDetailRow label="流程名称" value={rule.flow.name} />
            {rule.flow.description ? <RuleDetailRow label="流程描述" value={rule.flow.description} /> : null}
            <RuleDetailRow label="流程状态" value={rule.flow.is_active ? <Badge status="success" text="启用" /> : <Badge status="default" text="停用" />} />
        </div>
    );
};

export const RuleDetailDrawer: React.FC<RuleDetailDrawerProps> = ({
    open,
    rule,
    canUpdateRule,
    onClose,
    onEditRule,
}) => {
    if (!rule) {
        return null;
    }

    return (
        <Drawer
            title={<RuleDrawerTitle rule={rule} />}
            size={600}
            open={open}
            onClose={onClose}
            destroyOnHidden
            extra={<Button icon={<EditOutlined />} disabled={!canUpdateRule} onClick={() => onEditRule(rule)}>编辑</Button>}
        >
            <RuleBasicInfoSection rule={rule} />
            <RuleConditionsSection rule={rule} />
            <RuleFlowSection rule={rule} />
        </Drawer>
    );
};
