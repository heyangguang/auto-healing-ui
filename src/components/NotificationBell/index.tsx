import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import ReactDOM from 'react-dom';
import { BellOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getSiteMessages, getUnreadCount, getSiteMessageCategories } from '@/services/auto-healing/siteMessage';
import type { SiteMessageCategory } from '@/services/auto-healing/siteMessage';
import { TokenManager } from '@/requestErrorConfig';
import dayjs from 'dayjs';

/** 降级轮询间隔 5 分钟（SSE 在线时兜底） */
const POLL_INTERVAL = 5 * 60_000;

/** 分类颜色 - 使用后端英文 value */
const DOT_COLORS: Record<string, string> = {
    system_update: '#1677ff',
    product_news: '#1677ff',
    service_notice: '#52c41a',
    activity: '#faad14',
    fault_alert: '#ff4d4f',
    security: '#ff4d4f',
};

/* ── 内联样式常量 ── */
const S = {
    container: { position: 'relative' as const },
    trigger: {
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 14px', height: 58,
        transition: 'background 0.2s',
        color: 'rgba(255,255,255,0.85)', userSelect: 'none' as const,
        position: 'relative' as const,
    },
    triggerIcon: { fontSize: 16 },
    badge: {
        position: 'absolute' as const, top: 12, right: 6,
        background: '#ff4d4f', color: '#fff', fontSize: 12,
        lineHeight: '16px', padding: '0 5px', borderRadius: 8,
        transform: 'scale(0.85)', transformOrigin: 'right top',
        fontWeight: 'bold' as const,
    },
    panel: {
        position: 'fixed' as const,
        width: 250, background: '#fff',
        borderRadius: '0 0 6px 6px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
        zIndex: 2000, overflow: 'hidden' as const,
        display: 'flex', flexDirection: 'column' as const,
    },
    header: {
        padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
        fontSize: 14, fontWeight: 600, color: '#262626',
        background: '#fafafa',
    },
    body: {
        maxHeight: 202, overflowY: 'auto' as const,
    },
    empty: { padding: '32px 0', color: '#bfbfbf', textAlign: 'center' as const, fontSize: 13 },
    msgItem: {
        display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer', transition: 'background 0.2s',
    },
    dotWrap: { position: 'relative' as const, width: 8, height: 8, marginTop: 6, flexShrink: 0 },
    dot: (color: string) => ({
        position: 'absolute' as const, top: 0, left: 0,
        width: 8, height: 8, borderRadius: '50%', background: color, zIndex: 2
    }),
    dotGlow: (color: string) => ({
        position: 'absolute' as const, top: -2, left: -2,
        width: 12, height: 12, borderRadius: '50%', background: color, zIndex: 1, opacity: 0.2
    }),
    msgContent: { flex: 1, overflow: 'hidden' as const },
    msgTitle: {
        fontSize: 13, color: '#262626', marginBottom: 4, fontWeight: 500,
        overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
    },
    msgTime: { fontSize: 12, color: '#8c8c8c' },
    footer: {
        padding: '12px', textAlign: 'center' as const,
        cursor: 'pointer', fontSize: 13, color: '#0f62fe',
        transition: 'background 0.2s', background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
    }
};

/** 从 localStorage 获取当前租户 ID */
const getCurrentTenantId = (): string | null => {
    try {
        const raw = localStorage.getItem('tenant-storage');
        if (raw) {
            const { currentTenantId } = JSON.parse(raw);
            return currentTenantId || null;
        }
    } catch { /* ignore */ }
    return null;
};

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<{ title: string; time: string; category: string; categoryLabel: string }[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [tenantId, setTenantId] = useState<string | null>(getCurrentTenantId);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const esRef = useRef<EventSource | null>(null);

    /* 监听 storage 变化（跨 tab 或同页面 reload 后租户变化） */
    useEffect(() => {
        const checkTenant = () => {
            const newId = getCurrentTenantId();
            setTenantId(prev => prev !== newId ? newId : prev);
        };
        // 监听 storage 事件（跨 tab）
        window.addEventListener('storage', checkTenant);
        // 也检查一次当前值（应对同 tab reload）
        checkTenant();
        return () => window.removeEventListener('storage', checkTenant);
    }, []);

    /* 加载分类映射 */
    useEffect(() => {
        getSiteMessageCategories()
            .then((res) => {
                const map: Record<string, string> = {};
                (res?.data || []).forEach((c: SiteMessageCategory) => {
                    map[c.value] = c.label;
                });
                setCategoryMap(map);
            })
            .catch(() => { });
    }, []);

    const getDotColor = (cat: string) => DOT_COLORS[cat] || '#1677ff';

    /** 获取未读数 */
    const refreshUnreadCount = useCallback(async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res?.data?.unread_count ?? 0);
        } catch { /* silent */ }
    }, []);

    /** 获取消息列表 */
    const refreshMessages = useCallback(async () => {
        try {
            const listRes = await getSiteMessages({ page: 1, page_size: 10 });
            const items = listRes?.data || [];
            setMsgs(items.slice(0, 10).map((m: any) => ({
                title: m.title || '站内信',
                time: m.created_at || '',
                category: m.category || '',
                categoryLabel: '',
            })));
        } catch { /* silent */ }
    }, []);

    /** 完整刷新 */
    const refreshAll = useCallback(async () => {
        await Promise.all([refreshUnreadCount(), refreshMessages()]);
    }, [refreshUnreadCount, refreshMessages]);

    /* ======== SSE 连接（租户变化时重新建立） ======== */
    useEffect(() => {
        const token = TokenManager.getToken();
        if (!token) return;

        const sseBase = (process.env.SSE_API_BASE || '').replace(/\/+$/, '');
        let sseUrl = `${sseBase}/api/v1/site-messages/events?token=${token}`;
        // 将当前租户 ID 传入 SSE，确保数据与租户匹配
        if (tenantId) {
            sseUrl += `&tenant_id=${encodeURIComponent(tenantId)}`;
        }
        const es = new EventSource(sseUrl);
        esRef.current = es;

        // SSE 事件仅作为触发器，所有数据都通过 API 获取
        // （API 经过请求拦截器，会自动注入正确的 X-Tenant-ID）
        es.addEventListener('init', () => {
            refreshAll();
        });

        es.addEventListener('new_message', () => {
            getUnreadCount()
                .then((res) => setUnreadCount(res?.data?.unread_count ?? 0))
                .catch(() => { });
            getSiteMessages({ page: 1, page_size: 10 })
                .then((res) => {
                    const items = res?.data || [];
                    setMsgs(items.slice(0, 10).map((m: any) => ({
                        title: m.title || '站内信',
                        time: m.created_at || '',
                        category: m.category || '',
                        categoryLabel: '',
                    })));
                })
                .catch(() => { });
        });

        return () => {
            es.close();
            esRef.current = null;
        };
    }, [tenantId]);

    /* ======== 初始加载 + 兜底轮询 + 本地事件（租户变化时重新执行） ======== */
    useEffect(() => {
        refreshAll();
        timerRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL);

        const onLocal = () => refreshAll();
        window.addEventListener('site-messages:read', onLocal);
        window.addEventListener('site-messages:new', onLocal);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('site-messages:read', onLocal);
            window.removeEventListener('site-messages:new', onLocal);
        };
    }, [refreshAll, refreshUnreadCount, tenantId]);

    /* 位置计算 */
    useEffect(() => {
        if (open) {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPanelPos({
                    top: rect.bottom,
                    right: document.documentElement.clientWidth - rect.right
                });
            }
        }
    }, [open]);

    const handleEnter = useCallback(() => {
        if (hoverRef.current) clearTimeout(hoverRef.current);
        hoverRef.current = setTimeout(() => {
            setOpen(true);
            refreshAll();
        }, 150);
    }, [refreshAll]);

    const handleLeave = useCallback(() => {
        if (hoverRef.current) clearTimeout(hoverRef.current);
        hoverRef.current = setTimeout(() => setOpen(false), 200);
    }, []);

    const close = useCallback(() => setOpen(false), []);
    const go = useCallback((path: string) => {
        close();
        startTransition(() => history.push(path));
    }, [close]);

    /* 格式化时间 */
    const formatTime = (t: string) => {
        try {
            return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
        } catch { return t; }
    };

    return (
        <div
            ref={containerRef}
            style={S.container}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div
                ref={triggerRef}
                style={{
                    ...S.trigger,
                    background: open ? 'rgba(255,255,255,0.06)' : 'transparent'
                }}
            >
                <BellOutlined style={S.triggerIcon} />
                {unreadCount > 0 && (
                    <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </div>

            {open && ReactDOM.createPortal(
                <div
                    ref={panelRef}
                    style={{ ...S.panel, top: panelPos.top, right: panelPos.right }}
                    onMouseEnter={() => { if (hoverRef.current) clearTimeout(hoverRef.current); }}
                    onMouseLeave={handleLeave}
                >
                    {/* 标题 */}
                    <div style={S.header}>
                        未读消息（{unreadCount}）
                    </div>

                    {/* 消息列表 */}
                    <div style={S.body}>
                        {msgs.length === 0 ? (
                            <div style={S.empty}>暂无未读消息</div>
                        ) : (
                            msgs.map((m, i) => {
                                const color = getDotColor(m.category);
                                return (
                                    <div
                                        key={i}
                                        style={S.msgItem}
                                        onClick={() => go('/system/messages')}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span style={S.dotWrap}>
                                            <span style={S.dot(color)} />
                                            <span style={S.dotGlow(color)} />
                                        </span>
                                        <div style={S.msgContent}>
                                            <div style={S.msgTitle}>{m.title}</div>
                                            <div style={S.msgTime}>
                                                {categoryMap[m.category] || m.category} · {formatTime(m.time)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 底部 */}
                    <div
                        style={S.footer}
                        onClick={() => go('/system/messages')}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; }}
                    >
                        查看全部 ↗
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default React.memo(NotificationBell);
