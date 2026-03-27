import React from 'react';
import {
    BellOutlined,
    ClockCircleOutlined,
    EditOutlined,
    RocketOutlined,
    ScheduleOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Button, Divider, Drawer, Switch, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { history } from '@umijs/max';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import { buildScheduleDetailStyles, formatNextRun } from './schedulePageHelpers';
import ScheduleDetailOverridesCard from './ScheduleDetailOverridesCard';
import ScheduleDetailTemplateCard from './ScheduleDetailTemplateCard';

const { Text } = Typography;

interface ScheduleDetailDrawerProps {
    access: ReturnType<typeof import('@umijs/max').useAccess>;
    actionLoading: string | null;
    channels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    open: boolean;
    secretsSources: AutoHealing.SecretsSource[];
    selectedSchedule: AutoHealing.ExecutionSchedule | null;
    templateMap: Record<string, AutoHealing.ExecutionTask>;
    onClose: () => void;
    onToggle: (schedule: AutoHealing.ExecutionSchedule, enabled: boolean) => void;
}

const ScheduleDetailDrawer: React.FC<ScheduleDetailDrawerProps> = ({
    access,
    actionLoading,
    channels,
    notifyTemplates,
    open,
    secretsSources,
    selectedSchedule,
    templateMap,
    onClose,
    onToggle,
}) => {
    if (!selectedSchedule) {
        return null;
    }

    const template = templateMap[selectedSchedule.task_id];
    const overrideHosts = selectedSchedule.target_hosts_override?.split(',').filter(Boolean) || [];
    const overrideVars = selectedSchedule.extra_vars_override || {};
    const overrideSecrets = selectedSchedule.secrets_source_ids || [];
    const hasOverrides = overrideHosts.length > 0 || Object.keys(overrideVars).length > 0 || overrideSecrets.length > 0;
    const { cardStyle, sectionTitleStyle, fieldLabelStyle, fieldValueStyle } = buildScheduleDetailStyles();

    const resolveSecretsName = (id: string) => {
        const source = secretsSources.find((item) => item.id === id);
        return source?.name || id.slice(0, 8);
    };

    return (
        <Drawer
            title="调度详情"
            open={open}
            onClose={onClose}
            size={600}
            extra={
                <Button
                    icon={<EditOutlined />}
                    onClick={() => history.push(`/execution/schedules/${selectedSchedule.id}/edit`)}
                    disabled={!access.canUpdateTask}
                >
                    编辑
                </Button>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px dashed #f0f0f0' }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selectedSchedule.enabled ? '#e6f7ff' : '#fafafa',
                            border: `1px solid ${selectedSchedule.enabled ? '#91d5ff' : '#d9d9d9'}`,
                        }}
                    >
                        <ScheduleOutlined style={{ fontSize: 20, color: selectedSchedule.enabled ? '#1890ff' : '#bfbfbf' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {selectedSchedule.name}
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                #{selectedSchedule.id?.substring(0, 8)}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Tag color={selectedSchedule.schedule_type === 'cron' ? 'blue' : 'purple'} style={{ margin: 0, fontSize: 11 }}>
                                {selectedSchedule.schedule_type === 'cron' ? '循环执行' : '单次执行'}
                            </Tag>
                            <Tag
                                color={selectedSchedule.status === 'auto_paused' ? 'orange' : selectedSchedule.enabled ? 'green' : 'default'}
                                style={{ margin: 0, fontSize: 11 }}
                            >
                                {selectedSchedule.status === 'auto_paused' ? '自动暂停' : selectedSchedule.enabled ? '已启用' : '已暂停'}
                            </Tag>
                        </div>
                    </div>
                    <Switch
                        size="small"
                        checked={selectedSchedule.enabled}
                        loading={actionLoading === selectedSchedule.id}
                        onChange={(checked) => onToggle(selectedSchedule, checked)}
                        disabled={!access.canUpdateTask}
                    />
                </div>

                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <ClockCircleOutlined style={{ color: '#1890ff' }} />
                        调度信息
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                        <div>
                            <div style={fieldLabelStyle}>{selectedSchedule.schedule_type === 'cron' ? 'Cron 表达式' : '执行时间'}</div>
                            <div style={fieldValueStyle}>
                                <Text code style={{ fontSize: 12 }}>
                                    {selectedSchedule.schedule_type === 'cron'
                                        ? selectedSchedule.schedule_expr
                                        : (selectedSchedule.scheduled_at ? dayjs(selectedSchedule.scheduled_at).format('YYYY-MM-DD HH:mm:ss') : '-')}
                                </Text>
                            </div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>下次执行</div>
                            <div style={{ ...fieldValueStyle, color: '#1677ff' }}>{formatNextRun(selectedSchedule.next_run_at)}</div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>上次执行</div>
                            <div style={fieldValueStyle}>
                                {selectedSchedule.last_run_at ? dayjs(selectedSchedule.last_run_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                            </div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>创建时间</div>
                            <div style={fieldValueStyle}>{dayjs(selectedSchedule.created_at).format('YYYY-MM-DD HH:mm')}</div>
                        </div>
                    </div>
                    {selectedSchedule.description && (
                        <>
                            <Divider dashed style={{ margin: '12px 0' }} />
                            <div>
                                <div style={fieldLabelStyle}>描述</div>
                                <div style={{ ...fieldValueStyle, fontWeight: 400, color: '#595959' }}>{selectedSchedule.description}</div>
                            </div>
                        </>
                    )}
                </div>

                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <RocketOutlined style={{ color: '#1890ff' }} />
                        任务模板
                    </h4>
                    <ScheduleDetailTemplateCard
                        fieldLabelStyle={fieldLabelStyle}
                        fieldValueStyle={fieldValueStyle}
                        template={template}
                    />
                </div>

                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <SettingOutlined style={{ color: '#1890ff' }} />
                        执行覆盖
                        {hasOverrides && <Tag style={{ marginLeft: 'auto', fontSize: 10 }}>已覆盖</Tag>}
                    </h4>
                    <ScheduleDetailOverridesCard
                        fieldLabelStyle={fieldLabelStyle}
                        hasOverrides={hasOverrides}
                        overrideHosts={overrideHosts}
                        overrideSecrets={overrideSecrets}
                        overrideVars={overrideVars}
                        resolveSecretsName={resolveSecretsName}
                    />
                </div>

                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <BellOutlined style={{ color: '#1890ff' }} />
                        通知配置
                    </h4>
                    {selectedSchedule.skip_notification ? (
                        <div style={{ padding: '12px 0', textAlign: 'center', color: '#faad14', fontSize: 12 }}>
                            <Tag color="warning" style={{ margin: 0 }}>已跳过通知</Tag>
                            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 11 }}>本次调度执行将不发送通知</div>
                        </div>
                    ) : (
                        <NotificationConfigDisplay
                            value={template?.notification_config}
                            channels={channels}
                            templates={notifyTemplates}
                            compact
                        />
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default ScheduleDetailDrawer;
