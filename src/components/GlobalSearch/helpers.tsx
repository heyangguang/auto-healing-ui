import React from 'react';
import type { SearchResultItem } from '@/services/auto-healing/search';

const STATUS_DOT: Record<string, string> = {
    active: '#52c41a',
    online: '#52c41a',
    ready: '#52c41a',
    success: '#52c41a',
    running: '#1890ff',
    processing: '#1890ff',
    syncing: '#1890ff',
    failed: '#ff4d4f',
    error: '#ff4d4f',
    offline: '#ff4d4f',
    maintenance: '#fa8c16',
    pending: '#faad14',
    disabled: '#666',
    scanned: '#13c2c2',
    inactive: '#666',
};

function getStatusValue(extra?: SearchResultItem['extra']): string | null {
    if (!extra) return null;
    const rawStatus = typeof extra.status === 'string' ? extra.status : null;
    const activeStatus = typeof extra.is_active === 'boolean' ? (extra.is_active ? 'active' : 'inactive') : null;
    const enabledStatus = typeof extra.is_enabled === 'boolean' ? (extra.is_enabled ? 'active' : 'disabled') : null;
    const status = rawStatus || activeStatus || enabledStatus;
    if (!status) return null;
    return status;
}

export function getStatusInfo(extra?: SearchResultItem['extra']): { label: string; color: string } | null {
    const status = getStatusValue(extra);
    if (!status) return null;
    return { label: status, color: STATUS_DOT[status] || '#666' };
}

export function hl(text: string, kw: string): React.ReactNode {
    if (!kw || !text) return text;
    const i = text.toLowerCase().indexOf(kw.toLowerCase());
    if (i === -1) return text;
    return (
        <>
            {text.slice(0, i)}
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{text.slice(i, i + kw.length)}</span>
            {text.slice(i + kw.length)}
        </>
    );
}
