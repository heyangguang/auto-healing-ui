import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { createRequestSequence } from '@/utils/requestSequence';
import { getCurrentUserTenants, type CurrentUserTenant } from '@/services/auto-healing/commonTenants';
import {
    CaretDownFilled,
    CheckOutlined,
    LoadingOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { resolveTenantIcon } from './tenantSwitcherIcons';
import {
    loadTenantStorageState,
    resolveCurrentTenantId,
    saveTenantStorageState,
    updateStoredCurrentTenantId,
} from './tenantSwitcherStorage';
import { tenantSwitcherStyles as S } from './tenantSwitcherStyles';

const TenantSwitcher: React.FC = () => {
    const panelId = 'tenant-switcher-panel';

    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
    const [tenants, setTenants] = useState<CurrentUserTenant[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<CurrentUserTenant[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchSequenceRef = useRef(createRequestSequence());
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    /* 点击外部关闭 */
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            const t = e.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(t) &&
                panelRef.current && !panelRef.current.contains(t)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    /* 启动时加载租户列表 */
    useEffect(() => {
        const storedState = loadTenantStorageState();
        setCurrentTenantId(storedState.currentTenantId);

        getCurrentUserTenants()
            .then((tenantList) => {
                setLoadError(null);
                setTenants(tenantList);
                const nextTenantId = resolveCurrentTenantId(tenantList, storedState.currentTenantId);
                setCurrentTenantId(nextTenantId);
                saveTenantStorageState({
                    currentTenantId: nextTenantId,
                    tenants: tenantList,
                });
            })
            .catch(() => {
                setTenants([]);
                setLoadError('租户列表加载失败，请刷新重试');
            });
    }, []);

    useEffect(() => {
        if (open) {
            searchSequenceRef.current.invalidate();
            setSearchValue(''); setSearchResults(null);
            // 计算面板位置
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPanelPos({ top: rect.bottom, left: rect.left });
            }
            setTimeout(() => searchRef.current?.focus(), 80);
        }
    }, [open]);

    /* 后端搜索（即时请求） */
    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);

        if (!value.trim()) {
            searchSequenceRef.current.invalidate();
            setSearchResults(null);
            setSearchError(null);
            setSearching(false);
            return;
        }
        const token = searchSequenceRef.current.next();
        setSearching(true);
        setSearchError(null);
        getCurrentUserTenants({ name: value.trim() })
            .then((tenantList) => {
                if (!searchSequenceRef.current.isCurrent(token)) return;
                setSearchResults(tenantList);
                setSearchError(null);
            })
            .catch(() => {
                if (!searchSequenceRef.current.isCurrent(token)) return;
                setSearchResults([]);
                setSearchError('租户搜索失败，请重试');
            })
            .finally(() => {
                if (searchSequenceRef.current.isCurrent(token)) {
                    setSearching(false);
                }
            });
    }, []);

    /* 切换租户：更新 localStorage → 整页刷新 */
    const handleChange = useCallback((tid: string) => {
        if (tid === currentTenantId) { setOpen(false); return; }
        updateStoredCurrentTenantId(tid);

        setCurrentTenantId(tid);
        setOpen(false);

        // 原地刷新：保持当前页面，强制所有组件重新挂载、数据重新加载
        window.location.reload();
    }, [currentTenantId]);

    const cur = tenants.find(t => t.id === currentTenantId);
    const curIcon = resolveTenantIcon(cur?.icon);
    const showSearch = tenants.length >= 5;
    const displayList = searchResults !== null ? searchResults : tenants;
    const emptyMessage = searchError || loadError || (searching ? '搜索中...' : '无匹配租户');

    return (
        <div ref={containerRef} style={S.container}>
            {/* ── 触发按钮 ── */}
            <button
                type="button"
                ref={triggerRef}
                onClick={() => setOpen(v => !v)}
                style={S.trigger}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-label={cur?.name ? `当前租户 ${cur.name}，点击切换` : '选择租户'}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
                <span style={{ fontSize: 16 }}>{curIcon}</span>
                <span style={S.triggerName}>{cur?.name || '选择租户'}</span>
                <CaretDownFilled style={S.triggerCaret} />
            </button>

            {/* ── 下拉面板（Portal 到 body，脱离 navBar 层叠上下文） ── */}
            {open && ReactDOM.createPortal(
                <div ref={panelRef} style={{ ...S.panel, top: panelPos.top, left: panelPos.left }}>
                    {showSearch && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            height: 40, padding: '0 8px',
                            background: '#fafafa', borderBottom: '1px solid #f0f0f0',
                        }}>
                            {searching
                                ? <LoadingOutlined style={{ color: '#bfbfbf', fontSize: 12, flexShrink: 0 }} spin />
                                : <SearchOutlined style={{ color: '#bfbfbf', fontSize: 12, flexShrink: 0 }} />
                            }
                            <input
                                ref={searchRef}
                                placeholder="搜索租户..."
                                value={searchValue}
                                onChange={e => handleSearchChange(e.target.value)}
                                aria-label="搜索租户"
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    background: 'transparent', fontSize: 12, height: 28,
                                    padding: 0, color: '#262626', width: '100%',
                                }}
                            />
                        </div>
                    )}
                    <div id={panelId} role="listbox" aria-label="租户列表" style={S.list}>
                        {displayList.map(tenant => {
                            const active = tenant.id === currentTenantId;
                            const icon = resolveTenantIcon(tenant.icon);
                            return (
                                <button
                                    type="button"
                                    key={tenant.id}
                                    onClick={() => handleChange(tenant.id)}
                                    role="option"
                                    aria-selected={active}
                                    style={{
                                        ...S.item(active),
                                        width: '100%',
                                        textAlign: 'left',
                                        border: 'none',
                                        background: active ? '#eaf2ff' : 'transparent',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = active ? '#eaf2ff' : '#f5f5f5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = active ? '#eaf2ff' : 'transparent'; }}
                                >
                                    <span style={S.itemIcon(active)}>{icon}</span>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tenant.name}
                                    </span>
                                    {active && <CheckOutlined style={S.check} />}
                                </button>
                            );
                        })}
                        {displayList.length === 0 && (
                            <output aria-live="polite" style={S.empty}>{emptyMessage}</output>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TenantSwitcher;
