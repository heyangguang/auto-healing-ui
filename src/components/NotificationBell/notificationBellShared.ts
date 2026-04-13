import { plainButtonReset } from '@/styles/plainButton';

export const POLL_INTERVAL = 60 * 1000;
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
        ...plainButtonReset,
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
        width: 300,
        background: '#fff',
        borderRadius: 0,
        border: '1px solid #f0f0f0',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
        zIndex: 2000,
        overflow: 'hidden' as const,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    header: {
        padding: '14px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 16,
        fontWeight: 600,
        color: '#262626',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCount: {
        fontSize: 14,
        fontWeight: 500,
        color: '#8c8c8c',
        paddingLeft: 8,
    },
    body: {
        maxHeight: 252,
        overflowY: 'auto' as const,
        background: '#fff',
        padding: '8px 16px 6px',
        boxSizing: 'border-box' as const,
    },
    list: {
        listStyle: 'none' as const,
        margin: 0,
        padding: 0,
    },
    empty: {
        minHeight: 160,
        padding: '24px 16px',
        color: '#bfbfbf',
        textAlign: 'center' as const,
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    emptyTitle: {
        fontSize: 14,
        color: '#8c8c8c',
    },
    emptyDesc: {
        fontSize: 12,
        color: '#bfbfbf',
    },
    msgItem: {
        display: 'flex',
        gap: 8,
        padding: '12px 0',
        borderBottom: '1px solid #f5f5f5',
        background: '#fff',
        cursor: 'pointer',
        transition: 'background 0.2s',
        boxSizing: 'border-box' as const,
    },
    msgButton: {
        ...plainButtonReset,
        width: '100%',
        borderRadius: 0,
        textAlign: 'left' as const,
    },
    dotWrap: {
        position: 'relative' as const,
        width: 8,
        height: 8,
        marginTop: 7,
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
    }),
    msgContent: {
        flex: 1,
        overflow: 'hidden' as const,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
    },
    msgTitle: {
        fontSize: 14,
        color: '#262626',
        fontWeight: 500,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
        lineHeight: '22px',
    },
    msgTime: {
        fontSize: 12,
        color: '#8c8c8c',
        whiteSpace: 'nowrap' as const,
        lineHeight: '20px',
    },
    msgMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap' as const,
        minWidth: 0,
    },
    msgMetaDivider: {
        fontSize: 12,
        color: '#bfbfbf',
        lineHeight: 1,
    },
    msgCategory: {
        fontSize: 12,
        color: '#595959',
        whiteSpace: 'nowrap' as const,
    },
    footer: {
        padding: '12px 16px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        fontSize: 14,
        color: '#0f62fe',
        transition: 'background 0.2s',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
    },
    footerButton: {
        ...plainButtonReset,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '12px 16px',
        textAlign: 'center' as const,
        color: '#0f62fe',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.2s',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
    },
};
