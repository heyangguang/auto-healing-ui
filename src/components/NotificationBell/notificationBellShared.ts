export const POLL_INTERVAL = 5 * 60_000;
export const NOTIFICATION_PANEL_ID = 'notification-bell-panel';

export const DOT_COLORS: Record<string, string> = {
    system_update: '#1677ff',
    product_news: '#1677ff',
    service_notice: '#52c41a',
    activity: '#faad14',
    fault_alert: '#ff4d4f',
    security: '#ff4d4f',
};

export function getCurrentTenantId(): string | null {
    try {
        const raw = localStorage.getItem('tenant-storage');
        if (!raw) {
            return null;
        }
        const { currentTenantId } = JSON.parse(raw);
        return currentTenantId || null;
    } catch {
        return null;
    }
}

export function getNotificationDotColor(category: string) {
    return DOT_COLORS[category] || '#1677ff';
}

export const bellStyles = {
    container: { position: 'relative' as const },
    trigger: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 14px',
        height: 58,
        transition: 'background 0.2s',
        color: 'rgba(255,255,255,0.85)',
        userSelect: 'none' as const,
        position: 'relative' as const,
    },
    triggerIcon: { fontSize: 16 },
    badge: {
        position: 'absolute' as const,
        top: 12,
        right: 6,
        background: '#ff4d4f',
        color: '#fff',
        fontSize: 12,
        lineHeight: '16px',
        padding: '0 5px',
        borderRadius: 8,
        transform: 'scale(0.85)',
        transformOrigin: 'right top',
        fontWeight: 'bold' as const,
    },
    panel: {
        position: 'fixed' as const,
        width: 250,
        background: '#fff',
        borderRadius: '0 0 6px 6px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
        zIndex: 2000,
        overflow: 'hidden' as const,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    header: {
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
        background: '#fafafa',
    },
    body: {
        maxHeight: 202,
        overflowY: 'auto' as const,
    },
    empty: {
        padding: '32px 0',
        color: '#bfbfbf',
        textAlign: 'center' as const,
        fontSize: 13,
    },
    msgItem: {
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    msgButton: {
        width: '100%',
        border: 0,
        background: 'transparent',
        textAlign: 'left' as const,
    },
    dotWrap: {
        position: 'relative' as const,
        width: 8,
        height: 8,
        marginTop: 6,
        flexShrink: 0,
    },
    dot: (color: string) => ({
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        zIndex: 2,
    }),
    dotGlow: (color: string) => ({
        position: 'absolute' as const,
        top: -2,
        left: -2,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        zIndex: 1,
        opacity: 0.2,
    }),
    msgContent: {
        flex: 1,
        overflow: 'hidden' as const,
    },
    msgTitle: {
        fontSize: 13,
        color: '#262626',
        marginBottom: 4,
        fontWeight: 500,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
    },
    msgTime: { fontSize: 12, color: '#8c8c8c' },
    footer: {
        padding: '12px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        fontSize: 13,
        color: '#0f62fe',
        transition: 'background 0.2s',
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
    },
    footerButton: {
        width: '100%',
        border: 0,
        background: '#fafafa',
    },
};
