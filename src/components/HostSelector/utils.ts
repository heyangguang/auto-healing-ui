import type { EnvironmentStatsShape } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
}

function getNumberField(source: Record<string, unknown>, key: string): number | null {
    const value = source[key];
    return typeof value === 'number' ? value : null;
}

export function createPlaceholderItem(ip: string): AutoHealing.CMDBItem {
    return { id: ip as unknown as AutoHealing.UUID, ip_address: ip, hostname: ip } as unknown as AutoHealing.CMDBItem;
}

export function getTotalFromListResponse(response: unknown): number {
    const asObj = asRecord(response);
    if (!asObj) return 0;
    return getNumberField(asObj, 'total') ?? getNumberField(asObj, 'count') ?? 0;
}

export function normalizeStatsResponse(response: unknown): EnvironmentStatsShape {
    const asObj = asRecord(response);
    if (!asObj) return { total: 0, by_environment: [] };
    const dataField = asRecord(asObj.data);
    const source = dataField || asObj;

    const total = getNumberField(source, 'total') ?? 0;
    const rawByEnv = Array.isArray(source.by_environment) ? source.by_environment : [];
    const byEnvironment: NonNullable<EnvironmentStatsShape['by_environment']> = [];
    rawByEnv.forEach((item) => {
        const row = asRecord(item);
        if (!row) return;
        const environment = typeof row.environment === 'string' ? row.environment : undefined;
        const count = getNumberField(row, 'count') ?? 0;
        byEnvironment.push({ environment, count });
    });

    return { total, by_environment: byEnvironment };
}
