import React from 'react';
import {
    CloseCircleOutlined,
    ClockCircleOutlined,
    LeftOutlined,
    RedoOutlined,
    ReloadOutlined,
    RocketOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import StatusBadge from '@/components/execution/StatusBadge';

const { Text } = Typography;

interface RunDetailHeaderProps {
    accessCanCancelRun: boolean;
    accessCanExecuteTask: boolean;
    cancelling: boolean;
    duration?: string;
    loading: boolean;
    retrying: boolean;
    run?: AutoHealing.ExecutionRun;
    runId?: string;
    streaming: boolean;
    onBack: () => void;
    onCancel: () => void;
    onRefresh: () => void;
    onRetry: () => void;
}

const RunDetailHeader: React.FC<RunDetailHeaderProps> = ({
    accessCanCancelRun,
    accessCanExecuteTask,
    cancelling,
    duration,
    loading,
    retrying,
    run,
    runId,
    streaming,
    onBack,
    onCancel,
    onRefresh,
    onRetry,
}) => (
    <div className="industrial-dashed-box" style={{
        padding: '16px 24px',
        margin: '16px 16px 0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: '#fff',
    }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" size="small" icon={<LeftOutlined />} onClick={onBack} style={{ color: '#595959' }} />
            <RocketOutlined style={{ fontSize: 18, color: '#595959' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{run?.task?.name || '执行详情'}</span>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{runId?.substring(0, 8)}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {run && <StatusBadge status={run.status || 'unknown'} />}
                    {duration && <Tag style={{ margin: 0, fontSize: 11 }}><ClockCircleOutlined /> {duration}</Tag>}
                    {!duration && run?.started_at && <Tag color="processing" style={{ margin: 0, fontSize: 11 }}><ClockCircleOutlined spin /> 进行中</Tag>}
                    {streaming && <Tag color="processing" icon={<SyncOutlined spin />} style={{ margin: 0, fontSize: 11 }}>实时同步中</Tag>}
                </div>
            </div>
        </div>
        <Space size={8}>
            {run?.status && run.status !== 'running' && run.status !== 'pending' && (
                <Button
                    size="small"
                    icon={<RedoOutlined />}
                    onClick={onRetry}
                    loading={retrying}
                    disabled={!accessCanExecuteTask}
                >
                    重试
                </Button>
            )}
            {(run?.status === 'running' || run?.status === 'pending') && (
                <Button
                    size="small"
                    danger
                    onClick={onCancel}
                    loading={cancelling}
                    disabled={!accessCanCancelRun}
                    icon={<CloseCircleOutlined />}
                >
                    终止
                </Button>
            )}
            <Button size="small" icon={<ReloadOutlined spin={loading || streaming} />} onClick={onRefresh}>刷新</Button>
        </Space>
    </div>
);

export default RunDetailHeader;
