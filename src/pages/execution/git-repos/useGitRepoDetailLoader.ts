import { message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGitRepo } from '@/services/auto-healing/git-repos';
import { gitRepoFormInitialValues, parseSyncInterval, type GitRepoFormValues } from './gitRepoFormConfig';

type UseGitRepoDetailLoaderOptions = {
    applyLoadedValidation: (options: { branches?: string[] | null; defaultBranch?: string | null }) => void;
    form: FormInstance<GitRepoFormValues>;
    isEdit: boolean;
    repoId?: string;
    resetValidation: () => void;
};

function resetGitRepoForm(form: FormInstance<GitRepoFormValues>) {
    form.resetFields();
    form.setFieldsValue(gitRepoFormInitialValues);
}

function applyRepoDetail(form: FormInstance<GitRepoFormValues>, repo: Awaited<ReturnType<typeof getGitRepo>>) {
    const syncInterval = parseSyncInterval(repo.sync_interval);
    form.setFieldsValue({
        auth_type: repo.auth_type || 'none',
        default_branch: repo.default_branch,
        interval_unit: syncInterval.intervalUnit,
        interval_value: syncInterval.intervalValue,
        max_failures: repo.max_failures ?? 5,
        name: repo.name,
        sync_enabled: repo.sync_enabled || false,
        url: repo.url,
    });
}

export function useGitRepoDetailLoader(options: UseGitRepoDetailLoaderOptions) {
    const { applyLoadedValidation, form, isEdit, repoId, resetValidation } = options;
    const [loadFailed, setLoadFailed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [originalAuthType, setOriginalAuthType] = useState('none');
    const loadRequestIdRef = useRef(0);

    const resetDetailState = useCallback(() => {
        setLoadFailed(false);
        setLoading(false);
        setOriginalAuthType('none');
        resetValidation();
        resetGitRepoForm(form);
    }, [form, resetValidation]);

    const loadRepoDetail = useCallback(async (nextRepoId: string) => {
        const requestId = loadRequestIdRef.current + 1;
        loadRequestIdRef.current = requestId;
        setLoadFailed(false);
        setLoading(true);
        setOriginalAuthType('none');
        resetValidation();
        resetGitRepoForm(form);

        try {
            const repo = await getGitRepo(nextRepoId);
            if (loadRequestIdRef.current !== requestId) {
                return;
            }

            applyRepoDetail(form, repo);
            applyLoadedValidation({
                branches: repo.branches,
                defaultBranch: repo.default_branch,
            });
            setOriginalAuthType(repo.auth_type || 'none');
        } catch {
            if (loadRequestIdRef.current === requestId) {
                setLoadFailed(true);
                message.error('加载仓库详情失败');
            }
        } finally {
            if (loadRequestIdRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [applyLoadedValidation, form, resetValidation]);

    useEffect(() => {
        if (!isEdit || !repoId) {
            loadRequestIdRef.current += 1;
            resetDetailState();
            return;
        }

        void loadRepoDetail(repoId);
    }, [isEdit, loadRepoDetail, repoId, resetDetailState]);

    const reloadDetail = repoId
        ? (() => {
            const currentRepoId = repoId;
            return () => void loadRepoDetail(currentRepoId);
        })()
        : undefined;

    return {
        loadFailed,
        loading,
        originalAuthType,
        reloadDetail,
    };
}
