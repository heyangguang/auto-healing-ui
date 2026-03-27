import React from 'react';

export const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div style={{
        fontSize: 12,
        color: '#8c8c8c',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 600,
    }}
    >
        {icon} {title}
    </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0', fontSize: 13, lineHeight: '22px' }}>
        <span style={{ width: 80, flexShrink: 0, color: '#8c8c8c', fontSize: 12 }}>{label}</span>
        <span style={{ flex: 1, color: '#262626', fontWeight: 500 }}>{children}</span>
    </div>
);

export function getNotificationTriggerLabel(key: string) {
    switch (key) {
        case 'on_start':
            return '开始时';
        case 'on_success':
            return '成功时';
        case 'on_failure':
            return '失败时';
        case 'on_timeout':
            return '超时时';
        default:
            return key;
    }
}
