import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import {
    getPlaybookFiles,
    getPlaybookScanLogs,
    scanPlaybook,
    setPlaybookOffline,
    setPlaybookReady,
    updatePlaybook,
} from '@/services/auto-healing/playbooks';
import { fetchAllPages } from '@/utils/fetchAllPages';
import type { PlaybookLifecycleActionOptions } from './playbookMutationActionTypes';

export function usePlaybookLifecycleActions(options: PlaybookLifecycleActionOptions) {
    const {
        detailRequestIdRef,
        loadPlaybooks,
        mergePlaybookInInventory,
        refreshSelectedPlaybook,
        selectedPlaybook,
        setPlaybookFiles,
        setScanLogs,
        setSelectedPlaybook,
    } = options;
    const [scanning, setScanning] = useState<string>();
    const scanRequestIdRef = useRef(0);

    const syncPlaybookLocally = useCallback((playbook: AutoHealing.Playbook) => {
        setSelectedPlaybook?.((current) => current?.id === playbook.id ? playbook : current);
        mergePlaybookInInventory?.(playbook);
    }, [mergePlaybookInInventory, setSelectedPlaybook]);

    const syncPlaybookAfterMutation = useCallback(async (options: {
        detailRequestId: number;
        playbookId: string;
        syncEditedVariables?: boolean;
    }) => {
        const { detailRequestId, playbookId, syncEditedVariables } = options;

        try {
            await loadPlaybooks();
        } catch (error) {
            if (detailRequestIdRef.current === detailRequestId) {
                message.error(error instanceof Error ? error.message : '刷新 Playbook 列表失败');
            }
        }

        if (detailRequestIdRef.current !== detailRequestId) {
            return;
        }

        try {
            const detail = await refreshSelectedPlaybook(playbookId, {
                requestId: detailRequestId,
                syncEditedVariables,
            });
            mergePlaybookInInventory?.(detail);
            return true;
        } catch (error) {
            if (detailRequestIdRef.current === detailRequestId) {
                message.error(error instanceof Error ? error.message : '刷新 Playbook 详情失败');
            }
        }
        return false;
    }, [detailRequestIdRef, loadPlaybooks, mergePlaybookInInventory, refreshSelectedPlaybook]);

    const handleScan = useCallback(async () => {
        if (!selectedPlaybook) return;
        const requestId = detailRequestIdRef.current;
        const scanRequestId = scanRequestIdRef.current + 1;
        scanRequestIdRef.current = scanRequestId;
        setScanning(selectedPlaybook.id);
        try {
            const response = await scanPlaybook(selectedPlaybook.id);
            if (detailRequestIdRef.current !== requestId) return;
            message.success(`扫描完成：发现 ${response.data.variables_found} 个变量`);
            const detailSynced = await syncPlaybookAfterMutation({
                detailRequestId: requestId,
                playbookId: selectedPlaybook.id,
                syncEditedVariables: true,
            });
            if (!detailSynced || detailRequestIdRef.current !== requestId) return;
            const [filesResult, logsResult] = await Promise.allSettled([
                getPlaybookFiles(selectedPlaybook.id),
                fetchAllPages<AutoHealing.PlaybookScanLog>((page, pageSize) => getPlaybookScanLogs(selectedPlaybook.id, { page, page_size: pageSize })),
            ]);
            if (detailRequestIdRef.current !== requestId) return;

            if (filesResult.status === 'fulfilled') {
                setPlaybookFiles(filesResult.value.data?.files || []);
            } else {
                setPlaybookFiles([]);
                message.error(filesResult.reason instanceof Error ? filesResult.reason.message : '加载 Playbook 文件失败');
            }

            if (logsResult.status === 'fulfilled') {
                setScanLogs(logsResult.value);
            } else {
                setScanLogs([]);
                message.error(logsResult.reason instanceof Error ? logsResult.reason.message : '加载扫描日志失败');
            }
        } catch (error) {
            if (scanRequestIdRef.current === scanRequestId && detailRequestIdRef.current === requestId) {
                const messageText = error instanceof Error ? error.message : '扫描 Playbook 失败';
                message.error(messageText);
            }
        } finally {
            if (scanRequestIdRef.current === scanRequestId) {
                setScanning(undefined);
            }
        }
    }, [detailRequestIdRef, selectedPlaybook, setPlaybookFiles, setScanLogs, syncPlaybookAfterMutation, syncPlaybookLocally]);

    const handleSetReady = useCallback(async () => {
        if (!selectedPlaybook) return;
        const playbookId = selectedPlaybook.id;
        const detailRequestId = detailRequestIdRef.current;
        try {
            await setPlaybookReady(playbookId);
            syncPlaybookLocally({ ...selectedPlaybook, status: 'ready' });
            message.success('已设为就绪状态');
            await syncPlaybookAfterMutation({
                detailRequestId,
                playbookId,
            });
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '更新 Playbook 状态失败';
            message.error(messageText);
        }
    }, [detailRequestIdRef, selectedPlaybook, syncPlaybookAfterMutation, syncPlaybookLocally]);

    const handleSetOffline = useCallback(async () => {
        if (!selectedPlaybook) return;
        const playbookId = selectedPlaybook.id;
        const detailRequestId = detailRequestIdRef.current;
        try {
            await setPlaybookOffline(playbookId);
            syncPlaybookLocally({ ...selectedPlaybook, status: 'pending' });
            message.success('已下线');
            await syncPlaybookAfterMutation({
                detailRequestId,
                playbookId,
            });
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '更新 Playbook 状态失败';
            message.error(messageText);
        }
    }, [detailRequestIdRef, selectedPlaybook, syncPlaybookAfterMutation, syncPlaybookLocally]);

    const handleEditPlaybook = useCallback(async (values: { name: string; description?: string }) => {
        if (!selectedPlaybook) return false;
        const playbookId = selectedPlaybook.id;
        const detailRequestId = detailRequestIdRef.current;
        try {
            const response = await updatePlaybook(playbookId, { description: values.description, name: values.name });
            syncPlaybookLocally(response.data);
            message.success('更新成功');
            await syncPlaybookAfterMutation({
                detailRequestId,
                playbookId,
            });
            return true;
        } catch (error) {
            const messageText = error instanceof Error ? error.message : '更新 Playbook 失败';
            message.error(messageText);
            return false;
        }
    }, [detailRequestIdRef, selectedPlaybook, syncPlaybookAfterMutation, syncPlaybookLocally]);

    return {
        clearScanning: () => {
            scanRequestIdRef.current += 1;
            setScanning(undefined);
        },
        handleEditPlaybook,
        handleScan,
        handleSetOffline,
        handleSetReady,
        scanning,
    };
}
