import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Tooltip, Tag, Space, Typography, Empty } from 'antd';
import {
    ClockCircleOutlined, ThunderboltOutlined,
    PlayCircleOutlined, PauseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ScheduleTimelineProps {
    schedules: AutoHealing.ExecutionSchedule[];
    templateMap: Record<string, AutoHealing.ExecutionTask>;
    onScheduleClick?: (schedule: AutoHealing.ExecutionSchedule) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIMELINE_HEIGHT = 40;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const LABEL_WIDTH = 200;

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ schedules, templateMap, onScheduleClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nowPx, setNowPx] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    // Resize observer
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width - LABEL_WIDTH);
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Current time indicator
    useEffect(() => {
        const update = () => {
            const now = dayjs();
            const minutesSinceMidnight = now.hour() * 60 + now.minute();
            setNowPx((minutesSinceMidnight / 1440) * containerWidth);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [containerWidth]);

    // Parse next run times for schedules (backend already filtered to today's date)
    const timelineData = useMemo(() => {
        const now = dayjs();
        return schedules
            .map(s => {
                const nextRun = s.next_run_at ? dayjs(s.next_run_at) : null;
                const lastRun = s.last_run_at ? dayjs(s.last_run_at) : null;
                const template = templateMap[s.task_id];

                // Determine execution points for today
                const points: { time: dayjs.Dayjs; type: 'next' | 'past' | 'disabled' }[] = [];

                if (nextRun && nextRun.isSame(now, 'day')) {
                    points.push({ time: nextRun, type: s.enabled ? 'next' : 'disabled' });
                }
                if (lastRun && lastRun.isSame(now, 'day')) {
                    points.push({ time: lastRun, type: 'past' });
                }

                // For cron schedules, estimate additional runs today
                if (s.schedule_type === 'cron' && s.enabled && s.schedule_expr) {
                    if (nextRun && nextRun.isSame(now, 'day') && lastRun) {
                        const intervalMs = nextRun.diff(lastRun);
                        if (intervalMs > 0 && intervalMs < 24 * 60 * 60 * 1000) {
                            let cursor = nextRun.add(intervalMs, 'ms');
                            while (cursor.isSame(now, 'day') && points.length < 12) {
                                points.push({ time: cursor, type: 'next' });
                                cursor = cursor.add(intervalMs, 'ms');
                            }
                        }
                    }
                }

                return {
                    schedule: s,
                    template,
                    points,
                    name: s.name || template?.name || s.task_id,
                };
            })
            .filter(d => d.points.length > 0)
            .slice(0, 10); // Limit display rows
    }, [schedules, templateMap]);

    const timeToX = (time: dayjs.Dayjs) => {
        const minutes = time.hour() * 60 + time.minute();
        return (minutes / 1440) * containerWidth;
    };

    if (timelineData.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="今日无调度执行" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="schedule-timeline">
            {/* Hour Headers */}
            <div className="timeline-header" style={{ marginLeft: LABEL_WIDTH }}>
                {HOURS.map(h => (
                    <div
                        key={h}
                        className="timeline-hour-mark"
                        style={{
                            left: `${(h / 24) * 100}%`,
                            width: `${100 / 24}%`,
                        }}
                    >
                        <span className="timeline-hour-label">
                            {h.toString().padStart(2, '0')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div className="timeline-body">
                {timelineData.map((row, idx) => (
                    <div
                        key={row.schedule.id}
                        className="timeline-row"
                        onClick={() => onScheduleClick?.(row.schedule)}
                    >
                        {/* Label */}
                        <div className="timeline-row-label" style={{ width: LABEL_WIDTH }}>
                            <div className="timeline-row-name">{row.name}</div>
                            <div className="timeline-row-meta">
                                <Tag
                                    color={row.schedule.schedule_type === 'cron' ? 'blue' : 'purple'}
                                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
                                >
                                    {row.schedule.schedule_type === 'cron' ? 'CRON' : 'ONCE'}
                                </Tag>
                                {!row.schedule.enabled && <Tag color="default" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>停</Tag>}
                            </div>
                        </div>

                        {/* Track */}
                        <div className="timeline-track">
                            {/* Grid lines */}
                            {HOURS.map(h => (
                                <div
                                    key={h}
                                    className="timeline-grid-line"
                                    style={{ left: `${(h / 24) * 100}%` }}
                                />
                            ))}

                            {/* Execution Markers */}
                            {row.points.map((p, pi) => {
                                const x = timeToX(p.time);
                                const color = p.type === 'next' ? '#52c41a' : p.type === 'past' ? '#1890ff' : '#d9d9d9';
                                return (
                                    <Tooltip
                                        key={pi}
                                        title={
                                            <Space orientation="vertical" size={2}>
                                                <Text style={{ color: '#fff', fontWeight: 600 }}>{row.name}</Text>
                                                <Text style={{ color: 'rgba(255,255,255,.85)' }}>
                                                    {p.type === 'next' ? '预计执行' : p.type === 'past' ? '已执行' : '已禁用'}
                                                </Text>
                                                <Text style={{ color: 'rgba(255,255,255,.85)', fontFamily: 'monospace' }}>
                                                    {p.time.format('HH:mm:ss')}
                                                </Text>
                                            </Space>
                                        }
                                    >
                                        <div
                                            className="timeline-marker"
                                            style={{
                                                left: x,
                                                backgroundColor: color,
                                                boxShadow: p.type === 'next' ? `0 0 6px ${color}` : 'none',
                                            }}
                                        >
                                            <div className="timeline-marker-pulse" style={{ borderColor: color }} />
                                        </div>
                                    </Tooltip>
                                );
                            })}

                            {/* Current time indicator */}
                            {containerWidth > 0 && (
                                <div className="timeline-now-line" style={{ left: nowPx }} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleTimeline;
