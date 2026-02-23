import React, { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import {
    SearchOutlined,
    LoadingOutlined,
    DatabaseOutlined,
    SafetyCertificateOutlined,
    ApartmentOutlined,
    PlayCircleOutlined,
    BookOutlined,
    FileTextOutlined,
    ScheduleOutlined,
    KeyOutlined,
    AppstoreOutlined,
    MailOutlined,
    BellOutlined,
    RightOutlined,
    EnterOutlined,
    AlertOutlined,
    ThunderboltOutlined,
    GitlabOutlined,
} from '@ant-design/icons';
import { Input, Empty } from 'antd';
import { history } from '@umijs/max';
import { createStyles } from 'antd-style';
import { globalSearch } from '@/services/auto-healing/search';
import type { SearchCategoryResult, SearchResultItem } from '@/services/auto-healing/search';

/* ── 分类图标 & 颜色 ── */
const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
    hosts: { icon: <DatabaseOutlined />, color: '#52c41a' },
    incidents: { icon: <AlertOutlined />, color: '#ff4d4f' },
    rules: { icon: <SafetyCertificateOutlined />, color: '#faad14' },
    flows: { icon: <ApartmentOutlined />, color: '#1890ff' },
    instances: { icon: <PlayCircleOutlined />, color: '#722ed1' },
    playbooks: { icon: <BookOutlined />, color: '#13c2c2' },
    templates: { icon: <FileTextOutlined />, color: '#eb2f96' },
    schedules: { icon: <ScheduleOutlined />, color: '#fa8c16' },
    execution_runs: { icon: <ThunderboltOutlined />, color: '#9254de' },
    git_repos: { icon: <GitlabOutlined />, color: '#fc6d26' },
    secrets: { icon: <KeyOutlined />, color: '#fadb14' },
    plugins: { icon: <AppstoreOutlined />, color: '#2f54eb' },
    notification_templates: { icon: <BellOutlined />, color: '#f5222d' },
    notification_channels: { icon: <MailOutlined />, color: '#a0d911' },
};

/* ── 状态点颜色 ── */
const STATUS_DOT: Record<string, string> = {
    active: '#52c41a', online: '#52c41a', ready: '#52c41a', success: '#52c41a',
    running: '#1890ff', processing: '#1890ff', syncing: '#1890ff',
    failed: '#ff4d4f', error: '#ff4d4f', offline: '#ff4d4f',
    maintenance: '#fa8c16', pending: '#faad14', disabled: '#666',
    scanned: '#13c2c2', inactive: '#666',
};

function getStatusInfo(extra?: Record<string, any>): { label: string; color: string } | null {
    if (!extra) return null;
    const status = extra.status
        || (extra.is_active !== undefined ? (extra.is_active ? 'active' : 'inactive') : null)
        || (extra.is_enabled !== undefined ? (extra.is_enabled ? 'active' : 'disabled') : null);
    if (!status) return null;
    return { label: status, color: STATUS_DOT[status] || '#666' };
}

/* ── 样式 ── */
const useStyles = createStyles(({ token }) => ({
    searchWrapper: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
        padding: '0 16px',
        position: 'relative' as const,
    },
    searchInput: {
        width: '100%',
        maxWidth: 460,
        background: 'rgba(255,255,255,0.10) !important',
        borderColor: 'rgba(255,255,255,0.15) !important',
        borderRadius: '0 !important',
        color: '#fff !important',
        '&::placeholder': { color: 'rgba(255,255,255,0.45) !important' },
        '&:hover': {
            borderColor: 'rgba(255,255,255,0.35) !important',
            background: 'rgba(255,255,255,0.14) !important',
        },
        '&:focus, &.ant-input-affix-wrapper-focused': {
            borderColor: `${token.colorPrimary} !important`,
            background: 'rgba(255,255,255,0.14) !important',
            boxShadow: `0 0 0 2px rgba(24,144,255,0.12) !important`,
        },
        '.ant-input': {
            color: '#fff !important',
            background: 'transparent !important',
            '&::placeholder': { color: 'rgba(255,255,255,0.45) !important' },
        },
        '.ant-input-prefix': { color: 'rgba(255,255,255,0.45)', marginInlineEnd: 8 },
        '.ant-input-clear-icon': {
            color: 'rgba(255,255,255,0.35)',
            '&:hover': { color: 'rgba(255,255,255,0.7)' },
        },
    },

    /* ── 下拉面板 ── */
    dropdown: {
        position: 'absolute' as const,
        top: 'calc(100% + 4px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 460,
        maxHeight: 420,
        overflowY: 'auto' as const,
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 2000,
        padding: '4px 0',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 0 },
    },

    /* ── 分类标题 ── */
    catHeader: {
        padding: '6px 12px 2px',
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 0.3,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    },

    /* ── 结果条目：单行紧凑 ── */
    item: {
        display: 'flex',
        alignItems: 'center',
        height: 36,
        padding: '0 12px',
        cursor: 'pointer',
        gap: 8,
        transition: 'background 0.1s',
        '&:hover': { background: 'rgba(255,255,255,0.06)' },
    },
    itemActive: {
        background: 'rgba(24,144,255,0.12) !important',
    },

    /* 分类小图标 */
    itemIcon: {
        width: 22,
        height: 22,
        borderRadius: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        flexShrink: 0,
    },

    /* 标题 */
    itemTitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.88)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        flex: 1,
        minWidth: 0,
    },

    /* 副标题描述 - 右侧灰色 */
    itemDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        maxWidth: 160,
        flexShrink: 0,
    },

    /* 状态点 */
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        flexShrink: 0,
    },

    /* 分割线 */
    sep: {
        height: 1,
        background: 'rgba(255,255,255,0.06)',
        margin: '4px 12px',
    },

    /* 查看更多 */
    viewMore: {
        display: 'flex',
        alignItems: 'center',
        height: 28,
        padding: '0 12px 0 42px',
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        cursor: 'pointer',
        gap: 4,
        '&:hover': { color: token.colorPrimary },
    },

    /* 底部提示栏 */
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
    },
    footerKeys: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    kbd: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        height: 18,
        fontSize: 10,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 3,
    },
    kbdInline: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        height: 20,
        fontSize: 11,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginLeft: 'auto',
        flexShrink: 0,
    },

    emptyBox: { padding: '24px 16px', textAlign: 'center' as const },
    loadingBox: {
        padding: '24px 16px',
        textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },

    hl: { color: token.colorPrimary, fontWeight: 600 },
}));

/* ── 高亮关键词 ── */
function hl(text: string, kw: string): React.ReactNode {
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

/* ── 分类 → 列表页路由 ── */
const CATEGORY_LIST: Record<string, string> = {
    hosts: '/resources/cmdb',
    incidents: '/resources/incidents',
    rules: '/healing/rules',
    flows: '/healing/flows',
    instances: '/healing/instances',
    playbooks: '/execution/playbooks',
    templates: '/execution/templates',
    schedules: '/execution/schedules',
    execution_runs: '/execution/runs',
    git_repos: '/execution/git-repos',
    secrets: '/resources/secrets',
    plugins: '/resources/plugins',
    notification_templates: '/notification/templates',
    notification_channels: '/notification/channels',
};

/* ── 跳转路径（明细页） ── */
function toPath(item: SearchResultItem, cat: string): string {
    if (cat === 'flows') return `/healing/flows/editor/${item.id}`;
    if (cat === 'instances') return `/healing/instances/${item.id}`;
    if (cat === 'execution_runs') return `/execution/runs/${item.id}`;
    return item.path;
}

const DEBOUNCE = 280;

const GlobalSearch: React.FC<{ compact?: boolean }> = ({ compact }) => {
    const { styles, cx } = useStyles();
    const [kw, setKw] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchCategoryResult[]>([]);
    const [total, setTotal] = useState(0);
    const [ai, setAi] = useState(-1);           // active index
    const boxRef = useRef<HTMLDivElement>(null);
    const inRef = useRef<any>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    /* 扁平列表 → 键盘导航 */
    const flat = React.useMemo(() => {
        const a: { it: SearchResultItem; cat: string }[] = [];
        results.forEach(c => c.items.forEach(it => a.push({ it, cat: c.category })));
        return a;
    }, [results]);

    /* 搜索 */
    const search = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); setTotal(0); setOpen(false); return; }
        setLoading(true); setOpen(true);
        try {
            const d = await globalSearch({ q: q.trim(), limit: 5 });
            setResults(d.results || []);
            setTotal(d.total_count || 0);
            setAi(-1);
        } catch { setResults([]); setTotal(0); }
        finally { setLoading(false); }
    }, []);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; setKw(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => search(v), DEBOUNCE);
    }, [search]);

    const go = useCallback((it: SearchResultItem, cat: string) => {
        setOpen(false); setKw('');
        startTransition(() => history.push(toPath(it, cat)));
    }, []);

    const onKey = useCallback((e: React.KeyboardEvent) => {
        if (!open || !flat.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setAi(p => (p + 1) % flat.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setAi(p => (p - 1 + flat.length) % flat.length); }
        else if (e.key === 'Enter' && ai >= 0) { e.preventDefault(); go(flat[ai].it, flat[ai].cat); }
        else if (e.key === 'Escape') { setOpen(false); inRef.current?.blur(); }
    }, [open, flat, ai, go]);

    /* 外部点击关闭 */
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    /* ⌘K 快捷键 */
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inRef.current?.focus(); }
        };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, []);

    const onFocus = useCallback(() => {
        if (kw.trim() && results.length) setOpen(true);
    }, [kw, results]);

    /* ── 渲染 ── */
    let gi = 0;  // global index for keyboard nav
    return (
        <div className={styles.searchWrapper} ref={boxRef}>
            <Input
                ref={inRef}
                className={styles.searchInput}
                style={compact ? { maxWidth: 240 } : undefined}
                prefix={loading ? <LoadingOutlined spin /> : <SearchOutlined />}
                suffix={<span className={styles.kbdInline}>⌘K</span>}
                placeholder={compact ? '搜索...' : '搜索产品、资源...'}
                allowClear
                size="middle"
                value={kw}
                onChange={onChange}
                onFocus={onFocus}
                onKeyDown={onKey}
            />

            {open && (
                <div className={styles.dropdown}>
                    {loading ? (
                        <div className={styles.loadingBox}>
                            <LoadingOutlined spin style={{ fontSize: 16, marginBottom: 6 }} />
                            <div>搜索中…</div>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((cat, ci) => {
                                const m = CATEGORY_META[cat.category] || { icon: <AppstoreOutlined />, color: '#666' };
                                return (
                                    <div key={cat.category}>
                                        {ci > 0 && <div className={styles.sep} />}
                                        <div className={styles.catHeader}>
                                            <span style={{ color: m.color, fontSize: 12 }}>{m.icon}</span>
                                            {cat.category_label}
                                            <span style={{ fontWeight: 400 }}>· {cat.total}</span>
                                        </div>
                                        {cat.items.map(it => {
                                            const idx = gi++;
                                            const st = getStatusInfo(it.extra);
                                            return (
                                                <div
                                                    key={it.id}
                                                    className={cx(styles.item, ai === idx && styles.itemActive)}
                                                    onClick={() => go(it, cat.category)}
                                                    onMouseEnter={() => setAi(idx)}
                                                >
                                                    <div
                                                        className={styles.itemIcon}
                                                        style={{ background: `${m.color}14`, color: m.color }}
                                                    >
                                                        {m.icon}
                                                    </div>
                                                    <span className={styles.itemTitle}>{hl(it.title, kw)}</span>
                                                    {it.description && (
                                                        <span className={styles.itemDesc}>{hl(it.description, kw)}</span>
                                                    )}
                                                    {st && (
                                                        <span
                                                            className={styles.statusDot}
                                                            style={{ background: st.color }}
                                                            title={st.label}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {cat.total > cat.items.length && (
                                            <div
                                                className={styles.viewMore}
                                                onClick={() => {
                                                    setOpen(false); setKw('');
                                                    const listPath = CATEGORY_LIST[cat.category] || '/';
                                                    startTransition(() => history.push(listPath));
                                                }}
                                            >
                                                查看全部 {cat.total} 条 <RightOutlined style={{ fontSize: 9 }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* 底部快捷键提示 */}
                            <div className={styles.footer}>
                                <span>共 {total} 条结果</span>
                                <div className={styles.footerKeys}>
                                    <span><span className={styles.kbd}>↑</span> <span className={styles.kbd}>↓</span> 导航</span>
                                    <span><span className={styles.kbd}><EnterOutlined /></span> 选择</span>
                                    <span><span className={styles.kbd}>ESC</span> 关闭</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyBox}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                                        未找到 "{kw}" 相关结果
                                    </span>
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(GlobalSearch);
