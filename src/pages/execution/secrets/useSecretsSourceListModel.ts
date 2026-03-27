import { useCallback, useMemo, useState } from 'react';
import { createSecretsSourceRequestHandler } from './createSecretsSourceRequestHandler';
import { useSecretsSourceCrud } from './useSecretsSourceCrud';
import { useSecretsSourceStats } from './useSecretsSourceStats';
import { useSecretsSourceTesting } from './useSecretsSourceTesting';

export function useSecretsSourceListModel() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshTrigger((value) => value + 1), []);
    const statsState = useSecretsSourceStats(refreshTrigger);
    const crudState = useSecretsSourceCrud(triggerRefresh);
    const testingState = useSecretsSourceTesting(triggerRefresh);
    const handleRequest = useMemo(() => createSecretsSourceRequestHandler(), []);

    return {
        ...crudState,
        ...testingState,
        handleRequest,
        refreshTrigger,
        stats: statsState.stats,
        triggerRefresh,
    };
}
