import { message } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { updatePlaybookVariables } from '@/services/auto-healing/playbooks';
import type { PlaybookVariableAutosaveOptions } from './playbookMutationActionTypes';

export function usePlaybookVariableAutosave(options: PlaybookVariableAutosaveOptions) {
    const {
        detailRequestIdRef,
        loadPlaybooks,
        mergePlaybookInInventory,
        refreshSelectedPlaybook,
        selectedPlaybook,
        setEditedVariables,
        setSelectedPlaybook,
    } = options;
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveRequestIdRef = useRef(0);

    useEffect(() => {
        autoSaveRequestIdRef.current += 1;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
    }, [selectedPlaybook?.id]);

    useEffect(() => () => {
        autoSaveRequestIdRef.current += 1;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    }, []);

    const syncPlaybookAfterSave = useCallback(async (options: {
        detailRequestId: number;
        playbookId: string;
        requestId: number;
    }) => {
        const { detailRequestId, playbookId, requestId } = options;
        if (autoSaveRequestIdRef.current !== requestId || detailRequestIdRef.current !== detailRequestId) {
            return false;
        }

        try {
            await loadPlaybooks();
        } catch (error) {
            if (autoSaveRequestIdRef.current === requestId && detailRequestIdRef.current === detailRequestId) {
                message.error(error instanceof Error ? error.message : '刷新 Playbook 列表失败');
            }
        }

        if (autoSaveRequestIdRef.current !== requestId || detailRequestIdRef.current !== detailRequestId) {
            return false;
        }

        try {
            await refreshSelectedPlaybook(playbookId, {
                requestId: detailRequestId,
                syncEditedVariables: true,
            });
            return true;
        } catch (error) {
            if (autoSaveRequestIdRef.current === requestId && detailRequestIdRef.current === detailRequestId) {
                message.error(error instanceof Error ? error.message : '刷新 Playbook 详情失败');
            }
        }
        return false;
    }, [detailRequestIdRef, loadPlaybooks, refreshSelectedPlaybook]);

    const autoSaveVariables = useCallback((variables: AutoHealing.PlaybookVariable[]) => {
        setEditedVariables(variables);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        const requestId = autoSaveRequestIdRef.current + 1;
        autoSaveRequestIdRef.current = requestId;
        const playbookId = selectedPlaybook?.id;
        const detailRequestId = detailRequestIdRef.current;
        saveTimeoutRef.current = setTimeout(async () => {
            if (!playbookId) return;
            try {
                const response = await updatePlaybookVariables(playbookId, { variables });
                if (autoSaveRequestIdRef.current !== requestId) return;
                setSelectedPlaybook?.((current) => current?.id === playbookId ? response.data : current);
                setEditedVariables(response.data.variables || []);
                mergePlaybookInInventory?.(response.data);
                message.success('已自动保存');
                await syncPlaybookAfterSave({
                    detailRequestId,
                    playbookId,
                    requestId,
                });
            } catch (error) {
                if (autoSaveRequestIdRef.current !== requestId) return;
                const messageText = error instanceof Error ? error.message : '变量自动保存失败';
                message.error(messageText);
                const detailSynced = await syncPlaybookAfterSave({
                    detailRequestId,
                    playbookId,
                    requestId,
                });
                if (!detailSynced && autoSaveRequestIdRef.current === requestId) {
                    setEditedVariables(selectedPlaybook?.variables || []);
                }
            } finally {
                if (autoSaveRequestIdRef.current === requestId) {
                    saveTimeoutRef.current = null;
                }
            }
        }, 500);
    }, [detailRequestIdRef, mergePlaybookInInventory, selectedPlaybook, setEditedVariables, setSelectedPlaybook, syncPlaybookAfterSave]);

    return {
        autoSaveVariables,
    };
}
