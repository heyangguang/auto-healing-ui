import { act, renderHook } from '@testing-library/react';
import { message } from 'antd';
import { createSiteMessage } from '@/services/auto-healing/platform/messages';
import usePlatformMessageForm from './usePlatformMessageForm';

jest.mock('@/services/auto-healing/platform/messages', () => ({
  createSiteMessage: jest.fn(),
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
  },
}));

describe('usePlatformMessageForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('includes selected tenant ids in the submit payload', async () => {
    const form = {
      resetFields: jest.fn(),
    };

    const { result } = renderHook(() => usePlatformMessageForm(form as never));

    act(() => {
      result.current.setSendTarget('selected');
    });

    await act(async () => {
      await result.current.handleSubmit({
        category: 'notice',
        title: '系统维护',
        content: '<p>今晚维护</p>',
        target_tenant_ids: ['tenant-1', 'tenant-2'],
      });
    });

    expect(createSiteMessage).toHaveBeenCalledWith({
      category: 'notice',
      title: '系统维护',
      content: '<p>今晚维护</p>',
      target_tenant_ids: ['tenant-1', 'tenant-2'],
    });
    expect(message.success).toHaveBeenCalledWith('消息发送成功');
    expect(form.resetFields).toHaveBeenCalled();
  });

  it('rethrows request failures and keeps the current form state', async () => {
    const form = {
      resetFields: jest.fn(),
    };
    (createSiteMessage as jest.Mock).mockRejectedValueOnce(new Error('发送失败'));

    const { result } = renderHook(() => usePlatformMessageForm(form as never));
    let thrown: unknown;

    await act(async () => {
      try {
        await result.current.handleSubmit({
          category: 'notice',
          title: '系统维护',
          content: '<p>今晚维护</p>',
        });
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('发送失败');
    expect(message.success).not.toHaveBeenCalled();
    expect(form.resetFields).not.toHaveBeenCalled();
  });
});
