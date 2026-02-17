/**
 * SortToolbar — 通用排序工具栏组件
 *
 * 用于 StandardTable 的 extraToolbarActions，提供统一的排序字段选择 + 升降序切换。
 *
 * Usage:
 *   <SortToolbar
 *     sortBy={sortBy}
 *     sortOrder={sortOrder}
 *     onSortByChange={setSortBy}
 *     onSortOrderChange={setSortOrder}
 *     options={[
 *       { value: 'created_at', label: '创建时间' },
 *       { value: 'name', label: '名称' },
 *     ]}
 *   />
 */
import React from 'react';
import { Select, Button } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import './index.css';

export interface SortOption {
    value: string;
    label: string;
}

export interface SortToolbarProps {
    /** 当前排序字段 */
    sortBy: string;
    /** 当前排序方向 */
    sortOrder: 'asc' | 'desc';
    /** 排序字段变更 */
    onSortByChange: (value: string) => void;
    /** 排序方向变更 */
    onSortOrderChange: (value: 'asc' | 'desc') => void;
    /** 可选排序字段 */
    options: SortOption[];
    /** Select 宽度（默认 110） */
    width?: number;
}

const SortToolbar: React.FC<SortToolbarProps> = ({
    sortBy,
    sortOrder,
    onSortByChange,
    onSortOrderChange,
    options,
    width = 110,
}) => (
    <div className="sort-toolbar">
        <Select
            size="small"
            value={sortBy}
            onChange={onSortByChange}
            options={options}
            style={{ width }}
            variant="borderless"
        />
        <Button
            type="text"
            size="small"
            icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        />
    </div>
);

export default SortToolbar;
