import React from 'react';
import { Card, Checkbox, Divider, Space, Tag, Typography } from 'antd';
import {
    BellOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    ClusterOutlined,
    CodeOutlined,
    PlayCircleOutlined,
    RocketOutlined,
} from '@ant-design/icons';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import { getExecutorConfig } from '@/constants/executionDicts';
import { resolveDisplayName } from './executionMissionControlHelpers';
import type { NotificationTargetConfig } from './executionMissionControlTypes';

const { Text } = Typography;

interface ExecutionMissionControlSidebarProps {
    channels: AutoHealing.NotificationChannel[];
    hasNotificationConfig: boolean;
    notifyTemplates: AutoHealing.NotificationTemplate[];
    selectedTemplate: AutoHealing.ExecutionTask;
    showNotificationDisplay: boolean;
    skipNotification: boolean;
    templateHostsCount: number;
    templatePlaybookName?: string;
    timeoutConfigs: NotificationTargetConfig[];
    variableCount: number;
    onSkipNotificationChange: (checked: boolean) => void;
}

const labelTextStyle = { fontSize: 12 } as const;
const _compactTagStyle = { margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 4px' } as const;

const MissionSidebarHeader: React.FC<{ taskId: string }> = ({ taskId }) => (
    <div className="sidebar-header">
        <div>
            <Text type="secondary" style={labelTextStyle}>任务 ID</Text>
            <div className="industrial-tag" style={{ fontSize: 16, fontWeight: 600 }}>
                #{taskId.slice(0, 8).toUpperCase()}
            </div>
        </div>
    </div>
);

const MissionOverviewCard: React.FC<{
    selectedTemplate: AutoHealing.ExecutionTask;
    templateHostsCount: number;
    templatePlaybookName?: string;
    variableCount: number;
}> = ({ selectedTemplate, templateHostsCount, templatePlaybookName, variableCount }) => (
    <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
        <Text strong style={{ fontSize: 16 }}>{selectedTemplate.name}</Text>
        <Text type="secondary" style={{ display: 'block', margin: '4px 0 8px', fontSize: 12 }}>
            {selectedTemplate.description || '无描述'}
        </Text>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <MissionSummaryRow icon={<PlayCircleOutlined />} label="关联剧本" value={templatePlaybookName || '-'} />
            <MissionExecutorRow executorType={selectedTemplate.executor_type} />
            <MissionSummaryRow icon={<ClusterOutlined />} label="目标主机" value={`${templateHostsCount} 台`} strong />
            <MissionSummaryRow icon={<CodeOutlined />} label="变量参数" value={`${variableCount} 个`} strong />
            <Divider style={{ margin: '4px 0' }} />
            <MissionSummaryRow icon={<CalendarOutlined />} label="创建时间" value={new Date(selectedTemplate.created_at).toLocaleString()} />
            <MissionSummaryRow icon={<ClockCircleOutlined />} label="更新时间" value={new Date(selectedTemplate.updated_at).toLocaleString()} />
        </Space>
    </Card>
);

const MissionSummaryRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    strong?: boolean;
    value: string;
}> = ({ icon, label, strong = false, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space size={4} className="text-secondary">
            {icon} {label}
        </Space>
        <Text ellipsis={strong ? false : { tooltip: value }} strong={strong} style={{ maxWidth: 120, fontSize: 12 }}>
            {value}
        </Text>
    </div>
);

const MissionExecutorRow: React.FC<{ executorType?: string }> = ({ executorType }) => {
    const executor = getExecutorConfig(executorType);
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space size={4} className="text-secondary">
                <RocketOutlined /> 执行方式
            </Space>
            <Tag color={executor.tagColor || executor.color} style={{ margin: 0 }}>{executor.label}</Tag>
        </div>
    );
};

const TimeoutStrategyItem: React.FC<{
    channels: AutoHealing.NotificationChannel[];
    config: NotificationTargetConfig;
    notifyTemplates: AutoHealing.NotificationTemplate[];
}> = ({ channels, config, notifyTemplates }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            background: '#fff',
            border: '1px solid #f0f0f0',
            fontSize: 11,
        }}
    >
        <BellOutlined style={{ color: '#999', fontSize: 10 }} />
        <Text style={{ fontSize: 11 }}>{resolveDisplayName(channels, config.channel_id)}</Text>
        <Tag style={{ margin: 0, fontSize: 10, lineHeight: '14px' }} color="default">
            {resolveDisplayName(notifyTemplates, config.template_id)}
        </Tag>
    </div>
);

const TimeoutStrategyList: React.FC<{
    channels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    timeoutConfigs: NotificationTargetConfig[];
    showNotificationDisplay: boolean;
}> = ({ channels, notifyTemplates, timeoutConfigs, showNotificationDisplay }) => {
    if (timeoutConfigs.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                border: '1px dashed #d9d9d9',
                padding: '6px 10px',
                background: '#fafafa',
                marginTop: showNotificationDisplay ? 8 : 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <ClockCircleOutlined style={{ color: '#eb2f96', marginRight: 6, fontSize: 12 }} />
                <Text strong style={{ fontSize: 12, color: '#eb2f96' }}>超时时</Text>
                <Tag
                    color="#eb2f96"
                    style={{ fontSize: 10, lineHeight: '14px', padding: '0 4px', margin: '0 0 0 8px' }}
                >
                    {timeoutConfigs.length} 策略
                </Tag>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {timeoutConfigs.map((config, index) => (
                    <TimeoutStrategyItem
                        key={`${config.channel_id}-${config.template_id}-${index}`}
                        channels={channels}
                        config={config}
                        notifyTemplates={notifyTemplates}
                    />
                ))}
            </div>
        </div>
    );
};

const NotificationToggle: React.FC<{
    skipNotification: boolean;
    onSkipNotificationChange: (checked: boolean) => void;
}> = ({ skipNotification, onSkipNotificationChange }) => (
    <div style={{ marginTop: 12 }}>
        <Checkbox checked={skipNotification} onChange={(event) => onSkipNotificationChange(event.target.checked)}>
            <Text type="secondary">本次执行跳过通知</Text>
        </Checkbox>
        {skipNotification && (
            <div style={{ marginTop: 4, marginLeft: 24 }}>
                <Text type="warning" style={{ fontSize: 11, color: '#faad14' }}>
                    跳过本次所有通知
                </Text>
            </div>
        )}
    </div>
);

const MissionNotificationCard: React.FC<{
    channels: AutoHealing.NotificationChannel[];
    hasNotificationConfig: boolean;
    notifyTemplates: AutoHealing.NotificationTemplate[];
    selectedTemplate: AutoHealing.ExecutionTask;
    showNotificationDisplay: boolean;
    skipNotification: boolean;
    timeoutConfigs: NotificationTargetConfig[];
    onSkipNotificationChange: (checked: boolean) => void;
}> = ({
    channels,
    hasNotificationConfig,
    notifyTemplates,
    selectedTemplate,
    showNotificationDisplay,
    skipNotification,
    timeoutConfigs,
    onSkipNotificationChange,
}) => (
    <>
        <div className="info-block-title">
            <Space><BellOutlined /> 通知配置 (Notification)</Space>
        </div>
        {showNotificationDisplay && (
            <NotificationConfigDisplay
                value={selectedTemplate.notification_config}
                channels={channels}
                templates={notifyTemplates}
                compact
            />
        )}
        <TimeoutStrategyList
            channels={channels}
            notifyTemplates={notifyTemplates}
            timeoutConfigs={timeoutConfigs}
            showNotificationDisplay={showNotificationDisplay}
        />
        {hasNotificationConfig && (
            <NotificationToggle
                skipNotification={skipNotification}
                onSkipNotificationChange={onSkipNotificationChange}
            />
        )}
    </>
);

const ExecutionMissionControlSidebar: React.FC<ExecutionMissionControlSidebarProps> = ({
    channels,
    hasNotificationConfig,
    notifyTemplates,
    selectedTemplate,
    showNotificationDisplay,
    skipNotification,
    templateHostsCount,
    templatePlaybookName,
    timeoutConfigs,
    variableCount,
    onSkipNotificationChange,
}) => (
    <div className="cockpit-sidebar">
        <MissionSidebarHeader taskId={selectedTemplate.id} />
        <div className="sidebar-content">
            <div className="info-block">
                <div className="info-block-title">任务概览</div>
                <MissionOverviewCard
                    selectedTemplate={selectedTemplate}
                    templateHostsCount={templateHostsCount}
                    templatePlaybookName={templatePlaybookName}
                    variableCount={variableCount}
                />
            </div>
            <div className="info-block">
                <MissionNotificationCard
                    channels={channels}
                    hasNotificationConfig={hasNotificationConfig}
                    notifyTemplates={notifyTemplates}
                    selectedTemplate={selectedTemplate}
                    showNotificationDisplay={showNotificationDisplay}
                    skipNotification={skipNotification}
                    timeoutConfigs={timeoutConfigs}
                    onSkipNotificationChange={onSkipNotificationChange}
                />
            </div>
        </div>
    </div>
);

export default ExecutionMissionControlSidebar;
