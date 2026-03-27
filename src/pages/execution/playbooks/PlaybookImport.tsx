import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Divider, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { history, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import { getFiles } from '@/services/auto-healing/git-repos';
import { createPlaybook } from '@/services/auto-healing/playbooks';
import { getCachedGitRepoInventory, invalidateSelectorInventory, selectorInventoryKeys } from '@/utils/selectorInventoryCache';
import PlaybookImportConfigSection from './PlaybookImportConfigSection';
import PlaybookImportFileSection from './PlaybookImportFileSection';
import PlaybookImportRepoSection from './PlaybookImportRepoSection';
import { buildImportFileTree, buildPlaybookImportItems, collectDirKeys, type PlaybookImportItem } from './playbookImportUtils';
import './index.css';
import '@/pages/plugins/PluginForm.css';

const PlaybookImport: React.FC = () => {
    const access = useAccess();
    const [repos, setRepos] = useState<AutoHealing.GitRepository[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(true);
    const [repoLoadError, setRepoLoadError] = useState<string>();
    const [selectedRepoId, setSelectedRepoId] = useState<string>();
    const [fileTree, setFileTree] = useState<DataNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [playbooks, setPlaybooks] = useState<PlaybookImportItem[]>([]);
    const [creating, setCreating] = useState(false);
    const fileRequestIdRef = useRef(0);

    useEffect(() => {
        setLoadingRepos(true);
        setRepoLoadError(undefined);
        getCachedGitRepoInventory()
            .then(setRepos)
            .catch((error: unknown) => {
                setRepoLoadError(error instanceof Error ? error.message : '无法加载仓库列表');
            })
            .finally(() => setLoadingRepos(false));
    }, []);

    const repoMap = useMemo(() => new Map(repos.map((repo) => [repo.id, repo])), [repos]);
    const selectedRepo = selectedRepoId ? repoMap.get(selectedRepoId) : undefined;

    const handleSelectRepo = useCallback(async (repoId: string) => {
        const requestId = fileRequestIdRef.current + 1;
        fileRequestIdRef.current = requestId;
        setSelectedRepoId(repoId);
        setSelectedFiles([]);
        setPlaybooks([]);
        setFileTree([]);
        setExpandedKeys([]);
        setLoadingFiles(true);
        try {
            const response = await getFiles(repoId);
            if (fileRequestIdRef.current !== requestId) {
                return;
            }
            const tree = buildImportFileTree(response.files || []);
            setFileTree(tree);
            setExpandedKeys(collectDirKeys(tree));
        } catch {
            if (fileRequestIdRef.current !== requestId) {
                return;
            }
            message.error('仓库文件加载失败');
            setFileTree([]);
            setExpandedKeys([]);
        } finally {
            if (fileRequestIdRef.current === requestId) {
                setLoadingFiles(false);
            }
        }
    }, []);

    const handleCheckFiles = useCallback((keys: string[]) => {
        setSelectedFiles(keys);
        setPlaybooks((prev) => buildPlaybookImportItems(keys, prev));
    }, []);

    const handleConfigNameChange = useCallback((index: number, value: string) => {
        setPlaybooks((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item));
    }, []);

    const handleConfigModeChange = useCallback((index: number, value: 'auto' | 'enhanced') => {
        setPlaybooks((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, config_mode: value } : item));
    }, []);

    const handleCreate = useCallback(async () => {
        if (!selectedRepoId || playbooks.length === 0) return;
        setCreating(true);
        try {
            const results = await Promise.allSettled(
                playbooks.map(async (playbook) => {
                    await createPlaybook({
                        repository_id: selectedRepoId,
                        name: playbook.name,
                        file_path: playbook.file,
                        config_mode: playbook.config_mode,
                    });
                    return playbook;
                }),
            );

            const succeeded: PlaybookImportItem[] = [];
            const failed: PlaybookImportItem[] = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') succeeded.push(result.value);
                else failed.push(playbooks[index]);
            });

            if (failed.length === 0) {
                invalidateSelectorInventory(selectorInventoryKeys.playbooks);
                message.success(`成功导入 ${succeeded.length} 个 Playbook`);
                history.push('/execution/playbooks');
                return;
            }
            if (succeeded.length > 0) {
                invalidateSelectorInventory(selectorInventoryKeys.playbooks);
                message.warning(`已导入 ${succeeded.length} 个，失败 ${failed.length} 个，请修正后重试`);
                setPlaybooks(failed);
                setSelectedFiles(failed.map((item) => item.file));
                return;
            }
            message.error(`导入失败，${failed.length} 个 Playbook 未创建`);
        } finally {
            setCreating(false);
        }
    }, [playbooks, selectedRepoId]);

    return (
        <div className="plugin-form-page">
            <SubPageHeader title="导入 Playbook" onBack={() => history.push('/execution/playbooks')} />
            <div className="plugin-form-card">
                <div className="plugin-form-content" style={{ maxWidth: 900 }}>
                    <PlaybookImportRepoSection access={{ canCreateGitRepo: access.canCreateGitRepo }} creating={creating} loadError={repoLoadError} loadingRepos={loadingRepos} repos={repos} repoMap={repoMap} selectedRepo={selectedRepo} selectedRepoId={selectedRepoId} onSelectRepo={handleSelectRepo} />

                    {selectedRepoId && (
                        <PlaybookImportFileSection creating={creating} expandedKeys={expandedKeys} fileTree={fileTree} loadingFiles={loadingFiles} selectedFiles={selectedFiles} onCheckFiles={handleCheckFiles} onCollapseAll={() => setExpandedKeys([])} onExpandAll={() => setExpandedKeys(collectDirKeys(fileTree))} onExpandKeysChange={setExpandedKeys} />
                    )}

                    {selectedRepoId && playbooks.length > 0 && (
                        <PlaybookImportConfigSection access={{ canImportPlaybook: access.canImportPlaybook }} creating={creating} playbooks={playbooks} onCreate={handleCreate} onCancel={() => history.push('/execution/playbooks')} onConfigModeChange={handleConfigModeChange} onNameChange={handleConfigNameChange} />
                    )}

                    {selectedRepoId && playbooks.length === 0 && <Divider dashed />}
                </div>
            </div>
        </div>
    );
};

export default PlaybookImport;
