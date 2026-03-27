export interface CMDBItemLike {
    id: string;
    name?: string;
    hostname?: string;
    ip_address?: string;
    status?: string;
    os?: string;
    os_version?: string;
    type?: string;
    environment?: string;
}

export interface ConnectionTestResultModalProps {
    open: boolean;
    results: AutoHealing.CMDBBatchConnectionTestResult | null;
    cmdbItems?: CMDBItemLike[];
    onClose: () => void;
}

export interface HostInfo {
    host: string;
    cmdb_id: string;
    latency_ms?: number;
    message: string;
    hostname?: string;
    os?: string;
    os_version?: string;
    type?: string;
    environment?: string;
    name?: string;
}

export interface AggregatedGroup {
    key: string;
    type: 'success' | 'error';
    label: string;
    count: number;
    hosts: HostInfo[];
}
