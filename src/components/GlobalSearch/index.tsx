import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { history, useAccess } from '@umijs/max';
import { globalSearch } from '@/services/auto-healing/search';
import type { SearchCategoryResult, SearchResultItem } from '@/services/auto-healing/search';
import { canAccessPath } from '@/utils/pathAccess';
import { createRequestSequence } from '@/utils/requestSequence';
import { CATEGORY_LIST, DEBOUNCE, GLOBAL_SEARCH_RESULTS_ID } from './constants';
import SearchDropdown, { flattenResults } from './SearchDropdown';
import { useStyles } from './styles';
import './search-glow.css';

const GlobalSearch: React.FC<{ compact?: boolean }> = ({ compact }) => {
    const { styles, cx } = useStyles();
    const access = useAccess();
    const [kw, setKw] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchCategoryResult[]>([]);
    const [total, setTotal] = useState(0);
    const [ai, setAi] = useState(-1);
    const boxRef = useRef<HTMLDivElement>(null);
    const inRef = useRef<React.ElementRef<typeof Input>>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const searchSequenceRef = useRef(createRequestSequence());

    const flat = React.useMemo(() => {
        return flattenResults(results);
    }, [results]);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            searchSequenceRef.current.invalidate();
            setResults([]);
            setTotal(0);
            setOpen(false);
            return;
        }
        const token = searchSequenceRef.current.next();
        setLoading(true);
        setOpen(true);
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
        const v = e.target.value;
        setKw(v);
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
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAi((p) => (p + 1) % flat.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAi((p) => (p - 1 + flat.length) % flat.length);
            return;
        }
        if (e.key === 'Enter' && ai >= 0) {
            e.preventDefault();
            go(flat[ai].it, flat[ai].cat);
            return;
        }
        if (e.key === 'Escape') {
            setOpen(false);
            inRef.current?.blur();
        }
    }, [open, flat, ai, go]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inRef.current?.focus();
            }
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

    return (
        <div className={styles.searchWrapper} ref={boxRef}>
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
            <SearchDropdown
                open={open}
                loading={loading}
                results={results}
                total={total}
                ai={ai}
                kw={kw}
                access={access}
                styles={styles}
                cx={cx}
                onGo={go}
                onHoverItem={setAi}
                setOpen={setOpen}
                setKw={setKw}
            />
        </div>
    );
};

export default React.memo(GlobalSearch);
