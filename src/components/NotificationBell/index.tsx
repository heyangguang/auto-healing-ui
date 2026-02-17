import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getSiteMessages } from '@/services/auto-healing/siteMessage';
import './index.css';

const POLL = 60_000;

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<{ title: string; time: string; category: string }[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* 分类颜色 */
    const DOT_COLORS: Record<string, string> = {
        '产品消息': '#1677ff',
        '服务消息': '#52c41a',
        '活动通知': '#faad14',
        '故障通知': '#ff4d4f',
    };
    const getDotColor = (cat: string) => {
        for (const key of Object.keys(DOT_COLORS)) {
            if (cat.includes(key)) return DOT_COLORS[key];
        }
        return '#1677ff';
    };

    const fetchData = useCallback(async () => {
        try {
            const res = await getSiteMessages({ page: 1, page_size: 5 });
            const items = res?.data || [];
            setUnreadCount(res?.total || items.length);
            setMsgs(items.slice(0, 5).map((m: any) => ({
                title: m.title || '站内信',
                time: m.date + ' ' + m.time,
                category: m.category || '',
            })));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchData();
        timerRef.current = setInterval(fetchData, POLL);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [fetchData]);

    const handleEnter = useCallback(() => {
        if (hoverRef.current) clearTimeout(hoverRef.current);
        hoverRef.current = setTimeout(() => {
            setOpen(true);
            fetchData();
        }, 150);
    }, [fetchData]);

    const handleLeave = useCallback(() => {
        if (hoverRef.current) clearTimeout(hoverRef.current);
        hoverRef.current = setTimeout(() => setOpen(false), 200);
    }, []);

    const close = useCallback(() => setOpen(false), []);
    const go = useCallback((path: string) => {
        close();
        startTransition(() => history.push(path));
    }, [close]);

    /* 格式化时间为中文: 2026年2月13日 01:06:14 */
    const formatTime = (t: string) => {
        try {
            const d = new Date(t);
            if (isNaN(d.getTime())) return t;
            return d.toLocaleString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
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
                                            <div className="nb-msg-time">{formatTime(m.time)}</div>
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
