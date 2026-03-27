import React from 'react';
import { Tag } from 'antd';

export interface FilterTagItem {
    field: string;
    label: string;
    value: string;
    displayValue?: string;
}

interface FilterTagsProps {
    filters: FilterTagItem[];
    onRemove: (field: string) => void;
    onClear: () => void;
}

const FilterTags: React.FC<FilterTagsProps> = ({ filters, onRemove, onClear }) => {
    if (filters.length === 0) {
        return null;
    }

    return (
        <div className="standard-table-filter-tags">
            {filters.map((filter) => (
                <Tag
                    key={filter.field}
                    closable
                    onClose={() => onRemove(filter.field)}
                    className="standard-table-filter-tag"
                >
                    {filter.label} {filter.displayValue || filter.value}
                </Tag>
            ))}
            <button
                type="button"
                className="standard-table-clear-filters"
                onClick={onClear}
            >
                清除筛选条件
            </button>
        </div>
    );
};

export default FilterTags;
