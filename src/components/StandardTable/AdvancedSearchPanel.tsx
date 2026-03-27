import React from 'react';
import { Button, DatePicker, Input, Select, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type {
  AdvancedSearchField,
  StandardTableSearchValues,
} from './types';

const { RangePicker } = DatePicker;

interface AdvancedSearchPanelProps {
  fields: AdvancedSearchField[];
  values: StandardTableSearchValues;
  matchModes: Record<string, 'fuzzy' | 'exact'>;
  onFieldChange: (key: string, value: unknown) => void;
  onToggleMatchMode: (key: string, defaultMatchMode?: 'fuzzy' | 'exact') => void;
  onSearch: () => void;
  onReset: () => void;
  onCollapse: () => void;
}

function AdvancedSearchPanel({
  fields,
  values,
  matchModes,
  onFieldChange,
  onToggleMatchMode,
  onSearch,
  onReset,
  onCollapse,
}: AdvancedSearchPanelProps) {
  return (
    <div className="standard-table-advanced-search">
      <div className="standard-table-advanced-fields">
        {fields.map((field) => {
          const currentMode = matchModes[field.key] || field.defaultMatchMode || 'fuzzy';

          return (
            <div key={field.key} className="standard-table-advanced-field">
              <div>
                {field.label}
                {field.description && (
                  <Tooltip title={field.description}>
                    <QuestionCircleOutlined
                      style={{ color: '#bfbfbf', fontSize: 12, marginLeft: 3, cursor: 'help' }}
                    />
                  </Tooltip>
                )}
              </div>
              {field.type === 'input' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Input
                    value={(values[field.key] as string | undefined) || ''}
                    onChange={(event) => onFieldChange(field.key, event.target.value)}
                    placeholder={field.placeholder || `输入${field.label}`}
                    allowClear
                    onPressEnter={onSearch}
                    style={{ flex: 1 }}
                  />
                  <Tooltip
                    title={
                      currentMode === 'fuzzy'
                        ? '当前：模糊匹配（点击切换为精确匹配）'
                        : '当前：精确匹配（点击切换为模糊匹配）'
                    }
                  >
                    <Button
                      type={currentMode === 'exact' ? 'primary' : 'default'}
                      style={{ minWidth: 32, fontSize: 14, padding: '4px 8px', flexShrink: 0 }}
                      onClick={() => onToggleMatchMode(field.key, field.defaultMatchMode)}
                    >
                      {currentMode === 'fuzzy' ? '≈' : '='}
                    </Button>
                  </Tooltip>
                </div>
              )}
              {field.type === 'select' && (
                <Select
                  value={values[field.key] as string | undefined}
                  onChange={(value) => onFieldChange(field.key, value)}
                  placeholder={field.placeholder || `选择${field.label}`}
                  options={field.options}
                  allowClear
                  style={{ width: '100%' }}
                />
              )}
              {field.type === 'multiSelect' && (
                <Select
                  mode="multiple"
                  value={(values[field.key] as string[] | undefined) || []}
                  onChange={(value) => onFieldChange(field.key, value)}
                  placeholder={field.placeholder || `选择${field.label}`}
                  options={field.options}
                  allowClear
                  maxTagCount="responsive"
                  style={{ width: '100%' }}
                />
              )}
              {field.type === 'dateRange' && (
                <RangePicker
                  value={values[field.key] as Parameters<typeof RangePicker>[0]['value']}
                  onChange={(value) => onFieldChange(field.key, value)}
                  placeholder={['开始时间', '结束时间']}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="standard-table-advanced-actions">
        <Button type="primary" onClick={onSearch}>搜索</Button>
        <Button onClick={onReset}>重置</Button>
        <button
          type="button"
          className="standard-table-advanced-toggle"
          onClick={onCollapse}
        >
          收起高级搜索
        </button>
      </div>
    </div>
  );
}

export default AdvancedSearchPanel;
