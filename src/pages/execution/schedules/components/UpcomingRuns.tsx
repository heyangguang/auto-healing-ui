import React, { useState, useEffect, useMemo } from 'react';
import { Space, Typography, Tag, Empty } from 'antd';
import {
    ClockCircleOutlined, ThunderboltOutlined,
    RocketOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

interface UpcomingRunsProps {
    schedules: AutoHealing.ExecutionSchedule[];
    templateMap: Record<string, AutoHealing.ExecutionTask>;
    limit?: number;
    onScheduleClick?: (schedule: AutoHealing.ExecutionSchedule) => void;
}

const UpcomingRuns: React.FC<UpcomingRunsProps> = ({
    schedules,
    templateMap,
    limit = 8,
    onScheduleClick,
}) => {
    const [, setTick] = useState(0);

    // Refresh countdown every 30s
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(interval);
    }, []);

    const upcomingList = useMemo(() => {
        const now = dayjs();
        return schedules
            .filter(s => s.enabled && s.next_run_at)
            .map(s => ({
                schedule: s,
                nextRun: dayjs(s.next_run_at),
                template: templateMap[s.task_id],
                diff: dayjs(s.next_run_at).diff(now),
            }))
            .filter(item => item.diff > 0) // Only future runs
            .sort((a, b) => a.diff - b.diff)
            .slice(0, limit);
    }, [schedules, templateMap, limit]);

    const formatCountdown = (diff: number) => {
        if (diff <= 0) return '即将执行';
        const totalMinutes = Math.floor(diff / 60000);
        if (totalMinutes < 1) return '< 1 分钟';
        if (totalMinutes < 60) return `${totalMinutes} 分钟后`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours < 24) {
            return minutes > 0 ? `${hours}h ${minutes}m 后` : `${hours}h 后`;
        }
        const days = Math.floor(hours / 24);
        const remainHours = hours % 24;
        return remainHours > 0 ? `${days}d ${remainHours}h 后` : `${days}d 后`;
    };

    if (upcomingList.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待执行调度" />
            </div>
        );
    }

    return (
        <div className="upcoming-runs">
            {upcomingList.map((item, idx) => {
                const urgency = item.diff < 3600000 ? 'urgent' : item.diff < 86400000 ? 'soon' : 'later';
                const name = item.schedule.name || item.template?.name || item.schedule.task_id;

                return (
                    <div
                        key={item.schedule.id}
                        className={`upcoming-run-item upcoming-run-${urgency}`}
                        onClick={() => onScheduleClick?.(item.schedule)}
                    >
                        <div className="upcoming-run-indicator">
                            <div className={`upcoming-run-dot upcoming-run-dot-${urgency}`} />
                            {idx < upcomingList.length - 1 && <div className="upcoming-run-line" />}
                        </div>

                        <div className="upcoming-run-content">
                            <div className="upcoming-run-header">
                                <Text strong ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
                                    {name}
                                </Text>
                                <Text
                                    className={`upcoming-run-countdown upcoming-run-countdown-${urgency}`}
                                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                                >
                                    {formatCountdown(item.diff)}
                                </Text>
                            </div>
                            <div className="upcoming-run-footer">
                                <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                                    <FieldTimeOutlined /> {item.nextRun.format('MM-DD HH:mm')}
                                </Text>
                                <Tag
                                    color={item.schedule.schedule_type === 'cron' ? 'blue' : 'purple'}
                                    style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 4px' }}
                                >
                                    {item.schedule.schedule_type === 'cron' ? 'CRON' : 'ONCE'}
                                </Tag>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default UpcomingRuns;
