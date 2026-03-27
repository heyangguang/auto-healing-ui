import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { getCommandBlacklist } from '@/services/auto-healing/commandBlacklist';
import ExemptionRuleSelector from './ExemptionRuleSelector';

jest.mock('@/services/auto-healing/commandBlacklist', () => ({
  getCommandBlacklist: jest.fn(),
}));

describe('ExemptionRuleSelector', () => {
  const messageErrorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    messageErrorSpy.mockRestore();
  });

  it('clears stale rules when a reset load fails', async () => {
    (getCommandBlacklist as jest.Mock)
      .mockResolvedValueOnce({
        data: [{
          id: 'rule-1',
          name: '危险命令',
          pattern: 'rm -rf',
          match_type: 'contains',
          severity: 'critical',
          category: 'filesystem',
          is_active: true,
          is_system: false,
          description: '禁止删除系统目录',
          created_at: '2026-03-27T00:00:00Z',
          updated_at: '2026-03-27T00:00:00Z',
        }],
        total: 1,
      })
      .mockRejectedValueOnce(new Error('boom'));

    render(
      <ExemptionRuleSelector
        open
        onCancel={jest.fn()}
        onSelect={jest.fn()}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(await screen.findByText('危险命令')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('搜索规则名称'), {
      target: { value: 'new keyword' },
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(screen.queryByText('危险命令')).toBeNull();
    expect(screen.getByText('暂无匹配规则')).toBeTruthy();
    expect(messageErrorSpy).toHaveBeenCalledWith('加载黑名单规则失败，请稍后重试');
  });
});
