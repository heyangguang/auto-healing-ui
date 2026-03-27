import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import {
    deleteGitRepo,
    getCommits,
    getGitRepo,
    getSyncLogs,
    syncGitRepo,
    type GitCommitRecord,
    type GitRepositoryRecord,
    type GitSyncLogRecord,
} from '@/services/auto-healing/git-repos';
import { getPlaybooks } from '@/services/auto-healing/playbooks';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { getErrorMessage } from './gitRepoListMeta';

const COMMIT_PREVIEW_LIMIT = 5;

type UseGitRepoDrawerDetailStateOptions = {
    triggerRefresh: () => void;
};

export function useGitRepoDrawerDetailState(options: UseGitRepoDrawerDetailStateOptions) {
    const { triggerRefresh } = options;
    const [syncing, setSyncing] = useState<string>();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<GitRepositoryRecord>();
    const [activeTab, setActiveTab] = useState('info');
    const [commits, setCommits] = useState<GitCommitRecord[]>([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [syncLogs, setSyncLogs] = useState<GitSyncLogRecord[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [drawerPlaybooks, setDrawerPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const detailRequestIdRef = useRef(0);

    const resetDrawerData = useCallback(() => {
        setActiveTab('info');
        setCommits([]);
        setSyncLogs([]);
        setDrawerPlaybooks([]);
        setLoadingCommits(false);
        setLoadingLogs(false);
    }, []);

    const loadDrawerPlaybooks = useCallback((repoId: string, requestId: number) => {
        fetchAllPages<AutoHealing.Playbook>((page, pageSize) => getPlaybooks({ repository_id: repoId, page, page_size: pageSize }))
            .then((items) => {
                if (detailRequestIdRef.current === requestId) {
                    setDrawerPlaybooks(items);
                }
            })
            .catch((error) => {
                if (detailRequestIdRef.current === requestId) {
                    message.error(getErrorMessage(error, '加载关联 Playbook 失败'));
                }
            });
    }, []);

    const loadDrawerCommits = useCallback(async (repo: GitRepositoryRecord, requestId: number) => {
        setCommits([]);
        setLoadingCommits(repo.status === 'ready');
        if (repo.status !== 'ready') {
            return;
        }
        try {
            const commitItems = await getCommits(repo.id, COMMIT_PREVIEW_LIMIT);
            if (detailRequestIdRef.current === requestId) {
                setCommits(commitItems);
            }
        } catch (error) {
            if (detailRequestIdRef.current === requestId) {
                message.error(getErrorMessage(error, '加载 Commit 历史失败'));
            }
        } finally {
            if (detailRequestIdRef.current === requestId) {
                setLoadingCommits(false);
            }
        }
    }, []);

    const loadDrawerLogs = useCallback(async (repoId: string, requestId: number) => {
        setLoadingLogs(true);
        try {
            const logs = await fetchAllPages<GitSyncLogRecord>((page, pageSize) => getSyncLogs(repoId, { page, page_size: pageSize }));
            if (detailRequestIdRef.current === requestId) {
                setSyncLogs(logs);
            }
        } catch (error) {
            if (detailRequestIdRef.current === requestId) {
                message.error(getErrorMessage(error, '加载同步日志失败'));
            }
        } finally {
            if (detailRequestIdRef.current === requestId) {
                setLoadingLogs(false);
            }
        }
    }, []);

    const refreshDrawerDetail = useCallback(async (repoId: string, requestId: number) => {
        try {
            const repoResponse = await getGitRepo(repoId);
            if (detailRequestIdRef.current !== requestId) {
                return;
            }
            setCurrentRow(repoResponse);
            loadDrawerPlaybooks(repoResponse.id, requestId);
            await Promise.all([
                loadDrawerCommits(repoResponse, requestId),
                loadDrawerLogs(repoResponse.id, requestId),
            ]);
        } catch (error) {
            if (detailRequestIdRef.current === requestId) {
                message.error(getErrorMessage(error, '加载仓库详情失败'));
                setLoadingCommits(false);
                setLoadingLogs(false);
            }
        }
    }, [loadDrawerCommits, loadDrawerLogs, loadDrawerPlaybooks]);

    const handleSync = useCallback(async (repo: GitRepositoryRecord) => {
        const detailRequestId = drawerOpen && currentRow?.id === repo.id
            ? detailRequestIdRef.current
            : undefined;
        setSyncing(repo.id);
        try {
            await syncGitRepo(repo.id);
            message.success('同步已触发');
            triggerRefresh();
            if (detailRequestId === undefined || detailRequestIdRef.current !== detailRequestId) {
                return;
            }
            await refreshDrawerDetail(repo.id, detailRequestId);
        } catch (error) {
            message.error(getErrorMessage(error, '同步仓库失败'));
        } finally {
            setSyncing(undefined);
        }
    }, [currentRow, drawerOpen, refreshDrawerDetail, triggerRefresh]);

    const openDetail = useCallback(async (record: GitRepositoryRecord) => {
        const requestId = detailRequestIdRef.current + 1;
        detailRequestIdRef.current = requestId;
        setCurrentRow(record);
        setDrawerOpen(true);
        resetDrawerData();
        await refreshDrawerDetail(record.id, requestId);
    }, [refreshDrawerDetail, resetDrawerData]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteGitRepo(id);
            message.success('删除成功');
            detailRequestIdRef.current += 1;
            setDrawerOpen(false);
            setCurrentRow(undefined);
            resetDrawerData();
            triggerRefresh();
        } catch (error) {
            message.error(getErrorMessage(error, '删除仓库失败'));
        }
    }, [resetDrawerData, triggerRefresh]);

    const closeDetail = useCallback(() => {
        detailRequestIdRef.current += 1;
        setDrawerOpen(false);
        setCurrentRow(undefined);
        resetDrawerData();
    }, [resetDrawerData]);

    const invalidateDetail = useCallback(() => {
        detailRequestIdRef.current += 1;
    }, []);

    return {
        activeTab,
        closeDetail,
        commits,
        currentRow,
        drawerOpen,
        drawerPlaybooks,
        handleDelete,
        handleSync,
        invalidateDetail,
        loadingCommits,
        loadingLogs,
        openDetail,
        setActiveTab,
        setCurrentRow,
        syncing,
        syncLogs,
    };
}
