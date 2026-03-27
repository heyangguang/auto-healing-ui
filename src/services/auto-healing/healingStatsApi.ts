import { request } from '@umijs/max';

export async function getFlowStats() {
    return request<{
        code: number;
        data: { total: number; active_count: number; inactive_count: number };
    }>('/api/v1/tenant/healing/flows/stats', { method: 'GET' });
}

export async function getRuleStats() {
    return request<{
        code: number;
        data: {
            total: number;
            active_count: number;
            inactive_count: number;
            by_trigger_mode: Array<{ trigger_mode: string; count: number }>;
        };
    }>('/api/v1/tenant/healing/rules/stats', { method: 'GET' });
}

export async function getInstanceStats() {
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
        };
    }>('/api/v1/tenant/healing/instances/stats', { method: 'GET' });
}
