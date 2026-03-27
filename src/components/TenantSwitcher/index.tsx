import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

import { request } from '@umijs/max';
import { createRequestSequence } from '@/utils/requestSequence';
import {
    BankOutlined, CheckOutlined, SearchOutlined, CaretDownFilled,
    ShopOutlined, TeamOutlined, CloudOutlined, ApartmentOutlined,
    ToolOutlined, GlobalOutlined, RocketOutlined, HomeOutlined,
    BulbOutlined, SafetyOutlined, ThunderboltOutlined, DatabaseOutlined,
    ApiOutlined, DeploymentUnitOutlined, ClusterOutlined, DashboardOutlined,
    ExperimentOutlined, MonitorOutlined, CodeOutlined, BuildOutlined,
    FundOutlined, TrophyOutlined, StarOutlined, ProductOutlined,
    AlertOutlined, AuditOutlined, FireOutlined, CustomerServiceOutlined,
    ControlOutlined, SendOutlined, FolderOpenOutlined, LoadingOutlined,
} from '@ant-design/icons';

interface TenantBrief {
    id: string;
    name: string;
    code: string;
    icon?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
    bank: <BankOutlined />, shop: <ShopOutlined />, team: <TeamOutlined />,
    cloud: <CloudOutlined />, apartment: <ApartmentOutlined />, tool: <ToolOutlined />,
    global: <GlobalOutlined />, rocket: <RocketOutlined />, home: <HomeOutlined />,
    bulb: <BulbOutlined />, safety: <SafetyOutlined />, thunder: <ThunderboltOutlined />,
    database: <DatabaseOutlined />, api: <ApiOutlined />, deployment: <DeploymentUnitOutlined />,
    cluster: <ClusterOutlined />, dashboard: <DashboardOutlined />, experiment: <ExperimentOutlined />,
    monitor: <MonitorOutlined />, code: <CodeOutlined />, build: <BuildOutlined />,
    fund: <FundOutlined />, trophy: <TrophyOutlined />, star: <StarOutlined />,
    product: <ProductOutlined />, alert: <AlertOutlined />, audit: <AuditOutlined />,
    fire: <FireOutlined />, service: <CustomerServiceOutlined />, control: <ControlOutlined />,
    send: <SendOutlined />, folder: <FolderOpenOutlined />,
};

/* ── 内联样式常量 ── */
const S = {
    container: { position: 'relative' as const },
    trigger: {
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 14px', height: 58,
        borderLeft: '1px solid rgba(255,255,255,0.12)',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        transition: 'background 0.2s',
        background: 'transparent',
        color: 'rgba(255,255,255,0.85)', userSelect: 'none' as const,
        font: 'inherit',
    },
    triggerName: {
        fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
        transform: 'translateY(1px)',
    },
    triggerCaret: { fontSize: 8, color: 'rgba(255,255,255,0.4)', transform: 'translateY(1px)' },
    panel: {
        position: 'fixed' as const,
        width: 180, background: '#fff',
        borderRadius: '0 0 6px 6px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12)',
        zIndex: 2000, overflow: 'hidden' as const,
    },
    list: { maxHeight: 220, overflowY: 'auto' as const, padding: '2px 0' },
    item: (active: boolean) => ({
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 10px', cursor: 'pointer',
        transition: 'background 0.12s',
        color: active ? '#0f62fe' : '#262626',
        fontWeight: active ? 500 : 400 as number,
        fontSize: 13, lineHeight: '20px',
    }),
    itemIcon: (active: boolean) => ({
        color: active ? '#0f62fe' : '#8c8c8c', fontSize: 13, flexShrink: 0,
    }),
    check: { color: '#0f62fe', fontSize: 10, marginLeft: 'auto', flexShrink: 0 },
    empty: { padding: '12px 10px', color: '#bfbfbf', textAlign: 'center' as const, fontSize: 12 },
};

const TenantSwitcher: React.FC = () => {
    const panelId = 'tenant-switcher-panel';

    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
    const [tenants, setTenants] = useState<TenantBrief[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<TenantBrief[] | null>(null);
    const [searching, setSearching] = useState(false);
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
        try {
            const raw = localStorage.getItem('tenant-storage');
            if (raw) setCurrentTenantId(JSON.parse(raw).currentTenantId || null);
        } catch { /* ignore */ }

        request('/api/v1/common/user/tenants')
            .then((res: any) => {
                if (res?.data && Array.isArray(res.data)) {
                    setTenants(res.data);
                    try {
                        const raw = localStorage.getItem('tenant-storage');
                        const stored = raw ? JSON.parse(raw) : {};
                        const currentTenantId = stored.currentTenantId && res.data.some((item: TenantBrief) => item.id === stored.currentTenantId)
                            ? stored.currentTenantId
                            : (res.data[0]?.id || null);
                        setCurrentTenantId(currentTenantId);
                        localStorage.setItem('tenant-storage', JSON.stringify({
                            currentTenantId,
                            tenants: res.data,
                        }));
                    } catch { /* ignore */ }
                }
            })
            .catch(() => {
                try {
                    const raw = localStorage.getItem('tenant-storage');
                    if (raw) setTenants(JSON.parse(raw).tenants || []);
                } catch { /* ignore */ }
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
            setSearching(false);
            return;
        }
        const token = searchSequenceRef.current.next();
        setSearching(true);
        request('/api/v1/common/user/tenants', { params: { name: value.trim() } })
            .then((res: any) => {
                if (!searchSequenceRef.current.isCurrent(token)) return;
                if (res?.data && Array.isArray(res.data)) setSearchResults(res.data);
            })
            .catch(() => { /* ignore */ })
            .finally(() => {
                if (searchSequenceRef.current.isCurrent(token)) {
                    setSearching(false);
                }
            });
    }, []);

    /* 切换租户：更新 localStorage → 整页刷新 */
    const handleChange = useCallback((tid: string) => {
        if (tid === currentTenantId) { setOpen(false); return; }
        try {
            const raw = localStorage.getItem('tenant-storage');
            if (raw) {
                const s = JSON.parse(raw);
                s.currentTenantId = tid;
                localStorage.setItem('tenant-storage', JSON.stringify(s));
            }
        } catch { /* ignore */ }

        setCurrentTenantId(tid);
        setOpen(false);

        // 原地刷新：保持当前页面，强制所有组件重新挂载、数据重新加载
        window.location.reload();
    }, [currentTenantId]);

    const cur = tenants.find(t => t.id === currentTenantId);
    const curIcon = (cur?.icon && ICON_MAP[cur.icon]) ?? <BankOutlined />;
    const showSearch = tenants.length >= 5;
    const displayList = searchResults !== null ? searchResults : tenants;

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
                            const icon = (tenant.icon && ICON_MAP[tenant.icon]) ?? <BankOutlined />;
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
                            <div role="status" aria-live="polite" style={S.empty}>{searching ? '搜索中...' : '无匹配租户'}</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TenantSwitcher;
