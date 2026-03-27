import React, { useMemo } from 'react';
import { Typography, Progress } from 'antd';
import {
    CheckCircleFilled, PauseCircleFilled,
    ClockCircleFilled, ThunderboltFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ScheduleDistributionProps {
    schedules: AutoHealing.ExecutionSchedule[];
    templateMap: Record<string, AutoHealing.ExecutionTask>;
}

const ScheduleDistribution: React.FC<ScheduleDistributionProps> = ({ schedules }) => {
    const stats = useMemo(() => {
        const total = schedules.length;
        const active = schedules.filter(s => s.enabled).length;
        const paused = total - active;
        const cron = schedules.filter(s => s.schedule_type === 'cron').length;
        const once = total - cron;

        // Recently executed (last 24h)
        const now = dayjs();
        const recentlyRun = schedules.filter(s =>
            s.last_run_at && now.diff(dayjs(s.last_run_at), 'hour') < 24
        ).length;

        // Upcoming (next 24h)
        const upcoming = schedules.filter(s =>
            s.enabled && s.next_run_at &&
            dayjs(s.next_run_at).diff(now, 'hour') < 24 &&
            dayjs(s.next_run_at).isAfter(now)
        ).length;

        return { total, active, paused, cron, once, recentlyRun, upcoming };
    }, [schedules]);

    const items = [
        {
            label: '活跃',
            value: stats.active,
            total: stats.total,
            color: '#52c41a',
            icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />,
        },
        {
            label: '暂停',
            value: stats.paused,
            total: stats.total,
            color: '#faad14',
            icon: <PauseCircleFilled style={{ color: '#faad14', fontSize: 12 }} />,
        },
        {
            label: 'Cron',
            value: stats.cron,
            total: stats.total,
            color: '#1890ff',
            icon: <ClockCircleFilled style={{ color: '#1890ff', fontSize: 12 }} />,
        },
        {
            label: '单次',
            value: stats.once,
            total: stats.total,
            color: '#722ed1',
            icon: <ThunderboltFilled style={{ color: '#722ed1', fontSize: 12 }} />,
        },
    ];

    return (
        <div className="schedule-distribution">
            {/* Donut-style summary */}
            <div className="distribution-donut-section">
                <div className="distribution-donut">
                    <Progress
                        type="circle"
                        percent={stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}
                        size={72}
                        strokeColor="#52c41a"
                        trailColor="#f0f0f0"
                        format={() => (
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#262626' }}>
                                    {stats.total}
                                </div>
                                <div style={{ fontSize: 10, color: '#8c8c8c' }}>总计</div>
                            </div>
                        )}
                    />
                </div>
                <div className="distribution-quick-stats">
                    <div className="distribution-quick-item">
                        <Text type="secondary" style={{ fontSize: 10 }}>24h 已执行</Text>
                        <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{stats.recentlyRun}</Text>
                    </div>
                    <div className="distribution-quick-item">
                        <Text type="secondary" style={{ fontSize: 10 }}>24h 待执行</Text>
                        <Text strong style={{ fontSize: 16, color: '#722ed1' }}>{stats.upcoming}</Text>
                    </div>
                </div>
            </div>

            {/* Bar breakdown */}
            <div className="distribution-bars">
                {items.map(item => (
                    <div key={item.label} className="distribution-bar-item">
                        <div className="distribution-bar-label">
                            {item.icon}
                            <Text style={{ fontSize: 11 }}>{item.label}</Text>
                            <Text strong style={{ fontSize: 11, marginLeft: 'auto' }}>{item.value}</Text>
                        </div>
                        <div className="distribution-bar-track">
                            <div
                                className="distribution-bar-fill"
                                style={{
                                    width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%',
                                    backgroundColor: item.color,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleDistribution;
