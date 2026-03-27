export interface HostSelectorModalProps {
    open: boolean;
    value?: string[];
    excludeHosts?: string[];
    onOk: (selected: string[], items: AutoHealing.CMDBItem[]) => void;
    onCancel: () => void;
}

export interface HostSelectorProps {
    value?: string[] | string;
    onChange?: (value: string[]) => void;
    onChangeItems?: (items: AutoHealing.CMDBItem[]) => void;
    excludeHosts?: string[];
}

export type CMDBItemsParams = NonNullable<Parameters<typeof import('@/services/auto-healing/cmdb').getCMDBItems>[0]>;

export interface EnvironmentStatsShape {
    total?: number;
    by_environment?: Array<{ environment?: string; count?: number }>;
}
