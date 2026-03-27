export type PlaybookRefreshSelectedOptions = {
    requestId?: number;
    syncEditedVariables?: boolean;
};

type PlaybookInventoryMutation = (playbook: AutoHealing.Playbook) => void;

type PlaybookRefreshSelected = (
    playbookId: string,
    options?: PlaybookRefreshSelectedOptions,
) => Promise<AutoHealing.Playbook>;

export type PlaybookMutationBaseOptions = {
    detailRequestIdRef: React.MutableRefObject<number>;
    loadPlaybooks: (params?: Record<string, any>) => Promise<void>;
    mergePlaybookInInventory?: PlaybookInventoryMutation;
    removePlaybookFromInventory?: PlaybookInventoryMutation;
    refreshSelectedPlaybook: PlaybookRefreshSelected;
    selectedPlaybook?: AutoHealing.Playbook;
    setSelectedPlaybook?: React.Dispatch<React.SetStateAction<AutoHealing.Playbook | undefined>>;
};

export type PlaybookLifecycleActionOptions = PlaybookMutationBaseOptions & {
    setPlaybookFiles: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookFile[]>>;
    setScanLogs: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookScanLog[]>>;
};

export type PlaybookDeleteActionOptions = PlaybookMutationBaseOptions & {
    clearScanning: () => void;
    resetFileSelection: () => void;
    setEditedVariables: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookVariable[]>>;
    setPlaybookFiles: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookFile[]>>;
    setScanLogs: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookScanLog[]>>;
};

export type PlaybookVariableAutosaveOptions = PlaybookMutationBaseOptions & {
    setEditedVariables: React.Dispatch<React.SetStateAction<AutoHealing.PlaybookVariable[]>>;
};
