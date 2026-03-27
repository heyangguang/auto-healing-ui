import { useCallback, useMemo, useState } from 'react';
import { createGitRepoRequestHandler } from './createGitRepoRequestHandler';
import { useGitRepoDrawerState } from './useGitRepoDrawerState';
import { useGitRepoMetadataState } from './useGitRepoMetadataState';

export function useGitRepoListModel() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshTrigger((value) => value + 1), []);
    const metadata = useGitRepoMetadataState(refreshTrigger);
    const drawer = useGitRepoDrawerState({ triggerRefresh });
    const handleRequest = useMemo(() => createGitRepoRequestHandler(), []);

    return {
        ...drawer,
        ...metadata,
        handleRequest,
        refreshTrigger,
        triggerRefresh,
    };
}
