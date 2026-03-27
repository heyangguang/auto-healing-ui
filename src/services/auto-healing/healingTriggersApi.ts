import { request } from '@umijs/max';

export async function getPendingTriggers(params?: {
    page?: number;
    page_size?: number;
    title?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/tenant/healing/pending/trigger', {
        method: 'GET',
        params,
    });
}

export async function triggerHealing(id: string) {
    return request<{ data: AutoHealing.HealingFlowInstance }>(`/api/v1/tenant/incidents/${id}/trigger`, {
        method: 'POST',
    });
}

export async function dismissIncident(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incidents/${id}/dismiss`, {
        method: 'POST',
    });
}

export async function getDismissedTriggers(params?: {
    page?: number;
    page_size?: number;
    title?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/tenant/healing/pending/dismissed', {
        method: 'GET',
        params,
    });
}

export async function resetIncidentScan(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incidents/${id}/reset-scan`, {
        method: 'POST',
    });
}
