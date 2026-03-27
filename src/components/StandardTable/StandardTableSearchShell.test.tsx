import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StandardTableSearchShell from './StandardTableSearchShell';

describe('StandardTableSearchShell', () => {
  it('renders search controls and forwards toolbar actions', () => {
    const onSearchFieldChange = jest.fn();
    const onSearchValueChange = jest.fn();
    const onSearch = jest.fn();
    const onToggleAdvanced = jest.fn();
    const onResetColumnWidths = jest.fn();
    const onOpenColumnSettings = jest.fn();
    const onRefresh = jest.fn();
    const onPrimaryAction = jest.fn();
    const onRemoveFilter = jest.fn();
    const onClearFilters = jest.fn();
    const onAdvancedFieldChange = jest.fn();
    const onAdvancedToggleMatchMode = jest.fn();
    const onResetAdvanced = jest.fn();
    const onCollapseAdvanced = jest.fn();

    render(
      <StandardTableSearchShell
        searchField="name"
        searchValue="ops"
        onSearchFieldChange={onSearchFieldChange}
        onSearchValueChange={onSearchValueChange}
        onSearch={onSearch}
        searchFieldOptions={[{ label: '名称', value: 'name' }]}
        searchFieldOptionRender={(option) => option.label}
        isEnumField={false}
        searchExtra={<span>extra</span>}
        showAdvancedToggle
        showAdvanced={false}
        onToggleAdvanced={onToggleAdvanced}
        extraToolbarActions={<button type="button">custom</button>}
        showColumnWidthReset
        onResetColumnWidths={onResetColumnWidths}
        showColumnSettingsButton
        onOpenColumnSettings={onOpenColumnSettings}
        onRefresh={onRefresh}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel="新增"
        filters={[{ field: 'name', label: '名称', value: 'ops' }]}
        onRemoveFilter={onRemoveFilter}
        onClearFilters={onClearFilters}
        advancedFields={[]}
        advancedValues={{}}
        advancedMatchModes={{}}
        onAdvancedFieldChange={onAdvancedFieldChange}
        onAdvancedToggleMatchMode={onAdvancedToggleMatchMode}
        onResetAdvanced={onResetAdvanced}
        onCollapseAdvanced={onCollapseAdvanced}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('输入关键字进行搜索'), {
      target: { value: 'deploy' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^搜\s*索$/ }));
    fireEvent.click(screen.getByRole('button', { name: '高级搜索' }));
    fireEvent.click(screen.getByRole('button', { name: '重置列宽' }));
    fireEvent.click(screen.getByRole('button', { name: '显示字段及排序' }));
    fireEvent.click(screen.getByRole('button', { name: '刷新' }));
    fireEvent.click(screen.getByRole('button', { name: /plus\s*新增/i }));
    fireEvent.click(screen.getByRole('button', { name: '清除筛选条件' }));

    expect(onSearchValueChange).toHaveBeenCalledWith('deploy');
    expect(onSearch).toHaveBeenCalled();
    expect(onToggleAdvanced).toHaveBeenCalled();
    expect(onResetColumnWidths).toHaveBeenCalled();
    expect(onOpenColumnSettings).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
    expect(onPrimaryAction).toHaveBeenCalled();
    expect(onClearFilters).toHaveBeenCalled();
  });
});
