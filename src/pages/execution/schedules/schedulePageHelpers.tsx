import React from 'react';
import {
    ClockCircleOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    ScheduleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { AdvancedSearchField } from '@/components/StandardTable';
import type {
    ExecutionScheduleStatsSummary,
    ScheduleTimelineItem,
} from '@/services/auto-healing/execution';

const { Text } = Typography;

export type ScheduleStats = {
    total: number;
    active: number;
    paused: number;
    cron: number;
};

export type ScheduleQueryParams = {
    page: number;
    page_size: number;
    name?: string;
    schedule_type?: string;
    enabled?: boolean;
    skip_notification?: boolean;
    has_overrides?: boolean;
    status?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export type ScheduleAdvancedSearch = {
    name?: string;
    schedule_type?: string;
    enabled?: boolean | 'true' | 'false';
    skip_notification?: boolean | 'true' | 'false';
    has_overrides?: boolean | 'true' | 'false';
    status?: string;
    created_at?: [string | undefined, string | undefined];
};

export type ScheduleRequestParams = {
    page?: number;
    pageSize?: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: ScheduleAdvancedSearch;
    sorter?: { field?: string; order?: 'ascend' | 'descend' };
};

export const hasBooleanishValue = (value: unknown): value is boolean | 'true' | 'false' =>
    value === true || value === false || value === 'true' || value === 'false';

export const toTimelineSchedule = (item: ScheduleTimelineItem): AutoHealing.ExecutionSchedule => ({
    id: item.id,
    name: item.name,
    task_id: item.task_id,
    schedule_type: item.schedule_type as AutoHealing.ScheduleType,
    schedule_expr: item.schedule_expr ?? null,
    scheduled_at: item.scheduled_at ?? null,
    status: item.status as AutoHealing.ScheduleStatus,
    enabled: item.enabled,
    next_run_at: item.next_run_at ?? null,
    last_run_at: item.last_run_at ?? null,
    created_at: item.scheduled_at ?? item.next_run_at ?? '',
    updated_at: item.last_run_at ?? item.next_run_at ?? '',
});

export const getStatusCount = (
    stats: ExecutionScheduleStatsSummary,
    status: string,
) => stats.by_status.find((item) => item.status === status)?.count || 0;

export const getScheduleTypeCount = (
    stats: ExecutionScheduleStatsSummary,
    scheduleType: string,
) => stats.by_schedule_type.find((item) => item.schedule_type === scheduleType)?.count || 0;

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 16h32" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="11" r="1.5" fill="currentColor" />
        <circle cx="24" cy="11" r="1.5" fill="currentColor" />
        <circle cx="32" cy="11" r="1.5" fill="currentColor" />
        <rect x="14" y="22" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="22" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="14" y="30" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="26" y="30" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

export const searchFields = [
    {
        key: 'name',
        label: '调度名称',
        placeholder: '输入调度名称搜索...',
        description: '按调度名称模糊搜索',
    },
    {
        key: '__enum__schedule_type',
        label: '调度类型',
        description: '筛选调度类型（定时循环/单次执行）',
        options: [
            { label: '定时循环', value: 'cron' },
            { label: '单次执行', value: 'once' },
        ],
    },
    {
        key: '__enum__enabled',
        label: '启用状态',
        description: '筛选调度启用/禁用状态',
        options: [
            { label: '已启用', value: 'true' },
            { label: '已禁用', value: 'false' },
        ],
    },
    {
        key: '__enum__status',
        label: '调度状态',
        description: '筛选调度执行状态',
        options: [
            { label: '运行中', value: 'running' },
            { label: '待执行', value: 'pending' },
            { label: '已完成', value: 'completed' },
            { label: '已禁用', value: 'disabled' },
            { label: '自动暂停', value: 'auto_paused' },
        ],
    },
];

export const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '调度名称', type: 'input', placeholder: '输入调度名称（模糊匹配）' },
    {
        key: 'schedule_type',
        label: '调度类型',
        type: 'select',
        options: [
            { label: '定时循环', value: 'cron' },
            { label: '单次执行', value: 'once' },
        ],
    },
    {
        key: 'enabled',
        label: '启用状态',
        type: 'select',
        options: [
            { label: '已启用', value: 'true' },
            { label: '已禁用', value: 'false' },
        ],
    },
    {
        key: 'skip_notification',
        label: '跳过通知',
        type: 'select',
        description: '筛选是否跳过执行通知',
        options: [
            { label: '跳过通知', value: 'true' },
            { label: '发送通知', value: 'false' },
        ],
    },
    {
        key: 'has_overrides',
        label: '执行覆盖',
        type: 'select',
        description: '筛选是否有主机/变量/密钥覆盖参数',
        options: [
            { label: '有覆盖参数', value: 'true' },
            { label: '无覆盖参数', value: 'false' },
        ],
    },
    {
        key: 'status',
        label: '调度状态',
        type: 'select',
        options: [
            { label: '运行中', value: 'running' },
            { label: '待执行', value: 'pending' },
            { label: '已完成', value: 'completed' },
            { label: '已禁用', value: 'disabled' },
            { label: '自动暂停', value: 'auto_paused' },
        ],
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export function formatNextRun(nextRun: string | null | undefined) {
    if (!nextRun) {
        return <Text type="secondary">N/A</Text>;
    }
    const date = dayjs(nextRun);
    const diff = date.diff(dayjs());
    if (diff < 0) {
        return <Text type="secondary">已过期</Text>;
    }
    return (
        <Tooltip title={date.format('YYYY-MM-DD HH:mm:ss')}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{date.fromNow()}</Text>
        </Tooltip>
    );
}

export function renderScheduleStatsBar(stats: ScheduleStats) {
    return (
        <div className="schedule-stats-bar">
            {[
                { icon: <ScheduleOutlined />, cls: 'total', val: stats.total, lbl: '全部调度' },
                { icon: <PlayCircleOutlined />, cls: 'active', val: stats.active, lbl: '活跃' },
                { icon: <PauseCircleOutlined />, cls: 'paused', val: stats.paused, lbl: '已暂停' },
                { icon: <SyncOutlined />, cls: 'cron', val: stats.cron, lbl: '定时循环' },
            ].map((item, index) => (
                <React.Fragment key={item.cls}>
                    {index > 0 && <div className="schedule-stat-divider" />}
                    <div className="schedule-stat-item">
                        <span className={`schedule-stat-icon schedule-stat-icon-${item.cls}`}>{item.icon}</span>
                        <div className="schedule-stat-content">
                            <div className="schedule-stat-value">{item.val}</div>
                            <div className="schedule-stat-label">{item.lbl}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

export function buildScheduleDetailStyles() {
    return {
        cardStyle: { background: '#fff', border: '1px solid #f0f0f0', padding: '20px 24px' } satisfies React.CSSProperties,
        sectionTitleStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#262626',
            margin: '0 0 14px 0',
            paddingBottom: 8,
            borderBottom: '1px dashed #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        } satisfies React.CSSProperties,
        fieldLabelStyle: { fontSize: 12, color: '#8c8c8c', fontWeight: 500 } satisfies React.CSSProperties,
        fieldValueStyle: { fontSize: 13, color: '#262626', fontWeight: 500, marginTop: 4 } satisfies React.CSSProperties,
    };
}
