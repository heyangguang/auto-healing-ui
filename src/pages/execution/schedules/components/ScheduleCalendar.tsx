import React, { useMemo, useState } from 'react';
import { Typography, Tooltip, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ScheduleCalendarProps {
    schedules: AutoHealing.ExecutionSchedule[];
    templateMap: Record<string, AutoHealing.ExecutionTask>;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ schedules, templateMap }) => {
    const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));

    // Build density map for the month
    const densityMap = useMemo(() => {
        const map: Record<string, { count: number; names: string[] }> = {};
        const monthStart = currentMonth.startOf('month');
        const monthEnd = currentMonth.endOf('month');

        schedules.forEach(s => {
            if (!s.enabled) return;
            const template = templateMap[s.task_id];
            const name = s.name || template?.name || 'Unknown';

            if (s.schedule_type === 'once' && s.next_run_at) {
                const d = dayjs(s.next_run_at);
                if (d.isAfter(monthStart) && d.isBefore(monthEnd)) {
                    const key = d.format('YYYY-MM-DD');
                    if (!map[key]) map[key] = { count: 0, names: [] };
                    map[key].count++;
                    if (!map[key].names.includes(name)) map[key].names.push(name);
                }
            } else if (s.schedule_type === 'cron' && s.schedule_expr) {
                // Simple heuristic: mark every day as having this schedule
                // In production, would parse cron expression to get exact days
                let cursor = monthStart;
                while (cursor.isBefore(monthEnd)) {
                    const key = cursor.format('YYYY-MM-DD');
                    if (!map[key]) map[key] = { count: 0, names: [] };
                    map[key].count++;
                    if (!map[key].names.includes(name)) map[key].names.push(name);
                    cursor = cursor.add(1, 'day');
                }
            }

            // Also mark last_run_at dates
            if (s.last_run_at) {
                const d = dayjs(s.last_run_at);
                if (d.isAfter(monthStart) && d.isBefore(monthEnd)) {
                    const key = d.format('YYYY-MM-DD');
                    if (!map[key]) map[key] = { count: 0, names: [] };
                    if (!map[key].names.includes(name)) map[key].names.push(name);
                }
            }
        });

        return map;
    }, [schedules, templateMap, currentMonth]);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = currentMonth.startOf('month');
        // dayjs().day() returns 0=Sunday. We want Monday=0
        const startDow = (firstDay.day() + 6) % 7;
        const daysInMonth = currentMonth.daysInMonth();

        const days: Array<{ day: dayjs.Dayjs | null; key: string }> = [];
        // Padding before
        for (let i = 0; i < startDow; i++) days.push({ day: null, key: `pad-start-${i}` });
        // Month days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = currentMonth.date(d);
            days.push({ day: date, key: `day-${date.format('YYYY-MM-DD')}` });
        }
        // Padding after (fill to complete row of 7)
        let padAfter = 0;
        while (days.length % 7 !== 0) {
            days.push({ day: null, key: `pad-end-${padAfter}` });
            padAfter += 1;
        }

        return days;
    }, [currentMonth]);

    const maxDensity = useMemo(() => {
        return Math.max(1, ...Object.values(densityMap).map(v => v.count));
    }, [densityMap]);

    const today = dayjs().format('YYYY-MM-DD');

    return (
        <div className="schedule-calendar">
            {/* Month Navigation */}
            <div className="calendar-header">
                <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
                >
                    <LeftOutlined />
                </button>
                <Text strong style={{ fontSize: 12 }}>
                    {currentMonth.format('YYYY 年 M 月')}
                </Text>
                <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
                >
                    <RightOutlined />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="calendar-weekdays">
                {WEEKDAYS.map(w => (
                    <div key={w} className="calendar-weekday">{w}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div className="calendar-grid">
                {calendarDays.map(({ day, key }) => {
                    if (!day) return <div key={key} className="calendar-cell calendar-cell-empty" />;

                    const dayKey = day.format('YYYY-MM-DD');
                    const density = densityMap[dayKey];
                    const isToday = dayKey === today;
                    const opacity = density ? Math.max(0.2, density.count / maxDensity) : 0;

                    return (
                        <Tooltip
                            key={key}
                            title={density ? (
                                <Space orientation="vertical" size={2}>
                                    <Text style={{ color: '#fff', fontWeight: 600 }}>{day.format('M月D日')}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,.85)' }}>
                                        {density.count} 个调度 · {density.names.length} 个任务
                                    </Text>
                                    {density.names.slice(0, 5).map(n => (
                                        <Text key={n} style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>• {n}</Text>
                                    ))}
                                    {density.names.length > 5 && (
                                        <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>
                                            ...还有 {density.names.length - 5} 个
                                        </Text>
                                    )}
                                </Space>
                            ) : undefined}
                        >
                            <div className={`calendar-cell ${isToday ? 'calendar-cell-today' : ''}`}>
                                <span className="calendar-day-number">{day.date()}</span>
                                {density && (
                                    <div
                                        className="calendar-density"
                                        style={{
                                            backgroundColor: `rgba(24, 144, 255, ${opacity})`,
                                        }}
                                    />
                                )}
                            </div>
                        </Tooltip>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <Text type="secondary" style={{ fontSize: 11 }}>密度：</Text>
                <div className="calendar-legend-scale">
                    {[0.15, 0.35, 0.55, 0.75, 1].map((op) => (
                        <div
                            key={op}
                            className="calendar-legend-cell"
                            style={{ backgroundColor: `rgba(24, 144, 255, ${op})` }}
                        />
                    ))}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>高</Text>
            </div>
        </div>
    );
};

export default ScheduleCalendar;
