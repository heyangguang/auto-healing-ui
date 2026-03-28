import React, { useEffect, useState } from 'react';
import {
    BellOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    PlayCircleOutlined,
    RobotOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import type { AdvancedSearchField } from '@/components/StandardTable';
import { NOTIF_LOG_STATUS_MAP } from '@/constants/commonDicts';
import {
    getExecutionTriggeredByConfig,
    getExecutionTriggeredByOptions,
} from '@/constants/executionDicts';
import { getChannelTypeConfig } from '@/constants/notificationDicts';
import {
    getNotificationStats,
    type NotificationRecordResponse,
    type NotificationStatsSummary,
} from '@/services/auto-healing/notification';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

export const RECORDS_HEADER_ICON = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>通知记录图标</title>
        <rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 18h36M14 26h12M14 32h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="14" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M36 12v4M34 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const STATUS_ICON_REGISTRY: Record<string, React.ReactNode> = {
    sent: <CheckCircleOutlined />,
    delivered: <CheckCircleOutlined />,
    pending: <ClockCircleOutlined />,
    failed: <CloseCircleOutlined />,
    bounced: <ExclamationCircleOutlined />,
};

const TRIGGER_ICON_REGISTRY: Record<string, React.ReactNode> = {
    manual: <PlayCircleOutlined />,
    'scheduler:cron': <CalendarOutlined />,
    'scheduler:once': <ClockCircleOutlined />,
    healing: <RobotOutlined />,
};

export type NotificationRecord = NotificationRecordResponse;

type NotificationRecordsAdvancedSearch = {
    subject?: string;
    task_name?: string;
    status?: AutoHealing.NotificationStatus;
    channel_id?: string;
    template_id?: string;
    triggered_by?: string;
    created_at?: [string | undefined, string | undefined];
    channel?: string;
};

export type NotificationRecordsRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    sorter?: { field: string; order: 'ascend' | 'descend' };
    advancedSearch?: NotificationRecordsAdvancedSearch;
};

export type NotificationRecordsQuery = {
    page: number;
    page_size: number;
    subject?: string;
    task_name?: string;
    status?: AutoHealing.NotificationStatus;
    channel_id?: string;
    template_id?: string;
    triggered_by?: string;
    created_after?: string;
    created_before?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export const getTypeConfig = (type: string) => getChannelTypeConfig(type);
export const getStatusConfig = (status: string) => {
    const meta = NOTIF_LOG_STATUS_MAP[status] || { color: 'default', text: status || '-' };
    return {
        color: meta.color,
        icon: STATUS_ICON_REGISTRY[status] || <HistoryOutlined />,
        label: meta.text,
        tagColor: meta.color as 'success' | 'error' | 'warning' | 'default',
    };
};
export const getTriggeredByConfig = (triggeredBy?: string) => {
    const meta = getExecutionTriggeredByConfig(triggeredBy);
    return {
        color: meta.tagColor || meta.color,
        icon: TRIGGER_ICON_REGISTRY[triggeredBy || ''] || <HistoryOutlined />,
        label: meta.label,
    };
};

const getStatusCount = (stats: NotificationStatsSummary, status: string) =>
    stats.logs_by_status.find((item) => item.status === status)?.count || 0;

export const parseNestedJson = (value: unknown): unknown => {
    if (typeof value === 'string') {
        try {
            return parseNestedJson(JSON.parse(value));
        } catch {
            return value;
        }
    }
    if (Array.isArray(value)) {
        return value.map(parseNestedJson);
    }
    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            result[key] = parseNestedJson(nestedValue);
        }
        return result;
    }
    return value;
};

export const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

export const formatFullTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
};

export const NotificationStatsBar: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
    const [statsData, setStatsData] = useState<{
        total: number | null;
        sentCount: number | null;
        failedCount: number | null;
        pendingCount: number | null;
    }>({ total: null, sentCount: null, failedCount: null, pendingCount: null });

    useEffect(() => {
        getNotificationStats().then((response) => {
            setStatsData({
                total: response.logs_total || 0,
                sentCount: getStatusCount(response, 'sent') + getStatusCount(response, 'delivered'),
                failedCount: getStatusCount(response, 'failed') + getStatusCount(response, 'bounced'),
                pendingCount: getStatusCount(response, 'pending'),
            });
        }).catch(() => {
            message.error('加载通知统计失败，请稍后重试');
        });
    }, [refreshKey]);

    const { total, sentCount, failedCount, pendingCount } = statsData;
    const successRate = total && sentCount !== null ? ((sentCount / total) * 100).toFixed(1) : '--';
    const renderStatValue = (value: number | null) => value ?? '--';

    return (
        <div className="records-stats-bar">
            <div className="records-stat-item">
                <BellOutlined className="records-stat-icon records-stat-icon-total" />
                <div className="records-stat-content"><div className="records-stat-value">{renderStatValue(total)}</div><div className="records-stat-label">总通知</div></div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <CheckCircleOutlined className="records-stat-icon records-stat-icon-sent" />
                <div className="records-stat-content"><div className="records-stat-value">{renderStatValue(sentCount)}</div><div className="records-stat-label">已发送</div></div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <CloseCircleOutlined className="records-stat-icon records-stat-icon-failed" />
                <div className="records-stat-content"><div className="records-stat-value">{renderStatValue(failedCount)}</div><div className="records-stat-label">失败</div></div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <ClockCircleOutlined className="records-stat-icon records-stat-icon-pending" />
                <div className="records-stat-content"><div className="records-stat-value">{renderStatValue(pendingCount)}</div><div className="records-stat-label">待发送</div></div>
            </div>
            <div className="records-stat-divider" />
            <div className="records-stat-item">
                <SendOutlined className="records-stat-icon records-stat-icon-rate" />
                <div className="records-stat-content"><div className="records-stat-value">{successRate}%</div><div className="records-stat-label">成功率</div></div>
            </div>
        </div>
    );
};

export const RECORD_SEARCH_FIELDS = [
    { key: 'subject', label: '通知主题' },
    { key: 'task_name', label: '任务名称' },
];

export const buildRecordAdvancedSearchFields = (
    channels: AutoHealing.NotificationChannel[],
    templates: AutoHealing.NotificationTemplate[],
): AdvancedSearchField[] => [
    { key: 'subject', label: '通知主题', type: 'input', placeholder: '搜索通知主题' },
    { key: 'task_name', label: '任务名称', type: 'input', placeholder: '模糊搜索任务模板名称' },
    {
        key: 'status', label: '发送状态', type: 'select', placeholder: '全部状态',
        options: Object.entries(NOTIF_LOG_STATUS_MAP).map(([value, meta]) => ({ label: meta.text, value })),
    },
    { key: 'channel_id', label: '通知渠道', type: 'select', placeholder: '全部渠道', options: channels.map((item) => ({ label: item.name, value: item.id })) },
    { key: 'template_id', label: '通知模板', type: 'select', placeholder: '全部模板', options: templates.map((item) => ({ label: item.name, value: item.id })) },
    {
        key: 'triggered_by', label: '触发类型', type: 'select', placeholder: '全部类型',
        options: getExecutionTriggeredByOptions(),
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export const buildNotificationRecordsQuery = (params: NotificationRecordsRequestParams): NotificationRecordsQuery => {
    const query: NotificationRecordsQuery = {
        page: params.page,
        page_size: params.pageSize,
    };

    if (params.searchValue) {
        if (params.searchField === 'task_name') {
            query.task_name = params.searchValue;
        } else {
            query.subject = params.searchValue;
        }
    }
    if (params.sorter?.field && params.sorter.order) {
        query.sort_by = params.sorter.field;
        query.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
    }
    if (params.advancedSearch) {
        const search = params.advancedSearch;
        if (search.channel) query.channel_id = search.channel;
        if (search.created_at) {
            const [start, end] = search.created_at;
            if (start) query.created_after = toDayRangeStartISO(start);
            if (end) query.created_before = toDayRangeEndISO(end);
        }
        if (search.subject) query.subject = search.subject;
        if (search.task_name) query.task_name = search.task_name;
        if (search.status) query.status = search.status;
        if (search.channel_id) query.channel_id = search.channel_id;
        if (search.template_id) query.template_id = search.template_id;
        if (search.triggered_by) query.triggered_by = search.triggered_by;
    }

    return query;
};
