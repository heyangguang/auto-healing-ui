import type { PlaybookStatusSummary } from './playbookTypes';
import type { PlaybookSearchParams } from './playbookSearchParams';
import { playbookStatusConfig } from './playbookShellConfig';
import { usePlaybookMutationActions } from './usePlaybookMutationActions';
import { usePlaybookSelectionState } from './usePlaybookSelectionState';

type UsePlaybookDetailStateOptions = {
    loadPlaybooks: (params?: PlaybookSearchParams) => Promise<void>;
    mergePlaybookInInventory?: (playbook: AutoHealing.Playbook) => void;
    removePlaybookFromInventory?: (playbook: AutoHealing.Playbook) => void;
};

export function usePlaybookDetailState(options: UsePlaybookDetailStateOptions) {
    const selection = usePlaybookSelectionState();
    const mutations = usePlaybookMutationActions({
        detailRequestIdRef: selection.detailRequestIdRef,
        loadPlaybooks: options.loadPlaybooks,
        mergePlaybookInInventory: options.mergePlaybookInInventory,
        removePlaybookFromInventory: options.removePlaybookFromInventory,
        resetFileSelection: selection.resetFileSelection,
        refreshSelectedPlaybook: selection.refreshSelectedPlaybook,
        selectedPlaybook: selection.selectedPlaybook,
        setEditedVariables: selection.setEditedVariables,
        setPlaybookFiles: selection.setPlaybookFiles,
        setScanLogs: selection.setScanLogs,
        setSelectedPlaybook: selection.setSelectedPlaybook,
    });

    const statusInfo = selection.selectedPlaybook
        ? (playbookStatusConfig[selection.selectedPlaybook.status] || playbookStatusConfig.pending) as PlaybookStatusSummary
        : undefined;

    return {
        ...selection,
        ...mutations,
        statusInfo,
    };
}
