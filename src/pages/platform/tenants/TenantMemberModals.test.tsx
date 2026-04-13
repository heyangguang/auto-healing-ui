import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TenantRoleSelectOptions } from './TenantMemberModals';

const mockSelectSpy = jest.fn();

jest.mock('antd', () => {
  const ReactLib = require('react');

  const Select = (props: Record<string, unknown>) => {
    mockSelectSpy(props);
    const nextOnChange = props.onChange as any;
    return ReactLib.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'tenant-role-select',
        onClick: () => nextOnChange?.('role-2'),
      },
      String(props.value ?? ''),
    );
  };
  Select.Option = (props: { children?: unknown; value?: string }) =>
    ReactLib.createElement('option', { value: props.value }, props.children);

  return {
    Button: (props: { children?: unknown }) => ReactLib.createElement('button', null, props.children),
    Form: Object.assign(
      (props: { children?: unknown }) => ReactLib.createElement('form', null, props.children),
      {
        Item: (props: { children?: unknown }) => ReactLib.createElement('div', null, props.children),
      },
    ),
    Input: (props: Record<string, unknown>) => ReactLib.createElement('input', props),
    Modal: (props: { children?: unknown }) => ReactLib.createElement('div', null, props.children),
    Select,
    Space: (props: { children?: unknown }) => ReactLib.createElement('div', null, props.children),
    Switch: (props: Record<string, unknown>) => ReactLib.createElement('input', { type: 'checkbox', ...props }),
  };
});

jest.mock('@ant-design/icons', () => new Proxy({}, {
  get: () => () => null,
}));

describe('TenantRoleSelectOptions', () => {
  beforeEach(() => {
    mockSelectSpy.mockClear();
  });

  it('forwards form-controlled select props to the underlying Select', () => {
    const onChange = jest.fn();

    render(React.createElement(TenantRoleSelectOptions, {
      tenantRoles: [
        { id: 'role-1', display_name: '管理员', description: 'desc' } as AutoHealing.Role,
      ],
      tenantRolesLoadFailed: false,
      value: 'role-1',
      onChange,
    }));

    expect(screen.getByTestId('tenant-role-select').textContent).toBe('role-1');
    fireEvent.click(screen.getByTestId('tenant-role-select'));

    expect(onChange).toHaveBeenCalledWith('role-2');
    expect(mockSelectSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 'role-1' }));
  });
});
