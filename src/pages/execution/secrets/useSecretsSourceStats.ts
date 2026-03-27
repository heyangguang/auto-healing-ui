import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSecretsSourcesStats } from '@/services/auto-healing/secrets';
import { summarizeSecretsSources, type SecretsStatsSummary } from './secretSourcePageConfig';
import { INITIAL_SECRETS_STATS } from './secretSourceColumns';

export function useSecretsSourceStats(refreshTrigger: number) {
    const [stats, setStats] = useState<SecretsStatsSummary>(INITIAL_SECRETS_STATS);
    const statsRequestIdRef = useRef(0);

    useEffect(() => {
        const requestId = statsRequestIdRef.current + 1;
        statsRequestIdRef.current = requestId;
        getSecretsSourcesStats()
            .then((response) => {
                if (statsRequestIdRef.current !== requestId) {
                    return;
                }
                const byStatus = response.by_status || [];
                const byType = response.by_type || [];
                const getStatusCount = (status: string) => byStatus.find((item) => item.status === status)?.count || 0;
                const getTypeCount = (type: string) => byType.find((item) => item.type === type)?.count || 0;
                setStats({ active: getStatusCount('active'), file: getTypeCount('file'), total: response.total || 0, vault: getTypeCount('vault'), webhook: getTypeCount('webhook') });
            })
            .catch(() => {
                if (statsRequestIdRef.current === requestId) {
                    message.error('加载密钥源统计失败');
                }
            });
    }, [refreshTrigger]);

    const setStatsFromItems = useCallback((items: AutoHealing.SecretsSource[]) => {
        statsRequestIdRef.current += 1;
        setStats(summarizeSecretsSources(items));
    }, []);

    return {
        setStatsFromItems,
        stats,
    };
}
