import { useState } from 'react';
import type { PlaybookMutationBaseOptions } from './playbookMutationActionTypes';
import { usePlaybookDeleteActions } from './usePlaybookDeleteActions';
import { usePlaybookLifecycleActions } from './usePlaybookLifecycleActions';
import { usePlaybookVariableAutosave } from './usePlaybookVariableAutosave';

type UsePlaybookMutationActionsOptions = PlaybookMutationBaseOptions & {
    resetFileSelection: () => void;
    setEditedVariables: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookVariable[]>>;
    setPlaybookFiles: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookFile[]>>;
    setScanLogs: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookScanLog[]>>;
    setSelectedPlaybook: React.Dispatch<React.SetStateAction<AutoHealing.Playbook | undefined>>;
};

export function usePlaybookMutationActions(options: UsePlaybookMutationActionsOptions) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const lifecycle = usePlaybookLifecycleActions(options);
    const deleteActions = usePlaybookDeleteActions({ ...options, clearScanning: lifecycle.clearScanning });
    const autosave = usePlaybookVariableAutosave(options);

    return {
        ...autosave,
        ...deleteActions,
        ...lifecycle,
        editModalOpen,
        setEditModalOpen,
    };
}
