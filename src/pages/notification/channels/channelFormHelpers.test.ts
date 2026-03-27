import type { FormInstance } from 'antd';
import {
  applyChannelToForm,
  assertSafeChannelConfigUpdate,
  buildChannelPayload,
  hasTouchedChannelConfigFields,
} from './channelFormHelpers';

type MockForm = Pick<FormInstance, 'isFieldTouched' | 'setFieldsValue' | 'setFieldValue'>;

describe('channel form helpers', () => {
  it('does not inject default use_tls when channel config is absent', () => {
    const setFieldsValue = jest.fn();
    const setFieldValue = jest.fn();
    const form: MockForm = {
      isFieldTouched: jest.fn(),
      setFieldsValue,
      setFieldValue,
    };

    applyChannelToForm(form as FormInstance, {
      id: 'channel-1',
      name: 'mail',
      type: 'email',
      recipients: [],
      is_active: true,
      is_default: false,
      created_at: '',
      updated_at: '',
    });

    expect(setFieldsValue).toHaveBeenCalledWith(expect.objectContaining({
      use_tls: undefined,
    }));
    expect(setFieldValue).toHaveBeenCalledTimes(3);
  });

  it('tracks touched config fields by channel type', () => {
    const touched = new Set(['smtp_host', 'use_tls']);
    const form: MockForm = {
      isFieldTouched: jest.fn((field: string) => touched.has(field)),
      setFieldsValue: jest.fn(),
      setFieldValue: jest.fn(),
    };

    expect(hasTouchedChannelConfigFields(form as FormInstance, 'email', 'headers')).toBe(true);
    expect(hasTouchedChannelConfigFields(form as FormInstance, 'dingtalk', 'headers')).toBe(false);
  });

  it('does not emit email use_tls config in edit payload when not provided', () => {
    expect(buildChannelPayload({
      isEdit: true,
      originalConfig: {},
      webhookAuthType: 'headers',
      values: {
        name: 'mail',
        type: 'email',
      },
    })).toEqual({
      name: 'mail',
      type: 'email',
      description: undefined,
      config: {},
      retry_config: {
        max_retries: 3,
        retry_intervals: [1, 5, 15],
      },
      recipients: [],
      is_default: false,
      rate_limit_per_minute: undefined,
    });
  });

  it('blocks risky config edits when required email config is missing', () => {
    const touched = new Set(['smtp_host']);
    const form: MockForm = {
      isFieldTouched: jest.fn((field: string) => touched.has(field)),
      setFieldsValue: jest.fn(),
      setFieldValue: jest.fn(),
    };

    expect(() => assertSafeChannelConfigUpdate({
      channelType: 'email',
      form: form as FormInstance,
      originalConfig: {},
      values: {
        name: 'mail',
        type: 'email',
        smtp_host: 'smtp.example.com',
      },
      webhookAuthType: 'headers',
    })).toThrow('邮件渠道配置不完整');
  });
});
