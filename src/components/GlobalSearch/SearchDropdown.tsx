import React, { startTransition } from 'react';
import { AppstoreOutlined, EnterOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { history } from '@umijs/max';
import { canAccessPath } from '@/utils/pathAccess';
import type { SearchCategoryResult, SearchResultItem } from '@/services/auto-healing/search';
import { CATEGORY_LIST, CATEGORY_META, GLOBAL_SEARCH_RESULTS_ID } from './constants';
import { getStatusInfo, hl } from './helpers';

type FlatSearchItem = { it: SearchResultItem; cat: string };

interface SearchDropdownProps {
    open: boolean;
    loading: boolean;
    results: SearchCategoryResult[];
    total: number;
    ai: number;
    kw: string;
    access: Parameters<typeof canAccessPath>[1];
    styles: Record<string, string>;
    cx: (...args: Array<string | false | null | undefined>) => string;
    onGo: (item: SearchResultItem, category: string) => void;
    onHoverItem: (index: number) => void;
    setOpen: (value: boolean) => void;
    setKw: (value: string) => void;
}

export function flattenResults(results: SearchCategoryResult[]): FlatSearchItem[] {
    const items: FlatSearchItem[] = [];
    results.forEach((category) => {
        category.items.forEach((item) => {
            items.push({ it: item, cat: category.category });
        });
    });
    return items;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
    open,
    loading,
    results,
    total,
    ai,
    kw,
    access,
    styles,
    cx,
    onGo,
    onHoverItem,
    setOpen,
    setKw,
}) => {
    if (!open) return null;
    let gi = 0;

    return (
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
                                {cat.items.map((it) => {
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
                                            onClick={() => onGo(it, cat.category)}
                                            onMouseEnter={() => onHoverItem(idx)}
                                        >
                                            <div className={styles.itemIcon} style={{ background: `${m.color}14`, color: m.color }}>
                                                {m.icon}
                                            </div>
                                            <span className={styles.itemTitle} title={it.title}>
                                                {hl(it.title, kw)}
                                            </span>
                                            {it.description && (
                                                <span className={styles.itemDesc} title={it.description}>
                                                    {hl(it.description, kw)}
                                                </span>
                                            )}
                                            {st && <span className={styles.statusDot} style={{ background: st.color }} title={st.label} />}
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
                                            setOpen(false);
                                            setKw('');
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
                    <div className={styles.footer}>
                        <span>共 {total} 条结果</span>
                        <div className={styles.footerKeys}>
                            <span>
                                <span className={styles.kbd}>↑</span> <span className={styles.kbd}>↓</span> 导航
                            </span>
                            <span>
                                <span className={styles.kbd}>
                                    <EnterOutlined />
                                </span>{' '}
                                选择
                            </span>
                            <span>
                                <span className={styles.kbd}>ESC</span> 关闭
                            </span>
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles.emptyBox}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>未找到 "{kw}" 相关结果</span>}
                    />
                </div>
            )}
        </div>
    );
};

export default SearchDropdown;
