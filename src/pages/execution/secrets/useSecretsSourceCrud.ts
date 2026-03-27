import { history } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { deleteSecretsSource, disableSecretsSource, enableSecretsSource, getSecretsSource, updateSecretsSource } from '@/services/auto-healing/secrets';
import { getErrorMessage } from '../git-repos/gitRepoListMeta';

export function useSecretsSourceCrud(triggerRefresh: () => void) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentSource, setCurrentSource] = useState<AutoHealing.SecretsSource | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string>();
    const detailRequestIdRef = useRef(0);

    const patchCurrentSource = useCallback((sourceId: string, updater: (source: AutoHealing.SecretsSource) => AutoHealing.SecretsSource) => {
        setCurrentSource((source) => {
            if (!source || source.id !== sourceId) {
                return source;
            }
            return updater(source);
        });
    }, []);

    const openCreate = useCallback(() => {
        history.push('/resources/secrets/create');
    }, []);

    const openEdit = useCallback((source: AutoHealing.SecretsSource) => {
        history.push(`/resources/secrets/${source.id}/edit`);
    }, []);

    const openDetail = useCallback(async (source: AutoHealing.SecretsSource) => {
        const requestId = detailRequestIdRef.current + 1;
        detailRequestIdRef.current = requestId;
        setDetailError(undefined);
        setCurrentSource(source);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const detail = await getSecretsSource(source.id);
            if (detailRequestIdRef.current === requestId) {
                setCurrentSource(detail);
            }
        } catch (error) {
            if (detailRequestIdRef.current === requestId) {
                const messageText = getErrorMessage(error, '加载密钥源详情失败');
                setDetailError(messageText);
                message.error(messageText);
            }
        } finally {
            if (detailRequestIdRef.current === requestId) {
                setDetailLoading(false);
            }
        }
    }, []);

    const closeDetail = useCallback(() => {
        detailRequestIdRef.current += 1;
        setDetailLoading(false);
        setDetailError(undefined);
        setDrawerOpen(false);
        setCurrentSource(null);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteSecretsSource(id);
            message.success('已删除');
            closeDetail();
            triggerRefresh();
        } catch (error) {
            message.error(getErrorMessage(error, '删除密钥源失败'));
        }
    }, [closeDetail, triggerRefresh]);

    const handleSetDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: true });
            message.success('已设为默认');
            patchCurrentSource(source.id, (current) => ({ ...current, is_default: true }));
            triggerRefresh();
        } catch (error) {
            message.error(getErrorMessage(error, '设置默认密钥源失败'));
        }
    }, [patchCurrentSource, triggerRefresh]);

    const handleCancelDefault = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            await updateSecretsSource(source.id, { is_default: false });
            message.success('已取消默认');
            patchCurrentSource(source.id, (current) => ({ ...current, is_default: false }));
            triggerRefresh();
        } catch (error) {
            message.error(getErrorMessage(error, '取消默认密钥源失败'));
        }
    }, [patchCurrentSource, triggerRefresh]);

    const handleToggleStatus = useCallback(async (source: AutoHealing.SecretsSource) => {
        try {
            if (source.status === 'active') {
                await disableSecretsSource(source.id);
                message.success('已禁用');
                patchCurrentSource(source.id, (current) => ({ ...current, status: 'inactive' }));
            } else {
                await enableSecretsSource(source.id);
                message.success('已启用');
                patchCurrentSource(source.id, (current) => ({ ...current, status: 'active' }));
            }
            triggerRefresh();
        } catch (error) {
            const fallback = source.status === 'active' ? '禁用密钥源失败' : '启用密钥源失败';
            message.error(getErrorMessage(error, fallback));
        }
    }, [patchCurrentSource, triggerRefresh]);

    return {
        closeDetail,
        currentSource,
        detailError,
        detailLoading,
        drawerOpen,
        handleCancelDefault,
        handleDelete,
        handleSetDefault,
        handleToggleStatus,
        openCreate,
        openDetail,
        openEdit,
        setCurrentSource,
        setDrawerOpen,
    };
}
