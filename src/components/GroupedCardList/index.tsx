import React, { useState, useMemo, useCallback, ReactNode } from 'react';
import { Input, Tag, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import './index.css';

/* ========== 类型定义 ========== */

/** 分组元信息 */
export interface GroupMeta {
    label: string;
    color: string;
}

/** GroupedCardList 配置 */
export interface GroupedCardListProps<T> {
    /** 原始数据 */
    data: T[];
    /** 是否加载中 */
    loading?: boolean;
    /** 分组字段名或分组函数 */
    groupBy: keyof T | ((item: T) => string);
    /** 分组元信息映射：key → { label, color } */
    groupMeta?: Record<string, GroupMeta>;
    /** 搜索过滤函数 */
    searchFilter?: (item: T, keyword: string) => boolean;
    /** 搜索框 placeholder */
    searchPlaceholder?: string;
    /** 渲染单项内容 */
    renderItem: (item: T) => ReactNode;
    /** 单项的唯一 key 提取 */
    itemKey: keyof T | ((item: T) => string);
    /** 空状态文案 */
    emptyText?: string;
    /** 搜索无结果文案 */
    emptySearchText?: string;
    /** 统计文案自定义 */
    statsRender?: (filteredCount: number, groupCount: number) => ReactNode;
    /** 刷新回调 */
    onRefresh?: () => void;
}

/* ========== 组件 ========== */

function GroupedCardList<T extends Record<string, any>>({
    data,
    loading = false,
    groupBy,
    groupMeta,
    searchFilter,
    searchPlaceholder = '搜索...',
    renderItem,
    itemKey,
    emptyText = '暂无数据',
    emptySearchText = '未找到匹配的结果',
    statsRender,
    onRefresh,
}: GroupedCardListProps<T>) {
    const [searchValue, setSearchValue] = useState('');

    /* ---- 获取分组 key ---- */
    const getGroupKey = useCallback((item: T): string => {
        if (typeof groupBy === 'function') return groupBy(item);
        return String(item[groupBy] || 'other');
    }, [groupBy]);

    /* ---- 获取 item key ---- */
    const getItemKey = useCallback((item: T): string => {
        if (typeof itemKey === 'function') return itemKey(item);
        return String(item[itemKey]);
    }, [itemKey]);

    /* ---- 按分组 + 搜索过滤 ---- */
    const { grouped, filteredCount, groupCount } = useMemo(() => {
        const kw = searchValue.trim().toLowerCase();
        const filtered = kw && searchFilter
            ? data.filter(item => searchFilter(item, kw))
            : data;

        const map: Record<string, T[]> = {};
        filtered.forEach(item => {
            const key = getGroupKey(item);
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });

        const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
        return {
            grouped: sorted,
            filteredCount: filtered.length,
            groupCount: sorted.length,
        };
    }, [data, searchValue, searchFilter, getGroupKey]);

    /* ---- 默认统计文案 ---- */
    const defaultStats = (
        <span className="grouped-card-stats">
            共 <b>{filteredCount}</b> 项，<b>{groupCount}</b> 个分组
        </span>
    );

    return (
        <>
            {/* 工具栏 */}
            <div className="grouped-card-toolbar">
                <div className="grouped-card-toolbar-left">
                    <SearchOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        allowClear
                        className="grouped-card-search-input"
                    />
                </div>
                <div className="grouped-card-toolbar-right">
                    {statsRender
                        ? statsRender(filteredCount, groupCount)
                        : defaultStats
                    }
                    {onRefresh && (
                        <>
                            <div className="grouped-card-toolbar-divider" />
                            <a onClick={onRefresh} className="grouped-card-refresh">
                                <ReloadOutlined />
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* 分组内容 */}
            <Spin spinning={loading}>
                <div className="grouped-card-content">
                    {grouped.length > 0 ? (
                        grouped.map(([groupKey, items]) => {
                            const meta = groupMeta?.[groupKey] || { label: groupKey, color: '#595959' };
                            return (
                                <div key={groupKey} className="grouped-card-block">
                                    <div className="grouped-card-block-header">
                                        <span
                                            className="grouped-card-dot"
                                            style={{ background: meta.color }}
                                        />
                                        <span className="grouped-card-group-name">{meta.label}</span>
                                        <Tag className="grouped-card-count">{items.length}</Tag>
                                    </div>
                                    <div className="grouped-card-items">
                                        {items.map(item => (
                                            <div key={getItemKey(item)} className="grouped-card-item">
                                                {renderItem(item)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="grouped-card-empty">
                            {searchValue ? emptySearchText : emptyText}
                        </div>
                    )}
                </div>
            </Spin>
        </>
    );
}

export default GroupedCardList;
