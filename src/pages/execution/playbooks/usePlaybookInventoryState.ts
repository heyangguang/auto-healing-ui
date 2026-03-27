import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPlaybooks, getPlaybookStats } from '@/services/auto-healing/playbooks';
import { getCachedGitRepoInventory, getCachedPlaybookInventory } from '@/utils/selectorInventoryCache';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import {
    buildPlaybookQueryParams,
    buildPlaybookSearchParams,
    type PlaybookSearchParams,
} from './playbookSearchParams';

const INITIAL_STATS = { total: 0, ready: 0, pendingScan: 0, pendingOnline: 0, error: 0 };
type PlaybookStatsState = typeof INITIAL_STATS;
type PlaybookDateRangeValue = [Parameters<typeof toDayRangeStartISO>[0], Parameters<typeof toDayRangeEndISO>[0]];
type PlaybookAdvancedSearchParams = Record<string, unknown> & {
    created_at?: PlaybookDateRangeValue;
};

function mapPlaybookStats(statsResponse: Awaited<ReturnType<typeof getPlaybookStats>>) {
    const byStatus = statsResponse.by_status || [];
    const getCount = (status: string) => byStatus.find((item) => item.status === status)?.count || 0;
    return {
        total: statsResponse.total || 0,
        ready: getCount('ready'),
        pendingScan: getCount('pending'),
        pendingOnline: getCount('scanned'),
        error: getCount('error') + getCount('invalid'),
    };
}

function getPlaybookStatsKey(status?: AutoHealing.PlaybookStatus): keyof PlaybookStatsState | undefined {
    if (status === 'ready') return 'ready';
    if (status === 'pending') return 'pendingScan';
    if (status === 'scanned') return 'pendingOnline';
    if (status === 'error' || status === 'invalid') return 'error';
    return undefined;
}

function decrementPlaybookStats(stats: PlaybookStatsState, status?: AutoHealing.PlaybookStatus) {
    const key = getPlaybookStatsKey(status);
    if (!key) {
        return {
            ...stats,
            total: Math.max(0, stats.total - 1),
        };
    }
    return {
        ...stats,
        total: Math.max(0, stats.total - 1),
        [key]: Math.max(0, stats[key] - 1),
    };
}

function transitionPlaybookStats(
    stats: PlaybookStatsState,
    fromStatus?: AutoHealing.PlaybookStatus,
    toStatus?: AutoHealing.PlaybookStatus,
) {
    const fromKey = getPlaybookStatsKey(fromStatus);
    const toKey = getPlaybookStatsKey(toStatus);
    if (!fromKey || !toKey || fromKey === toKey) {
        return stats;
    }
    return {
        ...stats,
        [fromKey]: Math.max(0, stats[fromKey] - 1),
        [toKey]: stats[toKey] + 1,
    };
}

function useExpandedRepoKeys(groupedPlaybooks: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }>) {
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [hasInitialExpanded, setHasInitialExpanded] = useState(false);

    useEffect(() => {
        const repoKeys = Object.keys(groupedPlaybooks);
        if (repoKeys.length > 0 && !hasInitialExpanded) {
            setExpandedKeys(repoKeys);
            setHasInitialExpanded(true);
        }
    }, [groupedPlaybooks, hasInitialExpanded]);

    const toggleRepo = useCallback((repoId: string) => {
        setExpandedKeys((prev) => prev.includes(repoId) ? prev.filter((key) => key !== repoId) : [...prev, repoId]);
    }, []);

    return { expandedKeys, toggleRepo };
}
export function usePlaybookInventoryState() {
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [repos, setRepos] = useState<AutoHealing.GitRepository[]>([]);
    const [searchParams, setSearchParams] = useState<PlaybookSearchParams>({});
    const [initialized, setInitialized] = useState(false);
    const [stats, setStats] = useState(INITIAL_STATS);
    const playbookRequestIdRef = useRef(0);
    const playbooksRef = useRef<AutoHealing.Playbook[]>([]);

    const commitPlaybooks = useCallback((items: AutoHealing.Playbook[]) => {
        playbooksRef.current = items;
        setPlaybooks(items);
    }, []);

    const loadPlaybooks = useCallback(async (params?: PlaybookSearchParams) => {
        const requestId = playbookRequestIdRef.current + 1;
        playbookRequestIdRef.current = requestId;
        const nextParams = params || searchParams;
        const queryParams = buildPlaybookQueryParams(nextParams);
        try {
            const items = await fetchAllPages<AutoHealing.Playbook>((page, pageSize) => getPlaybooks({ ...queryParams, page, page_size: pageSize }));
            if (playbookRequestIdRef.current === requestId) {
                commitPlaybooks(items);
            }
        } catch (error) {
            if (playbookRequestIdRef.current === requestId) {
                const messageText = error instanceof Error ? error.message : '加载 Playbook 列表失败';
                message.error(messageText);
            }
        }

        try {
            const statsResponse = await getPlaybookStats();
            if (playbookRequestIdRef.current === requestId) {
                setStats(mapPlaybookStats(statsResponse));
            }
        } catch (error) {
            if (playbookRequestIdRef.current === requestId) {
                const messageText = error instanceof Error ? error.message : '加载 Playbook 统计失败';
                message.error(messageText);
            }
        }
    }, [commitPlaybooks, searchParams]);

    useEffect(() => {
        const requestId = playbookRequestIdRef.current + 1;
        playbookRequestIdRef.current = requestId;
        Promise.allSettled([
            getCachedPlaybookInventory(),
            getCachedGitRepoInventory().then((items) => items.filter((item) => item.status === 'ready')),
            getPlaybookStats(),
        ]).then(([playbookResult, repoResult, statsResult]) => {
            if (playbookResult.status === 'fulfilled' && playbookRequestIdRef.current === requestId) {
                commitPlaybooks(playbookResult.value);
            } else if (playbookResult.status === 'rejected' && playbookRequestIdRef.current === requestId) {
                message.error('加载 Playbook 列表失败');
            }
            if (repoResult.status === 'fulfilled') {
                setRepos(repoResult.value);
            } else {
                message.error('加载仓库库存失败');
            }
            if (statsResult.status === 'fulfilled') {
                setStats(mapPlaybookStats(statsResult.value));
            } else {
                message.error('加载 Playbook 统计失败');
            }
        }).finally(() => setInitialized(true));
    }, [commitPlaybooks]);

    const mergePlaybookInInventory = useCallback((playbook: AutoHealing.Playbook) => {
        const currentItems = playbooksRef.current;
        const currentPlaybook = currentItems.find((item) => item.id === playbook.id);
        if (!currentPlaybook) {
            return;
        }
        commitPlaybooks(currentItems.map((item) => item.id === playbook.id ? { ...item, ...playbook } : item));
        setStats((currentStats) => transitionPlaybookStats(currentStats, currentPlaybook.status, playbook.status));
    }, [commitPlaybooks]);

    const removePlaybookFromInventory = useCallback((playbook: AutoHealing.Playbook) => {
        commitPlaybooks(playbooksRef.current.filter((item) => item.id !== playbook.id));
        setStats((currentStats) => decrementPlaybookStats(currentStats, playbook.status));
    }, [commitPlaybooks]);

    const groupedPlaybooks = useMemo(() => {
        const groups: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }> = {};
        playbooks.forEach((playbook) => {
            if (!groups[playbook.repository_id]) {
                groups[playbook.repository_id] = { playbooks: [], repo: repos.find((repo) => repo.id === playbook.repository_id) || null };
            }
            groups[playbook.repository_id].playbooks.push(playbook);
        });
        return groups;
    }, [playbooks, repos]);
    const expansion = useExpandedRepoKeys(groupedPlaybooks);

    const handleSearch = useCallback(({ advancedSearch, searchField, searchValue }: {
        advancedSearch?: PlaybookAdvancedSearchParams;
        searchField?: string;
        searchValue?: string;
    }) => {
        const createdAt = advancedSearch?.created_at;
        const { created_at: _createdAt, ...searchFields } = advancedSearch || {};
        const params = buildPlaybookSearchParams(searchFields);
        if (searchField && searchValue !== undefined) {
            params[searchField.replace(/^__enum__/, '')] = searchValue;
        }
        if (Array.isArray(createdAt) && createdAt.length === 2) {
            if (createdAt[0]) params.created_from = toDayRangeStartISO(createdAt[0]);
            if (createdAt[1]) params.created_to = toDayRangeEndISO(createdAt[1]);
            delete params.created_at;
        }
        setSearchParams(params);
        void loadPlaybooks(params);
    }, [loadPlaybooks]);

    return {
        expandedKeys: expansion.expandedKeys,
        groupedPlaybooks,
        handleSearch,
        initialized,
        loadPlaybooks,
        mergePlaybookInInventory,
        removePlaybookFromInventory,
        repos,
        stats,
        toggleRepo: expansion.toggleRepo,
    };
}
