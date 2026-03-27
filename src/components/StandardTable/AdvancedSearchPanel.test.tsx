import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdvancedSearchPanel from './AdvancedSearchPanel';

describe('AdvancedSearchPanel', () => {
  it('renders advanced fields and forwards key actions', () => {
    const onFieldChange = jest.fn();
    const onToggleMatchMode = jest.fn();
    const onSearch = jest.fn();
    const onReset = jest.fn();
    const onCollapse = jest.fn();

    render(
      <AdvancedSearchPanel
        fields={[
          { key: 'name', label: '名称', type: 'input', defaultMatchMode: 'fuzzy' },
        ]}
        values={{}}
        matchModes={{}}
        onFieldChange={onFieldChange}
        onToggleMatchMode={onToggleMatchMode}
        onSearch={onSearch}
        onReset={onReset}
        onCollapse={onCollapse}
      />,
    );

    expect(screen.getByPlaceholderText('输入名称')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('输入名称'), { target: { value: 'deploy' } });
    fireEvent.click(screen.getByRole('button', { name: '≈' }));
    fireEvent.click(screen.getByRole('button', { name: /^搜\s*索$/ }));
    fireEvent.click(screen.getByRole('button', { name: /重\s*置/ }));
    fireEvent.click(screen.getByRole('button', { name: '收起高级搜索' }));

    expect(onFieldChange).toHaveBeenCalledWith('name', 'deploy');
    expect(onToggleMatchMode).toHaveBeenCalledWith('name', 'fuzzy');
    expect(onSearch).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
    expect(onCollapse).toHaveBeenCalled();
  });
});
