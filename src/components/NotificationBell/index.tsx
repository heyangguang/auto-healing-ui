import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getSiteMessages, getUnreadCount, getSiteMessageCategories } from '@/services/auto-healing/siteMessage';
import type { SiteMessageCategory } from '@/services/auto-healing/siteMessage';
import { TokenManager } from '@/requestErrorConfig';
import dayjs from 'dayjs';
import './index.css';

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

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<{ title: string; time: string; category: string; categoryLabel: string }[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const esRef = useRef<EventSource | null>(null);

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
            const listRes = await getSiteMessages({ page: 1, page_size: 5 });
            const items = listRes?.data || [];
            setMsgs(items.slice(0, 5).map((m: any) => ({
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

    /* ======== SSE 连接（仅初始化一次） ======== */
    useEffect(() => {
        const token = TokenManager.getToken();
        if (!token) {
            console.warn('[NotificationBell] 无 token，跳过 SSE');
            return;
        }

        // SSE 连接地址：
        // - 配置了 SSE_API_BASE → 直连后端（绕过 dev proxy 对 SSE 的缓冲）
        // - 未配置 → 走同源代理
        // 修改 .env.local 中的 SSE_API_BASE 后需要重启 dev server
        const sseBase = (process.env.SSE_API_BASE || '').replace(/\/+$/, '');
        const sseUrl = `${sseBase}/api/v1/site-messages/events?token=${token}`;
        console.log('[SSE] 正在建立连接…', sseBase || '(same origin)');
        const es = new EventSource(sseUrl);
        esRef.current = es;

        es.onopen = () => {
            console.log('[SSE] ✅ 连接已打开, readyState:', es.readyState);
        };

        // 通用消息 fallback（捕获所有 named + unnamed 事件）
        es.onmessage = (e: MessageEvent) => {
            console.log('[SSE] onmessage (unnamed):', e.data);
        };

        // 连接建立 → 直接使用推送的未读数
        es.addEventListener('init', (e: MessageEvent) => {
            console.log('[SSE] 📨 收到 init 事件:', e.data);
            try {
                const d = JSON.parse(e.data);
                setUnreadCount(d.unread_count ?? 0);
            } catch { /* ignore */ }
        });

        // 新消息 → 调 API 拿最新未读数 + 列表
        es.addEventListener('new_message', (e: MessageEvent) => {
            console.log('[SSE] 🔔 收到 new_message 事件:', e.data);
            getUnreadCount()
                .then((res) => setUnreadCount(res?.data?.unread_count ?? 0))
                .catch(() => { });
            getSiteMessages({ page: 1, page_size: 5 })
                .then((res) => {
                    const items = res?.data || [];
                    setMsgs(items.slice(0, 5).map((m: any) => ({
                        title: m.title || '站内信',
                        time: m.created_at || '',
                        category: m.category || '',
                        categoryLabel: '',
                    })));
                })
                .catch(() => { });
        });

        es.onerror = (err) => {
            console.warn('[SSE] ❌ 连接错误, readyState:', es.readyState, err);
            // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
        };

        return () => {
            es.close();
            esRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 只在挂载时建立一次

    /* ======== 初始加载 + 兜底轮询 + 本地事件 ======== */
    useEffect(() => {
        // 初始加载
        refreshAll();

        // 兜底轮询
        timerRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL);

        // 本地事件（同窗口内的标记已读 / 发送消息）
        const onLocal = () => refreshAll();
        window.addEventListener('site-messages:read', onLocal);
        window.addEventListener('site-messages:new', onLocal);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('site-messages:read', onLocal);
            window.removeEventListener('site-messages:new', onLocal);
        };
    }, [refreshAll, refreshUnreadCount]);

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
            return dayjs(t).format('YYYY年M月D日 HH:mm:ss');
        } catch { return t; }
    };

    return (
        <div
            className="nb-wrapper"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div className="nb-bell" title="消息通知">
                <BellOutlined />
                {unreadCount > 0 && <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </div>

            {open && (
                <div
                    className="nb-panel"
                    onMouseEnter={() => { if (hoverRef.current) clearTimeout(hoverRef.current); }}
                    onMouseLeave={handleLeave}
                >
                    {/* 标题 */}
                    <div className="nb-header">
                        <div className="nb-header-title">未读消息（{unreadCount}）</div>
                    </div>

                    {/* 消息列表 */}
                    <div className="nb-body">
                        {msgs.length === 0 ? (
                            <div className="nb-empty">暂无未读消息</div>
                        ) : (
                            msgs.map((m, i) => {
                                const color = getDotColor(m.category);
                                return (
                                    <div key={i} className="nb-msg-item" onClick={() => go('/system/messages')}>
                                        <span className="nb-dot-wrap">
                                            <span className="nb-dot" style={{ background: color }} />
                                            <span className="nb-dot-glow" style={{ background: color }} />
                                        </span>
                                        <div className="nb-msg-content">
                                            <div className="nb-msg-title">{m.title}</div>
                                            <div className="nb-msg-time">
                                                {categoryMap[m.category] || m.category} · {formatTime(m.time)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 底部 */}
                    <div className="nb-footer">
                        <span className="nb-link" onClick={() => go('/system/messages')}>
                            查看更多 ↗
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(NotificationBell);
