import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import {
    getBlacklistExemptionStatusMeta,
    getBlacklistExemptionStatusOptions,
    getBlacklistSeverityMeta,
} from '@/constants/securityDicts';
import dayjs from 'dayjs';

const STATUS_ICON_REGISTRY: Record<string, React.ReactNode> = {
    pending: <ClockCircleOutlined />,
    approved: <CheckCircleOutlined />,
    rejected: <CloseCircleOutlined />,
    expired: <ExclamationCircleOutlined />,
};

export const getExemptionStatusConfig = (status: string) => {
    const meta = getBlacklistExemptionStatusMeta(status);
    return {
        ...meta,
        icon: STATUS_ICON_REGISTRY[status] || <ClockCircleOutlined />,
    };
};

export const getExemptionSeverityTagColor = (severity: string) =>
    getBlacklistSeverityMeta(severity).tagColor;

export const searchFields: SearchField[] = [
    { key: 'task_name', label: '任务模板', placeholder: '搜索任务模板名称' },
    { key: 'rule_name', label: '豁免规则', placeholder: '搜索规则名称' },
];

export const buildAdvancedSearchFields = (): AdvancedSearchField[] => [
    {
        key: 'status',
        label: '状态',
        type: 'select',
        placeholder: '全部状态',
        options: getBlacklistExemptionStatusOptions(),
    },
];

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>豁免规则图标</title>
        <rect x="6" y="10" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 20h14M12 26h10M12 32h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M36 12v4l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 36l-3 3 1 1 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
);

export const formatTime = (value?: string | null) =>
    value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';

export const buildStatsBar = (total: number, pending: number, approved: number) => (
    (() => {
        const pendingStatus = getExemptionStatusConfig('pending');
        const approvedStatus = getExemptionStatusConfig('approved');
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20 }}>
                    <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1677ff', opacity: 0.75 }} />
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{total}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>全部豁免</div>
                    </div>
                </div>
                <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
                    <ClockCircleOutlined style={{ fontSize: 22, color: pendingStatus.color, opacity: 0.75 }} />
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{pending}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{pendingStatus.label}</div>
                    </div>
                </div>
                <div style={{ width: 1, height: 32, background: '#f0f0f0', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
                    <CheckCircleOutlined style={{ fontSize: 22, color: approvedStatus.color, opacity: 0.75 }} />
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{approved}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{approvedStatus.label}</div>
                    </div>
                </div>
            </div>
        );
    })()
);
