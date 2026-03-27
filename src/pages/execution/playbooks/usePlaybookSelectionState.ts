import { message } from 'antd';
import { useCallback, useDeferredValue, useRef, useState } from 'react';
import { getPlaybook, getPlaybookFiles, getPlaybookScanLogs } from '@/services/auto-healing/playbooks';
import { fetchAllPages } from '@/utils/fetchAllPages';
import type { PlaybookRefreshSelectedOptions } from './playbookMutationActionTypes';
import { usePlaybookFileContentState } from './usePlaybookFileContentState';

export function usePlaybookSelectionState() {
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook>();
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [scanLogs, setScanLogs] = useState<AutoHealing.PlaybookScanLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [playbookFiles, setPlaybookFiles] = useState<AutoHealing.PlaybookFile[]>([]);
    const [editedVariables, setEditedVariables] = useState<AutoHealing.PlaybookVariable[]>([]);
    const deferredVariables = useDeferredValue(editedVariables);
    const [activeTab, setActiveTab] = useState('overview');
    const detailRequestIdRef = useRef(0);
    const isVariablesStale = deferredVariables !== editedVariables;
    const fileContentState = usePlaybookFileContentState({ selectedPlaybook });

    const applySelectedPlaybookDetail = useCallback((detail: AutoHealing.Playbook, syncEditedVariables: boolean = false) => {
        setSelectedPlaybook(detail);
        if (syncEditedVariables) {
            setEditedVariables(detail.variables || []);
        }
    }, []);

    const loadPlaybookArtifacts = useCallback(async (playbookId: string, requestId: number) => {
        setLoadingLogs(true);
        const [logsResult, filesResult] = await Promise.allSettled([
            fetchAllPages<AutoHealing.PlaybookScanLog>((page, pageSize) => getPlaybookScanLogs(playbookId, { page, page_size: pageSize })),
            getPlaybookFiles(playbookId),
        ]);

        if (detailRequestIdRef.current !== requestId) {
            return;
        }

        if (logsResult.status === 'fulfilled') {
            setScanLogs(logsResult.value);
        } else {
            setScanLogs([]);
            message.error('加载扫描日志失败');
        }

        if (filesResult.status === 'fulfilled') {
            setPlaybookFiles(filesResult.value.data?.files || []);
        } else {
            setPlaybookFiles([]);
            message.error('加载 Playbook 文件失败');
        }
    }, []);

    const refreshSelectedPlaybook = useCallback(async (playbookId: string, options?: PlaybookRefreshSelectedOptions) => {
        const requestId = options?.requestId ?? detailRequestIdRef.current;
        const detail = await getPlaybook(playbookId);
        if (detailRequestIdRef.current === requestId && detail.data.id === playbookId) {
            applySelectedPlaybookDetail(detail.data, options?.syncEditedVariables);
        }
        return detail.data;
    }, [applySelectedPlaybookDetail]);

    const handleSelectPlaybook = useCallback(async (playbook: AutoHealing.Playbook) => {
        const requestId = detailRequestIdRef.current + 1;
        detailRequestIdRef.current = requestId;
        fileContentState.resetFileSelection();
        applySelectedPlaybookDetail(playbook);
        setActiveTab('overview');
        setScanLogs([]);
        setEditedVariables([]);
        setPlaybookFiles([]);
        setLoadingDetail(true);
        try {
            const detail = await getPlaybook(playbook.id);
            if (detailRequestIdRef.current !== requestId) return;
            applySelectedPlaybookDetail(detail.data, true);
            await loadPlaybookArtifacts(playbook.id, requestId);
        } catch (error) {
            if (detailRequestIdRef.current === requestId) {
                const messageText = error instanceof Error ? error.message : '加载 Playbook 详情失败';
                message.error(messageText);
            }
        } finally {
            if (detailRequestIdRef.current === requestId) {
                setLoadingDetail(false);
                setLoadingLogs(false);
            }
        }
    }, [applySelectedPlaybookDetail, fileContentState, loadPlaybookArtifacts]);

    return {
        activeTab,
        deferredVariables,
        detailRequestIdRef,
        editedVariables,
        fileContent: fileContentState.fileContent,
        handleSelectFile: fileContentState.handleSelectFile,
        handleSelectPlaybook,
        isVariablesStale,
        loadingDetail,
        loadingFileContent: fileContentState.loadingFileContent,
        loadingLogs,
        playbookFiles,
        resetFileSelection: fileContentState.resetFileSelection,
        refreshSelectedPlaybook,
        scanLogs,
        selectedFilePath: fileContentState.selectedFilePath,
        selectedPlaybook,
        setActiveTab,
        setEditedVariables,
        setPlaybookFiles,
        setScanLogs,
        setSelectedPlaybook,
    };
}
