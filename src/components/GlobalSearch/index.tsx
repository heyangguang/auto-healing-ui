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
import { history, useAccess } from '@umijs/max';
import { createStyles } from 'antd-style';
import { globalSearch } from '@/services/auto-healing/search';
import type { SearchCategoryResult, SearchResultItem } from '@/services/auto-healing/search';
import { canAccessPath } from '@/utils/pathAccess';
import { createRequestSequence } from '@/utils/requestSequence';
import './search-glow.css';

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

function getStatusValue(extra?: SearchResultItem['extra']): string | null {
    if (!extra) return null;
    const rawStatus = typeof extra.status === 'string' ? extra.status : null;
    const activeStatus = typeof extra.is_active === 'boolean'
        ? (extra.is_active ? 'active' : 'inactive')
        : null;
    const enabledStatus = typeof extra.is_enabled === 'boolean'
        ? (extra.is_enabled ? 'active' : 'disabled')
        : null;
    const status = rawStatus || activeStatus || enabledStatus;
    if (!status) return null;
    return status;
}

function getStatusInfo(extra?: SearchResultItem['extra']): { label: string; color: string } | null {
    const status = getStatusValue(extra);
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
        zIndex: 100, /* 高于星空背景，保证 dropdown 可见 */
    },
    searchInput: {
        width: '100%',
        maxWidth: 320,
        position: 'relative' as const,
        zIndex: 1,
        background: '#010201 !important',
        border: 'none !important',
        borderRadius: '0 !important',
        color: '#fff !important',
        '&::placeholder': { color: 'rgba(192,185,192,0.6) !important' },
        '&:hover': {
            background: '#0a0a0a !important',
        },
        '&:focus, &.ant-input-affix-wrapper-focused': {
            background: '#010201 !important',
            borderColor: 'transparent !important',
            boxShadow: 'none !important',
            outline: 'none',
        },
        '.ant-input': {
            color: '#fff !important',
            background: 'transparent !important',
            WebkitTextFillColor: '#fff !important',
            '&::placeholder': {
                color: 'rgba(192,185,192,0.6) !important',
                WebkitTextFillColor: 'rgba(192,185,192,0.6) !important',
            },
            '&:focus': { outline: 'none' },
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
        maxWidth: 320,
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
        width: '100%',
        textAlign: 'left' as const,
        border: 'none',
        background: 'transparent',
        font: 'inherit',
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
        width: '100%',
        textAlign: 'left' as const,
        border: 'none',
        background: 'transparent',
        font: 'inherit',
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
    execution_runs: '/execution/logs',
    git_repos: '/execution/git-repos',
    secrets: '/resources/secrets',
    plugins: '/resources/plugins',
    notification_templates: '/notification/templates',
    notification_channels: '/notification/channels',
};

const DEBOUNCE = 280;
const GLOBAL_SEARCH_RESULTS_ID = 'global-search-results';

const GlobalSearch: React.FC<{ compact?: boolean }> = ({ compact }) => {
    const { styles, cx } = useStyles();
    const access = useAccess();
    const [kw, setKw] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchCategoryResult[]>([]);
    const [total, setTotal] = useState(0);
    const [ai, setAi] = useState(-1);           // active index
    const boxRef = useRef<HTMLDivElement>(null);
    const inRef = useRef<any>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const searchSequenceRef = useRef(createRequestSequence());

    /* 扁平列表 → 键盘导航 */
    const flat = React.useMemo(() => {
        const a: { it: SearchResultItem; cat: string }[] = [];
        results.forEach(c => c.items.forEach(it => a.push({ it, cat: c.category })));
        return a;
    }, [results]);

    /* 搜索 */
    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            searchSequenceRef.current.invalidate();
            setResults([]);
            setTotal(0);
            setOpen(false);
            return;
        }
        const token = searchSequenceRef.current.next();
        setLoading(true); setOpen(true);
        try {
            const d = await globalSearch({ q: q.trim(), limit: 5 });
            if (!searchSequenceRef.current.isCurrent(token)) return;
            setResults(d.results || []);
            setTotal(d.total_count || 0);
            setAi(-1);
        } catch {
            if (!searchSequenceRef.current.isCurrent(token)) return;
            setResults([]);
            setTotal(0);
        }
        finally {
            if (searchSequenceRef.current.isCurrent(token)) {
                setLoading(false);
            }
        }
    }, []);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; setKw(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => search(v), DEBOUNCE);
    }, [search]);

    const resolvePath = useCallback((item: SearchResultItem, cat: string): string => {
        if (cat === 'flows') {
            return access.canUpdateFlow ? `/healing/flows/editor/${item.id}` : '/healing/flows';
        }
        if (cat === 'instances') {
            return access.canViewInstances ? `/healing/instances/${item.id}` : (CATEGORY_LIST[cat] || '/healing/instances');
        }
        if (cat === 'execution_runs') {
            return access.canViewTaskDetail ? `/execution/runs/${item.id}` : (CATEGORY_LIST[cat] || '/execution/logs');
        }
        if (item.path && canAccessPath(item.path, access)) return item.path;
        return CATEGORY_LIST[cat] || '/';
    }, [access]);

    const go = useCallback((it: SearchResultItem, cat: string) => {
        setOpen(false); setKw('');
        startTransition(() => history.push(resolvePath(it, cat)));
    }, [resolvePath]);

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

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
            searchSequenceRef.current.invalidate();
        };
    }, []);

    const onFocus = useCallback(() => {
        if (kw.trim() && results.length) setOpen(true);
    }, [kw, results]);

    /* ── 渲染 ── */
    let gi = 0;  // global index for keyboard nav
    return (
        <div className={styles.searchWrapper} ref={boxRef}>
            {/* uiverse.io 发光搜索框结构 */}
            <div className="search-poda" style={compact ? { maxWidth: 240 } : { maxWidth: 320 }}>
                <div className="gs-glow" />
                <div className="gs-darkBorderBg" />
                <div className="gs-darkBorderBg" />
                <div className="gs-darkBorderBg" />
                <div className="gs-white" />
                <div className="gs-border" />
                <Input
                    ref={inRef}
                    className={styles.searchInput}
                    prefix={loading ? <LoadingOutlined spin /> : <SearchOutlined />}
                    suffix={<span className={styles.kbdInline}>⌘K</span>}
                    placeholder={compact ? '搜索...' : '搜索产品、资源...'}
                    aria-label="全局搜索"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls={open ? GLOBAL_SEARCH_RESULTS_ID : undefined}
                    allowClear
                    size="middle"
                    value={kw}
                    onChange={onChange}
                    onFocus={onFocus}
                    onKeyDown={onKey}
                />
            </div>

            {open && (
                <div id={GLOBAL_SEARCH_RESULTS_ID} className={styles.dropdown} role="listbox" aria-label="全局搜索结果">
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
                                                <button
                                                    type="button"
                                                    key={it.id}
                                                    role="option"
                                                    aria-selected={ai === idx}
                                                    tabIndex={-1}
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
                                                    <span className={styles.itemTitle} title={it.title}>{hl(it.title, kw)}</span>
                                                    {it.description && (
                                                        <span className={styles.itemDesc} title={it.description}>{hl(it.description, kw)}</span>
                                                    )}
                                                    {st && (
                                                        <span
                                                            className={styles.statusDot}
                                                            style={{ background: st.color }}
                                                            title={st.label}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {cat.total > cat.items.length && (
                                            <button
                                                type="button"
                                                className={styles.viewMore}
                                                onClick={() => {
                                                    const listPath = CATEGORY_LIST[cat.category] || '/';
                                                    if (!canAccessPath(listPath, access)) return;
                                                    setOpen(false); setKw('');
                                                    startTransition(() => history.push(listPath));
                                                }}
                                                aria-label={`前往${cat.category_label}列表页`}
                                                style={!canAccessPath(CATEGORY_LIST[cat.category] || '/', access) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                            >
                                                前往列表页 <RightOutlined style={{ fontSize: 9 }} />
                                            </button>
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
