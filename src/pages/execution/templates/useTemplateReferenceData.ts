import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
    getCachedPlaybookInventory,
} from '@/utils/selectorInventoryCache';
import { getExecutionTaskStats, type ExecutionTaskStatsSummary } from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { createRequestSequence } from '@/utils/requestSequence';
import type { TemplateStats } from './templateListHelpers';

const EMPTY_STATS: TemplateStats = {
    total: 0,
    docker: 0,
    local: 0,
    needsReview: 0,
    changedPlaybooks: 0,
};

type TemplateReferenceData = {
    notifyChannels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    playbooks: AutoHealing.Playbook[];
    secretsSources: AutoHealing.SecretsSource[];
    stats: TemplateStats;
};

export function useTemplateReferenceData(refreshTrigger: number) {
    const [referenceData, setReferenceData] = useState<TemplateReferenceData>({
        notifyChannels: [],
        notifyTemplates: [],
        playbooks: [],
        secretsSources: [],
        stats: EMPTY_STATS,
    });
    const requestSequenceRef = useRef(createRequestSequence());

    const loadReferenceData = useCallback(async () => {
        const token = requestSequenceRef.current.next();
        try {
            const [playbooks, secretsResult, notifyChannels, notifyTemplates, statsResult] = await Promise.all([
                getCachedPlaybookInventory().then((items) => items.filter((item) => item.status === 'ready')),
                getSecretsSources(),
                getCachedNotificationChannelInventory(),
                getCachedNotificationTemplateInventory(),
                getExecutionTaskStats(),
            ]);
            if (!requestSequenceRef.current.isCurrent(token)) {
                return;
            }
            const stats = statsResult as ExecutionTaskStatsSummary;
            setReferenceData({
                playbooks,
                secretsSources: secretsResult.data || [],
                notifyChannels,
                notifyTemplates,
                stats: {
                    total: stats.total ?? 0,
                    docker: stats.docker ?? 0,
                    local: stats.local ?? 0,
                    needsReview: stats.needs_review ?? 0,
                    changedPlaybooks: stats.changed_playbooks ?? 0,
                },
            });
        } catch {
            if (requestSequenceRef.current.isCurrent(token)) {
                message.error('模板引用数据加载失败');
            }
        }
    }, []);

    useEffect(() => {
        void loadReferenceData();
        return () => {
            requestSequenceRef.current.invalidate();
        };
    }, [loadReferenceData, refreshTrigger]);

    return {
        ...referenceData,
        loadReferenceData,
    };
}
