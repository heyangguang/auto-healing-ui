import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EyeOutlined, ClockCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { exitTenant } from '@/services/auto-healing/platform/impersonation';
import { message } from 'antd';

const STORAGE_KEY = 'impersonation-storage';

interface ImpersonationSession {
    requestId: string;
    tenantId: string;
    tenantName: string;
    expiresAt: string;
    startedAt: string;
}

/* ── 内联样式（精致胶囊风格） ── */
const S = {
    banner: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        height: 32,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(250,173,20,0.15), rgba(250,140,22,0.1))',
        border: '1px solid rgba(250,173,20,0.25)',
        color: 'rgba(255,255,255,0.9)',
        userSelect: 'none' as const,
        marginLeft: 8,
        marginRight: 4,
    },
    icon: {
        fontSize: 13,
        color: '#faad14',
    },
    tenantName: {
        fontSize: 12,
        fontWeight: 600,
        color: '#ffc53d',
        maxWidth: 100,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
    },
    divider: {
        width: 1,
        height: 14,
        background: 'rgba(255,255,255,0.15)',
        flexShrink: 0,
    },
    timer: {
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontFamily: "'SFMono-Regular', Consolas, monospace",
        fontVariantNumeric: 'tabular-nums' as const,
    },
    exitBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 8px',
        borderRadius: 2,
        fontSize: 11,
        fontWeight: 500,
        color: '#fff',
        background: 'rgba(255,77,79,0.6)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        lineHeight: 1.4,
    },
};

/** 格式化秒数 → HH:MM:SS 或 MM:SS */
const formatTime = (totalSec: number): string => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** 从 localStorage 读取 Impersonation 状态 */
const loadSession = (): ImpersonationSession | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed.isImpersonating || !parsed.session) return null;
        // 检查是否过期
        if (new Date(parsed.session.expiresAt) <= new Date()) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed.session;
    } catch { return null; }
};

const ImpersonationBanner: React.FC = () => {
    const [session, _setSession] = useState<ImpersonationSession | null>(() => loadSession());
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 倒计时
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (!session?.expiresAt) { setRemainingSeconds(0); return; }

        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
            setRemainingSeconds(diff);
            if (diff <= 0) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
            }
        };
        update();
        timerRef.current = setInterval(update, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [session?.expiresAt]);

    const handleExit = useCallback(async () => {
        if (!session) return;
        try {
            await exitTenant(session.requestId);
            localStorage.removeItem(STORAGE_KEY);
            // 🆕 退出后必须跳转到平台页面，不能在租户级页面（如 /system/audit-logs）原地 reload
            // 否则 getInitialState 中的 history.push 在初始化阶段调用会导致 UmiJS 路由异常
            message.success('已退出租户视角');
            window.location.href = '/platform/impersonation';
        } catch {
            message.error('退出失败');
        }
    }, [session]);

    if (!session) return null;

    const timerColor = remainingSeconds <= 300 ? '#ff4d4f' : 'rgba(255,255,255,0.5)';

    return (
        <div style={S.banner}>
            <EyeOutlined style={S.icon} />
            <span style={S.tenantName} title={session.tenantName}>
                {session.tenantName}
            </span>
            <div style={S.divider} />
            <span style={{ ...S.timer, color: timerColor }}>
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                {formatTime(remainingSeconds)}
            </span>
            <div style={S.divider} />
            <div
                style={S.exitBtn}
                onClick={handleExit}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,79,0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,79,0.6)'; }}
            >
                <LogoutOutlined style={{ fontSize: 10 }} />
                退出
            </div>
        </div>
    );
};

export default React.memo(ImpersonationBanner);
