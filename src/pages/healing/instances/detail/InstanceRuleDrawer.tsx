import React from 'react';
import {
    Descriptions,
    Drawer,
    Empty,
    Tag,
    Typography,
} from 'antd';
import {
    AimOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import RuleConditionTree from './RuleConditionTree';

type InstanceRuleDrawerProps = {
    onClose: () => void;
    open: boolean;
    rule?: AutoHealing.FlowInstance['rule'];
};

const getPriorityColor = (priority: number) => {
    if (priority <= 10) return 'red';
    if (priority <= 20) return 'orange';
    return 'blue';
};

const InstanceRuleDrawer: React.FC<InstanceRuleDrawerProps> = ({
    onClose,
    open,
    rule,
}) => {
    if (!rule) {
        return (
            <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
                <Empty description="无规则信息" style={{ marginTop: 120 }} />
            </Drawer>
        );
    }

    return (
        <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
            <div style={{ background: 'linear-gradient(135deg, #722ed112 0%, #ffffff 100%)', padding: '24px 24px 20px', color: '#262626', borderBottom: '2px solid #722ed130' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#722ed115', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#722ed1' }}>
                        <ThunderboltOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{rule.name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{rule.description || '暂无描述'}</div>
                    </div>
                    <Tag color={rule.is_active !== false ? 'success' : 'default'} style={{ borderRadius: 12, fontSize: 12 }}>
                        {rule.is_active !== false ? '已启用' : '已禁用'}
                    </Tag>
                </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
                <Descriptions column={2} size="small" bordered labelStyle={{ background: '#fafafa', fontWeight: 500, width: 100 }}>
                    <Descriptions.Item label="规则 ID" span={2}>
                        <Typography.Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>{rule.id}</Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">
                        <Tag color={getPriorityColor(rule.priority)}>{rule.priority}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="触发模式">
                        <Tag color={rule.trigger_mode === 'auto' ? 'green' : 'purple'} icon={rule.trigger_mode === 'auto' ? <CheckCircleOutlined /> : <EyeOutlined />}>
                            {rule.trigger_mode === 'auto' ? '自动触发' : '手动确认'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="匹配模式">{rule.match_mode === 'all' ? '满足所有条件 (AND)' : '满足任一条件 (OR)'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{rule.created_at ? new Date(rule.created_at).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
                        <AimOutlined style={{ color: '#722ed1' }} />
                        触发条件
                        <Tag style={{ fontSize: 11, borderRadius: 8 }}>{rule.match_mode === 'all' ? 'AND' : 'OR'}</Tag>
                    </div>
                    <RuleConditionTree conditions={rule.conditions || []} matchMode={rule.match_mode} />
                </div>
            </div>
        </Drawer>
    );
};

export default InstanceRuleDrawer;
