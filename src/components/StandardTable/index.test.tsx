import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StandardTable from './index';

describe('StandardTable', () => {
  it('renders children mode and forwards search actions through onSearch', () => {
    const onSearch = jest.fn();

    render(
      <StandardTable
        title="示例表格"
        description="用于 smoke test"
        searchFields={[{ key: 'name', label: '名称' }]}
        onSearch={onSearch}
      >
        <div>custom children body</div>
      </StandardTable>,
    );

    expect(screen.getByText('示例表格')).toBeTruthy();
    expect(screen.getByText('custom children body')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('输入关键字进行搜索'), {
      target: { value: 'pangolin' },
    });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));

    expect(onSearch).toHaveBeenLastCalledWith({
      searchField: 'name',
      searchValue: 'pangolin',
      advancedSearch: { name: 'pangolin' },
      filters: [{ field: 'name', value: 'pangolin' }],
    });
  });

  it('forwards exact-match advanced search through onSearch in children mode', () => {
    const onSearch = jest.fn();

    render(
      <StandardTable
        title="高级搜索表格"
        description="用于 advanced search test"
        searchFields={[{ key: 'name', label: '名称' }]}
        advancedSearchFields={[{ key: 'name', label: '名称', type: 'input', defaultMatchMode: 'fuzzy' }]}
        onSearch={onSearch}
      >
        <div>advanced children body</div>
      </StandardTable>,
    );

    fireEvent.click(screen.getByText('高级搜索'));
    fireEvent.change(screen.getByPlaceholderText('输入名称'), {
      target: { value: 'deploy' },
    });
    fireEvent.click(screen.getByRole('button', { name: '≈' }));
    fireEvent.click(screen.getAllByRole('button', { name: /^搜\s*索$/ })[1]);

    expect(onSearch).toHaveBeenLastCalledWith({
      searchField: undefined,
      searchValue: undefined,
      advancedSearch: { name__exact: 'deploy' },
      filters: [],
    });
  });

  it('renders an explicit schema error when dynamic search schema loading fails', async () => {
    const searchSchemaRequest = jest.fn().mockRejectedValue(new Error('schema failed'));

    render(
      <StandardTable
        title="Schema 表格"
        description="用于 schema error test"
        searchFields={[{ key: 'name', label: '名称' }]}
        searchSchemaRequest={searchSchemaRequest}
      >
        <div>schema error body</div>
      </StandardTable>,
    );

    await waitFor(() => {
      expect(screen.getByText('高级搜索条件加载失败')).toBeTruthy();
      expect(screen.getByText('后端搜索 Schema 加载失败: schema failed')).toBeTruthy();
    });
  });
});
