import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getExecutionTask,
    getExecutionTaskStats,
    getExecutionTasks,
} from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';
import {
    buildLaunchpadAdvancedParams,
    getExecutionTemplateStatusFilter,
    INITIAL_STATS,
    INITIAL_STATS_AVAILABILITY,
    type ExecutionStats,
    type ExecutionStatsAvailability,
    type LaunchpadSearchParams,
    type TemplateQueryParams,
} from './executePageHelpers';

const DERIVED_STATS_PAGE_SIZE = 1;
const LAUNCHPAD_LOAD_ERROR = '任务模板加载失败，请稍后重试';

export function useExecuteLaunchpadData(options: {
    onSelectTemplate: (template: AutoHealing.ExecutionTask) => Promise<void>;
    preselectedTemplateSequenceRef: React.MutableRefObject<ReturnType<typeof createRequestSequence>>;
}) {
    const { onSelectTemplate, preselectedTemplateSequenceRef } = options;
    const [templates, setTemplates] = useState<AutoHealing.ExecutionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string>();
    const [searchText, setSearchText] = useState('');
    const [filterExecutor, setFilterExecutor] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [advancedParams, setAdvancedParams] = useState<Record<string, unknown>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTemplates, setTotalTemplates] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const [pageSize, setPageSize] = useState(16);
    const [stats, setStats] = useState<ExecutionStats>(INITIAL_STATS);
    const [statsAvailability, setStatsAvailability] = useState<ExecutionStatsAvailability>(INITIAL_STATS_AVAILABILITY);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const listRequestSequenceRef = useRef(createRequestSequence());
    const previousFilterSignatureRef = useRef('');

    const loadTemplates = useCallback(async (params: TemplateQueryParams = {}) => {
        const { page, name, executor_type, status, playbook_id, playbook_name, target_hosts, needs_review, last_run_status, has_runs, created_from, created_to, ...rest } = params;
        const response = await getExecutionTasks({
            page: page || 1,
            page_size: pageSize,
            name: name || undefined,
            executor_type: executor_type || undefined,
            status: status || undefined,
            playbook_id: playbook_id || undefined,
            playbook_name: playbook_name || undefined,
            target_hosts: target_hosts || undefined,
            needs_review,
            last_run_status: last_run_status || undefined,
            has_runs,
            created_from: created_from || undefined,
            created_to: created_to || undefined,
            ...rest,
        });
        return { data: response.data || [], total: response.total || 0 };
    }, [pageSize]);

    const loadDependencies = useCallback(async () => {
        const [secretsResult, channelsResult, templatesResult] = await Promise.allSettled([
            getSecretsSources(),
            getCachedNotificationChannelInventory(),
            getCachedNotificationTemplateInventory(),
        ]);
        if (secretsResult.status === 'fulfilled') setSecretsSources(secretsResult.value.data || []);
        if (channelsResult.status === 'fulfilled') setChannels(channelsResult.value);
        if (templatesResult.status === 'fulfilled') setNotifyTemplates(templatesResult.value);
        if ([secretsResult, channelsResult, templatesResult].some((result) => result.status === 'rejected')) {
            message.error('执行页面依赖数据加载失败');
        }
    }, []);

    const refreshStats = useCallback(async () => {
        const [statsResult, readyResult, neverExecutedResult, lastRunFailedResult] = await Promise.allSettled([
            getExecutionTaskStats(),
            getExecutionTasks({ page: 1, page_size: DERIVED_STATS_PAGE_SIZE, status: 'ready' }),
            getExecutionTasks({ page: 1, page_size: DERIVED_STATS_PAGE_SIZE, has_runs: false }),
            getExecutionTasks({ page: 1, page_size: DERIVED_STATS_PAGE_SIZE, last_run_status: 'failed' }),
        ]);
        setStats((prev) => ({
            ...prev,
            ...(statsResult.status === 'fulfilled' ? statsResult.value : {}),
            ...(readyResult.status === 'fulfilled' ? { ready: readyResult.value.total || 0 } : {}),
            ...(neverExecutedResult.status === 'fulfilled' ? { never_executed: neverExecutedResult.value.total || 0 } : {}),
            ...(lastRunFailedResult.status === 'fulfilled' ? { last_run_failed: lastRunFailedResult.value.total || 0 } : {}),
        }));
        setStatsAvailability((prev) => ({
            ...prev,
            ...(statsResult.status === 'fulfilled' ? {
                total: true,
                docker: true,
                local: true,
                needs_review: true,
                changed_playbooks: true,
            } : {}),
            ...(readyResult.status === 'fulfilled' ? { ready: true } : {}),
            ...(neverExecutedResult.status === 'fulfilled' ? { never_executed: true } : {}),
            ...(lastRunFailedResult.status === 'fulfilled' ? { last_run_failed: true } : {}),
        }));
    }, []);

    const refreshData = useCallback(async () => {
        const token = listRequestSequenceRef.current.next();
        const apiStatus = getExecutionTemplateStatusFilter(filterStatus, false);
        setLoading(true);
        setListError(undefined);
        try {
            const response = await loadTemplates({
                page: currentPage,
                name: searchText || undefined,
                executor_type: filterExecutor || undefined,
                status: apiStatus || undefined,
                ...advancedParams,
            });
            if (!listRequestSequenceRef.current.isCurrent(token)) return;
            setTemplates(response.data);
            setTotalTemplates(response.total);
        } catch {
            if (!listRequestSequenceRef.current.isCurrent(token)) return;
            setTemplates([]);
            setTotalTemplates(0);
            setListError(LAUNCHPAD_LOAD_ERROR);
        } finally {
            if (listRequestSequenceRef.current.isCurrent(token)) setLoading(false);
        }
    }, [advancedParams, currentPage, filterExecutor, filterStatus, loadTemplates, searchText]);

    useEffect(() => {
        const init = async () => {
            void loadDependencies();
            setInitialized(true);
            void refreshStats();
            const templateId = new URLSearchParams(window.location.search).get('template');
            if (!templateId) {
                return;
            }
            const token = preselectedTemplateSequenceRef.current.next();
            try {
                const response = await getExecutionTask(templateId);
                if (!preselectedTemplateSequenceRef.current.isCurrent(token)) return;
                if (response.data?.id) {
                    await onSelectTemplate(response.data);
                    return;
                }
                message.warning('预选任务模板不存在或不可用，请重新选择');
            } catch {
                if (preselectedTemplateSequenceRef.current.isCurrent(token)) {
                    message.warning('预选任务模板加载失败，请重新选择');
                }
            }
        };
        void init();
    }, [loadDependencies, onSelectTemplate, preselectedTemplateSequenceRef, refreshStats]);

    const filterSignature = useMemo(() => JSON.stringify({
        searchText,
        filterExecutor,
        filterStatus,
        advancedParams,
    }), [advancedParams, filterExecutor, filterStatus, searchText]);

    useEffect(() => {
        const filtersChanged = previousFilterSignatureRef.current !== filterSignature;
        previousFilterSignatureRef.current = filterSignature;
        if (filtersChanged && currentPage !== 1) {
            setCurrentPage(1);
            return;
        }
        void refreshData();
    }, [currentPage, filterSignature, pageSize, refreshData]);

    const handleLaunchpadSearch = useCallback((params: LaunchpadSearchParams) => {
        const { extra, newExecutor, newSearch, newStatus } = buildLaunchpadAdvancedParams(params);
        setSearchText(newSearch);
        setFilterExecutor(newExecutor);
        setFilterStatus(newStatus);
        const advancedSearch = params.advancedSearch;
        if (advancedSearch) {
            if (advancedSearch.needs_review !== undefined && advancedSearch.needs_review !== null && advancedSearch.needs_review !== '') {
                extra.needs_review = advancedSearch.needs_review === 'true' || advancedSearch.needs_review === true;
            }
            if (advancedSearch.has_runs !== undefined && advancedSearch.has_runs !== null && advancedSearch.has_runs !== '') {
                extra.has_runs = advancedSearch.has_runs === 'true' || advancedSearch.has_runs === true;
            }
            if (Array.isArray(advancedSearch.created_at) && advancedSearch.created_at.length === 2) {
                extra.created_from = toDayRangeStartISO(advancedSearch.created_at[0]);
                extra.created_to = toDayRangeEndISO(advancedSearch.created_at[1]);
            }
            Object.entries(advancedSearch).forEach(([key, value]) => {
                if (['needs_review', 'has_runs', 'created_at'].includes(key) || value === undefined || value === null || value === '') {
                    return;
                }
                extra[key] = value;
            });
        }
        setAdvancedParams(extra);
    }, []);

    return {
        channels,
        currentPage,
        initialized,
        listError,
        loading,
        notifyTemplates,
        pageSize,
        secretsSources,
        stats,
        statsAvailability,
        templates,
        totalTemplates,
        handleLaunchpadSearch,
        refreshData,
        setCurrentPage,
        setPageSize,
    };
}
