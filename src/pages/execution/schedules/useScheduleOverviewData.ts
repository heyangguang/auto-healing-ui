import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
    getExecutionScheduleStats,
    getExecutionTasks,
    getScheduleTimeline,
} from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';
import { fetchAllPages } from '@/utils/fetchAllPages';
import {
    getScheduleTypeCount,
    getStatusCount,
    toTimelineSchedule,
    type ScheduleStats,
} from './schedulePageHelpers';

const INITIAL_STATS: ScheduleStats = {
    total: 0,
    active: 0,
    paused: 0,
    cron: 0,
};

export function useScheduleOverviewData(refreshTrigger: number) {
    const [stats, setStats] = useState<ScheduleStats>(INITIAL_STATS);
    const [allSchedules, setAllSchedules] = useState<AutoHealing.ExecutionSchedule[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [vizLoading, setVizLoading] = useState(true);
    const requestSequenceRef = useRef(createRequestSequence());

    const templateMap = useMemo(() => {
        const map: Record<string, AutoHealing.ExecutionTask> = {};
        templates.forEach((item) => {
            map[item.id] = item;
        });
        return map;
    }, [templates]);

    const loadAllData = useCallback(async () => {
        const token = requestSequenceRef.current.next();
        setVizLoading(true);
        try {
            const [timelineRes, taskRes, channelRes, templateRes, secretRes, statsRes] = await Promise.all([
                getScheduleTimeline({ date: dayjs().format('YYYY-MM-DD') }),
                fetchAllPages<AutoHealing.ExecutionTask>(
                    (page, pageSize) => getExecutionTasks({ page, page_size: pageSize }),
                ),
                getCachedNotificationChannelInventory().catch(() => []),
                getCachedNotificationTemplateInventory().catch(() => []),
                getSecretsSources().catch(() => ({ data: [] })),
                getExecutionScheduleStats(),
            ]);
            if (!requestSequenceRef.current.isCurrent(token)) {
                return;
            }
            setAllSchedules(timelineRes.map(toTimelineSchedule));
            setTemplates(taskRes);
            setChannels(channelRes);
            setNotifyTemplates(templateRes);
            setSecretsSources(secretRes.data || []);
            setStats({
                total: statsRes.total || 0,
                active: statsRes.enabled_count || 0,
                paused: (statsRes.disabled_count || 0) + getStatusCount(statsRes, 'auto_paused'),
                cron: getScheduleTypeCount(statsRes, 'cron'),
            });
        } catch (error) {
            console.error(error);
        } finally {
            if (requestSequenceRef.current.isCurrent(token)) {
                setVizLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void loadAllData();
    }, [loadAllData]);

    useEffect(() => {
        if (refreshTrigger > 0) {
            void loadAllData();
        }
    }, [loadAllData, refreshTrigger]);

    return {
        allSchedules,
        channels,
        loadAllData,
        notifyTemplates,
        secretsSources,
        stats,
        templateMap,
        templates,
        vizLoading,
    };
}
