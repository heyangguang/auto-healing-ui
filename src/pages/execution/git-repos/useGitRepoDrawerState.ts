import { useCallback } from 'react';
import type { GitRepositoryRecord } from '@/services/auto-healing/git-repos';
import { useGitRepoDrawerDetailState } from './useGitRepoDrawerDetailState';
import { useGitRepoFileBrowserState } from './useGitRepoFileBrowserState';

type UseGitRepoDrawerStateOptions = {
    triggerRefresh: () => void;
};

export function useGitRepoDrawerState(options: UseGitRepoDrawerStateOptions) {
    const detail = useGitRepoDrawerDetailState(options);
    const fileBrowser = useGitRepoFileBrowserState();

    const openFileBrowser = useCallback((record: GitRepositoryRecord) => {
        detail.invalidateDetail();
        detail.setCurrentRow(record);
        fileBrowser.openFileBrowser(record.id);
    }, [detail, fileBrowser]);

    return {
        ...detail,
        closeFileBrowser: fileBrowser.closeFileBrowser,
        fileBrowserOpen: fileBrowser.fileBrowserOpen,
        fileContent: fileBrowser.fileContent,
        fileTree: fileBrowser.fileTree,
        loadingContent: fileBrowser.loadingContent,
        loadingFiles: fileBrowser.loadingFiles,
        loadFileContent: fileBrowser.loadFileContent,
        loadFileTree: fileBrowser.loadFileTree,
        openFileBrowser,
        selectedFilePath: fileBrowser.selectedFilePath,
    };
}
