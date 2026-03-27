import { history } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DictItem } from '@/services/auto-healing/dictionary';
import { getDictionaries } from '@/services/auto-healing/dictionary';
import { getGitRepoStats, type GitRepositoryRecord } from '@/services/auto-healing/git-repos';
import type { GitRepoStats } from './gitRepoListMeta';

const INITIAL_STATS: GitRepoStats = {
    total: 0,
    ready: 0,
    syncing: 0,
    pending: 0,
    error: 0,
};

export function useGitRepoMetadataState(refreshTrigger: number) {
    const [stats, setStats] = useState<GitRepoStats>(INITIAL_STATS);
    const [statusOptions, setStatusOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [authTypeOptions, setAuthTypeOptions] = useState<Array<{ label: string; value: string }>>([]);
    const statsRequestIdRef = useRef(0);

    useEffect(() => {
        const requestId = statsRequestIdRef.current + 1;
        statsRequestIdRef.current = requestId;
        getGitRepoStats()
            .then((statsResponse) => {
                if (statsRequestIdRef.current !== requestId) return;
                const byStatus = statsResponse.by_status || [];
                const getCount = (status: string) => byStatus.find((item) => item.status === status)?.count || 0;
                setStats({
                    total: statsResponse.total || 0,
                    ready: getCount('ready'),
                    syncing: getCount('syncing'),
                    pending: getCount('pending'),
                    error: getCount('error'),
                });
            })
            .catch(() => {
                if (statsRequestIdRef.current === requestId) {
                    message.error('加载仓库统计失败');
                }
            });
    }, [refreshTrigger]);

    useEffect(() => {
        getDictionaries(['git_repo_status', 'git_auth_type'])
            .then((response) => {
                const toOptions = (items: DictItem[]) => items.map((item) => ({ label: item.label, value: item.dict_key }));
                if (response.git_repo_status) setStatusOptions(toOptions(response.git_repo_status));
                if (response.git_auth_type) setAuthTypeOptions(toOptions(response.git_auth_type));
            })
            .catch(() => {
                message.error('加载仓库筛选选项失败');
            });
    }, []);

    const openCreate = useCallback(() => {
        history.push('/execution/git-repos/create');
    }, []);

    const openEdit = useCallback((record: GitRepositoryRecord) => {
        history.push(`/execution/git-repos/${record.id}/edit`);
    }, []);

    return {
        authTypeOptions,
        openCreate,
        openEdit,
        stats,
        statusOptions,
    };
}
