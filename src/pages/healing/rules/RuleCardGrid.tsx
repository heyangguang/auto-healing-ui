import React from 'react';
import {
    Button,
    Col,
    Empty,
    Pagination,
    Popconfirm,
    Row,
    Space,
    Spin,
    Switch,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import {
    AimOutlined,
    BranchesOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    FireOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    countRuleConditions,
    formatRuleLastRunRelative,
    formatRuleUpdatedDate,
    priorityClass,
} from './ruleDisplayHelpers';

const { Text } = Typography;

interface RuleCardGridProps {
    rules: AutoHealing.HealingRule[];
    loading: boolean;
    total: number;
    page: number;
    pageSize: number;
    actionLoadingRuleId: string | null;
    canCreateRule: boolean;
    canUpdateRule: boolean;
    canDeleteRule: boolean;
    onCreateRule: () => void;
    onCardClick: (rule: AutoHealing.HealingRule) => void;
    onEditRule: (rule: AutoHealing.HealingRule) => void;
    onDeleteRule: (
        event: React.MouseEvent<HTMLElement> | undefined,
        rule: AutoHealing.HealingRule,
    ) => void | Promise<void>;
    onToggleRule: (rule: AutoHealing.HealingRule, checked: boolean) => void | Promise<void>;
    onPageChange: (page: number, pageSize: number) => void;
}

interface RuleCardProps {
    rule: AutoHealing.HealingRule;
    actionLoadingRuleId: string | null;
    canUpdateRule: boolean;
    canDeleteRule: boolean;
    onCardClick: (rule: AutoHealing.HealingRule) => void;
    onEditRule: (rule: AutoHealing.HealingRule) => void;
    onDeleteRule: (
        event: React.MouseEvent<HTMLElement> | undefined,
        rule: AutoHealing.HealingRule,
    ) => void | Promise<void>;
    onToggleRule: (rule: AutoHealing.HealingRule, checked: boolean) => void | Promise<void>;
}

const RuleCardHeader: React.FC<Pick<RuleCardProps, 'rule'>> = ({ rule }) => (
    <div className="rule-card-header">
        <div className="rule-card-title">{rule.name || '未命名规则'}</div>
        <Space size={4}>
            <span className={`rule-trigger-tag rule-trigger-tag-${rule.trigger_mode || 'auto'}`}>
                {rule.trigger_mode === 'manual' ? <><UserOutlined /> 人工</> : <><ThunderboltOutlined /> 自动</>}
            </span>
            {rule.is_active ? (
                <span className="rule-card-status-active">
                    <CheckCircleOutlined /> 启用
                </span>
            ) : <span className="rule-card-status-inactive">已停用</span>}
        </Space>
    </div>
);

const RuleFlowNotice: React.FC<Pick<RuleCardProps, 'rule'>> = ({ rule }) => {
    if (rule.flow) {
        return (
            <div className="rule-card-flow">
                <BranchesOutlined style={{ fontSize: 10, flexShrink: 0 }} />
                <span className="rule-card-flow-text">{rule.flow.name}</span>
            </div>
        );
    }

    return (
        <div className="rule-card-flow-warning">
            <ExclamationCircleOutlined style={{ fontSize: 10 }} />
            <span>未关联流程</span>
        </div>
    );
};

const RuleInfoGrid: React.FC<Pick<RuleCardProps, 'rule'>> = ({ rule }) => {
    const conditionCount = countRuleConditions(rule.conditions || []);
    const priorityLevel = priorityClass(rule.priority);

    return (
        <div className="rule-card-info-grid">
            <span className="rule-card-info-item">
                <span className={`rule-priority-badge rule-priority-badge-${priorityLevel}`}>
                    {priorityLevel === 'high' ? <FireOutlined /> : <SafetyCertificateOutlined />}
                    P{rule.priority}
                </span>
            </span>
            <span className="rule-card-info-item"><AimOutlined /><span className="info-value">{conditionCount}</span> 条件</span>
            <span className="rule-card-info-item">
                <Tag color={rule.match_mode === 'all' ? 'blue' : 'purple'} style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 4px' }}>
                    {rule.match_mode === 'all' ? 'AND' : 'OR'}
                </Tag>
                {rule.match_mode === 'all' ? '全部' : '任一'}
            </span>
            <span className="rule-card-info-item"><ClockCircleOutlined />{formatRuleLastRunRelative(rule.last_run_at)}</span>
        </div>
    );
};

const RuleCardActions: React.FC<Omit<RuleCardProps, 'onCardClick'>> = ({
    rule,
    actionLoadingRuleId,
    canUpdateRule,
    canDeleteRule,
    onEditRule,
    onDeleteRule,
    onToggleRule,
}) => (
    <div className="rule-card-footer">
        <span className="rule-card-footer-left">
            <ClockCircleOutlined /> {formatRuleUpdatedDate(rule.updated_at)}
        </span>
        <Space size={0} onClick={(event) => event.stopPropagation()}>
            <Tooltip title={rule.is_active ? '停用' : '启用'}>
                <Switch
                    size="small"
                    checked={rule.is_active}
                    loading={actionLoadingRuleId === rule.id}
                    onChange={(checked) => onToggleRule(rule, checked)}
                    disabled={!canUpdateRule}
                />
            </Tooltip>
            <Button type="text" size="small" icon={<EditOutlined />} disabled={!canUpdateRule} onClick={() => onEditRule(rule)} />
            <Popconfirm title="确定删除此规则？" description="删除后无法恢复" onConfirm={(event) => onDeleteRule(event, rule)}>
                <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={actionLoadingRuleId === rule.id}
                    disabled={!canDeleteRule}
                />
            </Popconfirm>
        </Space>
    </div>
);

const RuleCard: React.FC<RuleCardProps> = (props) => {
    const { rule, actionLoadingRuleId, canUpdateRule, canDeleteRule, onCardClick, onEditRule, onDeleteRule, onToggleRule } = props;
    const cardClassName = [
        'rule-card',
        `rule-card-priority-${priorityClass(rule.priority)}`,
        !rule.is_active ? 'rule-card-inactive' : '',
    ].filter(Boolean).join(' ');

    return (
        <Col xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
            <div className={cardClassName} onClick={() => onCardClick(rule)}>
                <div className="rule-card-body">
                    <RuleCardHeader rule={rule} />
                    <div className="rule-card-desc">{rule.description || '未添加描述'}</div>
                    <RuleFlowNotice rule={rule} />
                    <RuleInfoGrid rule={rule} />
                    <RuleCardActions
                        rule={rule}
                        actionLoadingRuleId={actionLoadingRuleId}
                        canUpdateRule={canUpdateRule}
                        canDeleteRule={canDeleteRule}
                        onEditRule={onEditRule}
                        onDeleteRule={onDeleteRule}
                        onToggleRule={onToggleRule}
                    />
                </div>
            </div>
        </Col>
    );
};

const RuleLoadingState: React.FC = () => (
    <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="加载自愈规则..."><div /></Spin>
    </div>
);

interface RuleEmptyStateProps {
    canCreateRule: boolean;
    onCreateRule: () => void;
}

const RuleEmptyState: React.FC<RuleEmptyStateProps> = ({ canCreateRule, onCreateRule }) => (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">暂无自愈规则</Text>}>
        <Button type="dashed" disabled={!canCreateRule} onClick={onCreateRule}>新建规则</Button>
    </Empty>
);

const RuleGridContent: React.FC<Omit<RuleCardGridProps, 'loading' | 'canCreateRule' | 'onCreateRule'>> = ({
    rules,
    total,
    page,
    pageSize,
    actionLoadingRuleId,
    canUpdateRule,
    canDeleteRule,
    onCardClick,
    onEditRule,
    onDeleteRule,
    onToggleRule,
    onPageChange,
}) => (
    <>
        <Row gutter={[20, 20]} className="rules-grid">
            {rules.map((rule) => (
                <RuleCard
                    key={rule.id}
                    rule={rule}
                    actionLoadingRuleId={actionLoadingRuleId}
                    canUpdateRule={canUpdateRule}
                    canDeleteRule={canDeleteRule}
                    onCardClick={onCardClick}
                    onEditRule={onEditRule}
                    onDeleteRule={onDeleteRule}
                    onToggleRule={onToggleRule}
                />
            ))}
        </Row>
        <div className="rules-pagination">
            <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={onPageChange}
                showSizeChanger={{ showSearch: false }}
                pageSizeOptions={['16', '24', '48']}
                showQuickJumper
                showTotal={(value) => `共 ${value} 条`}
            />
        </div>
    </>
);

export const RuleCardGrid: React.FC<RuleCardGridProps> = ({
    rules,
    loading,
    total,
    page,
    pageSize,
    actionLoadingRuleId,
    canCreateRule,
    canUpdateRule,
    canDeleteRule,
    onCreateRule,
    onCardClick,
    onEditRule,
    onDeleteRule,
    onToggleRule,
    onPageChange,
}) => {
    if (loading) {
        return <RuleLoadingState />;
    }

    if (rules.length === 0 && total === 0) {
        return <RuleEmptyState canCreateRule={canCreateRule} onCreateRule={onCreateRule} />;
    }

    return (
        <RuleGridContent
            rules={rules}
            total={total}
            page={page}
            pageSize={pageSize}
            actionLoadingRuleId={actionLoadingRuleId}
            canUpdateRule={canUpdateRule}
            canDeleteRule={canDeleteRule}
            onCardClick={onCardClick}
            onEditRule={onEditRule}
            onDeleteRule={onDeleteRule}
            onToggleRule={onToggleRule}
            onPageChange={onPageChange}
        />
    );
};
