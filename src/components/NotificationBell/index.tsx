import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import ReactDOM from 'react-dom';
import { BellOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getSiteMessages, getUnreadCount, getSiteMessageCategories } from '@/services/auto-healing/siteMessage';
import type { SiteMessage, SiteMessageCategory } from '@/services/auto-healing/siteMessage';
import { createAuthenticatedEventStream, type SSEConnection } from '@/services/auto-healing/sse';
import { TokenManager } from '@/requestErrorConfig';
import dayjs from 'dayjs';
import * as notificationBellShared from './notificationBellShared';

const NotificationBell: React.FC = () => {
    const S = notificationBellShared.bellStyles;
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Array<Pick<SiteMessage, 'title' | 'created_at' | 'category'>>>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(notificationBellShared.getCurrentTenantId());

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const esRef = useRef<SSEConnection | null>(null);

    /* 监听 storage 变化（跨 tab 或同页面 reload 后租户变化） */
    useEffect(() => {
        const checkTenant = () => {
            const newId = notificationBellShared.getCurrentTenantId();
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
            .then((categories) => {
                const map: Record<string, string> = {};
                categories.forEach((c: SiteMessageCategory) => {
                    map[c.value] = c.label;
                });
                setCategoryMap(map);
            })
            .catch(() => { });
    }, []);

    const getDotColor = (cat: string) => notificationBellShared.getNotificationDotColor(cat);

    /** 获取未读数（后台轮询用，不刷新 token） */
    const refreshUnreadCount = useCallback(async () => {
        try {
            const res = await getUnreadCount({ skipTokenRefresh: true, suppressForbiddenError: true });
            setUnreadCount(res?.unread_count ?? 0);
            return true;
        } catch { /* silent */ }
        return false;
    }, []);

    /** 获取消息列表（后台轮询用，不刷新 token） */
    const refreshMessages = useCallback(async () => {
        try {
            const listRes = await getSiteMessages(
                { page: 1, page_size: 10, is_read: false },
                { skipTokenRefresh: true, suppressForbiddenError: true },
            );
            const items = listRes.data || [];
            setMsgs(items.slice(0, 10).map((message) => ({
                title: message.title || '站内信',
                created_at: message.created_at || '',
                category: message.category || '',
            })));
            return true;
        } catch {
            return false;
        }
    }, []);

    /** 完整刷新 */
    const refreshAll = useCallback(async () => {
        const [unreadSuccess, messageSuccess] = await Promise.all([refreshUnreadCount(), refreshMessages()]);
        setLoadError(unreadSuccess && messageSuccess ? null : '站内信加载失败，请稍后重试');
    }, [refreshUnreadCount, refreshMessages]);

    /* ======== SSE 连接（租户变化时重新建立） ======== */
    useEffect(() => {
        const token = TokenManager.getToken();
        if (!token) return;

        const sseBase = (process.env.SSE_API_BASE || '').replace(/\/+$/, '');
        const connection = createAuthenticatedEventStream(
            `${sseBase}/api/v1/tenant/site-messages/events`,
            {
                onEvent: (event) => {
                    if (event === 'init' || event === 'new_message') {
                        refreshAll();
                    }
                },
            },
        );
        esRef.current = connection;

        return () => {
            connection.close();
            esRef.current = null;
        };
    }, [tenantId, refreshAll]);

    /* ======== 初始加载 + 兜底轮询 + 本地事件（租户变化时重新执行） ======== */
    useEffect(() => {
        refreshAll();
        timerRef.current = setInterval(refreshUnreadCount, notificationBellShared.POLL_INTERVAL);

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
    const toggleOpen = useCallback(() => {
        setOpen((value) => !value);
        if (!open) {
            void refreshAll();
        }
    }, [open, refreshAll]);
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
            style={S.container}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <button
                type="button"
                ref={triggerRef}
                style={{
                    ...S.trigger,
                    background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 0,
                }}
                aria-label={unreadCount > 0 ? `未读消息 ${unreadCount} 条` : '未读消息'}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? notificationBellShared.NOTIFICATION_PANEL_ID : undefined}
                onClick={toggleOpen}
            >
                <BellOutlined style={S.triggerIcon} />
                {unreadCount > 0 && (
                    <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && ReactDOM.createPortal(
                <div
                    id={notificationBellShared.NOTIFICATION_PANEL_ID}
                    ref={panelRef}
                    style={{ ...S.panel, top: panelPos.top, right: panelPos.right }}
                    onMouseEnter={() => { if (hoverRef.current) clearTimeout(hoverRef.current); }}
                    onMouseLeave={handleLeave}
                    role="dialog"
                    aria-modal="false"
                    aria-label="未读消息"
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            close();
                        }
                    }}
                >
                    {/* 标题 */}
                    <div style={S.header}>
                        未读消息（{unreadCount}）
                    </div>

                    {/* 消息列表 */}
                    <div style={S.body} role="list">
                        {msgs.length === 0 ? (
                            <div style={S.empty}>{loadError || '暂无未读消息'}</div>
                        ) : (
                            msgs.map((m, i) => {
                                const color = getDotColor(m.category);
                                return (
                                    <button
                                        type="button"
                                        key={i}
                                        style={{ ...S.msgItem, ...S.msgButton }}
                                        onClick={() => go('/system/messages')}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        aria-label={`查看消息 ${m.title}`}
                                    >
                                        <span style={S.dotWrap}>
                                            <span style={S.dot(color)} />
                                            <span style={S.dotGlow(color)} />
                                        </span>
                                        <div style={S.msgContent}>
                                            <div style={S.msgTitle}>{m.title}</div>
                                            <div style={S.msgTime}>
                                                {categoryMap[m.category] || m.category} · {formatTime(m.created_at)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* 底部 */}
                    <button
                        type="button"
                        style={{ ...S.footer, ...S.footerButton }}
                        onClick={() => go('/system/messages')}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; }}
                        aria-label="查看全部站内消息"
                    >
                        查看全部 ↗
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default React.memo(NotificationBell);
