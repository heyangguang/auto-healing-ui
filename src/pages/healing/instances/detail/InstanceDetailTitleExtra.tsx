import React from 'react';
import {
    Tag,
    Typography,
} from 'antd';
import {
    ClockCircleOutlined,
    ThunderboltOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { normalizeNodeState } from '../utils/canvasBuilder';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';

type InstanceDetailTitleExtraProps = {
    id?: string;
    instance?: AutoHealing.FlowInstance | null;
    instanceStatus: string;
    onOpenIncident: () => void;
    onOpenRule: () => void;
};

const hasCompletedFailures = (instance?: AutoHealing.FlowInstance | null) => {
    if (!instance?.node_states) {
        return false;
    }
    return Object.values(instance.node_states).some((state) => {
        const nodeState = normalizeNodeState(state);
        return nodeState?.status === 'failed'
            || nodeState?.status === 'error'
            || nodeState?.status === 'rejected';
    });
};

const getInstanceStatusColor = (instanceStatus: string) => {
    if (instanceStatus === 'completed') return 'success';
    if (instanceStatus === 'failed') return 'error';
    if (instanceStatus === 'running') return 'processing';
    if (instanceStatus === 'waiting_approval') return 'warning';
    return 'default';
};

const InstanceDetailTitleExtra: React.FC<InstanceDetailTitleExtraProps> = ({
    id,
    instance,
    instanceStatus,
    onOpenIncident,
    onOpenRule,
}) => (
    <>
        <Tag color={getInstanceStatusColor(instanceStatus)}>
            {INSTANCE_STATUS_LABELS[instanceStatus] || instanceStatus}
        </Tag>
        {instanceStatus === 'completed' && hasCompletedFailures(instance) && (
            <Tag color="warning" icon={<WarningOutlined />}>执行异常</Tag>
        )}
        <Typography.Text type="secondary" copyable style={{ fontFamily: 'monospace', fontSize: 11 }}>
            #{id?.substring(0, 8)}
        </Typography.Text>
        {instance?.created_at && (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {new Date(instance.created_at).toLocaleString('zh-CN')}
            </span>
        )}
        {instance?.incident && (
            <button
                type="button"
                onClick={onOpenIncident}
                style={{ color: '#1890ff', fontSize: 12, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            >
                <WarningOutlined style={{ marginRight: 4 }} />
                {instance.incident.title}
            </button>
        )}
        {instance?.rule && (
            <button
                type="button"
                onClick={onOpenRule}
                style={{ color: '#722ed1', fontSize: 12, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            >
                <ThunderboltOutlined style={{ marginRight: 4 }} />
                {instance.rule.name}
            </button>
        )}
    </>
);

export default InstanceDetailTitleExtra;
