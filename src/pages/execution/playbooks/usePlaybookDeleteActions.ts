import { message } from 'antd';
import { useCallback, useState } from 'react';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import { deletePlaybook } from '@/services/auto-healing/playbooks';
import type { PlaybookDeleteActionOptions } from './playbookMutationActionTypes';

export function usePlaybookDeleteActions(options: PlaybookDeleteActionOptions) {
    const {
        clearScanning,
        detailRequestIdRef,
        loadPlaybooks,
        removePlaybookFromInventory,
        resetFileSelection,
        selectedPlaybook,
        setEditedVariables,
        setPlaybookFiles,
        setScanLogs,
        setSelectedPlaybook,
    } = options;
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [relatedTaskCount, setRelatedTaskCount] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<AutoHealing.Playbook>();

    const resetDeletedPlaybookState = useCallback((targetId: string) => {
        detailRequestIdRef.current += 1;
        clearScanning();
        setDeleteConfirmOpen(false);
        setDeleteTarget(undefined);
        setRelatedTaskCount(0);
        if (selectedPlaybook?.id === targetId) {
            setEditedVariables([]);
            setPlaybookFiles([]);
            setScanLogs([]);
            resetFileSelection();
            setSelectedPlaybook?.(undefined);
        }
    }, [clearScanning, detailRequestIdRef, resetFileSelection, selectedPlaybook?.id, setEditedVariables, setPlaybookFiles, setScanLogs, setSelectedPlaybook]);

    const openDeleteConfirm = useCallback(async () => {
        if (!selectedPlaybook) return;
        const requestId = detailRequestIdRef.current;
        const target = selectedPlaybook;
        try {
            const response = await getExecutionTasks({ playbook_id: target.id, page: 1, page_size: 1 });
            if (detailRequestIdRef.current !== requestId) {
                return;
            }
            setRelatedTaskCount(response.total || 0);
            setDeleteTarget(target);
            setDeleteConfirmOpen(true);
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '无法校验关联任务数量';
            message.error(messageText);
        }
    }, [detailRequestIdRef, selectedPlaybook]);

    const handleDelete = useCallback(async () => {
        if (!deleteTarget || relatedTaskCount > 0) {
            if (relatedTaskCount > 0) {
                message.error(`无法删除：该 Playbook 关联 ${relatedTaskCount} 个任务模板，请先删除任务模板`);
            }
            return;
        }
        try {
            await deletePlaybook(deleteTarget.id);
            message.success('删除成功');
            const deletedTargetId = deleteTarget.id;
            removePlaybookFromInventory?.(deleteTarget);
            resetDeletedPlaybookState(deletedTargetId);
            try {
                await loadPlaybooks();
            } catch (error) {
                const messageText = error instanceof Error ? error.message : '刷新 Playbook 列表失败';
                message.error(messageText);
            }
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '删除 Playbook 失败';
            message.error(messageText);
        }
    }, [deleteTarget, loadPlaybooks, relatedTaskCount, removePlaybookFromInventory, resetDeletedPlaybookState]);

    const setDeleteState = useCallback((open: boolean) => {
        if (!open) {
            setDeleteTarget(undefined);
            setRelatedTaskCount(0);
        }
        setDeleteConfirmOpen(open);
    }, []);

    return {
        deleteConfirmOpen,
        deleteTarget,
        handleDelete,
        openDeleteConfirm,
        relatedTaskCount,
        setDeleteConfirmOpen: setDeleteState,
    };
}
