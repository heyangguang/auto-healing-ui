import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlatformMessagesPage from './index';
import {
  createSiteMessage,
  getSiteMessageCategories,
  getSiteMessageSettings,
  updateSiteMessageSettings,
} from '@/services/auto-healing/platform/messages';
import { fetchAllPages } from '@/utils/fetchAllPages';

const mockFormInstance = {
  resetFields: jest.fn(),
  setFieldValue: jest.fn(),
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canSendPlatformMessage: true,
    canViewSiteMessageSettings: true,
    canManageSiteMessageSettings: true,
  }),
}));

jest.mock('@/services/auto-healing/platform/messages', () => ({
  getSiteMessageCategories: jest.fn(),
  createSiteMessage: jest.fn(),
  getSiteMessageSettings: jest.fn(),
  updateSiteMessageSettings: jest.fn(),
}));

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: { children?: unknown }) {
    return ReactLocal.createElement('div', null, props.children);
  };
});

jest.mock('antd', () => {
  const ReactLocal = require('react');
  return {
    Form: Object.assign(
      function MockForm(props: { children?: unknown }) {
        return ReactLocal.createElement('form', null, props.children);
      },
      {
        Item: function MockFormItem(props: { children?: unknown; label?: string }) {
          return ReactLocal.createElement(
            'div',
            null,
            props.label ? ReactLocal.createElement('div', null, props.label) : null,
            props.children,
          );
        },
        useForm: () => [mockFormInstance],
      },
    ),
    Input: Object.assign(
      function MockInput(props: Record<string, unknown>) {
        return ReactLocal.createElement('input', props);
      },
      {
        TextArea: function MockTextArea(props: Record<string, unknown>) {
          return ReactLocal.createElement('textarea', props);
        },
      },
    ),
    Button: function MockButton(props: { children?: unknown; onClick?: () => void }) {
      return ReactLocal.createElement('button', { type: 'button', onClick: props.onClick }, props.children);
    },
    Alert: function MockAlert(props: { message?: string }) {
      return ReactLocal.createElement('div', null, props.message);
    },
    Select: function MockSelect(props: Record<string, unknown>) {
      const { children, ...rest } = props;
      const domProps = {
        value: rest.value,
        onChange: rest.onChange,
        multiple: rest.mode === 'multiple',
        'aria-label': rest.placeholder,
      };
      return ReactLocal.createElement('select', domProps, children);
    },
    Radio: Object.assign(
      function MockRadio(props: { children?: unknown; value?: string }) {
        return ReactLocal.createElement(
          'label',
          null,
          ReactLocal.createElement('input', { type: 'radio', value: props.value, 'aria-label': props.children }),
          props.children,
        );
      },
      {
        Group: function MockRadioGroup(props: { children?: unknown; onChange?: (event: { target: { value: string } }) => void }) {
          return ReactLocal.createElement(
            'div',
            {
              onChange: (event: { target: { value: string } }) => props.onChange?.(event),
            },
            props.children,
          );
        },
      },
    ),
    Space: function MockSpace(props: { children?: unknown }) {
      return ReactLocal.createElement('div', null, props.children);
    },
    Typography: {
      Text: function MockText(props: { children?: unknown }) {
        return ReactLocal.createElement('span', null, props.children);
      },
    },
    message: {
      success: jest.fn(),
    },
  };
});

jest.mock('@/components/RichTextEditor', () => {
  const ReactLocal = require('react');

  return function MockEditor(props: { value?: string; onChange?: (value: string) => void; placeholder?: string }) {
    return ReactLocal.createElement('textarea', {
      'aria-label': '消息内容',
      placeholder: props.placeholder,
      value: props.value || '',
      onChange: (event: { target: { value: string } }) => props.onChange?.(event.target.value),
    });
  };
});

describe('PlatformMessagesPage', () => {
  beforeEach(() => {
    (getSiteMessageCategories as jest.Mock).mockResolvedValue([
      { value: 'notice', label: '通知' },
    ]);
    (getSiteMessageSettings as jest.Mock).mockResolvedValue({
      retention_days: 90,
      updated_at: '2026-03-27T10:00:00Z',
    });
    (updateSiteMessageSettings as jest.Mock).mockResolvedValue({
      retention_days: 180,
      updated_at: '2026-03-27T11:00:00Z',
    });
    (fetchAllPages as jest.Mock).mockResolvedValue([
      { id: 'tenant-1', name: '租户 A' },
    ]);
    (createSiteMessage as jest.Mock).mockResolvedValue({ id: 'msg-1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resets sendTarget back to all when reset is clicked', async () => {
    render(React.createElement(PlatformMessagesPage));

    fireEvent.click(await screen.findByLabelText('指定租户'));
    expect(screen.getByText('选择租户')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '重置' }));

    await waitFor(() => {
      expect(screen.queryByText('选择租户')).toBeNull();
    });
    expect(mockFormInstance.resetFields).toHaveBeenCalled();
  });

  it('loads and updates site-message retention settings', async () => {
    render(React.createElement(PlatformMessagesPage));

    expect(await screen.findByDisplayValue('90')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('站内信保留天数'), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存策略' }));

    await waitFor(() => {
      expect(updateSiteMessageSettings).toHaveBeenCalledWith({ retention_days: 180 });
    });
  });
});
