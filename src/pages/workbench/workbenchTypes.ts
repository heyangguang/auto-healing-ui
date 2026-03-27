import type { PendingApprovalRecord, PendingTriggerRecord } from '@/pages/pending-center/types';

export type PendingWorkbenchItem = (PendingTriggerRecord | PendingApprovalRecord) & {
    _pendingType: 'approval' | 'trigger';
    created_at?: string;
    id: string;
    node_name?: string;
    severity?: string;
    title?: string;
};

export type PendingWorkbenchState = {
    items: PendingWorkbenchItem[];
    total: number;
};

export type WorkbenchLoadError = {
    message: string;
    section: string;
};

export interface MergedTask {
    count: number;
    displayTime: string;
    isMerged: boolean;
    name: string;
    schedule_id: string;
}
