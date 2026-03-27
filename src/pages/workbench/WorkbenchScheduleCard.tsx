import { LeftOutlined, RightOutlined, ScheduleOutlined } from '@ant-design/icons';
import { Button, Calendar, Card } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React from 'react';
import type { ScheduleTask } from '@/services/auto-healing/workbench';
import type { MergedTask } from './workbenchTypes';

type WorkbenchScheduleCardProps = {
    accessDisabled: boolean;
    calendarMonth: Dayjs;
    mergeScheduleTasks: (tasks: ScheduleTask[]) => MergedTask[];
    onMonthChange: (date: Dayjs) => void;
    onOpenSchedules: () => void;
    onSelectDate: (date: string) => void;
    scheduleData: Record<string, ScheduleTask[]>;
    selectedDate: string;
    styles: Record<string, string>;
};

type ScheduleHeaderProps = {
    accessDisabled: boolean;
    calendarMonth: Dayjs;
    onMonthChange: (date: Dayjs) => void;
};

function resolveCalendarValue(calendarMonth: Dayjs, selectedDate: string) {
    const selectedValue = dayjs(selectedDate);
    if (!selectedValue.isValid() || !selectedValue.isSame(calendarMonth, 'month')) {
        return calendarMonth;
    }
    return selectedValue;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    accessDisabled,
    calendarMonth,
    onMonthChange,
}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
        <Button
            aria-label="上个月"
            type="text"
            size="small"
            icon={<LeftOutlined />}
            disabled={accessDisabled}
            onClick={() => onMonthChange(calendarMonth.subtract(1, 'month'))}
        />
        <div style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
            {calendarMonth.year()}年 {calendarMonth.month() + 1}月
        </div>
        <Button
            aria-label="下个月"
            type="text"
            size="small"
            icon={<RightOutlined />}
            disabled={accessDisabled}
            onClick={() => onMonthChange(calendarMonth.add(1, 'month'))}
        />
    </div>
);

const WorkbenchScheduleCard: React.FC<WorkbenchScheduleCardProps> = ({
    accessDisabled,
    calendarMonth,
    mergeScheduleTasks,
    onMonthChange,
    onOpenSchedules,
    onSelectDate,
    scheduleData,
    selectedDate,
    styles,
}) => (
    <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <ScheduleOutlined className={styles.cardTitleIcon} /> 定时任务
            </span>
            <span className={styles.cardLink} onClick={() => !accessDisabled && onOpenSchedules()} style={accessDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
            </span>
        </div>
        <div className={styles.calendarWrap}>
            <Calendar
                fullscreen={false}
                value={resolveCalendarValue(calendarMonth, selectedDate)}
                headerRender={() => (
                    <ScheduleHeader
                        accessDisabled={accessDisabled}
                        calendarMonth={calendarMonth}
                        onMonthChange={onMonthChange}
                    />
                )}
                onSelect={(date) => {
                    if (accessDisabled) {
                        return;
                    }
                    if (!dayjs(date).isSame(calendarMonth, 'month')) {
                        onMonthChange(dayjs(date));
                    }
                    onSelectDate(date.format?.('YYYY-MM-DD') || '');
                }}
                onPanelChange={(date) => onMonthChange(dayjs(date))}
                cellRender={(current) => {
                    const dateStr = current.format?.('YYYY-MM-DD') || '';
                    const tasks = scheduleData[dateStr];
                    if (!tasks || tasks.length === 0) return null;
                    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 1 }}><span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#1677ff' }} /></div>;
                }}
            />
        </div>
        <div style={{ padding: '6px 10px 8px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4, fontWeight: 500 }}>{selectedDate.replace(/-/g, '/')} 的定时任务</div>
            {accessDisabled ? (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#bfbfbf' }}>无权限查看定时任务</div>
            ) : scheduleData[selectedDate] && scheduleData[selectedDate].length > 0 ? (
                mergeScheduleTasks(scheduleData[selectedDate]).map((task, index) => (
                    <div key={index} className={styles.scheduleTaskItem} style={task.isMerged ? { borderLeftColor: '#722ed1', background: '#f9f0ff' } : undefined}>
                        <span className={styles.scheduleTaskTime} style={task.isMerged ? { color: '#722ed1' } : undefined}>{task.displayTime}</span>
                        <span className={styles.scheduleTaskName}>{task.name}</span>
                        {task.isMerged && <span style={{ fontSize: 10, color: '#722ed1', background: '#f0e6ff', padding: '1px 6px', borderRadius: 2, flexShrink: 0 }}>{task.count}次/天</span>}
                    </div>
                ))
            ) : (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#bfbfbf' }}>无定时任务</div>
            )}
        </div>
    </Card>
);

export default WorkbenchScheduleCard;
