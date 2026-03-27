import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import { getPlaybook, getPlaybookFiles } from '@/services/auto-healing/playbooks';
import { getFiles as getGitRepoFiles } from '@/services/auto-healing/git-repos';
import { simulateBlacklist } from '@/services/auto-healing/commandBlacklist';
import {
    buildLoadedFileContent,
} from './blacklistRuleFormUtils';
import { createRequestSequence } from '@/utils/requestSequence';
import type {
    LoadedFile,
    SimulateResultLine,
    SimulationMode,
} from './blacklistRuleFormTypes';

const PLAYBOOK_FETCH_BATCH_SIZE = 5;
const SIMULATION_DEBOUNCE_MS = 500;

const loadPlaybookFiles = async (
    repositoryId: string,
    fileList: Array<{ path: string; type: string }>,
    onProgress: (value: number) => void,
) => {
    const results: LoadedFile[] = [];
    for (let index = 0; index < fileList.length; index += PLAYBOOK_FETCH_BATCH_SIZE) {
        const batch = fileList.slice(index, index + PLAYBOOK_FETCH_BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(async (file) => {
                const response = await getGitRepoFiles(repositoryId, file.path);
                return {
                    path: file.path,
                    type: file.type,
                    content: response.content || '',
                    size: (response.content || '').length,
                    checked: true,
                } satisfies LoadedFile;
            }),
        );

        batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.content) {
                results.push(result.value);
            }
        });
        onProgress(20 + Math.round(((index + batch.length) / fileList.length) * 80));
    }
    return results;
};

export const useBlacklistSimulation = (
    patternValue: string | undefined,
    selectedMatchType: CommandBlacklistRule['match_type'],
) => {
    const [testInput, setTestInput] = useState('');
    const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
    const [selectedTemplateName, setSelectedTemplateName] = useState('');
    const [selectedPlaybookName, setSelectedPlaybookName] = useState('');
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [simMode, setSimMode] = useState<SimulationMode>('template');
    const [testResults, setTestResults] = useState<SimulateResultLine[] | null>(null);
    const [matchCount, setMatchCount] = useState(0);
    const [matchedFiles, setMatchedFiles] = useState<string[]>([]);
    const [simulating, setSimulating] = useState(false);
    const hasShownSimulationErrorRef = useRef(false);
    const simulationSequenceRef = useRef(createRequestSequence());

    const resetSimulationResults = useCallback(() => {
        setTestResults(null);
        setMatchCount(0);
        setMatchedFiles([]);
        hasShownSimulationErrorRef.current = false;
    }, []);

    const handleConfirmTemplate = useCallback(async (task: AutoHealing.ExecutionTask) => {
        if (!task.playbook_id) {
            message.warning('该任务模板未关联 Playbook');
            return false;
        }

        setLoadingPlaybook(true);
        setLoadProgress(0);
        let loadedSuccessfully = false;

        try {
            const playbookResponse = await getPlaybook(task.playbook_id);
            const playbook = playbookResponse.data;
            if (!playbook?.repository_id) {
                message.warning('Playbook 未关联 Git 仓库');
                return false;
            }

            setLoadProgress(10);

            const filesResponse = await getPlaybookFiles(task.playbook_id);
            const playbookFiles = filesResponse.data.files || [];
            const fileList = playbookFiles.length > 0
                ? playbookFiles.map((file) => ({ path: file.path, type: file.type || 'unknown' }))
                : [{ path: playbook.file_path, type: 'entry' }];
            setLoadProgress(20);

            const files = await loadPlaybookFiles(playbook.repository_id, fileList, setLoadProgress);
            if (files.length === 0) {
                message.warning('Playbook 无文件内容');
                return false;
            }

            loadedSuccessfully = true;
            resetSimulationResults();
            setSelectedTemplateName(task.name);
            setSelectedPlaybookName(playbook.name || '');
            setLoadedFiles(files);
            setTestInput(buildLoadedFileContent(files));
            setSimMode('template');
            message.success(`已加载 ${files.length} 个文件，共 ${fileList.length} 个`);
            return true;
        } catch {
            throw new Error('加载任务模板关联文件失败');
        } finally {
            setLoadingPlaybook(false);
            setLoadProgress(loadedSuccessfully ? 100 : 0);
        }
    }, [resetSimulationResults]);

    const handleFileCheckChange = useCallback((filePath: string, checked: boolean) => {
        setLoadedFiles((previous) => {
            const nextFiles = previous.map((file) =>
                file.path === filePath ? { ...file, checked } : file);
            setTestInput(buildLoadedFileContent(nextFiles));
            return nextFiles;
        });
    }, []);

    const handleClearLoaded = useCallback(() => {
        setLoadedFiles([]);
        setTestInput('');
        setSelectedTemplateName('');
        setSelectedPlaybookName('');
    }, []);

    useEffect(() => {
        if (!patternValue) {
            resetSimulationResults();
            return;
        }

        const hasFiles = simMode === 'template' && loadedFiles.some((file) => file.checked);
        const hasManualInput = simMode === 'manual' && Boolean(testInput);
        if (!hasFiles && !hasManualInput) {
            resetSimulationResults();
            return;
        }

        const timer = setTimeout(() => {
            const runSimulation = async () => {
                const token = simulationSequenceRef.current.next();
                setSimulating(true);
                try {
                    const payload: Parameters<typeof simulateBlacklist>[0] = {
                        pattern: patternValue,
                        match_type: selectedMatchType,
                    };

                    if (hasFiles) {
                        payload.files = loadedFiles
                            .filter((file) => file.checked)
                            .map((file) => ({ path: file.path, content: file.content }));
                    } else {
                        payload.content = testInput;
                    }

                    const result = await simulateBlacklist(payload);
                    if (!simulationSequenceRef.current.isCurrent(token)) {
                        return;
                    }
                    hasShownSimulationErrorRef.current = false;
                    setTestResults(result.results || []);
                    setMatchCount(result.match_count || 0);
                    setMatchedFiles(result.matched_files ? Object.keys(result.matched_files) : []);
                } catch {
                    if (!simulationSequenceRef.current.isCurrent(token)) {
                        return;
                    }
                    resetSimulationResults();
                    if (!hasShownSimulationErrorRef.current) {
                        hasShownSimulationErrorRef.current = true;
                        message.error('仿真测试失败，请检查规则或稍后重试');
                    }
                } finally {
                    if (simulationSequenceRef.current.isCurrent(token)) {
                        setSimulating(false);
                    }
                }
            };

            void runSimulation();
        }, SIMULATION_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            simulationSequenceRef.current.invalidate();
        };
    }, [loadedFiles, patternValue, resetSimulationResults, selectedMatchType, simMode, testInput]);

    return {
        handleClearLoaded,
        handleConfirmTemplate,
        handleFileCheckChange,
        loadProgress,
        loadedFiles,
        loadingPlaybook,
        matchCount,
        matchedFiles,
        resetSimulationResults,
        selectedPlaybookName,
        selectedTemplateName,
        setSimMode,
        setTestInput,
        simMode,
        simulating,
        testInput,
        testResults,
    };
};
